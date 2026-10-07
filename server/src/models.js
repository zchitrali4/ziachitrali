import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { CONTENT_ENUMS } from './config/catalog.js';
import { slugify, wordCount } from './utils/security.js';
import { cleanHtml } from './utils/sanitize.js';

const { Schema, model, models } = mongoose;

const imageSchema = new Schema({
  url: { type: String, default: '' },
  alt: { type: String, default: '' },
  blur: { type: String, default: '' },
}, { _id: false });

const roleSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  permissions: [{ type: String }],
  isSystem: { type: Boolean, default: false },
}, { timestamps: true });

const userSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  status: { type: String, enum: ['active', 'disabled', 'deleted'], default: 'active' },
  emailVerified: { type: Boolean, default: false },
  role: { type: Schema.Types.ObjectId, ref: 'Role', required: true },
  profile: {
    bio: { type: String, default: '', maxlength: 2000 },
    avatarUrl: { type: String, default: '' },
    phone: { type: String, default: '' },
    location: { type: String, default: '' },
  },
  signupCountry: { type: String, default: '', maxlength: 2 },
  settings: {
    theme: { type: String, enum: ['system', 'light', 'dark'], default: 'system' },
    language: { type: String, enum: ['en', 'ur', 'ar'], default: 'en' },
    publicProfile: { type: Boolean, default: false },
    notifications: {
      newsletter: { type: Boolean, default: false },
      comments: { type: Boolean, default: true },
      orders: { type: Boolean, default: true },
      library: { type: Boolean, default: true },
    },
  },
}, { timestamps: true });

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.password);
};

const sessionSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  tokenHash: { type: String, required: true, unique: true },
  familyId: { type: String, required: true, index: true },
  expiresAt: { type: Date, required: true },
  revokedAt: { type: Date, default: null },
  replacedBy: { type: String, default: '' },
  userAgent: { type: String, default: '' },
  ip: { type: String, default: '' },
  rememberMe: { type: Boolean, default: false },
}, { timestamps: true });
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const tokenSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  tokenHash: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });
tokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const authorSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  bio: { type: String, default: '' },
  image: imageSchema,
  roleTitle: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  social: [{
    platform: String,
    url: String,
  }],
  user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

const categorySchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  contentTypes: [{ type: String }],
}, { timestamps: true });

const tagSchema = new Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
}, { timestamps: true });

const contentSchema = new Schema({
  type: { type: String, enum: CONTENT_ENUMS, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 240 },
  slug: { type: String, required: true, trim: true },
  excerpt: { type: String, default: '', maxlength: 500 },
  body: { type: String, default: '' },
  language: { type: String, enum: ['en', 'ur', 'ar'], default: 'en' },
  direction: { type: String, enum: ['ltr', 'rtl'], default: 'ltr' },
  status: { type: String, enum: ['draft', 'published', 'archived'], default: 'draft', index: true },
  featured: { type: Boolean, default: false, index: true },
  breaking: { type: Boolean, default: false },
  coverImage: imageSchema,
  author: { type: Schema.Types.ObjectId, ref: 'Author', default: null },
  category: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
  tags: [{ type: Schema.Types.ObjectId, ref: 'Tag' }],
  publishedAt: { type: Date, default: null, index: true },
  readingTime: { type: Number, default: 1 },
  viewCount: { type: Number, default: 0 },
  likeCount: { type: Number, default: 0 },
  publisher: { type: String, default: '' },
  pages: { type: Number, default: null },
  isbn: { type: String, default: '' },
  priceCents: { type: Number, default: null },
  currency: { type: String, default: 'PKR' },
  videoUrl: { type: String, default: '' },
  duration: { type: Number, default: null },
  productId: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
  seo: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
  translations: { type: Schema.Types.Mixed },
  createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

contentSchema.index({ type: 1, slug: 1 }, { unique: true });
contentSchema.index({ type: 1, status: 1, publishedAt: -1 });
contentSchema.index({ title: 'text', excerpt: 'text', body: 'text' });

contentSchema.pre('validate', function setContentDefaults() {
  if (!this.slug && this.title) this.slug = slugify(this.title);
  this.direction = this.language === 'en' ? 'ltr' : 'rtl';
  this.body = cleanHtml(this.body);
  this.readingTime = Math.max(1, Math.round(wordCount(this.body) / 200) || 1);
  if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
});

const commentSchema = new Schema({
  targetType: { type: String, required: true, index: true },
  targetId: { type: Schema.Types.ObjectId, required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  body: { type: String, required: true, trim: true, maxlength: 4000 },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true },
}, { timestamps: true });
commentSchema.index({ targetType: 1, targetId: 1, status: 1, createdAt: 1 });

const engagementSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
}, { timestamps: true });
engagementSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const readingSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  lastReadAt: { type: Date, default: Date.now },
}, { timestamps: true });
readingSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });

