import { Fragment } from 'react';
import { CONTACT } from '../../config/site';
import { EMAIL_LINK } from '../../lib/links';

/** Inline "a@… or b@…" — every contact email, each opening Gmail. */
export function EmailLinks({ className = 'text-link' }: { className?: string }) {
  return (
    <>
      {CONTACT.emails.map((e, i) => (
        <Fragment key={e}>
          {i > 0 && ' or '}
          <a className={className} href={CONTACT.emailHref} {...EMAIL_LINK}>
            {e}
          </a>
        </Fragment>
      ))}
    </>
  );
}
