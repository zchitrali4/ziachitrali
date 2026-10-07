import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { engagementApi, podcastApi } from '../../api/index.js';
import { CommentsSection } from '../../components/comments/CommentsSection.jsx';
import { Breadcrumbs } from '../../components/content/universal/Breadcrumbs.jsx';
import { EmptyState } from '../../components/content/universal/EmptyState.jsx';
import { ErrorState } from '../../components/content/universal/ErrorState.jsx';
import { OptimizedImage } from '../../components/content/universal/OptimizedImage.jsx';
import { ShareBar } from '../../components/content/universal/ShareBar.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { SkeletonRenderer } from '../../components/skeletons/SkeletonRenderer.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useQuery } from '../../hooks/useQuery.js';
import { formatDate, formatDuration } from '../../utils/format.js';
import { t } from '../../utils/i18n.js';
import { normalizeError } from '../../utils/errors.js';

export function PodcastListPage() {
  const { language } = usePreferences();
  const query = useQuery(useCallback((signal) => podcastApi.list({ limit: 24 }, signal), []));
  return (
    <div className="wrap" style={{ paddingBlock: '1.4rem' }}>
      <PageHead title={t(language, 'podcasts')} description={t(language, 'podcastLede')} path="/podcasts" />
      <h1>{t(language, 'podcasts')}</h1>
      {query.status === 'loading' ? <SkeletonRenderer variant="contentGrid" /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
      {query.status === 'success' && !query.data.length ? <EmptyState title={t(language, 'emptyPodcasts')} /> : null}
      <div className="card-grid">
        {query.data?.map((show) => (
          <Link className="card" key={show.id} to={`/podcasts/${show.slug}`}>
            <OptimizedImage src={show.coverImage?.url} alt={show.coverImage?.alt || show.title} ratio="1 / 1" />
            <h3>{show.title}</h3>
            <p>{show.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}

export function PodcastShowPage() {
  const { showSlug } = useParams();
  const { language } = usePreferences();
  const query = useQuery(useCallback((signal) => podcastApi.show(showSlug, signal), [showSlug]));
  const show = query.data;
  return (
    <div className="wrap" style={{ paddingBlock: '1.4rem' }}>
      <PageHead title={show?.title || t(language, 'podcasts')} description={show?.description || ''} path={`/podcasts/${showSlug}`} />
      <Breadcrumbs items={[{ label: t(language, 'home'), href: '/' }, { label: t(language, 'podcasts'), href: '/podcasts' }, { label: show?.title || t(language, 'showLabel') }]} />
      {query.status === 'loading' ? <SkeletonRenderer variant="detail" /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} backTo="/podcasts" /> : null}
      {show ? (
        <>
          <header className="hero-grid">
            <OptimizedImage src={show.coverImage?.url} alt={show.coverImage?.alt || show.title} ratio="1 / 1" />
            <div>
              <h1>{show.title}</h1>
              <p>{show.description}</p>
            </div>
          </header>
          {!show.episodes?.length ? <EmptyState title={t(language, 'emptyEpisodes')} /> : null}
          <ul className="list">
            {show.episodes?.map((episode) => (
              <li key={episode.id}>
                <span className="meta">{formatDate(episode.publishedAt, language)}{episode.duration ? ` · ${formatDuration(episode.duration)}` : ''}</span>
                <Link to={`/podcasts/${show.slug}/${episode.slug}`}>{episode.title}</Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

export function PodcastEpisodePage() {
  const { showSlug, episodeSlug } = useParams();
  const { user } = useAuth();
  const { language } = usePreferences();
  const query = useQuery(useCallback((signal) => podcastApi.episode(showSlug, episodeSlug, signal), [showSlug, episodeSlug]));
  const episode = query.data?.episode;
  const [bookmarked, setBookmarked] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => { setBookmarked(false); }, [episode?.id]);

  async function bookmark() {
    if (!user) {
      setMessage(t(language, 'signInBookmark'));
      return;
    }
    try {
      const payload = await engagementApi.bookmark({ targetType: 'podcast-episode', targetId: episode.id });
      setBookmarked(payload.data.bookmarked);
    } catch (error) {
      setMessage(normalizeError(error).message);
    }
  }

  const path = `/podcasts/${showSlug}/${episodeSlug}`;
  return (
    <div className="wrap" style={{ paddingBlock: '1.4rem' }}>
      <PageHead title={episode?.title || t(language, 'episodeLabel')} description={episode?.description || ''} path={path} />
      <Breadcrumbs items={[{ label: t(language, 'home'), href: '/' }, { label: t(language, 'podcasts'), href: '/podcasts' }, { label: episode?.show?.title || t(language, 'showLabel'), href: `/podcasts/${showSlug}` }, { label: episode?.title || t(language, 'episodeLabel') }]} />
      {query.status === 'loading' ? <SkeletonRenderer variant="detail" /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} backTo="/podcasts" /> : null}
      {episode ? (
        <>
          <h1>{episode.title}</h1>
          <p className="meta">{formatDate(episode.publishedAt, language)}{episode.duration ? ` · ${formatDuration(episode.duration)}` : ''}</p>
          <p>{episode.description}</p>
          {episode.audioUrl ? <audio controls src={episode.audioUrl} style={{ width: '100%' }}>{t(language, 'episodeLabel')}</audio> : <p className="notice">{t(language, 'noAudio')}</p>}
          <div className="share">
            <button className="btn-ghost" type="button" onClick={bookmark}>{bookmarked ? t(language, 'bookmarked') : t(language, 'bookmark')}</button>
            <ShareBar title={episode.title} path={path} targetType="podcast-episode" targetId={episode.id} />
          </div>
          {message ? <p className="form-error">{message}</p> : null}
          <h2>{t(language, 'moreEpisodes')}</h2>
          {!query.data.related?.length ? <EmptyState title={t(language, 'emptyRelatedEpisodes')} /> : null}
          <ul className="list">
            {query.data.related?.map((item) => (
              <li key={item.id}><Link to={`/podcasts/${showSlug}/${item.slug}`}>{item.title}</Link></li>
            ))}
          </ul>
          <CommentsSection targetType="podcast-episode" targetId={episode.id} />
        </>
      ) : null}
    </div>
  );
}
