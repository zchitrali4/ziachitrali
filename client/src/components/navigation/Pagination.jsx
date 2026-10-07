import { usePreferences } from '../../context/PreferencesContext.jsx';
import { t } from '../../utils/i18n.js';

export function Pagination({ page = 1, pages = 1, onPage }) {
  const { language } = usePreferences();
  if (!pages || pages <= 1) return null;
  return (
    <nav className="pager" aria-label="Pagination">
      <button className="btn-ghost" type="button" disabled={page <= 1} onClick={() => onPage(page - 1)}>{t(language, 'previous')}</button>
      <span className="meta">{t(language, 'pageOf').replace('{page}', page).replace('{pages}', pages)}</span>
      <button className="btn-ghost" type="button" disabled={page >= pages} onClick={() => onPage(page + 1)}>{t(language, 'next')}</button>
    </nav>
  );
}
