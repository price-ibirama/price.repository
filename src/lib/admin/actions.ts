"use server";

import { createHash } from "node:crypto";

import { evaluateOfferQuality, hasBlockingOfferIssue } from "@/lib/admin/offer-quality";
import { extractFlyerOffersWithGroq, FlyerExtractionError } from "@/lib/admin/flyer-extraction";
import { parseManualIngestionText, normalizeProductName } from "@/lib/admin/ingestion-parser";
import { type AdminRole, requireAdmin } from "@/lib/admin/auth";
import { createServiceClient } from "@/lib/supabase/service";
import { rankProductCandidates, type ExtractedOfferProduct, type ProductCandidate } from "@/services/product-matching";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import z4 from "zod/v4";

type ActionPath =
  | "/admin"
  | "/admin/buscas"
  | "/admin/estabelecimentos"
  | "/admin/ingestao"
  | "/admin/ofertas"
  | "/admin/produtos"
  | "/admin/qualidade";

const writeRoles = new Set<AdminRole>(["owner", "admin", "editor"]);
const publishRoles = new Set<AdminRole>(["owner", "admin"]);
const emptySelectValues = new Set(["", "__none__"]);

function normalizeOptionalFormValue(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();
  return emptySelectValues.has(trimmedValue) ? null : trimmedValue;
}

const optionalUuid = z4.preprocess(normalizeOptionalFormValue, z4.string().uuid().nullable());
const optionalText = z4.preprocess(normalizeOptionalFormValue, z4.string().nullable());
const requiredText = z4.string().trim().min(1);
const optionalDate = z4.preprocess(
  normalizeOptionalFormValue,
  z4.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
);

function toNumber(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return Number.NaN;
  }

  return Number(value.replace(/\./g, "").replace(",", "."));
}

function redirectWithMessage(path: ActionPath, kind: "success" | "error", message: string): never {
  redirect(`${path}?${kind}=${encodeURIComponent(message)}`);
}

function hashFingerprint(parts: unknown[]) {
  return createHash("sha256").update(JSON.stringify(parts)).digest("hex").slice(0, 32);
}

function revalidateAdmin(paths: ActionPath[]) {
  for (const path of paths) {
    revalidatePath(path);
  }
}

async function requireRole(roles: Set<AdminRole>, path: ActionPath) {
  const admin = await requireAdmin();

  if (!roles.has(admin.role)) {
    redirectWithMessage(path, "error", "Seu usuário não tem permissão para executar esta ação.");
  }

  return admin;
}

async function auditAdminAction(input: {
  adminUserId: string;
  acao: string;
  entidade: string;
  entidadeId?: string | null;
  antes?: unknown;
  depois?: unknown;
}) {
  const supabase = createServiceClient();
  await supabase.from("auditoria_admin").insert({
    admin_user_id: input.adminUserId,
    acao: input.acao,
    entidade: input.entidade,
    entidade_id: input.entidadeId ?? null,
    antes: input.antes ?? null,
    depois: input.depois ?? null,
  });
}

function parseResult<T>(result: z4.ZodSafeParseResult<T>, path: ActionPath) {
  if (!result.success) {
    redirectWithMessage(path, "error", "Revise os campos obrigatórios antes de salvar.");
  }

  return result.data;
}

const establishmentSchema = z4.object({
  nome: requiredText,
  id_cidade: z4.string().uuid(),
  id_bairro: optionalUuid,
  logradouro: optionalText,
  tipo: z4.enum(["supermercado", "farmacia", "posto_combustivel"]),
  ativo: z4.boolean(),
});

export async function createEstablishmentAction(formData: FormData) {
  const admin = await requireRole(writeRoles, "/admin/estabelecimentos");
  const parsed = parseResult(
    establishmentSchema.safeParse({
      nome: formData.get("nome"),
      id_cidade: formData.get("id_cidade"),
      id_bairro: formData.get("id_bairro"),
      logradouro: formData.get("logradouro"),
      tipo: formData.get("tipo") || "supermercado",
      ativo: formData.get("ativo") === "on",
    }),
    "/admin/estabelecimentos",
  );
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("estabelecimentos").insert(parsed).select("id").single();

  if (error) {
    redirectWithMessage("/admin/estabelecimentos", "error", error.message);
  }

  await auditAdminAction({
    adminUserId: admin.userId,
    acao: "create",
    entidade: "estabelecimentos",
    entidadeId: data.id,
    depois: parsed,
  });
  revalidateAdmin(["/admin", "/admin/estabelecimentos"]);
  redirectWithMessage("/admin/estabelecimentos", "success", "Estabelecimento cadastrado.");
}

