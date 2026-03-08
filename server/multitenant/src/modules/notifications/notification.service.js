import { query } from '../../config/database.js';

export async function createNotification({ userId, type, message, link }) {
  await query(
    'INSERT INTO notifications (user_id, type, message, link) VALUES ($1,$2,$3,$4)',
    [userId, type, message, link || null]
  );
}

export async function createNotificationsForLoadPosted(load) {
  const carriers = await query(
    "SELECT id FROM users WHERE tenant_id = $1 AND role = 'CARRIER'",
    [load.tenant_id]
  );
  for (const row of carriers.rows) {
    await createNotification({
      userId: row.id,
      type: 'LOAD_POSTED',
      message: `New load posted: ${load.origin} → ${load.destination}`,
      link: `/loads/${load.id}`,
    });
  }
}

export async function getNotifications(userId) {
  const result = await query(
    'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
    [userId]
  );
  return result.rows;
}

export async function markRead(id, userId) {
  await query('UPDATE notifications SET read = true WHERE id = $1 AND user_id = $2', [id, userId]);
}
