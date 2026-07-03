/*
  Warnings:

  - Added the required column `rawText` to the `CvAnalysis` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CvAnalysis" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "rawText" TEXT NOT NULL,
    "extractedSkills" TEXT NOT NULL,
    "atsScore" INTEGER NOT NULL,
    "suggestions" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CvAnalysis_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_CvAnalysis" ("atsScore", "createdAt", "extractedSkills", "filename", "id", "suggestions", "userId") SELECT "atsScore", "createdAt", "extractedSkills", "filename", "id", "suggestions", "userId" FROM "CvAnalysis";
DROP TABLE "CvAnalysis";
ALTER TABLE "new_CvAnalysis" RENAME TO "CvAnalysis";
CREATE INDEX "CvAnalysis_userId_idx" ON "CvAnalysis"("userId");
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "employabilityScore" INTEGER NOT NULL DEFAULT 50,
    "role" TEXT NOT NULL DEFAULT 'user',
    "isPremium" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_User" ("createdAt", "email", "employabilityScore", "id", "name", "passwordHash", "updatedAt") SELECT "createdAt", "email", "employabilityScore", "id", "name", "passwordHash", "updatedAt" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