const categorySchema = z4.object({
  nome: requiredText,
  slug: z4.string().trim().min(1),
  ordem: z4.number(),
});

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function createCategoryAction(formData: FormData) {
  const admin = await requireRole(writeRoles, "/admin/produtos");
  const nome = String(formData.get("nome") ?? "").trim();
  const parsed = parseResult(
    categorySchema.safeParse({
      nome,
      slug: String(formData.get("slug") || slugify(nome)),
      ordem: Number(formData.get("ordem") || 0),
    }),
    "/admin/produtos",
  );
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("categorias").insert(parsed).select("id").single();

  if (error) {
    redirectWithMessage("/admin/produtos", "error", error.message);
  }

  await auditAdminAction({
    adminUserId: admin.userId,
    acao: "create",
    entidade: "categorias",
    entidadeId: data.id,
    depois: parsed,
  });
  revalidateAdmin(["/admin", "/admin/produtos"]);
  redirectWithMessage("/admin/produtos", "success", "Categoria cadastrada.");
}

const productSchema = z4.object({
  nome: requiredText,
  id_categoria: optionalUuid,
  unidade: z4.preprocess(normalizeOptionalFormValue, z4.enum(["kg", "g", "L", "ml", "un", "cx", "pct", "dz"]).nullable()),
});

export async function createProductAction(formData: FormData) {
  const admin = await requireRole(writeRoles, "/admin/produtos");
  const parsed = parseResult(
    productSchema.safeParse({
      nome: formData.get("nome"),
      id_categoria: formData.get("id_categoria"),
      unidade: formData.get("unidade") || null,
    }),
    "/admin/produtos",
  );
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("produtos").insert(parsed).select("id").single();

  if (error) {
    redirectWithMessage("/admin/produtos", "error", error.message);
  }

  await auditAdminAction({
    adminUserId: admin.userId,
    acao: "create",
    entidade: "produtos",
    entidadeId: data.id,
    depois: parsed,
  });
  revalidateAdmin(["/admin", "/admin/produtos"]);
  redirectWithMessage("/admin/produtos", "success", "Produto cadastrado.");
}

const synonymSchema = z4.object({
  id_produto: z4.string().uuid(),
  termo: requiredText,
});

export async function createSynonymAction(formData: FormData) {
  const admin = await requireRole(writeRoles, "/admin/produtos");
  const parsed = parseResult(
    synonymSchema.safeParse({
      id_produto: formData.get("id_produto"),
      termo: formData.get("termo"),
    }),
    "/admin/produtos",
  );
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("sinonimos").insert(parsed).select("id").single();

  if (error) {
    redirectWithMessage("/admin/produtos", "error", error.message);
  }

  await auditAdminAction({
    adminUserId: admin.userId,
    acao: "create",
    entidade: "sinonimos",
    entidadeId: data.id,
    depois: parsed,
  });
  revalidateAdmin(["/admin", "/admin/produtos", "/admin/buscas"]);
  redirectWithMessage("/admin/produtos", "success", "Alias cadastrado.");
}

const searchTermSchema = z4.object({
  termo: requiredText,
  tipo_alvo: z4.enum(["produto", "categoria", "marca", "estabelecimento"]),
  id_produto: optionalUuid,
  id_categoria: optionalUuid,
  id_estabelecimento: optionalUuid,
  marca: optionalText,
  peso: z4.number().min(0).max(1),
});

