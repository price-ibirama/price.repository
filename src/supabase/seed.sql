-- Seed de dados para desenvolvimento local.
-- Nao popula tabelas de log.

begin;

insert into public.cidades (id, nome, estado, ativo)
values
  ('11111111-1111-1111-1111-111111111111', 'Florianopolis', 'SC', true),
  ('11111111-1111-1111-1111-111111111112', 'Sao Jose', 'SC', true)
on conflict (nome, estado) do update
set ativo = excluded.ativo;

insert into public.bairros (id, id_cidade, nome)
values
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Centro'),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Trindade'),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111112', 'Campinas'),
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111112', 'Kobrasol')
on conflict (id_cidade, nome) do nothing;

insert into public.categorias (id, nome, slug, ordem)
values
  ('33333333-3333-3333-3333-333333333331', 'Bebidas', 'bebidas', 1),
  ('33333333-3333-3333-3333-333333333332', 'Mercearia', 'mercearia', 2),
  ('33333333-3333-3333-3333-333333333333', 'Farmacia', 'farmacia', 3),
  ('33333333-3333-3333-3333-333333333334', 'Combustiveis', 'combustiveis', 4)
on conflict (slug) do update
set nome = excluded.nome,
    ordem = excluded.ordem;

insert into public.usuarios (id, telefone)
values
  ('44444444-4444-4444-4444-444444444441', '48999990001'),
  ('44444444-4444-4444-4444-444444444442', '48999990002')
on conflict (telefone) do nothing;

insert into public.produtos (id, id_categoria, nome, unidade)
values
  ('55555555-5555-5555-5555-555555555551', '33333333-3333-3333-3333-333333333331', 'Cerveja Pilsen Lata 350ml', 'un'),
  ('55555555-5555-5555-5555-555555555552', '33333333-3333-3333-3333-333333333332', 'Arroz Branco Tipo 1 5kg', 'pct'),
  ('55555555-5555-5555-5555-555555555553', '33333333-3333-3333-3333-333333333332', 'Cafe Torrado e Moido 500g', 'pct'),
  ('55555555-5555-5555-5555-555555555554', '33333333-3333-3333-3333-333333333333', 'Dipirona Sodica 1g 10 Comprimidos', 'cx'),
  ('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333334', 'Gasolina Comum', 'L')
on conflict (nome) do update
set id_categoria = excluded.id_categoria,
    unidade = excluded.unidade;

insert into public.sinonimos (id, id_produto, termo)
values
  ('66666666-6666-6666-6666-666666666661', '55555555-5555-5555-5555-555555555551', 'cerveja'),
  ('66666666-6666-6666-6666-666666666662', '55555555-5555-5555-5555-555555555551', 'pilsen'),
  ('66666666-6666-6666-6666-666666666663', '55555555-5555-5555-5555-555555555552', 'arroz'),
  ('66666666-6666-6666-6666-666666666664', '55555555-5555-5555-5555-555555555553', 'cafe'),
  ('66666666-6666-6666-6666-666666666665', '55555555-5555-5555-5555-555555555554', 'dipirona'),
  ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', 'gasolina')
on conflict (termo) do update
set id_produto = excluded.id_produto;

insert into public.estabelecimentos (id, id_cidade, id_bairro, nome, logradouro, tipo, ativo)
values
  ('77777777-7777-7777-7777-777777777771', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222221', 'Supermercado Bom Preco Centro', 'Rua Felipe Schmidt, 120', 'supermercado', true),
  ('77777777-7777-7777-7777-777777777772', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', 'Atacado Norte Trindade', 'Rua Lauro Linhares, 980', 'supermercado', true),
  ('77777777-7777-7777-7777-777777777773', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222223', 'Farmacia Vida Campinas', 'Avenida Presidente Kennedy, 410', 'farmacia', true),
  ('77777777-7777-7777-7777-777777777774', '11111111-1111-1111-1111-111111111112', '22222222-2222-2222-2222-222222222224', 'Posto Sul Kobrasol', 'Rua Koesa, 75', 'posto_combustivel', true)
on conflict do nothing;

insert into public.ofertas (id, id_estabelecimento, id_produto, preco, observacao, validade_fim)
values
  ('88888888-8888-8888-8888-888888888881', '77777777-7777-7777-7777-777777777771', '55555555-5555-5555-5555-555555555551', 4.89, 'Unidade gelada no corredor de bebidas.', current_date + 7),
  ('88888888-8888-8888-8888-888888888882', '77777777-7777-7777-7777-777777777772', '55555555-5555-5555-5555-555555555551', 4.59, 'Leve 6 e ganhe desconto no caixa.', current_date + 5),
  ('88888888-8888-8888-8888-888888888883', '77777777-7777-7777-7777-777777777771', '55555555-5555-5555-5555-555555555552', 24.90, 'Pacote tipo 1.', current_date + 10),
  ('88888888-8888-8888-8888-888888888884', '77777777-7777-7777-7777-777777777772', '55555555-5555-5555-5555-555555555552', 22.49, 'Oferta para pagamento no pix.', current_date + 4),
  ('88888888-8888-8888-8888-888888888885', '77777777-7777-7777-7777-777777777771', '55555555-5555-5555-5555-555555555553', 16.99, null, current_date + 15),
  ('88888888-8888-8888-8888-888888888886', '77777777-7777-7777-7777-777777777772', '55555555-5555-5555-5555-555555555553', 15.49, 'Cafe extra forte.', current_date + 8),
  ('88888888-8888-8888-8888-888888888887', '77777777-7777-7777-7777-777777777773', '55555555-5555-5555-5555-555555555554', 12.90, 'Medicamento generico.', current_date + 20),
  ('88888888-8888-8888-8888-888888888888', '77777777-7777-7777-7777-777777777774', '55555555-5555-5555-5555-555555555555', 6.19, 'Preco por litro atualizado hoje.', current_date + 1)
on conflict (id_estabelecimento, id_produto) do update
set preco = excluded.preco,
    observacao = excluded.observacao,
    validade_fim = excluded.validade_fim;

commit;
