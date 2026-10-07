import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AuthLayout } from '../components/layout/AuthLayout.jsx';
import { PublicLayout } from '../components/layout/PublicLayout.jsx';
import { SkeletonRenderer } from '../components/skeletons/SkeletonRenderer.jsx';
import { ADMIN_RESOURCES } from '../config/adminResources.js';
import { CONTENT_REGISTRY } from '../config/contentRegistry.js';
import { RequireAdmin, RequireAuth } from './guards.jsx';

const pick = (loader, name) => lazy(() => loader().then((module) => ({ default: module[name] })));

const HomePage = lazy(() => import('../pages/public/HomePage.jsx'));
const ContentListPage = lazy(() => import('../pages/public/ContentListPage.jsx'));
const ContentDetailPage = lazy(() => import('../pages/public/ContentDetailPage.jsx'));
const SearchPage = lazy(() => import('../pages/public/SearchPage.jsx'));
const CategoryPage = lazy(() => import('../pages/public/CategoryPage.jsx'));
const AuthorPage = lazy(() => import('../pages/public/AuthorPage.jsx'));
const CmsPage = lazy(() => import('../pages/public/CmsPage.jsx'));
const library = () => import('../pages/public/LibraryPages.jsx');
const DonatePage = lazy(() => import('../pages/public/DonatePage.jsx'));
const NewsletterPage = lazy(() => import('../pages/public/NewsletterPage.jsx'));
const AboutPage = pick(library, 'AboutPage');
const ContactPage = pick(library, 'ContactPage');
const PrivacyPage = pick(library, 'PrivacyPage');
const TermsPage = pick(library, 'TermsPage');
const MissingPage = pick(library, 'MissingPage');

const tags = () => import('../pages/public/TagsPage.jsx');
const podcasts = () => import('../pages/public/PodcastPages.jsx');
const shop = () => import('../pages/public/ShopPages.jsx');
const auth = () => import('../pages/auth/AuthPages.jsx');
const account = () => import('../pages/account/AccountPages.jsx');
const admin = () => import('../pages/admin/AdminPages.jsx');

const TagsIndexPage = pick(tags, 'TagsIndexPage');
const TagDetailPage = pick(tags, 'TagDetailPage');
const PodcastListPage = pick(podcasts, 'PodcastListPage');
const PodcastShowPage = pick(podcasts, 'PodcastShowPage');
const PodcastEpisodePage = pick(podcasts, 'PodcastEpisodePage');
const ShopPage = pick(shop, 'ShopPage');
const ProductPage = pick(shop, 'ProductPage');
const CartPage = pick(shop, 'CartPage');
const CheckoutPage = pick(shop, 'CheckoutPage');
const OrdersPage = pick(shop, 'OrdersPage');
const OrderDetailPage = pick(shop, 'OrderDetailPage');
const LoginPage = pick(auth, 'LoginPage');
const RegisterPage = pick(auth, 'RegisterPage');
const ForgotPasswordPage = pick(auth, 'ForgotPasswordPage');
const ResetPasswordPage = pick(auth, 'ResetPasswordPage');
const VerifyEmailPage = pick(auth, 'VerifyEmailPage');
const AccountLayout = pick(account, 'AccountLayout');
const AccountHome = pick(account, 'AccountHome');
const ProfilePage = pick(account, 'ProfilePage');
const SettingsPage = pick(account, 'SettingsPage');
const BookmarksPage = pick(account, 'BookmarksPage');
const LikesPage = pick(account, 'LikesPage');
const ReadingHistoryPage = pick(account, 'ReadingHistoryPage');
const AdminLayout = pick(admin, 'AdminLayout');
const DashboardPage = pick(admin, 'DashboardPage');
const AdminContentPage = pick(admin, 'AdminContentPage');
const AdminResourcePage = pick(admin, 'AdminResourcePage');
const AdminCommentsPage = pick(admin, 'AdminCommentsPage');
const AdminOrdersPage = pick(admin, 'AdminOrdersPage');
const AdminDonationsPage = pick(admin, 'AdminDonationsPage');
const AdminMessagesPage = pick(admin, 'AdminMessagesPage');
const AdminMenusPage = pick(admin, 'AdminMenusPage');
const AdminSettingsPage = pick(admin, 'AdminSettingsPage');

