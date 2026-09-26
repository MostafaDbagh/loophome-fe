/** API error body: { error: { code, message, details? } } */
export type SubmitError = { code?: string; message?: string; details?: { path: string; message: string }[] };

export type SubmitResult<T> = { ok: true; data: T } | { ok: false; error: SubmitError };

async function send<T>(url: string, init: RequestInit): Promise<SubmitResult<T>> {
  try {
    const res = await fetch(url, { method: "POST", ...init });
    const body = await res.json().catch(() => null);
    if (res.ok) return { ok: true, data: body as T };
    return { ok: false, error: (body?.error as SubmitError) ?? {} };
  } catch {
    return { ok: false, error: {} };
  }
}

export const submitJson = <T>(url: string, data: unknown) =>
  send<T>(url, { headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });

export const submitForm = <T>(url: string, data: FormData) => send<T>(url, { body: data });
