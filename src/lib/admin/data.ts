import { evaluateOfferQuality, type OfferQualityIssue } from "@/lib/admin/offer-quality";
import { createServiceClient } from "@/lib/supabase/service";

export type DashboardMetrics = {
  estabelecimentos: number;
  produtos: number;
  ofertasAtivas: number;
  ofertasVencidas: number;
  ofertasInvalidas: number;
  ofertasSemValidade: number;
  lotesPendentes: number;
  itensBaixaConfianca: number;
  buscasSemResultado: number;
  taxaSemResultado: number;
};

export type SearchGap = {
  termo: string;
  buscas: number;
  semResultado: number;
};

export type OfferSummary = {
  id: string;
  produto: string;
  estabelecimento: string;
  preco: number;
  validadeInicio: string | null;
  validadeFim: string | null;
  status: string;
  origem: string;
  issues: OfferQualityIssue[];
};

export type ProductSummary = {
  id: string;
  nome: string;
  categoria: string | null;
  unidade: string | null;
  sinonimos: number;
  aliases: string[];
};

export type EstablishmentSummary = {
  id: string;
  nome: string;
  cidade: string;
  bairro: string | null;
  logradouro: string | null;
  tipo: string;
  ativo: boolean;
  ofertasAtivas: number;
};

export type SourceSummary = {
  id: string;
  nome: string;
  tipo: string;
  url: string | null;
  ativo: boolean;
  estabelecimento: string | null;
};

export type IngestionBatchSummary = {
  id: string;
  status: string;
  estabelecimento: string | null;
  fonte: string | null;
  totalItens: number;
  criadoEm: string;
};

export type IngestionItemSummary = {
  id: string;
  loteId: string;
  loteStatus: string;
  estabelecimento: string | null;
  fonte: string | null;
  produtoId: string | null;
  produto: string | null;
  nomeOriginal: string;
  preco: number | null;
  validadeFim: string | null;
  unidade: string | null;
  status: string;
  confidence: number | null;
  erro: string | null;
  candidatos: Array<{
    id: string;
    nome: string;
    confidence: number;
    reasons: string[];
  }>;
};

export type QualityIssueSummary = {
  offerId: string;
  produto: string;
  estabelecimento: string;
  preco: number;
  validadeFim: string | null;
  status: string;
  issues: OfferQualityIssue[];
};

export type IngestionMetric = {
  status: string;
  total: number;
};

export type CatalogOptions = {
  cidades: Array<{ id: string; label: string }>;
  bairros: Array<{ id: string; label: string; cidadeId: string }>;
  categorias: Array<{ id: string; label: string }>;
  estabelecimentos: Array<{ id: string; label: string }>;
  produtos: Array<{ id: string; label: string; unidade: string | null; categoria: string | null }>;
  fontes: Array<{ id: string; label: string; estabelecimentoId: string | null }>;
};