function Page({ children }) {
  return <Suspense fallback={<div className="wrap"><SkeletonRenderer variant="contentGrid" /></div>}>{children}</Suspense>;
}

function NotFound() {
  return <Page><MissingPage /></Page>;
}

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<Page><HomePage /></Page>} />
        {CONTENT_REGISTRY.map((type) => (
          <Route key={type.key} path={type.route.slice(1)} element={<Page><ContentListPage typeKey={type.key} /></Page>} />
        ))}
        {CONTENT_REGISTRY.map((type) => (
          <Route key={`${type.key}-detail`} path={`${type.route.slice(1)}/:slug`} element={<Page><ContentDetailPage typeKey={type.key} /></Page>} />
        ))}
        <Route path="search" element={<Page><SearchPage /></Page>} />
        <Route path="categories/:slug" element={<Page><CategoryPage /></Page>} />
        <Route path="authors/:slug" element={<Page><AuthorPage /></Page>} />
        <Route path="tags" element={<Page><TagsIndexPage /></Page>} />
        <Route path="tags/:slug" element={<Page><TagDetailPage /></Page>} />
        <Route path="podcasts" element={<Page><PodcastListPage /></Page>} />
        <Route path="podcasts/:showSlug" element={<Page><PodcastShowPage /></Page>} />
        <Route path="podcasts/:showSlug/:episodeSlug" element={<Page><PodcastEpisodePage /></Page>} />
        <Route path="shop" element={<Page><ShopPage /></Page>} />
        <Route path="products/:slug" element={<Page><ProductPage /></Page>} />
        <Route path="cart" element={<Page><CartPage /></Page>} />
        <Route path="checkout" element={<Page><CheckoutPage /></Page>} />
        <Route path="orders" element={<Page><RequireAuth><OrdersPage /></RequireAuth></Page>} />
        <Route path="orders/:id" element={<Page><OrderDetailPage /></Page>} />
        <Route path="donate" element={<Page><DonatePage /></Page>} />
        <Route path="newsletter" element={<Page><NewsletterPage /></Page>} />
        <Route path="about" element={<Page><AboutPage /></Page>} />
        <Route path="privacy" element={<Page><PrivacyPage /></Page>} />
        <Route path="terms" element={<Page><TermsPage /></Page>} />
        <Route path="contact" element={<Page><ContactPage /></Page>} />
        <Route path="pages/:slug" element={<Page><CmsPage /></Page>} />
        <Route path="account" element={<Page><RequireAuth><AccountLayout /></RequireAuth></Page>}>
          <Route index element={<AccountHome />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="bookmarks" element={<BookmarksPage />} />
          <Route path="likes" element={<LikesPage />} />
          <Route path="reading-history" element={<ReadingHistoryPage />} />
          <Route path="orders" element={<OrdersPage />} />
        </Route>
      </Route>
      <Route element={<AuthLayout />}>
        <Route path="login" element={<Page><LoginPage /></Page>} />
        <Route path="register" element={<Page><RegisterPage /></Page>} />
        <Route path="forgot-password" element={<Page><ForgotPasswordPage /></Page>} />
        <Route path="reset-password" element={<Page><ResetPasswordPage /></Page>} />
        <Route path="verify-email" element={<Page><VerifyEmailPage /></Page>} />
      </Route>
      <Route path="/admin" element={<Page><RequireAdmin><AdminLayout /></RequireAdmin></Page>}>
        <Route index element={<DashboardPage />} />
        <Route path="content" element={<AdminContentPage />} />
        <Route path="comments" element={<AdminCommentsPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="donations" element={<AdminDonationsPage />} />
        <Route path="messages" element={<AdminMessagesPage />} />
        <Route path="menus" element={<AdminMenusPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
        {Object.keys(ADMIN_RESOURCES).map((resource) => (
          <Route key={resource} path={resource} element={<AdminResourcePage resource={resource} />} />
        ))}
      </Route>
      <Route path="*" element={<PublicLayout />}>
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
