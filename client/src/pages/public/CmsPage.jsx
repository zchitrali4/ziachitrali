import { useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { cmsApi } from '../../api/index.js';
import { Breadcrumbs } from '../../components/content/universal/Breadcrumbs.jsx';
import { ErrorState } from '../../components/content/universal/ErrorState.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { SkeletonRenderer } from '../../components/skeletons/SkeletonRenderer.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useQuery } from '../../hooks/useQuery.js';
import { t } from '../../utils/i18n.js';
import { sanitizeRichHtml } from '../../utils/text.js';

export default function CmsPage({ slug: forcedSlug }) {
  const { language } = usePreferences();
  const params = useParams();
  const slug = forcedSlug || params.slug;
  const query = useQuery(useCallback((signal) => cmsApi.page(slug, signal), [slug]));
  const page = query.data;
  return (
    <div className="wrap wrap-narrow" style={{ paddingBlock: '1.5rem' }}>
      <PageHead title={page?.seo?.title || page?.title || t(language, 'pageLabel')} description={page?.seo?.description || ''} path={forcedSlug ? `/${slug}` : `/pages/${slug}`} />
      <Breadcrumbs items={[{ label: t(language, 'home'), href: '/' }, { label: page?.title || t(language, 'pageLabel') }]} />
      {query.status === 'loading' ? <SkeletonRenderer variant="detail" /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} backTo="/" /> : null}
      {page ? (
        <>
          <h1>{page.title}</h1>
          <div className="prose" dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(page.body) || `<p>${t(language, 'emptyPage')}</p>` }} />
        </>
      ) : null}
    </div>
  );
}
