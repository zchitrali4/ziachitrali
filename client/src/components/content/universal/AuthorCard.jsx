import { Link } from 'react-router-dom';
import { OptimizedImage } from './OptimizedImage.jsx';

export function AuthorCard({ author }) {
  if (!author) return null;
  return (
    <Link className="card card--minimal" to={`/authors/${author.slug}`}>
      {author.image?.url
        ? <OptimizedImage src={author.image.url} alt={author.image.alt || author.name} ratio="1 / 1" />
        : <div className="media-frame author-mark" style={{ aspectRatio: '1 / 1' }} aria-hidden="true">{(author.name || '').trim().slice(0, 1)}</div>}
      <h3>{author.name}</h3>
      {author.roleTitle ? <p className="meta">{author.roleTitle}</p> : null}
      {author.bio ? <p>{author.bio.slice(0, 140)}</p> : null}
    </Link>
  );
}
