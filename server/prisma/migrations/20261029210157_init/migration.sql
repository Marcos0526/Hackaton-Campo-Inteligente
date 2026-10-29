-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'producer'
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "expiresAt" DATETIME NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "expiresAt" DATETIME,
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME
);

-- CreateTable
CREATE TABLE "ProducerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "farmName" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "totalLand" REAL NOT NULL,
    "cultivatedLand" REAL NOT NULL,
    "crops" TEXT NOT NULL,
    "storageCapacity" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProducerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransporterProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "baseLocation" TEXT NOT NULL,
    "vehicleType" TEXT NOT NULL,
    "loadCapacityKg" REAL NOT NULL,
    "routes" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TransporterProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyerProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "deliveryLocation" TEXT NOT NULL,
    "preferredCrops" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommercialOffer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "producerId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "quality" TEXT NOT NULL,
    "pricePerUnit" REAL NOT NULL,
    "availableDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommercialOffer_producerId_fkey" FOREIGN KEY ("producerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BuyerRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "buyerId" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unit" TEXT NOT NULL,
    "targetPriceMin" REAL NOT NULL,
    "targetPriceMax" REAL NOT NULL,
    "deliveryDate" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'published',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BuyerRequest_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TransportQuote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transporterId" TEXT NOT NULL,
    "operationId" TEXT,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "distanceKm" REAL NOT NULL,
    "quotedPrice" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TransportQuote_transporterId_fkey" FOREIGN KEY ("transporterId") REFERENCES "TransporterProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TransportQuote_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "CommercialOperation" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CommercialOperation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "offerId" TEXT,
    "buyerRequestId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "agreedPrice" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CommercialOperation_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "CommercialOffer" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "CommercialOperation_buyerRequestId_fkey" FOREIGN KEY ("buyerRequestId") REFERENCES "BuyerRequest" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "FinancialRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "estimatedCosts" REAL NOT NULL,
    "requestedAmount" REAL NOT NULL,
    "projectedSales" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'submitted',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FinancialRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ProducerProfile_userId_key" ON "ProducerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TransporterProfile_userId_key" ON "TransporterProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "BuyerProfile_userId_key" ON "BuyerProfile"("userId");
