import { createClient } from "@supabase/supabase-js";
import { isLocalSupabaseUrl, loadLocalEnv } from "./local-env.mjs";

const DEFAULT_SUPABASE_URL = "http://127.0.0.1:55321";

loadLocalEnv();

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? DEFAULT_SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!isLocalSupabaseUrl(supabaseUrl)) {
  throw new Error(`Refusing to seed a non-local Supabase project: ${supabaseUrl}`);
}

if (!supabaseSecretKey) {
  throw new Error("Missing SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY.");
}

const supabase = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const ids = {
  cidadeIbirama: "3f9d5f77-8e7d-4d2f-9cfe-1a2b3c4d5e6f",
  bairroCentro: "82b4fc85-5f54-4a3b-9a67-7182f15c9b0a",
  bairroAreado: "9067f8a1-3d2e-48b4-8ac9-4d1375f0e921",
  bairroProgresso: "b1c8d4e2-7a5f-4f3c-9f0d-2b8e6c1a4d23",
  bairroPontoChic: "c239d7b6-21f8-4b9e-8a3d-0c7f2e4a5b69",
  bairroBelaVista: "d740f3a8-6b1e-4f2d-9c8a-5e7f1b3c9a24",
  cooper: "f1a2b3c4-d5e6-7f81-9a0b-1c2d3e4f5a6b",
  redeTop: "a2b3c4d5-e6f7-8190-a1b2-3c4d5e6f7a8b",
  solar: "b3c4d5e6-f7a8-9012-b3c4-d5e6f7a8b9c0",
  queijeiro: "c4d5e6f7-a8b9-0123-c4d5-e6f7a8b9c0d1",
  areado: "d5e6f7a8-b9c0-1234-d5e6-f7a8b9c0d1e2",
  oliveira: "e6f7a8b9-c0d1-2345-e6f7-a8b9c0d1e2f3",
  wagner: "f7a8b9c0-d1e2-3456-f7a8-b9c0d1e2f3a4",
  moretti: "a8b9c0d1-e2f3-4567-a8b9-c0d1e2f3a4b5",
  catMercearia: "94e8c5de-97e1-49c8-b51b-5ef181184a01",
  catBebidas: "94e8c5de-97e1-49c8-b51b-5ef181184a02",
  catHortifruti: "94e8c5de-97e1-49c8-b51b-5ef181184a03",
  catCarnes: "94e8c5de-97e1-49c8-b51b-5ef181184a04",
  catLimpeza: "94e8c5de-97e1-49c8-b51b-5ef181184a05",
  catHigiene: "94e8c5de-97e1-49c8-b51b-5ef181184a06",
  catLaticinios: "94e8c5de-97e1-49c8-b51b-5ef181184a07",
  arroz: "0ad50c59-81d0-49c5-94c4-5be13ff46501",
  feijao: "0ad50c59-81d0-49c5-94c4-5be13ff46502",
  leite: "0ad50c59-81d0-49c5-94c4-5be13ff46503",
  banana: "0ad50c59-81d0-49c5-94c4-5be13ff46504",
  cafe: "0ad50c59-81d0-49c5-94c4-5be13ff46505",
  oleo: "0ad50c59-81d0-49c5-94c4-5be13ff46506",
  acucar: "0ad50c59-81d0-49c5-94c4-5be13ff46507",
  sabao: "0ad50c59-81d0-49c5-94c4-5be13ff46508",
  frango: "0ad50c59-81d0-49c5-94c4-5be13ff46509",
  refri: "0ad50c59-81d0-49c5-94c4-5be13ff46510",
  fonteCooper: "1d5fd0a3-6cc9-4915-8a5f-fc34df7e4301",
  fonteRedeTop: "1d5fd0a3-6cc9-4915-8a5f-fc34df7e4302",
  fonteManual: "1d5fd0a3-6cc9-4915-8a5f-fc34df7e4303",
  loteCooper: "3864194e-12c1-478a-9e12-80b3bd114001",
  loteRedeTop: "3864194e-12c1-478a-9e12-80b3bd114002",
  loteProblemas: "3864194e-12c1-478a-9e12-80b3bd114003",
};

