import crypto from 'node:crypto';
import { Router } from 'express';
import { db } from '../db';
import { ENV } from '../env';
import { sendMail } from '../lib/mail';
import { EMAIL_RE, HttpError, PHONE_RE, newId, rateLimit, route, str } from '../lib/http';
import { endSession, hashPassword, passwordProblem, sha256, startSession, toPublicUser, verifyPassword } from '../auth/auth';

export const authRouter = Router();
const limiter = rateLimit('auth', 12, 60_000);

authRouter.get('/me', (req, res) => {
  res.json({ user: req.user ? toPublicUser(req.user) : null });
});

authRouter.get('/providers', (_req, res) => {
  // The official Google button only needs the Client ID; the secret is for the older redirect flow.
  res.json({ google: Boolean(ENV.google.clientId), googleClientId: ENV.google.clientId || null });
});

authRouter.post(
  '/register',
  limiter,
  route(async (req, res) => {
    const name = str(req.body.name, 120);
    const email = str(req.body.email, 254).toLowerCase();
    const phone = str(req.body.phone, 20);
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    const fields: Record<string, string> = {};
    if (name.length < 2) fields.name = 'Enter your full name.';
    if (!EMAIL_RE.test(email)) fields.email = 'Enter a valid email address.';
    if (!PHONE_RE.test(phone)) fields.phone = 'Enter a valid phone number.';
    const pwErr = passwordProblem(password);
    if (pwErr) fields.password = pwErr;
    if (Object.keys(fields).length) throw new HttpError(400, 'Please check the highlighted fields.', fields);

    if (await db().users.findByEmail(email)) {
      throw new HttpError(409, 'An account with this email already exists.', { email: 'An account with this email already exists. Try logging in.' });
    }
    const now = new Date().toISOString();
    const user = await db().users.create({
      id: newId(),
      name,
      email,
      phone,
      passwordHash: await hashPassword(password),
      googleId: null,
      createdAt: now,
      updatedAt: now,
    });
    await startSession(res, user.id);
    res.status(201).json({ user: toPublicUser(user) });
  }),
);

authRouter.post(
  '/login',
  limiter,
  route(async (req, res) => {
    const email = str(req.body.email, 254).toLowerCase();
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    if (!email || !password) throw new HttpError(400, 'Enter your email and password.');
    const user = await db().users.findByEmail(email);
    const ok = user ? await verifyPassword(password, user.passwordHash) : await hashPassword(password).then(() => false);
    if (!user || !ok) {
      if (user && !user.passwordHash) throw new HttpError(401, 'This account uses Google sign-in. Continue with Google, or reset your password to add one.');
      throw new HttpError(401, 'Incorrect email or password.');
    }
    await startSession(res, user.id);
    res.json({ user: toPublicUser(user) });
  }),
);

authRouter.post(
  '/logout',
  route(async (req, res) => {
    await endSession(req, res);
    res.json({ ok: true });
  }),
);

authRouter.post(
  '/forgot-password',
  rateLimit('forgot', 5, 60_000),
  route(async (req, res) => {
    const email = str(req.body.email, 254).toLowerCase();
    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Enter a valid email address.', { email: 'Enter a valid email address.' });
    const user = await db().users.findByEmail(email);
    let devResetUrl: string | undefined;
    if (user) {
      const token = crypto.randomBytes(32).toString('base64url');
      await db().resets.create({
        tokenHash: sha256(token),
        userId: user.id,
        expiresAt: new Date(Date.now() + 30 * 60_000).toISOString(),
        usedAt: null,
      });
      const url = `${ENV.appUrl}/reset-password?token=${token}`;
      const delivered = await sendMail({
        to: user.email,
        subject: 'Reset your YA² password',
        text: `Hello ${user.name},\n\nUse the link below to set a new password. It expires in 30 minutes.\n\n${url}\n\nIf you did not ask for this, you can ignore this email.\n\n— YA² Transport`,
      });
      if (!delivered && !ENV.isProd) devResetUrl = url;
    }
    // Same response whether or not the account exists (prevents email enumeration).
    res.json({ ok: true, devResetUrl });
  }),
);

authRouter.post(
  '/reset-password',
  limiter,
  route(async (req, res) => {
    const token = str(req.body.token, 200);
    const password = typeof req.body.password === 'string' ? req.body.password : '';
    const pwErr = passwordProblem(password);
    if (pwErr) throw new HttpError(400, pwErr, { password: pwErr });
    const rec = token ? await db().resets.find(sha256(token)) : null;
    if (!rec || rec.usedAt || Date.parse(rec.expiresAt) < Date.now()) {
      throw new HttpError(400, 'This reset link is invalid or has expired. Request a new one.');
    }
    await db().users.update(rec.userId, { passwordHash: await hashPassword(password) });
    await db().resets.markUsed(rec.tokenHash);
    await db().sessions.deleteForUser(rec.userId);
    await startSession(res, rec.userId);
    const user = await db().users.findById(rec.userId);
    res.json({ user: user && toPublicUser(user) });
  }),
);

