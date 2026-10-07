export function EmptyState({ title, message, action }) {
  return (
    <div className="empty">
      <h3>{title}</h3>
      {message ? <p className="meta">{message}</p> : null}
      {action || null}
    </div>
  );
}