async function upsertRows(table, rows, onConflict = "id") {
  if (rows.length === 0) {
    return;
  }

  const { error } = await supabase.from(table).upsert(rows, { onConflict });

  if (error) {
    throw new Error(`Failed to seed ${table}: ${error.message}`);
  }
}

const today = new Date();
const isoDate = (offsetDays) => {
  const date = new Date(today);
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
};

await upsertRows("cidades", [
  { id: ids.cidadeIbirama, nome: "Ibirama", estado: "SC", ativo: true },
]);

await upsertRows("bairros", [
  { id: ids.bairroCentro, id_cidade: ids.cidadeIbirama, nome: "Centro" },
  { id: ids.bairroAreado, id_cidade: ids.cidadeIbirama, nome: "Ribeirão Areado" },
  { id: ids.bairroProgresso, id_cidade: ids.cidadeIbirama, nome: "Progresso" },
  { id: ids.bairroPontoChic, id_cidade: ids.cidadeIbirama, nome: "Ponto Chic" },
  { id: ids.bairroBelaVista, id_cidade: ids.cidadeIbirama, nome: "Bela Vista" },
]);

await upsertRows("estabelecimentos", [
  {
    id: ids.cooper,
    id_cidade: ids.cidadeIbirama,
    id_bairro: ids.bairroCentro,
    nome: "Cooper",
    logradouro: "R. Mirador, 104",
    tipo: "supermercado",
    ativo: true,
  },
  {
    id: ids.redeTop,
    id_cidade: ids.cidadeIbirama,
    id_bairro: ids.bairroCentro,
    nome: "Rede Top",
    logradouro: "R. Marquês do Herval, 136",
    tipo: "supermercado",
    ativo: true,
  },
  {
    id: ids.solar,
    id_cidade: ids.cidadeIbirama,
    id_bairro: ids.bairroCentro,
    nome: "Solar Master Vale",
    logradouro: "R. Duque de Caxias, 03",
    tipo: "supermercado",
    ativo: true,
  },
  {
    id: ids.queijeiro,
    id_cidade: ids.cidadeIbirama,
    id_bairro: ids.bairroCentro,
    nome: "Queijeiro Mercearia",
    logradouro: "R. Marquês do Herval, 2231",
    tipo: "supermercado",
    ativo: true,
  },
  {
    id: ids.areado,
    id_cidade: ids.cidadeIbirama,
    id_bairro: ids.bairroAreado,
    nome: "Mercado Areado",
    logradouro: "Avenida Castelo Branco",
    tipo: "supermercado",
    ativo: true,
  },
  {
    id: ids.oliveira,
    id_cidade: ids.cidadeIbirama,
    id_bairro: ids.bairroProgresso,
    nome: "Mercado Oliveira",
    logradouro: "R. Santa Cruz",
    tipo: "supermercado",
    ativo: true,
  },
  {
    id: ids.wagner,
    id_cidade: ids.cidadeIbirama,
    id_bairro: ids.bairroPontoChic,
    nome: "Wagner Bebidas",
    logradouro: "R. José Wagner, 36",
    tipo: "supermercado",
    ativo: true,
  },
  {
    id: ids.moretti,
    id_cidade: ids.cidadeIbirama,
    id_bairro: ids.bairroBelaVista,
    nome: "Rede Moretti",
    logradouro: "R. Dr. Getúlio Vargas",
    tipo: "supermercado",
    ativo: true,
  },
]);

await upsertRows("categorias", [
  { id: ids.catMercearia, nome: "Mercearia", slug: "mercearia", ordem: 10 },
  { id: ids.catBebidas, nome: "Bebidas", slug: "bebidas", ordem: 20 },
  { id: ids.catHortifruti, nome: "Hortifruti", slug: "hortifruti", ordem: 30 },
  { id: ids.catCarnes, nome: "Carnes", slug: "carnes", ordem: 40 },
  { id: ids.catLimpeza, nome: "Limpeza", slug: "limpeza", ordem: 50 },
  { id: ids.catHigiene, nome: "Higiene", slug: "higiene", ordem: 60 },
  { id: ids.catLaticinios, nome: "Laticínios", slug: "laticinios", ordem: 70 },
]);

