import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./database.types";

/** Browser client for Client Components — respects the caller's session (RLS applies). */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
