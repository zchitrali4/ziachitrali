import { Link } from 'react-router-dom';

export function TagList({ tags = [] }) {
  if (!tags.length) return null;
  return (
    <ul className="chip-row" style={{ listStyle: 'none', padding: 0 }}>
      {tags.map((tag) => (
        <li key={tag.id || tag.slug}><Link className="chip" to={`/tags/${tag.slug}`}>{tag.name}</Link></li>
      ))}
    </ul>
  );
}
