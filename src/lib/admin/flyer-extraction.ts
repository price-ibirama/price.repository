import z4 from "zod/v4";

const GROQ_VISION_MODEL = "meta-llama/llama-4-scout-17b-16e-instruct";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"]);

type ExtractFlyerOffersInput = {
  file: Uint8Array;
  mimeType: string;
  filename: string;
  establishmentName?: string | null;
  sourceName?: string | null;
};

export type ExtractedFlyerOffer = {
  nomeOriginal: string;
  marca: string | null;
  quantidade: number | null;
  unidade: string | null;
  embalagem: string | null;
  categoriaSugerida: string | null;
  preco: number | null;
  validadeInicio: string | null;
  validadeFim: string | null;
  observacao: string | null;
  confidence: number;
};

export type FlyerExtractionResult = {
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

export class FlyerExtractionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FlyerExtractionError";
  }
}

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

const flyerExtractionSchema = z4.object({
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
    .min(1),
  warnings: z4.array(z4.string().trim().min(1)).default([]),
});

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

function stripJsonFence(value: string) {
  return value
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function buildPrompt(input: ExtractFlyerOffersInput) {
  const context = [
    input.establishmentName ? `Estabelecimento esperado: ${input.establishmentName}` : null,
    input.sourceName ? `Fonte: ${input.sourceName}` : null,
    `Arquivo: ${input.filename}`,
  ].filter((item): item is string => Boolean(item));

  return [
    context.join("\n"),
    "Extraia as ofertas visíveis deste panfleto digital.",
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
      warnings: ["alertas sobre baixa legibilidade ou campos ausentes"],
    }),
    "Não invente produtos, preços, datas, marcas ou unidades. Use null quando não estiver visível.",
  ].join("\n\n");
}

function parseGroqJson(rawText: string) {
  try {
    return flyerExtractionSchema.parse(JSON.parse(stripJsonFence(rawText)));
  } catch (error) {
    throw new FlyerExtractionError("A Groq retornou um JSON inválido para extração de ofertas.");
  }
}

export async function extractFlyerOffersWithGroq(input: ExtractFlyerOffersInput): Promise<FlyerExtractionResult> {
  const apiKey = process.env.GROQ_API_KEY?.trim();
  const model = process.env.GROQ_OFFER_MODEL?.trim() || GROQ_VISION_MODEL;

  if (!apiKey) {
    throw new FlyerExtractionError("Configure GROQ_API_KEY no ambiente para processar panfletos com IA.");
  }

  if (!SUPPORTED_IMAGE_TYPES.has(input.mimeType.toLowerCase())) {
    throw new FlyerExtractionError("Envie uma imagem JPG, PNG ou WEBP.");
  }

  if (input.file.byteLength > MAX_IMAGE_BYTES) {
    throw new FlyerExtractionError("A imagem deve ter até 3MB para envio via Groq. Comprima o panfleto e tente novamente.");
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
            "Você é um extrator de ofertas de supermercado. Leia somente o que estiver visível na imagem e responda exclusivamente em JSON válido.",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: buildPrompt(input),
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${input.mimeType};base64,${Buffer.from(input.file).toString("base64")}`,
              },
            },
          ],
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
    throw new FlyerExtractionError("A Groq retornou uma resposta inválida.");
  }

  if (!response.ok) {
    throw new FlyerExtractionError(payload?.error?.message ?? `A Groq retornou HTTP ${response.status}.`);
  }

  const rawText = payload?.choices?.[0]?.message?.content?.trim();

  if (!rawText) {
    throw new FlyerExtractionError("A Groq não retornou conteúdo para o panfleto.");
  }

  const parsed = parseGroqJson(rawText);
  const usage = payload?.usage;

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
