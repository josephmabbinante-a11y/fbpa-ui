import express from 'express';

const router = express.Router();

router.post('/connect', (req, res) => {
  const payload = req.body || {};
  const provider = String(payload.provider || 'generic').trim();
  const accountId = String(payload.accountId || '').trim();

  if (!accountId) {
    return res.status(400).json({ error: 'accountId is required' });
  }

  return res.json({
    success: true,
    provider,
    accountId,
    connectedAt: new Date().toISOString(),
  });
});

export default router;
