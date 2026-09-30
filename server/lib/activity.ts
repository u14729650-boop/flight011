/**
 * Per-account history. Every entry belongs to one user and is only ever read
 * back by that user (GET /api/activity). Logging never breaks the action that
 * triggered it.
 */
import type { Request } from 'express';
import type { ActivityType } from '../../src/lib/apiTypes';
import { describeDevice } from '../../src/lib/device';
import { db } from '../db';
import { newId } from './http';

/** "Chrome on Windows" for the request's browser. */
export const deviceOf = (req: Request) => describeDevice(req.headers['user-agent'] ?? '');

export async function logActivity(userId: string, type: ActivityType, title: string, detail: string | null = null, ref: string | null = null) {
  try {
    await db().activity.add(userId, { id: newId(), type, title: title.slice(0, 200), detail: detail?.slice(0, 500) ?? null, ref, createdAt: new Date().toISOString() });
  } catch (e) {
    console.error('[activity] could not record', type, e);
  }
}
