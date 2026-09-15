-- CreateTable
CREATE TABLE "FinancialWellnessInput" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "monthlyIncome" REAL NOT NULL,
    "monthlyExpenses" REAL,
    "debts" TEXT,
    "emergencyFund" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialWellnessInput_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Course" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "isFree" BOOLEAN NOT NULL DEFAULT false,
    "priceLabel" TEXT NOT NULL,
    "durationWeeks" INTEGER NOT NULL,
    "level" TEXT NOT NULL,
    "rating" REAL NOT NULL,
    "studentsCount" INTEGER NOT NULL,
    "tags" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "programType" TEXT NOT NULL DEFAULT 'course',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Course" ("category", "createdAt", "durationWeeks", "featured", "id", "isFree", "level", "priceLabel", "provider", "rating", "studentsCount", "tags", "title", "url") SELECT "category", "createdAt", "durationWeeks", "featured", "id", "isFree", "level", "priceLabel", "provider", "rating", "studentsCount", "tags", "title", "url" FROM "Course";
DROP TABLE "Course";
ALTER TABLE "new_Course" RENAME TO "Course";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "FinancialWellnessInput_userId_idx" ON "FinancialWellnessInput"("userId");
