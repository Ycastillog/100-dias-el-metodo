CREATE TABLE `analytics_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_name` text NOT NULL,
	`path` text NOT NULL,
	`source` text,
	`medium` text,
	`campaign` text,
	`referrer_host` text,
	`occurred_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_analytics_events_name_occurred` ON `analytics_events` (`event_name`,`occurred_at`);--> statement-breakpoint
CREATE TABLE `waitlist_leads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`normalized_email` text NOT NULL,
	`name` text,
	`interest` text DEFAULT 'metodo' NOT NULL,
	`source` text,
	`medium` text,
	`campaign` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`consent_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_waitlist_leads_normalized_email` ON `waitlist_leads` (`normalized_email`);--> statement-breakpoint
CREATE INDEX `idx_waitlist_leads_created_at` ON `waitlist_leads` (`created_at`);
--> statement-breakpoint
PRAGMA optimize;
