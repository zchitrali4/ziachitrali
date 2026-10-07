import { usePreferences } from '../../context/PreferencesContext.jsx';
import { t } from '../../utils/i18n.js';

export function VideoPlayer({ url, title }) {
  const { language } = usePreferences();
  if (!url) return <p className="notice">{t(language, 'noVideo')}</p>;
  let embed = null;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (host === 'youtu.be' || host === 'youtube.com') {
      const id = host === 'youtu.be' ? parsed.pathname.slice(1) : parsed.searchParams.get('v');
      if (id) embed = `https://www.youtube.com/embed/${encodeURIComponent(id)}`;
    } else if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean).pop();
      if (id) embed = `https://player.vimeo.com/video/${encodeURIComponent(id)}`;
    }
    if (embed) {
      return (
        <div className="video-frame">
          <iframe src={embed} title={title} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      );
    }
    if (/\.(mp4|webm|ogg)(\?|$)/i.test(parsed.pathname)) {
      return <video className="video-frame" controls src={url}><track kind="captions" /></video>;
    }
  } catch {
    return <p className="notice">{t(language, 'videoUnread')}</p>;
  }
  return <p className="notice"><a href={url} rel="noreferrer">{t(language, 'openVideo')}</a></p>;
}
