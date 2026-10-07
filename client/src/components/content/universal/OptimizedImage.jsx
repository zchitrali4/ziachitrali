import { useState } from 'react';

export function OptimizedImage({
  src,
  alt = '',
  ratio = '16 / 9',
  fit = 'cover',
  eager = false,
  className = '',
}) {
  const [failed, setFailed] = useState(!src);
  return (
    <div className={`media-frame ${className}`.trim()} style={{ aspectRatio: ratio }}>
      {failed ? (
        <div className="media-fallback" role="img" aria-label={alt || 'Image unavailable'} />
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          onError={() => setFailed(true)}
          style={{ objectFit: fit }}
        />
      )}
    </div>
  );
}
