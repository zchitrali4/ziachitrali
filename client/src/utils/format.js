export function formatDate(value, lang = 'en') {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const locale = lang === 'ur' ? 'ur-PK' : lang === 'ar' ? 'ar' : 'en-GB';
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric' }).format(date);
}

export function formatMoney(cents, currency = 'PKR', lang = 'en') {
  const amount = (Number(cents) || 0) / 100;
  const locale = lang === 'ur' ? 'ur-PK' : lang === 'ar' ? 'ar' : 'en-PK';
  try {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

export function formatDuration(seconds) {
  if (seconds === null || seconds === undefined || seconds === '') return '';
  const total = Math.max(0, Number(seconds) || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remain = Math.floor(total % 60);
  if (hours) return `${hours}:${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
  return `${minutes}:${String(remain).padStart(2, '0')}`;
}

export function readingLabel(minutes, lang = 'en') {
  const count = Math.max(1, Number(minutes) || 1);
  if (lang === 'ur') return `${count} منٹ کا مطالعہ`;
  if (lang === 'ar') return `${count} دقائق قراءة`;
  return `${count} min read`;
}
