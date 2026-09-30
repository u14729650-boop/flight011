import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { LogoMark } from '../components/brand/Logo';
import { bookingLink } from '../components/calculator/QuoteResult';
import { LocationFields } from '../components/location/LocationSelector';
import { Cargo3D } from '../components/three-d/Objects3D';
import { AnimatedArrow } from '../components/ui/AnimatedArrow';
import { Button, ButtonLink } from '../components/ui/Button';
import { FormAlert, PasswordField, TextField } from '../components/ui/Fields';
import {
  DocumentIcon,
  EditIcon,
  HeadsetIcon,
  HomeIcon,
  LogoutIcon,
  MailIcon,
  PackageIcon,
  PhoneIcon,
  PlusIcon,
  SearchIcon,
  TrashIcon,
  UserIcon,
} from '../components/ui/Icons';
import { WhatsAppButton } from '../components/ui/Social';
import { TRANSPORT_MODES } from '../config/pricing';
import { CONTACT } from '../config/site';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, ApiError } from '../lib/api';
import { STAGE_LABELS, type Address, type AddressInput, type SavedQuote, type Shipment } from '../lib/apiTypes';
import { formatDate, formatINR, formatKg } from '../lib/format';
import { calculateQuote } from '../lib/pricing';
import { findCity } from '../data/cities';
import { useSeo } from '../lib/seo';
import { EMAIL_LINK } from '../lib/links';

type Tab = 'shipments' | 'track' | 'quotes' | 'addresses' | 'profile' | 'support';
const TABS: { id: Tab; label: string; icon: ReactNode }[] = [
  { id: 'shipments', label: 'My Shipments', icon: <PackageIcon /> },
  { id: 'track', label: 'Track Shipment', icon: <SearchIcon /> },
  { id: 'quotes', label: 'My Quotes', icon: <DocumentIcon /> },
  { id: 'addresses', label: 'Saved Addresses', icon: <HomeIcon /> },
  { id: 'profile', label: 'Profile', icon: <UserIcon /> },
  { id: 'support', label: 'Support', icon: <HeadsetIcon /> },
];

export default function DashboardPage({ initialTab }: { initialTab?: Tab }) {
  const [params, setParams] = useSearchParams();
  const tab = (TABS.find((t) => t.id === params.get('tab'))?.id ?? initialTab ?? 'shipments') as Tab;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  useSeo({ title: tab === 'profile' ? 'My Profile' : 'My YA² Dashboard', description: 'Your YA² shipments, quotes and addresses.', noindex: true });

  const doLogout = async () => {
    await logout();
    toast({ kind: 'success', title: 'Logged out', text: 'See you again soon.' });
    navigate('/');
  };

  return (
    <section className="section section--tight dash">
      <div className="container dash__grid">
        <aside className="dash__nav card">
          <div className="dash__user">
            <span className="avatar avatar--lg">{user!.name.charAt(0).toUpperCase()}</span>
            <div>
              <strong>{user!.name}</strong>
              <span className="xs muted">{user!.email}</span>
            </div>
          </div>
          <nav aria-label="Dashboard">
            {TABS.map((t) => (
              <button key={t.id} className={`dash__tab ${tab === t.id ? 'is-active' : ''}`} onClick={() => setParams({ tab: t.id })} aria-current={tab === t.id ? 'page' : undefined}>
                {t.icon}
                {t.label}
              </button>
            ))}
            <button className="dash__tab dash__tab--logout" onClick={doLogout}>
              <LogoutIcon /> Logout
            </button>
          </nav>
        </aside>

        <div className="dash__main">
          <header className="dash__head">
            <div>
              <span className="eyebrow">
                My YA<sup>2</sup>
              </span>
              <h1 className="dash__title">Hello, {user!.name.split(' ')[0]}</h1>
            </div>
            <ButtonLink to="/book" arrow="right" icon={<PlusIcon width={18} />}>
              Book a Shipment
            </ButtonLink>
          </header>
          {tab === 'shipments' && <ShipmentsTab />}
          {tab === 'track' && <TrackTab />}
          {tab === 'quotes' && <QuotesTab />}
          {tab === 'addresses' && <AddressesTab />}
          {tab === 'profile' && <ProfileTab />}
          {tab === 'support' && <SupportTab />}
        </div>
      </div>
    </section>
  );
}

