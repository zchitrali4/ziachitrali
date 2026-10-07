import mongoose from 'mongoose';
import { TrafficDay } from '../models.js';
import { hashIp } from '../utils/security.js';

const seen = new Map();
const memory = new Map();
const DAY_MS = 24 * 60 * 60 * 1000;

function dayKey(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Karachi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

function dayList(days) {
  const list = [];
  const start = new Date();
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const date = new Date(start.getTime() - offset * DAY_MS);
    list.push(dayKey(date));
  }
  return list;
}

function remember(key) {
  const now = Date.now();
  if (seen.has(key) && now - seen.get(key) < DAY_MS) return false;
  seen.set(key, now);
  if (seen.size > 8000) {
    for (const [item, at] of seen) {
      if (now - at > DAY_MS) seen.delete(item);
    }
  }
  return true;
}

export async function recordPageView({ path, ip }) {
  const clean = String(path || '').split('?')[0].split('#')[0];
  if (!clean.startsWith('/') || clean.startsWith('//') || clean.length > 180) return { counted: false };
  if (/^\/(admin|account|api)(\/|$)/.test(clean)) return { counted: false };
  const day = dayKey();
  if (!remember(`${hashIp(ip || 'unknown')}:${day}`)) return { counted: false };
  if (mongoose.connection.readyState === 1) {
    await TrafficDay.updateOne({ day }, { $inc: { count: 1 } }, { upsert: true });
  } else {
    memory.set(day, (memory.get(day) || 0) + 1);
  }
  return { counted: true };
}

export async function trafficSeries(days = 14) {
  const dates = dayList(days);
  if (mongoose.connection.readyState !== 1) {
    return dates.map((day) => ({ day, count: memory.get(day) || 0 }));
  }
  const rows = await TrafficDay.find({ day: { $in: dates } }).select('day count').lean();
  const counts = new Map(rows.map((row) => [row.day, row.count || 0]));
  return dates.map((day) => ({ day, count: counts.get(day) || 0 }));
}
