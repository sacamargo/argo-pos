-- Optional product cost + historical sale cost snapshot

ALTER TABLE `products` ADD COLUMN `cost_cents` integer;
ALTER TABLE `sale_items` ADD COLUMN `unit_cost_cents_snapshot` integer;
