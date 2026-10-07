import { useEffect, useRef } from 'react';
import { engagementApi } from '../api/index.js';
import { useAuth } from '../context/AuthContext.jsx';
import { contentPath } from '../config/contentRegistry.js';
import { clearLocalHistory, readLocalHistory, writeLocalHistory } from '../utils/storage.js';

export function useReadingHistorySync(item) {
  const { user, status } = useAuth();
  const synced = useRef('');

  useEffect(() => {
    if (!item?.id || status !== 'ready') return undefined;
    const key = `${item.type}:${item.id}:${user?.id || 'guest'}`;
    if (synced.current === key) return undefined;
    synced.current = key;
    const entry = {
      targetType: item.type,
      targetId: item.id,
      slug: item.slug,
      title: item.title,
      path: item.path || contentPath(item.type, item.slug),
      progress: item.progress || 1,
      lastReadAt: new Date().toISOString(),
    };
    if (!user) {
      writeLocalHistory(entry);
      return undefined;
    }
    const entries = [...readLocalHistory(), entry];
    engagementApi.syncHistory(entries)
      .then(() => clearLocalHistory())
      .catch(() => writeLocalHistory(entry));
    return undefined;
  }, [item, status, user]);
}
