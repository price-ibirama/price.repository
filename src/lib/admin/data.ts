import { createServiceClient } from "@/lib/supabase/service";

export type DashboardMetrics = {
    estabelecimentos: number;
    produtos: number;
    ofertasAtivas: number;
    ofertasVencidas: number;
    lotesPendentes: number;
    buscasSemResultado: number;
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
    validadeFim: string | null;
    status: string;
};

export type ProductSummary = {
    id: string;
    nome: string;
    categoria: string | null;
    unidade: string | null;
    sinonimos: number;
};

export type IngestionBatchSummary = {
    id: string;
    status: string;
    estabelecimento: string | null;
    fonte: string | null;
    totalItens: number;
    criadoEm: string;
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

export async function getDashboardMetrics(): Promise<DashboardMetrics> {
    const [
        estabelecimentos,
        produtos,
        ofertasAtivas,
        ofertasVencidas,
        lotesPendentes,
        buscasSemResultado,
    ] = await Promise.all([
        getCount("estabelecimentos"),
        getCount("produtos"),
        getCount("ofertas", (query) => query.or(`validade_fim.is.null,validade_fim.gte.${new Date().toISOString().slice(0, 10)}`).eq("status", "publicada")),
        getCount("ofertas", (query) => query.lt("validade_fim", new Date().toISOString().slice(0, 10))),
        getCount("lotes_ingestao", (query) => query.in("status", ["rascunho", "processando", "pendente_revisao"])),
        getSearchGaps().then((items) => items.length),
    ]);

    return {
        estabelecimentos,
        produtos,
        ofertasAtivas,
        ofertasVencidas,
        lotesPendentes,
        buscasSemResultado,
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

export async function getOfferSummaries(limit = 30): Promise<OfferSummary[]> {
    const supabase = createServiceClient();
    const { data, error } = await supabase
        .from("ofertas")
        .select("id, preco, validade_fim, status, produtos(nome), estabelecimentos(nome)")
        .order("validade_fim", { ascending: false, nullsFirst: false })
        .limit(limit);

    if (error || !Array.isArray(data)) {
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        produto: item.produtos?.nome ?? "Produto sem nome",
        estabelecimento: item.estabelecimentos?.nome ?? "Estabelecimento sem nome",
        preco: Number(item.preco ?? 0),
        validadeFim: item.validade_fim ?? null,
        status: item.status ?? "publicada",
    }));
}

export async function getProductSummaries(limit = 40): Promise<ProductSummary[]> {
    const supabase = createServiceClient();
    const { data, error } = await supabase
        .from("produtos")
        .select("id, nome, unidade, categorias(nome), sinonimos(id)")
        .order("nome")
        .limit(limit);

    if (error || !Array.isArray(data)) {
        return [];
    }

    return data.map((item: any) => ({
        id: item.id,
        nome: item.nome,
        unidade: item.unidade,
        categoria: item.categorias?.nome ?? null,
        sinonimos: Array.isArray(item.sinonimos) ? item.sinonimos.length : 0,
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
