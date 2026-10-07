import { useCallback, useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { adminApi } from '../../api/index.js';
import { ConfirmDialog, DataTable, FormField, StatusBadge } from '../../components/admin/AdminControls.jsx';
import { RichTextEditor } from '../../components/admin/RichTextEditor.jsx';
import { EmptyState } from '../../components/content/universal/EmptyState.jsx';
import { ErrorState } from '../../components/content/universal/ErrorState.jsx';
import { Pagination } from '../../components/navigation/Pagination.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { SkeletonRenderer } from '../../components/skeletons/SkeletonRenderer.jsx';
import { ADMIN_RESOURCES } from '../../config/adminResources.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useQuery } from '../../hooks/useQuery.js';
import { ta } from '../../utils/adminI18n.js';
import { normalizeError } from '../../utils/errors.js';
import { formatMoney } from '../../utils/format.js';

const LANGS = [
  ['en', 'English'],
  ['ur', 'اردو'],
  ['ar', 'العربية'],
];

const CONTENT_TYPES = [
  ['article', 'articles'],
  ['research', 'research'],
  ['news', 'news'],
  ['book', 'books'],
  ['column', 'columns'],
  ['analysis', 'analysis'],
  ['interesting_story', 'interesting-stories'],
  ['inspirational_story', 'inspirational-stories'],
  ['video', 'videos'],
];

const GROUPS = [
  ['desk', [['/admin', 'dashboard', 'dashboard:view', true]]],
  ['library', [
    ['/admin/content', 'content', 'content:read'],
    ['/admin/categories', 'categories', 'taxonomy:manage'],
    ['/admin/tags', 'tags', 'taxonomy:manage'],
    ['/admin/authors', 'authors', 'taxonomy:manage'],
    ['/admin/comments', 'comments', 'comments:moderate'],
    ['/admin/pages', 'pages', 'pages:manage'],
    ['/admin/messages', 'messages', 'pages:manage'],
    ['/admin/menus', 'menus', 'menus:manage'],
  ]],
  ['shopDesk', [
    ['/admin/products', 'products', 'products:manage'],
    ['/admin/coupons', 'coupons', 'products:manage'],
    ['/admin/orders', 'orders', 'orders:manage'],
  ]],
  ['giving', [
    ['/admin/campaigns', 'campaigns', 'donations:manage'],
    ['/admin/donations', 'donations', 'donations:manage'],
  ]],
  ['audience', [
    ['/admin/subscribers', 'subscribers', 'newsletter:manage'],
    ['/admin/shows', 'shows', 'podcasts:manage'],
    ['/admin/episodes', 'episodes', 'podcasts:manage'],
    ['/admin/media', 'media', 'media:manage'],
  ]],
  ['system', [
    ['/admin/users', 'users', 'users:manage'],
    ['/admin/roles', 'roles', 'roles:manage'],
    ['/admin/settings', 'settings', 'settings:manage'],
  ]],
];

const LONG = new Set(['body', 'excerpt', 'description', 'bio', 'summary', 'footerText', 'tagline']);

function allowed(user, permission) {
  const permissions = user?.permissions || [];
  return permissions.includes('*') || permissions.includes(permission);
}

function emptyPack(fields, source = {}) {
  const translations = { en: {}, ur: {}, ar: {} };
  LANGS.forEach(([lang]) => {
    fields.forEach((field) => {
      translations[lang][field] = source.translations?.[lang]?.[field]
        ?? (lang === 'en' ? (source[field] || '') : '');
    });
  });
  return translations;
}

function langFilled(pack, lang) {
  return Object.values(pack?.[lang] || {}).some((value) => String(value || '').trim());
}

function LangTabs({ language, value, pack, onChange }) {
  return (
    <div className="lang-tabs" role="tablist" aria-label={ta(language, 'languages')}>
      {LANGS.map(([code, label]) => (
        <button key={code} type="button" role="tab" aria-selected={value === code} className={value === code ? 'is-on' : ''} onClick={() => onChange(code)}>
          {label}
          <small>{langFilled(pack, code) ? ta(language, 'filled') : ta(language, 'emptyLang')}</small>
        </button>
      ))}
    </div>
  );
}

function Drawer({ title, onClose, children }) {
  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="editor-backdrop" onClick={onClose}>
      <aside className="editor-drawer" role="dialog" aria-modal="true" aria-label={title} onClick={(event) => event.stopPropagation()}>
        <header className="editor-head">
          <h2>{title}</h2>
          <button className="btn-ghost" type="button" onClick={onClose}>{ta(document.documentElement.lang, 'close') === 'close' ? 'Close' : ta(document.documentElement.lang, 'close')}</button>
        </header>
        {children}
      </aside>
    </div>
  );
}

