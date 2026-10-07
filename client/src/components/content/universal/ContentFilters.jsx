import { usePreferences } from '../../../context/PreferencesContext.jsx';
import { t } from '../../../utils/i18n.js';

export function ContentFilters({
  query,
  sort,
  category,
  tag,
  language,
  categories = [],
  tags = [],
  sorts = [],
  onChange,
}) {
  const { language: ui } = usePreferences();
  return (
    <form className="filters" onSubmit={(event) => event.preventDefault()}>
      <label className="field">
        <span>{t(ui, 'searchWithin')}</span>
        <input value={query} onChange={(event) => onChange({ q: event.target.value, page: 1 })} />
      </label>
      <label className="field">
        <span>{t(ui, 'category')}</span>
        <select value={category} onChange={(event) => onChange({ category: event.target.value, page: 1 })}>
          <option value="">{t(ui, 'all')}</option>
          {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      <label className="field">
        <span>{t(ui, 'tag')}</span>
        <select value={tag} onChange={(event) => onChange({ tag: event.target.value, page: 1 })}>
          <option value="">{t(ui, 'all')}</option>
          {tags.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
        </select>
      </label>
      <label className="field">
        <span>{t(ui, 'sort')}</span>
        <select value={sort} onChange={(event) => onChange({ sort: event.target.value, page: 1 })}>
          {sorts.map((item) => <option key={item} value={item}>{t(ui, { newest: 'sortNewest', oldest: 'sortOldest', popular: 'sortPopular', title: 'sortByTitle' }[item] || item)}</option>)}
        </select>
      </label>
      <label className="field">
        <span>{t(ui, 'language')}</span>
        <select value={language} onChange={(event) => onChange({ language: event.target.value, page: 1 })}>
          <option value="">{t(ui, 'all')}</option>
          <option value="en">English</option>
          <option value="ur">اردو</option>
          <option value="ar">العربية</option>
        </select>
      </label>
    </form>
  );
}
