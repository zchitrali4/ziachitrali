import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { contentPath } from '../../config/contentRegistry.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';

export function HeroSlider({ items = [] }) {
  const { language } = usePreferences();
  const [index, setIndex] = useState(0);
  const count = Math.min(items.length, 3);
  const slides = items.slice(0, 3);
  const rtl = language === 'ur' || language === 'ar';

  useEffect(() => {
    setIndex(0);
  }, [count]);

  useEffect(() => {
    if (count < 2) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, 5200);
    return () => window.clearInterval(timer);
  }, [count]);

  if (!count) return null;

  return (
    <section className="hero-slider" aria-roledescription="carousel" aria-label="Featured stories">
      <div
        className="hero-track"
        style={{ transform: `translateX(${(rtl ? 1 : -1) * index * 100}%)` }}
      >
        {slides.map((item, slideIndex) => (
          <article className="hero-slide" key={item.id} aria-hidden={slideIndex !== index}>
            <img src={item.coverImage?.url} alt={item.coverImage?.alt || ''} />
            <div className="hero-slide-copy">
              {item.category?.name ? <p className="kicker">{item.category.name}</p> : null}
              {slideIndex === 0 ? (
                <h1><Link tabIndex={index === 0 ? 0 : -1} to={contentPath(item.type, item.slug)}>{item.title}</Link></h1>
              ) : (
                <h2><Link tabIndex={slideIndex === index ? 0 : -1} to={contentPath(item.type, item.slug)}>{item.title}</Link></h2>
              )}
              {item.excerpt ? <p>{item.excerpt}</p> : null}
              {item.author?.name ? <p className="meta">{item.author.name}</p> : null}
            </div>
          </article>
        ))}
      </div>
      <div className="hero-progress" aria-hidden="true">
        {slides.map((item, slideIndex) => (
          <span key={`${item.id}-${slideIndex === index ? index : 'wait'}`} className={slideIndex === index ? 'is-active' : ''} />
        ))}
      </div>
    </section>
  );
}
