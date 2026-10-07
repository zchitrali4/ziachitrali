import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';
import { createOpaqueToken, hashToken, signAccessToken } from '../utils/security.js';
import { EmailVerification, PasswordReset, Role, Session, User } from '../models.js';
import { presentUser } from '../presenters.js';
import { lookupCountryFromIp, normalizeCountry } from './geo.js';
import { devLink, sendPasswordReset, sendVerification, sendWelcome, verificationDelivery } from './mailService.js';

const REFRESH_COOKIE = 'ieds_refresh';

function cookieOptions(maxAgeMs) {
  const sameSite = env.cookieSameSite || 'lax';
  return {
    httpOnly: true,
    secure: env.cookieSecure || sameSite === 'none',
    sameSite,
    path: '/api/auth',
    maxAge: maxAgeMs,
  };
}

function publicUser(user) {
  const shaped = {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    status: user.status,
    role: user.role,
    permissions: user.role?.permissions || [],
    profile: user.profile,
    settings: user.settings,
  };
  return presentUser(shaped);
}

async function issueSession(user, { rememberMe, userAgent, ip, familyId }) {
  const raw = createOpaqueToken();
  const days = rememberMe ? env.refreshRememberDays : env.refreshTtlDays;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  await Session.create({
    user: user._id,
    tokenHash: hashToken(raw),
    familyId: familyId || createOpaqueToken(),
    expiresAt,
    userAgent,
    ip,
    rememberMe: Boolean(rememberMe),
  });
  const accessToken = signAccessToken(user._id, user.role?.slug || '');
  return { raw, accessToken, maxAgeMs: days * 24 * 60 * 60 * 1000 };
}

export function setRefreshCookie(res, token, maxAgeMs) {
  res.cookie(REFRESH_COOKIE, token, cookieOptions(maxAgeMs));
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, cookieOptions(0));
}

export async function registerUser({ name, email, password, userAgent, ip, country }) {
  const role = await Role.findOne({ slug: 'user' });
  if (!role) throw new ApiError(500, 'Member role is not configured.');
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) throw new ApiError(409, 'An account with this email already exists.', [
    { field: 'email', message: 'An account with this email already exists.' },
  ]);
  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role: role._id,
    signupCountry: normalizeCountry(country),
  });
  await user.populate('role');
  const verify = await createEmailToken(user._id);
  const verifyUrl = `${env.publicSiteUrl}/verify-email?token=${verify}`;
  const delivery = await deliverVerification(() => sendWelcome({ name: user.name, email: user.email, verifyUrl }), verifyUrl);
  const session = await issueSession(user, { rememberMe: true, userAgent, ip });
  return {
    user: publicUser(user),
    accessToken: session.accessToken,
    refresh: session,
    ...delivery,
  };
}

async function deliverVerification(send, url) {
  try {
    return verificationDelivery(await send(), url);
  } catch (error) {
    console.error('[mail]', error.message);
    return verificationDelivery({ status: 'failed' }, url);
  }
}

async function createEmailToken(userId) {
  const raw = createOpaqueToken();
  await EmailVerification.deleteMany({ user: userId });
  await EmailVerification.create({
    user: userId,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  return raw;
}

export async function loginUser({ email, password, rememberMe, userAgent, ip, country }) {
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password').populate('role');
  if (!user || user.status !== 'active') throw new ApiError(401, 'Email or password is incorrect.');
  const match = await user.comparePassword(password);
  if (!match) throw new ApiError(401, 'Email or password is incorrect.');
  if (!user.signupCountry) {
    const code = normalizeCountry(country) || await lookupCountryFromIp(ip);
    if (code) {
      user.signupCountry = code;
      await user.save();
    }
  }
  const session = await issueSession(user, { rememberMe, userAgent, ip });
  return { user: publicUser(user), accessToken: session.accessToken, refresh: session };
}

export async function refreshSession({ token, userAgent, ip }) {
  if (!token) throw new ApiError(401, 'Authentication required.');
  const existing = await Session.findOne({ tokenHash: hashToken(token) });
  if (!existing) throw new ApiError(401, 'Authentication required.');
  if (existing.revokedAt || existing.replacedBy) {
    await Session.updateMany(
      { familyId: existing.familyId, revokedAt: null },
      { revokedAt: new Date() },
    );
    throw new ApiError(401, 'Session is no longer valid. Sign in again.');
  }
  if (existing.expiresAt < new Date()) throw new ApiError(401, 'Authentication required.');
  const user = await User.findById(existing.user).populate('role');
  if (!user || user.status !== 'active') throw new ApiError(401, 'Authentication required.');
  const session = await issueSession(user, {
    rememberMe: existing.rememberMe,
    userAgent,
    ip,
    familyId: existing.familyId,
  });
  existing.revokedAt = new Date();
  existing.replacedBy = hashToken(session.raw);
  await existing.save();
  return { user: publicUser(user), accessToken: session.accessToken, refresh: session };
}

export async function logoutSession(token) {
  if (!token) return;
  await Session.updateOne({ tokenHash: hashToken(token) }, { revokedAt: new Date() });
}

export async function logoutAll(userId) {
  await Session.updateMany({ user: userId, revokedAt: null }, { revokedAt: new Date() });
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email: email.toLowerCase(), status: 'active' });
  if (!user) return {};
  const raw = createOpaqueToken();
  await PasswordReset.deleteMany({ user: user._id });
  await PasswordReset.create({
    user: user._id,
    tokenHash: hashToken(raw),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000),
  });
  const resetUrl = `${env.publicSiteUrl}/reset-password?token=${raw}`;
  try {
    await sendPasswordReset({ name: user.name, email: user.email, resetUrl });
  } catch (error) {
    console.error('[mail]', error.message);
  }
  const devResetUrl = devLink(resetUrl);
  return devResetUrl ? { devResetUrl } : {};
}

export async function resetPassword({ token, password }) {
  const record = await PasswordReset.findOne({ tokenHash: hashToken(token || '') });
  if (!record || record.expiresAt < new Date()) throw new ApiError(400, 'This reset link is invalid or expired.');
  const user = await User.findById(record.user).select('+password');
  if (!user || user.status !== 'active') throw new ApiError(400, 'This reset link is invalid or expired.');
  user.password = await bcrypt.hash(password, 12);
  await user.save();
  await PasswordReset.deleteMany({ user: user._id });
  await logoutAll(user._id);
}

export async function verifyEmail(token) {
  const record = await EmailVerification.findOne({ tokenHash: hashToken(token || '') });
  if (!record || record.expiresAt < new Date()) throw new ApiError(400, 'This verification link is invalid or expired.');
  const user = await User.findById(record.user);
  if (!user || user.status !== 'active') throw new ApiError(400, 'This verification link is invalid or expired.');
  if (!user.emailVerified) {
    user.emailVerified = true;
    await user.save();
  }
  if (!record.usedAt) {
    record.usedAt = new Date();
    await record.save();
  }
  return { verified: true };
}

export async function resendVerification(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, 'Account not found.');
  if (user.emailVerified) return { alreadyVerified: true };
  const token = await createEmailToken(user._id);
  const verifyUrl = `${env.publicSiteUrl}/verify-email?token=${token}`;
  return deliverVerification(() => sendVerification({ name: user.name, email: user.email, verifyUrl }), verifyUrl);
}

export { REFRESH_COOKIE, publicUser };
