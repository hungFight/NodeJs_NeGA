/*
  Warnings:

  - You are about to alter the column `avatar` on the `user` table. The data in that column could be lost. The data in that column will be cast from `LongBlob` to `VarChar(50)`.
  - You are about to alter the column `background` on the `user` table. The data in that column could be lost. The data in that column will be cast from `LongBlob` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE `user` MODIFY `avatar` VARCHAR(50) NULL,
    MODIFY `background` VARCHAR(50) NULL;
