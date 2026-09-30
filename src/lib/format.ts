const inr = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });
const num = new Intl.NumberFormat('en-IN');

/** ₹1,25,000 — Indian digit grouping. */
export const formatINR = (n: number) => inr.format(Math.round(n));
export const formatNumber = (n: number) => num.format(n);
export const formatKg = (n: number) => `${num.format(n)} KG`;

export function formatDate(iso: string | Date, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Date(iso).toLocaleDateString('en-IN', opts);
}

export function formatDateTime(iso: string | Date) {
  return new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

export const signedINR = (n: number) => (n >= 0 ? `+ ${formatINR(n)}` : `− ${formatINR(-n)}`);
export const factor = (f: number) => `${f.toFixed(2)}×`;
