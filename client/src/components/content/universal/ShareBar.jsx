import { useState } from 'react';
import { usePreferences } from '../../../context/PreferencesContext.jsx';
import { useAnalytics } from '../../../hooks/useAnalytics.js';
import { t } from '../../../utils/i18n.js';

export function ShareBar({ title, path, targetType, targetId }) {
  const { trackShare } = useAnalytics();
  const { language } = usePreferences();
  const [copied, setCopied] = useState(false);
  const url = `${window.location.origin}${path}`;

  async function share(channel) {
    trackShare(targetType, targetId, channel);
    if (channel === 'native' && navigator.share) {
      await navigator.share({ title, url }).catch(() => {});
      return;
    }
    if (channel === 'copy') {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      return;
    }
    const links = {
      x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${title} ${url}`)}`,
    };
    window.open(links[channel], '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="share" aria-label={t(language, 'share')}>
      <button className="btn-ghost" type="button" onClick={() => share('copy')}>{copied ? t(language, 'copied') : t(language, 'copyLink')}</button>
      {navigator.share ? <button className="btn-ghost" type="button" onClick={() => share('native')}>{t(language, 'share')}</button> : null}
      <button className="btn-ghost" type="button" onClick={() => share('whatsapp')}>WhatsApp</button>
      <button className="btn-ghost" type="button" onClick={() => share('x')}>X</button>
      <button className="btn-ghost" type="button" onClick={() => share('facebook')}>Facebook</button>
    </div>
  );
}
