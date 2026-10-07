import bcrypt from 'bcryptjs';
import { connectDb } from './config/db.js';
import { ROLE_SEEDS } from './config/catalog.js';
import { env } from './config/env.js';
import { Menu, Role, SiteSetting, User } from './models.js';

const header = [
  { label: 'Articles', url: '/articles' },
  { label: 'Research', url: '/research' },
  { label: 'News', url: '/news' },
  { label: 'Columns', url: '/columns' },
  { label: 'Analysis', url: '/analysis' },
  {
    label: 'Stories',
    url: '/interesting-stories',
    children: [
      { label: 'Interesting Stories', url: '/interesting-stories' },
      { label: 'Inspirational Stories', url: '/inspirational-stories' },
    ],
  },
  { label: 'Videos', url: '/videos' },
  { label: 'Podcasts', url: '/podcasts' },
  { label: 'Books', url: '/books' },
  { label: 'Shop', url: '/shop' },
];

const footer = [
  { label: 'About', url: '/about' },
  { label: 'Contact', url: '/contact' },
  { label: 'Donate', url: '/donate' },
  { label: 'Newsletter', url: '/newsletter' },
  { label: 'Privacy', url: '/privacy' },
  { label: 'Terms', url: '/terms' },
];

await connectDb();

for (const role of ROLE_SEEDS) {
  await Role.updateOne({ slug: role.slug }, role, { upsert: true });
}

const adminRole = await Role.findOne({ slug: 'super_admin' });
const password = env.adminPassword || 'ChangeMe123!';
if (env.nodeEnv === 'production' && (password === 'ChangeMe123!' || password.length < 10)) {
  console.error('Set a strong ADMIN_PASSWORD before seeding production.');
  process.exit(1);
}
const existing = await User.findOne({ email: env.adminEmail.toLowerCase() });
if (!existing) {
  await User.create({
    name: env.adminName,
    email: env.adminEmail.toLowerCase(),
    password: await bcrypt.hash(password, 12),
    emailVerified: true,
    role: adminRole._id,
  });
  console.log(`Created admin ${env.adminEmail}`);
} else {
  console.log(`Admin already exists: ${env.adminEmail}`);
}

await SiteSetting.updateOne(
  { key: 'public' },
  {
    $setOnInsert: {
      key: 'public',
      siteName: 'ضیاء چترالی',
      tagline: 'Islamic educational content and discovery',
      logoUrl: '',
      footerText: 'A library for research, reflection, and public education.',
      contact: { email: '', phone: '', address: '' },
      social: [],
      defaultLanguage: 'en',
    },
  },
  { upsert: true },
);

const menus = [
  { location: 'header', items: header },
  { location: 'footer', items: footer },
  { location: 'mobile', items: header },
];
for (const menu of menus) {
  const found = await Menu.findOne({ location: menu.location });
  if (!found) await Menu.create(menu);
}

console.log('Seed complete.');
console.log(`Sign in at /login with ${env.adminEmail}`);
if (!env.adminPassword) console.log('Password: ChangeMe123!');
process.exit(0);
