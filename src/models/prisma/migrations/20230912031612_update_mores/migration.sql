/*
  Warnings:

  - Made the column `privacy` on table `mores` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `mores` MODIFY `privacy` JSON NOT NULL;
