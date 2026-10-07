import { useEffect, useId, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useSite } from '../../context/SiteContext.jsx';
import { t } from '../../utils/i18n.js';
import { menuLabel } from '../../utils/menuLabel.js';

function NavItems({ items, language }) {
  return items.map((item) => (
    <div className="nav-group" key={`${item.url}`}>
      <NavLink className="nav-link" to={item.url}>{menuLabel(language, item)}</NavLink>
      {item.children?.length ? (
        <div className="submenu">
          {item.children.map((child) => <NavLink key={child.url} to={child.url}>{menuLabel(language, child)}</NavLink>)}
        </div>
      ) : null}
    </div>
  ));
}

export function PublicHeader() {
  const { menus } = useSite();
  const { user } = useAuth();
  const { count } = useCart();
  const { language, setLanguage } = usePreferences();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const showCart = pathname === '/shop' || pathname === '/cart' || pathname === '/checkout' || pathname.startsWith('/products/');
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const closeRef = useRef(null);
  const menuId = useId();

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) closeRef.current?.focus();
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    function onKey(event) {
      if (event.key === 'Escape') setOpen(false);
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const term = query.trim();
    if (!term) return;
    navigate(`/search?q=${encodeURIComponent(term)}`);
    setOpen(false);
  }

  return (
    <header className="site-header">
      <div className="nav-bar">
        <div className="wrap nav-bar-inner">
          <Link className="brand-lockup" to="/">
            <img src="/logo.png" alt="ضیاء چترالی" width="496" height="246" />
          </Link>
          <nav className="desktop-nav" aria-label="Primary">
            <NavItems language={language} items={menus.header.filter((item) => item.url !== '/shop')} />
          </nav>
          <div className="header-tools">
            <NavLink className="nav-shop" to="/shop">{t(language, 'shop')}</NavLink>
            <label className="lang-field">
              <span className="sr-only" id="language-label">{t(language, 'language')}</span>
              <select id="language" className="lang-select" value={language} onChange={(event) => setLanguage(event.target.value)} aria-labelledby="language-label">
                <option value="en">English</option>
                <option value="ur">اردو</option>
                <option value="ar">العربية</option>
              </select>
            </label>
            {showCart ? <Link className="cart-link" to="/cart">{t(language, 'cart')}{count ? ` ${count}` : ''}</Link> : null}
            <Link className="btn btn-donate" to="/donate">{t(language, 'donate')}</Link>
            {user ? <Link className="btn" to="/account">{t(language, 'account')}</Link> : <Link className="btn" to="/login">{t(language, 'signIn')}</Link>}
            <button className="icon-btn menu-toggle" type="button" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(true)}>
              {t(language, 'menu')}
            </button>
          </div>
        </div>
      </div>
      {open ? (
        <>
          <div className="drawer-backdrop" onClick={() => setOpen(false)} />
          <div className="drawer" id={menuId} role="dialog" aria-modal="true" aria-label={t(language, 'menu')}>
            <button ref={closeRef} className="btn-ghost" type="button" onClick={() => setOpen(false)}>{t(language, 'close')}</button>
            <form role="search" onSubmit={submitSearch} className="stack" style={{ marginTop: '1rem' }}>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t(language, 'searchPlaceholder')} aria-label={t(language, 'search')} />
            </form>
            <nav aria-label="Mobile">
              {showCart ? <Link to="/cart" onClick={() => setOpen(false)}>{t(language, 'cart')}{count ? ` (${count})` : ''}</Link> : null}
              <Link to={user ? '/account' : '/login'} onClick={() => setOpen(false)}>{user ? t(language, 'account') : t(language, 'signIn')}</Link>
              {menus.mobile.map((item) => (
                <div key={`${item.label}-${item.url}`}>
                  <Link to={item.url} onClick={() => setOpen(false)}>{menuLabel(language, item)}</Link>
                  {item.children?.map((child) => (
                    <Link className="child" key={child.url} to={child.url} onClick={() => setOpen(false)}>{menuLabel(language, child)}</Link>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </>
      ) : null}
    </header>
  );
}
