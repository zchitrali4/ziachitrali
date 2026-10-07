import { localizePreview } from './previewLocale.js';
import { userIdFromToken } from './previewSession.js';
import { freshPayment, nextBasket, normalizeMobile, payfastReady } from './services/payfast.js';

const photo = (id, alt) => ({
  url: `/preview/${id}.jpg`,
  alt,
});

const authors = [
  { id: 'a1', name: 'Maryam Hasan', slug: 'maryam-hasan', roleTitle: 'Editor', bio: 'Maryam edits the long reads and writes on faith in public life.', image: photo('photo-1544005313-94ddf0286df2', 'Portrait of Maryam Hasan'), featured: false, social: [] },
  { id: 'a2', name: 'Yusuf Rahman', slug: 'yusuf-rahman', roleTitle: 'Research fellow', bio: 'Yusuf studies Islamic intellectual history and modern ethics.', image: photo('photo-1500648767791-00dcc994a43e', 'Portrait of Yusuf Rahman'), featured: false, social: [] },
  { id: 'a3', name: 'Leila Karim', slug: 'leila-karim', roleTitle: 'Columnist', bio: 'Leila writes the weekly column on books, cities, and memory.', image: photo('photo-1438761681033-6461ffad8d80', 'Portrait of Leila Karim'), featured: false, social: [] },
  { id: 'a4', name: 'Omar Farooq', slug: 'omar-farooq', roleTitle: 'Correspondent', bio: 'Omar reports on education, community, and culture.', image: photo('photo-1472099645785-5658abf4ff4e', 'Portrait of Omar Farooq'), featured: false, social: [] },
  { id: 'a5', name: 'Zia Chitrali', slug: 'zia-chitrali', roleTitle: '', bio: '', image: { url: '/authors/zia-chitrali.png', alt: 'Zia Chitrali' }, featured: true, social: [] },
];

const categories = [
  { id: 'c1', name: 'Faith', slug: 'faith', description: 'Practice, belief, and the inner life.', contentTypes: ['articles', 'columns'], count: 4 },
  { id: 'c2', name: 'Ideas', slug: 'ideas', description: 'Essays and arguments for a thoughtful public.', contentTypes: ['articles', 'analysis'], count: 4 },
  { id: 'c3', name: 'History', slug: 'history', description: 'Lives, places, and the long record.', contentTypes: ['research', 'articles'], count: 3 },
  { id: 'c4', name: 'Society', slug: 'society', description: 'How communities learn, gather, and change.', contentTypes: ['news', 'analysis'], count: 4 },
  { id: 'c5', name: 'Books', slug: 'books', description: 'Reading notes and new titles.', contentTypes: ['books', 'columns'], count: 4 },
  { id: 'c6', name: 'Learning', slug: 'learning', description: 'Study, classrooms, and scholarship.', contentTypes: ['research', 'videos'], count: 3 },
];

const tags = [
  { id: 't1', name: 'Quran', slug: 'quran', count: 3 },
  { id: 't2', name: 'Ethics', slug: 'ethics', count: 4 },
  { id: 't3', name: 'Education', slug: 'education', count: 3 },
  { id: 't4', name: 'History', slug: 'history', count: 3 },
  { id: 't5', name: 'Community', slug: 'community', count: 2 },
  { id: 't6', name: 'Books', slug: 'books', count: 3 },
  { id: 't7', name: 'Youth', slug: 'youth', count: 2 },
  { id: 't8', name: 'Culture', slug: 'culture', count: 2 },
];

const byId = (list, id) => list.find((item) => item.id === id);
const tagSet = (...ids) => ids.map((id) => byId(tags, id));

const body = (lead) => `
  <p>${lead}</p>
  <p>This is sample editorial copy so the reading page can be reviewed before the library is connected. The argument is paced the way a magazine piece should be: a clear opening, a middle that slows down, and a close that leaves the reader with one idea.</p>
  <h2>What the tradition actually says</h2>
  <p>Serious writing does not rush the source. It names the question, sits with the text, and refuses a slogan where a paragraph is needed. Readers come here to think, not to be shouted at.</p>
  <p>A good essay keeps its evidence in view. Dates, names, and books stay attached to the claim they support. Nothing in this preview is a finished work of scholarship. It is a layout filled with honest placeholder prose.</p>
  <h2>Why the form matters</h2>
  <p>The page is built like a journal: a large title, a short standfirst, then a column of type that is comfortable for a long read. Images sit in a fixed frame so a missing file cannot break the line.</p>
  <h3>A note for editors</h3>
  <p>When MongoDB is connected, published records replace this sample. The same templates will carry real articles, research, news, and books without a redesign.</p>
`;

function piece(partial) {
  return {
    language: 'en',
    direction: 'ltr',
    readingTime: 7,
    viewCount: 1280,
    likeCount: 46,
    featured: false,
    breaking: false,
    publisher: '',
    pages: null,
    isbn: '',
    priceCents: null,
    currency: 'PKR',
    duration: null,
    status: 'published',
    publishedAt: partial.publishedAt,
    ...partial,
    author: byId(authors, partial.authorId),
    category: byId(categories, partial.categoryId),
    tags: tagSet(...(partial.tagIds || [])),
    body: body(partial.excerpt),
  };
}

