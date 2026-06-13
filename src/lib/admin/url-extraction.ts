import z4 from "zod/v4";

import type { ExtractedFlyerOffer } from "./flyer-extraction.ts";

const GROQ_TEXT_MODEL = "llama-3.3-70b-versatile";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_URL_RESPONSE_BYTES = 512 * 1024;
const MAX_EXTRACTED_TEXT_CHARS = 24_000;
const MIN_READABLE_TEXT_CHARS = 20;
const URL_FETCH_TIMEOUT_MS = 15_000;
const SUPPORTED_CONTENT_TYPES = ["text/html", "text/plain", "application/xhtml+xml"];

export class UrlIngestionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UrlIngestionError";
  }
}

type SourceForUrlIngestion = {
  id: string;
  nome: string;
  url: string | null;
  ativo: boolean;
  id_estabelecimento: string | null;
};

type ResolveUrlIngestionContextInput = {
  source: SourceForUrlIngestion;
  fallbackEstablishmentId: string | null;
};

type FetchSourceUrlTextOptions = {
  fetchImpl?: typeof fetch;
};

type ExtractUrlOffersInput = {
  url: string;
  text: string;
  sourceName?: string | null;
  establishmentName?: string | null;
};

export type UrlExtractionResult = {
  provider: "groq";
  model: string;
  rawText: string;
  offers: ExtractedFlyerOffer[];
  warnings: string[];
  usage: {
    promptTokens: number | null;
    completionTokens: number | null;
    totalTokens: number | null;
  };
};

type GroqChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function normalizeBlank(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (typeof value === "string") {
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  return value;
}

function parseNullableNumber(value: unknown) {
  const normalized = normalizeBlank(value);

  if (normalized === null) {
    return null;
  }

  if (typeof normalized === "number") {
    return Number.isFinite(normalized) ? normalized : null;
  }

  if (typeof normalized !== "string") {
    return normalized;
  }

  const parsed = Number(
    normalized
      .replace(/[^\d,.-]/g, "")
      .replace(/\.(?=\d{3}(?:\D|$))/g, "")
      .replace(",", "."),
  );
  return Number.isFinite(parsed) ? parsed : null;
}

function parseNullableDate(value: unknown) {
  const normalized = normalizeBlank(value);

  if (normalized === null || typeof normalized !== "string") {
    return normalized;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    return normalized;
  }

  const match = normalized.match(/^(\d{2})\/(\d{2})(?:\/(\d{4}))?$/);

  if (!match) {
    return null;
  }

  const [, day, month, year] = match;
  const fullYear = year ?? String(new Date().getFullYear());
  return `${fullYear}-${month}-${day}`;
}

const nullableStringSchema = z4.preprocess(normalizeBlank, z4.string().trim().min(1).nullable());
const nullableNumberSchema = z4.preprocess(parseNullableNumber, z4.number().finite().nonnegative().nullable());
const nullableDateSchema = z4.preprocess(parseNullableDate, z4.iso.date().nullable());

const urlExtractionSchema = z4.object({
  offers: z4
    .array(
      z4.object({
        nomeOriginal: z4.string().trim().min(2),
        marca: nullableStringSchema.default(null),
        quantidade: nullableNumberSchema.default(null),
        unidade: nullableStringSchema.default(null),
        embalagem: nullableStringSchema.default(null),
        categoriaSugerida: nullableStringSchema.default(null),
        preco: nullableNumberSchema.default(null),
        validadeInicio: nullableDateSchema.default(null),
        validadeFim: nullableDateSchema.default(null),
        observacao: nullableStringSchema.default(null),
        confidence: z4.coerce.number().min(0).max(1).default(0.5),
      }),
    )
    .default([]),
  warnings: z4.array(z4.string().trim().min(1)).default([]),
});

function decodeHtmlEntities(value: string) {
  const namedEntities = new Map([
    ["amp", "&"],
    ["lt", "<"],
    ["gt", ">"],
    ["quot", "\""],
    ["apos", "'"],
    ["nbsp", " "],
    ["rsquo", "'"],
    ["lsquo", "'"],
    ["ldquo", "\""],
    ["rdquo", "\""],
  ]);

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, token: string) => {
    if (token.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(token.slice(2), 16));
    }

    if (token.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(token.slice(1), 10));
    }

    return namedEntities.get(token.toLowerCase()) ?? entity;
  });
}

