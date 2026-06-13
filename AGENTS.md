# Guia para Agentes de IA

## Propósito do Projeto

Este projeto é um chat automatizado de ofertas para WhatsApp. Usuários enviam mensagens com termos como nomes de produtos, marcas ou categorias; o sistema busca ofertas válidas cadastradas e responde com os melhores resultados disponíveis.

Além do webhook público, o projeto possui um painel administrativo em Next.js para manter a operação: estabelecimentos, produtos, categorias, sinônimos, ofertas, fontes de dados, ingestão de ofertas, qualidade dos cadastros e métricas de busca.

O objetivo principal da ferramenta é reduzir trabalho manual na gestão de ofertas e melhorar a assertividade da busca por produtos no WhatsApp.

## Arquitetura Geral

- `src/app` contém as rotas Next.js App Router.
- `src/app/webhook/route.ts` expõe o webhook da Meta/WhatsApp.
- `src/app/(admin)/admin/*` contém as páginas do painel administrativo.
- `src/services` contém processamento do webhook, busca de ofertas, logs, templates e cliente WhatsApp.
- `src/lib/admin` concentra autenticação admin, Server Actions, leitura de dados do painel, ingestão, matching e validações operacionais.
- `src/lib/supabase` contém clientes Supabase para browser, server e service/admin.
- `src/supabase/migrations` contém o schema versionado do banco.
- `src/supabase/database.types.ts` é gerado a partir do schema Supabase e deve ser atualizado após migrations.
- `scripts` contém rotinas locais de seed e criação de admin local.
- `docs` contém documentação complementar de desenvolvimento.

## Fluxo Público do WhatsApp

1. A Meta chama `/webhook` com mensagens ou status.
2. O webhook valida a assinatura/token configurado no ambiente.
3. `webhook-processor` classifica a intenção da mensagem.
4. Para intenção de busca, o sistema chama a RPC `buscar_ofertas`.
5. Quando não há ofertas, o sistema chama `buscar_produtos_sugeridos` e retorna apenas nomes de produtos sugeridos.
6. A resposta é formatada para WhatsApp e enviada pelo cliente da Meta.
7. Intenções e respostas são registradas em logs para análise de lacunas de busca.

## Acesso Administrativo

- O login usa Supabase Auth.
- O acesso ao painel depende de existir um registro ativo em `public.admin_members`.
- Roles existentes: `owner`, `admin`, `editor`, `viewer`.
- Rotas em `/admin` exigem usuário autenticado e autorizado.
- Server Actions administrativas auditam alterações em `public.auditoria_admin` quando aplicável.

## Rotinas do Painel Admin

### Dashboard

Mostra métricas operacionais de estabelecimentos, produtos, ofertas ativas, ofertas inválidas, ingestão, itens com baixa confiança e buscas sem resultado.

### Ofertas

Permite cadastrar ofertas manualmente, publicar, arquivar e acompanhar validade, origem e problemas de qualidade. Ofertas publicadas são consideradas pelo bot quando estão válidas.

### Estabelecimentos

Mantém lojas e locais de oferta, incluindo cidade, bairro, endereço, tipo e status ativo. Estabelecimentos inativos não devem aparecer como origem de ofertas válidas.

### Produtos

Mantém catálogo canônico, categorias, unidades e sinônimos. O catálogo é a base para matching, sugestões e respostas do bot.

### Ingestão

Centraliza fontes e lotes de ofertas:

- Fontes: sites, redes sociais, panfletos, PDFs, imagens, textos ou outros meios.
- Lote manual: cola texto estruturado para criar itens pendentes.
- Panfleto com Groq: envia imagem e extrai produtos para revisão.
- URL com Groq: busca texto público da URL da fonte e extrai ofertas.
- Revisão: itens extraídos podem ser publicados, rejeitados ou vinculados/criados no catálogo.
- Sem revisão: quando habilitado, publica automaticamente apenas itens com produto resolvido e preço válido; demais ficam pendentes.

Ao evoluir ingestão, preserve resolução de catálogo, sinônimos, confidence, auditoria e possibilidade de revisão humana.

### Qualidade

Exibe ofertas vencidas, sem validade, duplicadas, inválidas ou com problemas bloqueantes. Use esta rotina para priorizar correções antes de publicar ou manter ofertas.

### Buscas