const content = [
  piece({
    id: 'p1', type: 'articles', slug: 'a-library-for-quiet-minds', title: 'A library for quiet minds',
    excerpt: 'Zia Chitrali is being built as a reading room: fewer slogans, longer attention, and work that can be returned to.',
    coverImage: photo('photo-1481627834876-b7833e8f5570', 'A quiet library'),
    authorId: 'a1', categoryId: 'c2', tagIds: ['t2', 't6'], featured: true,
    publishedAt: '2026-09-28T08:00:00.000Z', viewCount: 4820,
  }),
  piece({
    id: 'p2', type: 'articles', slug: 'reading-the-quran-slowly', title: 'Reading the Quran slowly',
    excerpt: 'Speed is a poor measure of understanding. A slower reading leaves room for the verse to answer back.',
    coverImage: photo('photo-1542816417-0983c9c9ad53', 'An open Quran'),
    authorId: 'a2', categoryId: 'c1', tagIds: ['t1', 't2'], featured: true,
    publishedAt: '2026-09-22T08:00:00.000Z',
  }),
  piece({
    id: 'p3', type: 'articles', slug: 'cities-that-still-teach', title: 'Cities that still teach',
    excerpt: 'From courtyard schools to late libraries, the city has always been part of how Muslims learned.',
    coverImage: photo('photo-1548013146-72479768bada', 'A historic courtyard'),
    authorId: 'a3', categoryId: 'c3', tagIds: ['t4', 't8'], featured: true,
    publishedAt: '2026-09-18T08:00:00.000Z',
  }),
  piece({
    id: 'p4', type: 'articles', slug: 'the-ethics-of-attention', title: 'The ethics of attention',
    excerpt: 'What we look at is a moral choice. A platform should help people stay with an idea.',
    coverImage: photo('photo-1507842217343-583bb7270b66', 'A person studying by a window'),
    authorId: 'a1', categoryId: 'c2', tagIds: ['t2', 't3'], featured: true,
    publishedAt: '2026-09-12T08:00:00.000Z',
  }),
  piece({
    id: 'r1', type: 'research', slug: 'notes-on-early-tafsir', title: 'Notes toward a public tafsir',
    excerpt: 'A research sketch on how early commentary can be introduced without flattening it.',
    coverImage: photo('photo-1524995997946-a1c2e315a42f', 'Stacked scholarly books'),
    authorId: 'a2', categoryId: 'c6', tagIds: ['t1', 't4'], featured: true,
    publishedAt: '2026-09-20T08:00:00.000Z', readingTime: 14,
  }),
  piece({
    id: 'r2', type: 'research', slug: 'classrooms-after-the-pandemic', title: 'Classrooms after the long interruption',
    excerpt: 'What teachers in three cities changed, and what they refused to give up.',
    coverImage: photo('photo-1503676260728-1c00da094a0b', 'Students in a classroom'),
    authorId: 'a4', categoryId: 'c6', tagIds: ['t3', 't5'], featured: true,
    publishedAt: '2026-09-08T08:00:00.000Z', readingTime: 11,
  }),
  piece({
    id: 'r3', type: 'research', slug: 'manuscript-margins', title: 'What the margins remember',
    excerpt: 'Notes left by readers in old manuscripts are a history of use, not only of authorship.',
    coverImage: photo('photo-1524995997946-a1c2e315a42f', 'Old books on a table'),
    authorId: 'a2', categoryId: 'c3', tagIds: ['t4', 't6'], featured: true,
    publishedAt: '2026-08-30T08:00:00.000Z', readingTime: 12,
  }),
  piece({
    id: 'n1', type: 'news', slug: 'evening-lecture-series', title: 'Evening lecture series opens in Lahore',
    excerpt: 'Four public lectures this month will cover ethics, history, and how to read with care.',
    coverImage: photo('photo-1524178232363-1fb2b075b655', 'A lecture hall'),
    authorId: 'a4', categoryId: 'c4', tagIds: ['t3', 't5'], breaking: true,
    publishedAt: '2026-10-02T06:00:00.000Z', readingTime: 3,
  }),
  piece({
    id: 'n2', type: 'news', slug: 'library-hours-extended', title: 'Reading room hours extended on Fridays',
    excerpt: 'The room will stay open later so students can finish the weekly seminar readings.',
    coverImage: photo('photo-1507842217343-583bb7270b66', 'Library shelves'),
    authorId: 'a4', categoryId: 'c4', tagIds: ['t3'], breaking: true,
    publishedAt: '2026-10-01T06:00:00.000Z', readingTime: 2,
  }),
  piece({
    id: 'n3', type: 'news', slug: 'new-research-fellows', title: 'Three research fellows join the desk',
    excerpt: 'Their first notes will appear in the research section over the coming weeks.',
    coverImage: photo('photo-1524995997946-a1c2e315a42f', 'Books for research'),
    authorId: 'a1', categoryId: 'c6', tagIds: ['t3'], breaking: true,
    publishedAt: '2026-09-29T06:00:00.000Z', readingTime: 3,
  }),
  piece({
    id: 'n4', type: 'news', slug: 'youth-reading-circle', title: 'Youth reading circle starts Sunday',
    excerpt: 'A small circle for first-time readers of longer essays. No prior seminar is required.',
    coverImage: photo('photo-1507842217343-583bb7270b66', 'Young readers'),
    authorId: 'a3', categoryId: 'c4', tagIds: ['t7', 't5'],
    publishedAt: '2026-09-26T06:00:00.000Z', readingTime: 2,
  }),
  piece({
    id: 'n5', type: 'news', slug: 'archive-digitisation', title: 'A small archive begins digitisation',
    excerpt: 'Letters and teaching notes will be catalogued before any of them are published.',
    coverImage: photo('photo-1524995997946-a1c2e315a42f', 'Archive boxes and books'),
    authorId: 'a2', categoryId: 'c3', tagIds: ['t4'],
    publishedAt: '2026-09-21T06:00:00.000Z', readingTime: 3,
  }),
  piece({
    id: 'col1', type: 'columns', slug: 'letter-from-the-desk', title: 'Letter from the desk',
    excerpt: 'We would rather publish less, and mean it. This column is a promise about pace.',
    coverImage: photo('photo-1455390582262-044cdead277a', 'A writing desk'),
    authorId: 'a3', categoryId: 'c2', tagIds: ['t2'],
    publishedAt: '2026-09-27T08:00:00.000Z', readingTime: 5,
  }),
  piece({
    id: 'col2', type: 'columns', slug: 'on-keeping-a-notebook', title: 'On keeping a notebook',
    excerpt: 'A notebook is not a performance. It is where a thought is allowed to be unfinished.',
    coverImage: photo('photo-1516414447565-b14be0adf13e', 'An open notebook'),
    authorId: 'a3', categoryId: 'c5', tagIds: ['t6'],
    publishedAt: '2026-09-14T08:00:00.000Z', readingTime: 5,
  }),
  piece({
    id: 'col3', type: 'columns', slug: 'friday-light', title: 'The light on a Friday afternoon',
    excerpt: 'Some hours are for news. This one is for noticing what the week tried to hurry past.',
    coverImage: photo('photo-1469474968028-56623f02e42e', 'Afternoon light over a valley'),
    authorId: 'a1', categoryId: 'c1', tagIds: ['t8'],
    publishedAt: '2026-09-05T08:00:00.000Z', readingTime: 4,
  }),
  piece({
    id: 'an1', type: 'analysis', slug: 'attention-and-the-feed', title: 'The feed is not a curriculum',
    excerpt: 'A stream of posts can inform. It cannot replace a sequence of reading.',
    coverImage: photo('photo-1516321318423-f06f85e504b3', 'A person at a laptop'),
    authorId: 'a1', categoryId: 'c2', tagIds: ['t2', 't3'],
    publishedAt: '2026-09-25T08:00:00.000Z', readingTime: 8,
  }),
  piece({
    id: 'an2', type: 'analysis', slug: 'what-schools-owe-language', title: 'What schools owe a language',
    excerpt: 'Urdu, Arabic, and English do different work. Treating them as rivals weakens all three.',
    coverImage: photo('photo-1507842217343-583bb7270b66', 'Language study'),
    authorId: 'a2', categoryId: 'c6', tagIds: ['t3'],
    publishedAt: '2026-09-11T08:00:00.000Z', readingTime: 9,
  }),
  piece({
    id: 'an3', type: 'analysis', slug: 'charity-without-theatre', title: 'Charity without theatre',
    excerpt: 'A donation page should be clear about money. It should not pretend a gift has already landed.',
    coverImage: photo('photo-1532629345422-7515f3d16bb6', 'Hands sharing a gift'),
    authorId: 'a4', categoryId: 'c4', tagIds: ['t2', 't5'],
    publishedAt: '2026-08-28T08:00:00.000Z', readingTime: 7,
  }),
  piece({
    id: 'is1', type: 'interesting-stories', slug: 'the-librarian-of-the-old-city', title: 'The librarian of the old city',
    excerpt: 'She kept a key on a cotton string and a memory of every borrower who never came back.',
    coverImage: photo('photo-1521587760476-6c12a4b040da', 'An old city library'),
    authorId: 'a3', categoryId: 'c3', tagIds: ['t4', 't8'],
    publishedAt: '2026-09-16T08:00:00.000Z',
  }),
  piece({
    id: 'is2', type: 'interesting-stories', slug: 'a-map-drawn-in-the-margin', title: 'A map drawn in the margin',
    excerpt: 'Someone had sketched a road beside a chapter on travel. The road did not match any atlas.',
    coverImage: photo('photo-1524661135-423995f22d0b', 'An old map'),
    authorId: 'a2', categoryId: 'c3', tagIds: ['t4'],
    publishedAt: '2026-09-02T08:00:00.000Z',
  }),
  piece({
    id: 'is3', type: 'interesting-stories', slug: 'tea-after-the-lesson', title: 'Tea after the lesson',
    excerpt: 'The best questions arrived only once the books were closed and the cups were poured.',
    coverImage: photo('photo-1544787219-7f47ccb76574', 'Tea on a wooden table'),
    authorId: 'a4', categoryId: 'c4', tagIds: ['t5', 't8'],
    publishedAt: '2026-08-20T08:00:00.000Z',
  }),
  piece({
    id: 'in1', type: 'inspirational-stories', slug: 'the-student-who-walked', title: 'The student who walked',
    excerpt: 'He measured the term not in grades, but in the mornings he still chose to begin again.',
    coverImage: photo('photo-1470071459604-3b5ec3a7fe05', 'A road through the hills'),
    authorId: 'a1', categoryId: 'c1', tagIds: ['t7', 't3'],
    publishedAt: '2026-09-19T08:00:00.000Z',
  }),
  piece({
    id: 'in2', type: 'inspirational-stories', slug: 'a-mother-keeps-the-hour', title: 'A mother keeps the hour',
    excerpt: 'Every evening she set aside twenty minutes. The children learned that time could be kept.',
    coverImage: photo('photo-1469474968028-56623f02e42e', 'Quiet evening light'),
    authorId: 'a3', categoryId: 'c1', tagIds: ['t5'],
    publishedAt: '2026-09-06T08:00:00.000Z',
  }),
  piece({
    id: 'in3', type: 'inspirational-stories', slug: 'the-last-lamp-in-the-hall', title: 'The last lamp in the hall',
    excerpt: 'The caretaker left one lamp on for anyone still reading when the city had gone home.',
    coverImage: photo('photo-1507842217343-583bb7270b66', 'A lamp among shelves'),
    authorId: 'a4', categoryId: 'c4', tagIds: ['t8'],
    publishedAt: '2026-08-18T08:00:00.000Z',
  }),
  piece({
    id: 'v1', type: 'videos', slug: 'how-to-begin-a-text', title: 'How to begin a difficult text',
    excerpt: 'A short lesson on the first ten minutes with a book that resists you.',
    coverImage: photo('photo-1516321497487-e288fb19713f', 'A teaching session'),
    authorId: 'a2', categoryId: 'c6', tagIds: ['t3', 't6'], featured: true,
    publishedAt: '2026-09-24T08:00:00.000Z', duration: 754, readingTime: 12,
    videoUrl: '',
  }),
  piece({
    id: 'v2', type: 'videos', slug: 'a-walk-through-the-archive', title: 'A walk through the archive',
    excerpt: 'What a catalogue looks like before it becomes a public collection.',
    coverImage: photo('photo-1521587760476-6c12a4b040da', 'Archive shelves'),
    authorId: 'a1', categoryId: 'c3', tagIds: ['t4'], featured: true,
    publishedAt: '2026-09-09T08:00:00.000Z', duration: 980, readingTime: 16,
    videoUrl: '',
  }),
  piece({
    id: 'b1', type: 'books', slug: 'the-patient-reader', title: 'The Patient Reader',
    excerpt: 'Essays on attention, commentary, and the manners of study.',
    coverImage: photo('photo-1544947950-fa07a98d237f', 'A clothbound book'),
    authorId: 'a2', categoryId: 'c5', tagIds: ['t6', 't2'], featured: true,
    publishedAt: '2026-09-15T08:00:00.000Z', publisher: 'Zia Chitrali', pages: 248, isbn: '978-1-00000-001-1', priceCents: 180000,
  }),
  piece({
    id: 'b2', type: 'books', slug: 'letters-on-learning', title: 'Letters on Learning',
    excerpt: 'A correspondence between a teacher and a student across one academic year.',
    coverImage: photo('photo-1512820790803-83ca734da794', 'Books stacked on a desk'),
    authorId: 'a1', categoryId: 'c5', tagIds: ['t3', 't6'], featured: true,
    publishedAt: '2026-08-22T08:00:00.000Z', publisher: 'Zia Chitrali', pages: 176, isbn: '978-1-00000-002-8', priceCents: 145000,
  }),
  piece({
    id: 'b3', type: 'books', slug: 'courtyard-notes', title: 'Courtyard Notes',
    excerpt: 'Field notes from schools that still teach in the open air.',
    coverImage: photo('photo-1495446815901-a7297e633e8d', 'A row of books'),
    authorId: 'a4', categoryId: 'c6', tagIds: ['t3', 't5'], featured: true,
    publishedAt: '2026-08-02T08:00:00.000Z', publisher: 'City Desk', pages: 210, isbn: '978-1-00000-003-5', priceCents: 160000,
  }),
  piece({
    id: 'b4', type: 'books', slug: 'a-short-history-of-the-margin', title: 'A Short History of the Margin',
    excerpt: 'How readers argued with books by writing beside them.',
    coverImage: photo('photo-1519682337058-a94d519337bc', 'A closed hardcover'),
    authorId: 'a2', categoryId: 'c3', tagIds: ['t4', 't6'], featured: true,
    publishedAt: '2026-07-18T08:00:00.000Z', publisher: 'Zia Chitrali', pages: 192, isbn: '978-1-00000-004-2', priceCents: 155000,
  }),
];

