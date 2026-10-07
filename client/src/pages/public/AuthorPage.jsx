import { useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { contentApi, discoveryApi } from '../../api/index.js';
import { AuthorCard } from '../../components/content/universal/AuthorCard.jsx';
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

export default function AuthorPage() {
  const { language } = usePreferences();
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Number(params.get('page') || 1);
  const author = useQuery(useCallback((signal) => discoveryApi.author(slug, signal), [slug]));
  const content = useQuery(useCallback((signal) => contentApi.list('', { author: slug, page, limit: 12 }, signal), [slug, page]));

  return (
    <div className="wrap" style={{ paddingBlock: '1.4rem' }}>
      <PageHead title={author.data?.name || t(language, 'authorLabel')} description={author.data?.bio || ''} path={`/authors/${slug}`} />
      <Breadcrumbs items={[{ label: t(language, 'home'), href: '/' }, { label: author.data?.name || t(language, 'authorLabel') }]} />
      {author.status === 'loading' ? <SkeletonRenderer variant="author" /> : null}
      {author.status === 'error' ? <ErrorState message={author.error.message} onRetry={author.reload} backTo="/" /> : null}
      {author.data ? (
        <>
          <AuthorCard author={author.data} />
          <section className="section">
            <h2>{t(language, 'publishedWork')}</h2>
            {content.status === 'loading' ? <SkeletonRenderer variant="contentGrid" /> : null}
            {content.status === 'error' ? <ErrorState message={content.error.message} onRetry={content.reload} /> : null}
            {content.status === 'success' && !content.data.length ? <EmptyState title={t(language, 'emptyWork')} /> : null}
            {content.data?.length ? <ContentGrid items={content.data} /> : null}
            <Pagination page={content.meta?.page || 1} pages={content.meta?.pages || 1} onPage={(next) => setParams({ page: String(next) })} />
          </section>
        </>
      ) : null}
    </div>
  );
}
