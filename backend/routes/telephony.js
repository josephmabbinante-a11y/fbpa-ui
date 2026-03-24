import express from 'express';
import { Call, TelephonyConfig } from '../models/Telephony.js';

const router = express.Router();

// ─── Provider SDKs (lazy-loaded to avoid hard dependency) ───
// Each provider adapter must implement: initCall(config, { to, from }) → { callSid }
// and endCall(config, callSid) → void

const PROVIDER_ADAPTERS = {
  async twilio(config, action, payload) {
    const twilio = await import('twilio').then(m => m.default).catch(() => null);
    if (!twilio) throw new Error('Twilio SDK not installed. Run: npm install twilio');
    const client = twilio(config.credentials?.accountSid, config.credentials?.authToken);
    if (action === 'call') {
      const call = await client.calls.create({
        to: payload.to,
        from: config.fromNumber || config.credentials?.fromNumber,
        url: config.webhookUrl || 'http://demo.twilio.com/docs/voice.xml',
      });
      return { callSid: call.sid };
    }
    if (action === 'end') {
      await client.calls(payload.callSid).update({ status: 'completed' });
      return {};
    }
  },

  async bandwidth(config, action, payload) {
    // Bandwidth REST API via fetch
    const base = 'https://voice.bandwidth.com/api/v2';
    const accountId = config.credentials?.accountId;
    const headers = {
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + Buffer.from(`${config.credentials?.apiToken}:${config.credentials?.apiSecret || ''}`).toString('base64'),
    };
    if (action === 'call') {
      const res = await fetch(`${base}/accounts/${encodeURIComponent(accountId)}/calls`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          from: config.fromNumber || config.credentials?.fromNumber,
          to: payload.to,
          applicationId: config.credentials?.applicationId,
          answerUrl: config.webhookUrl || 'https://example.com/answer',
        }),
      });
      if (!res.ok) throw new Error(`Bandwidth call failed: ${res.status}`);
      const data = await res.json();
      return { callSid: data.callId };
    }
    if (action === 'end') {
      await fetch(`${base}/accounts/${encodeURIComponent(accountId)}/calls/${encodeURIComponent(payload.callSid)}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ state: 'completed' }),
      });
      return {};
    }
  },

  async vonage(config, action, payload) {
    const base = 'https://api.nexmo.com/v1/calls';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(`${config.credentials?.apiKey}:${config.credentials?.apiSecret}`).toString('base64')}`,
    };
    if (action === 'call') {
      const res = await fetch(base, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          to: [{ type: 'phone', number: payload.to }],
          from: { type: 'phone', number: config.fromNumber || config.credentials?.fromNumber },
          answer_url: [config.webhookUrl || 'https://example.com/answer'],
        }),
      });
      if (!res.ok) throw new Error(`Vonage call failed: ${res.status}`);
      const data = await res.json();
      return { callSid: data.uuid };
    }
    if (action === 'end') {
      await fetch(`${base}/${encodeURIComponent(payload.callSid)}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ action: 'hangup' }),
      });
      return {};
    }
  },

  async telnyx(config, action, payload) {
    const base = 'https://api.telnyx.com/v2/calls';
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.credentials?.apiKey}`,
    };
    if (action === 'call') {
      const res = await fetch(base, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          connection_id: config.credentials?.connectionId,
          to: payload.to,
          from: config.fromNumber || config.credentials?.fromNumber,
        }),
      });
      if (!res.ok) throw new Error(`Telnyx call failed: ${res.status}`);
      const data = await res.json();
      return { callSid: data.data?.call_control_id };
    }
    if (action === 'end') {
      await fetch(`${base}/${encodeURIComponent(payload.callSid)}/actions/hangup`, {
        method: 'POST',
        headers,
        body: JSON.stringify({}),
      });
      return {};
    }
  },

  async custom(config, action, payload) {
    const endpoint = config.credentials?.endpoint;
    if (!endpoint) throw new Error('Custom provider endpoint not configured');
    const headers = {
      'Content-Type': 'application/json',
    };
    if (config.credentials?.apiKey) {
      headers['X-API-Key'] = config.credentials.apiKey;
    }
    if (action === 'call') {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'call', to: payload.to, from: config.fromNumber }),
      });
      if (!res.ok) throw new Error(`Custom provider call failed: ${res.status}`);
      const data = await res.json();
      return { callSid: data.callId || data.callSid || data.id };
    }
    if (action === 'end') {
      await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'hangup', callId: payload.callSid }),
      });
      return {};
    }
  },
};

