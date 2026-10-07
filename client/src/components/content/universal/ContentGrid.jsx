import { UniversalContentCard } from './UniversalContentCard.jsx';

export function ContentGrid({ items = [], variant = 'featured', query = '', columns = 3 }) {
  return (
    <div className={`card-grid cols-${columns}`}>
      {items.map((item) => (
        <UniversalContentCard key={item.id} item={item} variant={variant} query={query} />
      ))}
    </div>
  );
}
