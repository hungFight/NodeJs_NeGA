/*
  Warnings:

  - You are about to drop the column `experience` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `occupation` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `strength` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `user` DROP COLUMN `experience`,
    DROP COLUMN `occupation`,
    DROP COLUMN `strength`;
