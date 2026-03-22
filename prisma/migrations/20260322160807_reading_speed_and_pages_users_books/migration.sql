-- AlterTable
ALTER TABLE "users_books" ADD COLUMN     "actual_page_count" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "reading_speed" INTEGER NOT NULL DEFAULT 0;