const shows = [
  {
    id: 's1',
    title: 'The Reading Room',
    slug: 'the-reading-room',
    description: 'Conversations about books, study, and the habits that make a week of reading possible.',
    coverImage: photo('photo-1478737270239-2f02b77fc618', 'A studio microphone'),
    status: 'published',
  },
  {
    id: 's2',
    title: 'After the Lesson',
    slug: 'after-the-lesson',
    description: 'Teachers talk about what stayed with students once the class had ended.',
    coverImage: photo('photo-1511671782779-c97d3d27a1d4', 'Headphones on a desk'),
    status: 'published',
  },
];

const episodes = [
  {
    id: 'e1', show: 's1', title: 'Begin with one chapter', slug: 'begin-with-one-chapter',
    description: 'Why a single chapter, read properly, is a better start than a stack of intentions.',
    audioUrl: '', coverImage: null, duration: 1680, publishedAt: '2026-09-27T08:00:00.000Z', status: 'published', likeCount: 12,
  },
  {
    id: 'e2', show: 's1', title: 'Notes you can return to', slug: 'notes-you-can-return-to',
    description: 'A practical talk on notebooks that still make sense a month later.',
    audioUrl: '', coverImage: null, duration: 1920, publishedAt: '2026-09-13T08:00:00.000Z', status: 'published', likeCount: 9,
  },
  {
    id: 'e3', show: 's2', title: 'The question that arrived late', slug: 'the-question-that-arrived-late',
    description: 'A teacher on the student who understood the lesson only on the walk home.',
    audioUrl: '', coverImage: null, duration: 1500, publishedAt: '2026-09-20T08:00:00.000Z', status: 'published', likeCount: 7,
  },
];