export async function createSearchTermAction(formData: FormData) {
  const admin = await requireRole(writeRoles, "/admin/buscas");
  const parsed = parseResult(
    searchTermSchema.safeParse({
      termo: formData.get("termo"),
      tipo_alvo: formData.get("tipo_alvo") || "produto",
      id_produto: formData.get("id_produto"),
      id_categoria: formData.get("id_categoria"),
      id_estabelecimento: formData.get("id_estabelecimento"),
      marca: formData.get("marca"),
      peso: Number(formData.get("peso") || 0.7),
    }),
    "/admin/buscas",
  );

  const targetCount = [
    parsed.tipo_alvo === "produto" && parsed.id_produto,
    parsed.tipo_alvo === "categoria" && parsed.id_categoria,
    parsed.tipo_alvo === "estabelecimento" && parsed.id_estabelecimento,
    parsed.tipo_alvo === "marca" && parsed.marca,
  ].filter(Boolean).length;

  if (targetCount !== 1) {
    redirectWithMessage("/admin/buscas", "error", "Escolha exatamente um alvo compatível com o tipo do termo.");
  }

  const supabase = createServiceClient();
  const payload = {
    ...parsed,
    origem: "manual",
    aprovado_por: admin.userId,
    ativo: true,
  };
  const { data, error } = await supabase.from("termos_busca").insert(payload).select("id").single();

  if (error) {
    redirectWithMessage("/admin/buscas", "error", error.message);
  }

  await auditAdminAction({
    adminUserId: admin.userId,
    acao: "create",
    entidade: "termos_busca",
    entidadeId: data.id,
    depois: payload,
  });
  revalidateAdmin(["/admin", "/admin/buscas"]);
  redirectWithMessage("/admin/buscas", "success", "Termo de busca cadastrado.");
}

const offerSchema = z4.object({
  id_estabelecimento: z4.string().uuid(),
  id_produto: z4.string().uuid(),
  preco: z4.number(),
  validade_inicio: optionalDate,
  validade_fim: optionalDate,
  observacao: optionalText,
  status: z4.enum(["rascunho", "publicada"]),
});

export async function createOfferAction(formData: FormData) {
  const status = formData.get("status") === "publicada" ? "publicada" : "rascunho";
  const admin = await requireRole(status === "publicada" ? publishRoles : writeRoles, "/admin/ofertas");
  const parsed = parseResult(
    offerSchema.safeParse({
      id_estabelecimento: formData.get("id_estabelecimento"),
      id_produto: formData.get("id_produto"),
      preco: toNumber(formData.get("preco")),
      validade_inicio: formData.get("validade_inicio"),
      validade_fim: formData.get("validade_fim"),
      observacao: formData.get("observacao"),
      status,
    }),
    "/admin/ofertas",
  );
  const issues = evaluateOfferQuality({
    status: parsed.status,
    preco: parsed.preco,
    validadeInicio: parsed.validade_inicio,
    validadeFim: parsed.validade_fim,
  });

  if (hasBlockingOfferIssue(issues)) {
    redirectWithMessage("/admin/ofertas", "error", `Não foi possível publicar: ${issues.map((item) => item.label).join(", ")}.`);
  }

  const supabase = createServiceClient();
  const duplicateQuery = supabase
    .from("ofertas")
    .select("id")
    .eq("id_estabelecimento", parsed.id_estabelecimento)
    .eq("id_produto", parsed.id_produto)
    .eq("preco", parsed.preco)
    .eq("status", "publicada")
    .limit(1);
  const { data: duplicates } = parsed.validade_fim
    ? await duplicateQuery.eq("validade_fim", parsed.validade_fim)
    : await duplicateQuery.is("validade_fim", null);

  if (parsed.status === "publicada" && duplicates?.length) {
    redirectWithMessage("/admin/ofertas", "error", "Já existe uma oferta publicada igual para este produto.");
  }

  const fingerprint = `manual:${hashFingerprint([
    parsed.id_estabelecimento,
    parsed.id_produto,
    parsed.preco,
    parsed.validade_inicio,
    parsed.validade_fim,
  ])}`;
  const payload = {
    ...parsed,
    fingerprint_origem: fingerprint,
    criado_por: admin.userId,
    atualizado_por: admin.userId,
    publicado_em: parsed.status === "publicada" ? new Date().toISOString() : null,
  };
  const { data, error } = await supabase.from("ofertas").insert(payload).select("id").single();

  if (error) {
    redirectWithMessage("/admin/ofertas", "error", error.message);
  }

  await auditAdminAction({
    adminUserId: admin.userId,
    acao: "create",
    entidade: "ofertas",
    entidadeId: data.id,
    depois: payload,
  });
  revalidateAdmin(["/admin", "/admin/ofertas", "/admin/qualidade"]);
  redirectWithMessage("/admin/ofertas", "success", "Oferta cadastrada.");
}

