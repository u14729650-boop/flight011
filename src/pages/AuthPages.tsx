import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Logo } from '../components/brand/Logo';
import { IndiaMap } from '../components/map/IndiaMap';
import { Cargo3D, Plane3D } from '../components/three-d/Objects3D';
import { Button } from '../components/ui/Button';
import { FormAlert, PasswordField, TextField } from '../components/ui/Fields';
import { CheckCircleIcon, CheckIcon, GoogleIcon, LockIcon, MailIcon, UserIcon, PhoneIcon } from '../components/ui/Icons';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { cityByName } from '../data/cities';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, ApiError } from '../lib/api';
import type { PublicUser } from '../lib/apiTypes';
import { useSeo } from '../lib/seo';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const safeNext = (n: string | null) => (n && n.startsWith('/') && !n.startsWith('//') ? n : '/dashboard');

function passwordProblem(pw: string) {
  if (pw.length < 8) return 'Use at least 8 characters.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Include at least one letter and one number.';
  return null;
}

const AUTH_ROUTES = [
  { from: cityByName('Ahmedabad').coords, to: cityByName('New Delhi').coords, mode: 'air' as const },
  { from: cityByName('Mumbai').coords, to: cityByName('Bengaluru').coords, mode: 'road' as const },
  { from: cityByName('New Delhi').coords, to: cityByName('Kolkata').coords, mode: 'air' as const },
];

function AuthShell({ title, subtitle, children }: { title: ReactNode; subtitle: ReactNode; children: ReactNode }) {
  return (
    <div className="auth">
      <aside className="auth__brand" aria-hidden>
        <Logo tone="light" size={46} to={null} />
        <div className="auth__art">
          <IndiaMap className="auth__map" routes={AUTH_ROUTES} showLabels={false} />
          <Plane3D className="auth__plane float-slow" width="48%" />
          <Cargo3D className="auth__box float" width="18%" tone="kraft" />
        </div>
        <div className="auth__quote">
          <h2>Moving India Forward.</h2>
          <ul>
            <li>
              <CheckIcon /> Track every shipment in one dashboard
            </li>
            <li>
              <CheckIcon /> Save quotes and addresses
            </li>
            <li>
              <CheckIcon /> Book and pay online
            </li>
          </ul>
        </div>
      </aside>
      <div className="auth__main">
        <div className="auth__top">
          <Logo size={36} className="auth__mobile-logo" />
          <Link to="/" className="auth__back text-link small">
            ← Back to website
          </Link>
          <ThemeToggle />
        </div>
        <div className="auth__card">
          <h1 className="auth__title">{title}</h1>
          <p className="auth__sub muted">{subtitle}</p>
          {children}
        </div>
      </div>
    </div>
  );
}

function GoogleButton({ next }: { next: string }) {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  useEffect(() => {
    api
      .get<{ google: boolean }>('/auth/providers')
      .then((r) => setEnabled(r.google))
      .catch(() => setEnabled(false));
  }, []);
  return (
    <>
      <a
        href={`/api/auth/google?next=${encodeURIComponent(next)}`}
        className="btn btn--secondary btn--block auth__google"
        aria-disabled={enabled === false || undefined}
        onClick={(e) => enabled === false && e.preventDefault()}
      >
        <GoogleIcon width={20} height={20} /> Continue with Google
      </a>
      {enabled === false && <p className="auth__hint">Google sign-in will be available once it is configured for YA². Use email for now.</p>}
    </>
  );
}

const GOOGLE_ERRORS: Record<string, string> = {
  google_not_configured: 'Google sign-in is not configured yet. Please use email and password.',
  google_failed: 'Google sign-in did not complete. Please try again.',
  google_unverified: 'Your Google email address is not verified.',
};

