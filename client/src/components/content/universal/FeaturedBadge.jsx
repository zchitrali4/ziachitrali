import { usePreferences } from '../../../context/PreferencesContext.jsx';
import { t } from '../../../utils/i18n.js';

export function FeaturedBadge({ featured }) {
  const { language } = usePreferences();
  if (!featured) return null;
  return <span className="badge">{t(language, 'featured')}</span>;
}
