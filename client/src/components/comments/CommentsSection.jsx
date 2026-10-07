import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { commentApi } from '../../api/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { normalizeError } from '../../utils/errors.js';
import { formatDate } from '../../utils/format.js';
import { t } from '../../utils/i18n.js';
import { EmptyState } from '../content/universal/EmptyState.jsx';
import { ErrorState } from '../content/universal/ErrorState.jsx';

export function CommentsSection({ targetType, targetId }) {
  const { user } = useAuth();
  const { language } = usePreferences();
  const [status, setStatus] = useState('loading');
  const [comments, setComments] = useState([]);
  const [error, setError] = useState(null);
  const [body, setBody] = useState('');
  const [formError, setFormError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(() => {
    setStatus('loading');
    commentApi.list({ targetType, targetId, limit: 50 })
      .then((payload) => {
        setComments(payload.data || []);
        setStatus('success');
      })
      .catch((err) => {
        setError(normalizeError(err));
        setStatus('error');
      });
  }, [targetId, targetType]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSubmit(event) {
    event.preventDefault();
    setFormError('');
    setNotice('');
    try {
      const payload = await commentApi.create({ targetType, targetId, body });
      setBody('');
      setNotice(payload.data.status === 'pending' ? 'Your comment is waiting for moderation.' : 'Comment posted.');
      setComments((current) => [...current, payload.data]);
    } catch (err) {
      setFormError(normalizeError(err).message);
    }
  }

  return (
    <section className="section" aria-labelledby="comments-title">
      <h2 id="comments-title">{t(language, 'comments')}</h2>
      {status === 'loading' ? <p className="meta">{t(language, 'loadingComments')}</p> : null}
      {status === 'error' ? <ErrorState message={error.message} onRetry={load} /> : null}
      {status === 'success' && comments.length === 0 ? <EmptyState title={t(language, 'emptyComments')} message={t(language, 'emptyCommentsNote')} /> : null}
      {comments.map((comment) => (
        <article className="comment" key={comment.id}>
          <p><strong>{comment.user?.name || t(language, 'member')}</strong> <span className="meta">{formatDate(comment.createdAt, language)}</span></p>
          <p>{comment.body}</p>
          {comment.status !== 'approved' ? <p className="meta">Status: {comment.status}</p> : null}
        </article>
      ))}
      {user && !user.emailVerified ? (
        <p className="notice"><Link to="/account">{t(language, 'verifyToComment')}</Link></p>
      ) : user ? (
        <form className="stack" onSubmit={onSubmit}>
          <label className="field">
            <span>{t(language, 'addComment')}</span>
            <textarea required minLength={2} maxLength={4000} value={body} onChange={(event) => setBody(event.target.value)} rows={4} />
          </label>
          {formError ? <p className="form-error">{formError}</p> : null}
          {notice ? <p className="form-ok">{notice}</p> : null}
          <button className="btn" type="submit">{t(language, 'submitReview')}</button>
        </form>
      ) : (
        <p className="notice"><Link to={`/login?next=${encodeURIComponent(window.location.pathname)}`}>{t(language, 'signInToComment')}</Link></p>
      )}
    </section>
  );
}
