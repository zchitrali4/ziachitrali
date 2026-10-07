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
import { CONTENT_REGISTRY } from '../../config/contentRegistry.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useQuery } from '../../hooks/useQuery.js';
import { t } from '../../utils/i18n.js';
import { menuLabel } from '../../utils/menuLabel.js';

export default function CategoryPage() {
  const { language } = usePreferences();
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const type = params.get('type') || '';
  const page = Number(params.get('page') || 1);
  const category = useQuery(useCallback((signal) => discoveryApi.category(slug, signal), [slug]));
  const content = useQuery(useCallback((signal) => contentApi.list(type, { category: slug, page, limit: 12 }, signal), [slug, type, page]));
  const data = category.data;

  return (
    <div className="wrap" style={{ paddingBlock: '1.4rem' }}>
      <PageHead title={data?.name || t(language, 'categoryLabel')} description={data?.description || ''} path={`/categories/${slug}`} />
      <Breadcrumbs items={[{ label: t(language, 'home'), href: '/' }, { label: data?.name || t(language, 'categoryLabel') }]} />
      {category.status === 'loading' ? <SkeletonRenderer variant="detail" /> : null}
      {category.status === 'error' ? <ErrorState message={category.error.message} onRetry={category.reload} backTo="/" /> : null}
      {data ? (
        <>
          <header className="page-head">
            <div>
              <h1>{data.name}</h1>
              {data.description ? <p>{data.description}</p> : null}
            </div>
          </header>
          <div className="chip-row" style={{ marginBottom: '1rem' }}>
            <button className="chip" type="button" onClick={() => setParams({})}>{t(language, 'allTypes')}</button>
            {CONTENT_REGISTRY.map((item) => (
              <button className="chip" type="button" key={item.key} onClick={() => setParams({ type: item.key })}>{menuLabel(language, { url: item.route, label: item.label })}</button>
            ))}
          </div>
          {content.status === 'loading' ? <SkeletonRenderer variant="contentGrid" /> : null}
          {content.status === 'error' ? <ErrorState message={content.error.message} onRetry={content.reload} /> : null}
          {content.status === 'success' && !content.data.length ? <EmptyState title={t(language, 'emptyCategory')} /> : null}
          {content.data?.length ? <ContentGrid items={content.data} /> : null}
          <Pagination page={content.meta?.page || 1} pages={content.meta?.pages || 1} onPage={(next) => setParams({ ...(type ? { type } : {}), page: String(next) })} />
          {data.related?.length ? (
            <section className="section">
              <h2>{t(language, 'relatedCategories')}</h2>
              <div className="chip-row">
                {data.related.map((item) => <Link className="chip" key={item.id} to={`/categories/${item.slug}`}>{item.name}</Link>)}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
