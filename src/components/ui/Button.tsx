import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatedArrow, type ArrowDirection } from './AnimatedArrow';

type Variant = 'primary' | 'secondary' | 'ghost' | 'emerald' | 'light' | 'outline-light' | 'danger';
type Size = 'sm' | 'md' | 'lg';

interface CommonProps {
  variant?: Variant;
  size?: Size;
  arrow?: ArrowDirection | false;
  icon?: ReactNode;
  block?: boolean;
  className?: string;
  children: ReactNode;
}

const classes = ({ variant = 'primary', size = 'md', block, className = '' }: CommonProps) =>
  ['btn', `btn--${variant}`, size !== 'md' && `btn--${size}`, block && 'btn--block', 'arrow-host', className].filter(Boolean).join(' ');

function Inner({ icon, children, arrow, loading }: { icon?: ReactNode; children: ReactNode; arrow?: ArrowDirection | false; loading?: boolean }) {
  return (
    <>
      {loading ? <span className="spinner" aria-hidden /> : icon}
      <span>{children}</span>
      {arrow && !loading ? <AnimatedArrow direction={arrow} /> : null}
    </>
  );
}

export function Button({
  loading,
  type = 'button',
  disabled,
  ...props
}: CommonProps & { loading?: boolean } & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'>) {
  const { variant, size, arrow, icon, block, className, children, ...rest } = props;
  return (
    <button
      type={type}
      className={classes({ variant, size, block, className, children })}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      <Inner icon={icon} arrow={arrow} loading={loading}>
        {children}
      </Inner>
    </button>
  );
}

/** Router link or external anchor styled as a button. */
export function ButtonLink({
  to,
  href,
  target,
  rel,
  onClick,
  ...props
}: CommonProps & { to?: string; href?: string; target?: string; rel?: string; onClick?: React.MouseEventHandler<HTMLAnchorElement> }) {
  const { variant, size, arrow, icon, block, className, children } = props;
  const cls = classes({ variant, size, block, className, children });
  const inner = (
    <Inner icon={icon} arrow={arrow}>
      {children}
    </Inner>
  );
  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  return (
    <a href={href} className={cls} target={target} rel={rel} onClick={onClick}>
      {inner}
    </a>
  );
}
