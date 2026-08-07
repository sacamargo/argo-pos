-- Unique business codes + product fulfillment (simple | compound)

ALTER TABLE `categories` ADD COLUMN `code` text NOT NULL DEFAULT '';
ALTER TABLE `ingredients` ADD COLUMN `code` text NOT NULL DEFAULT '';
ALTER TABLE `products` ADD COLUMN `code` text NOT NULL DEFAULT '';
ALTER TABLE `products` ADD COLUMN `fulfillment_type` text NOT NULL DEFAULT 'compound';
ALTER TABLE `products` ADD COLUMN `stock_item_id` text REFERENCES `ingredients`(`id`);
ALTER TABLE `products` ADD COLUMN `qty_per_sale` real;

UPDATE `categories`
SET `code` = 'CAT-' || upper(substr(replace(`id`, '-', ''), 1, 8))
WHERE `code` = '' OR `code` IS NULL;

UPDATE `ingredients`
SET `code` = 'INV-' || upper(substr(replace(`id`, '-', ''), 1, 8))
WHERE `code` = '' OR `code` IS NULL;

UPDATE `products`
SET `code` = 'PROD-' || upper(substr(replace(`id`, '-', ''), 1, 8))
WHERE `code` = '' OR `code` IS NULL;

UPDATE `products`
SET `fulfillment_type` = 'compound'
WHERE `fulfillment_type` IS NULL OR `fulfillment_type` = '';

CREATE UNIQUE INDEX IF NOT EXISTS `categories_code_unique` ON `categories` (`code`);
CREATE UNIQUE INDEX IF NOT EXISTS `ingredients_code_unique` ON `ingredients` (`code`);
CREATE UNIQUE INDEX IF NOT EXISTS `products_code_unique` ON `products` (`code`);
