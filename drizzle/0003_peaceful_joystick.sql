CREATE TABLE `participant_records` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`record_key` text NOT NULL,
	`body` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_participant_records_order_key` ON `participant_records` (`order_id`,`record_key`);