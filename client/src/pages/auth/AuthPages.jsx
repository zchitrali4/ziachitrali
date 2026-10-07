import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/index.js';
import { getAccessToken } from '../../api/http.js';
import { PageHead } from '../../components/public/PageHead.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { normalizeError } from '../../utils/errors.js';
import { t } from '../../utils/i18n.js';

function AuthFrame({ title, lede, path, children }) {
  const { settings } = useSite();
  const { language, setLanguage } = usePreferences();
  return (
    <div className="auth-screen">
      <PageHead title={title} path={path} noIndex />
      <aside className="auth-aside">
        <Link className="auth-brand" to="/">
          <img src="/logo.png" alt="ضیاء چترالی" width="496" height="246" />
        </Link>
        <div className="auth-aside-copy">
          <p className="auth-kicker">{t(language, 'authMark')}</p>
          <p className="auth-quote">{t(language, 'authQuote')}</p>
        </div>
        <p className="auth-aside-foot">{settings.tagline}</p>
      </aside>
      <section className="auth-panel">
        <div className="auth-panel-top">
          <Link className="auth-back" to="/">{t(language, 'backLibrary')}</Link>
          <label className="lang-field">
            <span className="sr-only" id="auth-language-label">{t(language, 'language')}</span>
            <select className="lang-select" value={language} onChange={(event) => setLanguage(event.target.value)} aria-labelledby="auth-language-label">
              <option value="en">English</option>
              <option value="ur">اردو</option>
              <option value="ar">العربية</option>
            </select>
          </label>
        </div>
        <div className="auth-card">
          <h1>{title}</h1>
          {lede ? <p className="auth-lede">{lede}</p> : null}
          {children}
        </div>
      </section>
    </div>
  );
}

function withNext(path, params) {
  const next = params.get('next');
  return next ? `${path}?next=${encodeURIComponent(next)}` : path;
}

function safeNext(value) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account';
  return value;
}

export function LoginPage() {
  const { language } = usePreferences();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '', rememberMe: true });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(form);
      navigate(safeNext(params.get('next')));
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame title={t(language, 'signIn')} lede={t(language, 'signInLede')} path="/login">
      <form className="stack" onSubmit={submit}>
        <label className="field"><span>{t(language, 'email')}</span><input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label className="field"><span>{t(language, 'password')}</span><input required type="password" autoComplete="current-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /></label>
        <div className="auth-row">
          <label className="auth-check"><input type="checkbox" checked={form.rememberMe} onChange={(event) => setForm({ ...form, rememberMe: event.target.checked })} /> {t(language, 'remember')}</label>
          <Link to="/forgot-password">{t(language, 'forgot')}</Link>
        </div>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn" disabled={busy} type="submit">{busy ? t(language, 'signingIn') : t(language, 'signIn')}</button>
      </form>
        <p className="auth-links"><span>{t(language, 'needAccount')}</span> <Link to={withNext('/register', params)}>{t(language, 'register')}</Link></p>
    </AuthFrame>
  );
}

export function RegisterPage() {
  const { language } = usePreferences();
  const { register } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    if (!/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError(t(language, 'passwordHint'));
      setBusy(false);
      return;
    }
    try {
      await register(form);
      navigate(safeNext(params.get('next')));
    } catch (err) {
      const normalized = normalizeError(err);
      setError(normalized.fieldErrors.email || normalized.fieldErrors.password || normalized.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame title={t(language, 'register')} lede={t(language, 'registerLede')} path="/register">
      <form className="stack" onSubmit={submit}>
        <label className="field"><span>{t(language, 'name')}</span><input required autoComplete="name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label>
        <label className="field"><span>{t(language, 'email')}</span><input required type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label className="field"><span>{t(language, 'password')}</span><input required type="password" autoComplete="new-password" minLength={8} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} /><small>{t(language, 'passwordHint')}</small></label>
        {error ? <p className="form-error">{error}</p> : null}
        <button className="btn" disabled={busy} type="submit">{busy ? t(language, 'creating') : t(language, 'register')}</button>
      </form>
      <p className="auth-links"><span>{t(language, 'haveAccount')}</span> <Link to={withNext('/login', params)}>{t(language, 'signIn')}</Link></p>
    </AuthFrame>
  );
}

