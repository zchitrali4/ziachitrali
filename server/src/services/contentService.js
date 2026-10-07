import { contentEnum, resolveContentKey } from '../config/catalog.js';
import { ApiError, getPaging, pageMeta } from '../utils/http.js';
import { escapeRegex } from '../utils/security.js';
import { Author, Bookmark, Category, Content, Like, Tag } from '../models.js';
import { presentAuthor, presentCategory, presentContentCard, presentContentDetail, presentNavRef, presentTag } from '../presenters.js';

const CARD_POPULATE = [
  { path: 'author' },
  { path: 'category' },
  { path: 'tags' },
];

const SORTS = {
  newest: { publishedAt: -1, _id: -1 },
  oldest: { publishedAt: 1, _id: 1 },
  popular: { viewCount: -1, publishedAt: -1 },
  title: { title: 1 },
};

function publishedFilter() {
  return { status: 'published' };
}

async function buildFilter(query, { includeDrafts = false, typeKey } = {}) {
  const filter = includeDrafts ? {} : publishedFilter();
  const key = typeKey || (query.type ? resolveContentKey(query.type) : null);
  if (query.type || typeKey) {
    const enumType = contentEnum(key);
    if (!enumType) throw new ApiError(404, 'Unknown content type.');
    filter.type = enumType;
  }
  if (query.featured === 'true') filter.featured = true;
  if (query.featured === 'false') filter.featured = false;
  if (query.breaking === 'true') filter.breaking = true;
  if (query.language) filter.language = query.language;
  if (query.status && includeDrafts) filter.status = query.status;
  if (query.category) {
    const category = await Category.findOne({ slug: query.category });
    if (!category) return { empty: true };
    filter.category = category._id;
  }
  if (query.tag) {
    const tag = await Tag.findOne({ slug: query.tag });
    if (!tag) return { empty: true };
    filter.tags = tag._id;
  }
  if (query.author) {
    const author = await Author.findOne({ slug: query.author });
    if (!author) return { empty: true };
    filter.author = author._id;
  }
  if (query.q) {
    const rx = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ title: rx }, { excerpt: rx }, { body: rx }];
  }
  return { filter };
}

export async function listContent(query, options = {}) {
  const typeKey = options.typeKey || null;
  if (typeKey && !resolveContentKey(typeKey)) throw new ApiError(404, 'Unknown content type.');
  const built = await buildFilter(query, { includeDrafts: options.includeDrafts, typeKey });
  const { page, limit, skip } = getPaging(query, options.limit || 12);
  if (built.empty) return { data: [], meta: pageMeta(page, limit, 0) };
  const filter = built.filter;
  const sort = SORTS[query.sort] || SORTS.newest;
  const [items, total] = await Promise.all([
    Content.find(filter).select('-body').populate(CARD_POPULATE).sort(sort).skip(skip).limit(limit),
    Content.countDocuments(filter),
  ]);
  return { data: items.map(presentContentCard), meta: pageMeta(page, limit, total) };
}

export async function getContent(typeKey, slug, user) {
  const enumType = contentEnum(typeKey);
  if (!enumType) throw new ApiError(404, 'Unknown content type.');
  const doc = await Content.findOne({ type: enumType, slug, ...publishedFilter() }).populate(CARD_POPULATE);
  if (!doc) throw new ApiError(404, 'Content not found.');
  const [prev, next, relatedReady, engagement] = await Promise.all([
    Content.findOne({
      type: enumType,
      ...publishedFilter(),
      publishedAt: { $lt: doc.publishedAt || doc.createdAt },
    }).sort({ publishedAt: -1 }).select('title slug type'),
    Content.findOne({
      type: enumType,
      ...publishedFilter(),
      publishedAt: { $gt: doc.publishedAt || doc.createdAt },
    }).sort({ publishedAt: 1 }).select('title slug type'),
    relatedContent(doc),
    user ? engagementState(user.id, typeKey, doc._id) : { liked: false, bookmarked: false },
  ]);
  return {
    content: presentContentDetail(doc, {
      prev: presentNavRef(prev),
      next: presentNavRef(next),
      engagement,
    }),
    related: relatedReady,
  };
}

async function relatedContent(doc) {
  const or = [];
  if (doc.category) or.push({ category: doc.category._id || doc.category });
  if (doc.tags?.length) or.push({ tags: { $in: doc.tags.map((tag) => tag._id || tag) } });
  let items = [];
  if (or.length) {
    items = await Content.find({
      type: doc.type,
      ...publishedFilter(),
      _id: { $ne: doc._id },
      $or: or,
    }).select('-body').populate(CARD_POPULATE).sort({ publishedAt: -1 }).limit(4);
  }
  if (!items.length) {
    items = await Content.find({
      type: doc.type,
      ...publishedFilter(),
      _id: { $ne: doc._id },
    }).select('-body').populate(CARD_POPULATE).sort({ publishedAt: -1 }).limit(4);
  }
  return items.map(presentContentCard);
}

export async function engagementState(userId, targetType, targetId) {
  const [liked, bookmarked] = await Promise.all([
    Like.exists({ user: userId, targetType, targetId }),
    Bookmark.exists({ user: userId, targetType, targetId }),
  ]);
  return { liked: Boolean(liked), bookmarked: Boolean(bookmarked) };
}

