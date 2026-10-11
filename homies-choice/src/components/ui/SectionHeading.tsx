import { cx } from "@/lib/format";

export function SectionHeading({
  eyebrow,
  title,
  intro,
  align = "left",
  tone = "dark",
  as: As = "h2",
  className,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  intro?: React.ReactNode;
  align?: "left" | "center";
  tone?: "dark" | "light";
  as?: "h1" | "h2";
  className?: string;
}) {
  return (
    <div className={cx(align === "center" && "mx-auto text-center", "max-w-3xl", className)}>
      {eyebrow && <p className={cx("eyebrow", tone === "light" ? "text-gold" : "text-gold-deep")}>{eyebrow}</p>}
      <As className={cx("display mt-4 text-[2.5rem] sm:text-5xl lg:text-[3.6rem]", tone === "light" ? "text-ivory" : "text-charcoal")}>
        {title}
      </As>
      {intro && <p className={cx("mt-5 text-[0.95rem] leading-relaxed", tone === "light" ? "text-ivory/70" : "text-stone")}>{intro}</p>}
    </div>
  );
}
