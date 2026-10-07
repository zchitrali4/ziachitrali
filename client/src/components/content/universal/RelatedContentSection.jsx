import { usePreferences } from '../../../context/PreferencesContext.jsx';
import { t } from '../../../utils/i18n.js';
import { ContentGrid } from './ContentGrid.jsx';
import { SectionHeading } from './SectionHeading.jsx';

export function RelatedContentSection({ items = [] }) {
  const { language } = usePreferences();
  if (!items.length) return null;
  return (
    <section className="section">
      <SectionHeading title={t(language, 'related')} />
      <ContentGrid items={items} variant="related" columns={4} />
    </section>
  );
}