Mostra lacunas de matching a partir dos logs de busca sem resultado. Permite criar termos de busca ligados a produto, categoria, marca ou estabelecimento para melhorar assertividade.

### Simulador

Disponível somente em desenvolvimento local. Simula uma conversa de WhatsApp usando o mesmo processamento do webhook e grava logs reais no Supabase local.

## Padrões para Novas Features

- Para rotinas admin, siga o padrão atual:
  - leitura em `src/lib/admin/data.ts`;
  - escrita em Server Actions em `src/lib/admin/actions.ts`;
  - UI em `src/app/(admin)/admin/*`;
  - componentes compartilhados em `src/components/admin` ou `src/components/ui`.
- Use componentes shadcn/ui existentes antes de criar markup customizado.
- Use dialogs para cadastros e ações administrativas.
- Use toast para feedback de sucesso/erro quando a ação redirecionar com query params.
- Preserve auditoria para alterações administrativas relevantes.
- Preserve `revalidatePath` nas rotas afetadas por mutations.
- Para regras de permissão, use `requireAdmin` ou `requireRole` e respeite as roles existentes.
- Para lógica testável, prefira helpers pequenos em `src/lib/admin` ou `src/services` com testes próximos quando o padrão já existir.

## Banco de Dados e Supabase

- Alterações de schema devem ser feitas por migrations em `src/supabase/migrations`.
- Depois de aplicar migration local, regenere tipos com `npm run supabase:generate:types`.
- Não edite `src/supabase/database.types.ts` manualmente quando a mudança vier do schema.
- Use Supabase local via CLI para desenvolvimento e validação quando possível.
- Seeds de desenvolvimento são locais e não devem ser aplicados automaticamente em staging ou produção.
- Para criar usuários administrativos em ambientes remotos, crie o usuário no Supabase Auth e vincule em `public.admin_members`.

## Variáveis de Ambiente

Documente e use somente nomes de variáveis, nunca valores reais.

- Supabase público: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Supabase backend: `SUPABASE_URL`, `SUPABASE_SECRET_KEY` ou `SUPABASE_SERVICE_ROLE_KEY`.
- Meta/WhatsApp: `META_WHATSAPP_WEBHOOK_VERIFY_TOKEN`, `META_WHATSAPP_PHONE_NUMBER_ID`, `META_GRAPH_API_VERSION`, `META_GRAPH_ACCESS_TOKEN`.
- Groq: `GROQ_API_KEY`, `GROQ_OFFER_MODEL`, `GROQ_OFFER_TEXT_MODEL`.
- Segurança operacional: `MOCK_DELIVERY` pode evitar envio real em ambientes controlados.

## Segurança

- Nunca exponha credenciais, tokens, project IDs sensíveis, URLs privadas ou valores reais de env vars.
- Nunca coloque secrets em documentação, logs, screenshots, commits ou mensagens finais.
- Nunca use `SUPABASE_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `META_GRAPH_ACCESS_TOKEN` ou `GROQ_API_KEY` em código client-side.
- Não altere produção ou staging sem pedido explícito do usuário.
- Ao usar Supabase remoto, indique claramente qual projeto/ambiente será afetado antes de aplicar mudanças.
- Prefira `SUPABASE_SECRET_KEY` para backend novo; `SUPABASE_SERVICE_ROLE_KEY` é compatibilidade legada.

## Comandos Úteis

- `npm run dev`: inicia o Next.js em desenvolvimento.
- `npm run build`: build de produção.
- `npm run typecheck`: gera tipos de rotas e roda TypeScript.
- `npm run supabase:start`: inicia Supabase local.
- `npm run supabase:migration:up`: aplica migrations no banco local vinculado ao workdir.
- `npm run supabase:generate:types`: regenera tipos Supabase locais.
- `npm run seed:local`: popula dados e admin local de desenvolvimento.
- `npm run dev:bootstrap`: reseta banco local e aplica seed local.

## Checklist Antes de Concluir

- A mudança preserva o fluxo WhatsApp e o painel admin existentes?
- A mudança respeita autenticação, roles e auditoria?
- Migrations e tipos Supabase estão consistentes quando houver schema novo?
- Seeds permanecem locais e seguras?
- Nenhuma credencial foi adicionada, impressa ou documentada?
- Foram rodadas validações proporcionais ao tipo de mudança?

