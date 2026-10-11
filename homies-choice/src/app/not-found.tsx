import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

/** Fallback for addresses outside the shop (the shop has its own branded 404 with navigation). */
export default function NotFound() {
  return (
    <div className="on-dark tone-emerald grain relative flex min-h-screen flex-col items-center justify-center px-5 text-center text-ivory">
      <Link href="/" aria-label="HOMIES CHOICE — home">
        <Logo />
      </Link>
      <p className="eyebrow mt-16 text-gold">Page not found</p>
      <h1 className="display mt-5 text-5xl md:text-6xl">This scent trail has gone cold.</h1>
      <p className="mt-5 max-w-md text-ivory/70">The page you were looking for doesn&rsquo;t exist or has moved.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/shop" className="btn btn-gold">Shop the collection</Link>
        <Link href="/" className="btn btn-outline-light">Back to home</Link>
      </div>
    </div>
  );
}
