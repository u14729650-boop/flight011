import { Link } from 'react-router-dom';

/**
 * YA² brand mark: a dimensional navy→blue tile with the "YA²" monogram.
 * `variant="full"` adds the wordmark; `tone="light"` is for dark backgrounds.
 */
export function LogoMark({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <span className={`logo-mark ${className}`} style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
      <span className="logo-mark__face">
        YA<sup>2</sup>
      </span>
    </span>
  );
}

export function Logo({
  variant = 'full',
  tone = 'auto',
  size = 40,
  to = '/',
  className = '',
}: {
  variant?: 'full' | 'mark' | 'wordmark';
  tone?: 'auto' | 'light';
  size?: number;
  to?: string | null;
  className?: string;
}) {
  const content = (
    <>
      {variant !== 'wordmark' && <LogoMark size={size} />}
      {variant !== 'mark' && (
        <span className="logo__text">
          <span className="logo__name">
            YA<sup>2</sup>
          </span>
          <span className="logo__sub">Transport · Logistics</span>
        </span>
      )}
    </>
  );
  const cls = `logo ${tone === 'light' ? 'logo--light' : ''} ${className}`;
  if (!to) return <span className={cls}>{content}</span>;
  return (
    <Link to={to} className={cls} aria-label="YA² Transport — home">
      {content}
    </Link>
  );
}
