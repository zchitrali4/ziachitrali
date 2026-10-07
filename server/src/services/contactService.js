import { ContactMessage } from '../models.js';
import { ApiError } from '../utils/http.js';

export async function createContactMessage(body) {
  const doc = await ContactMessage.create({
    name: String(body.name || '').trim(),
    email: String(body.email || '').trim().toLowerCase(),
    subject: String(body.subject || '').trim(),
    message: String(body.message || '').trim(),
  });
  return { id: String(doc._id) };
}

export async function listContactMessages() {
  const docs = await ContactMessage.find().sort({ createdAt: -1 }).limit(100).lean();
  return docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    email: doc.email,
    subject: doc.subject || '',
    message: doc.message,
    status: doc.status,
    createdAt: doc.createdAt,
  }));
}

export async function deleteContactMessage(id) {
  const doc = await ContactMessage.findByIdAndDelete(id);
  if (!doc) throw new ApiError(404, 'Message not found.');
  return { deleted: true };
}
