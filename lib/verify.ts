import { createHash } from 'crypto';

/**
 * Verification answers are never stored in plain text. We keep salted SHA-256
 * hashes, so a database leak reveals nothing about her personal details.
 * The salt is per-install (env) — set VERIFY_SALT in Netlify.
 */
function salt() {
  return process.env.VERIFY_SALT || 'ringvault-dev-salt';
}

/** Normalize an answer so trivial differences don't cause false negatives. */
export function normalizeAnswer(v: string): string {
  return v.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function hashAnswer(v: string): string {
  const n = normalizeAnswer(v);
  if (!n) return '';
  return createHash('sha256').update(`${salt()}::${n}`).digest('hex');
}

/** Normalize a name for search: "Julia  Martin" → "juliamartin" */
export function nameKey(v: string): string {
  return v.trim().toLowerCase().replace(/\s+/g, ' ').replace(/[^a-z0-9 ]/g, '').replace(/ /g, '');
}

/** Constant-time-ish comparison for hashes. */
export function hashesMatch(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
