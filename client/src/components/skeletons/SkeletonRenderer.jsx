function Bar({ className = '', style }) {
  return <div className={`skeleton ${className}`.trim()} style={style} aria-hidden="true" />;
}

function Cards({ count = 4, ratio = '16 / 9' }) {
  return (
    <div className="skel-grid card-grid">
      {Array.from({ length: count }, (_, index) => (
        <div className="skel-card" key={index}>
          <div className="skeleton skel-media" style={{ aspectRatio: ratio }} />
          <Bar style={{ width: '30%', height: '0.7rem' }} />
          <Bar style={{ width: '90%', height: '1.2rem' }} />
          <Bar style={{ width: '70%', height: '0.8rem' }} />
        </div>
      ))}
    </div>
  );
}

export function SkeletonRenderer({ variant = 'contentGrid' }) {
  if (variant === 'hero') {
    return (
      <div className="hero-grid" aria-hidden="true">
        <div className="skel-card">
          <div className="skeleton skel-media" style={{ aspectRatio: '16 / 10' }} />
          <Bar style={{ width: '40%' }} />
          <Bar style={{ width: '88%', height: '2rem' }} />
        </div>
        <Cards count={3} />
      </div>
    );
  }
  if (variant === 'detail') {
    return (
      <div className="stack" aria-hidden="true">
        <Bar style={{ width: '30%' }} />
        <Bar style={{ width: '80%', height: '2.4rem' }} />
        <div className="skeleton skel-media" style={{ aspectRatio: '16 / 8' }} />
        <Bar />
        <Bar />
        <Bar style={{ width: '70%' }} />
      </div>
    );
  }
  if (variant === 'book') return <Cards count={4} ratio="3 / 4" />;
  if (variant === 'video') return <Cards count={2} ratio="16 / 9" />;
  if (variant === 'author') return <Cards count={3} ratio="1 / 1" />;
  if (variant === 'search') return <Cards count={4} ratio="16 / 10" />;
  return <Cards />;
}

export function LoadingSkeleton(props) {
  return <SkeletonRenderer {...props} />;
}
