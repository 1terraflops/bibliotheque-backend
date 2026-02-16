/*
  Warnings:

  - The `status` column on the `users_books` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "BookStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'DROPPED');

-- AlterTable
ALTER TABLE "users_books" ADD COLUMN     "finished_at" TIMESTAMP(3),
ADD COLUMN     "is_favorite" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "rating" SMALLINT,
ADD COLUMN     "started_at" TIMESTAMP(3),
ADD COLUMN     "updated_at" TIMESTAMP(3),
DROP COLUMN "status",
ADD COLUMN     "status" "BookStatus" NOT NULL DEFAULT 'NOT_STARTED',
ALTER COLUMN "pagesRead" SET DEFAULT 0;
