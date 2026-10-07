import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { metricsApi } from '../../api/index.js';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { t } from '../../utils/i18n.js';
import { PublicFooter } from './PublicFooter.jsx';
import { PublicHeader } from './PublicHeader.jsx';

const QUIET = /^\/(account|admin|login|register|forgot-password|reset-password|verify-email)(\/|$)/;

export function PublicLayout() {
  const { language } = usePreferences();
  const location = useLocation();
  useEffect(() => {
    const path = location.pathname || '/';
    if (QUIET.test(path)) return;
    metricsApi.page(path).catch(() => {});
  }, [location.pathname]);
  return (
    <div className="shell">
      <a className="skip-link" href="#content">{t(language, 'skip')}</a>
      <PublicHeader />
      <main id="content" key={language}>
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