function useLoad<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const reload = () =>
    api
      .get<T>(url)
      .then(setData)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load data.'));
  useEffect(() => {
    void reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  return { data, error, reload, setData };
}

function Loading() {
  return (
    <div className="dash__cards">
      <div className="skeleton" style={{ height: 180 }} />
      <div className="skeleton" style={{ height: 180 }} />
    </div>
  );
}

function ShipmentsTab() {
  const { data, error } = useLoad<{ shipments: Shipment[] }>('/shipments');
  if (error) return <FormAlert>{error}</FormAlert>;
  if (!data) return <Loading />;
  if (!data.shipments.length) {
    return (
      <div className="empty">
        <Cargo3D width={110} tone="blue" />
        <h4>No shipments yet</h4>
        <p>Book your first shipment and it will appear here with live status.</p>
        <ButtonLink to="/book" arrow="right">
          Book a Shipment
        </ButtonLink>
      </div>
    );
  }
  return (
    <div className="dash__cards">
      {data.shipments.map((s) => (
        <article key={s.id} className="ship-card card">
          <div className="ship-card__top">
            <div>
              <span className="xs muted strong">{s.trackingId ? 'TRACKING ID' : 'BOOKING ID'}</span>
              <h3 className="tabular">{s.trackingId ?? s.bookingId}</h3>
            </div>
            <span className={`badge badge--dot ${s.status === 'PENDING_PAYMENT' ? 'badge--gold' : s.status === 'DELIVERED' ? 'badge--emerald' : 'badge--blue'}`}>
              {STAGE_LABELS[s.status]}
            </span>
          </div>
          <div className="ship-card__route">
            <span>
              <small>Pickup</small>
              {s.sender.city}, {s.sender.state}
            </span>
            <AnimatedArrow direction="long" />
            <span>
              <small>Destination</small>
              {s.receiver.city}, {s.receiver.state}
            </span>
          </div>
          <dl className="ship-card__kv">
            <div>
              <dt>Mode</dt>
              <dd>{TRANSPORT_MODES[s.mode].short}</dd>
            </div>
            <div>
              <dt>Weight</dt>
              <dd>{formatKg(s.weightKg)}</dd>
            </div>
            <div>
              <dt>Price</dt>
              <dd className="tabular">{formatINR(s.price)}</dd>
            </div>
            <div>
              <dt>Est. delivery</dt>
              <dd>{s.estimatedDelivery ? formatDate(s.estimatedDelivery) : s.breakdown.transitLabel}</dd>
            </div>
          </dl>
          <div className="ship-card__actions">
            {s.status === 'PENDING_PAYMENT' ? (
              <ButtonLink to={`/payment?shipment=${s.id}`} size="sm" arrow="right">
                Complete payment
              </ButtonLink>
            ) : (
              <ButtonLink to={`/track?id=${s.trackingId}`} size="sm" variant="secondary" arrow="up-right">
                Track
              </ButtonLink>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function TrackTab() {
  const [id, setId] = useState('');
  const navigate = useNavigate();
  return (
    <div className="card card--pad">
      <h2 className="form-title">Track a shipment</h2>
      <form
        className="track-form track-form--inline"
        onSubmit={(e) => {
          e.preventDefault();
          if (id.trim()) navigate(`/track?id=${encodeURIComponent(id.trim().toUpperCase())}`);
        }}
      >
        <div className="track-form__field">
          <SearchIcon />
          <input className="track-form__input" placeholder="YA2-2026-001284" value={id} onChange={(e) => setId(e.target.value.toUpperCase())} aria-label="Tracking ID" />
        </div>
        <Button type="submit" arrow="right">
          Track Shipment
        </Button>
      </form>
    </div>
  );
}

function QuotesTab() {
  const { data, error, setData } = useLoad<{ quotes: SavedQuote[] }>('/quotes');
  const toast = useToast();
  if (error) return <FormAlert>{error}</FormAlert>;
  if (!data) return <Loading />;
  const remove = async (id: string) => {
    await api.del(`/quotes/${id}`);
    setData({ quotes: data.quotes.filter((q) => q.id !== id) });
    toast({ kind: 'success', title: 'Quote removed' });
  };
  if (!data.quotes.length) {
    return (
      <div className="empty">
        <DocumentIcon width={34} height={34} />
        <h4>No saved quotes</h4>
        <p>Use the calculator and choose “Save quote” to keep estimates here.</p>
        <ButtonLink to="/calculator" arrow="right">
          Open calculator
        </ButtonLink>
      </div>
    );
  }
  return (
    <div className="dash__cards">
      {data.quotes.map((q) => {
        const breakdown = calculateQuote({
          mode: q.mode,
          pickupState: q.pickupState,
          destinationState: q.destinationState,
          weightKg: q.weightKg,
          cargoType: q.cargoType,
          speed: q.speed,
          pickupCoords: q.pickupCity ? findCity(q.pickupCity, q.pickupState)?.coords : undefined,
          destinationCoords: q.destinationCity ? findCity(q.destinationCity, q.destinationState)?.coords : undefined,
        });
        return (
          <article key={q.id} className="ship-card card">
            <div className="ship-card__top">
              <div>
                <span className="xs muted strong">{TRANSPORT_MODES[q.mode].label.toUpperCase()}</span>
                <h3 className="tabular">{formatINR(q.total)}</h3>
              </div>
              <span className="badge">{formatDate(q.createdAt)}</span>
            </div>
            <div className="ship-card__route">
              <span>{q.pickupCity ?? q.pickupState}</span>
              <AnimatedArrow direction="long" />
              <span>{q.destinationCity ?? q.destinationState}</span>
            </div>
            <p className="small muted">
              {formatKg(q.weightKg)} · {q.transitLabel}
            </p>
            <div className="ship-card__actions">
              <ButtonLink to={bookingLink(breakdown, { from: q.pickupCity, to: q.destinationCity })} size="sm" arrow="right">
                Book Now
              </ButtonLink>
              <button className="icon-btn" aria-label="Delete quote" onClick={() => remove(q.id)}>
                <TrashIcon />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

const emptyAddress = (): AddressInput => ({ label: 'Home', name: '', phone: '', line1: '', city: '', state: '', pincode: '' });

function AddressesTab() {
  const { data, error, reload } = useLoad<{ addresses: Address[] }>('/addresses');
  const toast = useToast();
  const [editing, setEditing] = useState<{ id?: string; value: AddressInput } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      if (editing.id) await api.put(`/addresses/${editing.id}`, editing.value);
      else await api.post('/addresses', editing.value);
      toast({ kind: 'success', title: 'Address saved' });
      setEditing(null);
      setErrors({});
      await reload();
    } catch (err) {
      if (err instanceof ApiError) setErrors(err.fields);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await api.del(`/addresses/${id}`);
    toast({ kind: 'success', title: 'Address removed' });
    await reload();
  };

  if (error) return <FormAlert>{error}</FormAlert>;
  if (!data) return <Loading />;

  return (
    <div className="stack" style={{ ['--stack' as string]: '20px' }}>
      {editing ? (
        <form className="card card--pad stack" onSubmit={save} noValidate style={{ ['--stack' as string]: '18px' }}>
          <h2 className="form-title">{editing.id ? 'Edit address' : 'Add address'}</h2>
          <div className="form-grid form-grid--3">
            <TextField label="Label" value={editing.value.label} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, label: e.target.value } })} placeholder="Home, Office, Warehouse" />
            <TextField label="Contact name" value={editing.value.name} error={errors.name} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, name: e.target.value } })} />
            <TextField label="Phone" type="tel" value={editing.value.phone} error={errors.phone} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, phone: e.target.value } })} />
            <TextField className="span-all" label="Address" value={editing.value.line1} error={errors.line1} onChange={(e) => setEditing({ ...editing, value: { ...editing.value, line1: e.target.value } })} />
            <LocationFields
              idPrefix="addr"
              value={{ state: editing.value.state, city: editing.value.city, pincode: editing.value.pincode }}
              onChange={(l) => setEditing({ ...editing, value: { ...editing.value, ...l } })}
              errors={{ state: errors.state, city: errors.city, pincode: errors.pincode }}
            />
          </div>
          <div className="row-actions">
            <Button type="submit" loading={saving} arrow="right">
              Save address
            </Button>
            <Button variant="ghost" onClick={() => (setEditing(null), setErrors({}))}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <div>
          <Button icon={<PlusIcon width={18} />} onClick={() => setEditing({ value: emptyAddress() })}>
            Add address
          </Button>
        </div>
      )}
      {data.addresses.length === 0 && !editing ? (
        <div className="empty">
          <HomeIcon width={34} height={34} />
          <h4>No saved addresses</h4>
          <p>Save pickup and drop addresses to fill booking forms in one click.</p>
        </div>
      ) : (
        <div className="dash__cards">
          {data.addresses.map((a) => (
            <article key={a.id} className="addr-card card card--pad">
              <span className="badge badge--blue">{a.label}</span>
              <strong>{a.name}</strong>
              <p className="small muted">
                {a.line1}
                <br />
                {a.city}, {a.state} {a.pincode}
                <br />
                {a.phone}
              </p>
              <div className="row-actions">
                <button className="icon-btn" aria-label={`Edit ${a.label}`} onClick={() => setEditing({ id: a.id, value: { ...a } })}>
                  <EditIcon />
                </button>
                <button className="icon-btn" aria-label={`Delete ${a.label}`} onClick={() => remove(a.id)}>
                  <TrashIcon />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ProfileTab() {
  const { user, setUser } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState({ name: user!.name, phone: user!.phone ?? '' });
  const [pErrors, setPErrors] = useState<Record<string, string>>({});
  const [savingP, setSavingP] = useState(false);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setSavingP(true);
    try {
      const { user: u } = await api.patch<{ user: typeof user }>('/account/profile', profile);
      setUser(u);
      setPErrors({});
      toast({ kind: 'success', title: 'Profile updated' });
    } catch (err) {
      if (err instanceof ApiError) setPErrors(err.fields);
    } finally {
      setSavingP(false);
    }
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return setPwErrors({ confirm: 'Passwords do not match.' });
    setSavingPw(true);
    try {
      await api.post('/account/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword });
      setPw({ currentPassword: '', newPassword: '', confirm: '' });
      setPwErrors({});
      toast({ kind: 'success', title: 'Password changed', text: 'Other devices have been signed out.' });
    } catch (err) {
      if (err instanceof ApiError) setPwErrors({ ...err.fields, ...(Object.keys(err.fields).length ? {} : { newPassword: err.message }) });
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="dash__two">
      <form className="card card--pad stack" onSubmit={saveProfile} noValidate style={{ ['--stack' as string]: '18px' }}>
        <h2 className="form-title">Profile</h2>
        <TextField label="Full name" value={profile.name} error={pErrors.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
        <TextField label="Email" value={user!.email} disabled hint="Contact support to change your login email." />
        <TextField label="Phone" type="tel" value={profile.phone} error={pErrors.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
        <p className="xs muted">
          Member since {formatDate(user!.createdAt)} · Signed in with {user!.authProvider === 'google' ? 'Google' : 'email & password'}
        </p>
        <Button type="submit" loading={savingP} arrow="right">
          Save profile
        </Button>
      </form>
      <form className="card card--pad stack" onSubmit={savePassword} noValidate style={{ ['--stack' as string]: '18px' }}>
        <h2 className="form-title">{user!.authProvider === 'google' ? 'Set a password' : 'Change password'}</h2>
        {user!.authProvider === 'password' && (
          <PasswordField label="Current password" autoComplete="current-password" value={pw.currentPassword} error={pwErrors.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
        )}
        <PasswordField label="New password" autoComplete="new-password" value={pw.newPassword} error={pwErrors.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} hint="At least 8 characters with a letter and a number." />
        <PasswordField label="Confirm new password" autoComplete="new-password" value={pw.confirm} error={pwErrors.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} />
        <Button type="submit" variant="secondary" loading={savingPw}>
          Update password
        </Button>
      </form>
    </div>
  );
}

function SupportTab() {
  return (
    <div className="card card--pad support-tab">
      <LogoMark size={48} />
      <h2 className="form-title">We are here to help</h2>
      <p className="muted">For booking changes, pickup timing or delivery questions, reach us with your booking or tracking ID.</p>
      <div className="row-actions">
        <ButtonLink href={CONTACT.phoneHref} icon={<PhoneIcon width={18} />} arrow="right">
          Call Support
        </ButtonLink>
        <ButtonLink href={CONTACT.emailHref} {...EMAIL_LINK} variant="secondary" icon={<MailIcon width={18} />} arrow="up-right">
          Email Support
        </ButtonLink>
        <WhatsAppButton text="WhatsApp Us" />
      </div>
      <p className="small">
        Or browse the <Link to="/faq" className="text-link">Help Center</Link>.
      </p>
    </div>
  );
}
