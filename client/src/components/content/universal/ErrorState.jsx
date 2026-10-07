import { Link } from 'react-router-dom';
import { usePreferences } from '../../../context/PreferencesContext.jsx';
import { t } from '../../../utils/i18n.js';

export function ErrorState({ message, onRetry, backTo }) {
  const { language } = usePreferences();
  return (
    <div className="error-box" role="alert">
      <h3>{t(language, 'wentWrong')}</h3>
      <p>{message || t(language, 'tryAgainLater')}</p>
      <div className="share">
        {onRetry ? <button className="btn" type="button" onClick={onRetry}>{t(language, 'retry')}</button> : null}
        {backTo ? <Link className="btn-ghost" to={backTo}>{t(language, 'back')}</Link> : null}
      </div>
    </div>
  );
}