export function LoginPage() {
  useSeo({ title: 'Login', description: 'Log in to My YA² to book, pay for and track your shipments.', noindex: true });
  const { user, login } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(GOOGLE_ERRORS[params.get('error') ?? ''] ?? null);
  const [loading, setLoading] = useState(false);

  if (user && !loading) return <Navigate to={next} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!EMAIL_RE.test(email.trim())) errs.email = 'Enter a valid email address.';
    if (!password) errs.password = 'Enter your password.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setError(null);
    try {
      await login(email.trim(), password);
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed.');
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={
        <>
          Welcome back to YA<sup className="sq">2</sup>
        </>
      }
      subtitle="Log in to book, pay and track your shipments."
    >
      <form onSubmit={onSubmit} noValidate className="auth__form">
        {error && <FormAlert>{error}</FormAlert>}
        <TextField label="Email" type="email" autoComplete="email" icon={<MailIcon />} value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
        <PasswordField label="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <div className="auth__row">
          <span />
          <Link to="/forgot-password" className="text-link small">
            Forgot Password?
          </Link>
        </div>
        <Button type="submit" size="lg" block arrow="right" loading={loading}>
          Login
        </Button>
        <div className="auth__or">
          <span>or</span>
        </div>
        <GoogleButton next={next} />
      </form>
      <p className="auth__switch">
        New to YA²? <Link to={`/register${params.get('next') ? `?next=${encodeURIComponent(next)}` : ''}`} className="text-link">Create an account</Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  useSeo({ title: 'Create your account', description: 'Create a My YA² account to book and track shipments across India.', noindex: true });
  const { user, register } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = safeNext(params.get('next'));
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (user && !loading && !done) return <Navigate to={next} replace />;

  const set = (k: keyof typeof form) => (e: { target: { value: string } }) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const strength = [form.password.length >= 8, /[A-Za-z]/.test(form.password) && /[0-9]/.test(form.password), form.password.length >= 12 || /[^A-Za-z0-9]/.test(form.password)].filter(Boolean).length;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your full name.';
    if (!EMAIL_RE.test(form.email.trim())) errs.email = 'Enter a valid email address.';
    if (!/^\+?[0-9 ()-]{7,20}$/.test(form.phone.trim())) errs.phone = 'Enter a valid phone number.';
    const pw = passwordProblem(form.password);
    if (pw) errs.password = pw;
    if (form.confirm !== form.password) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setError(null);
    try {
      await register({ name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password });
      setDone(true);
      window.setTimeout(() => navigate(next, { replace: true }), 1100);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrors((x) => ({ ...x, ...err.fields }));
        setError(err.message);
      }
      setLoading(false);
    }
  };

  if (done) {
    return (
      <AuthShell title="Account created" subtitle="You are signed in. Taking you to your dashboard…">
        <div className="success-state">
          <CheckCircleIcon width={60} height={60} />
          <p className="muted">Welcome to YA², {form.name.split(' ')[0]}.</p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Create your account" subtitle="Book shipments, save quotes and track deliveries in one place.">
      <form onSubmit={onSubmit} noValidate className="auth__form">
        {error && <FormAlert>{error}</FormAlert>}
        <TextField label="Full Name" autoComplete="name" icon={<UserIcon />} value={form.name} onChange={set('name')} error={errors.name} />
        <TextField label="Email" type="email" autoComplete="email" icon={<MailIcon />} value={form.email} onChange={set('email')} error={errors.email} />
        <TextField label="Phone" type="tel" autoComplete="tel" icon={<PhoneIcon />} placeholder="+91 98xxx xxxxx" value={form.phone} onChange={set('phone')} error={errors.phone} />
        <PasswordField
          label="Password"
          autoComplete="new-password"
          value={form.password}
          onChange={set('password')}
          error={errors.password}
          hint="At least 8 characters with a letter and a number."
        />
        {form.password && (
          <div className={`pw-meter pw-meter--${strength}`} aria-label={`Password strength ${['weak', 'fair', 'good', 'strong'][strength]}`}>
            <span />
            <span />
            <span />
            <em>{['Too weak', 'Fair', 'Good', 'Strong'][strength]}</em>
          </div>
        )}
        <PasswordField label="Confirm Password" autoComplete="new-password" value={form.confirm} onChange={set('confirm')} error={errors.confirm} />
        <Button type="submit" size="lg" block arrow="right" loading={loading}>
          Create account
        </Button>
        <div className="auth__or">
          <span>or</span>
        </div>
        <GoogleButton next={next} />
        <p className="auth__legal">
          By creating an account you agree to our <Link to="/terms" className="text-link">Terms</Link> and <Link to="/privacy" className="text-link">Privacy Policy</Link>.
        </p>
      </form>
      <p className="auth__switch">
        Already have an account? <Link to="/login" className="text-link">Log in</Link>
      </p>
    </AuthShell>
  );
}

