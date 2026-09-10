import { createBrowserClient } from "@supabase/ssr";

// Client Supabase pour Client Components — session dans les cookies du
// navigateur, synchronisée avec le client serveur. Utilisé aussi pour
// l'upload direct des fichiers audio vers Supabase Storage.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
