import { ApiError, getPaging, pageMeta } from '../utils/http.js';
import {
  Donation, DonationCampaign, Menu, NewsletterSubscriber, Page, SiteSetting,
} from '../models.js';
import { presentCampaign, presentMenu, presentPage, presentSettings } from '../presenters.js';
import { sendGiftNote } from './mailService.js';
import { freshPayment, nextBasket, normalizeMobile, payfastReady } from './payfast.js';

export async function publicSettings() {
  const settings = await SiteSetting.findOne({ key: 'public' });
  return presentSettings(settings);
}

export async function getMenu(location) {
  if (!['header', 'footer', 'mobile'].includes(location)) throw new ApiError(404, 'Menu not found.');
  const menu = await Menu.findOne({ location });
  if (!menu) return { location, items: [] };
  return presentMenu(menu);
}

export async function getPublishedPage(slug) {
  const page = await Page.findOne({ slug, status: 'published' });
  if (!page) throw new ApiError(404, 'Page not found.');
  return presentPage(page);
}

async function raisedFor(campaignId) {
  const [row] = await Donation.aggregate([
    { $match: { campaign: campaignId, status: 'paid' } },
    { $group: { _id: null, total: { $sum: '$amountCents' } } },
  ]);
  return row?.total || 0;
}

export async function listCampaigns(query) {
  const { page, limit, skip } = getPaging(query, 12);
  const filter = { active: true };
  if (query.featured === 'true') filter.featured = true;
  const [items, total] = await Promise.all([
    DonationCampaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    DonationCampaign.countDocuments(filter),
  ]);
  const data = [];
  for (const item of items) {
    data.push(presentCampaign(item, await raisedFor(item._id)));
  }
  return { data, meta: pageMeta(page, limit, total) };
}

export async function getCampaign(slug) {
  const campaign = await DonationCampaign.findOne({ slug, active: true });
  if (!campaign) throw new ApiError(404, 'Campaign not found.');
  return presentCampaign(campaign, await raisedFor(campaign._id));
}

export async function createDonation({ campaignId, amountCents, donorName, donorEmail, phone, message, anonymous, user }) {
  const campaign = await DonationCampaign.findOne({ _id: campaignId, active: true });
  if (!campaign) throw new ApiError(404, 'Campaign not found.');
  const amount = Number(amountCents);
  if (!Number.isInteger(amount) || amount < 100) {
    throw new ApiError(422, 'Enter a valid amount.', [{ field: 'amount', message: 'Minimum amount is 1.00.' }]);
  }
  const mobile = normalizeMobile(phone);
  if (!mobile) {
    throw new ApiError(422, 'Enter a Pakistani mobile number like 03XXXXXXXXX.', [{ field: 'phone', message: 'Enter a Pakistani mobile number like 03XXXXXXXXX.' }]);
  }
  if (!String(donorName || '').trim()) {
    throw new ApiError(422, 'Enter your name.', [{ field: 'donorName', message: 'Enter your name.' }]);
  }
  const reference = nextBasket('g');
  const donation = await Donation.create({
    campaign: campaign._id,
    amountCents: amount,
    currency: campaign.currency,
    donorName: anonymous ? '' : String(donorName).trim(),
    donorEmail,
    phone: mobile,
    method: 'payfast',
    reference,
    message: message || '',
    anonymous: Boolean(anonymous),
    user: user?.id || null,
    status: 'pending_payment',
    payment: freshPayment(reference),
  });
  try {
    await sendGiftNote({
      name: anonymous ? '' : donorName,
      email: donorEmail,
      reference,
      campaign: campaign.title,
      amountCents: amount,
      currency: campaign.currency,
    });
  } catch (error) {
    console.error('[mail]', error.message);
  }
  return {
    id: donation._id.toString(),
    reference,
    status: donation.status,
    payment: donation.payment,
    amountCents: donation.amountCents,
    currency: donation.currency,
    method: 'payfast',
    campaign: { id: campaign._id.toString(), title: campaign.title, slug: campaign.slug },
    payfastReady: payfastReady(),
  };
}

export async function subscribeNewsletter({ email, name }) {
  const normalized = String(email || '').toLowerCase().trim();
  const existing = await NewsletterSubscriber.findOne({ email: normalized });
  if (existing?.status === 'active') {
    throw new ApiError(409, 'This email is already subscribed.', [
      { field: 'email', message: 'This email is already subscribed.' },
    ]);
  }
  if (existing) {
    existing.status = 'active';
    existing.name = name || existing.name;
    await existing.save();
    return { email: existing.email, status: existing.status };
  }
  const created = await NewsletterSubscriber.create({ email: normalized, name: name || '', status: 'active' });
  return { email: created.email, status: created.status };
}
