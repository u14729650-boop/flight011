export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center" aria-busy="true" aria-live="polite">
      <span className="eyebrow animate-pulse text-gold-deep">Loading…</span>
    </div>
  );
}
