import type { NextConfig } from "next";

// Allow optimised (resized, AVIF/WebP, cached) delivery of photos uploaded to Supabase Storage.
const supabaseHost = (() => {
  try {
    const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    return url ? new URL(url).hostname : null;
  } catch {
    return null;
  }
})();

const nextConfig: NextConfig = {
  poweredByHeader: false,
  env: { NEXT_PUBLIC_IMAGE_HOST: supabaseHost ?? "" },
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [75, 85],
    // Editorial art and product photos change rarely; cache optimised variants for 30 days.
    minimumCacheTTL: 60 * 60 * 24 * 30,
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  async headers() {
    return [
      {
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=2592000, stale-while-revalidate=86400" }],
      },
    ];
  },
};

export default nextConfig;
