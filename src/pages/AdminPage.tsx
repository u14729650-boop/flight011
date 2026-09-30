import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Logo } from '../components/brand/Logo';
import { Button } from '../components/ui/Button';
import { FormAlert, PasswordField } from '../components/ui/Fields';
import { LockIcon, LogoutIcon, SearchIcon } from '../components/ui/Icons';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { api, ApiError, IS_PREVIEW } from '../lib/api';
import { formatINR } from '../lib/format';
import { useSeo } from '../lib/seo';

interface Status {
  enabled: boolean;
  signedIn: boolean;
  database: string;
}
interface Overview {
  counts: Record<string, number>;
  revenue: number;
  byStatus: { status: string; n: number }[];
  tables: Record<string, string>;
}
interface Grid {
  columns: string[];
  rows: Record<string, unknown>[];
}

const MONEY = /^(price|amount|total)$/;
const DATE = /(_at|delivery)$/;

function cell(col: string, v: unknown): string {
  if (v === null || v === undefined || v === '') return '—';
  if (MONEY.test(col) && typeof v === 'number') return formatINR(v);
  if (DATE.test(col) && typeof v === 'string' && /^\d{4}-\d\d-\d\dT/.test(v)) {
    return new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  }
  return String(v);
}

const headerLabel = (c: string) => c.replace(/_/g, ' ');

function toCsv(g: Grid) {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [g.columns.map(esc).join(','), ...g.rows.map((r) => g.columns.map((c) => esc(r[c])).join(','))].join('\n');
}