const products = [
  {
    id: 'pr1', title: 'Field cap', slug: 'field-cap', category: 'Caps', featured: true,
    description: 'A cotton cap with a short brim and a small woven mark. Made for the walk between the library and the street.',
    priceCents: 180000, currency: 'PKR', stock: 36, sku: 'CAP-001', status: 'active',
    colors: [{ name: 'Ink', hex: '#171410' }, { name: 'Sand', hex: '#c4b49a' }, { name: 'Forest', hex: '#0f6e56' }],
    sizes: ['S', 'M', 'L'],
    images: [
      photo('photo-1588850561407-ed78c282e89b', 'A field cap, front'),
      photo('photo-1521369909029-2afed882baee', 'A field cap, side'),
      photo('photo-1575428652377-a2d80e2277fc', 'A field cap on a table'),
    ],
  },
  {
    id: 'pr2', title: 'Linen shirt', slug: 'linen-shirt', category: 'Shirts', featured: true,
    description: 'An easy linen shirt with a soft collar. It holds a crease and then lets it go.',
    priceCents: 450000, currency: 'PKR', stock: 22, sku: 'SHR-014', status: 'active',
    colors: [{ name: 'Ivory', hex: '#f3efe6' }, { name: 'Ink', hex: '#171410' }, { name: 'Stone', hex: '#8a8175' }],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      photo('photo-1596755094514-f87e34085b2c', 'A linen shirt, worn'),
      photo('photo-1598033129183-c4f50c736f10', 'A linen shirt, hanging'),
      photo('photo-1602810318383-e386cc2a3ccf', 'A folded linen shirt'),
    ],
  },
  {
    id: 'pr3', title: 'Wool scarf', slug: 'wool-scarf', category: 'Scarves', featured: true,
    description: 'A light wool scarf, long enough to wrap once. The edge is finished by hand.',
    priceCents: 320000, currency: 'PKR', stock: 18, sku: 'SCF-006', status: 'active',
    colors: [{ name: 'Camel', hex: '#a57c52' }, { name: 'Ink', hex: '#171410' }, { name: 'Forest', hex: '#0f6e56' }],
    sizes: ['One'],
    images: [
      photo('photo-1520903920243-00d872a2d1c9', 'A wool scarf, worn'),
      photo('photo-1601925260368-ae2f83cf8b7f', 'A wool scarf, folded'),
      photo('photo-1544441893-675973e31985', 'A wool scarf, detail'),
    ],
  },
  {
    id: 'pr4', title: 'Desk tee', slug: 'desk-tee', category: 'Shirts', featured: false,
    description: 'A heavy cotton tee with a quiet neckline. No print on the chest.',
    priceCents: 220000, currency: 'PKR', stock: 48, sku: 'TEE-003', status: 'active',
    colors: [{ name: 'White', hex: '#f7f4ee' }, { name: 'Ink', hex: '#171410' }, { name: 'Sand', hex: '#c4b49a' }],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      photo('photo-1521572163474-6864f9cf17ab', 'A plain cotton tee'),
      photo('photo-1583743814966-8936f5b7be1a', 'A dark cotton tee'),
      photo('photo-1489987707025-afc232f7ea0f', 'A folded cotton tee'),
    ],
  },
  {
    id: 'pr5', title: 'Everyday cap', slug: 'everyday-cap', category: 'Caps', featured: false,
    description: 'A six-panel cap in washed cotton. The brim is short so it sits close.',
    priceCents: 160000, currency: 'PKR', stock: 30, sku: 'CAP-008', status: 'active',
    colors: [{ name: 'Navy', hex: '#1d2a44' }, { name: 'Stone', hex: '#8a8175' }],
    sizes: ['S', 'M', 'L'],
    images: [
      photo('photo-1556306535-0f09a537f0a3', 'An everyday cap'),
      photo('photo-1534215754734-18e55d13e346', 'A cap from the side'),
      photo('photo-1514327605112-b887c0e61c0a', 'A cap on a shelf'),
    ],
  },
  {
    id: 'pr6', title: 'Overshirt', slug: 'overshirt', category: 'Shirts', featured: false,
    description: 'A cotton overshirt to wear open over the desk tee. Two pockets, horn buttons.',
    priceCents: 520000, currency: 'PKR', stock: 14, sku: 'SHR-021', status: 'active',
    colors: [{ name: 'Olive', hex: '#5c6848' }, { name: 'Ink', hex: '#171410' }, { name: 'Sand', hex: '#c4b49a' }],
    sizes: ['S', 'M', 'L', 'XL'],
    images: [
      photo('photo-1594938298603-c8148c4dae35', 'A cotton overshirt'),
      photo('photo-1617137968427-85924c800a22', 'An overshirt, open'),
      photo('photo-1593032465175-481ac7f401a0', 'An overshirt, detail'),
    ],
  },
];

