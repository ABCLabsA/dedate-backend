/*
  Warnings:

  - You are about to drop the column `replyUserId` on the `Comment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "replyUserId",
ADD COLUMN     "replyToId" UUID;