export async function searchContent(query) {
  const q = String(query.q || '').trim();
  const { page, limit, skip } = getPaging(query);
  if (!q) return { data: [], meta: pageMeta(page, limit, 0) };
  if (query.type === 'podcast-episode') {
    const { searchEpisodes } = await import('./discoveryService.js');
    return searchEpisodes(q, page, limit, skip);
  }
  const typeKey = query.type ? resolveContentKey(query.type) : null;
  if (query.type && !typeKey) throw new ApiError(404, 'Unknown content type.');
  const built = await buildFilter({ ...query, q, type: typeKey || undefined });
  if (built.empty) return { data: [], meta: pageMeta(page, limit, 0) };
  const filter = built.filter;
  if (typeKey) {
    const [items, total] = await Promise.all([
      Content.find(filter).select('-body').populate(CARD_POPULATE).sort({ publishedAt: -1 }).skip(skip).limit(limit),
      Content.countDocuments(filter),
    ]);
    return {
      data: items.map((item) => ({ kind: 'content', ...presentContentCard(item) })),
      meta: pageMeta(page, limit, total),
    };
  }
  const cap = 100;
  const { searchEpisodes } = await import('./discoveryService.js');
  const [items, total, episodes] = await Promise.all([
    Content.find(filter).select('-body').populate(CARD_POPULATE).sort({ publishedAt: -1 }).limit(cap),
    Content.countDocuments(filter),
    searchEpisodes(q, 1, cap, 0),
  ]);
  const merged = [
    ...items.map((item) => ({ kind: 'content', ...presentContentCard(item) })),
    ...episodes.data,
  ].sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0));
  const complete = total <= cap && episodes.meta.total <= cap;
  const reportedTotal = complete ? total + episodes.meta.total : merged.length;
  return {
    data: merged.slice(skip, skip + limit),
    meta: pageMeta(page, limit, reportedTotal),
  };
}

export async function listCategories(query) {
  const { page, limit, skip } = getPaging(query, 48);
  if (query.sort === 'popular') {
    const grouped = await Content.aggregate([
      { $match: { status: 'published', category: { $ne: null } } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    const ids = grouped.map((item) => item._id);
    const categories = await Category.find({ _id: { $in: ids } });
    const byId = new Map(categories.map((item) => [String(item._id), item]));
    const data = grouped
      .map((item) => presentCategory(byId.get(String(item._id)), item.count))
      .filter(Boolean);
    const total = await Content.distinct('category', { status: 'published', category: { $ne: null } });
    return { data, meta: pageMeta(page, limit, total.length) };
  }
  const [items, total] = await Promise.all([
    Category.find().sort({ name: 1 }).skip(skip).limit(limit),
    Category.countDocuments(),
  ]);
  return { data: items.map((item) => presentCategory(item)), meta: pageMeta(page, limit, total) };
}

export async function getCategory(slug) {
  const category = await Category.findOne({ slug });
  if (!category) throw new ApiError(404, 'Category not found.');
  const [children, related] = await Promise.all([
    Category.find({ parent: category._id }).sort({ name: 1 }).limit(12),
    Category.find({ _id: { $ne: category._id }, parent: category.parent || null }).sort({ name: 1 }).limit(6),
  ]);
  return {
    ...presentCategory(category),
    children: children.map((item) => presentCategory(item)),
    related: related.map((item) => presentCategory(item)),
  };
}

export async function listTags(query) {
  const { page, limit, skip } = getPaging(query, 60);
  if (query.sort === 'popular') {
    const grouped = await Content.aggregate([
      { $match: { status: 'published', tags: { $exists: true, $ne: [] } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $skip: skip },
      { $limit: limit },
    ]);
    const tags = await Tag.find({ _id: { $in: grouped.map((item) => item._id) } });
    const byId = new Map(tags.map((item) => [String(item._id), item]));
    const totalAgg = await Content.aggregate([
      { $match: { status: 'published' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags' } },
      { $count: 'total' },
    ]);
    return {
      data: grouped.map((item) => presentTag(byId.get(String(item._id)), item.count)).filter(Boolean),
      meta: pageMeta(page, limit, totalAgg[0]?.total || 0),
    };
  }
  const [items, total] = await Promise.all([
    Tag.find().sort({ name: 1 }).skip(skip).limit(limit),
    Tag.countDocuments(),
  ]);
  return { data: items.map((item) => presentTag(item)), meta: pageMeta(page, limit, total) };
}

export async function getTag(slug) {
  const tag = await Tag.findOne({ slug });
  if (!tag) throw new ApiError(404, 'Tag not found.');
  return presentTag(tag);
}

export async function listAuthors(query) {
  const { page, limit, skip } = getPaging(query, 12);
  const filter = {};
  if (query.featured === 'true') filter.featured = true;
  const [items, total] = await Promise.all([
    Author.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Author.countDocuments(filter),
  ]);
  return { data: items.map((item) => presentAuthor(item)), meta: pageMeta(page, limit, total) };
}

export async function getAuthor(slug) {
  const author = await Author.findOne({ slug });
  if (!author) throw new ApiError(404, 'Author not found.');
  return presentAuthor(author);
}
