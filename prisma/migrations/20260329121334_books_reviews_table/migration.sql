-- AlterTable
ALTER TABLE "users_books" ADD COLUMN     "cover" TEXT;

-- CreateTable
CREATE TABLE "books_reviews" (
    "id" SERIAL NOT NULL,
    "profileId" UUID NOT NULL,
    "bookId" INTEGER NOT NULL,
    "review" TEXT NOT NULL,
    "has_spoilers" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "books_reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "books_reviews_profileId_bookId_key" ON "books_reviews"("profileId", "bookId");

-- AddForeignKey
ALTER TABLE "books_reviews" ADD CONSTRAINT "books_reviews_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "books_reviews" ADD CONSTRAINT "books_reviews_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "books"("id") ON DELETE CASCADE ON UPDATE CASCADE;
