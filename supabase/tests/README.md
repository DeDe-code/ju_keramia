# Database tests (pgTAP)

Automated tests for database-level security, including **RLS — Row Level Security** (the PostgreSQL rules that decide which rows a role may read or change).

Run them against the isolated local database only:

```bash
supabase test db --local
```

Continuous Integration (CI) runs the same command against a database-only local Supabase stack; see the `test-db` job in `.github/workflows/ci.yml`.

Conventions:

- Each file runs inside a transaction and ends with `rollback`, so synthetic fixtures never persist.
- Assertions switch to the real `anon` / `authenticated` PostgreSQL roles instead of running as the table owner; otherwise RLS would be bypassed and the tests would prove nothing.
- Never point these tests at a linked or shared project (`--linked`, `--db-url`).
