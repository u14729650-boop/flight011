// In-memory router used by the browser-only preview build (replaces Next's router).
import { useMemo, useSyncExternalStore } from "react";

type Loc = { path: string; search: string };
let loc: Loc = { path: "/", search: "" };
const listeners = new Set<() => void>();

export function navigate(href: string, opts: { scroll?: boolean } = {}) {
  const url = new URL(href, "https://preview.local" + loc.path);
  loc = { path: url.pathname.replace(/\/+$/, "") || "/", search: url.search.replace(/^\?/, "") };
  listeners.forEach((l) => l());
  if (opts.scroll !== false) window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useLocation(): Loc {
  return useSyncExternalStore(subscribe, () => loc, () => loc);
}

export function usePathname() {
  return useLocation().path;
}

export function useSearchParams() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

const router = {
  push: (href: string, o?: { scroll?: boolean }) => navigate(href, o),
  replace: (href: string, o?: { scroll?: boolean }) => navigate(href, o),
  back: () => {},
  forward: () => {},
  refresh: () => {},
  prefetch: () => {},
};
export function useRouter() {
  return router;
}

export function notFound(): never {
  throw new Error("NEXT_NOT_FOUND");
}
