import { Link } from 'react-router-dom';

export function CategoryBadge({ category }) {
  if (!category?.name) return null;
  return <Link className="kicker" to={`/categories/${category.slug}`}>{category.name}</Link>;
}
