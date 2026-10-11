/** Our own files and our Supabase Storage host are optimised by next/image; other links are served as-is. */
export function isExternalImage(src: string): boolean {
  if (src.startsWith("data:")) return true;
  if (!src.startsWith("http")) return false;
  try {
    return new URL(src).hostname !== process.env.NEXT_PUBLIC_IMAGE_HOST;
  } catch {
    return true;
  }
}
