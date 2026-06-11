/**
 * Server-side Supabase JWT verification for API routes.
 *
 * Identity must ONLY ever come from a verified JWT — never from the
 * request body or query string. Routes that need the caller's identity
 * call getAuthenticatedUser() and treat null as 401.
 */

import type { VercelRequest } from '@vercel/node';
import { createClient, type User } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.VITE_SUPABASE_URL!;

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY!;

export async function getAuthenticatedUser(
  req: VercelRequest
): Promise<User | null> {
  const header = req.headers.authorization;
  if (!header || Array.isArray(header)) return null;

  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const verifier = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await verifier.auth.getUser(match[1]);
  if (error || !data.user) return null;
  return data.user;
}
