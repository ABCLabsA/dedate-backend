-- CreateEnum
CREATE TYPE "ReactionType" AS ENUM ('LIKE', 'DISLIKE');

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "rootId" TEXT,
    "replyUserId" UUID,
    "likesCount" INTEGER NOT NULL DEFAULT 0,
    "dislikesCount" INTEGER NOT NULL DEFAULT 0,
    "repliesCount" INTEGER NOT NULL DEFAULT 0,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommentReaction" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "type" "ReactionType" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CommentReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Comment_projectId_createdAt_idx" ON "Comment"("projectId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_parentId_idx" ON "Comment"("parentId");

-- CreateIndex
CREATE INDEX "Comment_rootId_createdAt_idx" ON "Comment"("rootId", "createdAt");

-- CreateIndex
CREATE INDEX "Comment_projectId_rootId_createdAt_idx" ON "Comment"("projectId", "rootId", "createdAt");

-- CreateIndex
CREATE INDEX "CommentReaction_userId_idx" ON "CommentReaction"("userId");

-- CreateIndex
CREATE INDEX "CommentReaction_commentId_type_idx" ON "CommentReaction"("commentId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "CommentReaction_commentId_userId_type_key" ON "CommentReaction"("commentId", "userId", "type");
