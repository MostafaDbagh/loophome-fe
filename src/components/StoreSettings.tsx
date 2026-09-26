"use client";

import { createContext, useContext } from "react";
import type { PublicSettings } from "@/lib/api";

const StoreSettingsContext = createContext<PublicSettings | null>(null);

/** Public store settings (WhatsApp number, delivery fees) for client components. */
export function StoreSettingsProvider({ settings, children }: { settings: PublicSettings | null; children: React.ReactNode }) {
  return <StoreSettingsContext.Provider value={settings}>{children}</StoreSettingsContext.Provider>;
}

export const useStoreSettings = () => useContext(StoreSettingsContext);
