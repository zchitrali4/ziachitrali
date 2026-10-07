import { Link } from 'react-router-dom';
import { contentPath } from '../../../config/contentRegistry.js';
import { formatDuration, formatMoney } from '../../../utils/format.js';
import { highlightText } from '../../../utils/text.js';
import { FeaturedBadge } from './FeaturedBadge.jsx';
import { OptimizedImage } from './OptimizedImage.jsx';
import { ReadingMeta } from './ReadingMeta.jsx';

const RATIO = {
  hero: '16 / 10',
  featured: '16 / 10',
  compact: '16 / 10',
  horizontal: '4 / 3',
  minimal: '16 / 9',
  related: '16 / 10',
  search: '16 / 10',
  book: '3 / 4',
  video: '16 / 9',
};

export function UniversalContentCard({ item, variant = 'featured', query = '', heading = 'h3' }) {
  if (!item) return null;
  const href = item.showSlug ? `/podcasts/${item.showSlug}/${item.slug}` : contentPath(item.type, item.slug);
  const title = query
    ? <span dangerouslySetInnerHTML={{ __html: highlightText(item.title, query) }} />
    : item.title;
  const excerpt = query
    ? <span dangerouslySetInnerHTML={{ __html: highlightText(item.excerpt, query) }} />
    : item.excerpt;
  const Title = heading;
  const ratio = RATIO[variant] || '16 / 9';
  const image = item.coverImage?.url ? (
    <OptimizedImage src={item.coverImage.url} alt={item.coverImage.alt || item.title} ratio={ratio} eager={variant === 'hero'} />
  ) : variant === 'minimal' ? null : (
    <OptimizedImage alt="" ratio={ratio} />
  );

  return (
    <article className={`card card--${variant}`} dir={item.direction || 'ltr'}>
      <Link to={href} className="card">
        {image}
        {item.category?.name ? <span className="kicker">{item.category.name}</span> : null}
        <FeaturedBadge featured={item.featured} />
        <Title>{title}</Title>
        {variant !== 'compact' && variant !== 'minimal' && excerpt ? <p>{excerpt}</p> : null}
        <ReadingMeta item={item} linkAuthor={false} showViews={false} />
        {item.type === 'books' && item.priceCents != null ? <p className="meta">{formatMoney(item.priceCents, item.currency)}</p> : null}
        {item.duration ? <p className="meta">{formatDuration(item.duration)}</p> : null}
      </Link>
    </article>
  );
}
