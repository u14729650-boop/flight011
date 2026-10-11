"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, CalendarClock, Pencil, Plus } from "lucide-react";
import { isLive, placementLabels, type Banner, type BannerPlacement } from "@/data/banners";
import { adminApi, AdminApiError } from "@/lib/admin-client";
import { cx } from "@/lib/format";
import { useAdminData } from "./AdminShell";
import { AdminPageHeader, Badge, Notice, Spinner } from "./ui";

function status(b: Banner): { label: string; tone: "good" | "warn" | "neutral" } {
  if (!b.active) return { label: "Off", tone: "neutral" };
  if (isLive(b)) return { label: "Live", tone: "good" };
  if (b.startsAt && new Date(b.startsAt) > new Date()) return { label: "Scheduled", tone: "warn" };
  return { label: "Ended", tone: "neutral" };
}

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : null);

export function BannersManager() {
  const { status: shopStatus } = useAdminData();
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [source, setSource] = useState<"database" | "starter">("starter");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await adminApi.listBanners();
      setBanners(r.banners);
      setSource(r.source);
    } catch (e) {
      setError(e instanceof AdminApiError ? e.message : "Couldn't load banners.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const groups = useMemo(() => {
    const by: Record<BannerPlacement, Banner[]> = { home: [], shop: [] };
    for (const b of banners ?? []) by[b.placement].push(b);
    for (const k of Object.keys(by) as BannerPlacement[]) by[k].sort((a, b) => a.sortOrder - b.sortOrder);
    return by;
  }, [banners]);

  const canWrite = Boolean(shopStatus?.database) && source === "database";

  const move = async (placement: BannerPlacement, i: number, dir: -1 | 1) => {
    const list = [...groups[placement]];
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    const previous = banners;
    const order = new Map(list.map((b, k) => [b.id, k]));
    setBanners((all) => all && all.map((b) => (order.has(b.id) ? { ...b, sortOrder: order.get(b.id)! } : b)));
    setError(null);
    try {
      await adminApi.reorderBanners(list.map((b) => b.id));
    } catch (e) {
      setBanners(previous);
      setError(e instanceof AdminApiError ? e.message : "Couldn't reorder.");
    }
  };

  // Optimistic: flip immediately, roll back if the save fails.
  const toggle = async (b: Banner) => {
    const flip = (active: boolean) => setBanners((list) => list && list.map((x) => (x.id === b.id ? { ...x, active } : x)));
    flip(!b.active);
    setError(null);
    try {
      await adminApi.updateBanner(b.id, { ...b, active: !b.active });
    } catch (e) {
      flip(b.active);
      setError(e instanceof AdminApiError ? e.message : "Couldn't update.");
    }
  };

  return (
    <div className="space-y-8">
      <AdminPageHeader
        eyebrow="Website"
        title="Banners"
        actions={
          <>
            <Link href="/hc-admin/banners/new?placement=home" className={cx("btn btn-dark h-10 min-h-0 px-4", !canWrite && "pointer-events-none opacity-45")}>
              <Plus className="h-4 w-4" /> Home banner
            </Link>
            <Link href="/hc-admin/banners/new?placement=shop" className={cx("btn btn-outline-dark h-10 min-h-0 px-4", !canWrite && "pointer-events-none opacity-45")}>
              <Plus className="h-4 w-4" /> Shop banner
            </Link>
          </>
        }
      />
      {error && <Notice tone="error">{error}</Notice>}
      {!canWrite && banners && (
        <Notice>These are the starter banners shown on the site. Connect Supabase (README → “Admin panel”) to edit, schedule and add your own.</Notice>
      )}

      {!banners ? (
        <Spinner />
      ) : (
        (Object.keys(groups) as BannerPlacement[]).map((placement) => (
          <section key={placement} aria-labelledby={`bp-${placement}`} className="space-y-3">
            <div className="flex items-baseline justify-between">
              <h2 id={`bp-${placement}`} className="font-serif text-2xl">{placementLabels[placement]}</h2>
              <p className="text-xs text-stone">{groups[placement].filter((b) => isLive(b)).length} live</p>
            </div>
            {groups[placement].length === 0 ? (
              <p className="rounded-[1.5rem] border border-dashed border-line px-6 py-10 text-center text-sm text-stone">
                No banners here yet — this area is hidden on the site until you add one.
              </p>
            ) : (
              <ul className="space-y-3">
                {groups[placement].map((b, i) => {
                  const s = status(b);
                  return (
                    <li key={b.id} className={cx("flex flex-col gap-4 rounded-[1.5rem] border border-white/80 bg-white/75 p-3 backdrop-blur-xl sm:flex-row sm:items-center")}>
                      <div className="relative aspect-[16/7] w-full shrink-0 overflow-hidden rounded-2xl bg-forest sm:w-56">
                        {b.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.image.src} alt="" className="h-full w-full object-cover" loading="lazy" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge tone={s.tone}>{s.label}</Badge>
                          {(b.startsAt || b.endsAt) && (
                            <span className="inline-flex items-center gap-1 text-xs text-stone">
                              <CalendarClock className="h-3.5 w-3.5" /> {fmt(b.startsAt) ?? "Now"} → {fmt(b.endsAt) ?? "no end"}
                            </span>
                          )}
                        </div>
                        <p className="mt-1.5 truncate font-serif text-xl">{b.title}</p>
                        {b.ctaHref && <p className="truncate text-xs text-stone">Button: {b.ctaLabel} → {b.ctaHref}</p>}
                      </div>
                      <div className="flex items-center gap-1 self-end sm:self-center">
                        <button type="button" disabled={!canWrite || i === 0} onClick={() => move(placement, i, -1)} className="flex h-9 w-9 items-center justify-center rounded-full text-stone hover:bg-charcoal/5 disabled:opacity-30" aria-label={`Move “${b.title}” earlier`}>
                          <ArrowUp className="h-4 w-4" />
                        </button>
                        <button type="button" disabled={!canWrite || i === groups[placement].length - 1} onClick={() => move(placement, i, 1)} className="flex h-9 w-9 items-center justify-center rounded-full text-stone hover:bg-charcoal/5 disabled:opacity-30" aria-label={`Move “${b.title}” later`}>
                          <ArrowDown className="h-4 w-4" />
                        </button>
                        <label className={cx("ml-1 inline-flex cursor-pointer items-center gap-2 rounded-full border border-line px-3 py-1.5 text-xs", !canWrite && "pointer-events-none opacity-45")}>
                          <input type="checkbox" className="h-3.5 w-3.5 accent-emerald" checked={b.active} onChange={() => toggle(b)} disabled={!canWrite} />
                          Show
                          <span className="sr-only"> “{b.title}”</span>
                        </label>
                        <Link href={`/hc-admin/banners/${b.id}`} className={cx("ml-1 inline-flex h-9 items-center gap-1.5 rounded-full border border-line bg-white px-3 text-xs font-medium hover:border-charcoal", !canWrite && "pointer-events-none opacity-45")}>
                          <Pencil className="h-3.5 w-3.5" /> Edit<span className="sr-only"> “{b.title}”</span>
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ))
      )}
    </div>
  );
}
