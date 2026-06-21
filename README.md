# Bibliotheque - Backend

This is a documentation for a backend application called **Bibliotheque**, a book tracking application which manages user's library, reading sessions, reading statistics, book reviews, etc.

## Tech Stack

| Layer              | Technology                                    |
| ------------------ | --------------------------------------------- |
| Framework          | NestJS                                        |
| Language           | TypeScript                                    |
| Database & Storage | Supabase (PostgreSQL)                         |
| ORM                | Prisma                                        |
| Caching            | NestJS Cache Manager                          |
| Logging            | Winston + Logtail on BetterStack (production) |
| External API       | Google Books API                              |
| API Docs           | Swagger + Scalar                              |
| Testing            | Jest                                          |
| Package Manager    | pnpm                                          |
| Deployment         | Render                                        |

## Documentation

- [Architecture](./docs/architecture.md) - module structure, request flow, caching, auth
- [Database](./docs/database.md) - schema, tables, and relationships
- [Setup](./docs/setup.md) - environment variables and running locally
- [Deployment](./docs/deployment.md) - how the backend is deployed

## API Reference

Endpoints are documented via Swagger (using Scalar). While the backend is live or running locally, visit /docs route to see full endpoint documentation.
