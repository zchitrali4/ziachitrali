import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { contentApi, discoveryApi, donationApi, podcastApi } from '../../api/index.js';
import { AuthorCard } from '../../components/content/universal/AuthorCard.jsx';
import { ContentGrid } from '../../components/content/universal/ContentGrid.jsx';
import { ContentList } from '../../components/content/universal/ContentList.jsx';
import { EmptyState } from '../../components/content/universal/EmptyState.jsx';
import { ErrorState } from '../../components/content/universal/ErrorState.jsx';
import { SectionHeading } from '../../components/content/universal/SectionHeading.jsx';
import { HeroSlider } from '../../components/home/HeroSlider.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { SkeletonRenderer } from '../../components/skeletons/SkeletonRenderer.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { useQuery } from '../../hooks/useQuery.js';
import { t } from '../../utils/i18n.js';

function HomeBand({ title, subtitle, href, typeKey, params, variant = 'featured', presentation = 'grid', skeleton = 'contentGrid' }) {
  const { language } = usePreferences();
  const key = JSON.stringify(params);
  const load = useCallback((signal) => contentApi.list(typeKey, JSON.parse(key), signal), [typeKey, key]);
  const query = useQuery(load);
  const items = query.data || [];
  return (
    <section className="section wrap">
      <SectionHeading title={title} subtitle={subtitle} href={href} />
      {query.status === 'loading' ? <SkeletonRenderer variant={skeleton} /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
      {query.status === 'success' && items.length === 0 ? <EmptyState title={t(language, 'emptySection')} /> : null}
      {query.status === 'success' && items.length > 0 && presentation === 'list' ? <ContentList items={items} /> : null}
      {query.status === 'success' && items.length > 0 && presentation === 'grid' ? (
        <ContentGrid items={items} variant={variant} columns={variant === 'book' ? 4 : 3} />
      ) : null}
    </section>
  );
}

export default function HomePage() {
  const { settings } = useSite();
  const { language } = usePreferences();
  const featured = useQuery(useCallback((signal) => contentApi.list('articles', { featured: 'true', limit: 3 }, signal), []));
  const popularCategories = useQuery(useCallback((signal) => discoveryApi.categories({ sort: 'popular', limit: 12 }, signal), []));
  const popularTags = useQuery(useCallback((signal) => discoveryApi.tags({ sort: 'popular', limit: 20 }, signal), []));
  const authors = useQuery(useCallback((signal) => discoveryApi.authors({ featured: 'true', limit: 6 }, signal), []));
  const podcasts = useQuery(useCallback((signal) => podcastApi.list({ limit: 4 }, signal), []));
  const campaign = useQuery(useCallback((signal) => donationApi.campaigns({ featured: 'true', limit: 1 }, signal), []));
  const slides = featured.data?.slice(0, 3) || [];

  return (
    <>
      <PageHead title={settings.siteName} description={settings.tagline} path="/" />
      <section className="hero wrap">
        {featured.status === 'loading' ? <SkeletonRenderer variant="hero" /> : null}
        {featured.status === 'error' ? <ErrorState message={featured.error.message} onRetry={featured.reload} /> : null}
        {featured.status === 'success' && !slides.length ? <EmptyState title={t(language, 'emptyFeatured')} message={t(language, 'emptyFeaturedNote')} /> : null}
        {slides.length ? <HeroSlider items={slides} /> : null}
      </section>
      <HomeBand title={t(language, 'featuredResearch')} href="/research" typeKey="research" params={{ featured: 'true', limit: 3 }} />
      <HomeBand title={t(language, 'latestNews')} href="/news" typeKey="news" params={{ limit: 6 }} presentation="list" />
      <HomeBand title={t(language, 'columns')} href="/columns" typeKey="columns" params={{ limit: 3 }} />
      <HomeBand title={t(language, 'analysis')} href="/analysis" typeKey="analysis" params={{ limit: 3 }} />
      <HomeBand title={t(language, 'interestingStories')} href="/interesting-stories" typeKey="interesting-stories" params={{ limit: 3 }} />
      <HomeBand title={t(language, 'inspirationalStories')} href="/inspirational-stories" typeKey="inspirational-stories" params={{ limit: 3 }} />
      <HomeBand title={t(language, 'featuredVideos')} href="/videos" typeKey="videos" params={{ featured: 'true', limit: 2 }} variant="video" skeleton="video" />
      <HomeBand title={t(language, 'featuredBooks')} href="/books" typeKey="books" params={{ featured: 'true', limit: 4 }} variant="book" skeleton="book" />
      <section className="section wrap">
        <SectionHeading title={t(language, 'featuredAuthors')} />
        {authors.status === 'loading' ? <SkeletonRenderer variant="author" /> : null}
        {authors.status === 'error' ? <ErrorState message={authors.error.message} onRetry={authors.reload} /> : null}
        {authors.status === 'success' && !authors.data.length ? <EmptyState title={t(language, 'emptyAuthors')} /> : null}
        {authors.data?.length ? <div className="author-row">{authors.data.map((author) => <AuthorCard key={author.id} author={author} />)}</div> : null}
      </section>
      <section className="section wrap">
        <SectionHeading title={t(language, 'popularCategories')} />
        {popularCategories.status === 'error' ? <ErrorState message={popularCategories.error.message} onRetry={popularCategories.reload} /> : null}
        {popularCategories.status === 'success' && !popularCategories.data.length ? <EmptyState title={t(language, 'emptyCategories')} /> : null}
        <div className="chip-row">
          {popularCategories.data?.map((item) => <Link className="chip" key={item.id} to={`/categories/${item.slug}`}>{item.name}{item.count ? ` · ${item.count}` : ''}</Link>)}
        </div>
      </section>
      <section className="section wrap">
        <SectionHeading title={t(language, 'popularTags')} href="/tags" />
        {popularTags.status === 'error' ? <ErrorState message={popularTags.error.message} onRetry={popularTags.reload} /> : null}
        {popularTags.status === 'success' && !popularTags.data.length ? <EmptyState title={t(language, 'emptyTags')} /> : null}
        <div className="chip-row">
          {popularTags.data?.map((item) => <Link className="chip" key={item.id} to={`/tags/${item.slug}`}>{item.name}</Link>)}
        </div>
      </section>
      <section className="section wrap">
        <SectionHeading title={t(language, 'latestPodcasts')} href="/podcasts" />
        {podcasts.status === 'loading' ? <SkeletonRenderer variant="contentGrid" /> : null}
        {podcasts.status === 'error' ? <ErrorState message={podcasts.error.message} onRetry={podcasts.reload} /> : null}
        {podcasts.status === 'success' && !podcasts.data.length ? <EmptyState title={t(language, 'emptyPodcasts')} /> : null}
          <div className="card-grid cols-3">
          {podcasts.data?.map((show) => (
            <Link className="card podcast-card" key={show.id} to={`/podcasts/${show.slug}`}>
              <img src={show.coverImage?.url} alt={show.coverImage?.alt || ''} />
              <h3>{show.title}</h3>
              <p>{show.description}</p>
            </Link>
          ))}
        </div>
      </section>
      {campaign.data?.[0] ? (
        <section className="campaign">
          <img src={campaign.data[0].coverImage?.url} alt={campaign.data[0].coverImage?.alt || ''} />
          <div className="wrap campaign-copy">
            <p className="kicker">{t(language, 'support')}</p>
            <h2>{campaign.data[0].title}</h2>
            <p>{campaign.data[0].summary}</p>
            <Link className="btn" to="/donate">{t(language, 'readAppeal')}</Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