function DataTable({ grid, name }: { grid: Grid; name: string }) {
  const [q, setQ] = useState('');
  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    if (!n) return grid.rows;
    return grid.rows.filter((r) => grid.columns.some((c) => String(r[c] ?? '').toLowerCase().includes(n)));
  }, [grid, q]);

  const download = () => {
    const url = URL.createObjectURL(new Blob([toCsv({ columns: grid.columns, rows })], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `ya2-${name}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="adm-table">
      <div className="adm-table__bar">
        <label className="adm-search">
          <SearchIcon />
          <input id={`search-${name}`} placeholder="Search these rows" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <span className="adm-table__count tabular">
          {rows.length} of {grid.rows.length} row{grid.rows.length === 1 ? '' : 's'}
        </span>
        {grid.rows.length > 0 && (
          <Button size="sm" variant="secondary" onClick={download}>
            Download CSV
          </Button>
        )}
      </div>
      {grid.rows.length === 0 ? (
        <div className="empty">
          <h4>No rows yet</h4>
          <p>Data appears here as soon as someone uses the site.</p>
        </div>
      ) : (
        <div className="adm-table__scroll">
          <table>
            <thead>
              <tr>
                {grid.columns.map((c) => (
                  <th key={c}>{headerLabel(c)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i}>
                  {grid.columns.map((c) => (
                    <td key={c} className={MONEY.test(c) || typeof r[c] === 'number' ? 'num' : c === 'message' ? 'wrap' : ''}>
                      {cell(c, r[c])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const PRESETS = [
  { label: 'Latest enquiries', sql: 'SELECT created_at, name, email, subject, message FROM contact_messages ORDER BY created_at DESC LIMIT 20' },
  {
    label: 'Shipments with customer',
    sql: "SELECT s.tracking_id, u.name AS customer, s.sender_city || ' → ' || s.receiver_city AS route, s.mode, s.weight_kg, s.price, s.status\nFROM shipments s JOIN users u ON u.id = s.user_id\nORDER BY s.created_at DESC",
  },
  { label: 'Revenue by mode', sql: "SELECT s.mode, COUNT(*) AS bookings, SUM(p.amount) AS revenue\nFROM payments p JOIN shipments s ON s.id = p.shipment_id\nWHERE p.status = 'PAID'\nGROUP BY s.mode" },
  { label: 'Top routes', sql: "SELECT sender_state || ' → ' || receiver_state AS route, COUNT(*) AS shipments, AVG(price) AS avg_price\nFROM shipments GROUP BY route ORDER BY shipments DESC LIMIT 10" },
  { label: 'New users per day', sql: 'SELECT substr(created_at, 1, 10) AS day, COUNT(*) AS new_users FROM users GROUP BY day ORDER BY day DESC' },
];

/** The same questions in Oracle SQL (tables carry a ya2_ prefix; sender/receiver are JSON). */
const ORACLE_PRESETS = [
  { label: 'Latest enquiries', sql: 'SELECT created_at, name, email, subject, message FROM ya2_contact_messages ORDER BY created_at DESC FETCH FIRST 20 ROWS ONLY' },
  {
    label: 'Shipments with customer',
    sql: "SELECT s.tracking_id, u.name AS customer,\n       JSON_VALUE(s.sender_json, '$.city') || ' → ' || JSON_VALUE(s.receiver_json, '$.city') AS route,\n       s.mode_code AS \"MODE\", s.weight_kg, s.price, s.status\nFROM ya2_shipments s JOIN ya2_users u ON u.id = s.user_id\nORDER BY s.created_at DESC",
  },
  { label: 'Revenue by mode', sql: "SELECT s.mode_code AS \"MODE\", COUNT(*) AS bookings, SUM(p.amount) AS revenue\nFROM ya2_payments p JOIN ya2_shipments s ON s.id = p.shipment_id\nWHERE p.status = 'PAID'\nGROUP BY s.mode_code" },
  { label: 'Top routes', sql: "SELECT pickup_state || ' → ' || destination_state AS route, COUNT(*) AS shipments, ROUND(AVG(price)) AS avg_price\nFROM ya2_shipments GROUP BY pickup_state, destination_state ORDER BY shipments DESC FETCH FIRST 10 ROWS ONLY" },
  { label: 'New users per day', sql: "SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS day, COUNT(*) AS new_users FROM ya2_users GROUP BY TO_CHAR(created_at, 'YYYY-MM-DD') ORDER BY day DESC" },
];

function SqlConsole({ database }: { database: string }) {
  const presets = database === 'oracle' ? ORACLE_PRESETS : PRESETS;
  const [sql, setSql] = useState(presets[1].sql);
  const [result, setResult] = useState<(Grid & { ms: number; truncated: boolean }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      setResult(await api.post('/admin/sql', { sql }));
    } catch (e) {
      setResult(null);
      setError(e instanceof ApiError ? e.message : 'Query failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="adm-sql">
      <div className="adm-sql__presets">
        {presets.map((p) => (
          <button key={p.label} type="button" className="badge" onClick={() => setSql(p.sql)}>
            {p.label}
          </button>
        ))}
      </div>
      <label htmlFor="adm-sql-input" className="field__label">
        SQL query (read-only: SELECT)
      </label>
      <textarea
        id="adm-sql-input"
        className="textarea adm-sql__input"
        spellCheck={false}
        value={sql}
        onChange={(e) => setSql(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) void run();
        }}
      />
      <div className="row-actions">
        <Button onClick={run} loading={loading} arrow="right">
          Run query
        </Button>
        <span className="xs muted">Ctrl + Enter to run · results are capped at 500 rows · password hashes are always hidden</span>
      </div>
      {error && <FormAlert>{error}</FormAlert>}
      {result && (
        <>
          <p className="xs muted tabular">
            {result.rows.length} row{result.rows.length === 1 ? '' : 's'} in {result.ms} ms{result.truncated ? ' (first 500 shown)' : ''}
          </p>
          <DataTable grid={result} name="query" />
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  useSeo({ title: 'Admin console', description: 'YA² internal admin console.', noindex: true });
  const [status, setStatus] = useState<Status | null>(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState('overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [grid, setGrid] = useState<Grid | null>(null);

  const refreshStatus = useCallback(() => {
    api
      .get<Status>('/admin/status')
      .then(setStatus)
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not reach the server.'));
  }, []);
  useEffect(refreshStatus, [refreshStatus]);

  useEffect(() => {
    if (!status?.signedIn) return;
    setError(null);
    if (tab === 'overview' || !overview) {
      api
        .get<Overview>('/admin/overview')
        .then(setOverview)
        .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load overview.'));
    }
    if (tab !== 'overview' && tab !== 'sql') {
      setGrid(null);
      api
        .get<Grid>(`/admin/table/${tab}`)
        .then(setGrid)
        .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not load table.'));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status?.signedIn, tab]);

  const login = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await api.post('/admin/login', { password });
      setPassword('');
      refreshStatus();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Login failed.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await api.post('/admin/logout');
    setOverview(null);
    setTab('overview');
    refreshStatus();
  };

  if (!status || !status.signedIn) {
    return (
      <div className="adm-login">
        <form className="adm-login__card card card--pad" onSubmit={login} noValidate>
          <Logo size={40} />
          <div>
            <h1 className="form-title">
              <LockIcon width={20} /> Admin console
            </h1>
            <p className="muted small">Internal page for YA² staff. Enquiries, bookings, payments and the SQL console.</p>
          </div>
          {status && !status.enabled ? (
            <FormAlert kind="warning">The admin console is switched off. Set ADMIN_PASSWORD on the server and restart it.</FormAlert>
          ) : (
            <>
              {error && <FormAlert>{error}</FormAlert>}
              <PasswordField label="Admin password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} autoFocus />
              {IS_PREVIEW && <p className="xs muted">Preview build: the admin password is <code>ya2-demo</code>.</p>}
              <Button type="submit" block arrow="right" loading={loading} disabled={!status}>
                Open console
              </Button>
            </>
          )}
          <Link to="/" className="text-link small">
            ← Back to website
          </Link>
        </form>
      </div>
    );
  }

  const tabs: [string, string][] = [['overview', 'Overview'], ...Object.entries(overview?.tables ?? {}), ['sql', 'SQL console']];

  return (
    <div className="adm">
      <header className="adm__top">
        <Logo size={34} />
        <span className="adm__title">Admin console</span>
        <span className="badge badge--emerald badge--dot">{status.database === 'oracle' ? 'Oracle Database' : status.database === 'sqlite' ? 'SQLite database' : status.database}</span>
        <div className="adm__actions">
          <ThemeToggle />
          <Link to="/" className="btn btn--ghost btn--sm">
            View site
          </Link>
          <Button size="sm" variant="secondary" icon={<LogoutIcon width={16} />} onClick={logout}>
            Sign out
          </Button>
        </div>
      </header>

      <nav className="adm__tabs" aria-label="Admin sections">
        {tabs.map(([id, label]) => (
          <button key={id} className={`adm__tab ${tab === id ? 'is-active' : ''}`} onClick={() => setTab(id)} aria-current={tab === id ? 'page' : undefined}>
            {label}
            {overview && id in overview.counts && <span className="adm__tab-n tabular">{overview.counts[id]}</span>}
          </button>
        ))}
      </nav>

      <main className="adm__main">
        {error && <FormAlert>{error}</FormAlert>}
        {tab === 'overview' && overview && (
          <div className="adm-overview">
            <div className="adm-tiles">
              {[
                ['Enquiries', overview.counts.contact_messages],
                ['Users', overview.counts.users],
                ['Shipments', overview.counts.shipments],
                ['Payments', overview.counts.payments],
              ].map(([l, n]) => (
                <div key={l} className="adm-tile card">
                  <span>{l}</span>
                  <strong className="tabular">{n}</strong>
                </div>
              ))}
              <div className="adm-tile card">
                <span>Paid (demo mode)</span>
                <strong className="tabular">{formatINR(overview.revenue)}</strong>
              </div>
            </div>
            <div className="card card--pad">
              <h2 className="form-title">Shipments by status</h2>
              {overview.byStatus.length === 0 ? (
                <p className="muted small">No shipments yet.</p>
              ) : (
                <ul className="adm-status">
                  {overview.byStatus.map((s) => (
                    <li key={s.status}>
                      <span>{s.status.replace(/_/g, ' ').toLowerCase()}</span>
                      <span className="adm-status__bar">
                        <span style={{ width: `${(s.n / Math.max(...overview.byStatus.map((x) => x.n))) * 100}%` }} />
                      </span>
                      <strong className="tabular">{s.n}</strong>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <p className="xs muted">Tip: press Ctrl + Shift + A anywhere on the site to open this console.</p>
          </div>
        )}
        {tab === 'sql' && <SqlConsole database={status.database} />}
        {tab !== 'overview' && tab !== 'sql' && (grid ? <DataTable grid={grid} name={tab} /> : <div className="skeleton" style={{ height: 320 }} />)}
      </main>
    </div>
  );
}
