import { ApiError } from '../api/http.js';

const STATUS_COPY = {
  401: 'Please sign in to continue.',
  403: 'You do not have permission to do that.',
  404: 'We could not find what you were looking for.',
  429: 'Too many attempts. Please wait and try again.',
  500: 'Something went wrong on our side. Please try again.',
};

function looksUnsafe(message) {
  return typeof message !== 'string' || message.includes('\n    at ') || message.length > 400;
}

export function normalizeError(error) {
  if (error?.name === 'AbortError') {
    return { message: 'Request cancelled.', status: 0, fieldErrors: {} };
  }
  if (!(error instanceof ApiError) && error instanceof TypeError) {
    return { message: 'Network error. Check your connection and try again.', status: 0, fieldErrors: {} };
  }
  const status = error?.status || 0;
  const serverMessage = looksUnsafe(error?.message) ? '' : error.message;
  const message = serverMessage || STATUS_COPY[status] || 'Something went wrong. Please try again.';
  const fieldErrors = {};
  (error?.errors || []).forEach((item) => {
    if (item?.field) fieldErrors[item.field] = item.message;
  });
  return { message, status, fieldErrors };
}
