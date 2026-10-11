import type { CSSProperties } from "react";

export default function Image({ src, alt, fill, width, height, className, priority, sizes, quality, style, unoptimized, ...rest }: any) {
  const s: CSSProperties = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style;
  // Published alongside the page, so site-absolute paths become relative.
  const url = typeof src === "string" && src.startsWith("/") ? src.slice(1) : src;
  return <img src={url} alt={alt} width={fill ? undefined : width} height={fill ? undefined : height} className={className} style={s} loading={priority ? "eager" : "lazy"} {...rest} />;
}
