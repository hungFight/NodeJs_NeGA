-- AddForeignKey
ALTER TABLE `SubAccounts` ADD CONSTRAINT `SubAccounts_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
