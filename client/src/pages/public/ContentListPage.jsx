import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { contentApi, discoveryApi } from '../../api/index.js';
import { Breadcrumbs } from '../../components/content/universal/Breadcrumbs.jsx';
import { ContentFilters } from '../../components/content/universal/ContentFilters.jsx';
import { ContentGrid } from '../../components/content/universal/ContentGrid.jsx';
import { EmptyState } from '../../components/content/universal/EmptyState.jsx';
import { ErrorState } from '../../components/content/universal/ErrorState.jsx';
import { Pagination } from '../../components/navigation/Pagination.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { SkeletonRenderer } from '../../components/skeletons/SkeletonRenderer.jsx';
import { getContentType } from '../../config/contentRegistry.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useQuery } from '../../hooks/useQuery.js';
import { t } from '../../utils/i18n.js';

export default function ContentListPage({ typeKey }) {
  const type = getContentType(typeKey);
  const { language: ui } = usePreferences();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') || 1);
  const sort = params.get('sort') || 'newest';
  const category = params.get('category') || '';
  const tag = params.get('tag') || '';
  const language = params.get('language') || '';
  const q = params.get('q') || '';
  const load = useCallback((signal) => contentApi.list(typeKey, { page, sort, category, tag, language, q, limit: 12 }, signal), [typeKey, page, sort, category, tag, language, q]);
  const query = useQuery(load);
  const categories = useQuery(useCallback((signal) => discoveryApi.categories({ limit: 40 }, signal), []));
  const tags = useQuery(useCallback((signal) => discoveryApi.tags({ limit: 40 }, signal), []));

  function update(next) {
    const merged = { page, sort, category, tag, language, q, ...next };
    const cleaned = {};
    Object.entries(merged).forEach(([key, value]) => {
      if (value && !(key === 'page' && Number(value) === 1) && !(key === 'sort' && value === 'newest')) cleaned[key] = String(value);
    });
    setParams(cleaned);
  }

  const variant = typeKey === 'books' ? 'book' : typeKey === 'videos' ? 'video' : 'featured';
  return (
    <div className="wrap" style={{ paddingBlock: '1.4rem' }}>
      <PageHead title={t(ui, typeKey)} description={t(ui, `${typeKey}Desc`)} path={type?.route || '/'} />
      <Breadcrumbs items={[{ label: t(ui, 'home'), href: '/' }, { label: t(ui, typeKey) }]} />
      <header className="page-head">
        <div>
          <h1>{t(ui, typeKey)}</h1>
          <p className="meta">{t(ui, `${typeKey}Desc`)}</p>
        </div>
      </header>
      <ContentFilters
        query={q}
        sort={sort}
        category={category}
        tag={tag}
        language={language}
        categories={categories.data || []}
        tags={tags.data || []}
        sorts={type?.sorting || ['newest']}
        onChange={update}
      />
      {query.status === 'loading' ? <SkeletonRenderer variant={variant === 'book' ? 'book' : variant === 'video' ? 'video' : 'contentGrid'} /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
      {query.status === 'success' && !query.data.length ? <EmptyState title={t(ui, 'emptyList')} /> : null}
      {query.data?.length ? <ContentGrid items={query.data} variant={variant} columns={variant === 'book' ? 4 : 3} /> : null}
      <Pagination page={query.meta?.page || page} pages={query.meta?.pages || 1} onPage={(next) => update({ page: next })} />
    </div>
  );
}
