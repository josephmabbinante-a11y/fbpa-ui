import { getAccessToken } from '../utils/authToken';
import { isMockModeEnabled } from '../utils/mockMode';

const RAW_API_URL = import.meta.env.VITE_API_URL;
const API_URL = import.meta.env.PROD
  ? ''
  : (RAW_API_URL ? RAW_API_URL.replace(/\/+$/, '') : '');

function apiUrl(path) {
  return `${API_URL}${path}`;
}

function authHeaders() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// ─── Provider configuration ───
export const TELEPHONY_PROVIDERS = {
  twilio: { label: 'Twilio', fields: ['accountSid', 'authToken', 'fromNumber'] },
  bandwidth: { label: 'Bandwidth', fields: ['accountId', 'apiToken', 'applicationId', 'fromNumber'] },
  vonage: { label: 'Vonage (Nexmo)', fields: ['apiKey', 'apiSecret', 'fromNumber'] },
  telnyx: { label: 'Telnyx', fields: ['apiKey', 'connectionId', 'fromNumber'] },
  custom: { label: 'Custom SIP / API', fields: ['endpoint', 'apiKey'] },
};

// ─── Mock call log ───
const mockCallLog = [
  { id: 'call-1', direction: 'outbound', to: '+1 (555) 012-3456', toName: 'Swift Logistics', duration: 142, status: 'completed', startedAt: new Date(Date.now() - 3600000).toISOString(), loadId: 'L-1001' },
  { id: 'call-2', direction: 'inbound', from: '+1 (555) 987-6543', fromName: 'J&R Carriers', duration: 87, status: 'completed', startedAt: new Date(Date.now() - 7200000).toISOString(), loadId: 'L-1003' },
  { id: 'call-3', direction: 'outbound', to: '+1 (555) 444-7890', toName: 'ABC Freight', duration: 0, status: 'no-answer', startedAt: new Date(Date.now() - 10800000).toISOString(), loadId: null },
];

let mockActiveCall = null;

// ─── API functions ───

/** Initiate an outbound call */
export async function startCall({ to, toName, loadId, provider }) {
  if (isMockModeEnabled()) {
    const call = {
      id: `call-${Date.now()}`,
      direction: 'outbound',
      to,
      toName: toName || to,
      loadId: loadId || null,
      status: 'ringing',
      startedAt: new Date().toISOString(),
      duration: 0,
    };
    mockActiveCall = call;
    // Simulate connection after 1.5s
    setTimeout(() => {
      if (mockActiveCall?.id === call.id) {
        mockActiveCall = { ...mockActiveCall, status: 'in-progress' };
      }
    }, 1500);
    return { ok: true, call };
  }
  const res = await fetch(apiUrl('/api/telephony/calls'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ to, toName, loadId, provider }),
  });
  if (!res.ok) throw new Error(`Call initiation failed: ${res.status}`);
  return res.json();
}

/** End an active call */
export async function endCall(callId) {
  if (isMockModeEnabled()) {
    if (mockActiveCall) {
      const completed = {
        ...mockActiveCall,
        status: 'completed',
        duration: Math.floor((Date.now() - new Date(mockActiveCall.startedAt).getTime()) / 1000),
      };
      mockCallLog.unshift(completed);
      mockActiveCall = null;
      return { ok: true, call: completed };
    }
    return { ok: true, call: null };
  }
  const res = await fetch(apiUrl(`/api/telephony/calls/${encodeURIComponent(callId)}/end`), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
  });
  if (!res.ok) throw new Error(`End call failed: ${res.status}`);
  return res.json();
}

/** Get the active call status */
export async function getActiveCall() {
  if (isMockModeEnabled()) {
    return { call: mockActiveCall };
  }
  const res = await fetch(apiUrl('/api/telephony/calls/active'), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Get active call failed: ${res.status}`);
  return res.json();
}

/** Get recent call log */
export async function getCallLog({ limit = 20 } = {}) {
  if (isMockModeEnabled()) {
    return { calls: mockCallLog.slice(0, limit) };
  }
  const res = await fetch(apiUrl(`/api/telephony/calls?limit=${limit}`), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Get call log failed: ${res.status}`);
  return res.json();
}

/** Save / update telephony provider configuration */
export async function saveTelephonyConfig(config) {
  if (isMockModeEnabled()) {
    return { ok: true, config };
  }
  const res = await fetch(apiUrl('/api/telephony/config'), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error(`Save config failed: ${res.status}`);
  return res.json();
}

/** Get telephony provider configuration */
export async function getTelephonyConfig() {
  if (isMockModeEnabled()) {
    return { provider: 'twilio', configured: false };
  }
  const res = await fetch(apiUrl('/api/telephony/config'), {
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(`Get config failed: ${res.status}`);
  return res.json();
}
