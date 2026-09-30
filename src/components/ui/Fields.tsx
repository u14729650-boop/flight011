import { useId, useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { STATES_ONLY, UNION_TERRITORIES } from '../../data/indiaStates';
import { AlertIcon, EyeIcon, EyeOffIcon } from './Icons';

interface FieldShell {
  label: ReactNode;
  error?: string;
  hint?: ReactNode;
  optional?: boolean;
  className?: string;
}

function Shell({ id, label, error, hint, optional, className = '', children }: FieldShell & { id: string; children: ReactNode }) {
  return (
    <div className={`field ${className}`}>
      <label className="field__label" htmlFor={id}>
        {label} {optional && <span className="opt">(optional)</span>}
      </label>
      {children}
      {error ? (
        <span className="field__error" id={`${id}-err`} role="alert">
          <AlertIcon width={14} height={14} />
          {error}
        </span>
      ) : hint ? (
        <span className="field__hint" id={`${id}-hint`}>
          {hint}
        </span>
      ) : null}
    </div>
  );
}

const describe = (id: string, error?: string, hint?: ReactNode) => (error ? `${id}-err` : hint ? `${id}-hint` : undefined);

export function TextField({ label, error, hint, optional, className, icon, ...input }: FieldShell & { icon?: ReactNode } & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = input.id ?? auto;
  const el = <input id={id} className="input" aria-invalid={error ? true : undefined} aria-describedby={describe(id, error, hint)} {...input} />;
  return (
    <Shell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      {icon ? (
        <div className="input-wrap input-wrap--icon">
          <span className="input-wrap__icon">{icon}</span>
          {el}
        </div>
      ) : (
        el
      )}
    </Shell>
  );
}

export function PasswordField({ label, error, hint, optional, className, ...input }: FieldShell & InputHTMLAttributes<HTMLInputElement>) {
  const auto = useId();
  const id = input.id ?? auto;
  const [show, setShow] = useState(false);
  return (
    <Shell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      <div className="input-wrap">
        <input
          id={id}
          className="input"
          type={show ? 'text' : 'password'}
          aria-invalid={error ? true : undefined}
          aria-describedby={describe(id, error, hint)}
          {...input}
        />
        <button type="button" className="input-wrap__btn" onClick={() => setShow((s) => !s)} aria-label={show ? 'Hide password' : 'Show password'}>
          {show ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
    </Shell>
  );
}

export function SelectField({ label, error, hint, optional, className, children, ...select }: FieldShell & SelectHTMLAttributes<HTMLSelectElement>) {
  const auto = useId();
  const id = select.id ?? auto;
  return (
    <Shell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      <select id={id} className="select" aria-invalid={error ? true : undefined} aria-describedby={describe(id, error, hint)} {...select}>
        {children}
      </select>
    </Shell>
  );
}

/** All 28 States and 8 Union Territories, grouped. */
export function StateOptions({ placeholder = 'Select state / UT' }: { placeholder?: string }) {
  return (
    <>
      <option value="" disabled>
        {placeholder}
      </option>
      <optgroup label="States">
        {STATES_ONLY.map((s) => (
          <option key={s.name} value={s.name}>
            {s.name}
          </option>
        ))}
      </optgroup>
      <optgroup label="Union Territories">
        {UNION_TERRITORIES.map((s) => (
          <option key={s.name} value={s.name}>
            {s.name}
          </option>
        ))}
      </optgroup>
    </>
  );
}

export function TextAreaField({ label, error, hint, optional, className, ...ta }: FieldShell & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const auto = useId();
  const id = ta.id ?? auto;
  return (
    <Shell id={id} label={label} error={error} hint={hint} optional={optional} className={className}>
      <textarea id={id} className="textarea" aria-invalid={error ? true : undefined} aria-describedby={describe(id, error, hint)} {...ta} />
    </Shell>
  );
}

export function FormAlert({ kind = 'error', children }: { kind?: 'error' | 'success' | 'info' | 'warning'; children: ReactNode }) {
  return (
    <div className={`alert alert--${kind}`} role={kind === 'error' ? 'alert' : 'status'}>
      <AlertIcon />
      <div>{children}</div>
    </div>
  );
}