await upsertRows("produtos", [
  { id: ids.arroz, id_categoria: ids.catMercearia, nome: "Arroz parboilizado 5kg", unidade: "pct" },
  { id: ids.feijao, id_categoria: ids.catMercearia, nome: "Feijão preto 1kg", unidade: "kg" },
  { id: ids.leite, id_categoria: ids.catLaticinios, nome: "Leite integral 1L", unidade: "L" },
  { id: ids.banana, id_categoria: ids.catHortifruti, nome: "Banana caturra kg", unidade: "kg" },
  { id: ids.cafe, id_categoria: ids.catMercearia, nome: "Café torrado 500g", unidade: "g" },
  { id: ids.oleo, id_categoria: ids.catMercearia, nome: "Óleo de soja 900ml", unidade: "ml" },
  { id: ids.acucar, id_categoria: ids.catMercearia, nome: "Açúcar cristal 5kg", unidade: "pct" },
  { id: ids.sabao, id_categoria: ids.catLimpeza, nome: "Sabão em pó 1,6kg", unidade: "kg" },
  { id: ids.frango, id_categoria: ids.catCarnes, nome: "Frango resfriado kg", unidade: "kg" },
  { id: ids.refri, id_categoria: ids.catBebidas, nome: "Refrigerante cola 2L", unidade: "L" },
]);

await upsertRows("sinonimos", [
  { id: "6c22e48d-f62e-48df-98c8-989f00001001", id_produto: ids.arroz, termo: "arroz" },
  { id: "6c22e48d-f62e-48df-98c8-989f00001002", id_produto: ids.arroz, termo: "arroz 5kg" },
  { id: "6c22e48d-f62e-48df-98c8-989f00001003", id_produto: ids.feijao, termo: "feijão" },
  { id: "6c22e48d-f62e-48df-98c8-989f00001004", id_produto: ids.leite, termo: "leite" },
  { id: "6c22e48d-f62e-48df-98c8-989f00001005", id_produto: ids.banana, termo: "banana" },
  { id: "6c22e48d-f62e-48df-98c8-989f00001006", id_produto: ids.cafe, termo: "café" },
  { id: "6c22e48d-f62e-48df-98c8-989f00001007", id_produto: ids.oleo, termo: "óleo" },
  { id: "6c22e48d-f62e-48df-98c8-989f00001008", id_produto: ids.acucar, termo: "açúcar" },
  { id: "6c22e48d-f62e-48df-98c8-989f00001009", id_produto: ids.sabao, termo: "sabão em pó" },
  { id: "6c22e48d-f62e-48df-98c8-989f00001010", id_produto: ids.frango, termo: "frango" },
  { id: "6c22e48d-f62e-48df-98c8-989f00001011", id_produto: ids.refri, termo: "refrigerante" },
]);

await upsertRows("termos_busca", [
  {
    id: "30a746bc-9775-4cd7-9a4b-999f00002001",
    termo: "rancho",
    tipo_alvo: "categoria",
    id_categoria: ids.catMercearia,
    origem: "manual",
    peso: 0.8,
    ativo: true,
  },
  {
    id: "30a746bc-9775-4cd7-9a4b-999f00002002",
    termo: "bebida",
    tipo_alvo: "categoria",
    id_categoria: ids.catBebidas,
    origem: "manual",
    peso: 0.7,
    ativo: true,
  },
  {
    id: "30a746bc-9775-4cd7-9a4b-999f00002003",
    termo: "cooper",
    tipo_alvo: "estabelecimento",
    id_estabelecimento: ids.cooper,
    origem: "manual",
    peso: 0.7,
    ativo: true,
  },
]);

