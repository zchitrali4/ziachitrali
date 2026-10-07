import { Link } from 'react-router-dom';
import { NewsletterForm } from '../newsletter/NewsletterForm.jsx';

export function SupportBand() {
  return (
    <section className="band-dark">
      <div className="wrap support">
        <div>
          <p className="kicker">Support the library</p>
          <h2>Donations stay pending until a payment provider is connected.</h2>
          <p>You can record a donation intention. It will not be marked as paid.</p>
          <Link className="btn" to="/donate" style={{ marginTop: '0.8rem' }}>Donate</Link>
        </div>
        <div>
          <p className="kicker">Newsletter</p>
          <NewsletterForm compact />
        </div>
      </div>
    </section>
  );
}
