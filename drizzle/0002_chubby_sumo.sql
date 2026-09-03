CREATE TABLE `payment_events` (
	`id` text PRIMARY KEY NOT NULL,
	`event_type` text NOT NULL,
	`order_id` text,
	`processed_at` text NOT NULL,
	FOREIGN KEY (`order_id`) REFERENCES `purchase_orders`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `purchase_orders` (
	`id` text PRIMARY KEY NOT NULL,
	`session_hash` text NOT NULL,
	`plan_key` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`environment` text NOT NULL,
	`contact_email` text NOT NULL,
	`paypal_order_id` text,
	`paypal_capture_id` text,
	`capture_request_id` text NOT NULL,
	`status` text DEFAULT 'initiated' NOT NULL,
	`delivery_status` text DEFAULT 'not_ready' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`paid_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_purchase_orders_paypal_order` ON `purchase_orders` (`paypal_order_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_purchase_orders_paypal_capture` ON `purchase_orders` (`paypal_capture_id`);--> statement-breakpoint
CREATE INDEX `idx_purchase_orders_session_created` ON `purchase_orders` (`session_hash`,`created_at`);