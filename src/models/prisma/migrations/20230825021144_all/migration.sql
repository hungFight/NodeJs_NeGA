-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(30) NOT NULL,
    `phoneNumberEmail` VARCHAR(50) NOT NULL,
    `password` VARCHAR(100) NOT NULL,
    `avatar` LONGBLOB NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `biography` VARCHAR(50) NULL,
    `gender` INTEGER NOT NULL,
    `birthday` VARCHAR(13) NOT NULL,
    `address` VARCHAR(250) NULL,
    `background` LONGBLOB NULL,
    `hobby` VARCHAR(300) NULL,
    `strength` VARCHAR(300) NULL,
    `skill` VARCHAR(300) NULL,
    `occupation` VARCHAR(300) NULL,
    `experience` VARCHAR(300) NULL,
    `firstPage` VARCHAR(3) NOT NULL DEFAULT 'vi',
    `secondPage` VARCHAR(3) NOT NULL DEFAULT 'vi',
    `thirdPage` VARCHAR(3) NOT NULL DEFAULT 'vi',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Mores` (
    `id` VARCHAR(50) NOT NULL,
    `position` VARCHAR(20) NOT NULL DEFAULT 'user',
    `star` INTEGER NOT NULL DEFAULT 0,
    `loverAmount` INTEGER NOT NULL DEFAULT 0,
    `friendAmount` INTEGER NOT NULL DEFAULT 0,
    `followingAmount` INTEGER NOT NULL DEFAULT 0,
    `followedAmount` INTEGER NOT NULL DEFAULT 0,
    `visitorAmount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Friends` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `idRequest` VARCHAR(50) NOT NULL,
    `idIsRequested` VARCHAR(50) NOT NULL,
    `level` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Followers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `idFollowing` VARCHAR(50) NOT NULL,
    `idIsFollowed` VARCHAR(50) NOT NULL,
    `following` INTEGER NOT NULL DEFAULT 1,
    `followed` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Relationship` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(50) NOT NULL,
    `idRel` VARCHAR(50) NOT NULL,
    `title` VARCHAR(20) NOT NULL,
    `really` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Lovers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` VARCHAR(50) NOT NULL,
    `idIsLoved` VARCHAR(50) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Mores` ADD CONSTRAINT `Mores_id_fkey` FOREIGN KEY (`id`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Friends` ADD CONSTRAINT `Friends_idRequest_fkey` FOREIGN KEY (`idRequest`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Friends` ADD CONSTRAINT `Friends_idIsRequested_fkey` FOREIGN KEY (`idIsRequested`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Followers` ADD CONSTRAINT `Followers_idFollowing_fkey` FOREIGN KEY (`idFollowing`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Followers` ADD CONSTRAINT `Followers_idIsFollowed_fkey` FOREIGN KEY (`idIsFollowed`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Relationship` ADD CONSTRAINT `Relationship_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Relationship` ADD CONSTRAINT `Relationship_idRel_fkey` FOREIGN KEY (`idRel`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lovers` ADD CONSTRAINT `Lovers_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Lovers` ADD CONSTRAINT `Lovers_idIsLoved_fkey` FOREIGN KEY (`idIsLoved`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
