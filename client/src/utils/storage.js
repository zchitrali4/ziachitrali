const KEY = 'ieds.readingHistory';

export function readLocalHistory() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeLocalHistory(entry) {
  const next = [entry, ...readLocalHistory().filter((item) => item.targetId !== entry.targetId)].slice(0, 100);
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
}

export function clearLocalHistory() {
  localStorage.removeItem(KEY);
}

export function orderKeyName(id) {
  return `ieds.order.${id}`;
}
