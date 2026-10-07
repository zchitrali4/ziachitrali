import mongoose from 'mongoose';
import { connectDb } from '../src/config/db.js';
import { DonationCampaign } from '../src/models.js';

await connectDb();
const existing = await DonationCampaign.countDocuments();
if (!existing) {
  await DonationCampaign.create([
    {
      title: 'Reading room',
      slug: 'reading-room',
      summary: 'Keep the shelves, the desk, and the work of publishing open.',
      description: 'Gifts keep the reading room open.',
      goalAmountCents: 500000000,
      currency: 'PKR',
      active: true,
      featured: true,
    },
    {
      title: 'Books',
      slug: 'books',
      summary: 'Books for students who cannot buy them.',
      description: 'A gift here buys books for readers.',
      goalAmountCents: 200000000,
      currency: 'PKR',
      active: true,
      featured: false,
    },
    {
      title: 'Research',
      slug: 'research',
      summary: 'Support long research and the sources beside it.',
      description: 'Research gifts pay for time and sources.',
      goalAmountCents: 300000000,
      currency: 'PKR',
      active: true,
      featured: false,
    },
  ]);
}
const rows = await DonationCampaign.find({ active: true }).select('slug');
console.log(rows.map((row) => row.slug).join(','));
await mongoose.disconnect();