export function ForgotPasswordPage() {
  const { language } = usePreferences();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = await authApi.forgot({ email });
      setMessage(payload.data.message);
      setLink(payload.data.devResetUrl || '');
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthFrame title={t(language, 'forgot')} lede={t(language, 'forgotLede')} path="/forgot-password">
      {message ? (
        <div className="stack">
          <p className="form-ok">{t(language, 'resetSent')}</p>
          {link ? <p className="meta"><a href={link}>{link}</a></p> : null}
          <Link className="btn" to="/login">{t(language, 'signIn')}</Link>
        </div>
      ) : (
        <form className="stack" onSubmit={submit}>
          <label className="field"><span>{t(language, 'email')}</span><input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn" disabled={busy} type="submit">{busy ? t(language, 'sendingReset') : t(language, 'requestReset')}</button>
        </form>
      )}
      <p className="auth-links"><span>{t(language, 'remembered')}</span> <Link to="/login">{t(language, 'signIn')}</Link></p>
    </AuthFrame>
  );
}

export function ResetPasswordPage() {
  const { language } = usePreferences();
  const [params] = useSearchParams();
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function submit(event) {
    event.preventDefault();
    try {
      await authApi.reset({ token: params.get('token') || '', password });
      setMessage(t(language, 'passwordUpdated'));
    } catch (err) {
      setError(normalizeError(err).message);
    }
  }

  return (
    <AuthFrame title={t(language, 'resetTitle')} lede={t(language, 'resetLede')} path="/reset-password">
      {message ? (
        <div className="stack">
          <p className="form-ok">{message}</p>
          <Link className="btn" to="/login">{t(language, 'signIn')}</Link>
        </div>
      ) : (
        <form className="stack" onSubmit={submit}>
          <label className="field"><span>{t(language, 'newPassword')}</span><input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /><small>{t(language, 'passwordHint')}</small></label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn" type="submit">{t(language, 'updatePassword')}</button>
        </form>
      )}
    </AuthFrame>
  );
}

export function VerifyEmailPage() {
  const { language } = usePreferences();
  const { user, status, refresh, updateUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const token = params.get('token') || '';
  const [phase, setPhase] = useState('working');
  const [error, setError] = useState('');
  const ran = useRef('');

  useEffect(() => {
    if (!token || ran.current === token) return undefined;
    ran.current = token;
    authApi.verify({ token })
      .then(async () => {
        sessionStorage.setItem('ieds.emailVerified', '1');
        const signedIn = await refresh();
        if (signedIn && getAccessToken()) {
          try {
            const me = await authApi.me();
            updateUser(me.data);
          } catch {
            /* The refreshed account is already loaded. */
          }
        }
        setPhase('ok');
        setParams({}, { replace: true });
      })
      .catch((err) => {
        setPhase('error');
        setError(normalizeError(err).message);
      });
    return undefined;
  }, [token, refresh, setParams, updateUser]);

  const remembered = !token && sessionStorage.getItem('ieds.emailVerified') === '1';
  const shown = phase === 'working' && !token ? (remembered ? 'ok' : 'missing') : phase;
  const signedIn = status === 'ready' && Boolean(user);

  return (
    <AuthFrame title={t(language, 'verifyTitle')} lede={t(language, 'verifyLede')} path="/verify-email">
      {shown === 'ok' ? (
        <div className="stack">
          <p className="form-ok">{signedIn ? t(language, 'emailVerified') : t(language, 'emailVerifiedSignIn')}</p>
          <Link className="btn" to={signedIn ? '/account' : '/login'}>{signedIn ? t(language, 'account') : t(language, 'signIn')}</Link>
        </div>
      ) : shown === 'error' || shown === 'missing' ? (
        <div className="stack">
          <p className="form-error">{shown === 'missing' ? t(language, 'verifyMissing') : error}</p>
          <p className="meta">{t(language, 'verifyExpiredHint')}</p>
          <Link className="btn" to={signedIn ? '/account' : '/login'}>{signedIn ? t(language, 'account') : t(language, 'signIn')}</Link>
        </div>
      ) : (
        <p className="meta">{t(language, 'verifyWorking')}</p>
      )}
    </AuthFrame>
  );
}
