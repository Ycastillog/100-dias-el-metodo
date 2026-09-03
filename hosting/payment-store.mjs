// One prepared SQL statement per call. Schema changes live only in migrations.
export function paymentStore(db) {
  if (!db?.prepare || !db?.batch) throw new Error('database_unavailable');
  const statement = (sql, values) => db.prepare(sql).bind(...values);
  return {
    byId(id) { return statement('SELECT * FROM purchase_orders WHERE id = ?', [id]).first(); },
    byPayPal(id) { return statement('SELECT * FROM purchase_orders WHERE paypal_order_id = ?', [id]).first(); },
    byCapture(id) { return statement('SELECT * FROM purchase_orders WHERE paypal_capture_id = ?', [id]).first(); },
    eventSeen(id) { return statement('SELECT id FROM payment_events WHERE id = ?', [id]).first(); },
    async create(order) {
      await statement(`INSERT INTO purchase_orders
        (id, session_hash, plan_key, amount_cents, currency, environment, contact_email, capture_request_id, status, delivery_status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'initiated', 'not_ready', ?, ?) ON CONFLICT(id) DO NOTHING`,
      [order.id, order.session_hash, order.plan_key, order.amount_cents, order.currency, order.environment, order.contact_email, order.capture_request_id, order.created_at, order.created_at]).run();
      return this.byId(order.id);
    },
    async recentCount(sessionHash, since) {
      return (await statement('SELECT COUNT(*) AS total FROM purchase_orders WHERE session_hash = ? AND created_at > ?', [sessionHash, since]).first())?.total ?? 0;
    },
    async setPayPal(orderId, paypalId, now) {
      await statement("UPDATE purchase_orders SET paypal_order_id = ?, status = 'created', updated_at = ? WHERE id = ? AND paypal_order_id IS NULL", [paypalId, now, orderId]).run();
    },
    async reconcile(order, capture, status, now, event) {
      // A delayed COMPLETED notification must never reactivate a refunded order.
      // A delayed PENDING notification must not downgrade a completed purchase.
      const writes = [statement(`UPDATE purchase_orders SET
        paypal_capture_id = ?,
        status = CASE
          WHEN status IN ('refunded', 'reversed', 'review') THEN status
          WHEN status = 'paid' AND ? IN ('pending', 'denied') THEN status ELSE ? END,
        delivery_status = CASE WHEN ? IN ('refunded', 'reversed', 'review') THEN 'revoked' ELSE delivery_status END,
        paid_at = CASE WHEN ? = 'paid' THEN COALESCE(paid_at, ?) ELSE paid_at END,
        updated_at = ? WHERE id = ?`, [capture.id, status, status, status, status, now, now, order.id])];
      if (event) writes.push(statement('INSERT INTO payment_events (id, event_type, order_id, processed_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO NOTHING', [event.id, event.event_type, order.id, now]));
      await db.batch(writes);
      return this.byId(order.id);
    },
    async markEvent(event, now) {
      await statement('INSERT INTO payment_events (id, event_type, order_id, processed_at) VALUES (?, ?, NULL, ?) ON CONFLICT(id) DO NOTHING', [event.id, event.event_type, now]).run();
    },
  };
}
