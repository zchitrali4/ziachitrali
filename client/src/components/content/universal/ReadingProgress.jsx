import { useEffect, useState } from 'react';

export function ReadingProgress({ targetId }) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const article = document.getElementById(targetId);
    if (!article) return undefined;
    const onScroll = () => {
      const rect = article.getBoundingClientRect();
      const total = article.offsetHeight - window.innerHeight;
      const seen = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      setValue(Math.round((seen / Math.max(total, 1)) * 100));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [targetId]);

  return (
    <div
      className="progress"
      role="progressbar"
      aria-label="Reading progress"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={value}
      style={{ transform: `scaleX(${value / 100})` }}
    />
  );
}
