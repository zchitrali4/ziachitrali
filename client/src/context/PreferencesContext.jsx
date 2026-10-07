import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { accountApi } from '../api/index.js';
import { useAuth } from './AuthContext.jsx';

const PreferencesContext = createContext(null);

function initial(key, fallback) {
  return localStorage.getItem(key) || fallback;
}

export function PreferencesProvider({ children }) {
  const { user, updateUser } = useAuth();
  const [language, setLanguageState] = useState(() => initial('ieds.language', 'en'));
  const [theme, setThemeState] = useState(() => initial('ieds.theme', 'system'));

  useEffect(() => {
    if (!user?.settings) return;
    if (user.settings.language) setLanguageState(user.settings.language);
    if (user.settings.theme) setThemeState(user.settings.theme);
  }, [user]);

  useEffect(() => {
    const root = document.documentElement;
    root.lang = language;
    root.dir = language === 'en' ? 'ltr' : 'rtl';
    localStorage.setItem('ieds.language', language);
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = dark ? 'dark' : 'light';
    localStorage.setItem('ieds.theme', theme);
  }, [language, theme]);

  const persist = useCallback(async (next) => {
    if (!user) return;
    const payload = await accountApi.updateSettings(next);
    updateUser(payload.data);
  }, [updateUser, user]);

  const value = useMemo(() => ({
    language,
    theme,
    async setLanguage(next) {
      localStorage.setItem('ieds.language', next);
      setLanguageState(next);
      await persist({ language: next, theme, publicProfile: user?.settings?.publicProfile, notifications: user?.settings?.notifications });
    },
    async setTheme(next) {
      setThemeState(next);
      await persist({ theme: next, language, publicProfile: user?.settings?.publicProfile, notifications: user?.settings?.notifications });
    },
  }), [language, persist, theme, user]);

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) throw new Error('usePreferences must be used within PreferencesProvider');
  return context;
}
