/*
  Warnings:

  - The primary key for the `subaccounts` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to alter the column `id` on the `subaccounts` table. The data in that column could be lost. The data in that column will be cast from `VarChar(50)` to `Int`.
  - Added the required column `userId` to the `SubAccounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `subaccounts` DROP PRIMARY KEY,
    ADD COLUMN `userId` VARCHAR(50) NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);
