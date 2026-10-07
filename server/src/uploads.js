import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { env } from './config/env.js';

const uploadDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  env.nodeEnv === 'production' ? '../../client/dist/uploads' : '../../client/public/uploads',
);

export function saveImageUpload(dataUrl) {
  const match = String(dataUrl || '').match(/^data:image\/(png|jpeg|jpg|webp|gif);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) return { error: 'Use a JPG, PNG, WEBP, or GIF image.' };
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length) return { error: 'The image could not be read.' };
  if (buffer.length > 6 * 1024 * 1024) return { error: 'The image must be under 6 MB.' };
  fs.mkdirSync(uploadDir, { recursive: true });
  const filename = `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  fs.writeFileSync(path.join(uploadDir, filename), buffer);
  return { url: `/uploads/${filename}`, filename };
}
