-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CommercialOperation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offerId" TEXT,
    "buyerRequestId" TEXT,
    "buyerId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "agreedPrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommercialOperation_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "CommercialOffer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommercialOperation_buyerRequestId_fkey" FOREIGN KEY ("buyerRequestId") REFERENCES "BuyerRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommercialOperation_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_CommercialOperation" ("agreedPrice", "buyerRequestId", "createdAt", "id", "offerId", "status", "updatedAt") SELECT "agreedPrice", "buyerRequestId", "createdAt", "id", "offerId", "status", "updatedAt" FROM "CommercialOperation";
DROP TABLE "CommercialOperation";
ALTER TABLE "new_CommercialOperation" RENAME TO "CommercialOperation";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
