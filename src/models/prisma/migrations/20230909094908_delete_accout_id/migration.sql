/*
  Warnings:

  - You are about to drop the column `accountId` on the `subaccounts` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `subaccounts` DROP FOREIGN KEY `SubAccounts_accountId_fkey`;

-- AlterTable
ALTER TABLE `subaccounts` DROP COLUMN `accountId`;