const previewOrders = new Map();

const siteSettings = {
  siteName: 'ضیاء چترالی',
  tagline: 'Islamic educational content and discovery',
  logoUrl: '',
  footerText: 'A library for research, reflection, and public education.',
  contact: { email: 'desk@ieds.local', phone: '', address: 'Reading room, Lahore' },
  social: [],
  defaultLanguage: 'en',
  translations: {
    en: { tagline: 'Islamic educational content and discovery', footerText: 'A library for research, reflection, and public education.' },
    ur: { tagline: '', footerText: '' },
    ar: { tagline: '', footerText: '' },
  },
};

const comments = [
  {
    id: 'cm1', body: 'This piece is worth reading slowly.', status: 'pending',
    user: { name: 'Ayesha Khan' }, targetType: 'content', targetId: 'p1',
    createdAt: '2026-10-01T10:00:00.000Z',
  },
  {
    id: 'cm2', body: 'The opening stays with you.', status: 'approved',
    user: { name: 'Omar Farooq' }, targetType: 'content', targetId: 'p1',
    createdAt: '2026-09-30T10:00:00.000Z',
  },
];

const donations = [
  {
    id: 'dn1', donorName: 'Sara Iqbal', donorEmail: 'sara@example.com', amountCents: 100000,
    currency: 'PKR', status: 'pending_payment', anonymous: false, campaignId: 'd1',
    method: 'bank', reference: 'GSAMPLE', phone: '', proofUrl: '',
    message: 'Sample gift recorded for the desk. It is not marked as paid.',
    createdAt: '2026-10-02T09:00:00.000Z',
  },
];

const coupons = [];
const media = [];
const subscribers = [
  { id: 'sub1', email: 'reader@ieds.local', name: 'Library reader', status: 'active' },
];
const roles = [
  { id: 'role-admin', name: 'Administrator', slug: 'super_admin', description: 'Full access to the desk.', permissions: ['*'] },
  { id: 'role-editor', name: 'Editor', slug: 'editor', description: 'Writes and publishes.', permissions: ['dashboard:view', 'content:read', 'content:write', 'content:delete'] },
];
const users = [
  {
    id: 'u-admin', name: 'Zia Chitrali', email: 'admin@ieds.local', status: 'active',
    role: { id: 'role-admin', name: 'Administrator', slug: 'super_admin' },
  },
];

export const previewStore = {
  content,
  authors,
  categories,
  tags,
  shows,
  episodes,
  products,
  comments,
  donations,
  coupons,
  media,
  subscribers,
  roles,
  users,
  siteSettings,
  orders: previewOrders,
  messages: [],
  outbox: [],
  passwordResets: [],
  emailTokens: [],
};

const LANGS = ['en', 'ur', 'ar'];

export function overlayTranslations(value, lang) {
  if (!value || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => overlayTranslations(item, lang));
  const copy = { ...value };
  const pack = copy.translations?.[lang];
  const filled = pack && Object.values(pack).some((item) => typeof item === 'string' && item.trim());
  if (filled) {
    Object.entries(pack).forEach(([key, text]) => {
      if (typeof text === 'string' && text.trim()) copy[key] = text;
    });
    copy.direction = lang === 'en' ? 'ltr' : 'rtl';
    copy.language = lang;
    if (copy.seo && typeof copy.seo === 'object') {
      copy.seo = {
        ...copy.seo,
        ...(pack.title ? { title: pack.title } : {}),
        ...(pack.excerpt ? { description: pack.excerpt } : {}),
      };
    }
  }
  Object.keys(copy).forEach((key) => {
    if (key === 'translations') return;
    if (copy[key] && typeof copy[key] === 'object') copy[key] = overlayTranslations(copy[key], lang);
  });
  return copy;
}

export function blankTranslations(fields, source = {}, language = 'en') {
  const translations = {};
  LANGS.forEach((lang) => {
    translations[lang] = {};
    fields.forEach((field) => {
      const saved = source.translations?.[lang]?.[field];
      translations[lang][field] = typeof saved === 'string'
        ? saved
        : (lang === (source.language || language) ? (source[field] || '') : '');
    });
  });
  const englishEmpty = fields.every((field) => !String(translations.en[field] || '').trim());
  if (englishEmpty) {
    fields.forEach((field) => {
      if (!translations.en[field]) translations.en[field] = source[field] || '';
    });
  }
  return translations;
}

function previewQuote(body) {
  const items = Array.isArray(body?.items) ? body.items : [];
  if (!items.length) return { status: 422, message: 'Add at least one product.' };
  if (String(body?.couponCode || '').trim()) return { status: 422, message: 'Coupon not found.' };
  const lines = [];
  for (const item of items) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
      return { status: 422, message: 'Quantity must be between 1 and 20.' };
    }
    const product = products.find((entry) => entry.id === item.productId && entry.status === 'active');
    if (!product) return { status: 404, message: 'A product in the cart is no longer available.' };
    if (quantity > product.stock) return { status: 409, message: `${product.title} does not have enough stock.` };
    const color = String(item.color || product.colors[0]?.name || '');
    const size = String(item.size || product.sizes[0] || '');
    if (product.colors.length && !product.colors.some((entry) => entry.name === color)) {
      return { status: 422, message: 'Choose a color.' };
    }
    if (product.sizes.length && !product.sizes.includes(size)) {
      return { status: 422, message: 'Choose a size.' };
    }
    lines.push({
      productId: product.id,
      title: product.title,
      slug: product.slug,
      unitPriceCents: product.priceCents,
      quantity,
      lineTotalCents: product.priceCents * quantity,
      currency: product.currency,
      stock: product.stock,
      color,
      size,
      image: product.images[0] || null,
    });
  }
  const subtotalCents = lines.reduce((sum, line) => sum + line.lineTotalCents, 0);
  return {
    status: 200,
    data: {
      lines,
      subtotalCents,
      discountCents: 0,
      totalCents: subtotalCents,
      currency: lines[0].currency,
      couponCode: '',
    },
  };
}

