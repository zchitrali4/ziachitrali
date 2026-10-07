import { useCallback, useRef } from 'react';
import { engagementApi } from '../api/index.js';

export function useAnalytics() {
  const seen = useRef(new Set());

  const trackView = useCallback((targetType, targetId) => {
    if (!targetType || !targetId) return;
    const key = `${targetType}:${targetId}`;
    if (seen.current.has(key)) return;
    seen.current.add(key);
    engagementApi.view({ targetType, targetId }).catch(() => {});
  }, []);

  const trackShare = useCallback((targetType, targetId, channel) => {
    if (!targetType || !targetId) return;
    engagementApi.share({ targetType, targetId, channel }).catch(() => {});
  }, []);

  return { trackView, trackShare };
}
