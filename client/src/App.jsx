import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { PreferencesProvider } from './context/PreferencesContext.jsx';
import { SiteProvider } from './context/SiteContext.jsx';
import AppRoutes from './routes/AppRoutes.jsx';

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <PreferencesProvider>
          <SiteProvider>
            <CartProvider>
              <AppRoutes />
            </CartProvider>
          </SiteProvider>
        </PreferencesProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
