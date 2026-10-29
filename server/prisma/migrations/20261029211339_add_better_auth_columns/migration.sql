-- AlterTable
ALTER TABLE "Account" ADD COLUMN "accessTokenExpiresAt" DATETIME;
ALTER TABLE "Account" ADD COLUMN "refreshTokenExpiresAt" DATETIME;
ALTER TABLE "Account" ADD COLUMN "scope" TEXT;