await upsertRows("fontes_dados", [
  {
    id: ids.fonteCooper,
    id_estabelecimento: ids.cooper,
    nome: "Ofertas Cooper Ibirama",
    tipo: "site",
    url: "https://www.cooper.coop.br/ofertas/ibirama/",
    config: { seletor: "manual", observacao: "Fonte real usada nos testes" },
    ativo: true,
  },
  {
    id: ids.fonteRedeTop,
    id_estabelecimento: ids.redeTop,
    nome: "Rede Top Online",
    tipo: "site",
    url: "https://www.redetoponline.com.br/",
    config: { seletor: "manual", observacao: "Fonte real usada nos testes" },
    ativo: true,
  },
  {
    id: ids.fonteManual,
    id_estabelecimento: null,
    nome: "Panfleto manual",
    tipo: "texto",
    url: null,
    config: { formato: "linha_por_produto" },
    ativo: true,
  },
]);

await upsertRows("lotes_ingestao", [
  {
    id: ids.loteCooper,
    id_estabelecimento: ids.cooper,
    id_fonte: ids.fonteCooper,
    status: "publicado",
    total_itens: 3,
    conteudo_original: "Arroz parboilizado 5kg; 21,90; validade +7 dias",
    raw_payload: { origem: "seed_dev" },
    publicado_em: new Date().toISOString(),
  },
  {
    id: ids.loteRedeTop,
    id_estabelecimento: ids.redeTop,
    id_fonte: ids.fonteRedeTop,
    status: "pendente_revisao",
    total_itens: 3,
    conteudo_original: "Leite integral 1L; 4,59\nCafé torrado 500g; 15,99\nAchocolatado 400g; 8,99",
    raw_payload: { origem: "seed_dev" },
  },
  {
    id: ids.loteProblemas,
    id_estabelecimento: ids.solar,
    id_fonte: ids.fonteManual,
    status: "pendente_revisao",
    total_itens: 3,
    conteudo_original: "Itens usados para testar qualidade e rejeição",
    raw_payload: { origem: "seed_dev" },
  },
]);

await upsertRows("itens_ingestao", [
  {
    id: "2e894248-a1d6-4d87-a09d-999f00003001",
    id_lote: ids.loteCooper,
    id_produto: ids.arroz,
    nome_original: "Arroz parboilizado 5kg",
    nome_normalizado: "arroz parboilizado 5kg",
    preco: 21.9,
    validade_inicio: isoDate(-1),
    validade_fim: isoDate(7),
    status: "publicado",
    confidence: 0.96,
    candidatos: [{ id: ids.arroz, confidence: 0.96, reasons: ["nome semelhante", "unidade igual"] }],
    raw_payload: { origem: "seed_dev" },
    fingerprint_origem: "seed:cooper:arroz:21.90",
  },
  {
    id: "2e894248-a1d6-4d87-a09d-999f00003002",
    id_lote: ids.loteCooper,
    id_produto: ids.banana,
    nome_original: "Banana caturra kg",
    nome_normalizado: "banana caturra kg",
    preco: 4.99,
    validade_inicio: isoDate(-1),
    validade_fim: isoDate(3),
    status: "publicado",
    confidence: 0.9,
    candidatos: [{ id: ids.banana, confidence: 0.9, reasons: ["nome semelhante"] }],
    raw_payload: { origem: "seed_dev" },
    fingerprint_origem: "seed:cooper:banana:4.99",
  },
  {
    id: "2e894248-a1d6-4d87-a09d-999f00003003",
    id_lote: ids.loteRedeTop,
    id_produto: ids.leite,
    nome_original: "Leite integral 1L",
    nome_normalizado: "leite integral 1l",
    preco: 4.59,
    validade_inicio: isoDate(0),
    validade_fim: isoDate(5),
    status: "pendente",
    confidence: 0.89,
    candidatos: [{ id: ids.leite, confidence: 0.89, reasons: ["nome semelhante", "unidade igual"] }],
    raw_payload: { origem: "seed_dev" },
    fingerprint_origem: "seed:redetop:leite:4.59",
  },
  {
    id: "2e894248-a1d6-4d87-a09d-999f00003004",
    id_lote: ids.loteRedeTop,
    id_produto: ids.cafe,
    nome_original: "Café torrado 500g",
    nome_normalizado: "cafe torrado 500g",
    preco: 15.99,
    validade_inicio: isoDate(0),
    validade_fim: isoDate(10),
    status: "aprovado",
    confidence: 0.82,
    candidatos: [{ id: ids.cafe, confidence: 0.82, reasons: ["nome semelhante"] }],
    raw_payload: { origem: "seed_dev" },
    fingerprint_origem: "seed:redetop:cafe:15.99",
  },
  {
    id: "2e894248-a1d6-4d87-a09d-999f00003005",
    id_lote: ids.loteRedeTop,
    id_produto: null,
    nome_original: "Achocolatado premium 400g",
    nome_normalizado: "achocolatado premium 400g",
    preco: 8.99,
    validade_inicio: isoDate(0),
    validade_fim: isoDate(8),
    status: "pendente",
    confidence: 0.28,
    candidatos: [{ id: ids.leite, confidence: 0.28, reasons: ["categoria semelhante"] }],
    raw_payload: { origem: "seed_dev" },
    fingerprint_origem: "seed:redetop:achocolatado:8.99",
  },
  {
    id: "2e894248-a1d6-4d87-a09d-999f00003006",
    id_lote: ids.loteProblemas,
    id_produto: ids.sabao,
    nome_original: "Sabão em pó 1,6kg",
    nome_normalizado: "sabao em po 1 6kg",
    preco: 0,
    validade_inicio: isoDate(0),
    validade_fim: isoDate(12),
    status: "rejeitado",
    confidence: 0.74,
    erro: "Preço inválido no panfleto",
    candidatos: [{ id: ids.sabao, confidence: 0.74, reasons: ["nome semelhante"] }],
    raw_payload: { origem: "seed_dev" },
    fingerprint_origem: "seed:solar:sabao:0",
  },
]);

