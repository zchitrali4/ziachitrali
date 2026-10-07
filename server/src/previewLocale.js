function articleHtml(lang, excerpt) {
  if (lang === 'ur') {
    return `<p>${excerpt}</p><p>یہ نمونہ تحریر ہے تاکہ مطالعے کا صفحہ دیکھا جا سکے۔ آغاز واضح ہے، درمیان آہستہ، اور آخر میں ایک خیال رہ جاتا ہے۔</p><h2>روایت دراصل کیا کہتی ہے</h2><p>سنجیدہ تحریر ماخذ سے جلدی نہیں کرتی۔ وہ سوال کا نام لیتی ہے، متن کے ساتھ بیٹھتی ہے، اور جہاں پیراگراف چاہیے وہاں نعرہ نہیں لگاتی۔ قاری یہاں سوچنے آتا ہے، شور سننے نہیں۔</p><h2>صورت کیوں اہم ہے</h2><p>صفحہ ایک جریدے کی طرح ہے: بڑا عنوان، مختصر تمہید، پھر ایسا کالم جو لمبے مطالعے میں آرام دہ رہے۔ تصویر ایک فریم میں رہتی ہے تاکہ سطریں نہ بکھریں۔</p>`;
  }
  return `<p>${excerpt}</p><p>هذا نص نموذجي لمراجعة صفحة القراءة. البداية واضحة، والوسط أهدأ، والخاتمة تُبقي فكرة واحدة.</p><h2>ماذا يقول التراث فعلًا</h2><p>الكتابة الجادة لا تستعجل المصدر. تسمّي السؤال، وتجلس مع النص، وترفض الشعار حيث تلزم فقرة. يأتي القارئ هنا ليفكر، لا ليُصاحَب عليه.</p><h2>لماذا تهم الصورة</h2><p>الصفحة مبنية كمجلّة: عنوان كبير، ومقدمة قصيرة، ثم عمود مريح للقراءة الطويلة. تبقى الصورة داخل إطار حتى لا ينكسر السطر.</p>`;
}

