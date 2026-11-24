import { createClient } from "@supabase/supabase-js";

let client = null;

/**
 * Lazily create ONE shared Supabase client.
 * Returns null (instead of crashing the whole build/page) when env vars are missing.
 */
export function getSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key);
  return client;
}

/** Start Google sign-in and remember which role the user picked. */
export async function signInWithGoogle(role = "Customer") {
  const supabase = getSupabase();
  if (!supabase) {
    return { error: { message: "Google sign-in is not configured (missing Supabase env vars)." } };
  }
  sessionStorage.setItem("pendingRole", role);
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/auth/callback` },
  });
}
