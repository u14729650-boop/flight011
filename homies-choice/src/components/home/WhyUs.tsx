import { Compass, Gem, MessageCircle, Store } from "lucide-react";

const items = [
  {
    icon: Gem,
    title: "Carefully selected fragrances",
    body: "A focused edit of designer favourites and Arabic perfumes — chosen for character, not clutter.",
  },
  {
    icon: MessageCircle,
    title: "Easy WhatsApp assistance",
    body: "Ask about a scent, a size or a price and talk to a real person — no forms, no waiting rooms.",
  },
  {
    icon: Store,
    title: "Convenient local shopping",
    body: "Based in Paldi, Ahmedabad — reach out, ask questions and shop with someone nearby.",
  },
  {
    icon: Compass,
    title: "Personalised fragrance guidance",
    body: "Tell us what you love wearing and we'll suggest what to try next.",
  },
];

export function WhyUs() {
  return (
    <section className="container-luxe py-20 md:py-28" aria-labelledby="why-title">
      <div className="max-w-2xl">
        <p className="eyebrow text-gold-deep">Why shop with us</p>
        <h2 id="why-title" className="display mt-4 text-[2.5rem] sm:text-5xl">Why Homies Choice?</h2>
      </div>
      <ul className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-10">
        {items.map(({ icon: Icon, title, body }) => (
          <li key={title} className="border-t border-charcoal/15 pt-7">
            <Icon className="h-6 w-6 text-gold-deep" strokeWidth={1.1} aria-hidden="true" />
            <h3 className="mt-6 font-serif text-2xl leading-tight">{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-stone">{body}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
