import { getPaging, pageMeta } from '../utils/http.js';
import { escapeRegex } from '../utils/security.js';
import { PodcastEpisode, PodcastShow } from '../models.js';
import { presentEpisode, presentShow } from '../presenters.js';

export async function searchEpisodes(q, page, limit, skip) {
  const rx = new RegExp(escapeRegex(q), 'i');
  const filter = { status: 'published', $or: [{ title: rx }, { description: rx }] };
  const [items, total] = await Promise.all([
    PodcastEpisode.find(filter).populate('show').sort({ publishedAt: -1 }).skip(skip).limit(limit),
    PodcastEpisode.countDocuments(filter),
  ]);
  return {
    data: items.map((episode) => ({
      kind: 'podcast-episode',
      id: episode._id.toString(),
      type: 'podcast-episode',
      title: episode.title,
      slug: episode.slug,
      showSlug: episode.show?.slug || '',
      excerpt: episode.description || '',
      coverImage: episode.coverImage?.url ? episode.coverImage : episode.show?.coverImage || null,
      publishedAt: episode.publishedAt,
      author: null,
      category: null,
    })),
    meta: pageMeta(page, limit, total),
  };
}

export async function listShows(query) {
  const { page, limit, skip } = getPaging(query, 12);
  const filter = { status: 'published' };
  const [items, total] = await Promise.all([
    PodcastShow.find(filter).sort({ title: 1 }).skip(skip).limit(limit),
    PodcastShow.countDocuments(filter),
  ]);
  return { data: items.map((item) => presentShow(item)), meta: pageMeta(page, limit, total) };
}

export async function getShow(slug) {
  const show = await PodcastShow.findOne({ slug, status: 'published' });
  if (!show) {
    const error = new Error('Show not found.');
    error.status = 404;
    error.expose = true;
    throw error;
  }
  const episodes = await PodcastEpisode.find({ show: show._id, status: 'published' }).sort({ publishedAt: -1 });
  return presentShow(show, episodes.map((episode) => presentEpisode(episode, show)));
}

export async function getEpisode(showSlug, episodeSlug) {
  const show = await PodcastShow.findOne({ slug: showSlug, status: 'published' });
  if (!show) {
    const error = new Error('Episode not found.');
    error.status = 404;
    error.expose = true;
    throw error;
  }
  const episode = await PodcastEpisode.findOne({ show: show._id, slug: episodeSlug, status: 'published' });
  if (!episode) {
    const error = new Error('Episode not found.');
    error.status = 404;
    error.expose = true;
    throw error;
  }
  const related = await PodcastEpisode.find({
    show: show._id,
    status: 'published',
    _id: { $ne: episode._id },
  }).sort({ publishedAt: -1 }).limit(4);
  return {
    episode: presentEpisode(episode, show),
    related: related.map((item) => presentEpisode(item, show)),
  };
}
