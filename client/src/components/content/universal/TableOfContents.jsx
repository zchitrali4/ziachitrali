import { usePreferences } from '../../../context/PreferencesContext.jsx';
import { t } from '../../../utils/i18n.js';

export function TableOfContents({ headings = [] }) {
  const { language } = usePreferences();
  if (headings.length < 2) return null;
  return (
    <nav className="toc" aria-label={t(language, 'contents')}>
      <p className="kicker">{t(language, 'contents')}</p>
      {headings.map((heading) => (
        <a key={heading.id} href={`#${heading.id}`} style={{ paddingInlineStart: heading.level === 3 ? '0.8rem' : 0 }}>
          {heading.text}
        </a>
      ))}
    </nav>
  );
}
