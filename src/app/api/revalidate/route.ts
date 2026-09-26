import { revalidateTag } from "next/cache";
import { API_CACHE_TAG, API_URL } from "@/lib/api";

/**
 * Refreshes the public site after an admin change (services on/off, fees, contact details), instead
 * of waiting for the cache to expire. Only a signed-in admin may call it: the token is checked
 * against the API.
 */
export async function POST(request: Request) {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return Response.json({ ok: false }, { status: 401 });
  const me = await fetch(`${API_URL}/admin/auth/me`, { headers: { authorization: auth }, cache: "no-store" }).catch(() => null);
  if (!me?.ok) return Response.json({ ok: false }, { status: 401 });
  // expire 0: the next visit to any page re-fetches instead of serving the old version once more.
  revalidateTag(API_CACHE_TAG, { expire: 0 });
  return Response.json({ ok: true });
}
