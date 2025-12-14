-- CreateTable
CREATE TABLE "personality" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "mbti" TEXT NOT NULL,
    "learningStyle" TEXT NOT NULL,
    "energyLevel" INTEGER NOT NULL,
    "workRhythm" TEXT NOT NULL,
    "preferredTime" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "personality_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "personality_userId_key" ON "personality"("userId");

-- CreateIndex
CREATE INDEX "personality_userId_idx" ON "personality"("userId");
