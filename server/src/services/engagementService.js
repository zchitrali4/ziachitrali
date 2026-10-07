import { CONTENT_TYPES, contentEnum, resolveContentKey } from '../config/catalog.js';
import { ApiError, getPaging, pageMeta } from '../utils/http.js';
import { hashIp } from '../utils/security.js';
import {
  Bookmark, Comment, Content, Like, PodcastEpisode, ReadingHistory, ShareEvent, User, ViewEvent,
} from '../models.js';
import { presentComment, presentContentCard, presentEpisode } from '../presenters.js';
import { engagementState } from './contentService.js';

const TARGETS = new Set([...Object.keys(CONTENT_TYPES), 'podcast-episode']);

function assertTarget(targetType) {
  if (!TARGETS.has(targetType)) throw new ApiError(400, 'Unknown target type.');
}

async function loadTarget(targetType, targetId) {
  assertTarget(targetType);
  if (targetType === 'podcast-episode') {
    const episode = await PodcastEpisode.findById(targetId);
    if (!episode || episode.status !== 'published') throw new ApiError(404, 'Item not found.');
    return { model: PodcastEpisode, doc: episode, countField: 'likeCount' };
  }
  const enumType = contentEnum(targetType);
  const doc = await Content.findOne({ _id: targetId, type: enumType, status: 'published' });
  if (!doc) throw new ApiError(404, 'Item not found.');
  return { model: Content, doc, countField: 'likeCount' };
}

async function toggle(Model, userId, targetType, targetId, { increment } = {}) {
  const target = await loadTarget(targetType, targetId);
  const existing = await Model.findOne({ user: userId, targetType, targetId });
  if (existing) {
    await existing.deleteOne();
    if (increment) {
      await target.model.updateOne({ _id: target.doc._id, [target.countField]: { $gt: 0 } }, { $inc: { [target.countField]: -1 } });
    }
    const fresh = await target.model.findById(target.doc._id).select(target.countField);
    return { active: false, count: fresh?.[target.countField] || 0 };
  }
  await Model.create({ user: userId, targetType, targetId });
  if (increment) await target.model.updateOne({ _id: target.doc._id }, { $inc: { [target.countField]: 1 } });
  const fresh = await target.model.findById(target.doc._id).select(target.countField);
  return { active: true, count: fresh?.[target.countField] || 0 };
}

export async function toggleLike(userId, body) {
  const result = await toggle(Like, userId, body.targetType, body.targetId, { increment: true });
  return { liked: result.active, likeCount: result.count };
}

export async function toggleBookmark(userId, body) {
  const result = await toggle(Bookmark, userId, body.targetType, body.targetId);
  return { bookmarked: result.active };
}

export async function listBookmarks(userId, query) {
  const { page, limit, skip } = getPaging(query);
  const filter = { user: userId };
  const [rows, total] = await Promise.all([
    Bookmark.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Bookmark.countDocuments(filter),
  ]);
  const data = [];
  for (const row of rows) {
    const item = await hydrateEngagement(row);
    if (item) data.push(item);
  }
  return { data, meta: pageMeta(page, limit, total) };
}

export async function listLikes(userId, query) {
  const { page, limit, skip } = getPaging(query);
  const filter = { user: userId };
  const [rows, total] = await Promise.all([
    Like.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Like.countDocuments(filter),
  ]);
  const data = [];
  for (const row of rows) {
    const item = await hydrateEngagement(row);
    if (item) data.push(item);
  }
  return { data, meta: pageMeta(page, limit, total) };
}

async function hydrateEngagement(row) {
  if (row.targetType === 'podcast-episode') {
    const episode = await PodcastEpisode.findById(row.targetId).populate('show');
    if (!episode) return null;
    const presented = presentEpisode(episode, episode.show);
    return { targetType: row.targetType, item: presented, savedAt: row.createdAt || row.lastReadAt };
  }
  const key = resolveContentKey(row.targetType) || row.targetType;
  const enumType = contentEnum(key);
  const doc = await Content.findById(row.targetId).select('-body').populate(['author', 'category', 'tags']);
  if (!doc || (enumType && doc.type !== enumType)) return null;
  return { targetType: key, item: presentContentCard(doc), savedAt: row.createdAt || row.lastReadAt };
}

