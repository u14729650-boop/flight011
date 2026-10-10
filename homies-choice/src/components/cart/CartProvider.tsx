"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  addItem,
  CART_STORAGE_KEY,
  changeVariant,
  removeItem,
  sanitize,
  setQty,
  summarize,
  type CartItem,
  type CartSummary,
} from "@/lib/cart";

interface CartContextValue extends CartSummary {
  items: CartItem[];
  hydrated: boolean;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (slug: string, variantId: string, qty?: number, opts?: { openDrawer?: boolean }) => void;
  updateQty: (key: string, qty: number) => void;
  updateVariant: (key: string, variantId: string) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

function readStorage(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? sanitize(JSON.parse(raw)) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  // Skip writing back the state we just read from storage.
  const skipWrite = useRef(true);

  useEffect(() => {
    setItems(readStorage());
    setHydrated(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === CART_STORAGE_KEY) {
        skipWrite.current = true;
        setItems(readStorage());
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (skipWrite.current) {
      skipWrite.current = false;
      return;
    }
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage full or disabled — the bag still works for this visit */
    }
  }, [items, hydrated]);

  const add = useCallback<CartContextValue["add"]>((slug, variantId, qty = 1, opts) => {
    setItems((prev) => addItem(prev, slug, variantId, qty));
    if (opts?.openDrawer !== false) setIsOpen(true);
  }, []);

  const value = useMemo<CartContextValue>(
    () => ({
      ...summarize(items),
      items,
      hydrated,
      isOpen,
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      add,
      updateQty: (key, qty) => setItems((prev) => setQty(prev, key, qty)),
      updateVariant: (key, variantId) => setItems((prev) => changeVariant(prev, key, variantId)),
      remove: (key) => setItems((prev) => removeItem(prev, key)),
      clear: () => setItems([]),
    }),
    [items, hydrated, isOpen, add],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