const shareSchema = new Schema({
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  channel: { type: String, default: 'copy' },
  user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

const viewSchema = new Schema({
  targetType: { type: String, required: true },
  targetId: { type: Schema.Types.ObjectId, required: true },
  ipHash: { type: String, required: true },
  expiresAt: { type: Date, required: true },
});
viewSchema.index({ targetType: 1, targetId: 1, ipHash: 1 }, { unique: true });
viewSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const pageSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  body: { type: String, default: '' },
  translations: { type: Schema.Types.Mixed },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  seo: {
    title: { type: String, default: '' },
    description: { type: String, default: '' },
  },
}, { timestamps: true });
pageSchema.pre('validate', function cleanPage() {
  if (!this.slug && this.title) this.slug = slugify(this.title);
  this.body = cleanHtml(this.body);
});

const menuItemSchema = new Schema({
  label: { type: String, required: true },
  url: { type: String, required: true },
  children: [{
    label: { type: String, required: true },
    url: { type: String, required: true },
  }],
}, { _id: false });

const menuSchema = new Schema({
  location: { type: String, enum: ['header', 'footer', 'mobile'], required: true, unique: true },
  items: [menuItemSchema],
}, { timestamps: true });

const settingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  siteName: { type: String, default: 'ضیاء چترالی' },
  tagline: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  footerText: { type: String, default: '' },
  contact: {
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
  },
  social: [{ platform: String, url: String }],
  defaultLanguage: { type: String, enum: ['en', 'ur', 'ar'], default: 'en' },
}, { timestamps: true });

const showSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  coverImage: imageSchema,
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
}, { timestamps: true });

const episodeSchema = new Schema({
  show: { type: Schema.Types.ObjectId, ref: 'PodcastShow', required: true, index: true },
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  audioUrl: { type: String, default: '' },
  coverImage: imageSchema,
  duration: { type: Number, default: null },
  publishedAt: { type: Date, default: null },
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  likeCount: { type: Number, default: 0 },
}, { timestamps: true });
episodeSchema.index({ show: 1, slug: 1 }, { unique: true });

const productSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  description: { type: String, default: '' },
  priceCents: { type: Number, required: true, min: 0 },
  currency: { type: String, default: 'PKR' },
  images: [imageSchema],
  colors: [{ name: { type: String, trim: true }, hex: { type: String, default: '' } }],
  sizes: [{ type: String, trim: true }],
  category: { type: String, default: '' },
  featured: { type: Boolean, default: false },
  translations: { type: Schema.Types.Mixed },
  stock: { type: Number, default: 0, min: 0 },
  sku: { type: String, default: '' },
  status: { type: String, enum: ['draft', 'active', 'archived'], default: 'draft' },
}, { timestamps: true });
productSchema.pre('validate', function productSlug() {
  if (!this.slug && this.title) this.slug = slugify(this.title);
});

const orderSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
  email: { type: String, required: true, lowercase: true, trim: true },
  items: [{
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    title: String,
    slug: String,
    unitPriceCents: Number,
    quantity: Number,
    lineTotalCents: Number,
    color: { type: String, default: '' },
    size: { type: String, default: '' },
  }],
  subtotalCents: { type: Number, required: true },
  discountCents: { type: Number, default: 0 },
  totalCents: { type: Number, required: true },
  currency: { type: String, default: 'PKR' },
  couponCode: { type: String, default: '' },
  customer: {
    name: String,
    email: String,
    phone: String,
    address: String,
  },
  method: { type: String, enum: ['cod', 'payfast'], default: 'payfast' },
  status: { type: String, enum: ['pending_payment', 'paid', 'cancelled'], default: 'pending_payment' },
  payment: {
    provider: { type: String, default: null },
    status: { type: String, default: 'not_configured' },
    basketId: { type: String, default: '' },
    transactionId: { type: String, default: '' },
    errCode: { type: String, default: '' },
    instrument: { type: String, default: '' },
  },
  accessKeyHash: { type: String, required: true },
  notes: { type: String, default: '' },
}, { timestamps: true });