export async function updateOfferStatusAction(formData: FormData) {
  const offerId = z4.string().uuid().parse(formData.get("offer_id"));
  const status = z4.enum(["rascunho", "publicada", "arquivada"]).parse(formData.get("status"));
  const admin = await requireRole(status === "publicada" ? publishRoles : writeRoles, "/admin/ofertas");
  const supabase = createServiceClient();
  const { data: offer, error: offerError } = await supabase.from("ofertas").select("*").eq("id", offerId).single();

  if (offerError || !offer) {
    redirectWithMessage("/admin/ofertas", "error", "Oferta não encontrada.");
  }

  const issues = evaluateOfferQuality(
    {
      status,
      preco: Number(offer.preco),
      validadeInicio: offer.validade_inicio,
      validadeFim: offer.validade_fim,
      idLoteIngestao: offer.id_lote_ingestao,
      idItemIngestao: offer.id_item_ingestao,
      fingerprintOrigem: offer.fingerprint_origem,
    },
    1,
  );

  if (status === "publicada" && hasBlockingOfferIssue(issues)) {
    redirectWithMessage("/admin/ofertas", "error", `Não foi possível publicar: ${issues.map((item) => item.label).join(", ")}.`);
  }

  const update = {
    status,
    atualizado_por: admin.userId,
    atualizado_em: new Date().toISOString(),
    publicado_em: status === "publicada" ? (offer.publicado_em ?? new Date().toISOString()) : offer.publicado_em,
  };
  const { error } = await supabase.from("ofertas").update(update).eq("id", offerId);

  if (error) {
    redirectWithMessage("/admin/ofertas", "error", error.message);
  }

  await auditAdminAction({
    adminUserId: admin.userId,
    acao: "update_status",
    entidade: "ofertas",
    entidadeId: offerId,
    antes: { status: offer.status },
    depois: update,
  });
  revalidateAdmin(["/admin", "/admin/ofertas", "/admin/qualidade"]);
  redirectWithMessage(status === "arquivada" ? "/admin/qualidade" : "/admin/ofertas", "success", "Status da oferta atualizado.");
}

const sourceSchema = z4.object({
  nome: requiredText,
  id_estabelecimento: optionalUuid,
  tipo: z4.enum(["site", "rede_social", "panfleto", "pdf", "imagem", "texto", "outro"]),
  url: optionalText,
  ativo: z4.boolean(),
});

export async function createSourceAction(formData: FormData) {
  const admin = await requireRole(writeRoles, "/admin/ingestao");
  const parsed = parseResult(
    sourceSchema.safeParse({
      nome: formData.get("nome"),
      id_estabelecimento: formData.get("id_estabelecimento"),
      tipo: formData.get("tipo") || "texto",
      url: formData.get("url"),
      ativo: formData.get("ativo") === "on",
    }),
    "/admin/ingestao",
  );
  const supabase = createServiceClient();
  const payload = {
    ...parsed,
    config: { origem: "admin" },
  };
  const { data, error } = await supabase.from("fontes_dados").insert(payload).select("id").single();

  if (error) {
    redirectWithMessage("/admin/ingestao", "error", error.message);
  }

  await auditAdminAction({
    adminUserId: admin.userId,
    acao: "create",
    entidade: "fontes_dados",
    entidadeId: data.id,
    depois: payload,
  });
  revalidateAdmin(["/admin/ingestao"]);
  redirectWithMessage("/admin/ingestao", "success", "Fonte cadastrada.");
}

async function getProductCandidates() {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("produtos")
    .select("id, nome, unidade, categorias(nome), sinonimos(termo)")
    .order("nome");

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((item: any): ProductCandidate => ({
    id: item.id,
    nome: item.nome,
    unidade: item.unidade,
    categoria: item.categorias?.nome ?? null,
    aliases: Array.isArray(item.sinonimos) ? item.sinonimos.map((synonym: any) => String(synonym.termo)) : [],
  }));
}

const ingestionBatchSchema = z4.object({
  id_estabelecimento: z4.string().uuid(),
  id_fonte: optionalUuid,
  conteudo_original: z4.string().trim().min(3),
});

const flyerIngestionBatchSchema = z4.object({
  id_estabelecimento: z4.string().uuid(),
  id_fonte: optionalUuid,
});

