import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { contentApi, engagementApi } from '../../api/index.js';
import { CommentsSection } from '../../components/comments/CommentsSection.jsx';
import { AuthorCard } from '../../components/content/universal/AuthorCard.jsx';
import { Breadcrumbs } from '../../components/content/universal/Breadcrumbs.jsx';
import { CategoryBadge } from '../../components/content/universal/CategoryBadge.jsx';
import { EmptyState } from '../../components/content/universal/EmptyState.jsx';
import { ErrorState } from '../../components/content/universal/ErrorState.jsx';
import { OptimizedImage } from '../../components/content/universal/OptimizedImage.jsx';
import { ReadingMeta } from '../../components/content/universal/ReadingMeta.jsx';
import { ReadingProgress } from '../../components/content/universal/ReadingProgress.jsx';
import { RelatedContentSection } from '../../components/content/universal/RelatedContentSection.jsx';
import { ShareBar } from '../../components/content/universal/ShareBar.jsx';
import { TableOfContents } from '../../components/content/universal/TableOfContents.jsx';
import { TagList } from '../../components/content/universal/TagList.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { VideoPlayer } from '../../components/video/VideoPlayer.jsx';
import { SkeletonRenderer } from '../../components/skeletons/SkeletonRenderer.jsx';
import { contentPath, getContentType } from '../../config/contentRegistry.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useAnalytics } from '../../hooks/useAnalytics.js';
import { useQuery } from '../../hooks/useQuery.js';
import { useReadingHistorySync } from '../../hooks/useReadingHistorySync.js';
import { formatMoney } from '../../utils/format.js';
import { t } from '../../utils/i18n.js';
import { articleSchema, breadcrumbSchema } from '../../utils/seoSchema.js';
import { extractHeadings, headingIds, sanitizeRichHtml } from '../../utils/text.js';
import { normalizeError } from '../../utils/errors.js';

export default function ContentDetailPage({ typeKey }) {
  const { slug } = useParams();
  const type = getContentType(typeKey);
  const { user } = useAuth();
  const { language } = usePreferences();
  const { trackView } = useAnalytics();
  const load = useCallback((signal) => contentApi.detail(typeKey, slug, signal), [typeKey, slug]);
  const relatedLoad = useCallback((signal) => contentApi.related(typeKey, slug, signal), [typeKey, slug]);
  const query = useQuery(load);
  const related = useQuery(relatedLoad);
  const item = query.data;
  const html = useMemo(() => headingIds(sanitizeRichHtml(item?.body || '')), [item?.body]);
  const headings = useMemo(() => extractHeadings(html), [html]);
  const [engagement, setEngagement] = useState({ liked: false, bookmarked: false });
  const [likeCount, setLikeCount] = useState(0);
  const [actionError, setActionError] = useState('');

  useReadingHistorySync(item ? { ...item, path: contentPath(typeKey, item.slug) } : null);
  useEffect(() => {
    if (item?.id) trackView(typeKey, item.id);
    setEngagement(item?.engagement || { liked: false, bookmarked: false });
    setLikeCount(item?.likeCount || 0);
  }, [item, trackView, typeKey]);

  async function toggle(kind) {
    setActionError('');
    if (!user) {
      setActionError(t(language, 'signInToSave'));
      return;
    }
    try {
      const payload = kind === 'like'
        ? await engagementApi.like({ targetType: typeKey, targetId: item.id })
        : await engagementApi.bookmark({ targetType: typeKey, targetId: item.id });
      setEngagement((current) => ({ ...current, ...payload.data }));
      if (payload.data.likeCount !== undefined) setLikeCount(payload.data.likeCount);
    } catch (error) {
      setActionError(normalizeError(error).message);
    }
  }

  if (query.status === 'loading') {
    return <div className="wrap" style={{ paddingBlock: '1.5rem' }}><SkeletonRenderer variant="detail" /></div>;
  }
  if (query.status === 'error') {
    return <div className="wrap"><ErrorState message={query.error.message} onRetry={query.reload} backTo={type?.route || '/'} /></div>;
  }
  if (!item) return <div className="wrap"><EmptyState title={t(language, 'contentNotFound')} /></div>;

  const path = contentPath(typeKey, item.slug);
  const crumbs = [
    { label: t(language, 'home'), href: '/' },
    { label: t(language, typeKey), href: type?.route },
    { label: item.title },
  ];
  const jsonLd = [
    articleSchema({ content: item, url: `${window.location.origin}${path}` }),
    breadcrumbSchema(crumbs, window.location.origin),
  ];

  return (
    <article className="wrap article-layout">
      <PageHead
        title={item.seo?.title || item.title}
        description={item.seo?.description || item.excerpt}
        path={path}
        image={item.coverImage?.url || ''}
        type={typeKey === 'videos' ? 'video.other' : 'article'}
        jsonLd={jsonLd}
      />
      <ReadingProgress targetId="article-body" />
      <div>
        <Breadcrumbs items={crumbs} />
        <header>
          <CategoryBadge category={item.category} />
          <h1 className="display" dir={item.direction}>{item.title}</h1>
          {item.excerpt ? <p className="standfirst" dir={item.direction}>{item.excerpt}</p> : null}
          <ReadingMeta item={item} />
          {typeKey === 'books' ? (
            <p className="meta">
              {[item.publisher, item.pages ? t(language, 'pagesCount').replace('{count}', item.pages) : '', item.isbn ? `ISBN ${item.isbn}` : '', item.priceCents != null ? formatMoney(item.priceCents, item.currency, language) : ''].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </header>
        {item.coverImage?.url ? <OptimizedImage src={item.coverImage.url} alt={item.coverImage.alt || item.title} ratio="16 / 8" eager /> : null}
        {typeKey === 'videos' ? <VideoPlayer url={item.videoUrl} title={item.title} /> : null}
        <div className="share">
          <button className="btn-ghost" type="button" onClick={() => toggle('like')}>{engagement.liked ? t(language, 'liked') : t(language, 'like')} · {likeCount}</button>
          <button className="btn-ghost" type="button" onClick={() => toggle('bookmark')}>{engagement.bookmarked ? t(language, 'bookmarked') : t(language, 'bookmark')}</button>
          <ShareBar title={item.title} path={path} targetType={typeKey} targetId={item.id} />
        </div>
        {actionError ? <p className="form-error">{actionError}</p> : null}
        <TagList tags={item.tags} />
        <div id="article-body" className="prose" dir={item.direction} dangerouslySetInnerHTML={{ __html: html }} />
        <nav className="pager" aria-label="Previous and next">
          {item.prev ? <Link to={contentPath(item.prev.type, item.prev.slug)}>{t(language, 'previous')}: {item.prev.title}</Link> : <span />}
          {item.next ? <Link to={contentPath(item.next.type, item.next.slug)}>{t(language, 'next')}: {item.next.title}</Link> : null}
        </nav>
        {item.author ? <AuthorCard author={item.author} /> : null}
        <RelatedContentSection items={related.data || []} />
        <CommentsSection targetType={typeKey} targetId={item.id} />
      </div>
      <aside className="toc-col">
        <TableOfContents headings={headings} />
      </aside>
    </article>
  );
}
