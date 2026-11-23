-- Disposable development databases only. Rebuild databases containing Product, Supplier or SupplierPrice rows.
-- tenant_keys_require_empty_catalogs: abort before DDL without inferring any tenant.
CREATE TEMPORARY TABLE `_tenant_keys_empty_guard` (`marker` INTEGER NOT NULL PRIMARY KEY);
INSERT INTO `_tenant_keys_empty_guard` (`marker`) VALUES (0);
INSERT INTO `_tenant_keys_empty_guard` (`marker`) SELECT 0 WHERE EXISTS (SELECT 1 FROM `Product`) OR EXISTS (SELECT 1 FROM `Supplier`) OR EXISTS (SELECT 1 FROM `SupplierPrice`);
DROP TEMPORARY TABLE `_tenant_keys_empty_guard`;

-- DropForeignKey
ALTER TABLE `Product` DROP FOREIGN KEY `Product_branchId_fkey`;

-- DropForeignKey
ALTER TABLE `Product` DROP FOREIGN KEY `Product_categoriaId_fkey`;

-- DropForeignKey
ALTER TABLE `SupplierPrice` DROP FOREIGN KEY `SupplierPrice_productoId_fkey`;

-- DropForeignKey
ALTER TABLE `SupplierPrice` DROP FOREIGN KEY `SupplierPrice_proveedorId_fkey`;

-- DropIndex
DROP INDEX `Category_nombre_key` ON `Category`;

-- DropIndex
DROP INDEX `Product_codigoBarras_key` ON `Product`;

-- DropIndex
DROP INDEX `Client_dni_key` ON `Client`;

-- DropIndex
DROP INDEX `Client_email_key` ON `Client`;

-- DropIndex
DROP INDEX `SupplierPrice_productoId_proveedorId_key` ON `SupplierPrice`;

-- AlterTable
ALTER TABLE `Product` ADD COLUMN `businessId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `Supplier` ADD COLUMN `businessId` INTEGER NOT NULL;

-- AlterTable
ALTER TABLE `SupplierPrice` ADD COLUMN `businessId` INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Branch_id_businessId_key` ON `Branch`(`id`, `businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `Category_businessId_nombre_key` ON `Category`(`businessId`, `nombre`);

-- CreateIndex
CREATE UNIQUE INDEX `Category_id_businessId_key` ON `Category`(`id`, `businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `Product_businessId_branchId_codigoBarras_key` ON `Product`(`businessId`, `branchId`, `codigoBarras`);

-- CreateIndex
CREATE UNIQUE INDEX `Product_id_businessId_key` ON `Product`(`id`, `businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `Client_businessId_dni_key` ON `Client`(`businessId`, `dni`);

-- CreateIndex
CREATE UNIQUE INDEX `Client_businessId_email_key` ON `Client`(`businessId`, `email`);

-- CreateIndex
CREATE UNIQUE INDEX `Supplier_businessId_cuit_key` ON `Supplier`(`businessId`, `cuit`);

-- CreateIndex
CREATE UNIQUE INDEX `Supplier_id_businessId_key` ON `Supplier`(`id`, `businessId`);

-- CreateIndex
CREATE UNIQUE INDEX `SupplierPrice_businessId_productoId_proveedorId_key` ON `SupplierPrice`(`businessId`, `productoId`, `proveedorId`);

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_branchId_businessId_fkey` FOREIGN KEY (`branchId`, `businessId`) REFERENCES `Branch`(`id`, `businessId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Product` ADD CONSTRAINT `Product_categoriaId_businessId_fkey` FOREIGN KEY (`categoriaId`, `businessId`) REFERENCES `Category`(`id`, `businessId`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Supplier` ADD CONSTRAINT `Supplier_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierPrice` ADD CONSTRAINT `SupplierPrice_businessId_fkey` FOREIGN KEY (`businessId`) REFERENCES `Business`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierPrice` ADD CONSTRAINT `SupplierPrice_productoId_businessId_fkey` FOREIGN KEY (`productoId`, `businessId`) REFERENCES `Product`(`id`, `businessId`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SupplierPrice` ADD CONSTRAINT `SupplierPrice_proveedorId_businessId_fkey` FOREIGN KEY (`proveedorId`, `businessId`) REFERENCES `Supplier`(`id`, `businessId`) ON DELETE CASCADE ON UPDATE CASCADE;
