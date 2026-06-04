# Seeds locais de desenvolvimento

Os dados de exemplo deste projeto são apenas para desenvolvimento local.

## Como popular o banco local

Execute a partir da raiz do repositório:

```bash
npm run seed:local
```

Para resetar o banco local e popular dados + usuário admin:

```bash
npm run dev:bootstrap
```

Credenciais padrão do admin local:

- Email: `admin@price.local`
- Senha: `PriceLocal@2026!`

## Proteção contra remoto

- `src/supabase/seed.sql` é intencionalmente vazio.
- `src/supabase/config.toml` mantém `[db.seed].enabled = false`.
- `scripts/seed-local-dev.mjs` recusa qualquer URL que não seja `localhost`, `127.0.0.1` ou `::1`.
- Não use `supabase db push --include-seed` para produção.

Essa configuração impede que dados fictícios de desenvolvimento sejam aplicados automaticamente em staging ou produção pela Supabase CLI.
