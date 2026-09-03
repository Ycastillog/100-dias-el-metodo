export function participantStore(db) {
  const stmt = (sql, values) => db.prepare(sql).bind(...values);
  const parse = row => row ? { key: row.record_key, body: JSON.parse(row.body), revision: row.revision, updatedAt: row.updated_at } : null;
  return {
    async all(orderId) {
      const rows = await stmt('SELECT record_key, body, revision, updated_at FROM participant_records WHERE order_id = ? ORDER BY record_key', [orderId]).all();
      return rows.results.map(parse);
    },
    async get(orderId, key) {
      return parse(await stmt('SELECT record_key, body, revision, updated_at FROM participant_records WHERE order_id = ? AND record_key = ?', [orderId, key]).first());
    },
    async save(orderId, key, body, revision) {
      const updated = new Date().toISOString();
      const returned = ' RETURNING record_key, body, revision, updated_at';
      const row = revision === 0
        ? await stmt(`INSERT INTO participant_records (id, order_id, record_key, body, revision, updated_at)
            VALUES (?, ?, ?, ?, 1, ?) ON CONFLICT(order_id, record_key) DO NOTHING` + returned, [crypto.randomUUID(), orderId, key, JSON.stringify(body), updated]).first()
        : await stmt(`UPDATE participant_records SET body = ?, revision = revision + 1, updated_at = ?
            WHERE order_id = ? AND record_key = ? AND revision = ?` + returned, [JSON.stringify(body), updated, orderId, key, revision]).first();
      // Return precisely the version written by this statement, not a later
      // version another device might write between UPDATE and a separate SELECT.
      return parse(row);
    },
  };
}

export function validateRecord(key, body, maxDays) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return null;
  const text = (field, max, required = false) => typeof body[field] === 'string' && body[field].length <= max && (!required || body[field].trim());
  const only = fields => Object.keys(body).every(key => fields.includes(key));
  const dose = () => [2, 10, 20].includes(body.minutes) && ['low', 'steady', 'high'].includes(body.energy);
  if (key === 'profile') {
    if (!only(['goal', 'firstStep', 'lifeArea', 'minutes', 'energy']) || !text('goal', 500, true) || !text('firstStep', 500) || !dose() || !['mentalidad', 'bienestar', 'profesional', 'finanzas', 'relaciones'].includes(body.lifeArea)) return null;
  } else {
    const match = /^(day|review):([1-9]\d{0,2})$/.exec(key);
    const day = Number(match?.[2]);
    if (!match || day > maxDays) return null;
    if (match[1] === 'day') {
      if (!only(['state', 'action', 'notes', 'obstacle', 'nextStep', 'minutes', 'energy']) || !['complete', 'partial', 'missed'].includes(body.state) || !text('action', 500, true) || !text('notes', 4000) || !text('obstacle', 1000) || !text('nextStep', 500) || !dose()) return null;
    } else if (!(day % 7 === 0 || day === maxDays) || !only(['worked', 'difficult', 'nextStep']) || !text('worked', 1500) || !text('difficult', 1500) || !text('nextStep', 1500, true)) return null;
  }
  // Store an ordinary JSON object, never executable markup or an object prototype.
  return JSON.parse(JSON.stringify(body));
}
