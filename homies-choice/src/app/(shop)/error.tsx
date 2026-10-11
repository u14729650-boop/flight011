"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <div className="container-luxe flex min-h-[60vh] flex-col items-center justify-center py-24 text-center" role="alert">
      <p className="eyebrow text-gold-deep">Something went wrong</p>
      <h1 className="display mt-5 text-5xl">We couldn&rsquo;t load this page.</h1>
      <p className="mt-5 max-w-md text-stone">Please try again. If it keeps happening, message us on WhatsApp and we&rsquo;ll help you directly.</p>
      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button type="button" onClick={reset} className="btn btn-dark">Try again</button>
        <Link href="/" className="btn btn-outline-dark">Back to home</Link>
      </div>
    </div>
  );
}
