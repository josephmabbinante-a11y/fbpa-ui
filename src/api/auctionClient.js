import { apiUrl } from './apiUrl';

export async function quoteSaiaAuction(load) {
  const res = await fetch(apiUrl('/api/rate-logic/saia/quote'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(load),
    credentials: 'include',
  });
  return res.json();
}

export async function getSaiaAuctionCircuit() {
  const res = await fetch(apiUrl('/health/saia'), {
    method: 'GET',
    credentials: 'include',
  });
  const data = await res.json();
  return data?.circuit ?? data;
}
