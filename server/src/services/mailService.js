import nodemailer from 'nodemailer';
import { CONTENT_TYPES, resolveContentKey } from '../config/catalog.js';
import { env, isDev } from '../config/env.js';
import { User } from '../models.js';
import { previewStore } from '../previewCatalog.js';

let transport;

function mailer() {
  if (!env.mail.ready) return null;
  if (!transport) {
    transport = nodemailer.createTransport({
      host: env.mail.host,
      port: env.mail.port,
      secure: env.mail.secure,
      auth: { user: env.mail.user, pass: env.mail.pass },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    });
  }
  return transport;
}

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[char]));
}

function plain(value) {
  return String(value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 180);
}

function letter({ heading, paragraphs, link, action = 'Open' }) {
  const body = paragraphs.filter(Boolean).map((paragraph) => `<p style="margin:0 0 16px">${escapeHtml(paragraph)}</p>`).join('');
  const button = link
    ? `<p style="margin:8px 0 20px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#171410;color:#f6f1e7;text-decoration:none;padding:12px 18px">${escapeHtml(action)}</a></p><p style="margin:0 0 16px;font-size:13px;line-height:1.5;color:#5c564c">If the button does not open, copy this address into the browser:<br><a href="${escapeHtml(link)}" style="color:#171410">${escapeHtml(link)}</a></p>`
    : '';
  return `<div style="font-family:Georgia,serif;color:#171410;line-height:1.55;max-width:560px"><h1 style="font-size:22px;font-weight:normal;margin:0 0 18px">${escapeHtml(heading)}</h1>${body}${button}<p style="margin:28px 0 0;font-size:13px;color:#5c564c">Zia Chitrali</p></div>`;
}

export function verificationDelivery(record, url, dev = isDev) {
  const mailStatus = record?.status || 'failed';
  const sent = mailStatus === 'sent';
  return {
    verificationSent: sent,
    mailStatus,
    ...(!sent && dev && url ? { devVerifyUrl: url } : {}),
  };
}

export function mailConfigured() {
  return env.mail.ready;
}

export function devLink(url) {
  return !env.mail.ready && isDev ? url : undefined;
}

