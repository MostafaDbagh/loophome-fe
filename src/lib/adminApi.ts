import { adminSession } from "./adminSession";

export class AdminApiError extends Error {
  constructor(
    public status: number,
    public body: { error?: { code?: string; message?: string; details?: { path: string; message: string }[] } },
  ) {
    super(body.error?.message ?? `HTTP ${status}`);
  }
}

/** Calls /api/v1/admin/* with the stored token; a 401 signs the admin out. */
export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = adminSession.token();
  const lang = adminSession.lang();
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(`/api/v1${path}${sep}lang=${lang}`, {
    ...init,
    headers: {
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });
  if (res.status === 401) {
    adminSession.clear();
    window.location.replace(`/${lang}`);
    throw new AdminApiError(401, {});
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new AdminApiError(res.status, body);
  return body as T;
}
