# Setup

## Prerequisites

- Node.js
- pnpm
- A Supabase project (database + auth + storage)
- A Google Books API key

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable                    | Description                                                                    |
| --------------------------- | ------------------------------------------------------------------------------ |
| `PORT`                      | Port the server listens on                                                     |
| `ENV`                       | Environment (`dev` / `prod`) - controls logs                                   |
| `LOGTAIL_TOKEN`             | Logtail source token (production logging)                                      |
| `DATABASE_URL`              | Supabase pooled Postgres connection string                                     |
| `DIRECT_URL`                | Supabase direct Postgres connection string (used by Prisma's adapter)          |
| `PROJECT_URL`               | Supabase project URL                                                           |
| `SUPABASE_API_KEY`          | Supabase anon/public key                                                       |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (used server-side for storage uploads, bypasses RLS) |
| `GOOGLE_BOOKS_API_KEY`      | API key for the Google Books API from Google Cloud                             |

## Install & Run

```
pnpm install

# generate the Prisma client types
pnpx prisma generate

pnpm start:dev
```

The server starts on `http://localhost:<PORT>`. Interactive API docs (Swagger/Scalar) are available once the server is running on `/docs` route.

## Database Migrations

Schema changes go through Prisma:

```bash
npx prisma migrate dev --name <migration_name>
```

**Note:** the `profiles` table is **not** managed by Prisma migrations - it was created manually in the Supabase SQL editor since it mirrors Supabase Auth users. If you reset the database or run `migrate reset`, the `profiles` table will need to be recreated manually. See [Database](./database.md) for its schema.
