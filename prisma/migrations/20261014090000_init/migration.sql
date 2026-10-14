-- CreateTable
CREATE TABLE "ClipboardItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "title" TEXT,
    "projectId" TEXT,
    CONSTRAINT "ClipboardItem_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ClipboardItemTag" (
    "itemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    PRIMARY KEY ("itemId", "tagId"),
    CONSTRAINT "ClipboardItemTag_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "ClipboardItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ClipboardItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ClipboardItem_createdAt_idx" ON "ClipboardItem"("createdAt");

-- CreateIndex
CREATE INDEX "ClipboardItem_contentType_idx" ON "ClipboardItem"("contentType");

-- CreateIndex
CREATE INDEX "ClipboardItem_isPinned_idx" ON "ClipboardItem"("isPinned");

-- CreateIndex
CREATE INDEX "ClipboardItem_projectId_idx" ON "ClipboardItem"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