export async function sendMail({ to, subject, text, html }) {
  const record = {
    id: `mail-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    to,
    subject,
    text,
    createdAt: new Date().toISOString(),
    status: 'queued',
  };
  const client = mailer();
  if (!client) {
    previewStore.outbox.unshift(record);
    previewStore.outbox.splice(40);
    console.info(`[mail] queued for ${to}: ${subject}`);
    return record;
  }
  try {
    await client.sendMail({
      from: env.mail.from,
      to,
      subject,
      text,
      html,
    });
    record.status = 'sent';
  } catch (error) {
    record.status = 'failed';
    record.error = error.message;
    console.error(`[mail] ${to}: ${error.message}`);
  }
  previewStore.outbox.unshift(record);
  previewStore.outbox.splice(40);
  return record;
}

export function checkMail() {
  const client = mailer();
  if (!client) {
    console.info('[mail] SMTP is not configured.');
    return Promise.resolve(false);
  }
  return client.verify().then(() => {
    console.info('[mail] SMTP connection succeeded.');
    return true;
  }).catch((error) => {
    console.error(`[mail] SMTP connection failed: ${error.message}`);
    return false;
  });
}

export function sendWelcome({ name, email, verifyUrl }) {
  const who = name || 'reader';
  const text = [
    `Hello ${who},`,
    '',
    'Your Zia Chitrali account is ready. You can save pieces, return to the shop, and follow new writing from the desk.',
    '',
    verifyUrl ? `Confirm this email within 24 hours:\n${verifyUrl}` : '',
    verifyUrl ? '\nIf you did not create this account, you can ignore this note.' : '',
  ].filter(Boolean).join('\n');
  return sendMail({
    to: email,
    subject: 'Welcome to Zia Chitrali',
    text,
    html: letter({
      heading: 'Welcome to Zia Chitrali',
      paragraphs: [
        `Hello ${who},`,
        'Your account is ready. You can save pieces, return to the shop, and follow new writing from the desk.',
        verifyUrl ? 'Confirm this email within 24 hours. Commenting stays closed until this address is confirmed.' : '',
        verifyUrl ? 'If you did not create this account, you can ignore this note.' : '',
      ].filter(Boolean),
      link: verifyUrl,
      action: 'Confirm this email',
    }),
  });
}

export function sendPasswordReset({ name, email, resetUrl }) {
  const who = name || 'reader';
  const text = `Hello ${who},\n\nUse this link within one hour to choose a new password:\n${resetUrl}\n\nIf you did not ask for this, you can ignore the note.`;
  return sendMail({
    to: email,
    subject: 'Reset your Zia Chitrali password',
    text,
    html: letter({
      heading: 'Reset your password',
      paragraphs: [
        `Hello ${who},`,
        'Use the link below within one hour to choose a new password. If you did not ask for this, ignore the note.',
      ],
      link: resetUrl,
      action: 'Choose a new password',
    }),
  });
}

export function sendVerification({ name, email, verifyUrl }) {
  const who = name || 'reader';
  const text = `Hello ${who},\n\nConfirm your Zia Chitrali email within 24 hours:\n${verifyUrl}\n\nIf you did not ask for this, you can ignore the note.`;
  return sendMail({
    to: email,
    subject: 'Confirm your Zia Chitrali email',
    text,
    html: letter({
      heading: 'Confirm your email',
      paragraphs: [
        `Hello ${who},`,
        'Use the button below within 24 hours to confirm this address. Commenting stays closed until then.',
        'If you did not ask for this, you can ignore the note.',
      ],
      link: verifyUrl,
      action: 'Confirm this email',
    }),
  });
}

async function recipients() {
  if (!env.dbEnabled) {
    const seen = new Set();
    const rows = [];
    previewStore.users.forEach((user) => {
      const email = String(user.email || '').trim().toLowerCase();
      if (!email || user.status === 'disabled' || user.status === 'deleted') return;
      if (user.settings?.notifications?.library === false) return;
      if (seen.has(email)) return;
      seen.add(email);
      rows.push({ email, name: user.name || '' });
    });
    return rows;
  }
  const users = await User.find({ status: 'active' }).select('name email settings');
  const seen = new Set();
  return users.flatMap((user) => {
    const email = String(user.email || '').trim().toLowerCase();
    if (!email || seen.has(email) || user.settings?.notifications?.library === false) return [];
    seen.add(email);
    return [{ email, name: user.name || '' }];
  });
}

async function announce({ subject, title, note, url }) {
  const people = await recipients();
  await Promise.all(people.map((person) => {
    const who = person.name || 'reader';
    const text = `Hello ${who},\n\n${title}\n\n${note}\n\n${url}`;
    return sendMail({
      to: person.email,
      subject,
      text,
      html: letter({
        heading: title,
        paragraphs: [`Hello ${who},`, note],
        link: url,
        action: 'Read',
      }),
    });
  }));
  return people.length;
}

export function announceContent(item) {
  const key = resolveContentKey(item.type);
  const label = CONTENT_TYPES[key]?.singular || 'Piece';
  const title = item.title || 'New writing';
  const note = plain(item.excerpt) || `${label} is now on the library.`;
  const url = key && item.slug ? `${env.publicSiteUrl}/${key}/${item.slug}` : env.publicSiteUrl;
  return announce({
    subject: `New ${label.toLowerCase()}: ${title}`,
    title,
    note,
    url,
  });
}

function moneyLine(cents, currency = 'PKR') {
  const amount = (Number(cents) || 0) / 100;
  return `${currency} ${amount.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
}

export function sendOrderNote({ name, email, orderId, lines, totalCents, currency, method }) {
  const who = name || 'reader';
  const list = (lines || []).map((line) => `${line.title} × ${line.quantity} — ${moneyLine(line.lineTotalCents, currency)}`).join('\n');
  const url = `${env.publicSiteUrl}/orders/${orderId}`;
  const due = method === 'cod'
    ? 'Pay cash when the parcel arrives. This note is not an online payment receipt.'
    : 'This note is not a payment receipt. The total stays due until PayFast confirms the payment.';
  const text = `Hello ${who},\n\nYour order ${orderId} is recorded. ${due}\n\n${list}\n\nTotal ${moneyLine(totalCents, currency)}\n\n${url}`;
  return sendMail({
    to: email,
    subject: `Order ${orderId} recorded`,
    text,
    html: letter({
      heading: `Order ${orderId}`,
      paragraphs: [
        `Hello ${who},`,
        due,
        list || 'The pieces are on the order page.',
        `Total ${moneyLine(totalCents, currency)}`,
      ],
      link: url,
      action: 'View order',
    }),
  });
}

export function sendGiftNote({ name, email, reference, campaign, amountCents, currency }) {
  const who = name || 'friend';
  const text = `Hello ${who},\n\nGift ${reference} is recorded for ${campaign}. This note is not a receipt of money received. The gift is confirmed only after PayFast verifies the payment.\n\n${moneyLine(amountCents, currency)}`;
  return sendMail({
    to: email,
    subject: `Gift ${reference} recorded`,
    text,
    html: letter({
      heading: `Gift ${reference}`,
      paragraphs: [
        `Hello ${who},`,
        `This gift is recorded for ${campaign}. It is not marked as received until PayFast confirms the payment.`,
        moneyLine(amountCents, currency),
      ],
    }),
  });
}

export function announceProduct(item) {
  const title = item.title || 'New piece';
  const note = plain(item.description || item.excerpt) || 'A new piece is in the shop.';
  const url = item.slug ? `${env.publicSiteUrl}/products/${item.slug}` : `${env.publicSiteUrl}/shop`;
  return announce({
    subject: `New in the shop: ${title}`,
    title,
    note,
    url,
  });
}
