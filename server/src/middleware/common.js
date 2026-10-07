import { ApiError, asyncHandler } from '../utils/http.js';
import { verifyAccessToken } from '../utils/security.js';
import { User } from '../models.js';

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  let status = err.status || 500;
  let message = err.expose ? err.message : 'Something went wrong. Please try again.';
  let errors = err.expose ? err.errors : undefined;

  if (err.name === 'ValidationError') {
    status = 422;
    message = 'Validation failed.';
    errors = Object.values(err.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  } else if (err.code === 11000) {
    status = 409;
    const field = Object.keys(err.keyPattern || {})[0] || 'value';
    message = 'A record with this value already exists.';
    errors = [{ field, message: 'Already exists.' }];
  } else if (err.name === 'CastError') {
    status = 400;
    message = 'Invalid identifier.';
  }

  if (status >= 500) console.error(err);
  return res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

export function notFound(req, res) {
  res.status(404).json({ success: false, message: 'Resource not found.' });
}

function attachUser(user) {
  const permissions = user.role?.permissions || [];
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    status: user.status,
    role: user.role
      ? { id: user.role._id.toString(), name: user.role.name, slug: user.role.slug }
      : null,
    permissions,
    profile: user.profile || {},
    settings: user.settings || {},
    doc: user,
  };
}

export function hasPermission(user, permission) {
  const permissions = user?.permissions || [];
  return permissions.includes('*') || permissions.includes(permission);
}

async function loadUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return null;
  const payload = verifyAccessToken(token);
  const user = await User.findById(payload.sub).populate('role');
  if (!user || user.status !== 'active') return null;
  return attachUser(user);
}

export const requireAuth = asyncHandler(async (req, res, next) => {
  try {
    const user = await loadUser(req);
    if (!user) throw new ApiError(401, 'Authentication required.');
    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError' || error.name === 'JsonWebTokenError') {
      throw new ApiError(401, 'Authentication required.');
    }
    throw error;
  }
});

export const optionalAuth = asyncHandler(async (req, res, next) => {
  try {
    req.user = await loadUser(req);
  } catch {
    req.user = null;
  }
  next();
});

export function requirePermission(...needed) {
  return (req, res, next) => {
    const allowed = needed.every((permission) => hasPermission(req.user, permission));
    if (!allowed) return next(new ApiError(403, 'You do not have permission to perform this action.'));
    return next();
  };
}

export { asyncHandler };
