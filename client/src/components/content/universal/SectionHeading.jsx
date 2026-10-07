import { Link } from 'react-router-dom';
import { usePreferences } from '../../../context/PreferencesContext.jsx';
import { t } from '../../../utils/i18n.js';

export function SectionHeading({ title, subtitle, href, eyebrow }) {
  const { language } = usePreferences();
  return (
    <div className="section-head">
      <div>
        {eyebrow ? <div className="rule" /> : null}
        {eyebrow ? <p className="kicker">{eyebrow}</p> : <div className="rule" />}
        <h2>{title}</h2>
        {subtitle ? <p className="meta">{subtitle}</p> : null}
      </div>
      {href ? <Link className="btn-text" to={href}>{t(language, 'viewAll')}</Link> : null}
    </div>
  );
}
