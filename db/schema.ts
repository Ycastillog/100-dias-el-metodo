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

export const purchaseOrders = sqliteTable('purchase_orders', {
  id: text('id').primaryKey(),
  sessionHash: text('session_hash').notNull(),
  planKey: text('plan_key').notNull(),
  amountCents: integer('amount_cents').notNull(),
  currency: text('currency').notNull().default('USD'),
  environment: text('environment').notNull(),
  contactEmail: text('contact_email').notNull(),
  paypalOrderId: text('paypal_order_id'),
  paypalCaptureId: text('paypal_capture_id'),
  captureRequestId: text('capture_request_id').notNull(),
  status: text('status').notNull().default('initiated'),
  deliveryStatus: text('delivery_status').notNull().default('not_ready'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
  paidAt: text('paid_at'),
}, table => [
  uniqueIndex('idx_purchase_orders_paypal_order').on(table.paypalOrderId),
  uniqueIndex('idx_purchase_orders_paypal_capture').on(table.paypalCaptureId),
  index('idx_purchase_orders_session_created').on(table.sessionHash, table.createdAt),
]);

export const paymentEvents = sqliteTable('payment_events', {
  id: text('id').primaryKey(),
  eventType: text('event_type').notNull(),
  orderId: text('order_id').references(() => purchaseOrders.id),
  processedAt: text('processed_at').notNull(),
});

export const participantRecords = sqliteTable('participant_records', {
  id: text('id').primaryKey(),
  orderId: text('order_id').notNull().references(() => purchaseOrders.id),
  recordKey: text('record_key').notNull(),
  body: text('body').notNull(),
  revision: integer('revision').notNull().default(1),
  updatedAt: text('updated_at').notNull(),
}, table => [uniqueIndex('idx_participant_records_order_key').on(table.orderId, table.recordKey)]);

// Short-lived abuse counters. Never store raw client IP addresses.
export const requestLimits = sqliteTable('request_limits', {
  bucket: text('bucket').primaryKey(),
  windowStart: integer('window_start').notNull(),
  hits: integer('hits').notNull(),
});
