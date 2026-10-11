"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { defaultSettings, type StoreSettings } from "@/lib/store-settings";
import { whatsappFor } from "@/lib/whatsapp";

const StoreContext = createContext<StoreSettings>(defaultSettings);

/** Makes the owner's settings (dashboard) available to the shop's client components. */
export function StoreProvider({ settings, children }: { settings: StoreSettings; children: ReactNode }) {
  return <StoreContext.Provider value={settings}>{children}</StoreContext.Provider>;
}

export const useStore = () => useContext(StoreContext);

/** `wa(message?)` → a WhatsApp link to the shop's current number. */
export function useWhatsapp() {
  const settings = useStore();
  return useMemo(() => whatsappFor(settings), [settings]);
}
