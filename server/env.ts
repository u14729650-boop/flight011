import fs from 'node:fs';
import path from 'node:path';

// Minimal .env loader (no dependency). Real environment variables win.
const envFile = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const e = process.env;

export const ENV = {
  isProd: e.NODE_ENV === 'production',
  port: Number(e.PORT ?? 8787),
  /** Public URL of the site (used in emails and OAuth redirects). */
  appUrl: (e.APP_URL ?? 'http://localhost:5173').replace(/\/$/, ''),

  /** 'sqlite' (default, SQL database file), 'oracle', or 'file' (plain JSON, prototype only). */
  dbClient: (e.DB_CLIENT ?? 'sqlite') as 'sqlite' | 'oracle' | 'file',
  dataDir: e.DATA_DIR ?? path.resolve(process.cwd(), 'server/.data'),
  sqliteFile: e.SQLITE_FILE ?? path.resolve(process.cwd(), 'server/.data/ya2.db'),
  oracle: {
    user: e.ORACLE_USER ?? '',
    password: e.ORACLE_PASSWORD ?? '',
    connectString: e.ORACLE_CONNECT_STRING ?? '',
    walletDir: e.ORACLE_WALLET_DIR ?? '',
    walletPassword: e.ORACLE_WALLET_PASSWORD ?? '',
  },

  google: {
    clientId: e.GOOGLE_CLIENT_ID ?? '',
    clientSecret: e.GOOGLE_CLIENT_SECRET ?? '',
  },

  /** 'demo' (default) | 'razorpay' | 'stripe' */
  paymentProvider: (e.PAYMENT_PROVIDER ?? 'demo') as 'demo' | 'razorpay' | 'stripe',
  razorpay: { keyId: e.RAZORPAY_KEY_ID ?? '', keySecret: e.RAZORPAY_KEY_SECRET ?? '' },
  stripe: { secretKey: e.STRIPE_SECRET_KEY ?? '', publishableKey: e.STRIPE_PUBLISHABLE_KEY ?? '' },

  smtpUrl: e.SMTP_URL ?? '',
};
