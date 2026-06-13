create or replace function public.buscar_produtos_sugeridos(
  p_termo text,
  p_id_cidade uuid default null::uuid,
  p_limite integer default 5
)
returns table(produto text)
language sql
set search_path = ''
as $$
  with entrada as (
    select lower(public.unaccent(coalesce(p_termo, ''))) as termo
  ),
  produtos_com_oferta as (
    select distinct
      p.id,
      p.nome,
      p.nome_search,
      p.id_categoria,
      lower(public.unaccent(coalesce(cat.nome, ''))) as categoria_search
    from public.ofertas o
    join public.estabelecimentos e on e.id = o.id_estabelecimento
    join public.cidades cid on cid.id = e.id_cidade
    join public.produtos p on p.id = o.id_produto
    left join public.categorias cat on cat.id = p.id_categoria
    where
      e.ativo = true
      and cid.ativo = true
      and o.status = 'publicada'
      and (o.validade_fim is null or o.validade_fim >= current_date)
      and (p_id_cidade is null or e.id_cidade = p_id_cidade)
  ),
  produtos_rankeados as (
    select
      p.nome as produto,
      greatest(
        public.similarity(p.nome_search, entrada.termo),
        public.word_similarity(p.nome_search, entrada.termo),
        public.similarity(p.categoria_search, entrada.termo) * 0.9,
        coalesce(sinonimo.score, 0),
        coalesce(termo_busca.score, 0)
      ) as score
    from produtos_com_oferta p
    cross join entrada
    left join lateral (
      select max(greatest(
        public.similarity(si.termo_search, entrada.termo),
        public.word_similarity(si.termo_search, entrada.termo)
      )) as score
      from public.sinonimos si
      where si.id_produto = p.id
    ) sinonimo on true
    left join lateral (
      select max(tb.peso * greatest(
        public.similarity(tb.termo_search, entrada.termo),
        public.word_similarity(tb.termo_search, entrada.termo)
      )) as score
      from public.termos_busca tb
      where tb.ativo = true
        and (
          (tb.tipo_alvo = 'produto' and tb.id_produto = p.id)
          or (tb.tipo_alvo = 'categoria' and tb.id_categoria = p.id_categoria)
          or (tb.tipo_alvo = 'marca' and p.nome_search like '%' || tb.termo_search || '%')
        )
    ) termo_busca on true
  )
  select produto
  from produtos_rankeados
  where score > 0.18
  order by score desc, produto asc
  limit p_limite;
$$;

grant all on function public.buscar_produtos_sugeridos(text, uuid, integer) to anon;
grant all on function public.buscar_produtos_sugeridos(text, uuid, integer) to authenticated;
grant all on function public.buscar_produtos_sugeridos(text, uuid, integer) to service_role;
