-- CreateEnum
CREATE TYPE "session_status" AS ENUM ('STARTED', 'ENDED', 'CANCELLED');

-- CreateTable
CREATE TABLE "sessions" (
    "id" SERIAL NOT NULL,
    "profile_id" UUID NOT NULL,
    "book_id" INTEGER NOT NULL,
    "status" "session_status" NOT NULL DEFAULT 'STARTED',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "start_page" INTEGER NOT NULL,
    "end_page" INTEGER,
    "pages_read" INTEGER,
    "duration" INTEGER,
    "reading_speed" INTEGER,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_profile_id_book_id_fkey" FOREIGN KEY ("profile_id", "book_id") REFERENCES "users_books"("profileId", "bookId") ON DELETE CASCADE ON UPDATE CASCADE;
