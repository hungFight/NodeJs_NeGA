/*
  Warnings:

  - You are about to alter the column `hobby` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(300)` to `Json`.
  - You are about to alter the column `skill` on the `user` table. The data in that column could be lost. The data in that column will be cast from `VarChar(300)` to `Json`.

*/
-- AlterTable
ALTER TABLE `mores` ADD COLUMN `language` JSON NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `occupation` VARCHAR(100) NULL,
    ADD COLUMN `schoolName` VARCHAR(100) NULL,
    MODIFY `hobby` JSON NULL,
    MODIFY `skill` JSON NULL;
