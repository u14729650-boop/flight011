import { Compass, Gem, MessageCircle, Store } from "lucide-react";

const items = [
  { icon: Gem, title: "Carefully selected fragrances", body: "A focused edit of designer favourites and Arabic perfumes — chosen for character, not clutter." },
  { icon: MessageCircle, title: "Easy WhatsApp assistance", body: "Ask about a scent, a size or a price and talk to a real person — no forms, no waiting rooms." },
  { icon: Store, title: "Convenient local shopping", body: "Based in Paldi, Ahmedabad — reach out, ask questions and shop with someone nearby." },
  { icon: Compass, title: "Personalised fragrance guidance", body: "Tell us what you love wearing and we'll suggest what to try next." },
];

export function WhyUs() {
  return (
    <section className="relative isolate overflow-hidden bg-[#f1ebdf] py-20 md:py-28" aria-labelledby="why-title">
      <div className="orb orb-emerald h-[30rem] w-[30rem] -left-24 top-10 opacity-25" aria-hidden="true" />
      <div className="orb orb-gold h-[30rem] w-[30rem] right-0 bottom-0 opacity-45" aria-hidden="true" />
      <div className="container-luxe">
        <div className="max-w-2xl" data-reveal>
          <p className="eyebrow text-gold-deep">Why shop with us</p>
          <h2 id="why-title" className="display mt-4 text-[2.5rem] sm:text-5xl">Why Homies Choice?</h2>
        </div>
        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map(({ icon: Icon, title, body }, i) => (
            <li key={title} className="glass-light lift rounded-[1.75rem] p-7" data-reveal data-reveal-delay={i * 110}>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald text-gold shadow-[0_10px_24px_-12px_rgba(6,59,46,0.8)]">
                <Icon className="h-5 w-5" strokeWidth={1.3} aria-hidden="true" />
              </span>
              <h3 className="mt-7 font-serif text-[1.45rem] leading-tight">{title}</h3>
              <p className="mt-3 text-sm leading-relaxed font-light text-stone">{body}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
