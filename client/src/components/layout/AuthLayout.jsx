import { Outlet } from 'react-router-dom';
import { usePreferences } from '../../context/PreferencesContext.jsx';

export function AuthLayout() {
  const { language } = usePreferences();
  return (
    <main id="content" className="auth-shell" key={language}>
      <Outlet />
    </main>
  );
}
