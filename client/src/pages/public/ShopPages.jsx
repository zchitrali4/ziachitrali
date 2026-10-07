import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate, useMatch, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { shopApi } from '../../api/index.js';
import { Breadcrumbs } from '../../components/content/universal/Breadcrumbs.jsx';
import { EmptyState } from '../../components/content/universal/EmptyState.jsx';
import { ErrorState } from '../../components/content/universal/ErrorState.jsx';
import { OptimizedImage } from '../../components/content/universal/OptimizedImage.jsx';
import { Pagination } from '../../components/navigation/Pagination.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { SkeletonRenderer } from '../../components/skeletons/SkeletonRenderer.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { t } from '../../utils/i18n.js';
import { useQuery } from '../../hooks/useQuery.js';
import { normalizeError } from '../../utils/errors.js';
import { formatDate, formatMoney } from '../../utils/format.js';
import { orderKeyName } from '../../utils/storage.js';
import { submitPayfast } from '../../utils/payfast.js';

function lineKey(item) {
  return `${item.productId}|${item.color || ''}|${item.size || ''}`;
}

function colorName(language, name) {
  const label = t(language, `color${name}`);
  return label === `color${name}` ? name : label;
}

function sizeName(language, size) {
  return size === 'One' ? t(language, 'oneSize') : size;
}