// ─── Helpers ───
function getTenantId(req) {
  return req.user?.tenantId || req.headers['x-tenant-id'] || 'default';
}

function sanitizePhone(raw) {
  return String(raw || '').replace(/[^\d+\-() ]/g, '').trim();
}

// ─── Routes ───

// POST /api/telephony/calls — initiate outbound call
router.post('/calls', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { to, toName, loadId, provider: requestedProvider } = req.body || {};
    const sanitizedTo = sanitizePhone(to);
    if (!sanitizedTo) return res.status(400).json({ error: 'Phone number is required' });

    // Load tenant telephony configuration
    const config = await TelephonyConfig.findOne({ tenantId }).lean();
    const providerKey = requestedProvider || config?.provider || 'twilio';
    const adapter = PROVIDER_ADAPTERS[providerKey];
    if (!adapter) return res.status(400).json({ error: `Unsupported provider: ${providerKey}` });

    // Create call record
    const call = new Call({
      direction: 'outbound',
      to: sanitizedTo,
      toName: toName || null,
      loadId: loadId || null,
      status: 'ringing',
      provider: providerKey,
      startedAt: new Date(),
      userId: req.user?.id || req.user?.email || 'unknown',
      tenantId,
    });

    // Attempt provider call if configured
    if (config?.configured && config?.credentials) {
      try {
        const result = await adapter(config, 'call', { to: sanitizedTo });
        call.providerCallSid = result?.callSid;
        call.status = 'in-progress';
      } catch (providerErr) {
        console.error(`[telephony] Provider ${providerKey} call error:`, providerErr.message);
        call.status = 'ringing'; // still save record even if provider fails
      }
    }

    await call.save();
    res.status(201).json({ ok: true, call });
  } catch (err) {
    console.error('[telephony] POST /calls error:', err.message);
    res.status(500).json({ error: 'Failed to initiate call' });
  }
});

// POST /api/telephony/calls/:id/end — end an active call
router.post('/calls/:id/end', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const call = await Call.findOne({ _id: req.params.id, tenantId });
    if (!call) return res.status(404).json({ error: 'Call not found' });

    // End via provider if we have a SID
    if (call.providerCallSid) {
      const config = await TelephonyConfig.findOne({ tenantId }).lean();
      const adapter = PROVIDER_ADAPTERS[call.provider];
      if (adapter && config?.configured) {
        try {
          await adapter(config, 'end', { callSid: call.providerCallSid });
        } catch (providerErr) {
          console.error(`[telephony] Provider end-call error:`, providerErr.message);
        }
      }
    }

    call.status = 'completed';
    call.endedAt = new Date();
    call.duration = Math.floor((call.endedAt.getTime() - call.startedAt.getTime()) / 1000);
    await call.save();

    res.json({ ok: true, call });
  } catch (err) {
    console.error('[telephony] POST /calls/:id/end error:', err.message);
    res.status(500).json({ error: 'Failed to end call' });
  }
});

// GET /api/telephony/calls/active — get the current active call
router.get('/calls/active', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const call = await Call.findOne({
      tenantId,
      status: { $in: ['ringing', 'in-progress'] },
    }).sort({ startedAt: -1 }).lean();
    res.json({ call: call || null });
  } catch (err) {
    console.error('[telephony] GET /calls/active error:', err.message);
    res.status(500).json({ error: 'Failed to get active call' });
  }
});

// GET /api/telephony/calls — recent call log
router.get('/calls', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const calls = await Call.find({ tenantId })
      .sort({ startedAt: -1 })
      .limit(limit)
      .lean();
    res.json({ calls });
  } catch (err) {
    console.error('[telephony] GET /calls error:', err.message);
    res.status(500).json({ error: 'Failed to get call log' });
  }
});

