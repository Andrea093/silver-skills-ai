-- CreateTable
CREATE TABLE "PensionInput" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "age" INTEGER NOT NULL,
    "weeksContributed" INTEGER,
    "yearsWorkedEstimate" INTEGER,
    "currentIncome" REAL NOT NULL,
    "regime" TEXT NOT NULL,
    "scenario" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PensionInput_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "PensionInput_userId_idx" ON "PensionInput"("userId");