const campaigns = [
  {
    id: 'd1', title: 'Keep the reading room open', slug: 'reading-room',
    summary: 'Gifts keep the reading room open: the shelves, the desk, and the work of publishing.',
    description: 'Choose an amount, leave your details, then pay on PayFast. The gift is marked received only after PayFast confirms it.',
    goalAmountCents: 500000000, currency: 'PKR', active: true, featured: true,
    coverImage: photo('photo-1481627834876-b7833e8f5570', 'The reading room'),
  },
];

const pages = {
  about: {
    id: 'pg1', title: 'About', slug: 'about', status: 'published',
    seo: { title: 'About Zia Chitrali', description: 'What this library is for.' },
    body: '<p>Zia Chitrali is a reading room for Islamic education, research, and the public record. Articles, research, news, books, and talks live here so a reader can begin in one place.</p><p>Gifts and shop orders open PayFast. Bank, EasyPaisa, JazzCash, and card are chosen there. Nothing is marked received until PayFast confirms the payment.</p>',
  },
  privacy: {
    id: 'pg2', title: 'Privacy', slug: 'privacy', status: 'published',
    seo: { title: 'Privacy', description: 'How reader information is handled.' },
    body: '<p>An account stores your name, email, bookmarks, likes, and reading history. A contact note stores the name, email, and message you send. Gifts and orders store the details you enter, and they stay pending until a transfer is confirmed.</p><p>Sign-in uses a short-lived token in memory and a refresh cookie on this site. The desk does not sell this record.</p>',
  },
  terms: {
    id: 'pg3', title: 'Terms', slug: 'terms', status: 'published',
    seo: { title: 'Terms', description: 'Terms of use.' },
    body: '<p>Use the library for reading, research, and the shop. Accounts are for one person. Comments should stay on the piece. Shop orders and gifts are recorded as pending. Submitting a form does not pay for an order or mark a gift as received.</p>',
  },
  contact: {
    id: 'pg4', title: 'Contact', slug: 'contact', status: 'published',
    seo: { title: 'Contact', description: 'Write to the desk.' },
    body: '<p>Write to the reading room from the contact page. Include your name, email, and the note you want the desk to read.</p>',
  },
};

const menus = {
  header: [
    { label: 'Articles', url: '/articles' },
    { label: 'Research', url: '/research' },
    { label: 'News', url: '/news' },
    { label: 'Columns', url: '/columns' },
    { label: 'Analysis', url: '/analysis' },
    { label: 'Videos', url: '/videos' },
    { label: 'Podcasts', url: '/podcasts' },
    { label: 'Books', url: '/books' },
    { label: 'Shop', url: '/shop' },
  ],
  footer: [
    { label: 'About', url: '/about' },
    { label: 'Contact', url: '/contact' },
    { label: 'Donate', url: '/donate' },
    { label: 'Newsletter', url: '/newsletter' },
    { label: 'Privacy', url: '/privacy' },
    { label: 'Terms', url: '/terms' },
  ],
  mobile: [
    { label: 'Articles', url: '/articles' },
    { label: 'Research', url: '/research' },
    { label: 'News', url: '/news' },
    { label: 'Stories', url: '/interesting-stories', children: [
      { label: 'Interesting Stories', url: '/interesting-stories' },
      { label: 'Inspirational Stories', url: '/inspirational-stories' },
    ] },
    { label: 'Videos', url: '/videos' },
    { label: 'Podcasts', url: '/podcasts' },
    { label: 'Books', url: '/books' },
    { label: 'Shop', url: '/shop' },
    { label: 'Donate', url: '/donate' },
  ],
};

previewStore.episodes = episodes;
previewStore.campaigns = campaigns;
previewStore.pages = pages;
previewStore.menus = menus;

function strip(item) {
  const copy = { ...item };
  delete copy.body;
  delete copy.videoUrl;
  return copy;
}

function paginate(items, query) {
  const limit = Math.min(48, Math.max(1, Number(query.limit) || 12));
  const page = Math.max(1, Number(query.page) || 1);
  const start = (page - 1) * limit;
  return {
    success: true,
    data: items.slice(start, start + limit),
    meta: { page, limit, total: items.length, pages: Math.max(1, Math.ceil(items.length / limit) || 1) },
  };
}

function filterContent(query, type) {
  return content.filter((item) => {
    if (type && item.type !== type) return false;
    if (query.featured === 'true' && !item.featured) return false;
    if (query.breaking === 'true' && !item.breaking) return false;
    if (query.category && item.category?.slug !== query.category) return false;
    if (query.tag && !item.tags.some((tag) => tag.slug === query.tag)) return false;
    if (query.author && item.author?.slug !== query.author) return false;
    if (query.language && item.language !== query.language) return false;
    if (query.q) {
      const needle = String(query.q).toLowerCase();
      const hay = `${item.title} ${item.excerpt}`.toLowerCase();
      if (!hay.includes(needle)) return false;
    }
    return true;
  });
}

function navRef(item) {
  if (!item) return null;
  return { id: item.id, type: item.type, title: item.title, slug: item.slug };
}

function campaignView(item) {
  const raisedAmountCents = previewStore.donations
    .filter((gift) => gift.campaignId === item.id && gift.status === 'paid')
    .reduce((sum, gift) => sum + Number(gift.amountCents || 0), 0);
  return { ...item, raisedAmountCents };
}

