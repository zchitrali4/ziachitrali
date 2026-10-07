import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { cmsApi } from '../api/index.js';
import { FALLBACK_MENUS, FALLBACK_SETTINGS } from '../config/contentRegistry.js';
import { usePreferences } from './PreferencesContext.jsx';

const SiteContext = createContext(null);

function withFallbackMenu(items, fallback) {
  return items?.length ? items : fallback;
}

export function SiteProvider({ children }) {
  const { language } = usePreferences();
  const [state, setState] = useState({
    status: 'loading',
    settings: FALLBACK_SETTINGS,
    menus: FALLBACK_MENUS,
  });

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      cmsApi.settings(controller.signal),
      cmsApi.menu('header', controller.signal),
      cmsApi.menu('footer', controller.signal),
      cmsApi.menu('mobile', controller.signal),
    ]).then(([settings, header, footer, mobile]) => {
      setState({
        status: 'ready',
        settings: {
          ...FALLBACK_SETTINGS,
          ...settings.data,
          contact: { ...FALLBACK_SETTINGS.contact, ...(settings.data.contact || {}) },
          social: settings.data.social || [],
        },
        menus: {
          header: withFallbackMenu(header.data.items, FALLBACK_MENUS.header),
          footer: withFallbackMenu(footer.data.items, FALLBACK_MENUS.footer),
          mobile: withFallbackMenu(mobile.data.items, FALLBACK_MENUS.mobile),
        },
      });
    }).catch((error) => {
      if (error?.name === 'AbortError') return;
      setState((current) => ({ ...current, status: 'ready' }));
    });
    return () => controller.abort();
  }, [language]);

  const value = useMemo(() => state, [state]);
  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) throw new Error('useSite must be used within SiteProvider');
  return context;
}
