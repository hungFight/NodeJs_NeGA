/*
  Warnings:

  - Added the required column `accountId` to the `SubAccounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `subaccounts` ADD COLUMN `accountId` VARCHAR(50) NOT NULL;

-- AddForeignKey
ALTER TABLE `SubAccounts` ADD CONSTRAINT `SubAccounts_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
