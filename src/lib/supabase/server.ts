import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

// Client Supabase pour Server Actions / Server Components — lit et écrit
// la session via les cookies Next.js. Clé publishable uniquement (jamais
// la clé secret, qui reste dans musicAPI).
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component (pas une Server Action) :
            // pas grave, le proxy/middleware rafraîchit la session si besoin.
          }
        },
      },
    }
  );
}