async function getCount(table: string, query?: (builder: any) => any) {
  const supabase = createServiceClient();
  const builder = supabase.from(table).select("*", { count: "exact", head: true });
  const { count, error } = await (query ? query(builder) : builder);

  if (error) {
    return 0;
  }

  return count ?? 0;
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function duplicateKey(item: any) {
  return [
    item.id_estabelecimento,
    item.id_produto,
    Number(item.preco ?? 0).toFixed(2),
    item.validade_inicio ?? "",
    item.validade_fim ?? "",
  ].join("|");
}

function buildDuplicateCounts(items: any[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    if (item.status !== "publicada") {
      continue;
    }

    const key = duplicateKey(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return counts;
}

function mapOffer(item: any, duplicateCounts: Map<string, number>): OfferSummary {
  const issues = evaluateOfferQuality(
    {
      status: item.status ?? "publicada",
      preco: Number(item.preco ?? 0),
      validadeInicio: item.validade_inicio ?? null,
      validadeFim: item.validade_fim ?? null,
      idLoteIngestao: item.id_lote_ingestao ?? null,
      idItemIngestao: item.id_item_ingestao ?? null,
      fingerprintOrigem: item.fingerprint_origem ?? null,
    },
    duplicateCounts.get(duplicateKey(item)) ?? 1,
  );

  return {
    id: item.id,
    produto: item.produtos?.nome ?? "Produto sem nome",
    estabelecimento: item.estabelecimentos?.nome ?? "Estabelecimento sem nome",
    preco: Number(item.preco ?? 0),
    validadeInicio: item.validade_inicio ?? null,
    validadeFim: item.validade_fim ?? null,
    status: item.status ?? "publicada",
    origem: item.id_lote_ingestao || item.id_item_ingestao ? "ingestão" : item.fingerprint_origem ? "manual" : "sem origem",
    issues,
  };
}

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
  const [qualityIssues, ingestionMetrics, responseMetrics] = await Promise.all([
    getQualityIssueSummaries(200),
    getIngestionMetrics(),
    getResponseMetrics(),
  ]);
  const [
    estabelecimentos,
    produtos,
    ofertasAtivas,
    ofertasVencidas,
    ofertasSemValidade,
    lotesPendentes,
    itensBaixaConfianca,
  ] = await Promise.all([
    getCount("estabelecimentos"),
    getCount("produtos"),
    getCount("ofertas", (query) =>
      query.or(`validade_fim.is.null,validade_fim.gte.${todayIsoDate()}`).eq("status", "publicada"),
    ),
    getCount("ofertas", (query) => query.lt("validade_fim", todayIsoDate()).eq("status", "publicada")),
    getCount("ofertas", (query) => query.is("validade_fim", null).eq("status", "publicada")),
    getCount("lotes_ingestao", (query) => query.in("status", ["rascunho", "processando", "pendente_revisao"])),
    getCount("itens_ingestao", (query) =>
      query.lt("confidence", 0.65).in("status", ["pendente", "aprovado"]),
    ),
  ]);

  return {
    estabelecimentos,
    produtos,
    ofertasAtivas,
    ofertasVencidas,
    ofertasInvalidas: qualityIssues.filter((item) => item.issues.some((issue) => issue.severity === "erro")).length,
    ofertasSemValidade,
    lotesPendentes,
    itensBaixaConfianca,
    buscasSemResultado: responseMetrics.semResultado,
    taxaSemResultado: responseMetrics.taxaSemResultado,
  };
}

export async function getSearchGaps(limit = 15): Promise<SearchGap[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.rpc("buscar_termos_sem_resultado", { p_limite: limit });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => ({
    termo: String(item.termo ?? ""),
    buscas: Number(item.buscas ?? 0),
    semResultado: Number(item.sem_resultado ?? 0),
  }));
}

export async function getResponseMetrics() {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("log_respostas").select("total_resultados_busca").limit(500);

  if (error || !Array.isArray(data) || data.length === 0) {
    return { total: 0, semResultado: 0, taxaSemResultado: 0 };
  }

  const semResultado = data.filter((item) => Number(item.total_resultados_busca ?? 0) === 0).length;

  return {
    total: data.length,
    semResultado,
    taxaSemResultado: Math.round((semResultado / data.length) * 100),
  };
}

export async function getOfferSummaries(limit = 50): Promise<OfferSummary[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ofertas")
    .select(
      "id, id_estabelecimento, id_produto, preco, validade_inicio, validade_fim, status, id_lote_ingestao, id_item_ingestao, fingerprint_origem, produtos(nome), estabelecimentos(nome)",
    )
    .order("criado_em", { ascending: false })
    .limit(limit);

  if (error || !Array.isArray(data)) {
    return [];
  }

  const duplicateCounts = buildDuplicateCounts(data);
  return data.map((item: any) => mapOffer(item, duplicateCounts));
}

export async function getQualityIssueSummaries(limit = 100): Promise<QualityIssueSummary[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("ofertas")
    .select(
      "id, id_estabelecimento, id_produto, preco, validade_inicio, validade_fim, status, id_lote_ingestao, id_item_ingestao, fingerprint_origem, produtos(nome), estabelecimentos(nome)",
    )
    .order("criado_em", { ascending: false })
    .limit(limit);

  if (error || !Array.isArray(data)) {
    return [];
  }

  const duplicateCounts = buildDuplicateCounts(data);

  return data
    .map((item: any) => mapOffer(item, duplicateCounts))
    .filter((item) => item.issues.length > 0)
    .map((item) => ({
      offerId: item.id,
      produto: item.produto,
      estabelecimento: item.estabelecimento,
      preco: item.preco,
      validadeFim: item.validadeFim,
      status: item.status,
      issues: item.issues,
    }));
}

export async function getProductSummaries(limit = 80): Promise<ProductSummary[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("produtos")
    .select("id, nome, unidade, categorias(nome), sinonimos(termo)")
    .order("nome")
    .limit(limit);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => {
    const aliases = Array.isArray(item.sinonimos) ? item.sinonimos.map((synonym: any) => String(synonym.termo)) : [];

    return {
      id: item.id,
      nome: item.nome,
      unidade: item.unidade,
      categoria: item.categorias?.nome ?? null,
      sinonimos: aliases.length,
      aliases,
    };
  });
}

export async function getEstablishmentSummaries(): Promise<EstablishmentSummary[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("estabelecimentos")
    .select("id, nome, logradouro, tipo, ativo, cidades(nome, estado), bairros(nome), ofertas(id, status, validade_fim)")
    .order("nome");

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    nome: item.nome,
    cidade: item.cidades ? `${item.cidades.nome}/${item.cidades.estado}` : "Sem cidade",
    bairro: item.bairros?.nome ?? null,
    logradouro: item.logradouro ?? null,
    tipo: item.tipo,
    ativo: Boolean(item.ativo),
    ofertasAtivas: Array.isArray(item.ofertas)
      ? item.ofertas.filter(
          (offer: any) => offer.status === "publicada" && (!offer.validade_fim || offer.validade_fim >= todayIsoDate()),
        ).length
      : 0,
  }));
}

