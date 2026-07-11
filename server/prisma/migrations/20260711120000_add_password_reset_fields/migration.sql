-- AlterTable
ALTER TABLE `User` ADD COLUMN `reset_password_token` VARCHAR(191) NULL,
    ADD COLUMN `reset_password_expires` DATETIME(3) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_reset_password_token_key` ON `User`(`reset_password_token`);
