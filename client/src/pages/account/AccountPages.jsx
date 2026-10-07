import { useCallback, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { accountApi, authApi, engagementApi } from '../../api/index.js';
import { ContentGrid } from '../../components/content/universal/ContentGrid.jsx';
import { EmptyState } from '../../components/content/universal/EmptyState.jsx';
import { ErrorState } from '../../components/content/universal/ErrorState.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { SkeletonRenderer } from '../../components/skeletons/SkeletonRenderer.jsx';
import { contentPath } from '../../config/contentRegistry.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useQuery } from '../../hooks/useQuery.js';
import { normalizeError } from '../../utils/errors.js';
import { t } from '../../utils/i18n.js';
import { readLocalHistory } from '../../utils/storage.js';
import { Link } from 'react-router-dom';

const LINKS = [
  ['/account', 'overview'],
  ['/account/profile', 'profile'],
  ['/account/bookmarks', 'bookmarks'],
  ['/account/likes', 'likes'],
  ['/account/reading-history', 'readingHistory'],
  ['/account/orders', 'myOrders'],
  ['/account/settings', 'settings'],
];

function mark(name) {
  const letter = (name || '').trim().slice(0, 1);
  return letter || '·';
}

export function AccountLayout() {
  const { user } = useAuth();
  const { language } = usePreferences();
  return (
    <div className="wrap account-shell">
      <PageHead title={t(language, 'account')} path="/account" noIndex />
      <aside className="account-rail">
        <div className="account-who">
          {user?.profile?.avatarUrl
            ? <img className="profile-photo" src={user.profile.avatarUrl} alt="" />
            : <span className="profile-photo profile-mark">{mark(user?.name)}</span>}
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
        </div>
        <nav className="account-nav" aria-label={t(language, 'account')}>
          {LINKS.map(([to, key]) => (
            <NavLink key={to} to={to} end={to === '/account'}>{t(language, key)}</NavLink>
          ))}
        </nav>
      </aside>
      <div className="account-main"><Outlet /></div>
    </div>
  );
}

export function AccountHome() {
  const { user, logout, logoutAll } = useAuth();
  const { language } = usePreferences();
  const [verify, setVerify] = useState('');
  return (
    <div className="account-page">
      <header className="account-head">
        <p className="kicker">{t(language, 'account')}</p>
        <h1>{user?.name}</h1>
        <p>{t(language, 'accountLede')}</p>
      </header>
      <div className="account-shortcuts">
        {[['bookmarks', 'goBookmarks', '/account/bookmarks'], ['likes', 'goLikes', '/account/likes'], ['readingHistory', 'goHistory', '/account/reading-history'], ['myOrders', 'goOrders', '/account/orders']].map(([key, note, href]) => (
          <Link className="account-shortcut" key={href} to={href}>
            <strong>{t(language, key)}</strong>
            <span>{t(language, note)}</span>
          </Link>
        ))}
      </div>
      <section className="account-card">
        <p className="meta">{user?.email}</p>
        {!user?.emailVerified ? (
          <button className="btn-ghost" type="button" onClick={async () => {
            const payload = await authApi.resend();
            setVerify(payload.data.devVerifyUrl || t(language, payload.data.verificationSent ? 'verificationSentNote' : 'mailNotReady'));
          }}>{t(language, 'resendVerification')}</button>
        ) : <p className="form-ok">{t(language, 'emailVerified')}</p>}
        {verify ? <p>{verify}</p> : null}
        <div className="account-actions">
          <button className="btn" type="button" onClick={logout}>{t(language, 'logout')}</button>
          <button className="btn-ghost" type="button" onClick={logoutAll}>{t(language, 'signOutEverywhere')}</button>
        </div>
      </section>
    </div>
  );
}

export function ProfilePage() {
  const { user, updateUser } = useAuth();
  const { language } = usePreferences();
  const [form, setForm] = useState({
    name: user?.name || '',
    bio: user?.profile?.bio || '',
    phone: user?.profile?.phone || '',
    location: user?.profile?.location || '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    try {
      const payload = await accountApi.updateProfile(form);
      updateUser(payload.data);
      setMessage(t(language, 'profileSaved'));
      setError('');
    } catch (err) {
      setError(normalizeError(err).message);
    }
  }

  function readFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('unread'));
      reader.readAsDataURL(file);
    });
  }

  async function onPhoto(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setUploading(true);
    setError('');
    setMessage('');
    try {
      const dataUrl = await readFile(file);
      const payload = await accountApi.uploadAvatar(dataUrl);
      updateUser(payload.data);
      setMessage(t(language, 'photoSaved'));
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto() {
    setUploading(true);
    setError('');
    try {
      const payload = await accountApi.removeAvatar();
      updateUser(payload.data);
      setMessage(t(language, 'photoSaved'));
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <form className="account-page" onSubmit={submit}>
      <header className="account-head">
        <p className="kicker">{t(language, 'account')}</p>
        <h1>{t(language, 'profile')}</h1>
      </header>
      <div className="account-card">
      <div className="profile-upload">
        {user?.profile?.avatarUrl ? <img className="profile-photo" src={user.profile.avatarUrl} alt="" /> : <span className="profile-photo profile-mark">{mark(user?.name)}</span>}
        <div className="stack">
          <span>{t(language, 'photo')}</span>
          <div className="profile-actions">
            <label className="btn profile-file">
              {uploading ? t(language, 'sending') : t(language, 'changePhoto')}
              <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={onPhoto} disabled={uploading} />
            </label>
            {user?.profile?.avatarUrl ? <button className="btn-ghost" type="button" onClick={removePhoto} disabled={uploading}>{t(language, 'removePhoto')}</button> : null}
          </div>
          <p className="meta">{t(language, 'photoHint')}</p>
        </div>
      </div>
      {['name', 'bio', 'phone', 'location'].map((field) => (
        <label className="field" key={field}>
          <span>{t(language, field)}</span>
          {field === 'bio' ? <textarea value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} rows={4} /> : <input value={form[field]} onChange={(event) => setForm({ ...form, [field]: event.target.value })} />}
        </label>
      ))}
      {message ? <p className="form-ok">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
      <button className="btn" type="submit">{t(language, 'saveProfile')}</button>
      </div>
    </form>
  );
}

export function SettingsPage() {
  const { user, updateUser, logout } = useAuth();
  const { language, theme, setLanguage, setTheme } = usePreferences();
  const [notifications, setNotifications] = useState(user?.settings?.notifications || {});
  const [publicProfile, setPublicProfile] = useState(Boolean(user?.settings?.publicProfile));
  const [password, setPassword] = useState({ currentPassword: '', password: '' });
  const [removePassword, setRemovePassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function saveSettings(event) {
    event.preventDefault();
    try {
      const payload = await accountApi.updateSettings({ language, theme, publicProfile, notifications });
      updateUser(payload.data);
      setMessage(t(language, 'settingsSaved'));
    } catch (err) {
      setError(normalizeError(err).message);
    }
  }

  async function savePassword(event) {
    event.preventDefault();
    try {
      await accountApi.updatePassword(password);
      setMessage(t(language, 'passwordChanged'));
      await logout();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  }

  async function removeAccount(event) {
    event.preventDefault();
    try {
      await accountApi.remove({ password: removePassword });
      await logout();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  }

  const notes = { newsletter: 'notifyNewsletter', comments: 'notifyComments', orders: 'notifyOrders' };
  return (
    <div className="account-page">
      <header className="account-head">
        <p className="kicker">{t(language, 'account')}</p>
        <h1>{t(language, 'settings')}</h1>
      </header>
      <form className="account-card" onSubmit={saveSettings}>
        <h2>{t(language, 'preferences')}</h2>
        <label className="field"><span>{t(language, 'language')}</span>
          <select value={language} onChange={(event) => setLanguage(event.target.value)}>
            <option value="en">English</option>
            <option value="ur">اردو</option>
            <option value="ar">العربية</option>
          </select>
        </label>
        <label className="field"><span>{t(language, 'theme')}</span>
          <select value={theme} onChange={(event) => setTheme(event.target.value)}>
            <option value="system">{t(language, 'themeSystem')}</option>
            <option value="light">{t(language, 'themeLight')}</option>
            <option value="dark">{t(language, 'themeDark')}</option>
          </select>
        </label>
        <label className="choice-row"><input type="checkbox" checked={publicProfile} onChange={(event) => setPublicProfile(event.target.checked)} /> {t(language, 'publicProfile')}</label>
        <h2>{t(language, 'notifications')}</h2>
        {Object.entries(notes).map(([key, label]) => (
          <label className="choice-row" key={key}><input type="checkbox" checked={Boolean(notifications[key])} onChange={(event) => setNotifications({ ...notifications, [key]: event.target.checked })} /> {t(language, label)}</label>
        ))}
        <button className="btn" type="submit">{t(language, 'saveSettings')}</button>
      </form>
      <form className="account-card" onSubmit={savePassword}>
        <h2>{t(language, 'changePassword')}</h2>
        <label className="field"><span>{t(language, 'currentPassword')}</span><input type="password" autoComplete="current-password" value={password.currentPassword} onChange={(event) => setPassword({ ...password, currentPassword: event.target.value })} /></label>
        <label className="field"><span>{t(language, 'newPassword')}</span><input type="password" autoComplete="new-password" minLength={8} value={password.password} onChange={(event) => setPassword({ ...password, password: event.target.value })} /><small>{t(language, 'passwordHint')}</small></label>
        <button className="btn-ghost" type="submit">{t(language, 'updatePassword')}</button>
      </form>
      <form className="account-card account-danger" onSubmit={removeAccount}>
        <h2>{t(language, 'deleteAccount')}</h2>
        <p className="meta">{t(language, 'deleteAccountNote')}</p>
        <label className="field"><span>{t(language, 'password')}</span><input type="password" autoComplete="current-password" value={removePassword} onChange={(event) => setRemovePassword(event.target.value)} /></label>
        <button className="btn" type="submit">{t(language, 'deleteAccount')}</button>
      </form>
      {message ? <p className="form-ok">{message}</p> : null}
      {error ? <p className="form-error">{error}</p> : null}
    </div>
  );
}

function SavedList({ kind, empty }) {
  const load = useCallback((signal) => (
    kind === 'likes' ? engagementApi.likes({ limit: 24 }, signal) : engagementApi.bookmarks({ limit: 24 }, signal)
  ), [kind]);
  const query = useQuery(load);
  const items = (query.data || []).map((row) => row.item).filter((item) => item?.slug && item.type !== 'podcast-episode');
  const episodes = (query.data || []).filter((row) => row.targetType === 'podcast-episode');
  return (
    <div className="account-card account-list">
      {query.status === 'loading' ? <SkeletonRenderer variant="contentGrid" /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
      {query.status === 'success' && !query.data.length ? <EmptyState title={empty} /> : null}
      {items.length ? <ContentGrid items={items} columns={2} variant="compact" /> : null}
      {episodes.length ? (
        <ul className="account-history">
          {episodes.map((row) => (
            <li key={row.item.id}>
              <Link to={row.item.show?.slug ? `/podcasts/${row.item.show.slug}/${row.item.slug}` : '/podcasts'}>{row.item.title}</Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function DeskPage({ title, children }) {
  const { language } = usePreferences();
  return (
    <div className="account-page">
      <header className="account-head">
        <p className="kicker">{t(language, 'account')}</p>
        <h1>{title}</h1>
      </header>
      {children}
    </div>
  );
}

export function BookmarksPage() {
  const { language } = usePreferences();
  return (
    <DeskPage title={t(language, 'bookmarks')}>
      <SavedList kind="bookmarks" empty={t(language, 'noBookmarks')} />
    </DeskPage>
  );
}

export function LikesPage() {
  const { language } = usePreferences();
  return (
    <DeskPage title={t(language, 'likes')}>
      <SavedList kind="likes" empty={t(language, 'noLikes')} />
    </DeskPage>
  );
}

export function ReadingHistoryPage() {
  const { user, status } = useAuth();
  const query = useQuery(useCallback((signal) => {
    if (status !== 'ready' || !user) return Promise.resolve({ data: [] });
    return engagementApi.history({ limit: 30 }, signal);
  }, [status, user]));
  const local = user ? [] : readLocalHistory();
  const { language } = usePreferences();
  return (
    <DeskPage title={t(language, 'readingHistory')}>
      <div className="account-card account-list">
        {user && query.status === 'loading' ? <SkeletonRenderer variant="search" /> : null}
        {user && query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
        {user && query.status === 'success' && !query.data.length ? <EmptyState title={t(language, 'noHistory')} /> : null}
        {!user && !local.length ? <EmptyState title={t(language, 'noHistory')} /> : null}
        {(user ? query.data || [] : local).length ? <ul className="account-history">
          {(user ? query.data || [] : local).map((row) => {
            const item = row.item || row;
            const href = item.path || (item.show?.slug ? `/podcasts/${item.show.slug}/${item.slug}` : contentPath(item.type, item.slug));
            return (
              <li key={item.id || item.targetId}>
                <Link to={href}>{item.title}</Link>
                {row.progress ? <span>{row.progress}%</span> : null}
              </li>
            );
          })}
        </ul> : null}
      </div>
    </DeskPage>
  );
}