function savePreviewGift(body) {
  const campaign = campaigns.find((item) => item.id === body.campaignId && item.active);
  if (!campaign) return { status: 404, error: 'Campaign not found.' };
  const amount = Number(body.amountCents);
  if (!Number.isInteger(amount) || amount < 100) return { status: 422, error: 'Enter a valid amount.' };
  const email = String(body.donorEmail || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { status: 422, error: 'Enter a valid email.' };
  if (!String(body.donorName || '').trim()) return { status: 422, error: 'Enter your name.' };
  const mobile = normalizeMobile(body.phone);
  if (!mobile) return { status: 422, error: 'Enter a Pakistani mobile number like 03XXXXXXXXX.' };
  const reference = nextBasket('g');
  const anonymous = Boolean(body.anonymous);
  const gift = {
    id: `dn-${Date.now()}`,
    campaignId: campaign.id,
    campaignTitle: campaign.title,
    donorName: anonymous ? 'Anonymous' : String(body.donorName).trim(),
    donorEmail: email,
    phone: mobile,
    amountCents: amount,
    currency: campaign.currency,
    method: 'payfast',
    proofUrl: '',
    reference,
    message: String(body.message || '').trim(),
    anonymous,
    status: 'pending_payment',
    payment: freshPayment(reference),
    createdAt: new Date().toISOString(),
  };
  return {
    gift,
    publicGift: {
      id: gift.id,
      reference,
      status: gift.status,
      payment: gift.payment,
      amountCents: amount,
      currency: campaign.currency,
      method: gift.method,
      campaign: { id: campaign.id, title: campaign.title, slug: campaign.slug },
      payfastReady: payfastReady(),
    },
  };
}

function notifyOrder(order) {
  import('./services/mailService.js').then(({ sendOrderNote }) => sendOrderNote({
    name: order.customer.name,
    email: order.email,
    orderId: order.id,
    lines: order.items,
    totalCents: order.totalCents,
    currency: order.currency,
    method: order.method,
  })).catch((error) => console.error('[mail]', error.message));
}

function notifyGift(gift) {
  const campaign = campaigns.find((item) => item.id === gift.campaignId);
  import('./services/mailService.js').then(({ sendGiftNote }) => sendGiftNote({
    name: gift.anonymous ? '' : gift.donorName,
    email: gift.donorEmail,
    reference: gift.reference,
    campaign: campaign?.title || 'Zia Chitrali',
    amountCents: gift.amountCents,
    currency: gift.currency,
  })).catch((error) => console.error('[mail]', error.message));
}

function shopUser(req) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const id = userIdFromToken(token);
  if (!id) return null;
  return previewStore.users.find((item) => item.id === id) || null;
}