const couponSchema = new Schema({
  code: { type: String, required: true, unique: true, uppercase: true, trim: true },
  type: { type: String, enum: ['percent', 'fixed'], required: true },
  amount: { type: Number, required: true, min: 0 },
  active: { type: Boolean, default: true },
  expiresAt: { type: Date, default: null },
  minSubtotalCents: { type: Number, default: 0 },
}, { timestamps: true });

const campaignSchema = new Schema({
  title: { type: String, required: true, trim: true },
  slug: { type: String, required: true, unique: true, trim: true },
  summary: { type: String, default: '' },
  description: { type: String, default: '' },
  goalAmountCents: { type: Number, default: 0 },
  currency: { type: String, default: 'PKR' },
  active: { type: Boolean, default: true },
  featured: { type: Boolean, default: false },
  coverImage: imageSchema,
}, { timestamps: true });
campaignSchema.pre('validate', function campaignSlug() {
  if (!this.slug && this.title) this.slug = slugify(this.title);
});

const donationSchema = new Schema({
  campaign: { type: Schema.Types.ObjectId, ref: 'DonationCampaign', required: true },
  amountCents: { type: Number, required: true, min: 1 },
  currency: { type: String, default: 'PKR' },
  donorName: { type: String, default: '' },
  donorEmail: { type: String, required: true, lowercase: true, trim: true },
  phone: { type: String, default: '' },
  method: { type: String, enum: ['bank', 'easypaisa', 'jazzcash', 'payfast'], default: 'payfast' },
  proofUrl: { type: String, default: '' },
  reference: { type: String, default: '' },
  message: { type: String, default: '' },
  anonymous: { type: Boolean, default: false },
  user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  status: { type: String, enum: ['pending_payment', 'paid', 'cancelled'], default: 'pending_payment' },
  payment: {
    provider: { type: String, default: null },
    status: { type: String, default: 'not_configured' },
    basketId: { type: String, default: '' },
    transactionId: { type: String, default: '' },
    errCode: { type: String, default: '' },
    instrument: { type: String, default: '' },
  },
}, { timestamps: true });

const subscriberSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  name: { type: String, default: '' },
  status: { type: String, enum: ['active', 'unsubscribed'], default: 'active' },
}, { timestamps: true });

const contactMessageSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, lowercase: true },
  subject: { type: String, default: '', trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['new', 'read'], default: 'new' },
}, { timestamps: true });

const trafficSchema = new Schema({
  day: { type: String, required: true, unique: true },
  count: { type: Number, default: 0 },
});

const mediaSchema = new Schema({
  url: { type: String, required: true },
  alt: { type: String, default: '' },
  type: { type: String, default: 'image' },
  filename: { type: String, default: '' },
  uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
}, { timestamps: true });

function register(name, schema) {
  return models[name] || model(name, schema);
}

export const Role = register('Role', roleSchema);
export const User = register('User', userSchema);
export const Session = register('Session', sessionSchema);
export const PasswordReset = register('PasswordReset', tokenSchema.clone());
export const EmailVerification = register('EmailVerification', tokenSchema.clone());
export const Author = register('Author', authorSchema);
export const Category = register('Category', categorySchema);
export const Tag = register('Tag', tagSchema);
export const Content = register('Content', contentSchema);
export const Comment = register('Comment', commentSchema);
export const Like = register('Like', engagementSchema.clone());
export const Bookmark = register('Bookmark', engagementSchema.clone());
export const ReadingHistory = register('ReadingHistory', readingSchema);
export const ShareEvent = register('ShareEvent', shareSchema);
export const ViewEvent = register('ViewEvent', viewSchema);
export const Page = register('Page', pageSchema);
export const Menu = register('Menu', menuSchema);
export const SiteSetting = register('SiteSetting', settingSchema);
export const PodcastShow = register('PodcastShow', showSchema);
export const PodcastEpisode = register('PodcastEpisode', episodeSchema);
export const Product = register('Product', productSchema);
export const Order = register('Order', orderSchema);
export const Coupon = register('Coupon', couponSchema);
export const DonationCampaign = register('DonationCampaign', campaignSchema);
export const Donation = register('Donation', donationSchema);
export const NewsletterSubscriber = register('NewsletterSubscriber', subscriberSchema);
export const ContactMessage = register('ContactMessage', contactMessageSchema);
export const TrafficDay = register('TrafficDay', trafficSchema);
export const Media = register('Media', mediaSchema);
