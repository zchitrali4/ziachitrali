const API_BASE = import.meta.env.VITE_API_URL || '/api';

export class ApiError extends Error {
  constructor(message, status = 0, errors = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errors = Array.isArray(errors) ? errors : [];
  }
}

let accessToken = '';
let refreshHandler = null;

export function setAccessToken(token) {
  accessToken = token || '';
}

export function getAccessToken() {
  return accessToken;
}

export function setRefreshHandler(handler) {
  refreshHandler = handler;
}

async function parsePayload(response) {
  return response.json().catch(() => null);
}

export async function api(path, {
  method = 'GET',
  body,
  auth = true,
  signal,
  headers = {},
} = {}) {
  const send = async (allowRefresh) => {
    let response;
    try {
      const timeout = AbortSignal.timeout(12000);
      response = await fetch(`${API_BASE}${path}`, {
        method,
        credentials: 'include',
        signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
        headers: {
          Accept: 'application/json',
          'Accept-Language': localStorage.getItem('ieds.language') || 'en',
          ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
          ...(auth && accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          ...headers,
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      throw new ApiError('Network error. Check your connection and try again.', 0);
    }

    const type = response.headers.get('content-type') || '';
    if (!type.includes('json')) {
      throw new ApiError('The library desk did not answer.', response.status || 502);
    }
    const payload = await parsePayload(response);
    if (response.status === 401 && allowRefresh && auth && refreshHandler && !path.startsWith('/auth/')) {
      const refreshed = await refreshHandler();
      if (refreshed) return send(false);
    }
    if (!response.ok || payload?.success === false) {
      throw new ApiError(payload?.message || 'Request failed.', response.status, payload?.errors || []);
    }
    return payload;
  };

  return send(true);
}