export function AdminLayout() {
  const { user, logout } = useAuth();
  const { language, setLanguage } = usePreferences();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await logout();
    navigate('/');
  }

  return (
    <div className="admin-app">
      <PageHead title={ta(language, 'dashboard')} path="/admin" noIndex />
      <aside className={open ? 'admin-rail is-open' : 'admin-rail'}>
        <Link className="admin-brand" to="/admin" onClick={() => setOpen(false)}>
          <img src="/logo.png" alt="ضیاء چترالی" width="496" height="246" />
        </Link>
        {GROUPS.map(([group, items]) => {
          const visible = items.filter((item) => allowed(user, item[2]));
          if (!visible.length) return null;
          return (
            <div key={group} className="admin-group">
              <p>{ta(language, group)}</p>
              {visible.map(([to, key, , end]) => (
                <NavLink key={to} to={to} end={Boolean(end)} onClick={() => setOpen(false)}>{ta(language, key)}</NavLink>
              ))}
            </div>
          );
        })}
      </aside>
      {open ? <button className="admin-scrim" type="button" aria-label={ta(language, 'close')} onClick={() => setOpen(false)} /> : null}
      <div className="admin-main">
        <header className="admin-bar">
          <button className="admin-menu" type="button" onClick={() => setOpen(true)}>{ta(language, 'openMenu')}</button>
          <p className="admin-note">{ta(language, 'deskNote')}</p>
          <div className="admin-tools">
            <label className="lang-field">
              <span className="sr-only">{ta(language, 'language')}</span>
              <select className="lang-select" value={language} onChange={(event) => { setLanguage(event.target.value).catch(() => {}); }}>
                <option value="en">English</option>
                <option value="ur">اردو</option>
                <option value="ar">العربية</option>
              </select>
            </label>
            <Link to="/">{ta(language, 'viewSite')}</Link>
            <button className="btn-text" type="button" onClick={signOut}>{ta(language, 'signOut')}</button>
          </div>
        </header>
        <div className="admin-body"><Outlet /></div>
      </div>
    </div>
  );
}

const STATS = [
  ['signups', 'statSignups', '/admin/users'],
  ['content', 'statContent', '/admin/content'],
  ['products', 'statProducts', '/admin/products'],
  ['orders', 'statOrders', '/admin/orders'],
  ['donations', 'statDonations', '/admin/donations'],
  ['comments', 'statComments', '/admin/comments'],
  ['subscribers', 'statSubscribers', '/admin/subscribers'],
  ['campaigns', 'statCampaigns', '/admin/campaigns'],
  ['pages', 'statPages', '/admin/pages'],
];

function countryName(code, language) {
  if (!code) return ta(language, 'unknownCountry');
  try {
    return new Intl.DisplayNames([language], { type: 'region' }).of(code) || code;
  } catch {
    return code;
  }
}

