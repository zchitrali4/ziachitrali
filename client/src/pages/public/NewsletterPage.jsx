import { NewsletterForm } from '../../components/newsletter/NewsletterForm.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { t } from '../../utils/i18n.js';

export default function NewsletterPage() {
  const { language } = usePreferences();
  return (
    <div className="wrap wrap-narrow" style={{ paddingBlock: '1.5rem' }}>
      <PageHead title={t(language, 'newsletter')} description={t(language, 'newsletterNote')} path="/newsletter" />
      <h1>{t(language, 'newsletter')}</h1>
      <p>{t(language, 'newsletterLede')}</p>
      <NewsletterForm />
    </div>
  );
}
