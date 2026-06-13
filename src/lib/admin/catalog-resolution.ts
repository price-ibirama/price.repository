import type { ExtractedFlyerOffer } from "./flyer-extraction.ts";
import { rankProductCandidates, type ExtractedOfferProduct, type ProductCandidate } from "../../services/product-matching.ts";

const MIN_PRODUCT_MATCH_CONFIDENCE = 0.62;
const CATALOG_UNITS = new Set(["kg", "g", "L", "ml", "un", "cx", "pct", "dz"]);
const UNIT_ALIASES = new Map<string, string>([
  ["quilo", "kg"],
  ["kilo", "kg"],
  ["litro", "L"],
  ["litros", "L"],
  ["unidade", "un"],
  ["unidades", "un"],
  ["und", "un"],
  ["un.", "un"],
  ["pacote", "pct"],
  ["pacotes", "pct"],
  ["caixa", "cx"],
  ["caixas", "cx"],
  ["duzia", "dz"],
  ["dúzia", "dz"],
]);

type SupabaseLike = {
  from: (table: string) => any;
};

type CatalogResolutionInput = {
  supabase: SupabaseLike;
  item: ExtractedFlyerOffer;
  candidates: ProductCandidate[];
};

export type CatalogResolutionMode = "matched" | "created" | "skipped" | "alias_conflict";

export type CatalogResolutionResult = {
  mode: CatalogResolutionMode;
  productId: string | null;
  productName: string | null;
  productUnit: string | null;
  aliasesCreated: string[];
  aliasesIgnored: string[];
  aliasConflicts: Array<{ termo: string; id_produto: string }>;
  rankedCandidates: Array<{ id: string; nome: string; confidence: number; reasons: string[] }>;
  productCandidate: ProductCandidate | null;
  error: string | null;
};

function normalizeLabel(value?: string | null) {
  return value?.replace(/\s+/g, " ").trim() || null;
}

function normalizeAliasKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function addAlias(aliases: string[], seen: Set<string>, value?: string | null) {
  const alias = normalizeLabel(value);

  if (!alias || alias.length < 3 || /^\d+$/.test(alias)) {
    return;
  }

  const key = normalizeAliasKey(alias);

  if (!key || seen.has(key)) {
    return;
  }

  seen.add(key);
  aliases.push(alias);
}

function compactProductName(value: string) {
  return normalizeLabel(value.replace(/[|/]+/g, " ")) ?? value;
}

export function normalizeCatalogUnit(value?: string | null) {
  const unit = normalizeLabel(value);

  if (!unit) {
    return null;
  }

  if (CATALOG_UNITS.has(unit)) {
    return unit;
  }

  const normalizedUnit = normalizeAliasKey(unit);
  if (normalizedUnit === "l") {
    return "L";
  }

  if (CATALOG_UNITS.has(normalizedUnit)) {
    return normalizedUnit;
  }

  return UNIT_ALIASES.get(normalizedUnit) ?? null;
}

export function buildProductAliasTerms(item: ExtractedFlyerOffer, productName = item.nomeOriginal) {
  const aliases: string[] = [];
  const seen = new Set<string>();
  const name = normalizeLabel(productName);

  if (!name) {
    return aliases;
  }

  addAlias(aliases, seen, name);

  const compactName = compactProductName(name);

  if (compactName !== name) {
    addAlias(aliases, seen, compactName);
  }

  const brand = normalizeLabel(item.marca);

  if (brand && !normalizeAliasKey(name).includes(normalizeAliasKey(brand))) {
    addAlias(aliases, seen, `${name} ${brand}`);
  }

  const unit = normalizeCatalogUnit(item.unidade);

  if (item.quantidade && unit && !normalizeAliasKey(name).includes(`${item.quantidade}${unit}`.toLowerCase())) {
    addAlias(aliases, seen, `${name} ${Number(item.quantidade)}${unit}`);
  }

  return aliases.slice(0, 6);
}

async function findProductByName(supabase: SupabaseLike, productName: string) {
  const { data, error } = await supabase.from("produtos").select("id, nome, unidade").eq("nome", productName).maybeSingle();

  if (error) {
    return null;
  }

  return data as { id: string; nome: string; unidade: string | null } | null;
}

