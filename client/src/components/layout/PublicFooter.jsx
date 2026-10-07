import { Link } from 'react-router-dom';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { t } from '../../utils/i18n.js';
import { menuLabel } from '../../utils/menuLabel.js';
import { NewsletterForm } from '../newsletter/NewsletterForm.jsx';

export function PublicFooter() {
  const { settings, menus } = useSite();
  const { language } = usePreferences();
  const year = new Date().getFullYear();
  const contact = settings.contact || {};
  const footerItems = menus.footer || [];
  const legal = footerItems.filter((item) => item.url === '/privacy' || item.url === '/terms');
  const columns = [
    {
      title: t(language, 'reading'),
      links: [
        { url: '/articles' },
        { url: '/research' },
        { url: '/news' },
        { url: '/columns' },
        { url: '/analysis' },
      ],
    },
    {
      title: t(language, 'programmes'),
      links: [
        { url: '/videos' },
        { url: '/podcasts' },
        { url: '/books' },
        { url: '/interesting-stories' },
        { url: '/inspirational-stories' },
      ],
    },
    {
      title: t(language, 'visit'),
      links: [
        { url: '/about' },
        { url: '/contact' },
        { url: '/shop' },
        { url: '/donate' },
      ],
    },
  ];

  return (
    <footer className="site-footer">
      <div className="wrap footer-main">
        <div className="footer-brand-col">
          <Link className="footer-mark" to="/">
            <img src="/logo.png" alt="ضیاء چترالی" width="496" height="246" />
          </Link>
          <p>{language === 'en' ? (settings.footerText || settings.tagline) : t(language, 'footerBlurb')}</p>
          {(contact.email || contact.phone || contact.address) ? (
            <address>
              {contact.address ? <span>{contact.address}</span> : null}
              {contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : null}
              {contact.phone ? <a href={`tel:${contact.phone}`}>{contact.phone}</a> : null}
            </address>
          ) : null}
          {settings.social?.length ? (
            <div className="footer-social">
              {settings.social.filter((item) => item.url).map((item) => (
                <a key={item.url} href={item.url} rel="noreferrer">{item.platform || 'Link'}</a>
              ))}
            </div>
          ) : null}
        </div>
        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="footer-label">{column.title}</p>
            <div className="footer-links">
              {column.links.map((item) => <Link key={item.url} to={item.url}>{menuLabel(language, item)}</Link>)}
            </div>
          </nav>
        ))}
        <div className="footer-news">
          <p className="footer-label">{t(language, 'newsletter')}</p>
          <p className="footer-note">{t(language, 'newsletterNote')}</p>
          <NewsletterForm compact />
        </div>
      </div>
      <div className="wrap footer-legal">
        <p>© {year} {settings.siteName || 'ضیاء چترالی'}</p>
        <nav aria-label="Legal">
          {legal.map((item) => <Link key={item.url} to={item.url}>{menuLabel(language, item)}</Link>)}
        </nav>
      </div>
    </footer>
  );
}
