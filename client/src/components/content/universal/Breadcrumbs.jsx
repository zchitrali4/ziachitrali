import { Link } from 'react-router-dom';

export function Breadcrumbs({ items = [] }) {
  return (
    <nav className="meta" aria-label="Breadcrumb">
      <ol className="chip-row" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`}>
            {item.href && index < items.length - 1 ? <Link to={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
            {index < items.length - 1 ? <span aria-hidden="true"> / </span> : null}
          </li>
        ))}
      </ol>
    </nav>
  );
}
