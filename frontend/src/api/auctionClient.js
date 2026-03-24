import { apiUrl } from './apiUrl';
import { getAccessToken } from '../utils/authToken';

async function readJsonSafe(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export async function quoteSaiaAuction(load) {
  const token = getAccessToken();
  const res = await fetch(apiUrl('/api/rate-logic/saia/quote'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(load),
    credentials: 'include',
  });
  const payload = await readJsonSafe(res);
  if (!res.ok) {
    const message = payload?.error?.message || payload?.error || `Auction quote failed (${res.status})`;
    throw new Error(message);
  }
  return payload || {};
}

export async function getSaiaAuctionCircuit() {
  const token = getAccessToken();
  const res = await fetch(apiUrl('/health/saia'), {
    method: 'GET',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
  });
  const data = await readJsonSafe(res);
  if (!res.ok) {
    const message = data?.error?.message || data?.error || `Circuit check failed (${res.status})`;
    throw new Error(message);
  }
  return data?.circuit ?? data;
}
