import type { ReactNode } from 'react';
import { Reveal } from './Reveal';

export function SectionHeading({
  eyebrow,
  title,
  text,
  align = 'left',
  action,
  as: H = 'h2',
}: {
  eyebrow?: string;
  title: ReactNode;
  text?: ReactNode;
  align?: 'left' | 'center';
  action?: ReactNode;
  as?: 'h1' | 'h2';
}) {
  if (action) {
    return (
      <Reveal className="sh sh--split">
        <div className="sh__head">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <H>{title}</H>
          {text && <p className="lead">{text}</p>}
        </div>
        <div>{action}</div>
      </Reveal>
    );
  }
  return (
    <Reveal className={`sh ${align === 'center' ? 'sh--center' : ''}`}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <H>{title}</H>
      {text && <p className="lead">{text}</p>}
    </Reveal>
  );
}
