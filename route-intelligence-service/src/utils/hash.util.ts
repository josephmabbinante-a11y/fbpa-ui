import crypto from 'crypto';

function normalizeToken(value: string): string {
  return String(value || '').trim().toUpperCase();
}

export function generateLaneId(originZip: string, destZip: string): string {
  return crypto
    .createHash('sha256')
    .update(`${normalizeToken(originZip)}-${normalizeToken(destZip)}`)
    .digest('hex');
}

export function extractZipToken(raw: string): string {
  const match = String(raw || '').match(/\b(\d{5})\b/);
  if (match?.[1]) return match[1];
  return normalizeToken(raw);
}