export async function recordView({ targetType, targetId, ip }) {
  const target = await loadTarget(targetType, targetId);
  const ipHash = hashIp(ip || 'unknown');
  try {
    await ViewEvent.create({
      targetType,
      targetId,
      ipHash,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    });
  } catch (error) {
    if (error.code === 11000) {
      const fresh = await target.model.findById(target.doc._id).select('viewCount');
      return { viewCount: fresh?.viewCount || target.doc.viewCount || 0, counted: false };
    }
    throw error;
  }
  if (target.model === Content) {
    const fresh = await Content.findByIdAndUpdate(target.doc._id, { $inc: { viewCount: 1 } }, { new: true }).select('viewCount');
    return { viewCount: fresh.viewCount, counted: true };
  }
  return { counted: true };
}

export async function recordShare({ targetType, targetId, channel, userId }) {
  await loadTarget(targetType, targetId);
  await ShareEvent.create({
    targetType,
    targetId,
    channel: channel || 'copy',
    user: userId || null,
  });
  return { recorded: true };
}

export async function upsertReading(userId, entry) {
  await loadTarget(entry.targetType, entry.targetId);
  const progress = Math.max(0, Math.min(100, Number(entry.progress) || 0));
  const doc = await ReadingHistory.findOneAndUpdate(
    { user: userId, targetType: entry.targetType, targetId: entry.targetId },
    { progress, lastReadAt: entry.lastReadAt ? new Date(entry.lastReadAt) : new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  return { id: doc._id.toString(), progress: doc.progress, lastReadAt: doc.lastReadAt };
}

export async function syncReading(userId, entries = []) {
  const saved = [];
  for (const entry of entries.slice(0, 50)) {
    if (!entry?.targetType || !entry?.targetId) continue;
    try {
      saved.push(await upsertReading(userId, entry));
    } catch {
      // Skip entries that no longer exist.
    }
  }
  return saved;
}

export async function listReading(userId, query) {
  const { page, limit, skip } = getPaging(query);
  const filter = { user: userId };
  const [rows, total] = await Promise.all([
    ReadingHistory.find(filter).sort({ lastReadAt: -1 }).skip(skip).limit(limit),
    ReadingHistory.countDocuments(filter),
  ]);
  const data = [];
  for (const row of rows) {
    const item = await hydrateEngagement(row);
    if (item) data.push({ ...item, progress: row.progress, lastReadAt: row.lastReadAt });
  }
  return { data, meta: pageMeta(page, limit, total) };
}

export async function listComments(query, user) {
  const { page, limit, skip } = getPaging(query);
  if (!query.targetType || !query.targetId) throw new ApiError(422, 'A target is required.');
  const filter = { targetType: query.targetType, targetId: query.targetId, status: 'approved' };
  const [items, total] = await Promise.all([
    Comment.find(filter).populate('user', 'name profile.avatarUrl').sort({ createdAt: 1 }).skip(skip).limit(limit),
    Comment.countDocuments(filter),
  ]);
  let mine = [];
  if (user) {
    mine = await Comment.find({
      targetType: query.targetType,
      targetId: query.targetId,
      user: user.id,
      status: 'pending',
    }).populate('user', 'name profile.avatarUrl').sort({ createdAt: 1 });
  }
  return {
    data: [...items, ...mine].map(presentComment),
    meta: pageMeta(page, limit, total),
  };
}

export async function createComment(user, body) {
  const account = await User.findById(user.id);
  if (!account?.emailVerified) {
    throw new ApiError(403, 'Verify your email before commenting.');
  }
  await loadTarget(body.targetType, body.targetId);
  const comment = await Comment.create({
    targetType: body.targetType,
    targetId: body.targetId,
    user: user.id,
    body: String(body.body || '').trim(),
    status: 'pending',
  });
  await comment.populate('user', 'name profile.avatarUrl');
  return presentComment(comment);
}

export async function myEngagement(userId, targetType, targetId) {
  return engagementState(userId, targetType, targetId);
}
