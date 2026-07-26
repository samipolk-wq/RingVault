import { createHash } from 'crypto';
function salt() {
  return process.env.VERIFY_SALT || 'ringvault-dev-salt';
}
export function normalizeAnswer(v: string): string {
  return v.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}
export function hashAnswer(v: string): string {
  const n = normalizeAnswer(v);
  if (!n) return '';
  return createHash('sha256').update(salt() + '::' + n).digest('hex');
}
export function nameKey(v: string): string {
  return v.trim().toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/ /g, '');
}
export function hashesMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