const copy = {
  ur: {
    settings: {
      tagline: 'اسلامی تعلیمی مواد اور دریافت',
      footerText: 'تحقیق، غور، اور عوامی تعلیم کے لیے ایک لائبریری۔',
      address: 'لاہور',
    },
    '/articles': { label: 'مضامین' },
    '/research': { label: 'تحقیق' },
    '/news': { label: 'خبریں' },
    '/columns': { label: 'کالم' },
    '/analysis': { label: 'تجزیہ' },
    '/videos': { label: 'ویڈیوز' },
    '/podcasts': { label: 'پوڈکاسٹ' },
    '/books': { label: 'کتابیں' },
    '/shop': { label: 'دکان' },
    '/about': { label: 'تعارف' },
    '/contact': { label: 'رابطہ' },
    '/donate': { label: 'عطیہ' },
    '/newsletter': { label: 'نیوز لیٹر' },
    '/privacy': { label: 'رازداری' },
    '/terms': { label: 'شرائط' },
    '/interesting-stories': { label: 'دلچسپ کہانیاں' },
    '/inspirational-stories': { label: 'حوصلہ افزا کہانیاں' },
    faith: { name: 'ایمان', description: 'عمل، عقیدہ، اور اندرونی زندگی۔' },
    ideas: { name: 'خیالات', description: 'ایک سوچے سمجھے معاشرے کے لیے مضامین۔' },
    history: { name: 'تاریخ', description: 'زندگیاں، جگہیں، اور لمبا ریکارڈ۔' },
    society: { name: 'معاشرہ', description: 'برادریاں کیسے سیکھتی، جمع ہوتی اور بدلتی ہیں۔' },
    learning: { name: 'تعلیم', description: 'مطالعہ، کلاس اور علم۔' },
    books: { name: 'کتابیں', description: 'مطالعے کے نوٹ اور نئے عنوانات۔' },
    quran: { name: 'قرآن' },
    ethics: { name: 'اخلاق' },
    education: { name: 'تعلیم' },
    community: { name: 'برادری' },
    youth: { name: 'نوجوان' },
    culture: { name: 'ثقافت' },
    'maryam-hasan': { name: 'مریم حسن', roleTitle: 'مدیر', bio: 'مریم طویل مضامین کی تدوین کرتی ہیں اور عوامی زندگی میں ایمان پر لکھتی ہیں۔' },
    'yusuf-rahman': { name: 'یوسف رحمان', roleTitle: 'ریسرچ فیلو', bio: 'یوسف اسلامی فکری تاریخ اور جدید اخلاق کا مطالعہ کرتے ہیں۔' },
    'leila-karim': { name: 'لیلیٰ کریم', roleTitle: 'کالم نگار', bio: 'لیلیٰ کتابوں، شہروں اور یادداشت پر ہفتہ وار کالم لکھتی ہیں۔' },
    'omar-farooq': { name: 'عمر فاروق', roleTitle: 'نامہ نگار', bio: 'عمر تعلیم، برادری اور ثقافت پر رپورٹ کرتے ہیں۔' },
    'zia-chitrali': { name: 'ضیاء چترالی' },
    'articles:a-library-for-quiet-minds': { title: 'خاموش ذہنوں کے لیے ایک لائبریری', excerpt: 'ضیاء چترالی ایک مطالعہ گاہ کی طرح بن رہا ہے: کم نعرے، لمبی توجہ، اور ایسا کام جس کی طرف لوٹا جا سکے۔' },
    'articles:reading-the-quran-slowly': { title: 'قرآن کو آہستہ پڑھنا', excerpt: 'رفتار سمجھ کا کمزور پیمانہ ہے۔ آہستہ قراءت آیت کو جواب کی گنجائش دیتی ہے۔' },
    'articles:cities-that-still-teach': { title: 'وہ شہر جو اب بھی سکھاتے ہیں', excerpt: 'صحن کے مدرسوں سے رات کی لائبریریوں تک، شہر ہمیشہ مسلمانوں کے سیکھنے کا حصہ رہا ہے۔' },
    'articles:the-ethics-of-attention': { title: 'توجہ کی اخلاقیات', excerpt: 'ہم جس چیز کو دیکھتے ہیں وہ ایک اخلاقی انتخاب ہے۔ پلیٹ فارم کو چاہیے کہ آدمی ایک خیال کے ساتھ ٹھہر سکے۔' },
    'research:notes-on-early-tafsir': { title: 'عوامی تفسیر کی طرف نوٹ', excerpt: 'ایک تحقیقی خاکہ کہ ابتدائی تفسیر کو چپٹا کیے بغیر کیسے پیش کیا جائے۔' },
    'research:classrooms-after-the-pandemic': { title: 'لمبے وقفے کے بعد کلاس روم', excerpt: 'تین شہروں کے اساتذہ نے کیا بدلا، اور کس چیز کو چھوڑنے سے انکار کیا۔' },
    'research:manuscript-margins': { title: 'حاشیے کیا یاد رکھتے ہیں', excerpt: 'پرانے مخطوطوں پر قارئین کے نوٹ صرف تصنیف کی نہیں، استعمال کی تاریخ ہیں۔' },
    'news:evening-lecture-series': { title: 'لاہور میں شام کے لیکچرز کا سلسلہ', excerpt: 'اس مہینے چار عوامی لیکچر اخلاق، تاریخ، اور احتیاط سے پڑھنے پر ہوں گے۔' },
    'news:library-hours-extended': { title: 'جمعے کو مطالعہ گاہ دیر تک کھلے گی', excerpt: 'طلبہ ہفتہ وار سیمینار کا مطالعہ پورا کر سکیں، اس لیے کمرہ دیر تک کھلا رہے گا۔' },
    'news:new-research-fellows': { title: 'تین ریسرچ فیلو ڈیسک میں شامل', excerpt: 'ان کے پہلے نوٹ آنے والے ہفتوں میں تحقیق کے حصے میں آئیں گے۔' },
    'news:youth-reading-circle': { title: 'اتوار کو نوجوانوں کا مطالعہ حلقہ', excerpt: 'لمبے مضامین کے نئے قارئین کے لیے ایک چھوٹا حلقہ۔ پہلے سے کسی سیمینار کی شرط نہیں۔' },
    'news:archive-digitisation': { title: 'ایک چھوٹے آرکائیو کی ڈیجیٹائزیشن', excerpt: 'خطوط اور تدریسی نوٹ شائع ہونے سے پہلے فہرست میں لائے جائیں گے۔' },
    'columns:letter-from-the-desk': { title: 'ڈیسک کا خط', excerpt: 'ہم کم شائع کرنا چاہتے ہیں، اور اس کا مطلب بھی۔ یہ کالم رفتار کا وعدہ ہے۔' },
    'columns:on-keeping-a-notebook': { title: 'نوٹ بک رکھنے پر', excerpt: 'نوٹ بک کوئی کارکردگی نہیں۔ یہ وہ جگہ ہے جہاں خیال ادھورا رہنے کی اجازت پاتا ہے۔' },
    'columns:friday-light': { title: 'جمعے کی دوپہر کی روشنی', excerpt: 'کچھ گھڑیاں خبروں کے لیے ہیں۔ یہ گھڑی اس چیز کو دیکھنے کے لیے ہے جسے ہفتہ نے جلدی میں چھوڑ دیا۔' },
    'analysis:attention-and-the-feed': { title: 'فیڈ نصاب نہیں', excerpt: 'پوسٹوں کی لائن خبر دے سکتی ہے۔ وہ مطالعے کی ترتیب کی جگہ نہیں لے سکتی۔' },
    'analysis:what-schools-owe-language': { title: 'اسکولوں پر زبان کا حق', excerpt: 'اردو، عربی اور انگریزی الگ کام کرتی ہیں۔ انہیں حریف سمجھنا تینوں کو کمزور کرتا ہے۔' },
    'analysis:charity-without-theatre': { title: 'نمائش کے بغیر خیرات', excerpt: 'عطیے کے صفحے کو رقم کے بارے میں صاف ہونا چاہیے۔ یہ دکھاوا نہ کرے کہ تحفہ پہلے ہی پہنچ گیا۔' },
    'interesting-stories:the-librarian-of-the-old-city': { title: 'پرانی شہر کی لائبریرین', excerpt: 'اس نے سوتی ڈور میں ایک چابی رکھی تھی، اور ہر اس مستعار کنندہ کی یاد جسے واپس نہیں آیا۔' },
    'interesting-stories:a-map-drawn-in-the-margin': { title: 'حاشیے میں بنا نقشہ', excerpt: 'کسی نے سفر والے باب کے ساتھ ایک سڑک بنائی تھی۔ وہ سڑک کسی اٹلس سے نہیں ملتی تھی۔' },
    'interesting-stories:tea-after-the-lesson': { title: 'سبق کے بعد چائے', excerpt: 'بہترین سوال تب آئے جب کتابیں بند ہو چکی تھیں اور پیالے بھر چکے تھے۔' },
    'inspirational-stories:the-student-who-walked': { title: 'وہ طالب علم جو پیدل آیا', excerpt: 'اس نے ٹرم کو نمبروں سے نہیں، ان صبحوں سے ناپا جن میں اس نے پھر سے شروع کرنے کا انتخاب کیا۔' },
    'inspirational-stories:a-mother-keeps-the-hour': { title: 'ایک ماں گھڑی کو قائم رکھتی ہے', excerpt: 'ہر شام وہ بیس منٹ الگ رکھتی تھی۔ بچوں نے سیکھا کہ وقت سنبھالا جا سکتا ہے۔' },
    'inspirational-stories:the-last-lamp-in-the-hall': { title: 'ہال کا آخری چراغ', excerpt: 'نگہبان ایک چراغ ان کے لیے جلا چھوڑتا تھا جو شہر کے سو جانے کے بعد بھی پڑھ رہے ہوتے۔' },
    'videos:how-to-begin-a-text': { title: 'مشکل متن کیسے شروع کریں', excerpt: 'ایسی کتاب کے پہلے دس منٹ پر ایک مختصر سبق جو آپ سے ٹکراتی ہے۔' },
    'videos:a-walk-through-the-archive': { title: 'آرکائیو میں ایک چکر', excerpt: 'فہرست اس سے پہلے کیسی لگتی ہے جب وہ عوامی مجموعہ بنے۔' },
    'books:the-patient-reader': { title: 'صابر قاری', excerpt: 'توجہ، شرح، اور مطالعے کے آداب پر مضامین۔', publisher: 'ضیاء چترالی' },
    'books:letters-on-learning': { title: 'تعلیم کے خطوط', excerpt: 'ایک تعلیمی سال میں استاد اور طالب علم کے درمیان خط کتابت۔', publisher: 'ضیاء چترالی' },
    'books:courtyard-notes': { title: 'صحن کے نوٹ', excerpt: 'ان اسکولوں کے فیلڈ نوٹ جو اب بھی کھلی فضا میں پڑھاتے ہیں۔', publisher: 'سٹی ڈیسک' },
    'books:a-short-history-of-the-margin': { title: 'حاشیے کی ایک مختصر تاریخ', excerpt: 'قارئین نے کتابوں کے ساتھ کیسے بحث کی، ان کے پہلو میں لکھ کر۔', publisher: 'ضیاء چترالی' },
    'the-reading-room': { title: 'مطالعہ گاہ', description: 'کتابوں، مطالعے، اور ان عادتوں پر گفتگو جو پڑھنے کا ہفتہ ممکن بناتی ہیں۔' },
    'after-the-lesson': { title: 'سبق کے بعد', description: 'اساتذہ بتاتے ہیں کہ کلاس ختم ہونے کے بعد طالب علم کے پاس کیا رہ گیا۔' },
    'begin-with-one-chapter': { title: 'ایک باب سے شروع کریں', description: 'ایک باب، ٹھیک سے پڑھا ہوا، ارادوں کے ڈھیر سے بہتر آغاز ہے۔' },
    'notes-you-can-return-to': { title: 'وہ نوٹ جن کی طرف لوٹا جائے', description: 'ایسی نوٹ بکوں پر عملی بات جو ایک مہینے بعد بھی سمجھ آئیں۔' },
    'the-question-that-arrived-late': { title: 'وہ سوال جو دیر سے آیا', description: 'ایک استاد اس طالب علم کے بارے میں جسے سبق گھر جاتے راستے میں سمجھ آیا۔' },
    'the-patient-reader': { title: 'صابر قاری', description: 'توجہ اور مطالعے پر مضامین۔ قیمت سرور کی فہرست والی قیمت ہے۔' },
    'field-cap': { title: 'فیلڈ کیپ', description: 'سوتی کیپ، چھوٹی بریم، اور ایک چھوٹا نشان۔', category: 'ٹوپیاں' },
    'linen-shirt': { title: 'لینن شرٹ', description: 'نرم کالر والی آسان لینن شرٹ۔', category: 'قمیضیں' },
    'wool-scarf': { title: 'اونی سکارف', description: 'ہلکا اونی سکارف، ایک بار لپیٹنے جتنا لمبا۔', category: 'سکارف' },
    'desk-tee': { title: 'ڈیسک ٹی', description: 'موٹی سوتی ٹی، سینے پر کوئی پرنٹ نہیں۔', category: 'قمیضیں' },
    'everyday-cap': { title: 'روزمرہ کیپ', description: 'دھلی ہوئی سوتی چھ پینل کی کیپ۔', category: 'ٹوپیاں' },
    'overshirt': { title: 'اوور شرٹ', description: 'سوتی اوور شرٹ، دو جیبیں، سادے بٹن۔', category: 'قمیضیں' },
    'letters-on-learning': { title: 'تعلیم کے خطوط', description: 'ایک سال کے خطوط، ایک استاد اور ایک طالب علم کے درمیان۔' },
    'reading-room-notebook': { title: 'مطالعہ گاہ کی نوٹ بک', description: 'ایک سادہ نوٹ بک، ربن کے ساتھ، حاشیے کے نوٹ کے لیے جگہ۔' },
    'reading-room': { title: 'مطالعہ گاہ کو کھلا رکھیں', summary: 'ڈیزائن کے لیے ایک نمونہ مہم۔ کوئی ادائیگی نہیں لی جاتی، اور کچھ ادا شدہ نہیں دکھایا جاتا۔', description: 'اس صفحے کے تحفے صرف ارادے کے طور پر درج ہوتے ہیں جب تک ادائیگی کا ذریعہ نہ جڑے۔' },
    about: { title: 'تعارف', body: '<p>ضیاء چترالی اسلامی تعلیم، تحقیق اور عوامی ریکارڈ کے لیے ایک مطالعہ گاہ ہے۔ مضامین، تحقیق، خبریں، کتابیں اور گفتگو ایک ہی جگہ سے شروع ہوتی ہیں۔</p><p>عطیات اور دکان کے آرڈر ادائیگی کے ذریعے کے جڑنے تک زیر التوا رہتے ہیں۔ فارم ارادہ درج کرتا ہے، رقم نہیں لیتا۔</p>' },
    privacy: { title: 'رازداری', body: '<p>اکاؤنٹ آپ کا نام، ای میل، نشانیاں، پسند اور مطالعے کی تاریخ رکھتا ہے۔ رابطے کا نوٹ نام، ای میل اور پیغام رکھتا ہے۔ عطیات اور آرڈر وہ تفصیل رکھتے ہیں جو آپ لکھتے ہیں، اور تصدیق تک زیر التوا رہتے ہیں۔</p>' },
    terms: { title: 'شرائط', body: '<p>لائبریری مطالعے، تحقیق اور دکان کے لیے ہے۔ اکاؤنٹ ایک شخص کے لیے ہے۔ تبصرہ اسی تحریر پر رہے۔ آرڈر اور عطیہ زیر التوا درج ہوتے ہیں۔ فارم بھرنا ادائیگی نہیں ہے۔</p>' },
    contact: { title: 'رابطہ', body: '<p>رابطہ کے صفحے سے مطالعہ گاہ کو لکھیں۔ نام، ای میل، اور وہ بات لکھیں جو ڈیسک کو پڑھنی ہے۔</p>' },
  },
  ar: {
    settings: {
      tagline: 'محتوى تعليمي إسلامي واكتشاف',
      footerText: 'مكتبة للبحث والتأمل والتعليم العام.',
      address: 'لاهور',
    },
    '/articles': { label: 'مقالات' },
    '/research': { label: 'بحوث' },
    '/news': { label: 'أخبار' },
    '/columns': { label: 'أعمدة' },
    '/analysis': { label: 'تحليل' },
    '/videos': { label: 'فيديو' },
    '/podcasts': { label: 'بودكاست' },
    '/books': { label: 'كتب' },
    '/shop': { label: 'المتجر' },
    '/about': { label: 'عن الموقع' },
    '/contact': { label: 'اتصل' },
    '/donate': { label: 'تبرع' },
    '/newsletter': { label: 'النشرة' },
    '/privacy': { label: 'الخصوصية' },
    '/terms': { label: 'الشروط' },
    '/interesting-stories': { label: 'قصص شيقة' },
    '/inspirational-stories': { label: 'قصص ملهمة' },
    faith: { name: 'إيمان', description: 'العمل والاعتقاد والحياة الداخلية.' },
    ideas: { name: 'أفكار', description: 'مقالات لمجتمع يتأنى في التفكير.' },
    history: { name: 'تاريخ', description: 'حيوات وأماكن وسجل طويل.' },
    society: { name: 'مجتمع', description: 'كيف تتعلم الجماعات وتجتمع وتتغير.' },
    learning: { name: 'تعلّم', description: 'الدراسة والصف والعلم.' },
    books: { name: 'كتب', description: 'ملاحظات قراءة وعناوين جديدة.' },
    quran: { name: 'القرآن' },
    ethics: { name: 'أخلاق' },
    education: { name: 'تعليم' },
    community: { name: 'جماعة' },
    youth: { name: 'شباب' },
    culture: { name: 'ثقافة' },
    'maryam-hasan': { name: 'مريم حسن', roleTitle: 'رئيسة التحرير', bio: 'تحرّر مريم القراءات الطويلة وتكتب عن الإيمان في الحياة العامة.' },
    'yusuf-rahman': { name: 'يوسف رحمن', roleTitle: 'زميل بحث', bio: 'يدرس يوسف التاريخ الفكري الإسلامي والأخلاق الحديثة.' },
    'leila-karim': { name: 'ليلى كريم', roleTitle: 'كاتبة عمود', bio: 'تكتب ليلى العمود الأسبوعي عن الكتب والمدن والذاكرة.' },
    'omar-farooq': { name: 'عمر فاروق', roleTitle: 'مراسل', bio: 'يرصد عمر التعليم والجماعة والثقافة.' },
    'zia-chitrali': { name: 'ضياء چترالي' },
    'articles:a-library-for-quiet-minds': { title: 'مكتبة للعقول الهادئة', excerpt: 'يُبنى ضياء چترالي كقاعة قراءة: شعارات أقل، وانتباه أطول، وعمل يمكن الرجوع إليه.' },
    'articles:reading-the-quran-slowly': { title: 'قراءة القرآن بتمهّل', excerpt: 'السرعة مقياس ضعيف للفهم. القراءة الأبطأ تترك للآية مجالًا أن تجيب.' },
    'articles:cities-that-still-teach': { title: 'مدن ما زالت تعلّم', excerpt: 'من مدارس الصحن إلى المكتبات المتأخرة، كانت المدينة دائمًا جزءًا من تعلّم المسلمين.' },
    'articles:the-ethics-of-attention': { title: 'أخلاق الانتباه', excerpt: 'ما ننظر إليه اختيار أخلاقي. ينبغي أن تساعد المنصة الإنسان على البقاء مع فكرة.' },
    'research:notes-on-early-tafsir': { title: 'ملاحظات نحو تفسير عام', excerpt: 'تخطيط بحثي لكيفية تقديم التفسير المبكر دون تسطيحه.' },
    'research:classrooms-after-the-pandemic': { title: 'الصفوف بعد الانقطاع الطويل', excerpt: 'ما غيّره المعلمون في ثلاث مدن، وما رفضوا التخلي عنه.' },
    'research:manuscript-margins': { title: 'ما تذكره الهوامش', excerpt: 'ملاحظات القرّاء على المخطوطات القديمة تاريخ استعمال، لا تاريخ تأليف فحسب.' },
    'news:evening-lecture-series': { title: 'سلسلة محاضرات مسائية في لاهور', excerpt: 'أربع محاضرات عامة هذا الشهر عن الأخلاق والتاريخ وكيف نقرأ بعناية.' },
    'news:library-hours-extended': { title: 'تمديد ساعات قاعة القراءة يوم الجمعة', excerpt: 'ستبقى القاعة مفتوحة أطول حتى يُنهي الطلاب قراءات الندوة الأسبوعية.' },
    'news:new-research-fellows': { title: 'ثلاثة زملاء بحث ينضمون إلى المكتب', excerpt: 'ستظهر ملاحظاتهم الأولى في قسم البحوث خلال الأسابيع المقبلة.' },
    'news:youth-reading-circle': { title: 'حلقة قراءة للشباب تبدأ الأحد', excerpt: 'حلقة صغيرة لقرّاء المقالات الطويلة أول مرة. لا يُشترط حضور ندوة سابقة.' },
    'news:archive-digitisation': { title: 'أرشيف صغير يبدأ الرقمنة', excerpt: 'ستُفهرس الرسائل وملاحظات التدريس قبل نشر أي منها.' },
    'columns:letter-from-the-desk': { title: 'رسالة من المكتب', excerpt: 'نفضّل أن ننشر أقل، ونعني ذلك. هذا العمود وعد عن الإيقاع.' },
    'columns:on-keeping-a-notebook': { title: 'في إبقاء دفتر', excerpt: 'الدفتر ليس عرضًا. هو المكان الذي يُسمح فيه للفكرة أن تبقى ناقصة.' },
    'columns:friday-light': { title: 'ضوء عصر الجمعة', excerpt: 'بعض الساعات للأخبار. هذه الساعة لملاحظة ما حاول الأسبوع أن يتجاوزه بسرعة.' },
    'analysis:attention-and-the-feed': { title: 'التغذية ليست منهجًا', excerpt: 'سيل المنشورات قد يُخبر. لا يستطيع أن يحل محل تسلسل القراءة.' },
    'analysis:what-schools-owe-language': { title: 'ما تدين به المدارس للغة', excerpt: 'الأردية والعربية والإنجليزية تؤدي أعمالًا مختلفة. معاملتها كخصوم تُضعف الثلاث.' },
    'analysis:charity-without-theatre': { title: 'صدقة بلا مسرح', excerpt: 'ينبغي أن تكون صفحة التبرع واضحة في المال. لا تتظاهر بأن الهدية قد وصلت سلفًا.' },
    'interesting-stories:the-librarian-of-the-old-city': { title: 'أمينة مكتبة المدينة القديمة', excerpt: 'أبقت مفتاحًا في خيط قطني، وذاكرة كل مستعير لم يعد.' },
    'interesting-stories:a-map-drawn-in-the-margin': { title: 'خريطة رُسمت في الهامش', excerpt: 'رسم أحدهم طريقًا بجانب فصل عن السفر. لم يطابق الطريق أي أطلس.' },
    'interesting-stories:tea-after-the-lesson': { title: 'شاي بعد الدرس', excerpt: 'أفضل الأسئلة جاءت بعد أن أُغلقت الكتب وصُبّت الأكواب.' },
    'inspirational-stories:the-student-who-walked': { title: 'الطالب الذي مشى', excerpt: 'قاس الفصل لا بالدرجات، بل بالصباحات التي اختار فيها أن يبدأ من جديد.' },
    'inspirational-stories:a-mother-keeps-the-hour': { title: 'أم تحفظ الساعة', excerpt: 'كل مساء كانت تفرز عشرين دقيقة. تعلّم الأطفال أن الوقت يمكن حفظه.' },
    'inspirational-stories:the-last-lamp-in-the-hall': { title: 'المصباح الأخير في القاعة', excerpt: 'ترك القيّم مصباحًا لمن بقي يقرأ بعد أن نامت المدينة.' },
    'videos:how-to-begin-a-text': { title: 'كيف تبدأ نصًا صعبًا', excerpt: 'درس قصير عن الدقائق العشر الأولى مع كتاب يقاومك.' },
    'videos:a-walk-through-the-archive': { title: 'جولة في الأرشيف', excerpt: 'كيف يبدو الفهرس قبل أن يصير مجموعة عامة.' },
    'books:the-patient-reader': { title: 'القارئ الصبور', excerpt: 'مقالات في الانتباه والشرح وآداب الدراسة.', publisher: 'ضياء چترالي' },
    'books:letters-on-learning': { title: 'رسائل في التعلّم', excerpt: 'مراسلات بين معلم وطالب عبر سنة دراسية.', publisher: 'ضياء چترالي' },
    'books:courtyard-notes': { title: 'ملاحظات الصحن', excerpt: 'ملاحظات ميدانية من مدارس ما زالت تعلّم في الهواء الطلق.', publisher: 'مكتب المدينة' },
    'books:a-short-history-of-the-margin': { title: 'تاريخ موجز للهامش', excerpt: 'كيف جادل القرّاء الكتب بالكتابة إلى جوارها.', publisher: 'ضياء چترالي' },
    'the-reading-room': { title: 'قاعة القراءة', description: 'حوارات عن الكتب والدراسة والعادات التي تجعل أسبوع القراءة ممكنًا.' },
    'after-the-lesson': { title: 'بعد الدرس', description: 'يتحدث المعلمون عما بقي مع الطلاب بعد انتهاء الحصة.' },
    'begin-with-one-chapter': { title: 'ابدأ بفصل واحد', description: 'فصل واحد يُقرأ كما ينبغي أفضل من كومة نيات.' },
    'notes-you-can-return-to': { title: 'ملاحظات يمكن الرجوع إليها', description: 'حديث عملي عن دفاتر تبقى مفهومة بعد شهر.' },
    'the-question-that-arrived-late': { title: 'السؤال الذي جاء متأخرًا', description: 'معلم عن الطالب الذي فهم الدرس في طريق العودة إلى البيت.' },
    'the-patient-reader': { title: 'القارئ الصبور', description: 'مقالات في الانتباه والدراسة. السعر هو سعر الفهرس من الخادم.' },
    'field-cap': { title: 'قبعة الحقل', description: 'قبعة قطنية بحافة قصيرة وعلامة صغيرة منسوجة.', category: 'قبعات' },
    'linen-shirt': { title: 'قميص كتّان', description: 'قميص كتّان مريح بياقة ناعمة.', category: 'قمصان' },
    'wool-scarf': { title: 'وشاح صوف', description: 'وشاح صوف خفيف، يكفي للفة واحدة.', category: 'أوشحة' },
    'desk-tee': { title: 'تيشيرت المكتب', description: 'تيشيرت قطن ثقيل بلا طباعة على الصدر.', category: 'قمصان' },
    'everyday-cap': { title: 'قبعة كل يوم', description: 'قبعة قطن مغسول من ست قطع.', category: 'قبعات' },
    'overshirt': { title: 'قميص فوقي', description: 'قميص قطني مفتوح، جيبان وأزرار بسيطة.', category: 'قمصان' },
    'letters-on-learning': { title: 'رسائل في التعلّم', description: 'سنة من الرسائل بين معلم وطالب.' },
    'reading-room-notebook': { title: 'دفتر قاعة القراءة', description: 'دفتر بسيط بشريط ومكان لملاحظات الهامش.' },
    'reading-room': { title: 'أبقوا قاعة القراءة مفتوحة', summary: 'حملة نموذجية للتصميم. لا يُقبض مال، ولا يُعلَّم شيء على أنه مدفوع.', description: 'تُسجل الهدايا في هذه الصفحة كنوايا فقط إلى أن يُربط مزود دفع.' },
    about: { title: 'عن الموقع', body: '<p>ضياء چترالي قاعة قراءة للتعليم الإسلامي والبحث والسجل العام. المقالات والبحوث والأخبار والكتب والأحاديث تبدأ من مكان واحد.</p><p>تبقى الهدايا وطلبات المتجر معلّقة إلى أن يُربط مزود دفع. النموذج يسجّل النية ولا يقبض المال.</p>' },
    privacy: { title: 'الخصوصية', body: '<p>يحفظ الحساب الاسم والبريد والإشارات والإعجابات وسجل القراءة. تحفظ رسالة التواصل الاسم والبريد والنص. الهدايا والطلبات تحفظ ما تكتبه وتبقى معلّقة حتى التأكيد.</p>' },
    terms: { title: 'الشروط', body: '<p>المكتبة للقراءة والبحث والمتجر. الحساب لشخص واحد. التعليق يبقى على المادة. الطلبات والهدايا تُسجل معلّقة. إرسال النموذج ليس دفعًا.</p>' },
    contact: { title: 'اتصل', body: '<p>اكتب إلى قاعة القراءة من صفحة التواصل. اذكر اسمك وبريدك والملاحظة التي ينبغي للمكتب أن يقرأها.</p>' },
  },
};

