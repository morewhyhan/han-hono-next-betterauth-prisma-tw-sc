-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_task" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "important" BOOLEAN NOT NULL DEFAULT false,
    "urgent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "dueDate" DATETIME,
    "userId" TEXT NOT NULL,
    "period" TEXT,
    "parentId" INTEGER,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "archivedBy" TEXT,
    "archivedAt" DATETIME,
    "archiveReason" TEXT,
    "difficulty" INTEGER,
    "motivation" INTEGER,
    "completionRate" REAL,
    "feedback" TEXT,
    "remindAt" DATETIME,
    "remindType" TEXT,
    "isReminded" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "task_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "task_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "task" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_task" ("createdAt", "description", "dueDate", "id", "important", "status", "title", "updatedAt", "urgent", "userId") SELECT "createdAt", "description", "dueDate", "id", "important", "status", "title", "updatedAt", "urgent", "userId" FROM "task";
DROP TABLE "task";
ALTER TABLE "new_task" RENAME TO "task";
CREATE INDEX "task_userId_idx" ON "task"("userId");
CREATE INDEX "task_status_idx" ON "task"("status");
CREATE INDEX "task_period_idx" ON "task"("period");
CREATE INDEX "task_parentId_idx" ON "task"("parentId");
CREATE INDEX "task_isArchived_idx" ON "task"("isArchived");
CREATE INDEX "task_remindAt_idx" ON "task"("remindAt");
CREATE INDEX "task_isReminded_idx" ON "task"("isReminded");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
