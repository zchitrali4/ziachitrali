import { Link } from 'react-router-dom';
import { contentPath } from '../../../config/contentRegistry.js';
import { ReadingMeta } from './ReadingMeta.jsx';

export function ContentList({ items = [] }) {
  return (
    <ul className="list">
      {items.map((item) => (
        <li key={item.id}>
          <ReadingMeta item={{ ...item, author: null, readingTime: null, viewCount: null }} withAuthor={false} />
          <div>
            <Link to={contentPath(item.type, item.slug)}><strong>{item.title}</strong></Link>
            {item.excerpt ? <p className="meta">{item.excerpt}</p> : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
