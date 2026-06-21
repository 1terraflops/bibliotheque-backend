# Database

This backend uses PostgreSQL, hosted on Supabase. Most tables are managed through Prisma migrations, the only exception is `profiles` table (see note below).

## Tables

Here is the breakdown for the most important tables of this app:

### `profiles`

User profile data. **Created manually via the Supabase SQL editor, not through Prisma migrations** - `id` mirrors the Supabase Auth user ID, since auth is managed by Supabase, not this backend.

| Column       | Type          | Notes                                      |
| ------------ | ------------- | ------------------------------------------ |
| `id`         | `Uuid`        | Primary key, matches Supabase Auth user ID |
| `username`   | `String?`     | Unique, indexed                            |
| `full_name`  | `String?`     |                                            |
| `avatar_url` | `String?`     |                                            |
| `bio`        | `String?`     |                                            |
| `updated_at` | `Timestamptz` | Auto-updated                               |

### `books`

Original book data, sourced from the Google Books API.

| Column        | Type     | Notes                                |
| ------------- | -------- | ------------------------------------ |
| `id`          | `Int`    | Primary key, autoincrement           |
| `isbn`        | `String` | Unique                               |
| `title`       | `String` |                                      |
| `author`      | `String` |                                      |
| `description` | `String` |                                      |
| `pageCount`   | `Int`    |                                      |
| `coverUrl`    | `String` | Original cover URL from Google Books |

### `users_books`

Table, which represents a book in a specific user's library + their reading progress.

| Column                     | Type                | Notes                                                                    |
| -------------------------- | ------------------- | ------------------------------------------------------------------------ |
| `profileId`                | `Uuid`              | PK                                                                       |
| `bookId`                   | `Int`               | PK                                                                       |
| `status`                   | `BookStatus`        | `NOT_STARTED` \| `IN_PROGRESS` \| `COMPLETED` \| `DROPPED`               |
| `actualPageCount`          | `Int`               | Page count used for this user's copy (may differ from `books.pageCount`) |
| `pagesRead`                | `Int`               | Current progress                                                         |
| `cover`                    | `String?`           | User-uploaded cover                                                      |
| `startedAt` / `finishedAt` | `DateTime?`         |                                                                          |
| `rating`                   | `Int?` (`SmallInt`) |                                                                          |
| `isFavorite`               | `Boolean`           |                                                                          |
| `spentTime`                | `Int?`              | Total minutes spent reading                                              |
| `readingSpeed`             | `Int`               | Pages/hour, recalculated as sessions end                                 |
| `estimatedTime`            | `Int?`              | Estimated minutes remaining                                              |

**Primary key:** `[profileId, bookId]`
**Relations:** belongs to `Profile`, belongs to `Books`, has many `Sessions` - all cascade on delete.

### `sessions`

A reading session for a book.

| Column                     | Type                     | Notes                               |
| -------------------------- | ------------------------ | ----------------------------------- |
| `id`                       | `Int`                    | Primary key, autoincrement          |
| `profileId` / `bookId`     | `Uuid` / `Int`           | Together reference `users_books`    |
| `status`                   | `SessionStatus`          | `STARTED` \| `ENDED` \| `CANCELLED` |
| `startedAt` / `finishedAt` | `DateTime` / `DateTime?` |                                     |
| `startPage` / `endPage`    | `Int` / `Int?`           |                                     |
| `pagesRead`                | `Int?`                   |                                     |
| `duration`                 | `Int?`                   | Minutes                             |
| `readingSpeed`             | `Int?`                   | Pages/hour for this session         |

**Relation:** belongs to `UsersBooks` via `(profileId, bookId)` foreign key, cascades on delete.

## Entity Relationships

```
Profile ──< UsersBooks >── Books
   │                          │
   │                          │
   └──< BooksReviews >────────┘

UsersBooks ──< Sessions
```

## ORM Note

- Prisma generates the client into `generated/prisma` (not the default `node_modules` location), using `@prisma/adapter-pg` to connect via `DIRECT_URL`.