await upsertRows("ofertas", [
  {
    id: "f4d46784-333b-4e4e-90e2-999f00004001",
    id_estabelecimento: ids.cooper,
    id_produto: ids.arroz,
    preco: 21.9,
    validade_inicio: isoDate(-1),
    validade_fim: isoDate(7),
    status: "publicada",
    observacao: "Oferta seed válida",
    id_lote_ingestao: ids.loteCooper,
    id_item_ingestao: "2e894248-a1d6-4d87-a09d-999f00003001",
    fingerprint_origem: "seed:cooper:arroz:21.90",
    publicado_em: new Date().toISOString(),
  },
  {
    id: "f4d46784-333b-4e4e-90e2-999f00004002",
    id_estabelecimento: ids.cooper,
    id_produto: ids.banana,
    preco: 4.99,
    validade_inicio: isoDate(-1),
    validade_fim: isoDate(3),
    status: "publicada",
    observacao: "Oferta seed válida",
    id_lote_ingestao: ids.loteCooper,
    id_item_ingestao: "2e894248-a1d6-4d87-a09d-999f00003002",
    fingerprint_origem: "seed:cooper:banana:4.99",
    publicado_em: new Date().toISOString(),
  },
  {
    id: "f4d46784-333b-4e4e-90e2-999f00004003",
    id_estabelecimento: ids.redeTop,
    id_produto: ids.feijao,
    preco: 7.49,
    validade_inicio: isoDate(-10),
    validade_fim: isoDate(-1),
    status: "publicada",
    observacao: "Oferta vencida para testar qualidade",
    fingerprint_origem: "seed:redetop:feijao:vencida",
    publicado_em: new Date().toISOString(),
  },
  {
    id: "f4d46784-333b-4e4e-90e2-999f00004004",
    id_estabelecimento: ids.solar,
    id_produto: ids.sabao,
    preco: 0,
    validade_inicio: isoDate(0),
    validade_fim: isoDate(12),
    status: "rascunho",
    observacao: "Preço inválido para testar bloqueio",
    fingerprint_origem: "seed:solar:sabao:0",
  },
  {
    id: "f4d46784-333b-4e4e-90e2-999f00004005",
    id_estabelecimento: ids.moretti,
    id_produto: ids.oleo,
    preco: 6.99,
    validade_inicio: isoDate(0),
    validade_fim: null,
    status: "publicada",
    observacao: "Sem validade para testar alerta",
    fingerprint_origem: "seed:moretti:oleo:sem-validade",
    publicado_em: new Date().toISOString(),
  },
  {
    id: "f4d46784-333b-4e4e-90e2-999f00004006",
    id_estabelecimento: ids.redeTop,
    id_produto: ids.leite,
    preco: 4.59,
    validade_inicio: isoDate(0),
    validade_fim: isoDate(5),
    status: "publicada",
    observacao: "Duplicada A",
    fingerprint_origem: "seed:redetop:leite:dup-a",
    publicado_em: new Date().toISOString(),
  },
  {
    id: "f4d46784-333b-4e4e-90e2-999f00004007",
    id_estabelecimento: ids.redeTop,
    id_produto: ids.leite,
    preco: 4.59,
    validade_inicio: isoDate(0),
    validade_fim: isoDate(5),
    status: "publicada",
    observacao: "Duplicada B",
    fingerprint_origem: "seed:redetop:leite:dup-b",
    publicado_em: new Date().toISOString(),
  },
]);

