do $$
begin
  create type public.admin_role as enum ('owner', 'admin', 'editor', 'viewer');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.tipo_fonte_dados as enum ('site', 'rede_social', 'panfleto', 'pdf', 'imagem', 'texto', 'outro');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.status_lote_ingestao as enum ('rascunho', 'processando', 'pendente_revisao', 'aprovado', 'publicado', 'rejeitado', 'erro');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.status_item_ingestao as enum ('pendente', 'aprovado', 'rejeitado', 'publicado', 'erro');
exception
  when duplicate_object then null;
end $$;

do $$
begin
  create type public.tipo_alvo_termo_busca as enum ('produto', 'categoria', 'marca', 'estabelecimento');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.admin_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role public.admin_role not null default 'admin',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.fontes_dados (
  id uuid primary key default gen_random_uuid(),
  id_estabelecimento uuid references public.estabelecimentos(id) on delete set null,
  nome text not null,
  tipo public.tipo_fonte_dados not null default 'site',
  url text,
  ativo boolean not null default true,
  config jsonb not null default '{}'::jsonb,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.lotes_ingestao (
  id uuid primary key default gen_random_uuid(),
  id_fonte uuid references public.fontes_dados(id) on delete set null,
  id_estabelecimento uuid references public.estabelecimentos(id) on delete set null,
  status public.status_lote_ingestao not null default 'rascunho',
  arquivo_origem text,
  conteudo_original text,
  raw_payload jsonb not null default '{}'::jsonb,
  total_itens integer not null default 0,
  criado_por uuid references auth.users(id) on delete set null,
  revisado_por uuid references auth.users(id) on delete set null,
  publicado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  publicado_em timestamptz
);

create table if not exists public.itens_ingestao (
  id uuid primary key default gen_random_uuid(),
  id_lote uuid not null references public.lotes_ingestao(id) on delete cascade,
  id_produto uuid references public.produtos(id) on delete set null,
  status public.status_item_ingestao not null default 'pendente',
  nome_original text not null,
  nome_normalizado text,
  marca text,
  quantidade numeric(10,3),
  unidade text,
  embalagem text,
  categoria_sugerida text,
  preco numeric(10,2),
  validade_inicio date,
  validade_fim date,
  observacao text,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  fingerprint_origem text,
  candidatos jsonb not null default '[]'::jsonb,
  raw_payload jsonb not null default '{}'::jsonb,
  erro text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create table if not exists public.termos_busca (
  id uuid primary key default gen_random_uuid(),
  termo text not null,
  termo_search text,
  tipo_alvo public.tipo_alvo_termo_busca not null default 'produto',
  id_produto uuid references public.produtos(id) on delete cascade,
  id_categoria uuid references public.categorias(id) on delete cascade,
  id_estabelecimento uuid references public.estabelecimentos(id) on delete cascade,
  marca text,
  peso numeric(6,3) not null default 1,
  origem text not null default 'manual' check (origem in ('manual', 'log', 'ingestao')),
  ativo boolean not null default true,
  aprovado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  constraint termos_busca_alvo_check check (
    (tipo_alvo = 'produto' and id_produto is not null and id_categoria is null and id_estabelecimento is null and marca is null)
    or (tipo_alvo = 'categoria' and id_categoria is not null and id_produto is null and id_estabelecimento is null and marca is null)
    or (tipo_alvo = 'estabelecimento' and id_estabelecimento is not null and id_produto is null and id_categoria is null and marca is null)
    or (tipo_alvo = 'marca' and marca is not null and id_produto is null and id_categoria is null and id_estabelecimento is null)
  )
);

create table if not exists public.auditoria_admin (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid references auth.users(id) on delete set null,
  acao text not null,
  entidade text not null,
  entidade_id uuid,
  antes jsonb,
  depois jsonb,
  criado_em timestamptz not null default now()
);

alter table public.ofertas
  drop constraint if exists ofertas_id_estabelecimento_id_produto_key;

alter table public.ofertas
  add column if not exists id_lote_ingestao uuid references public.lotes_ingestao(id) on delete set null,
  add column if not exists id_item_ingestao uuid references public.itens_ingestao(id) on delete set null,
  add column if not exists validade_inicio date,
  add column if not exists status text not null default 'publicada' check (status in ('rascunho', 'publicada', 'arquivada')),
  add column if not exists fingerprint_origem text,
  add column if not exists publicado_em timestamptz default now(),
  add column if not exists criado_por uuid references auth.users(id) on delete set null,
  add column if not exists atualizado_por uuid references auth.users(id) on delete set null;

update public.ofertas
set validade_inicio = coalesce(validade_inicio, criado_em::date),
    publicado_em = coalesce(publicado_em, criado_em)
where validade_inicio is null or publicado_em is null;

create unique index if not exists ofertas_fingerprint_origem_key
  on public.ofertas (fingerprint_origem)
  where fingerprint_origem is not null;

create index if not exists admin_members_user_active_idx on public.admin_members (user_id) where active = true;
create index if not exists fontes_dados_estabelecimento_idx on public.fontes_dados (id_estabelecimento);
create index if not exists lotes_ingestao_status_idx on public.lotes_ingestao (status, criado_em desc);
create index if not exists lotes_ingestao_estabelecimento_idx on public.lotes_ingestao (id_estabelecimento);
create index if not exists itens_ingestao_lote_status_idx on public.itens_ingestao (id_lote, status);
create index if not exists itens_ingestao_produto_idx on public.itens_ingestao (id_produto);
create index if not exists itens_ingestao_fingerprint_idx on public.itens_ingestao (fingerprint_origem) where fingerprint_origem is not null;
create index if not exists termos_busca_termo_trgm_idx on public.termos_busca using gin (termo_search public.gin_trgm_ops);
create index if not exists termos_busca_produto_idx on public.termos_busca (id_produto) where id_produto is not null;
create index if not exists termos_busca_categoria_idx on public.termos_busca (id_categoria) where id_categoria is not null;
create index if not exists ofertas_lote_idx on public.ofertas (id_lote_ingestao);
create index if not exists ofertas_item_idx on public.ofertas (id_item_ingestao);
create index if not exists ofertas_status_validade_idx on public.ofertas (status, validade_fim);
create index if not exists log_intencoes_usuario_idx on public.log_intencoes (id_usuario);
create index if not exists log_respostas_intencao_idx on public.log_respostas (id_intencao);
create index if not exists produtos_categoria_idx on public.produtos (id_categoria);
create index if not exists sinonimos_produto_idx on public.sinonimos (id_produto);

create or replace function public.termos_busca_set_termo_search() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.termo_search := lower(public.unaccent(coalesce(new.termo, '')));
  return new;
end;
$$;

create or replace function public.buscar_termos_sem_resultado(p_limite integer default 20)
returns table(termo text, buscas bigint, sem_resultado bigint)
language sql
set search_path = ''
as $$
  select
    coalesce(nullif(li.termo_identificado, ''), li.mensagem_normalizada) as termo,
    count(*) as buscas,
    count(*) filter (where coalesce(lr.total_resultados_busca, 0) = 0) as sem_resultado
  from public.log_intencoes li
  left join public.log_respostas lr on lr.id_intencao = li.id
  where li.classificacao = 'busca'
    and coalesce(nullif(li.termo_identificado, ''), li.mensagem_normalizada) is not null
  group by 1
  having count(*) filter (where coalesce(lr.total_resultados_busca, 0) = 0) > 0
  order by sem_resultado desc, buscas desc, termo asc
  limit p_limite;
$$;

create or replace function public.buscar_ofertas(p_termo text, p_id_cidade uuid default null::uuid, p_limite integer default 5)
returns table(
  produto text,
  preco numeric,
  estabelecimento text,
  tipo_estabelecimento text,
  bairro text,
  logradouro text,
  cidade text,
  observacao text,
  validade_fim date,
  categoria text
)
language sql
set search_path = ''
as $$
  with entrada as (
    select lower(public.unaccent(coalesce(p_termo, ''))) as termo
  ),
  ofertas_rankeadas as (
    select
      p.nome as produto,
      o.preco,
      e.nome as estabelecimento,
      e.tipo::text as tipo_estabelecimento,
      b.nome as bairro,
      e.logradouro,
      cid.nome as cidade,
      o.observacao,
      o.validade_fim,
      cat.nome as categoria,
      greatest(
        public.similarity(p.nome_search, entrada.termo),
        coalesce(sinonimo.score, 0),
        coalesce(termo_busca.score, 0),
        public.similarity(lower(public.unaccent(coalesce(cat.nome, ''))), entrada.termo) * 0.9
      ) as score
    from public.ofertas o
    join public.estabelecimentos e on e.id = o.id_estabelecimento
    join public.cidades cid on cid.id = e.id_cidade
    join public.produtos p on p.id = o.id_produto
    left join public.bairros b on b.id = e.id_bairro
    left join public.categorias cat on cat.id = p.id_categoria
    cross join entrada
    left join lateral (
      select max(public.similarity(si.termo_search, entrada.termo)) as score
      from public.sinonimos si
      where si.id_produto = p.id
    ) sinonimo on true
    left join lateral (
      select max(tb.peso * public.similarity(tb.termo_search, entrada.termo)) as score
      from public.termos_busca tb
      where tb.ativo = true
        and (
          (tb.tipo_alvo = 'produto' and tb.id_produto = p.id)
          or (tb.tipo_alvo = 'categoria' and tb.id_categoria = p.id_categoria)
          or (tb.tipo_alvo = 'estabelecimento' and tb.id_estabelecimento = e.id)
          or (tb.tipo_alvo = 'marca' and p.nome_search like '%' || tb.termo_search || '%')
        )
    ) termo_busca on true
    where
      e.ativo = true
      and cid.ativo = true
      and o.status = 'publicada'
      and (o.validade_fim is null or o.validade_fim >= current_date)
      and (p_id_cidade is null or e.id_cidade = p_id_cidade)
  )
  select
    produto,
    preco,
    estabelecimento,
    tipo_estabelecimento,
    bairro,
    logradouro,
    cidade,
    observacao,
    validade_fim,
    categoria
  from ofertas_rankeadas
  where score > 0.25
  order by score desc, preco asc
  limit p_limite;
$$;

create or replace trigger trg_fontes_dados_atualizado_em
  before update on public.fontes_dados
  for each row execute function public.fn_set_atualizado_em();

create or replace trigger trg_lotes_ingestao_atualizado_em
  before update on public.lotes_ingestao
  for each row execute function public.fn_set_atualizado_em();

create or replace trigger trg_itens_ingestao_atualizado_em
  before update on public.itens_ingestao
  for each row execute function public.fn_set_atualizado_em();

create or replace trigger trg_termos_busca_atualizado_em
  before update on public.termos_busca
  for each row execute function public.fn_set_atualizado_em();

create or replace trigger trg_termos_busca_search
  before insert or update on public.termos_busca
  for each row execute function public.termos_busca_set_termo_search();

alter function public.buscar_ofertas(text, uuid, integer) set search_path = '';
alter function public.buscar_termos_sem_resultado(integer) set search_path = '';
alter function public.fn_set_atualizado_em() set search_path = '';
alter function public.produtos_set_nome_search() set search_path = '';
alter function public.registrar_log_intencao(text, text, text, text, text, text) set search_path = '';
alter function public.registrar_log_resposta(uuid, integer, jsonb) set search_path = '';
alter function public.sinonimos_set_termo_search() set search_path = '';

alter table public.admin_members enable row level security;
alter table public.fontes_dados enable row level security;
alter table public.lotes_ingestao enable row level security;
alter table public.itens_ingestao enable row level security;
alter table public.termos_busca enable row level security;
alter table public.auditoria_admin enable row level security;

create policy "admin_members_select_own"
  on public.admin_members
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "admin_members_insert_service_only"
  on public.admin_members
  for insert
  to authenticated
  with check (false);

create policy "admin_members_update_service_only"
  on public.admin_members
  for update
  to authenticated
  using (false)
  with check (false);

create policy "admin_members_delete_service_only"
  on public.admin_members
  for delete
  to authenticated
  using (false);

create policy "fontes_dados_admin_all"
  on public.fontes_dados
  for all
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true))
  with check (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "lotes_ingestao_admin_all"
  on public.lotes_ingestao
  for all
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true))
  with check (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "itens_ingestao_admin_all"
  on public.itens_ingestao
  for all
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true))
  with check (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "termos_busca_admin_all"
  on public.termos_busca
  for all
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true))
  with check (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "auditoria_admin_select_admin"
  on public.auditoria_admin
  for select
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "auditoria_admin_insert_admin"
  on public.auditoria_admin
  for insert
  to authenticated
  with check (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "catalogo_admin_all_bairros"
  on public.bairros
  for all
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true))
  with check (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "catalogo_admin_all_categorias"
  on public.categorias
  for all
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true))
  with check (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "catalogo_admin_all_cidades"
  on public.cidades
  for all
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true))
  with check (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "catalogo_admin_all_estabelecimentos"
  on public.estabelecimentos
  for all
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true))
  with check (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "catalogo_admin_all_ofertas"
  on public.ofertas
  for all
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true))
  with check (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "catalogo_admin_all_produtos"
  on public.produtos
  for all
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true))
  with check (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "catalogo_admin_all_sinonimos"
  on public.sinonimos
  for all
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true))
  with check (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "logs_admin_select_intencoes"
  on public.log_intencoes
  for select
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "logs_admin_select_respostas"
  on public.log_respostas
  for select
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));

create policy "usuarios_admin_select"
  on public.usuarios
  for select
  to authenticated
  using (exists (select 1 from public.admin_members am where am.user_id = (select auth.uid()) and am.active = true));
