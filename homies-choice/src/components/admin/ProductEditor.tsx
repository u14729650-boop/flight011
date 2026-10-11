"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, Plus, Trash2 } from "lucide-react";
import type { Availability, Product, ProductCategory, ProductImage as Img } from "@/data/products";
import { fragranceFamilies, moods, type FragranceFamily, type Gender, type Mood, type Origin } from "@/data/taxonomy";
import { adminApi, AdminApiError } from "@/lib/admin-client";
import { availabilityLabel, cx } from "@/lib/format";
import { parseProductInput, slugify, type ProductErrors } from "@/lib/product-schema";
import { useAdminData } from "./AdminShell";
import { AdminPageHeader, FieldError, FieldLabel, inputClass, Notice, Panel, Spinner } from "./ui";

interface DraftVariant {
  key: string;
  id: string;
  label: string;
  sizeMl: string;
  price: string;
  compareAtPrice: string;
  availability: Availability;
}

interface Draft {
  category: ProductCategory;
  brand: string;
  name: string;
  slug: string;
  slugTouched: boolean;
  gender: Gender;
  origin: Origin | "";
  concentration: string;
  families: FragranceFamily[];
  moods: Mood[];
  description: string;
  notesTop: string;
  notesHeart: string;
  notesBase: string;
  notesSource: string;
  specs: { key: string; label: string; value: string }[];
  images: Img[];
  variants: DraftVariant[];
  bestseller: boolean;
  published: boolean;
  pendingVerification: string;
}

const WATCH_SPEC_LABELS = ["Movement", "Case size", "Case material", "Dial", "Strap", "Water resistance", "Glass", "Warranty"];
const SPEC_EXAMPLES: Record<string, string> = {
  Movement: "e.g. Automatic",
  "Case size": "e.g. 40 mm",
  "Case material": "e.g. Stainless steel",
  Dial: "e.g. Green sunburst",
  Strap: "e.g. Brown leather",
  "Water resistance": "e.g. 50 m",
  Glass: "e.g. Sapphire crystal",
  Warranty: "e.g. 1 year",
};
let keySeq = 0;
// Survives the remount when a new product's address changes after saving.
let flash: { tone: "success" | "error"; text: string } | null = null;
const k = () => `k${++keySeq}`;

function emptyVariant(category: ProductCategory): DraftVariant {
  return { key: k(), id: "", label: "", sizeMl: category === "fragrance" ? "100" : "", price: "", compareAtPrice: "", availability: "on_request" };
}

function toDraft(p: Product | null, category: ProductCategory): Draft {
  if (!p) {
    return {
      category,
      brand: "",
      name: "",
      slug: "",
      slugTouched: false,
      gender: category === "watch" ? "men" : "unisex",
      origin: category === "fragrance" ? "arabic" : "",
      concentration: category === "fragrance" ? "Eau de Parfum" : "",
      families: [],
      moods: [],
      description: "",
      notesTop: "",
      notesHeart: "",
      notesBase: "",
      notesSource: "",
      specs: category === "watch" ? ["Movement", "Case size", "Strap"].map((label) => ({ key: k(), label, value: "" })) : [],
      images: [],
      variants: [emptyVariant(category)],
      bestseller: false,
      published: true,
      pendingVerification: "",
    };
  }
  return {
    category: p.category,
    brand: p.brand,
    name: p.name,
    slug: p.slug,
    slugTouched: true,
    gender: p.gender,
    origin: p.origin ?? "",
    concentration: p.concentration ?? "",
    families: p.families,
    moods: p.moods,
    description: p.description,
    notesTop: p.notes?.top.join(", ") ?? "",
    notesHeart: p.notes?.heart.join(", ") ?? "",
    notesBase: p.notes?.base.join(", ") ?? "",
    notesSource: p.notes?.source ?? "",
    specs: p.specs.map((s) => ({ key: k(), ...s })),
    images: p.images,
    variants: p.variants.map((v) => ({
      key: k(),
      id: v.id,
      label: v.label ?? "",
      sizeMl: v.sizeMl?.toString() ?? "",
      price: v.price?.toString() ?? "",
      compareAtPrice: v.compareAtPrice?.toString() ?? "",
      availability: v.availability,
    })),
    bestseller: p.bestseller,
    published: p.published,
    pendingVerification: p.pendingVerification ?? "",
  };
}

