/**
 * The YA² arrow language — movement, delivery, direction.
 * Place inside an element with the `arrow-host` class to get the hover motion.
 */
export type ArrowDirection = 'right' | 'up-right' | 'long' | 'down';

export function AnimatedArrow({ direction = 'right', className = '' }: { direction?: ArrowDirection; className?: string }) {
  const cls = `ya-arrow ya-arrow--${direction === 'long' ? 'long ya-arrow--right' : direction} ${className}`;
  if (direction === 'up-right') {
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M6 14 14 6M7.5 6H14v6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (direction === 'down') {
    return (
      <svg className={cls} viewBox="0 0 20 20" fill="none" aria-hidden>
        <path d="M10 4v12M5 11l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  if (direction === 'long') {
    return (
      <svg className={cls} viewBox="0 0 32 20" fill="none" aria-hidden>
        <path className="ya-arrow__line" d="M2 10h26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M22 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className={cls} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M3.5 10h12.5M11 5l5 5-5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Decorative dashed route with a travelling head, used between sections and in route summaries. */
export function RouteArrow({ className = '' }: { className?: string }) {
  return (
    <svg className={`route-arrow ${className}`} viewBox="0 0 120 24" fill="none" aria-hidden>
      <path d="M4 12h104" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="2 6" opacity="0.5" />
      <path className="route-arrow__run" d="M4 12h104" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M104 6l8 6-8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
