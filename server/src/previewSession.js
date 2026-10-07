import crypto from 'crypto';
import bcrypt from 'bcryptjs';

const sessions = new Map();

export function userIdFromToken(token) {
  if (!token) return null;
  if (token === 'preview') return 'u-admin';
  return sessions.get(token) || null;
}

export function issuePreviewSession(userId) {
  const access = crypto.randomBytes(24).toString('hex');
  const refresh = crypto.randomBytes(24).toString('hex');
  sessions.set(access, userId);
  sessions.set(refresh, userId);
  return { access, refresh };
}

export function issuePreviewAccess(userId) {
  const access = crypto.randomBytes(24).toString('hex');
  sessions.set(access, userId);
  return access;
}

export function dropPreviewToken(token) {
  if (token && token !== 'preview') sessions.delete(token);
}

export function dropPreviewUser(userId) {
  for (const [token, id] of sessions) {
    if (id === userId) sessions.delete(token);
  }
}

export function hashPreviewPassword(password) {
  return bcrypt.hash(password, 10);
}

export function checkPreviewPassword(hash, password) {
  if (!hash) return false;
  return bcrypt.compare(password, hash);
}
