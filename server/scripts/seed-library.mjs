import mongoose from 'mongoose';
import { contentEnum } from '../src/config/catalog.js';
import { connectDb } from '../src/config/db.js';
import { previewStore } from '../src/previewCatalog.js';
import {
  Author,
  Category,
  Content,
  DonationCampaign,
  Page,
  PodcastEpisode,
  PodcastShow,
  Product,
  Tag,
} from '../src/models.js';

function image(value) {
  if (!value?.url) return undefined;
  const match = String(value.url).match(/photo-[\w-]+/);
  return {
    url: match ? `https://images.unsplash.com/${match[0]}?auto=format&fit=crop&w=1400&q=70` : value.url,
    alt: value.alt || '',
  };
}

function images(list) {
  return (list || []).map(image).filter(Boolean);
}

await connectDb();

const authorIds = new Map();
for (const author of previewStore.authors) {
  const doc = await Author.findOneAndUpdate(
    { slug: author.slug },
    {
      name: author.name,
      slug: author.slug,
      bio: author.bio || '',
      image: image(author.image),
      roleTitle: author.roleTitle || '',
      featured: Boolean(author.featured),
      social: author.social || [],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  authorIds.set(author.id, doc._id);
}

const categoryIds = new Map();
for (const category of previewStore.categories) {
  const doc = await Category.findOneAndUpdate(
    { slug: category.slug },
    {
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      contentTypes: category.contentTypes || [],
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  categoryIds.set(category.id, doc._id);
}

const tagIds = new Map();
for (const tag of previewStore.tags) {
  const doc = await Tag.findOneAndUpdate(
    { slug: tag.slug },
    { name: tag.name, slug: tag.slug },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  tagIds.set(tag.id, doc._id);
}

let pieces = 0;
await Content.deleteMany({ type: { $nin: ['article', 'research', 'news', 'book', 'column', 'analysis', 'interesting_story', 'inspirational_story', 'video'] } });
for (const item of previewStore.content) {
  const enumType = contentEnum(item.type);
  if (!enumType) continue;
  const authorKey = item.author?.id || item.authorId;
  const categoryKey = item.category?.id || item.categoryId;
  const tagKeys = (item.tags || []).map((tag) => tag.id).filter(Boolean);
  await Content.updateOne(
    { type: enumType, slug: item.slug },
    {
      $set: {
        type: enumType,
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt || '',
        body: item.body || '',
        language: item.language || 'en',
        status: item.status || 'published',
        featured: Boolean(item.featured),
        breaking: Boolean(item.breaking),
        coverImage: image(item.coverImage),
        author: authorIds.get(authorKey) || null,
        category: categoryIds.get(categoryKey) || null,
        tags: tagKeys.map((id) => tagIds.get(id)).filter(Boolean),
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : new Date(),
        viewCount: item.viewCount || 0,
        likeCount: item.likeCount || 0,
        publisher: item.publisher || '',
        pages: item.pages ?? null,
        isbn: item.isbn || '',
        priceCents: item.priceCents ?? null,
        currency: item.currency || 'PKR',
        videoUrl: item.videoUrl || '',
        duration: item.duration ?? null,
      },
    },
    { upsert: true },
  );
  pieces += 1;
}

let goods = 0;
for (const product of previewStore.products) {
  await Product.updateOne(
    { slug: product.slug },
    {
      $set: {
        title: product.title,
        slug: product.slug,
        description: product.description || '',
        priceCents: product.priceCents,
        currency: product.currency || 'PKR',
        images: images(product.images),
        colors: product.colors || [],
        sizes: product.sizes || [],
        category: product.category || '',
        featured: Boolean(product.featured),
        stock: product.stock || 0,
        sku: product.sku || '',
        status: product.status || 'active',
      },
    },
    { upsert: true },
  );
  goods += 1;
}

const showIds = new Map();
for (const show of previewStore.shows) {
  const doc = await PodcastShow.findOneAndUpdate(
    { slug: show.slug },
    {
      title: show.title,
      slug: show.slug,
      description: show.description || '',
      coverImage: image(show.coverImage),
      status: show.status || 'published',
    },
    { upsert: true, new: true, setDefaultsOnInsert: true },
  );
  showIds.set(show.id, doc._id);
}

let episodeCount = 0;
for (const episode of previewStore.episodes || []) {
  const show = showIds.get(episode.show);
  if (!show) continue;
  await PodcastEpisode.updateOne(
    { show, slug: episode.slug },
    {
      $set: {
        show,
        title: episode.title,
        slug: episode.slug,
        description: episode.description || '',
        audioUrl: episode.audioUrl || '',
        coverImage: image(episode.coverImage),
        duration: episode.duration ?? null,
        publishedAt: episode.publishedAt ? new Date(episode.publishedAt) : new Date(),
        status: episode.status || 'published',
        likeCount: episode.likeCount || 0,
      },
    },
    { upsert: true },
  );
  episodeCount += 1;
}

let causes = 0;
for (const campaign of previewStore.campaigns || []) {
  await DonationCampaign.updateOne(
    { slug: campaign.slug },
    {
      $set: {
        title: campaign.title,
        slug: campaign.slug,
        summary: campaign.summary || '',
        description: campaign.description || '',
        goalAmountCents: campaign.goalAmountCents || 0,
        currency: campaign.currency || 'PKR',
        active: campaign.active !== false,
        featured: Boolean(campaign.featured),
        coverImage: image(campaign.coverImage),
      },
    },
    { upsert: true },
  );
  causes += 1;
}

let pages = 0;
for (const page of Object.values(previewStore.pages || {})) {
  await Page.updateOne(
    { slug: page.slug },
    {
      $set: {
        title: page.title,
        slug: page.slug,
        body: page.body || '',
        status: page.status || 'published',
        seo: page.seo || {},
      },
    },
    { upsert: true },
  );
  pages += 1;
}

const totals = {
  pieces,
  authors: authorIds.size,
  categories: categoryIds.size,
  tags: tagIds.size,
  goods,
  shows: showIds.size,
  episodes: episodeCount,
  causes,
  pages,
  stored: await Content.countDocuments({ status: 'published' }),
};
console.log(JSON.stringify(totals));
await mongoose.disconnect();
