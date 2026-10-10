import type { CSSProperties } from "react";

export default function Image({ src, alt, fill, width, height, className, priority, sizes, quality, style, ...rest }: any) {
  const s: CSSProperties = fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style;
  return <img src={src} alt={alt} width={fill ? undefined : width} height={fill ? undefined : height} className={className} style={s} loading={priority ? "eager" : "lazy"} {...rest} />;
}
