import { useState } from 'react';
import { Link } from 'react-router-dom';
import { cmsApi } from '../../api/index.js';
import { Breadcrumbs } from '../../components/content/universal/Breadcrumbs.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { normalizeError } from '../../utils/errors.js';
import { t } from '../../utils/i18n.js';

function DeskHero({ kicker, title, lede }) {
  return (
    <header className="desk-hero">
      <p className="desk-kicker">{kicker}</p>
      <h1>{title}</h1>
      {lede ? <p className="desk-lede">{lede}</p> : null}
    </header>
  );
}

function Shell({ title, description, path, children }) {
  const { language } = usePreferences();
  return (
    <div className="wrap desk-page">
      <PageHead title={title} description={description} path={path} />
      <Breadcrumbs items={[{ label: t(language, 'home'), href: '/' }, { label: title }]} />
      {children}
    </div>
  );
}

const ABOUT_PILLARS = [
  ['aboutResearchTitle', 'aboutResearchBody'],
  ['aboutNewsTitle', 'aboutNewsBody'],
  ['aboutPublicTitle', 'aboutPublicBody'],
];

const ABOUT_LINKS = [
  ['/articles', 'aboutLinkArticles'],
  ['/research', 'aboutLinkResearch'],
  ['/news', 'aboutLinkNews'],
  ['/books', 'books'],
  ['/shop', 'shop'],
  ['/donate', 'donate'],
];

const PRIVACY = [
  ['privacyAccountTitle', 'privacyAccountBody'],
  ['privacyReadingTitle', 'privacyReadingBody'],
  ['privacyMoneyTitle', 'privacyMoneyBody'],
  ['privacyNotesTitle', 'privacyNotesBody'],
];

const TERMS = [
  ['termsLibraryTitle', 'termsLibraryBody'],
  ['termsAccountTitle', 'termsAccountBody'],
  ['termsMoneyTitle', 'termsMoneyBody'],
  ['termsCommentsTitle', 'termsCommentsBody'],
];

export function AboutPage() {
  const { language } = usePreferences();
  return (
    <Shell title={t(language, 'aboutTitle')} description={t(language, 'aboutLede')} path="/about">
      <DeskHero kicker={t(language, 'aboutKicker')} title={t(language, 'aboutTitle')} lede={t(language, 'aboutLede')} />
      <div className="about-layout">
        <img src="/preview/photo-1481627834876-b7833e8f5570.jpg" alt="" />
        <div className="about-copy">
          <h2>{t(language, 'aboutHoldTitle')}</h2>
          <p>{t(language, 'aboutHoldBody')}</p>
          <Link className="btn" to="/contact">{t(language, 'aboutVisit')}</Link>
        </div>
      </div>
      <div className="about-grid">
        {ABOUT_PILLARS.map(([title, body]) => (
          <article key={title}>
            <h2>{t(language, title)}</h2>
            <p>{t(language, body)}</p>
          </article>
        ))}
      </div>
      <nav className="about-links" aria-label={t(language, 'aboutLinksTitle')}>
        <p className="desk-kicker">{t(language, 'aboutLinksTitle')}</p>
        {ABOUT_LINKS.map(([href, key]) => <Link key={href} to={href}>{t(language, key)}</Link>)}
      </nav>
    </Shell>
  );
}

export function ContactPage() {
  const { language } = usePreferences();
  const { settings } = useSite();
  const contact = settings.contact || {};
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await cmsApi.contact(form);
      setSent(true);
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Shell title={t(language, 'contactTitle')} description={t(language, 'contactLede')} path="/contact">
      <DeskHero kicker={t(language, 'contactKicker')} title={t(language, 'contactTitle')} lede={t(language, 'contactLede')} />
      <div className="contact-layout">
        {sent ? (
          <p className="form-ok contact-sent">{t(language, 'contactSent')}</p>
        ) : (
          <form className="stack contact-form" onSubmit={submit}>
            <label className="field"><span>{t(language, 'name')}</span><input required value={form.name} onChange={(event) => setField('name', event.target.value)} /></label>
            <label className="field"><span>{t(language, 'email')}</span><input required type="email" autoComplete="email" value={form.email} onChange={(event) => setField('email', event.target.value)} /></label>
            <label className="field"><span>{t(language, 'contactSubject')}</span><input value={form.subject} onChange={(event) => setField('subject', event.target.value)} /></label>
            <label className="field"><span>{t(language, 'contactMessage')}</span><textarea required rows={7} value={form.message} onChange={(event) => setField('message', event.target.value)} /></label>
            {error ? <p className="form-error">{error}</p> : null}
            <button className="btn" disabled={busy} type="submit">{busy ? t(language, 'contactSending') : t(language, 'contactSend')}</button>
          </form>
        )}
        <aside className="contact-card">
          <p className="desk-kicker">{t(language, 'contactDesk')}</p>
          <h2>{settings.siteName || 'ضیاء چترالی'}</h2>
          <address>
            {contact.address ? <span>{contact.address}</span> : null}
            {contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : null}
            {contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : null}
          </address>
          <p>{t(language, 'contactAside')}</p>
        </aside>
      </div>
    </Shell>
  );
}

function LegalPage({ path, titleKey, ledeKey, kickerKey, sections }) {
  const { language } = usePreferences();
  const title = t(language, titleKey);
  return (
    <Shell title={title} description={t(language, ledeKey)} path={path}>
      <DeskHero kicker={t(language, kickerKey)} title={title} lede={t(language, ledeKey)} />
      <div className="legal-list">
        {sections.map(([heading, body], index) => (
          <article key={heading}>
            <p className="legal-index">{String(index + 1).padStart(2, '0')}</p>
            <div>
              <h2>{t(language, heading)}</h2>
              <p>{t(language, body)}</p>
            </div>
          </article>
        ))}
      </div>
    </Shell>
  );
}

export function PrivacyPage() {
  return <LegalPage path="/privacy" titleKey="privacyTitle" ledeKey="privacyLede" kickerKey="privacyKicker" sections={PRIVACY} />;
}

export function TermsPage() {
  return <LegalPage path="/terms" titleKey="termsTitle" ledeKey="termsLede" kickerKey="termsKicker" sections={TERMS} />;
}

export function MissingPage() {
  const { language } = usePreferences();
  return (
    <div className="wrap missing-page">
      <PageHead title={t(language, 'notFoundTitle')} path="/404" noIndex />
      <p className="desk-kicker">404</p>
      <h1>{t(language, 'notFoundTitle')}</h1>
      <p className="desk-lede">{t(language, 'notFoundBody')}</p>
      <Link className="btn" to="/">{t(language, 'notFoundHome')}</Link>
    </div>
  );
}