function lookup(node, lang) {
  const dict = copy[lang];
  if (!dict || !node || typeof node !== 'object') return null;
  if (node.type && node.slug && dict[`${node.type}:${node.slug}`]) return dict[`${node.type}:${node.slug}`];
  if (node.slug && dict[node.slug]) return dict[node.slug];
  if (node.url && dict[node.url]) return dict[node.url];
  return null;
}

function walk(value, lang) {
  if (Array.isArray(value)) return value.map((item) => walk(item, lang));
  if (!value || typeof value !== 'object') return value;
  const next = {};
  for (const [key, child] of Object.entries(value)) next[key] = walk(child, lang);
  const hit = lookup(next, lang);
  if (hit) {
    Object.assign(next, hit);
    if (next.seo && typeof next.seo === 'object') {
      const description = hit.excerpt || hit.summary || hit.description;
      next.seo = {
        ...next.seo,
        ...(hit.title ? { title: hit.title } : {}),
        ...(description ? { description } : {}),
      };
    }
    if (next.type && (hit.title || hit.excerpt)) {
      next.language = lang;
      next.direction = 'rtl';
      if (!hit.body && next.excerpt) next.body = articleHtml(lang, next.excerpt);
    }
  }
  const dict = copy[lang];
  if (next.siteName && next.tagline && dict?.settings) {
    next.tagline = dict.settings.tagline;
    next.footerText = dict.settings.footerText;
    if (next.contact) next.contact = { ...next.contact, address: dict.settings.address };
  }
  return next;
}

export function localizePreview(body, lang) {
  if (!body || body.success === false || !body.data) return body;
  return { ...body, data: walk(body.data, lang) };
}
