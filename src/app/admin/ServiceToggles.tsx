"use client";

import { CarFront, HardHat, Store, Truck, Wrench } from "lucide-react";
import { useEffect, useState } from "react";
import { adminErrorText, adminFetch } from "@/lib/adminApi";
import { adminSession } from "@/lib/adminSession";
import { useAdmin } from "./AdminShell";

type Key = "shop" | "moving" | "technician" | "pickupRental" | "carRecovery";
type Settings = Partial<Record<Key, { enabled?: boolean }>> & { pickupRental?: { basePrice?: number | null } };

const SERVICES: { key: Key; icon: typeof Store }[] = [
  { key: "shop", icon: Store },
  { key: "moving", icon: Truck },
  { key: "technician", icon: Wrench },
  { key: "pickupRental", icon: HardHat },
  { key: "carRecovery", icon: CarFront },
];

/** Refresh the public pages now instead of when their cache expires (nav, home sections, sitemap). */
export async function refreshSite() {
  const token = adminSession.token();
  await fetch("/api/revalidate", { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {} }).catch(() => {});
}

/**
 * On/off switches for the customer services. Owner only (the API answers 403 for staff), so
 * staff see the current state read-only. Selling to LoopHome is never affected.
 */
export function ServiceToggles() {
  const { t, admin } = useAdmin();
  const owner = admin.role === "owner";
  const [state, setState] = useState<Record<Key, boolean> | null>(null);
  const [priceSet, setPriceSet] = useState(true);
  const [busy, setBusy] = useState<Key | null>(null);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    adminFetch<Settings>("/admin/settings")
      .then((s) => {
        // Missing = on for the first three (settings saved before the switch existed), off for the newer ones.
        setState({
          shop: s.shop?.enabled !== false,
          moving: s.moving?.enabled !== false,
          technician: s.technician?.enabled !== false,
          pickupRental: s.pickupRental?.enabled === true,
          carRecovery: s.carRecovery?.enabled === true,
        });
        setPriceSet(s.pickupRental?.basePrice != null);
      })
      .catch((e) => setMessage({ ok: false, text: adminErrorText(e, t.error) }));
  }, [t.error]);

  async function toggle(key: Key) {
    if (!state || !owner) return;
    const next = !state[key];
    if (!next && !window.confirm(t.serviceSwitch.confirmOff[key])) return;
    setBusy(key);
    setMessage(null);
    try {
      await adminFetch("/admin/settings", { method: "PATCH", body: JSON.stringify({ [key]: { enabled: next } }) });
      setState({ ...state, [key]: next });
      await refreshSite();
      setMessage({ ok: true, text: t.saved });
    } catch (e) {
      setMessage({ ok: false, text: adminErrorText(e, t.error) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold">{t.serviceSwitch.title}</h2>
        {!owner && <p className="text-xs text-muted">{t.serviceSwitch.ownerOnly}</p>}
      </div>
      {!state ? (
        <p className="text-sm text-muted">{message?.text ?? t.loading}</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-3">
          {SERVICES.map(({ key, icon: Icon }) => {
            const on = state[key];
            return (
              <li key={key} className={`flex items-start gap-3 rounded-lg border p-4 ${on ? "border-border" : "border-dashed border-ink/30 bg-beige/50"}`}>
                <Icon aria-hidden className="mt-0.5 size-5 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{t.serviceSwitch.names[key]}</p>
                  <p className={`mt-0.5 text-xs ${on ? "text-green-700" : "text-muted"}`}>
                    {on ? t.serviceSwitch.on[key] : t.serviceSwitch.off}
                  </p>
                  {key === "pickupRental" && !on && !priceSet && <p className="mt-0.5 text-xs text-muted">{t.serviceSwitch.needsPrice}</p>}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={t.serviceSwitch.names[key]}
                  disabled={!owner || busy !== null}
                  onClick={() => toggle(key)}
                  className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:cursor-not-allowed disabled:opacity-60 ${on ? "bg-ink" : "bg-ink/20"}`}
                >
                  <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? "start-[22px]" : "start-0.5"}`} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
      {state && message && <p className={`mt-3 text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>}
      <p className="mt-3 text-xs text-muted">{t.serviceSwitch.sellNote}</p>
    </section>
  );
}
