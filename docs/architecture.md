# Architecture

## Module Structure

The backend is organized with a typical NestJS convention - by modules. Modules with endpoints usually contain 1 controller and at least 1 (or more) services. Non-endpoint modules (or folders) are marked with `_` symbol, to signify they are meant for internal use. Examples of these modules (folders) can be viewed below:

```
_database/
    prisma.service.ts               # Prisma client (Postgres adapter)
    supabase.ts                     # Supabase clients (anon + service role)
    database.module.ts

_storage/
    supabase_storage.service.ts     # file uploads via Supabase Storage

_guards/
    auth.guard.ts                   # Supabase token verification

_decorators/
    current-user.decorator.ts       # extracts authenticated user
    public.decorator.ts             # opts a route out of auth
    standard-responses.decorator.ts # used for Swagger docs

 _pipes/
    file-validation.pipe.ts         # validates uploaded images

_helpers/                           # plain utility functions (not a module)
```

## Authentication

Auth is handled by **Supabase Auth on the mobile client**. Sign up, sign in, email verification, and session/token management all happen client-side. This backend does not issue its own tokens.

**However**, every request is verified by an `AuthGuard`:

1. The guard reads the `Authorization: Bearer <token>` header.
2. The token is verified with Supabase (`supabase.auth.getUser(token)`).
3. On success, the resolved Supabase `User` is attached to the request.
4. Routes can opt out of this check with `@Public()`.

Additionally, `@CurrentUser()` is a param decorator that returns the authenticated user (or a specific field of it, e.g. `@CurrentUser('id')`) out of the request inside controllers.

## Caching

`BooksService` caches book searches by ISBN using NestJS Cache Manager with a 60 second TTL, to avoid repeated DB requests and especially repeated Google Books API calls (which are slower and rate-limited):

```
findBook
  -> check cache
  -> check DB, populate cache on hit
  -> fall back to Google Books API
```

When a book doesn't exist in the database, `findOrCreateBook` fetches it from Google Books, saves it to the database, and then adds it to the cache so the next frequent search for the same ISBN is served from cache or DB, not the external API.

## Logging

Winston is used as the logger for the entire application (`nest-winston`). In production, logs are also sent to Logtail and can be viewed on BetterStack. In development, logs are printed to console only.

Logging is intentionally **not** added to every method. Follow these rules for correct logging:

- **Log:** mutations that change user state (book added/deleted, session started/ended/cancelled, review deleted), and external API boundaries (Google Books returning no results).
- **Don't log:** plain reads, internal computation, and expected client errors (e.g. 404s from a bad ISBN).

## Testing

Unit tests are written with **Jest**, to test isolated services with mocked dependencies.

### Conventions

- Tests live alongside each module (e.g. `src/books/tests/*.spec.ts`).
- `PrismaService` methods are mocked directly as `jest.fn()` - no real database is used in unit tests.

### What gets tested

Coverage is intentionally selective rather than exhaustive:

- **Business logic** - guard conditions, status transitions, pagination/cursor behavior, and calculations (e.g. session stats, reading averages, time-of-day bucketing) are covered, including edge cases like zero state, capped values, and boundary conditions.
- **Mutations** - success paths, conflict/not-found paths, and that logging fires (or doesn't) at the right points.
- **Pure reads with no branching** are generally not tested directly, since they offer little beyond confirming Prisma was called.

### Running Tests

```
pnpm test            # run once
pnpm test:cov        # with coverage report
pnpx jest --testPathPatterns="books.service.spec.ts"    # run a specific test
```

## Request Flow Example

A typical "find a book by ISBN" request, showing the cache → DB → Google Books chain:

```
GET /books?isbn=9786175480083
  → AuthGuard verifies Supabase token, attaches user to request
  → BooksController.findBook()
  → BooksService.findBook()
      - check cache for this ISBN
          → hit: return cached book, done
      - check DB for this ISBN
          → hit: populate cache, return book, done
      - miss on both: delegate to GoogleBooksService.findInGoogleBooks()
          - calls the Google Books API
          - no results → logs a warning, throws NotFoundException
          - result found → maps response into NormalizedBookDto, returns it
  → response serialized via DTO
```
