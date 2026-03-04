import { apiUrl } from './apiUrl';

export async function quoteSaiaAuction(load) {
  const res = await fetch(apiUrl('/multitenant/saia/quote'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(load),
    credentials: 'include',
  });
  return res.json();
}

export async function getSaiaAuctionCircuit() {
  const res = await fetch(apiUrl('/multitenant/saia/circuit'), {
    method: 'GET',
    credentials: 'include',
  });
  return res.json();
}