/* ---------------------------- Google OAuth 2.0 ---------------------------- */

const GOOGLE_STATE_COOKIE = 'ya2_oauth_state';
type GoogleProfile = { sub: string; email: string; name?: string };

/** Signs in the Google account: same Google ID or same email → existing user, otherwise a new one. */
async function findOrCreateGoogleUser(info: GoogleProfile) {
  let user = (await db().users.findByGoogleId(info.sub)) ?? (await db().users.findByEmail(info.email.toLowerCase()));
  if (user && !user.googleId) user = await db().users.update(user.id, { googleId: info.sub });
  if (user) return user;
  const now = new Date().toISOString();
  return db().users.create({
    id: newId(),
    name: info.name ?? info.email.split('@')[0],
    email: info.email.toLowerCase(),
    phone: null,
    passwordHash: null,
    googleId: info.sub,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * "Continue with Google" popup (Google Identity Services token client): the
 * browser sends the access token Google issued to our Client ID; Google's own
 * endpoints confirm it was issued for us and return the verified profile.
 */
authRouter.post(
  '/google/token',
  limiter,
  route(async (req, res) => {
    if (!ENV.google.clientId) throw new HttpError(503, 'Google sign-in is not configured yet.');
    const accessToken = str(req.body.accessToken, 4096);
    if (!accessToken) throw new HttpError(400, 'Missing Google access token.');
    const google = (url: string, init?: RequestInit) =>
      fetch(url, init).catch(() => {
        throw new HttpError(502, 'Could not reach Google. Please try again.');
      });
    const failed = new HttpError(401, 'Google sign-in did not complete. Please try again.');

    // 1. The token must have been issued to YA²'s Client ID (not to some other site).
    const infoRes = await google(`https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(accessToken)}`);
    if (!infoRes.ok) throw failed;
    const info = (await infoRes.json()) as { aud?: string; expires_in?: string };
    if (info.aud !== ENV.google.clientId || !(Number(info.expires_in) > 0)) throw failed;

    // 2. Who signed in.
    const meRes = await google('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!meRes.ok) throw failed;
    const me = (await meRes.json()) as { sub?: string; email?: string; email_verified?: boolean; name?: string };
    if (!me.sub || !me.email) throw failed;
    if (me.email_verified !== true) throw new HttpError(401, 'Your Google email address is not verified.');

    const user = await findOrCreateGoogleUser({ sub: me.sub, email: me.email, name: me.name });
    await startSession(res, user.id);
    res.json({ user: toPublicUser(user) });
  }),
);

const googleRedirectUri = () => `${ENV.appUrl}/api/auth/google/callback`;

authRouter.get('/google', (req, res) => {
  if (!ENV.google.clientId || !ENV.google.clientSecret) {
    return res.redirect('/login?error=google_not_configured');
  }
  const state = crypto.randomBytes(16).toString('base64url');
  const next = typeof req.query.next === 'string' && req.query.next.startsWith('/') ? req.query.next : '/dashboard';
  res.cookie(GOOGLE_STATE_COOKIE, `${state}|${next}`, { httpOnly: true, sameSite: 'lax', secure: ENV.isProd, maxAge: 10 * 60_000, path: '/' });
  const params = new URLSearchParams({
    client_id: ENV.google.clientId,
    redirect_uri: googleRedirectUri(),
    response_type: 'code',
    scope: 'openid email profile',
    state,
    prompt: 'select_account',
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
});

authRouter.get(
  '/google/callback',
  route(async (req, res) => {
    const cookie = (req.headers.cookie ?? '').split(';').map((c) => c.trim()).find((c) => c.startsWith(`${GOOGLE_STATE_COOKIE}=`));
    const [savedState, next = '/dashboard'] = decodeURIComponent(cookie?.split('=')[1] ?? '').split('|');
    res.clearCookie(GOOGLE_STATE_COOKIE, { path: '/' });
    if (!savedState || req.query.state !== savedState || typeof req.query.code !== 'string') {
      return res.redirect('/login?error=google_failed');
    }
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: req.query.code,
        client_id: ENV.google.clientId,
        client_secret: ENV.google.clientSecret,
        redirect_uri: googleRedirectUri(),
        grant_type: 'authorization_code',
      }),
    });
    if (!tokenRes.ok) return res.redirect('/login?error=google_failed');
    const { access_token } = (await tokenRes.json()) as { access_token: string };
    const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { Authorization: `Bearer ${access_token}` } });
    if (!infoRes.ok) return res.redirect('/login?error=google_failed');
    const info = (await infoRes.json()) as { sub: string; email: string; email_verified: boolean; name?: string };
    if (!info.email_verified) return res.redirect('/login?error=google_unverified');

    const user = await findOrCreateGoogleUser(info);
    await startSession(res, user.id);
    res.redirect(next.startsWith('/') ? next : '/dashboard');
  }),
);
