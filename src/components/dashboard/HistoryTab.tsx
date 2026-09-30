import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { api, ApiError } from '../../lib/api';
import type { ActivityItem, ActivityType } from '../../lib/apiTypes';
import { formatDate } from '../../lib/format';
import { FormAlert } from '../ui/Fields';
import { CardIcon, ClockIcon, DocumentIcon, HomeIcon, LockIcon, LogoutIcon, PackageIcon, ShieldIcon, UserIcon } from '../ui/Icons';

/** How each kind of entry looks. */
const KINDS: Record<ActivityType, { icon: ReactNode; tone: string }> = {
  SIGN_IN: { icon: <LockIcon />, tone: 'blue' },
  SIGN_OUT: { icon: <LogoutIcon />, tone: 'grey' },
  ACCOUNT: { icon: <UserIcon />, tone: 'blue' },
  PROFILE: { icon: <UserIcon />, tone: 'grey' },
  SECURITY: { icon: <ShieldIcon />, tone: 'gold' },
  BOOKING: { icon: <PackageIcon />, tone: 'blue' },
  PAYMENT: { icon: <CardIcon />, tone: 'green' },
  QUOTE: { icon: <DocumentIcon />, tone: 'grey' },
  ADDRESS: { icon: <HomeIcon />, tone: 'grey' },
};

const FILTERS: { id: string; label: string; types: ActivityType[] | null }[] = [
  { id: 'all', label: 'All', types: null },
  { id: 'signins', label: 'Sign-ins', types: ['SIGN_IN', 'SIGN_OUT'] },
  { id: 'bookings', label: 'Bookings', types: ['BOOKING'] },
  { id: 'payments', label: 'Payments', types: ['PAYMENT'] },
  { id: 'quotes', label: 'Quotes', types: ['QUOTE'] },
  { id: 'account', label: 'Account & security', types: ['ACCOUNT', 'PROFILE', 'ADDRESS', 'SECURITY'] },
];

const dayKey = (iso: string) => new Date(iso).toDateString();
function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(Date.now() - 86_400_000);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return formatDate(d, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' });

/** The signed-in account's own history — every login sees only its own entries. */
export function HistoryTab() {
  const { user } = useAuth();
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api
      .get<{ activity: ActivityItem[] }>('/activity')
      .then((r) => setItems(r.activity))
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load your history.'));
  }, []);

  const groups = useMemo(() => {
    const types = FILTERS.find((f) => f.id === filter)?.types;
    const shown = (items ?? []).filter((i) => !types || types.includes(i.type));
    const out: { key: string; label: string; items: ActivityItem[] }[] = [];
    for (const i of shown) {
      const key = dayKey(i.createdAt);
      if (out.at(-1)?.key !== key) out.push({ key, label: dayLabel(i.createdAt), items: [] });
      out.at(-1)!.items.push(i);
    }
    return out;
  }, [items, filter]);

  if (error) return <FormAlert>{error}</FormAlert>;
  if (!items) return <div className="skeleton" style={{ height: 320 }} />;

  return (
    <div className="card card--pad history">
      <div className="history__head">
        <div>
          <h2 className="history__title">Account history</h2>
          <p className="small muted">
            Everything done with <strong>{user!.email}</strong>. Only you can see this — each account has its own history.
          </p>
        </div>
        <span className="badge">
          {items.length} {items.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="chip-row history__filters" role="tablist" aria-label="Filter history">
        {FILTERS.map((f) => (
          <button key={f.id} type="button" role="tab" aria-selected={filter === f.id} className={`badge ${filter === f.id ? 'badge--blue' : ''}`} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {!groups.length ? (
        <div className="empty">
          <ClockIcon width={34} height={34} />
          <h4>Nothing here yet</h4>
          <p>{filter === 'all' ? 'Your sign-ins, bookings, payments and changes will appear here.' : 'No entries of this kind yet.'}</p>
        </div>
      ) : (
        groups.map((g) => (
          <section key={g.key} className="history__day">
            <h3 className="history__date">{g.label}</h3>
            <ol className="history__list">
              {g.items.map((i) => {
                const k = KINDS[i.type] ?? KINDS.ACCOUNT;
                return (
                  <li key={i.id} className="history__item">
                    <span className={`history__icon history__icon--${k.tone}`}>{k.icon}</span>
                    <div className="history__body">
                      <strong>{i.title}</strong>
                      {i.detail && <span className="small muted">{i.detail}</span>}
                      {i.ref?.startsWith('YA2-') && (
                        <Link className="text-link small" to={`/track?id=${encodeURIComponent(i.ref)}`}>
                          Track {i.ref}
                        </Link>
                      )}
                    </div>
                    <time className="xs muted tabular" dateTime={i.createdAt}>
                      {timeOf(i.createdAt)}
                    </time>
                  </li>
                );
              })}
            </ol>
          </section>
        ))
      )}
    </div>
  );
}
