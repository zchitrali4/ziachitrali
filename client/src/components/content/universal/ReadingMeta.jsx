import { Link } from 'react-router-dom';
import { usePreferences } from '../../../context/PreferencesContext.jsx';
import { formatDate, readingLabel } from '../../../utils/format.js';
import { t } from '../../../utils/i18n.js';

export function ReadingMeta({ item, withAuthor = true, linkAuthor = true, showViews = true }) {
  const { language } = usePreferences();
  if (!item) return null;
  return (
    <p className="meta">
      {withAuthor && item.author?.name ? (linkAuthor && item.author.slug ? <Link to={`/authors/${item.author.slug}`}>{item.author.name}</Link> : item.author.name) : null}
      {withAuthor && item.author?.name ? ' · ' : null}
      {item.publishedAt ? formatDate(item.publishedAt, language) : null}
      {item.readingTime ? ` · ${readingLabel(item.readingTime, language)}` : null}
      {showViews && item.viewCount ? ` · ${item.viewCount} ${t(language, 'views')}` : null}
    </p>
  );
}
