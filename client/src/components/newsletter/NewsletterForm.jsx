import { useState } from 'react';
import { newsletterApi } from '../../api/index.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { normalizeError } from '../../utils/errors.js';
import { t } from '../../utils/i18n.js';

export function NewsletterForm({ compact = false }) {
  const { language } = usePreferences();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event) {
    event.preventDefault();
    setStatus('loading');
    setMessage('');
    try {
      await newsletterApi.subscribe({ email, name });
      setStatus('success');
      setMessage(t(language, 'subscribed'));
      setEmail('');
      setName('');
    } catch (error) {
      const normalized = normalizeError(error);
      setStatus('error');
      setMessage(normalized.message);
    }
  }

  return (
    <form className="stack" onSubmit={onSubmit}>
      {!compact ? (
        <label className="field">
          <span>{t(language, 'name')}</span>
          <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" />
        </label>
      ) : null}
      <label className="field">
        <span>{t(language, 'email')}</span>
        <input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder={t(language, 'email')} />
      </label>
      <button className="btn" type="submit" disabled={status === 'loading'}>{status === 'loading' ? t(language, 'sending') : t(language, 'subscribe')}</button>
      {message ? <p className={status === 'success' ? 'form-ok' : 'form-error'} role="status">{message}</p> : null}
    </form>
  );
}