export function ForgotPasswordPage() {
  useSeo({ title: 'Forgot password', description: 'Reset your My YA² password.', noindex: true });
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [devUrl, setDevUrl] = useState<string | null>(null);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address.');
    setLoading(true);
    setError(null);
    try {
      const r = await api.post<{ ok: true; devResetUrl?: string }>('/auth/forgot-password', { email: email.trim() });
      setDevUrl(r.devResetUrl ?? null);
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Forgot your password?" subtitle="Enter your account email and we will send you a secure reset link.">
      {sent ? (
        <div className="auth__form">
          <FormAlert kind="success">
            If an account exists for <strong>{email}</strong>, a reset link is on its way. The link expires in 30 minutes.
          </FormAlert>
          {devUrl && (
            <FormAlert kind="warning">
              <strong>Development mode:</strong> no email service is configured yet, so here is the reset link (also printed in the API log).{' '}
              <Link className="text-link" to={devUrl.replace(/^https?:\/\/[^/]+/, '')}>
                Open reset link
              </Link>
            </FormAlert>
          )}
          <Link to="/login" className="btn btn--secondary btn--block">
            Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate className="auth__form">
          <TextField label="Email" type="email" autoComplete="email" icon={<MailIcon />} value={email} onChange={(e) => setEmail(e.target.value)} error={error ?? undefined} />
          <Button type="submit" size="lg" block arrow="right" loading={loading}>
            Send reset link
          </Button>
          <p className="auth__switch">
            Remembered it? <Link to="/login" className="text-link">Log in</Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export function ResetPasswordPage() {
  useSeo({ title: 'Set a new password', description: 'Choose a new password for your My YA² account.', noindex: true });
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const { setUser } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(token ? null : 'This reset link is missing its token. Request a new link.');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const pw = passwordProblem(password);
    if (pw) errs.password = pw;
    if (confirm !== password) errs.confirm = 'Passwords do not match.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    try {
      const { user } = await api.post<{ user: PublicUser }>('/auth/reset-password', { token, password });
      setUser(user);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not reset password.');
      setLoading(false);
    }
  };

  return (
    <AuthShell title="Set a new password" subtitle="Choose a strong password you have not used before.">
      <form onSubmit={onSubmit} noValidate className="auth__form">
        {error && (
          <FormAlert>
            {error} <Link to="/forgot-password" className="text-link">Request a new link</Link>
          </FormAlert>
        )}
        <PasswordField label="New password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} error={errors.password} />
        <PasswordField label="Confirm new password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} error={errors.confirm} />
        <Button type="submit" size="lg" block arrow="right" loading={loading} icon={<LockIcon width={18} />}>
          Update password
        </Button>
      </form>
    </AuthShell>
  );
}

/** Renders children only for signed-in users; otherwise redirects to /login?next=… */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  const toast = useToast();
  useEffect(() => {
    if (!loading && !user) toast({ kind: 'info', title: 'Please log in', text: 'Log in or create an account to continue.' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);
  if (loading) {
    return (
      <div className="container section">
        <div className="skeleton" style={{ height: 420 }} />
      </div>
    );
  }
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  return <>{children}</>;
}
