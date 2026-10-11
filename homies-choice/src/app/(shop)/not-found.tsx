import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-luxe flex min-h-[60vh] flex-col items-center justify-center py-24 text-center">
      <p className="eyebrow text-gold-deep">Page not found</p>
      <h1 className="display mt-5 text-5xl md:text-6xl">This scent trail has gone cold.</h1>
      <p className="mt-5 max-w-md text-stone">The page you were looking for doesn&rsquo;t exist or has moved.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <Link href="/shop" className="btn btn-dark">Shop the collection</Link>
        <Link href="/" className="btn btn-outline-dark">Back to home</Link>
      </div>
    </div>
  );
}
