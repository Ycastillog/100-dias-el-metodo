import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const waitlistLeads = sqliteTable('waitlist_leads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull(),
  normalizedEmail: text('normalized_email').notNull(),
  name: text('name'),
  interest: text('interest').notNull().default('metodo'),
  source: text('source'),
  medium: text('medium'),
  campaign: text('campaign'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  consentAt: text('consent_at').notNull(),
}, (table) => [
  uniqueIndex('idx_waitlist_leads_normalized_email').on(table.normalizedEmail),
  index('idx_waitlist_leads_created_at').on(table.createdAt),
]);

export const analyticsEvents = sqliteTable('analytics_events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  eventName: text('event_name').notNull(),
  detail: text('detail'),
  path: text('path').notNull(),
  source: text('source'),
  medium: text('medium'),
  campaign: text('campaign'),
  referrerHost: text('referrer_host'),
  occurredAt: text('occurred_at').notNull(),
}, (table) => [
  index('idx_analytics_events_name_occurred').on(table.eventName, table.occurredAt),
]);
