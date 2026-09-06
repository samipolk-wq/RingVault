import type { SupabaseClient } from '@supabase/supabase-js';

// Only a token verified by Supabase may establish ownership. Never accept
// user IDs or email addresses from request bodies as proof of identity.
export async function requestUser(req: Request, db: SupabaseClient) {
  const header = req.headers.get('authorization');
  if (!header) return null;
  const match = /^Bearer (\S+)$/i.exec(header);
  if (!match) throw new Error('Please sign in again.');
  const { data, error } = await db.auth.getUser(match[1]);
  if (error || !data.user) throw new Error('Please sign in again.');
  return data.user;
}