export function extractReadableTextFromHtml(html: string) {
  return decodeHtmlEntities(
    html
      .replace(/<!--[\s\S]*?-->/g, " ")
      .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
      .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript\b[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<svg\b[\s\S]*?<\/svg>/gi, " ")
      .replace(/<\/?(?:br|p|div|section|article|li|tr|td|th|h[1-6]|header|footer|main|aside)\b[^>]*>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  )
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeUrl(rawUrl: string) {
  let url: URL;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new UrlIngestionError("A URL cadastrada na fonte é inválida.");
  }

  if (!["http:", "https:"].includes(url.protocol)) {
    throw new UrlIngestionError("A URL da fonte deve usar HTTP ou HTTPS.");
  }

  return url.toString();
}

export function resolveUrlIngestionContext({ source, fallbackEstablishmentId }: ResolveUrlIngestionContextInput) {
  if (!source.ativo) {
    throw new UrlIngestionError("A fonte selecionada está inativa.");
  }

  if (!source.url?.trim()) {
    throw new UrlIngestionError("A fonte selecionada não possui URL cadastrada.");
  }

  const establishmentId = source.id_estabelecimento ?? fallbackEstablishmentId;

  if (!establishmentId) {
    throw new UrlIngestionError("Selecione um estabelecimento para processar esta fonte.");
  }

  return {
    sourceId: source.id,
    sourceName: source.nome,
    establishmentId,
    url: normalizeUrl(source.url),
  };
}

export async function fetchSourceUrlText(url: string, options: FetchSourceUrlTextOptions = {}) {
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(url, {
    headers: {
      "User-Agent": "PriceRepositoryBot/1.0 (+admin-ingestion)",
      Accept: "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.1",
    },
    signal: AbortSignal.timeout(URL_FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new UrlIngestionError(`A fonte retornou HTTP ${response.status}.`);
  }

  const contentLength = Number(response.headers.get("content-length") ?? 0);

  if (contentLength > MAX_URL_RESPONSE_BYTES) {
    throw new UrlIngestionError("A página da fonte é muito grande para processamento automático.");
  }

  const contentType = response.headers.get("content-type") ?? "";
  const normalizedContentType = contentType.toLowerCase();

  if (normalizedContentType && !SUPPORTED_CONTENT_TYPES.some((type) => normalizedContentType.includes(type))) {
    throw new UrlIngestionError("A URL da fonte precisa retornar HTML ou texto público.");
  }

  const bytes = new Uint8Array(await response.arrayBuffer());

  if (bytes.byteLength > MAX_URL_RESPONSE_BYTES) {
    throw new UrlIngestionError("A página da fonte é muito grande para processamento automático.");
  }

  const bodyText = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const readableText = normalizedContentType.includes("text/plain")
    ? bodyText.replace(/\s+/g, " ").trim()
    : extractReadableTextFromHtml(bodyText);

  if (readableText.length < MIN_READABLE_TEXT_CHARS) {
    throw new UrlIngestionError("Não encontrei texto suficiente nessa URL para extrair ofertas.");
  }

  return {
    url,
    contentType,
    text: readableText.slice(0, MAX_EXTRACTED_TEXT_CHARS),
    originalTextLength: readableText.length,
  };
}

function stripJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function buildUrlPrompt(input: ExtractUrlOffersInput) {
  const context = [
    input.establishmentName ? `Estabelecimento esperado: ${input.establishmentName}` : null,
    input.sourceName ? `Fonte: ${input.sourceName}` : null,
    `URL: ${input.url}`,
  ].filter((item): item is string => Boolean(item));

  return [
    context.join("\n"),
    "Extraia ofertas de supermercado do texto abaixo, quando existirem.",
    "Retorne apenas JSON válido no formato:",
    JSON.stringify({
      offers: [
        {
          nomeOriginal: "nome do produto",
          marca: "marca ou null",
          quantidade: "número ou null",
          unidade: "kg, g, L, ml, un, pct, cx, dz ou null",
          embalagem: "pacote, caixa, garrafa, lata, bandeja ou null",
          categoriaSugerida: "categoria provável ou null",
          preco: "número decimal ou null",
          validadeInicio: "YYYY-MM-DD ou null",
          validadeFim: "YYYY-MM-DD ou null",
          observacao: "condição da oferta ou null",
          confidence: "número entre 0 e 1",
        },
      ],
      warnings: ["alertas sobre baixa confiança ou campos ausentes"],
    }),
    "Não invente produtos, preços, datas, marcas ou unidades. Use null quando o campo não aparecer.",
    "Texto da página:",
    input.text,
  ].join("\n\n");
}

function parseGroqJson(rawText: string) {
  try {
    return urlExtractionSchema.parse(JSON.parse(stripJsonFence(rawText)));
  } catch {
    throw new UrlIngestionError("A Groq retornou um JSON inválido para extração da URL.");
  }
}

export async function extractUrlOffersWithGroq(input: ExtractUrlOffersInput): Promise<UrlExtractionResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const model = process.env.GROQ_OFFER_TEXT_MODEL?.trim() || process.env.GROQ_OFFER_MODEL?.trim() || GROQ_TEXT_MODEL;

  if (!apiKey) {
    throw new UrlIngestionError("Configure GROQ_API_KEY no ambiente para processar URLs com IA.");
  }

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "system",
          content:
            "Você é um extrator de ofertas de supermercado. Leia somente o texto fornecido e responda exclusivamente em JSON válido.",
        },
        {
          role: "user",
          content: buildUrlPrompt(input),
        },
      ],
      temperature: 0,
      max_completion_tokens: 4096,
      response_format: { type: "json_object" },
    }),
  });
  const responseText = await response.text();
  let payload: (GroqChatCompletionResponse & { error?: { message?: string } }) | null = null;

  try {
    payload = responseText ? (JSON.parse(responseText) as GroqChatCompletionResponse & { error?: { message?: string } }) : null;
  } catch {
    throw new UrlIngestionError("A Groq retornou uma resposta inválida.");
  }

  if (!response.ok) {
    throw new UrlIngestionError(payload?.error?.message ?? `A Groq retornou HTTP ${response.status}.`);
  }

  const rawText = payload?.choices?.[0]?.message?.content?.trim();

  if (!rawText) {
    throw new UrlIngestionError("A Groq não retornou conteúdo para a URL.");
  }

  const parsed = parseGroqJson(rawText);
  const usage = payload?.usage;

  if (parsed.offers.length === 0) {
    throw new UrlIngestionError("Não encontrei ofertas nessa URL.");
  }

  return {
    provider: "groq",
    model,
    rawText,
    offers: parsed.offers,
    warnings: parsed.warnings,
    usage: {
      promptTokens: usage?.prompt_tokens ?? null,
      completionTokens: usage?.completion_tokens ?? null,
      totalTokens: usage?.total_tokens ?? null,
    },
  };
}