await upsertRows("usuarios", [
  {
    id: "539d0529-d455-47e4-9e27-999f00005001",
    telefone: "5547999990001",
    primeiro_acesso_em: new Date().toISOString(),
    ultimo_acesso_em: new Date().toISOString(),
  },
]);

await upsertRows("log_intencoes", [
  {
    id: "97de7ca5-8f5a-47d2-a2dd-999f00006001",
    id_usuario: "539d0529-d455-47e4-9e27-999f00005001",
    classificacao: "busca",
    termo_identificado: "arroz",
    mensagem_recebida: "tem arroz?",
    mensagem_normalizada: "tem arroz",
    id_mensagem_whatsapp: "seed-dev-msg-001",
  },
  {
    id: "97de7ca5-8f5a-47d2-a2dd-999f00006002",
    id_usuario: "539d0529-d455-47e4-9e27-999f00005001",
    classificacao: "busca",
    termo_identificado: "fralda",
    mensagem_recebida: "fralda pampers",
    mensagem_normalizada: "fralda pampers",
    id_mensagem_whatsapp: "seed-dev-msg-002",
  },
  {
    id: "97de7ca5-8f5a-47d2-a2dd-999f00006003",
    id_usuario: "539d0529-d455-47e4-9e27-999f00005001",
    classificacao: "busca",
    termo_identificado: "tomate",
    mensagem_recebida: "tomate barato",
    mensagem_normalizada: "tomate barato",
    id_mensagem_whatsapp: "seed-dev-msg-003",
  },
  {
    id: "97de7ca5-8f5a-47d2-a2dd-999f00006004",
    id_usuario: "539d0529-d455-47e4-9e27-999f00005001",
    classificacao: "busca",
    termo_identificado: "manteiga",
    mensagem_recebida: "manteiga",
    mensagem_normalizada: "manteiga",
    id_mensagem_whatsapp: "seed-dev-msg-004",
  },
]);

await upsertRows("log_respostas", [
  {
    id: "00860651-e96f-44c2-9f8d-999f00007001",
    id_intencao: "97de7ca5-8f5a-47d2-a2dd-999f00006001",
    total_resultados_busca: 1,
    resultados: [{ produto: "Arroz parboilizado 5kg", preco: 21.9 }],
  },
  {
    id: "00860651-e96f-44c2-9f8d-999f00007002",
    id_intencao: "97de7ca5-8f5a-47d2-a2dd-999f00006002",
    total_resultados_busca: 0,
    resultados: [],
  },
  {
    id: "00860651-e96f-44c2-9f8d-999f00007003",
    id_intencao: "97de7ca5-8f5a-47d2-a2dd-999f00006003",
    total_resultados_busca: 0,
    resultados: [],
  },
  {
    id: "00860651-e96f-44c2-9f8d-999f00007004",
    id_intencao: "97de7ca5-8f5a-47d2-a2dd-999f00006004",
    total_resultados_busca: 0,
    resultados: [],
  },
]);

console.log(
  JSON.stringify(
    {
      message: "Local development data seeded.",
      supabaseUrl,
      records: {
        cidades: 1,
        bairros: 5,
        estabelecimentos: 8,
        categorias: 7,
        produtos: 10,
        ofertas: 7,
        lotes: 3,
        itensIngestao: 6,
      },
    },
    null,
    2,
  ),
);