// GET /api/telephony/config — get telephony configuration
router.get('/config', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const config = await TelephonyConfig.findOne({ tenantId }).lean();
    if (!config) {
      return res.json({ provider: 'twilio', configured: false });
    }
    // Never expose raw credentials to the client
    const safeConfig = {
      provider: config.provider,
      configured: config.configured,
      fromNumber: config.fromNumber || '',
      webhookUrl: config.webhookUrl || '',
      hasCredentials: Boolean(config.credentials && Object.keys(config.credentials).length > 0),
    };
    res.json(safeConfig);
  } catch (err) {
    console.error('[telephony] GET /config error:', err.message);
    res.status(500).json({ error: 'Failed to get configuration' });
  }
});

// PUT /api/telephony/config — save telephony configuration
router.put('/config', async (req, res) => {
  try {
    const tenantId = getTenantId(req);
    const { provider, fromNumber, webhookUrl, ...credentialFields } = req.body || {};

    const allowedProviders = ['twilio', 'bandwidth', 'vonage', 'telnyx', 'custom'];
    if (provider && !allowedProviders.includes(provider)) {
      return res.status(400).json({ error: `Invalid provider. Allowed: ${allowedProviders.join(', ')}` });
    }

    // Build credentials object from known fields only (prevent injection of arbitrary keys)
    const knownCredFields = ['accountSid', 'authToken', 'accountId', 'apiToken', 'apiSecret', 'applicationId', 'apiKey', 'connectionId', 'endpoint', 'fromNumber'];
    const credentials = {};
    for (const key of knownCredFields) {
      if (typeof credentialFields[key] === 'string' && credentialFields[key].trim()) {
        credentials[key] = credentialFields[key].trim();
      }
    }

    const update = {
      provider: provider || 'twilio',
      configured: Object.keys(credentials).length > 0,
      fromNumber: sanitizePhone(fromNumber) || '',
      webhookUrl: (webhookUrl || '').trim(),
    };

    // Only overwrite credentials if new ones were provided
    if (Object.keys(credentials).length > 0) {
      update.credentials = credentials;
    }

    const config = await TelephonyConfig.findOneAndUpdate(
      { tenantId },
      { $set: update },
      { upsert: true, new: true, runValidators: true }
    );

    res.json({ ok: true, config: { provider: config.provider, configured: config.configured } });
  } catch (err) {
    console.error('[telephony] PUT /config error:', err.message);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// POST /api/telephony/webhook — inbound call / status webhook (for providers to call back)
router.post('/webhook', async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('[telephony] Webhook received:', JSON.stringify(payload).slice(0, 500));

    // Handle status updates for existing calls
    const callSid = payload.CallSid || payload.callSid || payload.call_control_id || payload.uuid;
    if (callSid) {
      const call = await Call.findOne({ providerCallSid: callSid });
      if (call) {
        const statusMap = {
          completed: 'completed',
          'call.hangup': 'completed',
          busy: 'failed',
          'no-answer': 'no-answer',
          failed: 'failed',
          ringing: 'ringing',
          'in-progress': 'in-progress',
          answered: 'in-progress',
        };
        const rawStatus = (payload.CallStatus || payload.status || payload.event_type || '').toLowerCase();
        const mappedStatus = statusMap[rawStatus];
        if (mappedStatus) {
          call.status = mappedStatus;
          if (mappedStatus === 'completed' || mappedStatus === 'failed' || mappedStatus === 'no-answer') {
            call.endedAt = new Date();
            call.duration = Math.floor((call.endedAt.getTime() - call.startedAt.getTime()) / 1000);
          }
          await call.save();
        }
      }
    }

    // Handle inbound calls
    if (payload.Direction === 'inbound' || payload.direction === 'inbound') {
      const tenantId = payload.tenantId || 'default';
      const inboundCall = new Call({
        direction: 'inbound',
        from: payload.From || payload.from || '',
        fromName: payload.CallerName || payload.caller_name || '',
        status: 'ringing',
        provider: payload.provider || 'twilio',
        providerCallSid: callSid,
        startedAt: new Date(),
        tenantId,
      });
      await inboundCall.save();
    }

    res.status(200).json({ ok: true });
  } catch (err) {
    console.error('[telephony] Webhook error:', err.message);
    res.status(200).json({ ok: true }); // Always 200 to provider
  }
});

export default router;
