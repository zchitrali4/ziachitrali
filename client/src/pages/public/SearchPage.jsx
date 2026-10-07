import { useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { discoveryApi } from '../../api/index.js';
import { EmptyState } from '../../components/content/universal/EmptyState.jsx';
import { ErrorState } from '../../components/content/universal/ErrorState.jsx';
import { UniversalContentCard } from '../../components/content/universal/UniversalContentCard.jsx';
import { Pagination } from '../../components/navigation/Pagination.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { SkeletonRenderer } from '../../components/skeletons/SkeletonRenderer.jsx';
import { CONTENT_REGISTRY } from '../../config/contentRegistry.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useQuery } from '../../hooks/useQuery.js';
import { t } from '../../utils/i18n.js';
import { menuLabel } from '../../utils/menuLabel.js';

export default function SearchPage() {
  const { language } = usePreferences();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const type = params.get('type') || '';
  const page = Number(params.get('page') || 1);
  const load = useCallback((signal) => {
    if (!q.trim()) return Promise.resolve({ data: [], meta: { page: 1, pages: 1, total: 0 } });
    return discoveryApi.search({ q, type, page, limit: 12 }, signal);
  }, [q, type, page]);
  const query = useQuery(load);

  function update(next) {
    const merged = { q, type, page, ...next };
    const cleaned = {};
    Object.entries(merged).forEach(([key, value]) => {
      if (value && !(key === 'page' && Number(value) === 1)) cleaned[key] = String(value);
    });
    setParams(cleaned);
  }

  return (
    <div className="wrap" style={{ paddingBlock: '1.4rem' }}>
      <PageHead title={q ? `${t(language, 'search')}: ${q}` : t(language, 'search')} description={t(language, 'searchLede')} path={`/search${q ? `?q=${encodeURIComponent(q)}` : ''}`} />
      <header className="page-head">
        <div>
          <h1>{t(language, 'search')}</h1>
          <p className="meta">{q ? `${query.meta?.total || 0} ${t(language, 'results')}` : t(language, 'searchLede')}</p>
        </div>
      </header>
      <form className="filters" onSubmit={(event) => { event.preventDefault(); update({ q: event.target.elements.q.value, page: 1 }); }}>
        <label className="field">
          <span>{t(language, 'keyword')}</span>
          <input name="q" defaultValue={q} key={q} />
        </label>
        <label className="field">
          <span>{t(language, 'contentType')}</span>
          <select value={type} onChange={(event) => update({ type: event.target.value, page: 1 })}>
            <option value="">{t(language, 'allContent')}</option>
            {CONTENT_REGISTRY.map((item) => <option key={item.key} value={item.key}>{menuLabel(language, { url: item.route, label: item.label })}</option>)}
            <option value="podcast-episode">{t(language, 'podcastEpisodes')}</option>
          </select>
        </label>
        <button className="btn" type="submit">{t(language, 'search')}</button>
      </form>
      {!q ? <EmptyState title={t(language, 'searchPrompt')} /> : null}
      {q && query.status === 'loading' ? <SkeletonRenderer variant="search" /> : null}
      {q && query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
      {q && query.status === 'success' && !query.data.length ? <EmptyState title={t(language, 'noResults')} message={t(language, 'noResultsNote')} /> : null}
      <div className="stack">
        {query.data?.map((item) => <UniversalContentCard key={`${item.kind}-${item.id}`} item={item} variant="search" query={q} />)}
      </div>
      <Pagination page={query.meta?.page || 1} pages={query.meta?.pages || 1} onPage={(next) => update({ page: next })} />
      <p className="meta"><Link to="/tags">{t(language, 'browseTags')}</Link></p>
    </div>
  );
}
