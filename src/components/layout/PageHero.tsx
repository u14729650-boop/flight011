import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export function PageHero({
  eyebrow,
  title,
  text,
  crumbs = [],
  art,
  children,
  compact,
}: {
  eyebrow?: string;
  title: ReactNode;
  text?: ReactNode;
  crumbs?: { to?: string; label: string }[];
  art?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={`page-hero ${compact ? 'page-hero--compact' : ''} ${art ? 'page-hero--art' : ''}`}>
      <div className="page-hero__bg grid-bg" aria-hidden />
      <div className="container page-hero__inner">
        <div className="page-hero__copy">
          {crumbs.length > 0 && (
            <nav className="crumbs" aria-label="Breadcrumb">
              <Link to="/">Home</Link>
              {crumbs.map((c) => (
                <span key={c.label}>
                  <span aria-hidden>/</span>
                  {c.to ? <Link to={c.to}>{c.label}</Link> : <span aria-current="page">{c.label}</span>}
                </span>
              ))}
            </nav>
          )}
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1>{title}</h1>
          {text && <p className="lead">{text}</p>}
          {children}
        </div>
        {art && <div className="page-hero__art">{art}</div>}
      </div>
    </section>
  );
}
