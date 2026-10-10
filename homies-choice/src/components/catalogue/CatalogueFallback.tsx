export function CatalogueFallback() {
  return (
    <div className="container-luxe pb-24" aria-busy="true" aria-label="Loading fragrances">
      <div className="h-[4.5rem] border-b border-line" />
      <ul className="mt-8 grid grid-cols-1 gap-x-5 gap-y-12 min-[420px]:grid-cols-2 lg:ml-[18.5rem] xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <li key={i} className="animate-pulse">
            <div className="aspect-[4/5] bg-beige/60" />
            <div className="mt-5 h-3 w-16 bg-beige" />
            <div className="mt-3 h-5 w-40 bg-beige" />
          </li>
        ))}
      </ul>
    </div>
  );
}
