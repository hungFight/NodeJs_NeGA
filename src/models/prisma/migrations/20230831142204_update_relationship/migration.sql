/*
  Warnings:

  - You are about to alter the column `relationship` on the `mores` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `VarChar(20)`.

*/
-- AlterTable
ALTER TABLE `mores` MODIFY `relationship` VARCHAR(20) NOT NULL DEFAULT 'Single';