export async function getSourceSummaries(): Promise<SourceSummary[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("fontes_dados")
    .select("id, nome, tipo, url, ativo, estabelecimentos(nome)")
    .order("nome");

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    nome: item.nome,
    tipo: item.tipo,
    url: item.url ?? null,
    ativo: Boolean(item.ativo),
    estabelecimento: item.estabelecimentos?.nome ?? null,
  }));
}

export async function getIngestionBatches(limit = 30): Promise<IngestionBatchSummary[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("lotes_ingestao")
    .select("id, status, total_itens, criado_em, estabelecimentos(nome), fontes_dados(nome)")
    .order("criado_em", { ascending: false })
    .limit(limit);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    status: item.status,
    totalItens: Number(item.total_itens ?? 0),
    criadoEm: item.criado_em,
    estabelecimento: item.estabelecimentos?.nome ?? null,
    fonte: item.fontes_dados?.nome ?? null,
  }));
}

export async function getIngestionItems(limit = 50): Promise<IngestionItemSummary[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("itens_ingestao")
    .select(
      "id, id_lote, id_produto, nome_original, preco, validade_fim, unidade, status, confidence, erro, candidatos, produtos(nome), lotes_ingestao(status, estabelecimentos(nome), fontes_dados(nome))",
    )
    .order("criado_em", { ascending: false })
    .limit(limit);

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((item: any) => {
    const batch = Array.isArray(item.lotes_ingestao) ? item.lotes_ingestao[0] : item.lotes_ingestao;

    return {
      id: item.id,
      loteId: item.id_lote,
      loteStatus: batch?.status ?? "sem lote",
      estabelecimento: batch?.estabelecimentos?.nome ?? null,
      fonte: batch?.fontes_dados?.nome ?? null,
      produtoId: item.id_produto ?? null,
      produto: item.produtos?.nome ?? null,
      nomeOriginal: item.nome_original,
      preco: item.preco === null ? null : Number(item.preco),
      validadeFim: item.validade_fim ?? null,
      unidade: item.unidade ?? null,
      status: item.status,
      confidence: item.confidence === null ? null : Number(item.confidence),
      erro: item.erro ?? null,
      candidatos: Array.isArray(item.candidatos) ? item.candidatos : [],
    };
  });
}

export async function getIngestionMetrics(): Promise<IngestionMetric[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("itens_ingestao").select("status").limit(1000);

  if (error || !Array.isArray(data)) {
    return [];
  }

  const grouped = data.reduce((accumulator, item: any) => {
    const status = String(item.status ?? "sem_status");
    accumulator.set(status, (accumulator.get(status) ?? 0) + 1);
    return accumulator;
  }, new Map<string, number>());

  return [...grouped.entries()].map(([status, total]) => ({ status, total }));
}

export async function getCatalogOptions(): Promise<CatalogOptions> {
  const supabase = createServiceClient();
  const [cities, neighborhoods, categories, establishments, products, sources] = await Promise.all([
    supabase.from("cidades").select("id, nome, estado").order("nome"),
    supabase.from("bairros").select("id, nome, id_cidade").order("nome"),
    supabase.from("categorias").select("id, nome").order("ordem"),
    supabase.from("estabelecimentos").select("id, nome").eq("ativo", true).order("nome"),
    supabase.from("produtos").select("id, nome, unidade, categorias(nome)").order("nome"),
    supabase.from("fontes_dados").select("id, nome, id_estabelecimento").eq("ativo", true).order("nome"),
  ]);

  return {
    cidades: Array.isArray(cities.data)
      ? cities.data.map((item: any) => ({ id: item.id, label: `${item.nome}/${item.estado}` }))
      : [],
    bairros: Array.isArray(neighborhoods.data)
      ? neighborhoods.data.map((item: any) => ({ id: item.id, label: item.nome, cidadeId: item.id_cidade }))
      : [],
    categorias: Array.isArray(categories.data)
      ? categories.data.map((item: any) => ({ id: item.id, label: item.nome }))
      : [],
    estabelecimentos: Array.isArray(establishments.data)
      ? establishments.data.map((item: any) => ({ id: item.id, label: item.nome }))
      : [],
    produtos: Array.isArray(products.data)
      ? products.data.map((item: any) => ({
          id: item.id,
          label: item.nome,
          unidade: item.unidade ?? null,
          categoria: item.categorias?.nome ?? null,
        }))
      : [],
    fontes: Array.isArray(sources.data)
      ? sources.data.map((item: any) => ({
          id: item.id,
          label: item.nome,
          estabelecimentoId: item.id_estabelecimento ?? null,
        }))
      : [],
  };
}