function ShopHero({ items }) {
  const { language } = usePreferences();
  const [index, setIndex] = useState(0);
  const slides = items.slice(0, 3);
  const count = slides.length;
  const rtl = language === 'ur' || language === 'ar';

  useEffect(() => { setIndex(0); }, [count]);

  useEffect(() => {
    if (count < 2) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % count), 5200);
    return () => window.clearInterval(timer);
  }, [count]);

  if (!count) return null;

  return (
    <section className="hero wrap">
      <div className="hero-slider shop-hero" aria-roledescription="carousel" aria-label={t(language, 'newArrivals')}>
        <div className="hero-track" style={{ transform: `translateX(${(rtl ? 1 : -1) * index * 100}%)` }}>
          {slides.map((item, slideIndex) => (
            <article className="hero-slide" key={item.id} aria-hidden={slideIndex !== index}>
              <img src={item.images?.[0]?.url} alt={item.images?.[0]?.alt || ''} />
              <div className="hero-slide-copy">
                <p className="kicker">{t(language, 'newArrivals')}</p>
                <h2>
                  <Link tabIndex={slideIndex === index ? 0 : -1} to={`/products/${item.slug}`}>{item.title}</Link>
                </h2>
                <p>{formatMoney(item.priceCents, item.currency, language)}</p>
              </div>
            </article>
          ))}
        </div>
        <div className="hero-progress" aria-hidden="true">
          {slides.map((item, slideIndex) => (
            <span key={`${item.id}-${slideIndex === index ? index : 'wait'}`} className={slideIndex === index ? 'is-active' : ''} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function ShopPage() {
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('');
  const { language } = usePreferences();
  const { count } = useCart();
  const featured = useQuery(useCallback((signal) => shopApi.products({ featured: 'true', limit: 3 }, signal), []));
  const facets = useQuery(useCallback((signal) => shopApi.products({ limit: 48 }, signal), []));
  const query = useQuery(useCallback((signal) => shopApi.products({ page, q: term, category, sort, limit: 12 }, signal), [page, term, category, sort]));
  const categories = [...new Set((facets.data || []).map((item) => item.category).filter(Boolean))];
  return (
    <>
      <PageHead title={t(language, 'shopTitle')} description={t(language, 'shopLede')} path="/shop" />
      {featured.status === 'loading' ? <div className="wrap"><SkeletonRenderer variant="hero" /></div> : null}
      {featured.data?.length ? <ShopHero items={featured.data} /> : null}
      <div className="wrap shop-page">
        <header className="page-head">
          <div>
            <h1>{t(language, 'shopTitle')}</h1>
            <p className="shop-lede">{t(language, 'shopLede')}</p>
          </div>
          <div className="shop-tools">
            <form onSubmit={(event) => { event.preventDefault(); setPage(1); setTerm(q); }}>
              <input value={q} onChange={(event) => setQ(event.target.value)} aria-label={t(language, 'searchProducts')} placeholder={t(language, 'searchProducts')} />
            </form>
            <Link className="btn" to="/cart">{t(language, 'cart')}{count ? ` (${count})` : ''}</Link>
          </div>
        </header>
        <div className="shop-filters">
          <button className={category ? 'choice' : 'choice is-on'} type="button" onClick={() => { setCategory(''); setPage(1); }}>{t(language, 'all')}</button>
          {categories.map((item) => (
            <button key={item} className={category === item ? 'choice is-on' : 'choice'} type="button" onClick={() => { setCategory(item); setPage(1); }}>{item}</button>
          ))}
          <label className="field shop-sort">
            <span className="sr-only">{t(language, 'sort')}</span>
            <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }} aria-label={t(language, 'sort')}>
              <option value="">{t(language, 'sortNew')}</option>
              <option value="price">{t(language, 'sortLow')}</option>
              <option value="price-desc">{t(language, 'sortHigh')}</option>
            </select>
          </label>
        </div>
        {query.status === 'loading' ? <SkeletonRenderer variant="book" /> : null}
        {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
        {query.status === 'success' && !query.data.length ? <EmptyState title={t(language, 'emptyProducts')} /> : null}
        <div className="shop-grid">
          {query.data?.map((product) => (
            <Link className="shop-card" key={product.id} to={`/products/${product.slug}`}>
              <OptimizedImage src={product.images?.[0]?.url} alt={product.images?.[0]?.alt || product.title} ratio="3 / 4" />
              <p className="meta">{product.category}</p>
              <h3>{product.title}</h3>
              <p>{formatMoney(product.priceCents, product.currency, language)}</p>
              {product.colors?.length ? (
                <span className="swatches" aria-hidden="true">
                  {product.colors.map((color) => <i key={color.name} style={{ background: color.hex }} />)}
                </span>
              ) : null}
            </Link>
          ))}
        </div>
        <Pagination page={query.meta?.page || 1} pages={query.meta?.pages || 1} onPage={setPage} />
      </div>
    </>
  );
}

function ProductCard({ product, language }) {
  return (
    <Link className="shop-card" to={`/products/${product.slug}`}>
      <OptimizedImage src={product.images?.[0]?.url} alt={product.images?.[0]?.alt || product.title} ratio="3 / 4" />
      <p className="meta">{product.category}</p>
      <h3>{product.title}</h3>
      <p>{formatMoney(product.priceCents, product.currency, language)}</p>
    </Link>
  );
}

export function ProductPage() {
  const { slug } = useParams();
  const { language } = usePreferences();
  const cart = useCart();
  const query = useQuery(useCallback((signal) => shopApi.product(slug, signal), [slug]));
  const catalog = useQuery(useCallback((signal) => shopApi.products({ limit: 12 }, signal), []));
  const product = query.data;
  const [color, setColor] = useState('');
  const [size, setSize] = useState('');
  const [qty, setQty] = useState(1);
  const [shot, setShot] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!product) return;
    setColor(product.colors?.[0]?.name || '');
    setSize(product.sizes?.[0] || '');
    setQty(1);
    setShot(0);
    setAdded(false);
  }, [product?.id]);

  const images = product?.images?.length ? product.images : [];
  const active = images[shot] || images[0];
  const max = Math.min(20, product?.stock || 1);
  const relatedPool = (catalog.data || []).filter((item) => item.slug !== product?.slug);
  const sameKind = relatedPool.filter((item) => item.category === product?.category);
  const related = [...sameKind, ...relatedPool.filter((item) => !sameKind.includes(item))].slice(0, 3);

  function add() {
    cart.add({ productId: product.id, quantity: qty, color, size });
    setAdded(true);
  }

  return (
    <div className="wrap product-page">
      <PageHead title={product?.title || t(language, 'shopTitle')} description={product?.description || ''} path={`/products/${slug}`} />
      <Breadcrumbs items={[{ label: t(language, 'home'), href: '/' }, { label: t(language, 'shopTitle'), href: '/shop' }, { label: product?.title || t(language, 'shopTitle') }]} />
      {query.status === 'loading' ? <SkeletonRenderer variant="detail" /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} backTo="/shop" /> : null}
      {product ? (
        <>
          <div className="product-layout">
            <div className="product-gallery">
              {active ? <img className="product-stage" src={active.url} alt={active.alt || product.title} /> : null}
              {images.length > 1 ? (
                <div className="product-thumbs" role="tablist" aria-label={product.title}>
                  {images.map((image, index) => (
                    <button key={image.url} className={index === shot ? 'is-on' : ''} type="button" role="tab" aria-selected={index === shot} onClick={() => setShot(index)}>
                      <img src={image.url} alt="" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="product-copy">
              {product.category ? <p className="kicker">{product.category}</p> : null}
              <h1>{product.title}</h1>
              <p className="product-price">{formatMoney(product.priceCents, product.currency, language)}</p>
              <p className="product-note">{product.description}</p>
              <p className="meta">{product.stock > 0 ? t(language, 'inStock') : t(language, 'outOfStock')}{product.sku ? ` · ${product.sku}` : ''}</p>
              <div className="product-buy">
                {product.colors?.length ? (
                  <div className="choice-block">
                    <span>{t(language, 'color')}{color ? ` · ${colorName(language, color)}` : ''}</span>
                    <div className="choice-row" role="radiogroup" aria-label={t(language, 'color')}>
                      {product.colors.map((item) => (
                        <button key={item.name} className={color === item.name ? 'choice is-on' : 'choice'} type="button" role="radio" aria-checked={color === item.name} onClick={() => setColor(item.name)}>
                          <i style={{ background: item.hex }} />
                          {colorName(language, item.name)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                {product.sizes?.length ? (
                  <div className="choice-block">
                    <span>{t(language, 'size')}{size ? ` · ${sizeName(language, size)}` : ''}</span>
                    <div className="choice-row" role="radiogroup" aria-label={t(language, 'size')}>
                      {product.sizes.map((item) => (
                        <button key={item} className={size === item ? 'choice is-on' : 'choice'} type="button" role="radio" aria-checked={size === item} onClick={() => setSize(item)}>
                          {sizeName(language, item)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
                <div className="choice-block">
                  <span>{t(language, 'quantity')}</span>
                  <div className="qty">
                    <button type="button" onClick={() => setQty((current) => Math.max(1, current - 1))} aria-label="-">−</button>
                    <strong>{qty}</strong>
                    <button type="button" onClick={() => setQty((current) => Math.min(max, current + 1))} aria-label="+">+</button>
                  </div>
                </div>
                <div className="product-actions">
                  <button className="btn" type="button" disabled={product.stock < 1} onClick={add}>{added ? t(language, 'addedToCart') : t(language, 'addToCart')}</button>
                  <Link className="btn-text" to="/cart">{t(language, 'cart')}</Link>
                </div>
              </div>
            </div>
          </div>
          {related.length ? (
            <section className="product-related">
              <h2>{t(language, 'relatedProducts')}</h2>
              <div className="shop-grid">
                {related.map((item) => <ProductCard key={item.id} product={item} language={language} />)}
              </div>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export function CartPage() {
  const cart = useCart();
  const { user } = useAuth();
  const { language } = usePreferences();
  const [quote, setQuote] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);
  useEffect(() => {
    if (!cart.items.length) {
      setQuote(null);
      setStatus('success');
      return undefined;
    }
    const controller = new AbortController();
    setStatus('loading');
    shopApi.quote({ items: cart.items }, controller.signal)
      .then((payload) => { setQuote(payload.data); setStatus('success'); })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setError(normalizeError(err));
        setStatus('error');
      });
    return () => controller.abort();
  }, [cart.items]);

  return (
    <div className="wrap shop-page">
      <PageHead title={t(language, 'cart')} description={t(language, 'cart')} path="/cart" noIndex />
      <header className="page-head">
        <h1>{t(language, 'cart')}</h1>
        <Link className="btn-text" to="/shop">{t(language, 'continueShop')}</Link>
      </header>
      {!cart.items.length ? <EmptyState title={t(language, 'emptyCart')} /> : null}
      {status === 'loading' ? <SkeletonRenderer variant="search" /> : null}
      {status === 'error' ? <ErrorState message={error.message} onRetry={() => setStatus('idle')} /> : null}
      {quote ? (
        <div className="cart-layout">
          <div className="cart-lines">
            {quote.lines.map((line) => {
              const key = lineKey(line);
              return (
                <article className="cart-line" key={key}>
                  {line.image?.url ? <img src={line.image.url} alt="" /> : <span className="cart-thumb" />}
                  <div>
                    <h2>{line.title}</h2>
                    <p className="meta">{[line.color ? colorName(language, line.color) : '', line.size ? sizeName(language, line.size) : ''].filter(Boolean).join(' · ')}</p>
                    <p>{formatMoney(line.unitPriceCents, line.currency, language)}</p>
                  </div>
                  <div className="qty">
                    <button type="button" onClick={() => cart.update(key, Math.max(0, line.quantity - 1))} aria-label="-">−</button>
                    <strong>{line.quantity}</strong>
                    <button type="button" onClick={() => cart.update(key, Math.min(line.stock, line.quantity + 1))} aria-label="+">+</button>
                  </div>
                  <strong>{formatMoney(line.lineTotalCents, line.currency, language)}</strong>
                  <button className="btn-text" type="button" onClick={() => cart.remove(key)}>{t(language, 'remove')}</button>
                </article>
              );
            })}
          </div>
          <aside className="cart-summary">
            <p><span>{t(language, 'subtotal')}</span> <strong>{formatMoney(quote.subtotalCents, quote.currency, language)}</strong></p>
            <p><span>{t(language, 'totalDue')}</span> <strong>{formatMoney(quote.totalCents, quote.currency, language)}</strong></p>
            {user ? null : <p className="meta">{t(language, 'checkoutNeedsAccount')}</p>}
            <Link className="btn" to={user ? '/checkout' : '/login?next=%2Fcheckout'}>{user ? t(language, 'checkout') : t(language, 'signInToCheckout')}</Link>
          </aside>
        </div>
      ) : null}
    </div>
  );
}

export function CheckoutPage() {
  const cart = useCart();
  const { user, status: authStatus } = useAuth();
  const { language } = usePreferences();
  const navigate = useNavigate();
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState('');
  const [coupon, setCoupon] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [customer, setCustomer] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
  });
  const [busy, setBusy] = useState(false);
  const [method, setMethod] = useState('payfast');

  useEffect(() => {
    if (!user) return;
    setCustomer((current) => ({
      ...current,
      name: current.name || user.name || '',
      email: user.email || '',
      phone: current.phone || user.profile?.phone || '',
    }));
  }, [user]);

  useEffect(() => {
    if (!cart.items.length) return undefined;
    const controller = new AbortController();
    shopApi.quote({ items: cart.items, couponCode: appliedCoupon }, controller.signal)
      .then((payload) => { setQuote(payload.data); setError(''); })
      .catch((err) => { if (err?.name !== 'AbortError') setError(normalizeError(err).message); });
    return () => controller.abort();
  }, [cart.items, appliedCoupon]);

  async function submit(event) {
    event.preventDefault();
    const phone = String(customer.phone || '').replace(/\D/g, '').replace(/^92/, '0');
    if (!/^03\d{9}$/.test(phone)) {
      setError(t(language, 'phoneInvalid'));
      return;
    }
    if (method !== 'cod' && method !== 'payfast') {
      setError(t(language, 'payMethod'));
      return;
    }
    setBusy(true);
    setError('');
    try {
      const payload = await shopApi.createOrder({
        items: cart.items,
        couponCode: appliedCoupon,
        customer: { ...customer, phone },
        method,
      });
      const order = payload.data.order;
      sessionStorage.setItem(orderKeyName(order.id), payload.data.accessKey);
      cart.clear();
      if (method === 'payfast' && payload.data.payfastReady) {
        try {
          const checkout = await shopApi.pay(order.id);
          submitPayfast(checkout.data);
          return;
        } catch {
          navigate(`/orders/${order.id}?result=failed`);
          return;
        }
      }
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  }

  if (authStatus !== 'ready') {
    return <div className="wrap shop-page"><SkeletonRenderer variant="detail" /></div>;
  }
  if (!user) return <Navigate to="/login?next=%2Fcheckout" replace />;

  if (!cart.items.length) {
    return (
      <div className="wrap shop-page">
        <EmptyState title={t(language, 'emptyCart')} />
        <p><Link to="/shop">{t(language, 'continueShop')}</Link></p>
      </div>
    );
  }

  return (
    <div className="wrap shop-page">
      <PageHead title={t(language, 'checkout')} path="/checkout" noIndex />
      <header className="page-head">
        <div>
          <h1>{t(language, 'checkout')}</h1>
          <p className="shop-lede">{t(language, 'checkoutFlow')}</p>
        </div>
      </header>
      <form className="checkout-layout" onSubmit={submit}>
        <div className="donate-fields">
          <label className="field">
            <span>{t(language, 'name')}</span>
            <input required autoComplete="name" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} />
          </label>
          <label className="field">
            <span>{t(language, 'phone')}</span>
            <input required type="tel" inputMode="tel" autoComplete="tel" placeholder="03XXXXXXXXX" value={customer.phone} onChange={(event) => setCustomer({ ...customer, phone: event.target.value })} />
          </label>
          <label className="field">
            <span>{t(language, 'address')}</span>
            <input required autoComplete="street-address" value={customer.address} onChange={(event) => setCustomer({ ...customer, address: event.target.value })} />
          </label>
          <label className="field">
            <span>{t(language, 'email')}</span>
            <input readOnly value={customer.email} />
          </label>
          <p className="meta">{t(language, 'signedInAs')} {user.email}</p>
          <fieldset className="pay-choice-row">
            <legend>{t(language, 'payMethod')}</legend>
            <button type="button" className={method === 'payfast' ? 'pay-choice is-on' : 'pay-choice'} aria-pressed={method === 'payfast'} onClick={() => setMethod('payfast')}>
              <strong>{t(language, 'payfastShop')}</strong>
              <small>{t(language, 'payfastShopHint')}</small>
            </button>
            <button type="button" className={method === 'cod' ? 'pay-choice is-on' : 'pay-choice'} aria-pressed={method === 'cod'} onClick={() => setMethod('cod')}>
              <strong>{t(language, 'cashOnDelivery')}</strong>
              <small>{t(language, 'codHint')}</small>
            </button>
          </fieldset>
          <label className="field">
            <span>{t(language, 'coupon')}</span>
            <span className="coupon-row">
              <input value={coupon} onChange={(event) => setCoupon(event.target.value)} />
              <button className="copy-btn" type="button" onClick={() => setAppliedCoupon(coupon.trim())}>{t(language, 'applyCoupon')}</button>
            </span>
          </label>
        </div>
        <aside className="cart-summary">
          {quote?.lines.map((line) => (
            <p key={lineKey(line)}>
              <span>{line.title} · {colorName(language, line.color)} · {sizeName(language, line.size)} × {line.quantity}</span>
              <strong>{formatMoney(line.lineTotalCents, line.currency, language)}</strong>
            </p>
          ))}
          {quote ? <p><span>{t(language, 'subtotal')}</span> <strong>{formatMoney(quote.subtotalCents, quote.currency, language)}</strong></p> : null}
          {quote?.discountCents ? <p><span>{t(language, 'discount')}</span> <strong>{formatMoney(quote.discountCents, quote.currency, language)}</strong></p> : null}
          {quote ? <p><span>{t(language, 'totalDue')}</span> <strong>{formatMoney(quote.totalCents, quote.currency, language)}</strong></p> : null}
          <p className="meta">{t(language, 'orderMailNote')}</p>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn" disabled={busy || !quote} type="submit">
            {method === 'payfast' ? (busy ? t(language, 'paying') : t(language, 'payWithPayfast')) : (busy ? t(language, 'placingOrder') : t(language, 'placeOrder'))}
          </button>
        </aside>
      </form>
    </div>
  );
}

export function OrdersPage() {
  const { language } = usePreferences();
  const inAccount = Boolean(useMatch('/account/orders'));
  const query = useQuery(useCallback((signal) => shopApi.myOrders({ limit: 20 }, signal), []));
  return (
    <div className={inAccount ? 'account-page' : 'wrap shop-page'}>
      <PageHead title={t(language, 'myOrders')} path={inAccount ? '/account/orders' : '/orders'} noIndex />
      <header className={inAccount ? 'account-head' : 'page-head'}><h1>{t(language, 'myOrders')}</h1></header>
      <div className={inAccount ? 'account-card account-list' : 'order-sheet'}>
        {query.status === 'loading' ? (inAccount ? <div className="account-skel" aria-hidden="true"><span /><span /><span /></div> : <SkeletonRenderer variant="search" />) : null}
        {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} /> : null}
        {query.status === 'success' && !query.data.length ? <EmptyState title={t(language, 'noOrders')} /> : null}
        <ul className="order-list">
          {query.data?.map((order) => (
            <li key={order.id}>
              <div>
                <Link to={`/orders/${order.id}`}>{t(language, 'orderNumber')} {order.id}</Link>
                <p className="meta">{formatDate(order.createdAt, language)} · {t(language, orderStatusKey(order))}</p>
              </div>
              <strong>{formatMoney(order.totalCents, order.currency, language)}</strong>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function orderStatusKey(order) {
  if (order.status === 'paid') return 'orderPaid';
  if (order.status === 'cancelled') return 'trackCancelled';
  if (order.payment?.provider === 'cod' || order.method === 'cod') return 'trackCod';
  return 'trackPayfast';
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { language } = usePreferences();
  const { user } = useAuth();
  const key = sessionStorage.getItem(orderKeyName(id)) || '';
  const query = useQuery(useCallback((signal) => shopApi.order(id, key, signal), [id, key]));
  const [payError, setPayError] = useState('');
  const [paying, setPaying] = useState(false);
  const order = query.data;
  const cancelled = order?.status === 'cancelled';
  const recorded = order?.status === 'paid';
  const cod = order?.payment?.provider === 'cod' || order?.method === 'cod';
  const result = params.get('result');
  const steps = cod
    ? [['trackPlaced', true], ['trackCod', recorded], ['orderPaid', recorded]]
    : [['trackPlaced', true], ['trackPayfast', recorded], ['orderPaid', recorded]];

  async function payAgain() {
    setPaying(true);
    setPayError('');
    try {
      const payload = await shopApi.pay(id);
      submitPayfast(payload.data);
    } catch (err) {
      setPayError(normalizeError(err).message);
      setPaying(false);
    }
  }
  return (
    <div className="wrap shop-page">
      <PageHead title={t(language, 'order')} path={`/orders/${id}`} noIndex />
      {query.status === 'loading' ? <SkeletonRenderer variant="detail" /> : null}
      {query.status === 'error' ? <ErrorState message={query.error.message} onRetry={query.reload} backTo="/account/orders" /> : null}
      {order ? (
        <>
          <header className="page-head">
            <div>
              <p className="desk-kicker">{t(language, 'orderNumber')}</p>
              <h1>{order.id}</h1>
              <p className="shop-lede">
                {cancelled
                  ? t(language, 'trackCancelled')
                  : recorded || result === 'paid'
                    ? t(language, 'orderPaid')
                    : result === 'failed'
                      ? t(language, 'orderFailed')
                      : cod
                        ? t(language, 'codPlaced')
                        : (order.payfastReady === false ? t(language, 'payfastOrderMissing') : t(language, 'orderPayfastNote'))}
              </p>
            </div>
          </header>
          {cancelled ? null : (
            <ol className="order-track">
              {steps.map(([label, done], index) => (
                <li key={label} className={done ? 'is-done' : index === 1 && !recorded ? 'is-now' : ''}>
                  <i />
                  <span>{t(language, label)}</span>
                </li>
              ))}
            </ol>
          )}
          <div className="cart-lines">
            {order.items.map((item) => (
              <article className="cart-line is-plain" key={`${item.slug}-${item.color}-${item.size}`}>
                <div>
                  <h2>{item.title}</h2>
                  <p className="meta">{[item.color ? colorName(language, item.color) : '', item.size ? sizeName(language, item.size) : '', `× ${item.quantity}`].filter(Boolean).join(' · ')}</p>
                </div>
                <strong>{formatMoney(item.lineTotalCents, order.currency, language)}</strong>
              </article>
            ))}
          </div>
          <aside className="cart-summary order-total">
            <p><span>{t(language, 'totalDue')}</span> <strong>{formatMoney(order.totalCents, order.currency, language)}</strong></p>
            <p className="meta">{order.customer?.name}</p>
            <p className="meta">{order.customer?.email}</p>
            <p className="meta">{order.customer?.phone}</p>
            <p className="meta">{order.customer?.address}</p>
            <p className="meta">{formatDate(order.createdAt, language)} · {t(language, orderStatusKey(order))}</p>
            {payError ? <p className="form-error">{payError}</p> : null}
            {!cod && !recorded && !cancelled && order.payfastReady !== false ? (
              <button className="btn" type="button" disabled={paying} onClick={payAgain}>{paying ? t(language, 'paying') : t(language, 'payAgain')}</button>
            ) : null}
            {user ? <Link className="btn" to="/account/orders">{t(language, 'myOrders')}</Link> : null}
            <Link className="btn-text" to="/shop">{t(language, 'continueShop')}</Link>
          </aside>
        </>
      ) : null}
    </div>
  );
}