async function createProductIfNeeded(supabase: SupabaseLike, productName: string, unit: string | null) {
  const existingProduct = await findProductByName(supabase, productName);

  if (existingProduct) {
    return {
      product: existingProduct,
      mode: "matched" as const,
    };
  }

  const { data, error } = await supabase
    .from("produtos")
    .insert({
      nome: productName,
      unidade: unit,
    })
    .select("id, nome, unidade")
    .single();

  if (error || !data) {
    const productAfterConflict = await findProductByName(supabase, productName);

    if (productAfterConflict) {
      return {
        product: productAfterConflict,
        mode: "matched" as const,
      };
    }

    throw new Error(error?.message ?? "Não foi possível criar o produto.");
  }

  return {
    product: data as { id: string; nome: string; unidade: string | null },
    mode: "created" as const,
  };
}

async function syncSynonyms(supabase: SupabaseLike, productId: string, aliases: string[]) {
  if (aliases.length === 0) {
    return {
      aliasesCreated: [] as string[],
      aliasesIgnored: [] as string[],
      aliasConflicts: [] as Array<{ termo: string; id_produto: string }>,
    };
  }

  const { data: existingSynonyms } = await supabase.from("sinonimos").select("termo, id_produto").in("termo", aliases);
  const existingRows = Array.isArray(existingSynonyms)
    ? (existingSynonyms as Array<{ termo: string; id_produto: string }>)
    : [];
  const existingTerms = new Map(existingRows.map((row) => [row.termo, row.id_produto]));
  const aliasConflicts = existingRows
    .filter((row) => row.id_produto !== productId)
    .map((row) => ({ termo: row.termo, id_produto: row.id_produto }));
  const aliasesIgnored = existingRows.filter((row) => row.id_produto === productId).map((row) => row.termo);
  const aliasesToCreate = aliases.filter((alias) => !existingTerms.has(alias));

  if (aliasesToCreate.length === 0) {
    return {
      aliasesCreated: [] as string[],
      aliasesIgnored,
      aliasConflicts,
    };
  }

  const { data: createdSynonyms } = await supabase
    .from("sinonimos")
    .insert(aliasesToCreate.map((termo) => ({ id_produto: productId, termo })))
    .select("termo");

  return {
    aliasesCreated: Array.isArray(createdSynonyms) ? createdSynonyms.map((row: { termo: string }) => row.termo) : aliasesToCreate,
    aliasesIgnored,
    aliasConflicts,
  };
}

export async function resolveCatalogForIngestionItem({
  supabase,
  item,
  candidates,
}: CatalogResolutionInput): Promise<CatalogResolutionResult> {
  const productName = normalizeLabel(item.nomeOriginal);

  if (!productName) {
    return {
      mode: "skipped",
      productId: null,
      productName: null,
      productUnit: null,
      aliasesCreated: [],
      aliasesIgnored: [],
      aliasConflicts: [],
      rankedCandidates: [],
      productCandidate: null,
      error: "Produto sem nome extraído.",
    };
  }

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
  const rankedCandidates = ranked.map((candidate) => ({
    id: candidate.candidate.id,
    nome: candidate.candidate.nome,
    confidence: candidate.confidence,
    reasons: candidate.reasons,
  }));

  try {
    const matchedProduct = best && best.confidence >= MIN_PRODUCT_MATCH_CONFIDENCE ? best.candidate : null;
    const productResolution = matchedProduct
      ? {
          product: {
            id: matchedProduct.id,
            nome: matchedProduct.nome,
            unidade: matchedProduct.unidade ?? null,
          },
          mode: "matched" as const,
        }
      : await createProductIfNeeded(supabase, productName, normalizeCatalogUnit(item.unidade));
    const aliases = buildProductAliasTerms(item, productResolution.product.nome);
    const synonymResult = await syncSynonyms(supabase, productResolution.product.id, aliases);
    const mode = synonymResult.aliasConflicts.length > 0 ? "alias_conflict" : productResolution.mode;
    const productCandidate: ProductCandidate = {
      id: productResolution.product.id,
      nome: productResolution.product.nome,
      unidade: productResolution.product.unidade,
      aliases: [...synonymResult.aliasesCreated, ...synonymResult.aliasesIgnored],
    };

    return {
      mode,
      productId: productResolution.product.id,
      productName: productResolution.product.nome,
      productUnit: productResolution.product.unidade,
      aliasesCreated: synonymResult.aliasesCreated,
      aliasesIgnored: synonymResult.aliasesIgnored,
      aliasConflicts: synonymResult.aliasConflicts,
      rankedCandidates,
      productCandidate,
      error: null,
    };
  } catch (error) {
    return {
      mode: "skipped",
      productId: null,
      productName,
      productUnit: normalizeCatalogUnit(item.unidade),
      aliasesCreated: [],
      aliasesIgnored: [],
      aliasConflicts: [],
      rankedCandidates,
      productCandidate: null,
      error: error instanceof Error ? error.message : "Não foi possível resolver o produto.",
    };
  }
}