export async function createManualIngestionBatchAction(formData: FormData) {
  const admin = await requireRole(writeRoles, "/admin/ingestao");
  const parsed = parseResult(
    ingestionBatchSchema.safeParse({
      id_estabelecimento: formData.get("id_estabelecimento"),
      id_fonte: formData.get("id_fonte"),
      conteudo_original: formData.get("conteudo_original"),
    }),
    "/admin/ingestao",
  );
  const parsedItems = parseManualIngestionText(parsed.conteudo_original);

  if (parsedItems.length === 0) {
    redirectWithMessage("/admin/ingestao", "error", "Nenhum item válido encontrado no texto informado.");
  }

  const supabase = createServiceClient();
  const { data: batch, error: batchError } = await supabase
    .from("lotes_ingestao")
    .insert({
      ...parsed,
      status: "pendente_revisao",
      total_itens: parsedItems.length,
      criado_por: admin.userId,
      raw_payload: { origem: "admin_manual", total_linhas: parsedItems.length },
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    redirectWithMessage("/admin/ingestao", "error", batchError?.message ?? "Não foi possível criar o lote.");
  }

  const candidates = await getProductCandidates();
  const items = parsedItems.map((item, index) => {
    const input: ExtractedOfferProduct = {
      nomeOriginal: item.nomeOriginal,
      marca: item.marca,
      unidade: item.unidade,
    };
    const ranked = rankProductCandidates(input, candidates).slice(0, 5);
    const best = ranked[0];

    return {
      id_lote: batch.id,
      id_produto: best && best.confidence >= 0.62 ? best.candidate.id : null,
      nome_original: item.nomeOriginal,
      nome_normalizado: normalizeProductName(item.nomeOriginal),
      marca: item.marca,
      unidade: item.unidade,
      preco: item.preco,
      validade_inicio: item.validadeInicio,
      validade_fim: item.validadeFim,
      observacao: item.observacao,
      status: "pendente",
      confidence: best?.confidence ?? null,
      candidatos: ranked.map((candidate) => ({
        id: candidate.candidate.id,
        nome: candidate.candidate.nome,
        confidence: candidate.confidence,
        reasons: candidate.reasons,
      })),
      raw_payload: { linha: index + 1, origem: "admin_manual" },
      fingerprint_origem: `ingest:${hashFingerprint([
        parsed.id_estabelecimento,
        parsed.id_fonte,
        item.nomeOriginal,
        item.preco,
        item.validadeFim,
      ])}`,
    };
  });
  const { error: itemsError } = await supabase.from("itens_ingestao").insert(items);

  if (itemsError) {
    redirectWithMessage("/admin/ingestao", "error", itemsError.message);
  }

  await auditAdminAction({
    adminUserId: admin.userId,
    acao: "create_manual_batch",
    entidade: "lotes_ingestao",
    entidadeId: batch.id,
    depois: { total_itens: parsedItems.length },
  });
  revalidateAdmin(["/admin", "/admin/ingestao"]);
  redirectWithMessage("/admin/ingestao", "success", "Lote criado e itens enviados para revisão.");
}

export async function createFlyerIngestionBatchAction(formData: FormData) {
  const admin = await requireRole(writeRoles, "/admin/ingestao");
  const parsed = parseResult(
    flyerIngestionBatchSchema.safeParse({
      id_estabelecimento: formData.get("id_estabelecimento"),
      id_fonte: formData.get("id_fonte"),
    }),
    "/admin/ingestao",
  );
  const flyerFile = formData.get("panfleto");

  if (!(flyerFile instanceof File) || flyerFile.size === 0) {
    redirectWithMessage("/admin/ingestao", "error", "Envie uma imagem de panfleto para processar.");
  }

  const supabase = createServiceClient();
  const [{ data: establishment }, { data: source }] = await Promise.all([
    supabase.from("estabelecimentos").select("nome").eq("id", parsed.id_estabelecimento).single(),
    parsed.id_fonte
      ? supabase.from("fontes_dados").select("nome").eq("id", parsed.id_fonte).single()
      : Promise.resolve({ data: null }),
  ]);
  let extraction;

  try {
    extraction = await extractFlyerOffersWithGroq({
      file: new Uint8Array(await flyerFile.arrayBuffer()),
      mimeType: flyerFile.type,
      filename: flyerFile.name,
      establishmentName: establishment?.nome ?? null,
      sourceName: source?.nome ?? null,
    });
  } catch (error) {
    const message =
      error instanceof FlyerExtractionError ? error.message : "Não foi possível processar o panfleto com a Groq.";
    redirectWithMessage("/admin/ingestao", "error", message);
  }

  const { data: batch, error: batchError } = await supabase
    .from("lotes_ingestao")
    .insert({
      id_estabelecimento: parsed.id_estabelecimento,
      id_fonte: parsed.id_fonte,
      status: "pendente_revisao",
      arquivo_origem: flyerFile.name,
      conteudo_original: extraction.rawText,
      total_itens: extraction.offers.length,
      criado_por: admin.userId,
      raw_payload: {
        origem: "groq_panfleto",
        arquivo: {
          nome: flyerFile.name,
          tipo: flyerFile.type,
          tamanho: flyerFile.size,
        },
        provider: extraction.provider,
        model: extraction.model,
        usage: extraction.usage,
        warnings: extraction.warnings,
      },
    })
    .select("id")
    .single();

  if (batchError || !batch) {
    redirectWithMessage("/admin/ingestao", "error", batchError?.message ?? "Não foi possível criar o lote do panfleto.");
  }

  const candidates = await getProductCandidates();
  const items = extraction.offers.map((item, index) => {
    const input: ExtractedOfferProduct = {
      nomeOriginal: item.nomeOriginal,
      marca: item.marca,
      quantidade: item.quantidade,
      unidade: item.unidade,
      embalagem: item.embalagem,
      categoria: item.categoriaSugerida,
    };
    const ranked = rankProductCandidates(input, candidates).slice(0, 5);
    const best = ranked[0];

    return {
      id_lote: batch.id,
      id_produto: best && best.confidence >= 0.62 ? best.candidate.id : null,
      nome_original: item.nomeOriginal,
      nome_normalizado: normalizeProductName(item.nomeOriginal),
      marca: item.marca,
      quantidade: item.quantidade,
      unidade: item.unidade,
      embalagem: item.embalagem,
      categoria_sugerida: item.categoriaSugerida,
      preco: item.preco,
      validade_inicio: item.validadeInicio,
      validade_fim: item.validadeFim,
      observacao: item.observacao,
      status: "pendente",
      confidence: best?.confidence ?? item.confidence,
      candidatos: ranked.map((candidate) => ({
        id: candidate.candidate.id,
        nome: candidate.candidate.nome,
        confidence: candidate.confidence,
        reasons: candidate.reasons,
      })),
      raw_payload: {
        linha: index + 1,
        origem: "groq_panfleto",
        extraction_confidence: item.confidence,
        extracted_offer: item,
      },
      fingerprint_origem: `groq:${hashFingerprint([
        parsed.id_estabelecimento,
        parsed.id_fonte,
        flyerFile.name,
        item.nomeOriginal,
        item.preco,
        item.validadeFim,
      ])}`,
    };
  });
  const { error: itemsError } = await supabase.from("itens_ingestao").insert(items);

  if (itemsError) {
    await supabase.from("lotes_ingestao").update({ status: "erro" }).eq("id", batch.id);
    redirectWithMessage("/admin/ingestao", "error", itemsError.message);
  }

  await auditAdminAction({
    adminUserId: admin.userId,
    acao: "create_groq_flyer_batch",
    entidade: "lotes_ingestao",
    entidadeId: batch.id,
    depois: {
      total_itens: extraction.offers.length,
      provider: extraction.provider,
      model: extraction.model,
      arquivo: flyerFile.name,
    },
  });
  revalidateAdmin(["/admin", "/admin/ingestao"]);
  redirectWithMessage("/admin/ingestao", "success", "Panfleto processado e itens enviados para revisão.");
}

async function finishBatchIfReviewed(batchId: string, adminUserId: string) {
  const supabase = createServiceClient();
  const { count } = await supabase
    .from("itens_ingestao")
    .select("*", { count: "exact", head: true })
    .eq("id_lote", batchId)
    .in("status", ["pendente", "aprovado"]);

  if ((count ?? 0) === 0) {
    await supabase
      .from("lotes_ingestao")
      .update({
        status: "publicado",
        publicado_em: new Date().toISOString(),
        publicado_por: adminUserId,
      })
      .eq("id", batchId);
  }
}

export async function publishIngestionItemAction(formData: FormData) {
  const admin = await requireRole(publishRoles, "/admin/ingestao");
  const itemId = z4.string().uuid().parse(formData.get("item_id"));
  const productMode = String(formData.get("product_mode") ?? "");
  const productId = productMode === "__create__" ? null : z4.string().uuid().parse(productMode);
  const supabase = createServiceClient();
  const { data: item, error: itemError } = await supabase
    .from("itens_ingestao")
    .select("*, lotes_ingestao(id, id_estabelecimento)")
    .eq("id", itemId)
    .single();

  if (itemError || !item) {
    redirectWithMessage("/admin/ingestao", "error", "Item de ingestão não encontrado.");
  }

  const batch = Array.isArray((item as any).lotes_ingestao) ? (item as any).lotes_ingestao[0] : (item as any).lotes_ingestao;
  const establishmentId = batch?.id_estabelecimento;

  if (!establishmentId) {
    redirectWithMessage("/admin/ingestao", "error", "O lote precisa estar vinculado a um estabelecimento.");
  }

  if (!item.preco || Number(item.preco) <= 0) {
    redirectWithMessage("/admin/ingestao", "error", "Informe um preço válido antes de publicar.");
  }

  let resolvedProductId = productId;

  if (!resolvedProductId) {
    const { data: createdProduct, error: productError } = await supabase
      .from("produtos")
      .insert({
        nome: item.nome_original,
        unidade: item.unidade,
      })
      .select("id")
      .single();

    if (productError || !createdProduct) {
      redirectWithMessage("/admin/ingestao", "error", productError?.message ?? "Não foi possível criar o produto.");
    }

    resolvedProductId = createdProduct.id;
  }

  const fingerprint = item.fingerprint_origem ?? `ingest:${hashFingerprint([item.id, resolvedProductId, item.preco])}`;
  const offerPayload = {
    id_estabelecimento: establishmentId,
    id_produto: resolvedProductId,
    preco: Number(item.preco),
    validade_inicio: item.validade_inicio,
    validade_fim: item.validade_fim,
    observacao: item.observacao,
    status: "publicada",
    id_lote_ingestao: item.id_lote,
    id_item_ingestao: item.id,
    fingerprint_origem: fingerprint,
    criado_por: admin.userId,
    atualizado_por: admin.userId,
    publicado_em: new Date().toISOString(),
  };
  const { data: existingOffer } = await supabase.from("ofertas").select("id").eq("fingerprint_origem", fingerprint).maybeSingle();
  const offerResult = existingOffer
    ? await supabase.from("ofertas").update(offerPayload).eq("id", existingOffer.id).select("id").single()
    : await supabase.from("ofertas").insert(offerPayload).select("id").single();

  if (offerResult.error || !offerResult.data) {
    redirectWithMessage("/admin/ingestao", "error", offerResult.error?.message ?? "Não foi possível publicar a oferta.");
  }

  const { error: itemUpdateError } = await supabase
    .from("itens_ingestao")
    .update({
      id_produto: resolvedProductId,
      status: "publicado",
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", item.id);

  if (itemUpdateError) {
    redirectWithMessage("/admin/ingestao", "error", itemUpdateError.message);
  }

  await finishBatchIfReviewed(item.id_lote, admin.userId);
  await auditAdminAction({
    adminUserId: admin.userId,
    acao: existingOffer ? "update_from_ingestion" : "publish_from_ingestion",
    entidade: "ofertas",
    entidadeId: offerResult.data.id,
    depois: offerPayload,
  });
  revalidateAdmin(["/admin", "/admin/ingestao", "/admin/ofertas", "/admin/qualidade"]);
  redirectWithMessage("/admin/ingestao", "success", "Item publicado como oferta.");
}

export async function rejectIngestionItemAction(formData: FormData) {
  const admin = await requireRole(writeRoles, "/admin/ingestao");
  const itemId = z4.string().uuid().parse(formData.get("item_id"));
  const reason = String(formData.get("reason") || "Rejeitado manualmente").trim();
  const supabase = createServiceClient();
  const { data: item } = await supabase.from("itens_ingestao").select("id_lote, status").eq("id", itemId).single();
  const { error } = await supabase
    .from("itens_ingestao")
    .update({
      status: "rejeitado",
      erro: reason,
      atualizado_em: new Date().toISOString(),
    })
    .eq("id", itemId);

  if (error) {
    redirectWithMessage("/admin/ingestao", "error", error.message);
  }

  if (item?.id_lote) {
    await finishBatchIfReviewed(item.id_lote, admin.userId);
  }

  await auditAdminAction({
    adminUserId: admin.userId,
    acao: "reject",
    entidade: "itens_ingestao",
    entidadeId: itemId,
    antes: { status: item?.status },
    depois: { status: "rejeitado", erro: reason },
  });
  revalidateAdmin(["/admin", "/admin/ingestao"]);
  redirectWithMessage("/admin/ingestao", "success", "Item rejeitado.");
}