export function handlePreview(req, res) {
  const path = req.path;
  const query = req.query || {};
  if (req.method === 'POST' && path === '/contact') {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();
    if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
      return res.status(422).json({ success: false, message: 'Name, a valid email, and a message are required.' });
    }
    if (message.length > 4000 || subject.length > 160) {
      return res.status(422).json({ success: false, message: 'That note is too long.' });
    }
    const item = {
      id: `msg-${Date.now()}`,
      name,
      email,
      subject,
      message,
      status: 'new',
      createdAt: new Date().toISOString(),
    };
    previewStore.messages.unshift(item);
    return res.status(201).json({ success: true, data: { id: item.id } });
  }
  const lang = String(req.get('accept-language') || 'en').toLowerCase().slice(0, 2);
  if (lang === 'ur' || lang === 'ar') {
    const original = res.json.bind(res);
    res.json = (body) => original(overlayTranslations(localizePreview(body, lang), lang));
  }

  if (path === '/settings') return res.json({ success: true, data: siteSettings });

  const menu = path.match(/^\/menus\/(header|footer|mobile)$/);
  if (menu) return res.json({ success: true, data: { location: menu[1], items: menus[menu[1]] } });

  if (path === '/search') {
    const items = filterContent(query, query.type && query.type !== 'podcast-episode' ? query.type : '');
    return res.json(paginate(items.map((item) => ({ kind: 'content', ...strip(item) })), query));
  }

  if (path === '/categories') return res.json(paginate(categories, query));
  const category = path.match(/^\/categories\/([^/]+)$/);
  if (category) {
    const found = categories.find((item) => item.slug === decodeURIComponent(category[1]));
    if (!found) return res.status(404).json({ success: false, message: 'Category not found.' });
    return res.json({ success: true, data: { ...found, children: [], related: categories.filter((item) => item.id !== found.id).slice(0, 4) } });
  }

  if (path === '/tags') return res.json(paginate(tags, query));
  const tag = path.match(/^\/tags\/([^/]+)$/);
  if (tag) {
    const found = tags.find((item) => item.slug === decodeURIComponent(tag[1]));
    if (!found) return res.status(404).json({ success: false, message: 'Tag not found.' });
    return res.json({ success: true, data: found });
  }

  if (path === '/authors') {
    const list = query.featured === 'true' ? authors.filter((item) => item.featured) : authors;
    return res.json(paginate(list, query));
  }
  const author = path.match(/^\/authors\/([^/]+)$/);
  if (author) {
    const found = authors.find((item) => item.slug === decodeURIComponent(author[1]));
    if (!found) return res.status(404).json({ success: false, message: 'Author not found.' });
    return res.json({ success: true, data: found });
  }

  if (path === '/podcasts') return res.json(paginate(shows, query));
  const episodePath = path.match(/^\/podcasts\/([^/]+)\/([^/]+)$/);
  if (episodePath) {
    const show = shows.find((item) => item.slug === episodePath[1]);
    const episode = episodes.find((item) => item.slug === episodePath[2] && show && item.show === show.id);
    if (!episode || !show) return res.status(404).json({ success: false, message: 'Episode not found.' });
    const related = episodes.filter((item) => item.show === show.id && item.id !== episode.id);
    return res.json({
      success: true,
      data: {
        episode: { ...episode, show: { id: show.id, title: show.title, slug: show.slug, coverImage: show.coverImage } },
        related,
      },
    });
  }
  const showPath = path.match(/^\/podcasts\/([^/]+)$/);
  if (showPath) {
    const show = shows.find((item) => item.slug === showPath[1]);
    if (!show) return res.status(404).json({ success: false, message: 'Show not found.' });
    return res.json({ success: true, data: { ...show, episodes: episodes.filter((item) => item.show === show.id) } });
  }

  if (req.method === 'POST' && path === '/shop/quote') {
    const quote = previewQuote(req.body);
    if (quote.message) return res.status(quote.status).json({ success: false, message: quote.message });
    return res.json({ success: true, data: quote.data });
  }

  if (req.method === 'POST' && path === '/orders') {
    const user = shopUser(req);
    if (!user) return res.status(401).json({ success: false, message: 'Sign in required.' });
    const quote = previewQuote(req.body);
    if (quote.message) return res.status(quote.status).json({ success: false, message: quote.message });
    const customer = req.body?.customer || {};
    const mobile = normalizeMobile(customer.phone);
    if (!customer.name || !customer.address) {
      return res.status(422).json({ success: false, message: 'Name and address are required.' });
    }
    if (!mobile) {
      return res.status(422).json({ success: false, message: 'Enter a Pakistani mobile number like 03XXXXXXXXX.' });
    }
    const payMethod = String(req.body?.method || '').toLowerCase();
    if (payMethod !== 'cod' && payMethod !== 'payfast') {
      return res.status(422).json({ success: false, message: 'Choose cash on delivery or PayFast.' });
    }
    if (payMethod === 'cod') {
      for (const line of quote.data.lines) {
        const product = products.find((entry) => entry.id === line.productId);
        if (!product || product.stock < line.quantity) {
          return res.status(409).json({ success: false, message: `${line.title} does not have enough stock.` });
        }
      }
      quote.data.lines.forEach((line) => {
        const product = products.find((entry) => entry.id === line.productId);
        product.stock -= line.quantity;
      });
    }
    const id = `pv-${Date.now()}`;
    const order = {
      id,
      userId: user.id,
      email: user.email,
      items: quote.data.lines.map((line) => ({
        product: line.productId,
        title: line.title,
        slug: line.slug,
        unitPriceCents: line.unitPriceCents,
        quantity: line.quantity,
        lineTotalCents: line.lineTotalCents,
        color: line.color,
        size: line.size,
      })),
      subtotalCents: quote.data.subtotalCents,
      discountCents: 0,
      totalCents: quote.data.totalCents,
      currency: quote.data.currency,
      couponCode: '',
      customer: {
        name: customer.name,
        email: user.email,
        phone: mobile,
        address: customer.address,
      },
      method: payMethod,
      status: 'pending_payment',
      payment: payMethod === 'cod'
        ? { provider: 'cod', status: 'due_on_delivery', basketId: '', transactionId: '', errCode: '', instrument: '' }
        : freshPayment(nextBasket('o')),
      createdAt: new Date().toISOString(),
    };
    previewOrders.set(id, order);
    notifyOrder(order);
    return res.status(201).json({ success: true, data: { order, accessKey: 'preview', payfastReady: payfastReady() } });
  }

  if (req.method === 'POST' && path === '/donations') {
    const saved = savePreviewGift(req.body || {});
    if (saved.error) return res.status(saved.status).json({ success: false, message: saved.error });
    previewStore.donations.unshift(saved.gift);
    notifyGift(saved.gift);
    return res.status(201).json({ success: true, data: saved.publicGift });
  }

  if (path === '/orders/me') {
    const user = shopUser(req);
    if (!user) return res.status(401).json({ success: false, message: 'Sign in required.' });
    const mine = [...previewOrders.values()].filter((item) => item.userId === user.id).reverse();
    return res.json(paginate(mine, query));
  }

  const previewOrder = path.match(/^\/orders\/([^/]+)$/);
  if (previewOrder && previewOrder[1] !== 'me') {
    const found = previewOrders.get(decodeURIComponent(previewOrder[1]));
    const user = shopUser(req);
    if (!found || !user || found.userId !== user.id) return res.status(404).json({ success: false, message: 'Order not found.' });
    return res.json({ success: true, data: { ...found, payfastReady: payfastReady() } });
  }

  if (path === '/products') {
    const needle = String(query.q || '').toLowerCase();
    let list = products.filter((item) => item.status === 'active');
    if (query.featured === 'true') list = list.filter((item) => item.featured);
    if (query.category) list = list.filter((item) => item.category === query.category);
    if (needle) {
      list = list.filter((item) => `${item.title} ${item.description} ${item.category}`.toLowerCase().includes(needle));
    }
    if (query.sort === 'price') list = [...list].sort((a, b) => a.priceCents - b.priceCents);
    if (query.sort === 'price-desc') list = [...list].sort((a, b) => b.priceCents - a.priceCents);
    return res.json(paginate(list, query));
  }
  const product = path.match(/^\/products\/([^/]+)$/);
  if (product) {
    const found = products.find((item) => item.slug === decodeURIComponent(product[1]));
    if (!found) return res.status(404).json({ success: false, message: 'Product not found.' });
    return res.json({ success: true, data: found });
  }

  const giftRef = path.match(/^\/donations\/reference\/([^/]+)$/);
  if (giftRef && req.method === 'GET') {
    const gift = previewStore.donations.find((item) => item.reference === decodeURIComponent(giftRef[1]));
    if (!gift) return res.status(404).json({ success: false, message: 'Gift not found.' });
    const cause = campaigns.find((item) => item.id === gift.campaignId);
    return res.json({
      success: true,
      data: {
        reference: gift.reference,
        status: gift.status,
        payment: { provider: gift.payment?.provider || null, status: gift.payment?.status || 'not_configured' },
        amountCents: gift.amountCents,
        currency: gift.currency,
        campaign: { title: cause?.title || gift.campaignTitle || 'Zia Chitrali' },
        payfastReady: payfastReady(),
      },
    });
  }

  if (path === '/donations/campaigns') {
    const list = (query.featured === 'true' ? campaigns.filter((item) => item.featured) : campaigns).map(campaignView);
    return res.json(paginate(list, query));
  }

  const page = path.match(/^\/pages\/([^/]+)$/);
  if (page) {
    const found = pages[decodeURIComponent(page[1])];
    if (!found) return res.status(404).json({ success: false, message: 'Page not found.' });
    return res.json({ success: true, data: found });
  }

  if (path === '/comments') {
    const list = comments.filter((item) => item.status === 'approved' && (!query.targetId || item.targetId === query.targetId));
    return res.json(paginate(list, query));
  }

  const related = path.match(/^\/content\/([^/]+)\/([^/]+)\/related$/);
  if (related) {
    const current = content.find((item) => item.type === related[1] && item.slug === related[2]);
    const items = content.filter((item) => item.type === related[1] && item.id !== current?.id).slice(0, 4).map(strip);
    return res.json({ success: true, data: items });
  }

  const detail = path.match(/^\/content\/([^/]+)\/([^/]+)$/);
  if (detail) {
    const found = content.find((item) => item.type === detail[1] && item.slug === decodeURIComponent(detail[2]));
    if (!found) return res.status(404).json({ success: false, message: 'Content not found.' });
    const siblings = content.filter((item) => item.type === found.type);
    const index = siblings.findIndex((item) => item.id === found.id);
    return res.json({
      success: true,
      data: {
        ...found,
        seo: { title: found.title, description: found.excerpt },
        prev: navRef(siblings[index + 1]),
        next: navRef(siblings[index - 1]),
        engagement: { liked: false, bookmarked: false },
      },
    });
  }

  const list = path.match(/^\/content\/([^/]+)$/);
  if (list || path === '/content') {
    const type = list ? list[1] : (query.type || '');
    return res.json(paginate(filterContent(query, type).map(strip), query));
  }

  return res.json({ success: true, data: [], meta: { page: 1, limit: 12, total: 0, pages: 1 } });
}
