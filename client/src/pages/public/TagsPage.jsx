import { useCallback } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { contentApi, discoveryApi } from '../../api/index.js';
import { Breadcrumbs } from '../../components/content/universal/Breadcrumbs.jsx';
import { ContentGrid } from '../../components/content/universal/ContentGrid.jsx';
import { EmptyState } from '../../components/content/universal/EmptyState.jsx';
import { ErrorState } from '../../components/content/universal/ErrorState.jsx';
import { Pagination } from '../../components/navigation/Pagination.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { SkeletonRenderer } from '../../components/skeletons/SkeletonRenderer.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useQuery } from '../../hooks/useQuery.js';
import { t } from '../../utils/i18n.js';

export function TagsIndexPage() {
  const { language } = usePreferences();
  const query = useQuery(useCallback((signal) => discoveryApi.tags({ limit: 60 }, signal), []));
  return (
    <div className="wrap" style={{ paddingBlock: '1.4rem' }}>
      <PageHead title={t(language, 'tagsTitle')} description={t(language, 'tagsLede')} path="/tags" />
      <h1>{t(language, 'tagsTitle')}</h1>
      {query.status === 'loading' ? <SkeletonRenderer variant="search" /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
      {query.status === 'success' && !query.data.length ? <EmptyState title={t(language, 'emptyTagsYet')} /> : null}
      <div className="chip-row">
        {query.data?.map((tag) => <Link className="chip" key={tag.id} to={`/tags/${tag.slug}`}>{tag.name}</Link>)}
      </div>
    </div>
  );
}

export function TagDetailPage() {
  const { language } = usePreferences();
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') || 1);
  const tag = useQuery(useCallback((signal) => discoveryApi.tag(slug, signal), [slug]));
  const content = useQuery(useCallback((signal) => contentApi.list('', { tag: slug, page, limit: 12 }, signal), [slug, page]));
  return (
    <div className="wrap" style={{ paddingBlock: '1.4rem' }}>
      <PageHead title={tag.data?.name || t(language, 'tagLabel')} description={tag.data?.name || ''} path={`/tags/${slug}`} />
      <Breadcrumbs items={[{ label: t(language, 'home'), href: '/' }, { label: t(language, 'tagsTitle'), href: '/tags' }, { label: tag.data?.name || t(language, 'tagLabel') }]} />
      {tag.status === 'error' ? <ErrorState message={tag.error.message} onRetry={tag.reload} backTo="/tags" /> : null}
      <h1>{tag.data?.name || t(language, 'tagLabel')}</h1>
      {content.status === 'loading' ? <SkeletonRenderer variant="contentGrid" /> : null}
      {content.status === 'error' ? <ErrorState message={content.error.message} onRetry={content.reload} /> : null}
      {content.status === 'success' && !content.data.length ? <EmptyState title={t(language, 'emptyTagContent')} /> : null}
      {content.data?.length ? <ContentGrid items={content.data} /> : null}
      <Pagination page={content.meta?.page || 1} pages={content.meta?.pages || 1} onPage={(next) => setParams({ page: String(next) })} />
    </div>
  );
}