const split = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);

function toInput(d: Draft) {
  return {
    category: d.category,
    brand: d.brand,
    name: d.name,
    slug: d.slug,
    gender: d.gender,
    origin: d.origin || null,
    concentration: d.concentration,
    families: d.families,
    moods: d.moods,
    description: d.description,
    notes: { top: split(d.notesTop), heart: split(d.notesHeart), base: split(d.notesBase), source: d.notesSource },
    specs: d.specs.map(({ label, value }) => ({ label, value })),
    images: d.images,
    variants: d.variants.map(({ id, label, sizeMl, price, compareAtPrice, availability }) => ({
      id,
      label,
      sizeMl: d.category === "watch" ? null : sizeMl,
      price,
      compareAtPrice,
      availability,
    })),
    bestseller: d.bestseller,
    published: d.published,
    pendingVerification: d.pendingVerification,
  };
}

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => resolve({ width: 1200, height: 1500 });
    img.src = url;
  });
}

export function ProductEditor({ slug, initialCategory = "fragrance" }: { slug?: string; initialCategory?: ProductCategory }) {
  const router = useRouter();
  const { products, status, refresh } = useAdminData();
  const existing = useMemo(() => (slug ? products?.find((p) => p.slug === slug) ?? null : null), [products, slug]);
  const [draft, setDraft] = useState<Draft | null>(slug ? null : toDraft(null, initialCategory));
  const [errors, setErrors] = useState<ProductErrors>({});
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(() => {
    const f = flash;
    flash = null;
    return f;
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [imageUrl, setImageUrl] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (slug && existing && !draft) setDraft(toDraft(existing, existing.category));
  }, [slug, existing, draft]);

  const canWrite = Boolean(status?.database);

  if (!products || !status) return <Spinner />;
  if (slug && !existing) {
    return (
      <div className="space-y-6">
        <Notice tone="error">This product doesn&rsquo;t exist (it may have been deleted or renamed).</Notice>
        <Link href="/hc-admin/products" className="text-sm underline">Back to products</Link>
      </div>
    );
  }
  if (!draft) return <Spinner />;

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) => {
    setDraft((d) => {
      if (!d) return d;
      const next = { ...d, [key]: value };
      if ((key === "brand" || key === "name") && !d.slugTouched) next.slug = slugify(`${next.brand} ${next.name}`);
      return next;
    });
    setErrors((e) => ({ ...e, [key]: "" }));
  };
  const setVariant = (key: string, patch: Partial<DraftVariant>) =>
    setDraft((d) => d && { ...d, variants: d.variants.map((v) => (v.key === key ? { ...v, ...patch } : v)) });
  const toggleIn = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const err = (key: string) => errors[key];
  const isWatch = draft.category === "watch";

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    setMessage(null);
    try {
      const added: Img[] = [];
      for (const file of Array.from(files).slice(0, 6)) {
        const size = await readImageSize(file);
        const { src } = await adminApi.uploadImage(file, draft.slug || slugify(`${draft.brand} ${draft.name}`) || "product");
        added.push({ src, alt: `${draft.brand} ${draft.name}`.trim(), ...size });
      }
      setDraft((d) => d && { ...d, images: [...d.images, ...added] });
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof AdminApiError ? e.message : "Upload failed." });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const addImageUrl = () => {
    const src = imageUrl.trim();
    if (!/^https:\/\//.test(src)) return setMessage({ tone: "error", text: "Image links must start with https://" });
    setDraft((d) => d && { ...d, images: [...d.images, { src, alt: `${d.brand} ${d.name}`.trim(), width: 1200, height: 1500 }] });
    setImageUrl("");
  };

  const moveImage = (i: number, dir: -1 | 1) =>
    setDraft((d) => {
      if (!d) return d;
      const images = [...d.images];
      const j = i + dir;
      if (j < 0 || j >= images.length) return d;
      [images[i], images[j]] = [images[j], images[i]];
      return { ...d, images };
    });

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    const { product, errors: found } = parseProductInput(toInput(draft));
    setErrors(found);
    if (Object.keys(found).length) {
      setMessage({ tone: "error", text: "Please fix the highlighted fields." });
      return;
    }
    setSaving(true);
    try {
      if (slug) await adminApi.updateProduct(slug, product);
      else await adminApi.createProduct(product);
      await refresh();
      const done = { tone: "success" as const, text: product.published ? "Saved. The shop is updated." : "Saved as a draft (hidden from the shop)." };
      if (product.slug !== slug) {
        flash = done;
        router.replace(`/hc-admin/products/${product.slug}`);
        return;
      }
      setMessage(done);
      setDraft(toDraft(product, product.category));
    } catch (e2) {
      if (e2 instanceof AdminApiError && e2.errors) setErrors(e2.errors);
      setMessage({ tone: "error", text: e2 instanceof AdminApiError ? e2.message : "Couldn't save." });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!slug) return;
    setSaving(true);
    try {
      await adminApi.deleteProduct(slug);
      await refresh();
      router.replace("/hc-admin/products");
    } catch (e) {
      setMessage({ tone: "error", text: e instanceof AdminApiError ? e.message : "Couldn't delete." });
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="space-y-8" noValidate aria-label="Product editor">
      <Link href="/hc-admin/products" className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.1em] text-stone uppercase hover:text-charcoal">
        <ArrowLeft className="h-3.5 w-3.5" /> Products
      </Link>
      <AdminPageHeader
        eyebrow={slug ? (isWatch ? "Edit watch" : "Edit fragrance") : isWatch ? "New watch" : "New fragrance"}
        title={draft.name || (isWatch ? "Untitled watch" : "Untitled fragrance")}
        actions={
          <>
            {slug && draft.published && (
              <a href={`/products/${slug}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline-dark h-10 min-h-0 px-4">View in shop</a>
            )}
            <button type="submit" disabled={saving || !canWrite} className="btn btn-dark h-10 min-h-0 px-5">
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        }
      />

      {!canWrite && <Notice>Editing is disabled until a database is connected. You can still review the catalogue.</Notice>}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <div className="grid gap-8 xl:grid-cols-[1fr_20rem]">
        <div className="min-w-0 space-y-8">
          <Panel title="Basics">
            <div className="grid gap-5 sm:grid-cols-2">
              {!slug && (
                <fieldset className="sm:col-span-2">
                  <legend className="eyebrow text-[0.6rem] text-stone">Category</legend>
                  <div className="mt-2 flex gap-2">
                    {(["fragrance", "watch"] as ProductCategory[]).map((c) => (
                      <button
                        key={c}
                        type="button"
                        aria-pressed={draft.category === c}
                        onClick={() => setDraft(toDraft(null, c))}
                        className={cx("border px-4 py-2 text-sm", draft.category === c ? "border-emerald bg-emerald text-ivory" : "border-line bg-white hover:border-charcoal")}
                      >
                        {c === "watch" ? "Watch" : "Fragrance"}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <div>
                <FieldLabel htmlFor="p-brand">Brand</FieldLabel>
                <input id="p-brand" className={inputClass} value={draft.brand} onChange={(e) => set("brand", e.target.value)} aria-invalid={!!err("brand")} aria-describedby="p-brand-err" placeholder={isWatch ? "e.g. Titan" : "e.g. Lattafa"} />
                <FieldError id="p-brand-err" message={err("brand")} />
              </div>
              <div>
                <FieldLabel htmlFor="p-name">{isWatch ? "Model name" : "Fragrance name"}</FieldLabel>
                <input id="p-name" className={inputClass} value={draft.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!err("name")} aria-describedby="p-name-err" />
                <FieldError id="p-name-err" message={err("name")} />
              </div>
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="p-slug" hint="Used in the page address">Web address</FieldLabel>
                <div className="mt-1.5 flex items-stretch border border-line bg-white focus-within:border-emerald">
                  <span className="flex items-center bg-ivory px-3 text-xs text-stone">/products/</span>
                  <input
                    id="p-slug"
                    className="min-w-0 flex-1 px-3 py-2.5 text-sm focus:outline-none"
                    value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: slugify(e.target.value), slugTouched: true })}
                    aria-invalid={!!err("slug")}
                    aria-describedby="p-slug-err"
                  />
                </div>
                <FieldError id="p-slug-err" message={err("slug")} />
              </div>
              <div>
                <FieldLabel htmlFor="p-gender">For</FieldLabel>
                <select id="p-gender" className={inputClass} value={draft.gender} onChange={(e) => set("gender", e.target.value as Gender)}>
                  <option value="men">Men</option>
                  <option value="women">Women</option>
                  <option value="unisex">Unisex</option>
                </select>
              </div>
              {!isWatch && (
                <div>
                  <FieldLabel htmlFor="p-origin">Type</FieldLabel>
                  <select id="p-origin" className={inputClass} value={draft.origin} onChange={(e) => set("origin", e.target.value as Origin)} aria-invalid={!!err("origin")}>
                    <option value="arabic">Arabic perfume</option>
                    <option value="designer">Designer fragrance</option>
                  </select>
                  <FieldError id="p-origin-err" message={err("origin")} />
                </div>
              )}
              {!isWatch && (
                <div className="sm:col-span-2">
                  <FieldLabel htmlFor="p-conc">Concentration</FieldLabel>
                  <input id="p-conc" list="conc-list" className={inputClass} value={draft.concentration} onChange={(e) => set("concentration", e.target.value)} />
                  <datalist id="conc-list">
                    {["Eau de Parfum", "Eau de Toilette", "Parfum", "Extrait de Parfum", "Eau de Cologne", "Attar / Perfume Oil"].map((c) => <option key={c} value={c} />)}
                  </datalist>
                </div>
              )}
              <div className="sm:col-span-2">
                <FieldLabel htmlFor="p-desc">Description</FieldLabel>
                <textarea id="p-desc" rows={4} className={inputClass} value={draft.description} onChange={(e) => set("description", e.target.value)} aria-invalid={!!err("description")} aria-describedby="p-desc-err" />
                <FieldError id="p-desc-err" message={err("description")} />
              </div>
            </div>
          </Panel>

          <Panel title={isWatch ? "Options & prices" : "Sizes & prices"} description="Leave the price empty to show “Price on request”. Prices are in rupees.">
            {err("variants") && <div className="mb-4"><Notice tone="error">{err("variants")}</Notice></div>}
            <div className="space-y-3">
              {draft.variants.map((v, i) => (
                <div key={v.key} className="grid grid-cols-2 gap-3 border border-line bg-ivory/50 p-3 md:grid-cols-[1fr_1fr_1fr_1.2fr_auto] md:items-end">
                  {isWatch ? (
                    <div className="col-span-2 md:col-span-1">
                      <FieldLabel htmlFor={`v-label-${v.key}`}>Option</FieldLabel>
                      <input id={`v-label-${v.key}`} className={inputClass} value={v.label} onChange={(e) => setVariant(v.key, { label: e.target.value })} placeholder="e.g. Black dial · Steel" />
                    </div>
                  ) : (
                    <div>
                      <FieldLabel htmlFor={`v-size-${v.key}`}>Size (ml)</FieldLabel>
                      <input id={`v-size-${v.key}`} inputMode="numeric" className={inputClass} value={v.sizeMl} onChange={(e) => setVariant(v.key, { sizeMl: e.target.value })} aria-invalid={!!err(`variants.${i}.sizeMl`)} />
                      <FieldError id={`v-size-err-${v.key}`} message={err(`variants.${i}.sizeMl`)} />
                    </div>
                  )}
                  <div>
                    <FieldLabel htmlFor={`v-price-${v.key}`}>Price (₹)</FieldLabel>
                    <input id={`v-price-${v.key}`} inputMode="decimal" className={inputClass} value={v.price} onChange={(e) => setVariant(v.key, { price: e.target.value })} placeholder="On request" aria-invalid={!!err(`variants.${i}.price`)} />
                    <FieldError id={`v-price-err-${v.key}`} message={err(`variants.${i}.price`)} />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`v-cmp-${v.key}`} hint="optional">Was (₹)</FieldLabel>
                    <input id={`v-cmp-${v.key}`} inputMode="decimal" className={inputClass} value={v.compareAtPrice} onChange={(e) => setVariant(v.key, { compareAtPrice: e.target.value })} aria-invalid={!!err(`variants.${i}.compareAtPrice`)} />
                    <FieldError id={`v-cmp-err-${v.key}`} message={err(`variants.${i}.compareAtPrice`)} />
                  </div>
                  <div>
                    <FieldLabel htmlFor={`v-stock-${v.key}`}>Stock</FieldLabel>
                    <select id={`v-stock-${v.key}`} className={inputClass} value={v.availability} onChange={(e) => setVariant(v.key, { availability: e.target.value as Availability })}>
                      {(Object.keys(availabilityLabel) as Availability[]).map((a) => (
                        <option key={a} value={a}>{availabilityLabel[a]}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, variants: draft.variants.filter((x) => x.key !== v.key) })}
                    disabled={draft.variants.length === 1}
                    className="inline-flex h-10 w-10 items-center justify-center justify-self-end border border-line bg-white text-stone hover:text-[#9b2c2c] disabled:opacity-30"
                    aria-label="Remove this option"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setDraft({ ...draft, variants: [...draft.variants, emptyVariant(draft.category)] })} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:text-emerald">
              <Plus className="h-4 w-4" /> Add {isWatch ? "option" : "size"}
            </button>
          </Panel>

          <Panel title="Photographs" description="Use authentic product photos. The first photo is the main image. JPG, PNG, WebP or AVIF up to 6 MB.">
            {draft.images.length > 0 && (
              <ul className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {draft.images.map((img, i) => (
                  <li key={img.src + i} className="border border-line bg-white p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.src} alt={img.alt} className="aspect-[4/5] w-full bg-ivory object-contain" />
                    <label className="mt-2 block">
                      <span className="sr-only">Alt text for image {i + 1}</span>
                      <input
                        className="w-full border-b border-line py-1 text-xs focus:border-emerald focus:outline-none"
                        value={img.alt}
                        onChange={(e) => setDraft({ ...draft, images: draft.images.map((x, j) => (j === i ? { ...x, alt: e.target.value } : x)) })}
                        placeholder="Describe the photo"
                      />
                    </label>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[0.65rem] text-stone">{i === 0 ? "Main" : `#${i + 1}`}</span>
                      <span className="flex gap-1">
                        <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="p-1 text-stone hover:text-charcoal disabled:opacity-30" aria-label="Move earlier"><ArrowUp className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => moveImage(i, 1)} disabled={i === draft.images.length - 1} className="p-1 text-stone hover:text-charcoal disabled:opacity-30" aria-label="Move later"><ArrowDown className="h-3.5 w-3.5" /></button>
                        <button type="button" onClick={() => setDraft({ ...draft, images: draft.images.filter((_, j) => j !== i) })} className="p-1 text-stone hover:text-[#9b2c2c]" aria-label="Remove photo"><Trash2 className="h-3.5 w-3.5" /></button>
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input ref={fileRef} id="p-upload" type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => upload(e.target.files)} disabled={!canWrite || uploading} />
              <label htmlFor="p-upload" className={cx("btn btn-outline-dark h-10 min-h-0 cursor-pointer px-4", (!canWrite || uploading) && "pointer-events-none opacity-45")}>
                <ImagePlus className="h-4 w-4" /> {uploading ? "Uploading…" : "Upload photos"}
              </label>
              <span className="text-xs text-stone">or add a link</span>
              <div className="flex flex-1 gap-2">
                <label htmlFor="p-image-url" className="sr-only">Image link</label>
                <input id="p-image-url" className="min-w-0 flex-1 border border-line bg-white px-3 py-2 text-sm focus:border-emerald focus:outline-none" placeholder="https://…" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
                <button type="button" onClick={addImageUrl} className="border border-line bg-white px-3 text-xs font-semibold uppercase hover:border-charcoal">Add</button>
              </div>
            </div>
          </Panel>

          {isWatch ? (
            <Panel title="Specifications" description="Only add details you have confirmed from the brand or the watch itself.">
              <datalist id="spec-labels">
                {WATCH_SPEC_LABELS.map((l) => <option key={l} value={l} />)}
              </datalist>
              <div className="space-y-2">
                {draft.specs.map((s) => (
                  <div key={s.key} className="grid grid-cols-[1fr_1.6fr_auto] gap-2">
                    <label className="sr-only" htmlFor={`spec-l-${s.key}`}>Specification name</label>
                    <input id={`spec-l-${s.key}`} list="spec-labels" className="border border-line bg-white px-3 py-2 text-sm focus:border-emerald focus:outline-none" value={s.label} placeholder="e.g. Movement" onChange={(e) => setDraft({ ...draft, specs: draft.specs.map((x) => (x.key === s.key ? { ...x, label: e.target.value } : x)) })} />
                    <label className="sr-only" htmlFor={`spec-v-${s.key}`}>Value</label>
                    <input id={`spec-v-${s.key}`} className="border border-line bg-white px-3 py-2 text-sm focus:border-emerald focus:outline-none" value={s.value} placeholder={SPEC_EXAMPLES[s.label] ?? "Value"} onChange={(e) => setDraft({ ...draft, specs: draft.specs.map((x) => (x.key === s.key ? { ...x, value: e.target.value } : x)) })} />
                    <button type="button" onClick={() => setDraft({ ...draft, specs: draft.specs.filter((x) => x.key !== s.key) })} className="px-2 text-stone hover:text-[#9b2c2c]" aria-label="Remove specification"><Trash2 className="h-4 w-4" /></button>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setDraft({ ...draft, specs: [...draft.specs, { key: k(), label: "", value: "" }] })} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold hover:text-emerald">
                <Plus className="h-4 w-4" /> Add specification
              </button>
            </Panel>
          ) : (
            <Panel title="Scent profile" description="Used for the shop filters and the “Shop by mood” pages.">
              <fieldset>
                <legend className="eyebrow text-[0.6rem] text-stone">Fragrance family</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(fragranceFamilies) as FragranceFamily[]).map((f) => (
                    <button key={f} type="button" aria-pressed={draft.families.includes(f)} onClick={() => setDraft({ ...draft, families: toggleIn(draft.families, f) })} className={cx("border px-3 py-1.5 text-sm", draft.families.includes(f) ? "border-emerald bg-emerald text-ivory" : "border-line bg-white hover:border-charcoal")}>
                      {fragranceFamilies[f]}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="mt-6">
                <legend className="eyebrow text-[0.6rem] text-stone">Mood</legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(Object.keys(moods) as Mood[]).map((m) => (
                    <button key={m} type="button" aria-pressed={draft.moods.includes(m)} onClick={() => setDraft({ ...draft, moods: toggleIn(draft.moods, m) })} className={cx("border px-3 py-1.5 text-sm", draft.moods.includes(m) ? "border-emerald bg-emerald text-ivory" : "border-line bg-white hover:border-charcoal")}>
                      {moods[m].label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="mt-8 border-t border-line pt-6">
                <p className="eyebrow text-[0.6rem] text-stone">Fragrance notes <span className="normal-case tracking-normal">(optional — only when verified; separate with commas)</span></p>
                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  {(["notesTop", "notesHeart", "notesBase"] as const).map((key, idx) => (
                    <div key={key}>
                      <FieldLabel htmlFor={`p-${key}`}>{["Top", "Heart", "Base"][idx]}</FieldLabel>
                      <input id={`p-${key}`} className={inputClass} value={draft[key]} onChange={(e) => set(key, e.target.value)} />
                    </div>
                  ))}
                  <div className="sm:col-span-3">
                    <FieldLabel htmlFor="p-notes-src">Verified from</FieldLabel>
                    <input id="p-notes-src" className={inputClass} value={draft.notesSource} onChange={(e) => set("notesSource", e.target.value)} placeholder="e.g. the brand's product page link" aria-invalid={!!err("notesSource")} aria-describedby="p-notes-src-err" />
                    <FieldError id="p-notes-src-err" message={err("notesSource")} />
                  </div>
                </div>
              </div>
            </Panel>
          )}
        </div>

        <aside className="space-y-6 xl:sticky xl:top-8 xl:self-start">
          <Panel title="Visibility">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald" checked={draft.published} onChange={(e) => set("published", e.target.checked)} />
              <span>
                <span className="font-medium">Show in the shop</span>
                <span className="block text-xs text-stone">Untick to keep it as a draft.</span>
              </span>
            </label>
            <label className="mt-4 flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 h-4 w-4 accent-emerald" checked={draft.bestseller} onChange={(e) => set("bestseller", e.target.checked)} />
              <span>
                <span className="font-medium">Bestseller</span>
                <span className="block text-xs text-stone">Featured on the home page and in Bestsellers.</span>
              </span>
            </label>
          </Panel>
          <Panel title="Team note">
            <label htmlFor="p-pending" className="sr-only">Team note</label>
            <textarea id="p-pending" rows={3} className={inputClass} value={draft.pendingVerification} onChange={(e) => set("pendingVerification", e.target.value)} placeholder="e.g. Confirm 50 ml stock with supplier" />
            <p className="mt-2 text-xs text-stone">Only visible here.</p>
          </Panel>
          {slug && canWrite && (
            <Panel title="Delete">
              {confirmDelete ? (
                <div className="space-y-3">
                  <p className="text-sm">Delete this product permanently? It will disappear from the shop.</p>
                  <div className="flex gap-2">
                    <button type="button" onClick={remove} disabled={saving} className="btn h-10 min-h-0 bg-[#9b2c2c] px-4 text-white hover:bg-[#7f1d1d]">Delete</button>
                    <button type="button" onClick={() => setConfirmDelete(false)} className="btn btn-outline-dark h-10 min-h-0 px-4">Cancel</button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmDelete(true)} className="text-sm font-semibold text-[#9b2c2c] hover:underline">Delete product…</button>
              )}
            </Panel>
          )}
        </aside>
      </div>

      <div className="sticky bottom-0 -mx-5 flex justify-end gap-2 border-t border-line bg-[#f3eee4]/95 px-5 py-4 backdrop-blur md:-mx-10 md:px-10">
        <Link href="/hc-admin/products" className="btn btn-outline-dark h-11 min-h-0 px-5">Cancel</Link>
        <button type="submit" disabled={saving || !canWrite} className="btn btn-dark h-11 min-h-0 px-6">{saving ? "Saving…" : "Save product"}</button>
      </div>
    </form>
  );
}
