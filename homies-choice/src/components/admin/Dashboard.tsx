"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, ImageOff, IndianRupee, Plus, Watch } from "lucide-react";
import { productTitle } from "@/data/products";
import { adminApi, AdminApiError, type Enquiry } from "@/lib/admin-client";
import { useAdminData } from "./AdminShell";
import { AdminPageHeader, Notice, Panel, Spinner } from "./ui";

export function Dashboard() {
  const { products, status, source, refresh, error } = useAdminData();
  const [enquiries, setEnquiries] = useState<Enquiry[] | null>(null);
  const [seedState, setSeedState] = useState<{ busy: boolean; msg?: string; tone?: "success" | "error" }>({ busy: false });

  useEffect(() => {
    adminApi.listEnquiries().then((r) => setEnquiries(r.enquiries)).catch(() => setEnquiries([]));
  }, []);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!products || !status) return <Spinner />;

  const live = products.filter((p) => p.published);
  const drafts = products.length - live.length;
  const watches = products.filter((p) => p.category === "watch").length;
  const unpriced = products.filter((p) => p.variants.some((v) => v.price == null));
  const noPhoto = products.filter((p) => p.images.length === 0);
  const openEnquiries = (enquiries ?? []).filter((e) => !e.handled);

  const stats = [
    { label: "Live products", value: live.length, note: drafts ? `${drafts} draft${drafts > 1 ? "s" : ""}` : "No drafts" },
    { label: "Fragrances", value: products.length - watches, note: "Perfumes in the catalogue" },
    { label: "Watches", value: watches, note: watches ? "In the watch edit" : "None added yet" },
    { label: "Open enquiries", value: enquiries ? openEnquiries.length : "–", note: status.database ? "From the contact form" : "Needs a database" },
  ];

  const seed = async () => {
    setSeedState({ busy: true });
    try {
      const r = await adminApi.seed();
      setSeedState({ busy: false, tone: "success", msg: `Imported ${r.count} products. You can now edit them.` });
      await refresh();
    } catch (err) {
      setSeedState({ busy: false, tone: "error", msg: err instanceof AdminApiError ? err.message : "Import failed." });
    }
  };

  return (
    <div className="space-y-10">
      <AdminPageHeader
        eyebrow="Overview"
        title="Good to see you."
        actions={
          <>
            <Link href="/hc-admin/products/new?category=fragrance" className="btn btn-dark min-h-0 h-10 px-4">
              <Plus className="h-4 w-4" /> Add perfume
            </Link>
            <Link href="/hc-admin/products/new?category=watch" className="btn btn-outline-dark min-h-0 h-10 px-4">
              <Watch className="h-4 w-4" /> Add watch
            </Link>
          </>
        }
      />

      {seedState.msg && <Notice tone={seedState.tone}>{seedState.msg}</Notice>}
      {status.database && !status.seeded && (
        <Panel title="Start with the current catalogue" description="Copy the seven reference fragrances from the website into your database so you can edit their prices, stock and photos.">
          <button type="button" onClick={seed} disabled={seedState.busy} className="btn btn-dark">
            {seedState.busy ? "Importing…" : "Import starter catalogue"}
          </button>
        </Panel>
      )}

      <dl className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-[1.5rem] border border-white/80 bg-white/75 p-5 shadow-[0_20px_50px_-35px_rgba(6,59,46,0.35)] backdrop-blur-xl md:p-6">
            <dt className="eyebrow text-[0.58rem] text-stone">{s.label}</dt>
            <dd className="mt-3 font-serif text-5xl leading-none tabular-nums">{s.value}</dd>
            <dd className="mt-2 text-xs text-stone">{s.note}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Needs a price" description="These show “Price on request” in the shop.">
          <TodoList
            icon={<IndianRupee className="h-4 w-4" />}
            items={unpriced.map((p) => ({ slug: p.slug, title: productTitle(p), meta: `${p.variants.filter((v) => v.price == null).length} option(s) without a price` }))}
            empty="Every product has a price."
          />
        </Panel>
        <Panel title="Needs a photograph" description="These show a “Photograph coming soon” card.">
          <TodoList
            icon={<ImageOff className="h-4 w-4" />}
            items={noPhoto.map((p) => ({ slug: p.slug, title: productTitle(p), meta: p.category === "watch" ? "Watch" : "Fragrance" }))}
            empty="Every product has a photograph."
          />
        </Panel>
      </div>

      <Panel title="Latest enquiries">
        {!enquiries ? (
          <Spinner />
        ) : enquiries.length === 0 ? (
          <p className="text-sm text-stone">
            {status.database ? "No enquiries yet. Messages sent through the contact form appear here." : "Enquiries are stored once a database is connected. They always reach you on WhatsApp."}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {enquiries.slice(0, 5).map((e) => (
              <li key={e.id} className="flex items-start justify-between gap-4 py-3 text-sm">
                <div className="min-w-0">
                  <p className="font-medium">{e.name} <span className="font-normal text-stone">· {e.phone}</span></p>
                  <p className="mt-0.5 truncate text-stone">{e.message}</p>
                </div>
                <time className="shrink-0 text-xs text-stone" dateTime={e.created_at}>
                  {new Date(e.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </time>
              </li>
            ))}
          </ul>
        )}
        <Link href="/hc-admin/enquiries" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold hover:text-emerald">
          All enquiries <ArrowRight className="h-4 w-4" />
        </Link>
      </Panel>

      <p className="text-xs text-stone">
        Catalogue source: {source === "database" ? "your database" : adminApi.isPreview ? "preview demo store" : "built-in starter catalogue (read-only)"}.
      </p>
    </div>
  );
}

function TodoList({ items, empty, icon }: { items: { slug: string; title: string; meta: string }[]; empty: string; icon: React.ReactNode }) {
  if (!items.length) return <p className="text-sm text-stone">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {items.slice(0, 6).map((i) => (
        <li key={i.slug}>
          <Link href={`/hc-admin/products/${i.slug}`} className="group flex items-center gap-3 py-2.5 text-sm">
            <span className="text-gold-deep">{icon}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-medium group-hover:text-emerald">{i.title}</span>
              <span className="block text-xs text-stone">{i.meta}</span>
            </span>
            <ArrowRight className="h-4 w-4 text-stone group-hover:text-emerald" />
          </Link>
        </li>
      ))}
      {items.length > 6 && <li className="pt-2.5 text-xs text-stone">+ {items.length - 6} more</li>}
    </ul>
  );
}
