import { useEffect, useId, useRef } from 'react';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { ta } from '../../utils/adminI18n.js';

export function Modal({ title, children, onClose }) {
  const { language } = usePreferences();
  const ref = useRef(null);
  const titleId = useId();
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.focus();
    function onKey(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      previous?.focus?.();
    };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titleId} ref={ref} tabIndex={-1} onClick={(event) => event.stopPropagation()}>
        <header className="section-head"><h2 id={titleId}>{title}</h2><button className="btn-ghost" type="button" onClick={onClose}>{ta(language, 'close')}</button></header>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, onConfirm, onClose }) {
  const { language } = usePreferences();
  return (
    <Modal title={title} onClose={onClose}>
      <p>{message}</p>
      <div className="share">
        <button className="btn" type="button" onClick={onConfirm}>{ta(language, 'confirm')}</button>
        <button className="btn-ghost" type="button" onClick={onClose}>{ta(language, 'cancel')}</button>
      </div>
    </Modal>
  );
}

export function FormField({ label, children, hint, error }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint ? <small className="meta">{hint}</small> : null}
      {error ? <small className="form-error">{error}</small> : null}
    </label>
  );
}

export function StatusBadge({ value }) {
  return <span className="status">{value || '—'}</span>;
}

export function AdminPageHeader({ title, action }) {
  return (
    <header className="admin-top">
      <h1>{title}</h1>
      {action || null}
    </header>
  );
}

export function DataTable({ columns, rows, caption }) {
  return (
    <div className="table-wrap">
      <table>
        <caption className="sr-only">{caption || 'Records'}</caption>
        <thead>
          <tr>{columns.map((column) => <th key={column.key} scope="col">{column.label}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              {columns.map((column) => <td key={column.key}>{column.render ? column.render(row) : row[column.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Filters({ value, onChange, placeholder = 'Search' }) {
  return (
    <form onSubmit={(event) => event.preventDefault()}>
      <input aria-label={placeholder} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
    </form>
  );
}
