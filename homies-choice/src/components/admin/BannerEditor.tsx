"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ImagePlus, Monitor, Smartphone, Trash2 } from "lucide-react";
import { placementLabels, type Banner, type BannerImage, type BannerPlacement } from "@/data/banners";
import { adminApi, AdminApiError } from "@/lib/admin-client";
import { parseBannerInput, type BannerErrors } from "@/lib/banner-schema";
import { cx } from "@/lib/format";
import { BannerCarousel } from "@/components/banners/BannerCarousel";
import { useAdminData } from "./AdminShell";
import { AdminPageHeader, FieldError, FieldLabel, inputClass, Notice, Panel, Spinner } from "./ui";

// Survives the remount when a new banner gets its id after saving.
let flash: { tone: "success" | "error"; text: string } | null = null;

const toLocal = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function empty(placement: BannerPlacement): Banner {
  return {
    id: "",
    placement,
    eyebrow: "",
    title: "",
    subtitle: "",
    ctaLabel: "",
    ctaHref: "",
    image: null,
    mobileImage: null,
    theme: "dark",
    startsAt: null,
    endsAt: null,
    active: true,
    sortOrder: 0,
  };
}

function readSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => resolve({ width: 1600, height: 900 });
    img.src = url;
  });
}

export function BannerEditor({ id, initialPlacement = "home" }: { id?: string; initialPlacement?: BannerPlacement }) {
  const router = useRouter();
  const { status } = useAdminData();
  const [draft, setDraft] = useState<Banner | null>(id ? null : empty(initialPlacement));
  const [missing, setMissing] = useState(false);
  const [errors, setErrors] = useState<BannerErrors>({});
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(() => {
    const f = flash;
    flash = null;
    return f;
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<"image" | "mobileImage" | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const desktopRef = useRef<HTMLInputElement>(null);
  const mobileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!id) return;
    adminApi
      .listBanners()
      .then((r) => {
        const b = r.banners.find((x) => x.id === id);
        if (b) setDraft(b);
        else setMissing(true);
      })
      .catch(() => setMissing(true));
  }, [id]);

  if (missing) {
    return (
      <div className="space-y-6">
        <Notice tone="error">This banner doesn&rsquo;t exist (it may have been deleted).</Notice>
        <Link href="/hc-admin/banners" className="text-sm underline">Back to banners</Link>
      </div>
    );
  }
  if (!draft || !status) return <Spinner />;
  const canWrite = status.database;

  const set = <K extends keyof Banner>(key: K, value: Banner[K]) => {
    setDraft((d) => (d ? { ...d, [key]: value } : d));
    setErrors((e) => ({ ...e, [key]: "" }));
  };

  const upload = async (which: "image" | "mobileImage", files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setUploading(which);
    setMessage(null);
    try {
      const size = await readSize(file);
      const { src } = await adminApi.uploadImage(file, "banners");
      const img: BannerImage = { src, alt: draft.title || "Homies Choice banner", ...size };
      set(which, img);
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof AdminApiError ? e.message : "Upload failed." });
    } finally {
      setUploading(null);
      (which === "image" ? desktopRef : mobileRef).current!.value = "";
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const { banner, errors: found } = parseBannerInput(draft, { allowDataImages: adminApi.isPreview });
    setErrors(found);
    if (Object.keys(found).length) return setMessage({ tone: "error", text: "Please fix the highlighted fields." });
    setSaving(true);
    setMessage(null);
    try {
      if (id) {
        const r = await adminApi.updateBanner(id, banner);
        setDraft(r.banner);
        setMessage({ tone: "success", text: "Saved. The website is updated." });
      } else {
        const r = await adminApi.createBanner(banner);
        flash = { tone: "success", text: "Saved. The website is updated." };
        router.replace(`/hc-admin/banners/${r.banner.id}`);
        return;
      }
    } catch (err) {
      if (err instanceof AdminApiError && err.errors) setErrors(err.errors);
      setMessage({ tone: "error", text: err instanceof AdminApiError ? err.message : "Couldn't save." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await adminApi.deleteBanner(id);
      router.replace("/hc-admin/banners");
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof AdminApiError ? e.message : "Couldn't delete." });
      setSaving(false);
    }
  };

  const previewBanner: Banner = { ...draft, id: "preview", title: draft.title || "Your headline here" };

  const imageField = (which: "image" | "mobileImage", label: string, hint: string, Icon: typeof Monitor, ref: React.RefObject<HTMLInputElement | null>) => {
    const img = draft[which];
    return (
      <div>
        <p className="flex items-center gap-2 text-sm font-medium"><Icon className="h-4 w-4 text-gold-deep" /> {label}</p>
        <p className="mt-0.5 text-xs text-stone">{hint}</p>
        <div className={cx("mt-3 overflow-hidden rounded-2xl border border-line bg-ivory", which === "image" ? "aspect-[21/8]" : "aspect-[4/5] max-w-[12rem]")}>
          {img ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={img.src} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-xs text-stone">No image</div>
          )}
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <input ref={ref} id={`b-${which}`} type="file" accept="image/jpeg,image/png,image/webp,image/avif" className="sr-only" onChange={(e) => upload(which, e.target.files)} disabled={!canWrite || !!uploading} />
          <label htmlFor={`b-${which}`} className={cx("btn btn-outline-dark min-h-9 py-2 cursor-pointer px-4", (!canWrite || uploading) && "pointer-events-none opacity-45")}>
            <ImagePlus className="h-4 w-4" /> {uploading === which ? "Uploading…" : img ? "Replace" : "Upload"}
          </label>
          {img && which === "mobileImage" && (
            <button type="button" onClick={() => set("mobileImage", null)} className="text-xs font-medium text-stone hover:text-[#9b2c2c]">Remove</button>
          )}
        </div>
        <FieldError id={`b-${which}-err`} message={errors[which]} />
      </div>
    );
  };

  return (
    <form onSubmit={save} className="space-y-8" noValidate aria-label="Banner editor">
      <Link href="/hc-admin/banners" className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-stone uppercase hover:text-charcoal">
        <ArrowLeft className="h-3.5 w-3.5" /> Banners
      </Link>
      <AdminPageHeader
        eyebrow={id ? "Edit banner" : "New banner"}
        title={draft.title || "Untitled banner"}
        actions={
          <button type="submit" disabled={saving || !canWrite} className="btn btn-dark min-h-10 py-2 px-5">
            {saving ? "Saving…" : "Save"}
          </button>
        }
      />
      {!canWrite && <Notice>Editing is disabled until a database is connected.</Notice>}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <Panel title="Live preview" description="How it looks on the website (wide screen). On phones the text sits at the bottom.">
        <div className="-mx-5 md:-mx-7 [&_section]:!px-0 [&_section]:!pt-0">
          <BannerCarousel banners={[previewBanner]} variant={draft.placement} label="Banner preview" />
        </div>
      </Panel>

      <div className="grid gap-8 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-8">
          <Panel title="Where & what">
            <div className="grid gap-5 sm:grid-cols-2">
              <fieldset className="sm:col-span-2">
                <legend className="eyebrow text-[0.6rem] text-stone">Placement</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(placementLabels) as BannerPlacement[]).map((p) => (
                    <button key={p} type="button" aria-pressed={draft.placement === p} onClick={() => set("placement", p)} className={cx("rounded-full border px-4 py-2 text-sm transition-colors", draft.placement === p ? "border-emerald bg-emerald text-ivory" : "border-line bg-white hover:border-charcoal")}>
                      {placementLabels[p]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div>
                <FieldLabel htmlFor="b-eyebrow" hint="optional">Small label</FieldLabel>
                <input id="b-eyebrow" className={inputClass} value={draft.eyebrow ?? ""} onChange={(e) => set("eyebrow", e.target.value)} placeholder="e.g. New arrivals" maxLength={60} />
              </div>
              <div>
                <FieldLabel htmlFor="b-title">Headline</FieldLabel>
                <input id="b-title" className={inputClass} value={draft.title} onChange={(e) => set("title", e.target.value)} maxLength={90} aria-invalid={!!errors.title} aria-describedby="b-title-err" />
                <FieldError id="b-title-err" message={errors.title} />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="b-subtitle" hint="optional">Supporting text</FieldLabel>
                <textarea id="b-subtitle" rows={2} className={inputClass} value={draft.subtitle ?? ""} onChange={(e) => set("subtitle", e.target.value)} maxLength={220} />
              </div>
              <div>
                <FieldLabel htmlFor="b-cta" hint="optional">Button text</FieldLabel>
                <input id="b-cta" className={inputClass} value={draft.ctaLabel ?? ""} onChange={(e) => set("ctaLabel", e.target.value)} placeholder="e.g. Shop now" maxLength={40} aria-invalid={!!errors.ctaLabel} />
                <FieldError id="b-cta-err" message={errors.ctaLabel} />
              </div>
              <div>
                <FieldLabel htmlFor="b-href" hint="optional">Button link</FieldLabel>
                <input id="b-href" list="b-pages" className={inputClass} value={draft.ctaHref ?? ""} onChange={(e) => set("ctaHref", e.target.value)} placeholder="/collections/arabic" aria-invalid={!!errors.ctaHref} aria-describedby="b-href-err" />
                <datalist id="b-pages">
                  {["/shop", "/watches", "/collections/bestsellers", "/collections/arabic", "/collections/designer", "/collections/men", "/collections/women", "/collections/unisex", "/contact"].map((p) => <option key={p} value={p} />)}
                </datalist>
                <FieldError id="b-href-err" message={errors.ctaHref} />
              </div>
              <fieldset className="sm:col-span-2">
                <legend className="eyebrow text-[0.6rem] text-stone">Text style</legend>
                <div className="mt-2 flex gap-2">
                  {(["dark", "light"] as const).map((t) => (
                    <button key={t} type="button" aria-pressed={draft.theme === t} onClick={() => set("theme", t)} className={cx("rounded-full border px-4 py-2 text-sm transition-colors", draft.theme === t ? "border-emerald bg-emerald text-ivory" : "border-line bg-white hover:border-charcoal")}>
                      {t === "dark" ? "Light text on dark glass" : "Dark text on light glass"}
                    </button>
                  ))}
                </div>
              </fieldset>
            </div>
          </Panel>

          <Panel title="Images" description="JPG, PNG, WebP or AVIF up to 6 MB. Use photographs you own or are licensed to use.">
            <div className="grid gap-8 md:grid-cols-[1fr_12rem]">
              {imageField("image", "Wide image", "Shown on tablets and computers. About 2400 × 900 px works best.", Monitor, desktopRef)}
              {imageField("mobileImage", "Phone image (optional)", "Portrait, about 1080 × 1350 px.", Smartphone, mobileRef)}
            </div>
          </Panel>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <Panel title="Visibility">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald" checked={draft.active} onChange={(e) => set("active", e.target.checked)} />
              <span>
                <span className="font-medium">Show on the website</span>
                <span className="block text-xs text-stone">Untick to hide it without deleting.</span>
              </span>
            </label>
            <div className="mt-5 space-y-4">
              <div>
                <FieldLabel htmlFor="b-start" hint="optional">Start showing</FieldLabel>
                <input id="b-start" type="datetime-local" className={inputClass} value={toLocal(draft.startsAt)} onChange={(e) => set("startsAt", e.target.value ? new Date(e.target.value).toISOString() : null)} />
                <FieldError id="b-start-err" message={errors.startsAt} />
              </div>
              <div>
                <FieldLabel htmlFor="b-end" hint="optional">Stop showing</FieldLabel>
                <input id="b-end" type="datetime-local" className={inputClass} value={toLocal(draft.endsAt)} onChange={(e) => set("endsAt", e.target.value ? new Date(e.target.value).toISOString() : null)} aria-invalid={!!errors.endsAt} />
                <FieldError id="b-end-err" message={errors.endsAt} />
              </div>
              <p className="text-xs text-stone">Scheduled changes appear within a few minutes of the chosen time.</p>
            </div>
          </Panel>
          {id && canWrite && (
            <Panel title="Delete">
              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="text-sm">Delete this banner permanently?</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={remove} disabled={saving} className="btn min-h-10 py-2 bg-[#9b2c2c] px-4 text-white hover:bg-[#7f1d1d]">Delete</button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-outline-dark min-h-10 py-2 px-4">Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="inline-flex items-center gap-2 text-sm font-semibold text-[#9b2c2c] hover:underline">
                  <Trash2 className="h-4 w-4" /> Delete banner…
                </button>
              )}
            </Panel>
          )}
        </aside>
      </div>

      <div className="glass-light sticky bottom-4 z-30 flex justify-end gap-2 rounded-full !border-line/70 !bg-ivory/80 p-2 shadow-[0_24px_50px_-24px_rgba(6,59,46,0.55)] *:flex-1 sm:px-3 sm:py-3 sm:*:flex-none">
        <Link href="/hc-admin/banners" className="btn btn-outline-dark min-h-11 py-2.5 px-5">Cancel</Link>
        <button type="submit" disabled={saving || !canWrite} className="btn btn-dark min-h-11 py-2.5 px-6">{saving ? "Saving…" : "Save banner"}</button>
      </div>
    </form>
  );
}
