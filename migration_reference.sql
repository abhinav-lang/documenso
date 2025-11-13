-- Work Order Management System Migration Reference
-- This file shows the expected database changes
-- Run `npm run prisma:migrate-dev` in packages/prisma to apply

-- Add WorkOrderRole enum
CREATE TYPE "WorkOrderRole" AS ENUM ('CONTRACTS_TEAM', 'APPROVER', 'SITE_MANAGER', 'CONTRACTOR');

-- Add WorkOrderStatus enum
CREATE TYPE "WorkOrderStatus" AS ENUM ('DRAFT', 'PENDING_APPROVAL', 'APPROVED_BY_HQ', 'SIGNED_BY_CONTRACTOR', 'REJECTED');

-- Add workOrderRole to User table
ALTER TABLE "User" ADD COLUMN "workOrderRole" "WorkOrderRole";

-- Create Site table
CREATE TABLE "Site" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "location" TEXT,
    "contactPhone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Site_pkey" PRIMARY KEY ("id")
);

-- Create SiteUser table (many-to-many User <-> Site)
CREATE TABLE "SiteUser" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteUser_pkey" PRIMARY KEY ("id")
);

-- Create Contractor table
CREATE TABLE "Contractor" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contractor_pkey" PRIMARY KEY ("id")
);

-- Create ContractorOtpSession table
CREATE TABLE "ContractorOtpSession" (
    "id" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContractorOtpSession_pkey" PRIMARY KEY ("id")
);

-- Create WorkOrder table
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "workOrderNumber" TEXT NOT NULL,
    "envelopeId" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "contractorId" TEXT NOT NULL,
    "status" "WorkOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- Create unique indexes
CREATE UNIQUE INDEX "Site_code_key" ON "Site"("code");
CREATE UNIQUE INDEX "SiteUser_siteId_userId_key" ON "SiteUser"("siteId", "userId");
CREATE UNIQUE INDEX "WorkOrder_workOrderNumber_key" ON "WorkOrder"("workOrderNumber");
CREATE UNIQUE INDEX "WorkOrder_envelopeId_key" ON "WorkOrder"("envelopeId");

-- Create indexes for performance
CREATE INDEX "Site_code_idx" ON "Site"("code");
CREATE INDEX "SiteUser_siteId_idx" ON "SiteUser"("siteId");
CREATE INDEX "SiteUser_userId_idx" ON "SiteUser"("userId");
CREATE INDEX "Contractor_phone_idx" ON "Contractor"("phone");
CREATE INDEX "ContractorOtpSession_contractorId_idx" ON "ContractorOtpSession"("contractorId");
CREATE INDEX "ContractorOtpSession_phone_idx" ON "ContractorOtpSession"("phone");
CREATE INDEX "WorkOrder_siteId_idx" ON "WorkOrder"("siteId");
CREATE INDEX "WorkOrder_contractorId_idx" ON "WorkOrder"("contractorId");
CREATE INDEX "WorkOrder_status_idx" ON "WorkOrder"("status");
CREATE INDEX "WorkOrder_workOrderNumber_idx" ON "WorkOrder"("workOrderNumber");

-- Add foreign keys
ALTER TABLE "SiteUser" ADD CONSTRAINT "SiteUser_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SiteUser" ADD CONSTRAINT "SiteUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ContractorOtpSession" ADD CONSTRAINT "ContractorOtpSession_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_envelopeId_fkey" FOREIGN KEY ("envelopeId") REFERENCES "Envelope"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_contractorId_fkey" FOREIGN KEY ("contractorId") REFERENCES "Contractor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