function dayLabel(day, language) {
  const date = new Date(`${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime())) return day;
  return new Intl.DateTimeFormat(language, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(date);
}

export function DashboardPage() {
  const { language } = usePreferences();
  const { user } = useAuth();
  const query = useQuery(useCallback((signal) => adminApi.dashboard(signal), []));
  const counts = query.data || {};
  const traffic = Array.isArray(counts.traffic) ? counts.traffic : [];
  const countries = Array.isArray(counts.signupCountries) ? counts.signupCountries : [];
  const peak = Math.max(1, ...traffic.map((row) => row.count || 0));
  const countryPeak = Math.max(1, ...countries.map((row) => row.count || 0));
  const visitors = traffic.reduce((sum, row) => sum + (row.count || 0), 0);
  return (
    <div className="desk-home">
      <p className="kicker">{ta(language, 'desk')}</p>
      <h1>{ta(language, 'welcome')}{user?.name ? `, ${user.name}` : ''}</h1>
      <p className="shop-lede">{ta(language, 'welcomeNote')}</p>
      {query.status === 'loading' ? <SkeletonRenderer variant="author" /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
      <div className="desk-stats">
        {STATS.map(([key, label, href]) => (
          <Link className="desk-stat" key={key} to={href}>
            <span>{ta(language, label)}</span>
            <b>{counts[key] ?? '—'}</b>
          </Link>
        ))}
      </div>
      {query.status === 'success' ? (
        <div className="desk-insights">
          <section className="desk-panel">
            <h2>{ta(language, 'traffic')}</h2>
            <p>{ta(language, 'trafficNote')}</p>
            {visitors ? (
              <div className="traffic-chart" role="img" aria-label={ta(language, 'traffic')}>
                {traffic.map((row) => (
                  <div className="traffic-col" key={row.day}>
                    <b>{row.count || 0}</b>
                    <span className="traffic-bar"><i style={{ height: `${row.count ? Math.max(8, Math.round((row.count / peak) * 100)) : 0}%` }} /></span>
                    <small>{dayLabel(row.day, language)}</small>
                  </div>
                ))}
              </div>
            ) : <p className="meta">{ta(language, 'noTraffic')}</p>}
          </section>
          <section className="desk-panel">
            <h2>{ta(language, 'signupCountries')}</h2>
            <ul className="country-list">
              {countries.map((row) => (
                <li key={row.code || 'unknown'}>
                  <span>{countryName(row.code, language)}</span>
                  <span className="country-track"><i style={{ width: `${Math.round((row.count / countryPeak) * 100)}%` }} /></span>
                  <b>{row.count}</b>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}

export function AdminContentPage() {
  const { language } = usePreferences();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [form, setForm] = useState(null);
  const [lang, setLang] = useState('en');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [removeId, setRemoveId] = useState(null);
  const query = useQuery(useCallback((signal) => adminApi.list('content', { page, q, limit: 20 }, signal), [page, q]));
  const authors = useQuery(useCallback((signal) => adminApi.list('authors', { limit: 100 }, signal), []));
  const categories = useQuery(useCallback((signal) => adminApi.list('categories', { limit: 100 }, signal), []));
  const tags = useQuery(useCallback((signal) => adminApi.list('tags', { limit: 100 }, signal), []));

  function edit(row) {
    setError('');
    setNotice('');
    setLang('en');
    if (!row) {
      setForm({
        title: '', type: 'article', status: 'draft', slug: '', featured: false, breaking: false,
        author: '', category: '', tags: [], coverUrl: '',
        translations: emptyPack(['title', 'excerpt', 'body']),
      });
      return;
    }
    setForm({
      ...row,
      author: row.author?.id || row.author || '',
      category: row.category?.id || row.category || '',
      tags: (row.tags || []).map((tag) => tag.id || tag),
      coverUrl: row.coverImage?.url || '',
      translations: emptyPack(['title', 'excerpt', 'body'], row),
    });
  }

  function setText(field, value) {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [lang]: { ...current.translations[lang], [field]: value },
      },
    }));
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const body = {
      type: form.type,
      status: form.status,
      slug: form.slug || '',
      featured: Boolean(form.featured),
      breaking: Boolean(form.breaking),
      author: form.author || null,
      category: form.category || null,
      tags: form.tags || [],
      coverImage: { url: form.coverUrl || '', alt: form.translations?.en?.title || '' },
      translations: form.translations,
      publisher: form.publisher || '',
      pages: form.pages ? Number(form.pages) : null,
      isbn: form.isbn || '',
      priceCents: form.priceCents ? Number(form.priceCents) : null,
      videoUrl: form.videoUrl || '',
      duration: form.duration ? Number(form.duration) : null,
    };
    try {
      if (form.id) await adminApi.update('content', form.id, body);
      else await adminApi.create('content', body);
      setForm(null);
      setNotice(true);
      query.reload();
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  }

  const typeLabel = (value) => {
    const match = CONTENT_TYPES.find(([type]) => type === value);
    return match ? ta(language, match[1]) : value;
  };

  return (
    <div className="stack">
      <header className="desk-head">
        <h1>{ta(language, 'content')}</h1>
        <button className="btn" type="button" onClick={() => edit(null)}>{ta(language, 'newRecord')}</button>
      </header>
      <input className="desk-search" aria-label={ta(language, 'searchRecords')} placeholder={ta(language, 'searchRecords')} value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} />
      {notice ? <p className="form-ok">{ta(language, 'saved')}</p> : null}
      {query.status === 'loading' ? <SkeletonRenderer variant="search" /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
      {query.status === 'success' && !query.data.length ? <EmptyState title={ta(language, 'noRecords')} /> : null}
      {query.data?.length ? (
        <DataTable
          caption={ta(language, 'content')}
          rows={query.data}
          columns={[
            { key: 'title', label: ta(language, 'title'), render: (row) => row.translations?.en?.title || row.title },
            { key: 'type', label: ta(language, 'type'), render: (row) => typeLabel(row.type) },
            { key: 'langs', label: ta(language, 'languages'), render: (row) => LANGS.filter(([code]) => langFilled(row.translations, code)).map(([, label]) => label).join(' · ') || '—' },
            { key: 'status', label: ta(language, 'status'), render: (row) => <StatusBadge value={ta(language, row.status)} /> },
            { key: 'actions', label: ta(language, 'actions'), render: (row) => (
              <div className="row-actions">
                <button className="btn-text" type="button" onClick={() => edit(row)}>{ta(language, 'edit')}</button>
                <button className="btn-text" type="button" onClick={() => setRemoveId(row.id)}>{ta(language, 'delete')}</button>
              </div>
            ) },
          ]}
        />
      ) : null}
      <Pagination page={query.meta?.page || 1} pages={query.meta?.pages || 1} onPage={setPage} />
      {form ? (
        <Drawer title={form.id ? ta(language, 'editContent') : ta(language, 'newContent')} onClose={() => setForm(null)}>
          <form className="stack" onSubmit={save}>
            <LangTabs language={language} value={lang} pack={form.translations} onChange={setLang} />
            <p className="meta">{ta(language, 'writeIn')}</p>
            <div className="lang-fields" dir={lang === 'en' ? 'ltr' : 'rtl'}>
              <FormField label={ta(language, 'title')}><input value={form.translations[lang].title || ''} onChange={(event) => setText('title', event.target.value)} /></FormField>
              <FormField label={ta(language, 'excerpt')}><textarea rows={3} value={form.translations[lang].excerpt || ''} onChange={(event) => setText('excerpt', event.target.value)} /></FormField>
              <FormField label={ta(language, 'body')}>
                <RichTextEditor key={lang} language={language} dir={lang === 'en' ? 'ltr' : 'rtl'} value={form.translations[lang].body || ''} onChange={(html) => setText('body', html)} />
              </FormField>
            </div>
            <div className="desk-grid">
              <FormField label={ta(language, 'type')}>
                <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
                  {CONTENT_TYPES.map(([value, key]) => <option key={value} value={value}>{ta(language, key)}</option>)}
                </select>
              </FormField>
              <FormField label={ta(language, 'status')}>
                <select value={form.status || 'draft'} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                  {['draft', 'published', 'archived'].map((value) => <option key={value} value={value}>{ta(language, value)}</option>)}
                </select>
              </FormField>
            </div>
            <FormField label={ta(language, 'slug')} hint={ta(language, 'slugHint')}><input value={form.slug || ''} onChange={(event) => setForm({ ...form, slug: event.target.value })} /></FormField>
            <FormField label={ta(language, 'author')}>
              <select value={form.author || ''} onChange={(event) => setForm({ ...form, author: event.target.value })}>
                <option value="">{ta(language, 'none')}</option>
                {authors.data?.map((item) => <option key={item.id} value={item.id}>{item.translations?.en?.name || item.name}</option>)}
              </select>
            </FormField>
            <FormField label={ta(language, 'category')}>
              <select value={form.category || ''} onChange={(event) => setForm({ ...form, category: event.target.value })}>
                <option value="">{ta(language, 'none')}</option>
                {categories.data?.map((item) => <option key={item.id} value={item.id}>{item.translations?.en?.name || item.name}</option>)}
              </select>
            </FormField>
            <fieldset className="tag-picks">
              <legend>{ta(language, 'tags')}</legend>
              {tags.data?.map((tag) => (
                <label key={tag.id}>
                  <input
                    type="checkbox"
                    checked={(form.tags || []).includes(tag.id)}
                    onChange={(event) => {
                      const next = new Set(form.tags || []);
                      if (event.target.checked) next.add(tag.id);
                      else next.delete(tag.id);
                      setForm({ ...form, tags: [...next] });
                    }}
                  />
                  {tag.translations?.en?.name || tag.name}
                </label>
              ))}
            </fieldset>
            <FormField label={ta(language, 'cover')}><input value={form.coverUrl || ''} onChange={(event) => setForm({ ...form, coverUrl: event.target.value })} /></FormField>
            <label className="check-line"><input type="checkbox" checked={Boolean(form.featured)} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> {ta(language, 'featured')}</label>
            <label className="check-line"><input type="checkbox" checked={Boolean(form.breaking)} onChange={(event) => setForm({ ...form, breaking: event.target.checked })} /> {ta(language, 'breaking')}</label>
            {form.type === 'book' ? (
              <>
                <FormField label={ta(language, 'publisher')}><input value={form.publisher || ''} onChange={(event) => setForm({ ...form, publisher: event.target.value })} /></FormField>
                <FormField label={ta(language, 'pagesCount')}><input value={form.pages || ''} onChange={(event) => setForm({ ...form, pages: event.target.value })} /></FormField>
                <FormField label={ta(language, 'isbn')}><input value={form.isbn || ''} onChange={(event) => setForm({ ...form, isbn: event.target.value })} /></FormField>
                <FormField label={ta(language, 'priceCents')}><input value={form.priceCents || ''} onChange={(event) => setForm({ ...form, priceCents: event.target.value })} /></FormField>
              </>
            ) : null}
            {form.type === 'video' ? (
              <>
                <FormField label={ta(language, 'videoUrl')}><input value={form.videoUrl || ''} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })} /></FormField>
                <FormField label={ta(language, 'duration')}><input value={form.duration || ''} onChange={(event) => setForm({ ...form, duration: event.target.value })} /></FormField>
              </>
            ) : null}
            {error ? <p className="form-error">{error}</p> : null}
            <div className="share">
              <button className="btn" disabled={busy} type="submit">{busy ? ta(language, 'saving') : ta(language, 'save')}</button>
              <button className="btn-ghost" type="button" onClick={() => setForm(null)}>{ta(language, 'cancel')}</button>
            </div>
          </form>
        </Drawer>
      ) : null}
      {removeId ? (
        <ConfirmDialog
          title={ta(language, 'confirmDelete')}
          message={ta(language, 'confirmDeleteNote')}
          onClose={() => setRemoveId(null)}
          onConfirm={async () => {
            await adminApi.remove('content', removeId);
            setRemoveId(null);
            query.reload();
          }}
        />
      ) : null}
    </div>
  );
}

export function AdminResourcePage({ resource }) {
  const { language } = usePreferences();
  const config = ADMIN_RESOURCES[resource];
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [form, setForm] = useState(null);
  const [lang, setLang] = useState('en');
  const [removeId, setRemoveId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [relations, setRelations] = useState({});
  const query = useQuery(useCallback((signal) => adminApi.list(resource, { q, page, limit: 20 }, signal), [resource, q, page]));
  const localized = config?.localized || [];

  useEffect(() => {
    const sources = [...new Set((config?.fields || []).map((field) => field.source).filter(Boolean))];
    if (!sources.length) return undefined;
    let live = true;
    Promise.all(sources.map((source) => adminApi.list(source, { limit: 100 }).then((payload) => [source, payload.data || []])))
      .then((entries) => { if (live) setRelations(Object.fromEntries(entries)); })
      .catch(() => {});
    return () => { live = false; };
  }, [config]);

  function begin(row) {
    const next = row ? (config.toForm ? config.toForm(row) : { ...row }) : {};
    if (localized.length) next.translations = emptyPack(localized, next);
    setLang('en');
    setError('');
    setForm(next);
  }

  function setText(field, value) {
    setForm((current) => ({
      ...current,
      translations: {
        ...current.translations,
        [lang]: { ...current.translations[lang], [field]: value },
      },
    }));
  }

  async function save(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    const body = config.toBody ? config.toBody(form) : form;
    try {
      if (form.id) await adminApi.update(resource, form.id, body);
      else await adminApi.create(resource, body);
      setForm(null);
      setNotice(true);
      query.reload();
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  }

  if (!config) return <ErrorState message="Unknown admin section." />;
  const fields = config.fields.filter((field) => !localized.includes(field.name));
  return (
    <div className="stack">
      <header className="desk-head">
        <h1>{ta(language, resource)}</h1>
        <button className="btn" type="button" onClick={() => begin(null)}>{ta(language, 'newRecord')}</button>
      </header>
      <input className="desk-search" aria-label={ta(language, 'searchRecords')} placeholder={ta(language, 'searchRecords')} value={q} onChange={(event) => { setPage(1); setQ(event.target.value); }} />
      {notice ? <p className="form-ok">{ta(language, 'saved')}</p> : null}
      {query.status === 'loading' ? <SkeletonRenderer variant="search" /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
      {query.status === 'success' && !query.data.length ? <EmptyState title={ta(language, 'noRecords')} /> : null}
      {query.data?.length ? (
        <DataTable
          caption={ta(language, resource)}
          rows={query.data}
          columns={[
            ...config.columns.map((column) => ({
              ...column,
              label: ta(language, column.key) === column.key ? column.label : ta(language, column.key),
              render: (row) => {
                const value = row[column.key];
                if (column.key === 'status' || column.key === 'active') return <StatusBadge value={ta(language, String(value))} />;
                if (typeof value === 'boolean') return value ? ta(language, 'active') : '—';
                if (value && typeof value === 'object') return value.name || value.title || value.email || '';
                return String(value ?? '');
              },
            })),
            { key: 'actions', label: ta(language, 'actions'), render: (row) => (
              <div className="row-actions">
                <button className="btn-text" type="button" onClick={() => begin(row)}>{ta(language, 'edit')}</button>
                <button className="btn-text" type="button" onClick={() => setRemoveId(row.id)}>{ta(language, 'delete')}</button>
              </div>
            ) },
          ]}
        />
      ) : null}
      <Pagination page={query.meta?.page || 1} pages={query.meta?.pages || 1} onPage={setPage} />
      {form ? (
        <Drawer title={form.id ? ta(language, 'edit') : ta(language, 'newRecord')} onClose={() => setForm(null)}>
          <form className="stack" onSubmit={save}>
            {localized.length ? (
              <>
                <LangTabs language={language} value={lang} pack={form.translations} onChange={setLang} />
                <p className="meta">{ta(language, 'writeIn')}</p>
                <div className="lang-fields" dir={lang === 'en' ? 'ltr' : 'rtl'}>
                  {localized.map((field) => (
                    <FormField key={field} label={ta(language, field)}>
                      {field === 'body'
                        ? <RichTextEditor key={lang} language={language} dir={lang === 'en' ? 'ltr' : 'rtl'} value={form.translations?.[lang]?.[field] || ''} onChange={(html) => setText(field, html)} />
                        : LONG.has(field)
                          ? <textarea rows={field === 'bio' ? 8 : 4} value={form.translations?.[lang]?.[field] || ''} onChange={(event) => setText(field, event.target.value)} />
                          : <input value={form.translations?.[lang]?.[field] || ''} onChange={(event) => setText(field, event.target.value)} />}
                    </FormField>
                  ))}
                </div>
              </>
            ) : null}
            {fields.map((field) => (
              <FormField key={field.name} label={ta(language, field.name) || field.label} hint={field.hint}>
                {field.type === 'textarea' ? <textarea rows={4} value={form[field.name] || ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} /> : null}
                {field.type === 'checkbox' ? <input type="checkbox" checked={Boolean(form[field.name])} onChange={(event) => setForm({ ...form, [field.name]: event.target.checked })} /> : null}
                {field.type === 'select' ? (
                  <select value={form[field.name] || field.options[0]} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}>
                    {field.options.map((option) => <option key={option} value={option}>{ta(language, option) || option}</option>)}
                  </select>
                ) : null}
                {field.type === 'relation' ? (
                  <select value={form[field.name] || ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}>
                    <option value="">{ta(language, 'none')}</option>
                    {(relations[field.source] || []).map((item) => <option key={item.id} value={item.id}>{item.title || item.name}</option>)}
                  </select>
                ) : null}
                {!['textarea', 'checkbox', 'select', 'relation'].includes(field.type) ? (
                  <input type={field.type === 'password' ? 'password' : field.type === 'number' ? 'number' : 'text'} value={form[field.name] ?? ''} onChange={(event) => setForm({ ...form, [field.name]: event.target.value })} />
                ) : null}
              </FormField>
            ))}
            {error ? <p className="form-error">{error}</p> : null}
            <div className="share">
              <button className="btn" disabled={busy} type="submit">{busy ? ta(language, 'saving') : ta(language, 'save')}</button>
              <button className="btn-ghost" type="button" onClick={() => setForm(null)}>{ta(language, 'cancel')}</button>
            </div>
          </form>
        </Drawer>
      ) : null}
      {removeId ? (
        <ConfirmDialog
          title={ta(language, 'confirmDelete')}
          message={ta(language, 'confirmDeleteNote')}
          onClose={() => setRemoveId(null)}
          onConfirm={async () => {
            await adminApi.remove(resource, removeId);
            setRemoveId(null);
            query.reload();
          }}
        />
      ) : null}
    </div>
  );
}

export function AdminCommentsPage() {
  const { language } = usePreferences();
  const [status, setStatus] = useState('pending');
  const query = useQuery(useCallback((signal) => adminApi.comments({ status, limit: 30 }, signal), [status]));
  return (
    <div className="stack">
      <header className="desk-head"><h1>{ta(language, 'comments')}</h1></header>
      <div className="choice-row" role="tablist">
        {['pending', 'approved', 'rejected'].map((value) => (
          <button key={value} className={status === value ? 'choice is-on' : 'choice'} type="button" onClick={() => setStatus(value)}>{ta(language, value)}</button>
        ))}
      </div>
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
      {query.status === 'success' && !query.data.length ? <EmptyState title={ta(language, 'noRecords')} /> : null}
      {query.data?.map((comment) => (
        <article className="desk-card" key={comment.id}>
          <StatusBadge value={ta(language, comment.status)} />
          <p>{comment.body}</p>
          <p className="meta">{comment.user?.name}</p>
          <div className="row-actions">
            <button className="btn-ghost" type="button" onClick={async () => { await adminApi.moderate(comment.id, 'approved'); query.reload(); }}>{ta(language, 'approve')}</button>
            <button className="btn-ghost" type="button" onClick={async () => { await adminApi.moderate(comment.id, 'rejected'); query.reload(); }}>{ta(language, 'reject')}</button>
            <button className="btn-text" type="button" onClick={async () => { await adminApi.deleteComment(comment.id); query.reload(); }}>{ta(language, 'delete')}</button>
          </div>
        </article>
      ))}
    </div>
  );
}

export function AdminOrdersPage() {
  const { language } = usePreferences();
  const query = useQuery(useCallback((signal) => adminApi.orders({ limit: 30 }, signal), []));
  return (
    <div className="stack">
      <header className="desk-head"><h1>{ta(language, 'orders')}</h1></header>
      <p className="desk-note">{ta(language, 'orderNote')}</p>
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
      {query.status === 'success' && !query.data.length ? <EmptyState title={ta(language, 'noRecords')} /> : null}
      {query.data?.map((order) => (
        <article className="desk-card" key={order.id}>
          <header>
            <strong>{order.customer?.name || order.email}</strong>
            <StatusBadge value={ta(language, order.status)} />
          </header>
          <p className="meta">{order.email} · {formatMoney(order.totalCents, order.currency, language)}</p>
          <ul className="order-mini">
            {(order.items || []).map((item, index) => (
              <li key={`${item.slug}-${index}`}>{item.title} · {item.color} · {item.size} × {item.quantity}</li>
            ))}
          </ul>
          <label className="field">
            <span>{ta(language, 'recordStatus')}</span>
            <select value={order.status} onChange={async (event) => { await adminApi.orderStatus(order.id, event.target.value); query.reload(); }}>
              {['pending_payment', 'paid', 'cancelled'].map((value) => <option key={value} value={value}>{ta(language, value)}</option>)}
            </select>
          </label>
        </article>
      ))}
    </div>
  );
}

export function AdminDonationsPage() {
  const { language } = usePreferences();
  const [removeId, setRemoveId] = useState(null);
  const query = useQuery(useCallback((signal) => adminApi.donations({ limit: 30 }, signal), []));
  return (
    <div className="stack">
      <header className="desk-head"><h1>{ta(language, 'donations')}</h1></header>
      <p className="desk-note">{ta(language, 'orderNote')}</p>
      {query.status === 'success' && !query.data.length ? <EmptyState title={ta(language, 'noRecords')} /> : null}
      {query.data?.length ? (
        <DataTable
          caption={ta(language, 'donations')}
          rows={query.data}
          columns={[
            { key: 'reference', label: ta(language, 'reference') },
            { key: 'donorName', label: ta(language, 'donor') },
            { key: 'amountCents', label: ta(language, 'amount'), render: (row) => formatMoney(row.amountCents, row.currency, language) },
            { key: 'method', label: ta(language, 'method') },
            { key: 'proofUrl', label: ta(language, 'proof'), render: (row) => row.proofUrl ? <a href={row.proofUrl} target="_blank" rel="noreferrer">{ta(language, 'proof')}</a> : '—' },
            { key: 'status', label: ta(language, 'status'), render: (row) => <StatusBadge value={ta(language, row.status)} /> },
            { key: 'actions', label: ta(language, 'actions'), render: (row) => <button className="btn-text" type="button" onClick={() => setRemoveId(row.id)}>{ta(language, 'delete')}</button> },
          ]}
        />
      ) : null}
      {removeId ? (
        <ConfirmDialog
          title={ta(language, 'confirmDelete')}
          message={ta(language, 'confirmDeleteNote')}
          onClose={() => setRemoveId(null)}
          onConfirm={async () => {
            await adminApi.remove('donations', removeId);
            setRemoveId(null);
            query.reload();
          }}
        />
      ) : null}
    </div>
  );
}

export function AdminMessagesPage() {
  const { language } = usePreferences();
  const [removeId, setRemoveId] = useState(null);
  const query = useQuery(useCallback((signal) => adminApi.messages(signal), []));
  return (
    <div className="stack">
      <header className="desk-head"><h1>{ta(language, 'messages')}</h1></header>
      {query.status === 'loading' ? <SkeletonRenderer variant="author" /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
      {query.status === 'success' && !query.data.length ? <EmptyState title={ta(language, 'noRecords')} /> : null}
      {query.data?.length ? (
        <DataTable
          caption={ta(language, 'messages')}
          rows={query.data}
          columns={[
            { key: 'name', label: ta(language, 'name') },
            { key: 'email', label: ta(language, 'email') },
            { key: 'subject', label: ta(language, 'contactSubject') },
            { key: 'message', label: ta(language, 'message') },
            { key: 'actions', label: ta(language, 'actions'), render: (row) => <button className="btn-text" type="button" onClick={() => setRemoveId(row.id)}>{ta(language, 'delete')}</button> },
          ]}
        />
      ) : null}
      {removeId ? (
        <ConfirmDialog
          title={ta(language, 'confirmDelete')}
          message={ta(language, 'confirmDeleteNote')}
          onClose={() => setRemoveId(null)}
          onConfirm={async () => {
            await adminApi.deleteMessage(removeId);
            setRemoveId(null);
            query.reload();
          }}
        />
      ) : null}
    </div>
  );
}

export function AdminMenusPage() {
  const { language } = usePreferences();
  const query = useQuery(useCallback((signal) => adminApi.list('menus', { limit: 10 }, signal), []));
  const [location, setLocation] = useState('header');
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    const existing = (query.data || []).find((item) => item.location === location);
    setItems(existing?.items?.map((item) => ({ label: item.label, url: item.url, children: item.children || [] })) || []);
  }, [query.data, location]);

  function update(index, patch) {
    setItems((current) => current.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item)));
  }

  async function save(event) {
    event.preventDefault();
    try {
      const body = { location, items: items.filter((item) => item.label && item.url) };
      const existing = (query.data || []).find((item) => item.location === location);
      if (existing) await adminApi.update('menus', existing.id, body);
      else await adminApi.create('menus', body);
      setNotice(true);
      setError('');
      query.reload();
    } catch (err) {
      setError(normalizeError(err).message);
    }
  }

  return (
    <form className="stack" onSubmit={save}>
      <header className="desk-head"><h1>{ta(language, 'menus')}</h1></header>
      <FormField label={ta(language, 'menuLocation')}>
        <select value={location} onChange={(event) => setLocation(event.target.value)}>
          {['header', 'footer', 'mobile'].map((value) => <option key={value} value={value}>{ta(language, value)}</option>)}
        </select>
      </FormField>
      <div className="menu-editor">
        {items.map((item, index) => (
          <div className="menu-row" key={`${location}-${index}`}>
            <input aria-label={ta(language, 'linkLabel')} placeholder={ta(language, 'linkLabel')} value={item.label} onChange={(event) => update(index, { label: event.target.value })} />
            <input aria-label={ta(language, 'linkUrl')} placeholder={ta(language, 'linkUrl')} value={item.url} onChange={(event) => update(index, { url: event.target.value })} />
            <button className="btn-text" type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>{ta(language, 'delete')}</button>
          </div>
        ))}
      </div>
      <button className="btn-ghost" type="button" onClick={() => setItems((current) => [...current, { label: '', url: '', children: [] }])}>{ta(language, 'addLink')}</button>
      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-ok">{ta(language, 'saved')}</p> : null}
      <button className="btn" type="submit">{ta(language, 'saveMenu')}</button>
    </form>
  );
}

export function AdminSettingsPage() {
  const { language } = usePreferences();
  const query = useQuery(useCallback((signal) => adminApi.settings(signal), []));
  const [form, setForm] = useState(null);
  const [lang, setLang] = useState('en');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const current = form || (query.data ? {
    siteName: query.data.siteName || '',
    email: query.data.contact?.email || '',
    phone: query.data.contact?.phone || '',
    address: query.data.contact?.address || '',
    defaultLanguage: query.data.defaultLanguage || 'en',
    social: query.data.social || [],
    translations: emptyPack(['tagline', 'footerText'], {
      tagline: query.data.tagline,
      footerText: query.data.footerText,
      translations: query.data.translations,
    }),
  } : null);

  function setText(field, value) {
    setForm({
      ...current,
      translations: {
        ...current.translations,
        [lang]: { ...current.translations[lang], [field]: value },
      },
    });
  }

  async function save(event) {
    event.preventDefault();
    try {
      await adminApi.saveSettings({
        siteName: current.siteName,
        tagline: current.translations.en.tagline,
        logoUrl: '',
        footerText: current.translations.en.footerText,
        defaultLanguage: current.defaultLanguage,
        contact: { email: current.email, phone: current.phone, address: current.address },
        social: (current.social || []).filter((item) => item.platform && item.url),
        translations: current.translations,
      });
      setNotice(true);
      setError('');
      query.reload();
      setForm(null);
    } catch (err) {
      setError(normalizeError(err).message);
    }
  }

  if (!current) return <SkeletonRenderer variant="detail" />;
  return (
    <form className="stack" onSubmit={save}>
      <header className="desk-head"><h1>{ta(language, 'siteSettings')}</h1></header>
      <FormField label={ta(language, 'siteName')}><input value={current.siteName} onChange={(event) => setForm({ ...current, siteName: event.target.value })} /></FormField>
      <LangTabs language={language} value={lang} pack={current.translations} onChange={setLang} />
      <div className="lang-fields" dir={lang === 'en' ? 'ltr' : 'rtl'}>
        <FormField label={ta(language, 'tagline')}><textarea rows={2} value={current.translations[lang].tagline || ''} onChange={(event) => setText('tagline', event.target.value)} /></FormField>
        <FormField label={ta(language, 'footerText')}><textarea rows={3} value={current.translations[lang].footerText || ''} onChange={(event) => setText('footerText', event.target.value)} /></FormField>
      </div>
      <div className="desk-grid">
        <FormField label={ta(language, 'email')}><input value={current.email} onChange={(event) => setForm({ ...current, email: event.target.value })} /></FormField>
        <FormField label={ta(language, 'phone')}><input value={current.phone} onChange={(event) => setForm({ ...current, phone: event.target.value })} /></FormField>
      </div>
      <FormField label={ta(language, 'address')}><input value={current.address} onChange={(event) => setForm({ ...current, address: event.target.value })} /></FormField>
      <FormField label={ta(language, 'defaultLanguage')}>
        <select value={current.defaultLanguage} onChange={(event) => setForm({ ...current, defaultLanguage: event.target.value })}>
          <option value="en">English</option>
          <option value="ur">اردو</option>
          <option value="ar">العربية</option>
        </select>
      </FormField>
      <fieldset className="tag-picks">
        <legend>{ta(language, 'social')}</legend>
        {(current.social || []).map((item, index) => (
          <div className="menu-row" key={index}>
            <input aria-label={ta(language, 'platform')} placeholder={ta(language, 'platform')} value={item.platform || ''} onChange={(event) => {
              const social = [...current.social];
              social[index] = { ...item, platform: event.target.value };
              setForm({ ...current, social });
            }} />
            <input aria-label={ta(language, 'url')} placeholder={ta(language, 'url')} value={item.url || ''} onChange={(event) => {
              const social = [...current.social];
              social[index] = { ...item, url: event.target.value };
              setForm({ ...current, social });
            }} />
          </div>
        ))}
        <button className="btn-ghost" type="button" onClick={() => setForm({ ...current, social: [...(current.social || []), { platform: '', url: '' }] })}>{ta(language, 'addSocial')}</button>
      </fieldset>
      {error ? <p className="form-error">{error}</p> : null}
      {notice ? <p className="form-ok">{ta(language, 'saved')}</p> : null}
      <button className="btn" type="submit">{ta(language, 'save')}</button>
    </form>
  );
}
