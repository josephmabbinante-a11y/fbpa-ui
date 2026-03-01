import { query } from '../../config/database.js';
import { AppError } from '../../utils/errorHandler.js';
import { createNotification } from '../notifications/notification.service.js';

export async function listBids(loadId, tenantId) {
  const result = await query(
    'SELECT * FROM load_bids WHERE load_id = $1 AND tenant_id = $2 ORDER BY created_at DESC',
    [loadId, tenantId]
  );
  return result.rows;
}

export async function submitBid(loadId, tenantId, carrierId, bidAmount, message) {
  const loadResult = await query(
    "SELECT * FROM loads WHERE id = $1 AND tenant_id = $2 AND status = 'posted' AND bidding_enabled = true",
    [loadId, tenantId]
  );
  if (!loadResult.rows[0]) throw new AppError('Load is not available for bidding', 400, 'INVALID_STATE');

  const carrierResult = await query(
    'SELECT * FROM carriers WHERE id = $1 AND tenant_id = $2 AND approved = true',
    [carrierId, tenantId]
  );
  if (!carrierResult.rows[0]) throw new AppError('Carrier not found or not approved', 403, 'CARRIER_NOT_APPROVED');

  const result = await query(
    'INSERT INTO load_bids (load_id, tenant_id, carrier_id, bid_amount, message) VALUES ($1,$2,$3,$4,$5) RETURNING *',
    [loadId, tenantId, carrierId, bidAmount, message || null]
  );
  const bid = result.rows[0];

  const opsUsers = await query(
    "SELECT id FROM users WHERE tenant_id = $1 AND role IN ('TENANT_ADMIN','OPS')",
    [tenantId]
  );
  for (const user of opsUsers.rows) {
    await createNotification({
      userId: user.id,
      type: 'BID_SUBMITTED',
      message: `New bid of $${bidAmount} submitted for load ${loadId}`,
      link: `/loads/${loadId}/bids`,
    });
  }

  return bid;
}

export async function acceptBid(bidId, tenantId) {
  const bidResult = await query(
    "SELECT * FROM load_bids WHERE id = $1 AND tenant_id = $2 AND status = 'pending'",
    [bidId, tenantId]
  );
  const bid = bidResult.rows[0];
  if (!bid) throw new AppError('Bid not found or not pending', 404, 'NOT_FOUND');

  await query("UPDATE load_bids SET status = 'accepted' WHERE id = $1", [bidId]);
  await query(
    "UPDATE load_bids SET status = 'rejected' WHERE load_id = $1 AND id != $2 AND status = 'pending'",
    [bid.load_id, bidId]
  );
  await query(
    "UPDATE loads SET status = 'awarded' WHERE id = $1 AND tenant_id = $2",
    [bid.load_id, tenantId]
  );

  const winnerUser = await query(
    "SELECT u.id FROM users u WHERE u.tenant_id = $1 AND u.role = 'CARRIER' LIMIT 1",
    [tenantId]
  );
  if (winnerUser.rows[0]) {
    await createNotification({
      userId: winnerUser.rows[0].id,
      type: 'BID_ACCEPTED',
      message: `Your bid on load ${bid.load_id} was accepted`,
      link: `/loads/${bid.load_id}`,
    });
  }

  const result = await query('SELECT * FROM load_bids WHERE id = $1', [bidId]);
  return result.rows[0];
}

export async function rejectBid(bidId, tenantId) {
  const result = await query(
    "UPDATE load_bids SET status = 'rejected' WHERE id = $1 AND tenant_id = $2 AND status = 'pending' RETURNING *",
    [bidId, tenantId]
  );
  if (!result.rows[0]) throw new AppError('Bid not found or not pending', 404, 'NOT_FOUND');
  return result.rows[0];
}
