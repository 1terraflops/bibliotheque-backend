# Deployment

The backend is deployed on [Render](https://render.com/).

## Environment

All variables listed in [Setup](./setup.md) must be configured in Render's environment settings for the service. `ENV=prod` switches:

- Log format to structured JSON
- Log level to `info` (suppressing `debug`)
- Enables the Logtail transport for shipping logs

## Database

The production database is the same Supabase-Postgres instance used in development (via `DATABASE_URL` / `DIRECT_URL`), unless a separate production Supabase project is created in future.

## Build & Start

Render runs the following build and start commands on each deployment:

```
pnpm install --frozen-lockfile; pnpx prisma generate; pnpm run build
pnpm start:prod
```
