-- AlterTable
ALTER TABLE `mores` ADD COLUMN `privacy` JSON NULL,
    MODIFY `position` VARCHAR(20) NOT NULL DEFAULT 'User';

-- CreateTable
CREATE TABLE `SubAccounts` (
    `id` VARCHAR(50) NOT NULL,
    `phoneNumberEmail` VARCHAR(50) NOT NULL,
    `accountId` VARCHAR(50) NOT NULL,

    UNIQUE INDEX `SubAccounts_accountId_key`(`accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SubAccounts` ADD CONSTRAINT `SubAccounts_accountId_fkey` FOREIGN KEY (`accountId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
