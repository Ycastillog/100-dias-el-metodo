CREATE TABLE `request_limits` (
	`bucket` text PRIMARY KEY NOT NULL,
	`window_start` integer NOT NULL,
	`hits` integer NOT NULL
);
