import crypto from 'node:crypto';
import { promisify } from 'node:util';
import type { Request, RequestHandler, Response } from 'express';
import { db } from '../db';
import type { UserRecord } from '../db/types';
import { ENV } from '../env';
import { HttpError } from '../lib/http';
import type { PublicUser } from '../../src/lib/apiTypes';

const scrypt = promisify(crypto.scrypt) as (pw: string, salt: Buffer, len: number, opts: crypto.ScryptOptions) => Promise<Buffer>;
const SCRYPT = { N: 16384, r: 8, p: 1, keyLen: 64 };

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt, SCRYPT.keyLen, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return `scrypt$${SCRYPT.N}$${SCRYPT.r}$${SCRYPT.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

export async function verifyPassword(password: string, stored: string | null): Promise<boolean> {
  if (!stored) return false;
  const [algo, N, r, p, salt, hash] = stored.split('$');
  if (algo !== 'scrypt') return false;
  const expected = Buffer.from(hash, 'base64');
  const key = await scrypt(password, Buffer.from(salt, 'base64'), expected.length, { N: +N, r: +r, p: +p });
  return crypto.timingSafeEqual(key, expected);
}

/** At least 8 characters with a letter and a number. */
export function passwordProblem(pw: string): string | null {
  if (pw.length < 8) return 'Password must be at least 8 characters.';
  if (pw.length > 128) return 'Password is too long.';
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) return 'Password must include a letter and a number.';
  return null;
}

export const sha256 = (s: string) => crypto.createHash('sha256').update(s).digest('hex');

const COOKIE = 'ya2_sid';
const SESSION_DAYS = 14;

export async function startSession(res: Response, userId: string) {
  const token = crypto.randomBytes(32).toString('base64url');
  const expires = new Date(Date.now() + SESSION_DAYS * 864e5);
  await db().sessions.create({ tokenHash: sha256(token), userId, expiresAt: expires.toISOString(), createdAt: new Date().toISOString() });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: ENV.isProd,
    expires,
    path: '/',
  });
}

function readToken(req: Request): string | null {
  const raw = req.headers.cookie;
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const [k, ...v] = part.trim().split('=');
    if (k === COOKIE) return decodeURIComponent(v.join('='));
  }
  return null;
}

export async function endSession(req: Request, res: Response) {
  const token = readToken(req);
  if (token) await db().sessions.delete(sha256(token));
  res.clearCookie(COOKIE, { path: '/' });
}

export const currentTokenHash = (req: Request) => {
  const t = readToken(req);
  return t ? sha256(t) : undefined;
};

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserRecord;
  }
}

/** Attaches req.user when a valid session cookie is present. */
export const loadUser: RequestHandler = async (req, _res, next) => {
  try {
    const token = readToken(req);
    if (token) {
      const session = await db().sessions.find(sha256(token));
      if (session) req.user = (await db().users.findById(session.userId)) ?? undefined;
    }
    next();
  } catch (e) {
    next(e);
  }
};

export const requireAuth: RequestHandler = (req, _res, next) => {
  if (!req.user) return next(new HttpError(401, 'Please log in to continue.'));
  next();
};

export const toPublicUser = (u: UserRecord): PublicUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  phone: u.phone,
  authProvider: u.passwordHash ? 'password' : 'google',
  createdAt: u.createdAt,
});
