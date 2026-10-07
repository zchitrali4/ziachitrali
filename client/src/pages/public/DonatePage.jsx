import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { donationApi } from '../../api/index.js';
import { EmptyState } from '../../components/content/universal/EmptyState.jsx';
import { ErrorState } from '../../components/content/universal/ErrorState.jsx';
import { PageHead } from '../../components/public/PageHead.jsx';
import { SkeletonRenderer } from '../../components/skeletons/SkeletonRenderer.jsx';
import { GIFT_AMOUNTS } from '../../config/giving.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { usePreferences } from '../../context/PreferencesContext.jsx';
import { useQuery } from '../../hooks/useQuery.js';
import { normalizeError } from '../../utils/errors.js';
import { formatMoney } from '../../utils/format.js';
import { t } from '../../utils/i18n.js';
import { submitPayfast } from '../../utils/payfast.js';

const MOBILE = /^03\d{9}$/;

function cleanMobile(value) {
  let digits = String(value || '').replace(/[^\d]/g, '');
  if (digits.startsWith('92') && digits.length === 12) digits = `0${digits.slice(2)}`;
  return digits;
}

export default function DonatePage() {
  const { user } = useAuth();
  const { language } = usePreferences();
  const [params] = useSearchParams();
  const ref = params.get('ref') || '';
  const returned = params.get('result') || '';
  const campaigns = useQuery(useCallback((signal) => donationApi.campaigns({ limit: 20 }, signal), []));
  const saved = useQuery(useCallback((signal) => (ref ? donationApi.gift(ref, signal) : Promise.resolve({ data: null })), [ref]));
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    campaignId: '',
    amount: '1000',
    donorName: user?.name || '',
    donorEmail: user?.email || '',
    phone: '',
    message: '',
    anonymous: false,
  });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm((current) => ({
      ...current,
      donorName: current.donorName || user.name || '',
      donorEmail: current.donorEmail || user.email || '',
    }));
  }, [user]);

  useEffect(() => {
    const first = campaigns.data?.[0];
    if (!first) return;
    setForm((current) => (current.campaignId ? current : { ...current, campaignId: first.id }));
  }, [campaigns.data]);

  const campaign = campaigns.data?.find((item) => item.id === form.campaignId) || campaigns.data?.[0];
  const amountNumber = Number(form.amount);
  const amountCents = Number.isFinite(amountNumber) ? Math.round(amountNumber * 100) : 0;
  const raised = campaign ? Math.min(100, (campaign.raisedAmountCents / Math.max(campaign.goalAmountCents, 1)) * 100) : 0;
  const receipt = result || (ref ? saved.data : null);
  const mobile = cleanMobile(form.phone);

  function setField(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function goDetails(event) {
    event.preventDefault();
    if (!campaign || amountCents < 100) {
      setError(t(language, 'amountRequired'));
      return;
    }
    setError('');
    setStep(2);
  }

  function goPayment(event) {
    event.preventDefault();
    if (!form.donorName.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.donorEmail.trim())) {
      setError(t(language, 'nameEmailRequired'));
      return;
    }
    if (!MOBILE.test(mobile)) {
      setError(t(language, 'phoneInvalid'));
      return;
    }
    setError('');
    setStep(3);
  }

  async function openPayfast(reference) {
    const pay = await donationApi.pay(reference);
    submitPayfast(pay.data);
  }

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      const payload = await donationApi.create({
        campaignId: form.campaignId,
        amountCents,
        donorName: form.donorName,
        donorEmail: form.donorEmail,
        phone: mobile,
        message: form.message.trim(),
        anonymous: form.anonymous,
      });
      if (payload.data.payfastReady) {
        await openPayfast(payload.data.reference);
        return;
      }
      setResult(payload.data);
    } catch (err) {
      setError(normalizeError(err).message);
    } finally {
      setBusy(false);
    }
  }

  async function retryPay() {
    if (!receipt?.reference) return;
    setBusy(true);
    setError('');
    try {
      await openPayfast(receipt.reference);
    } catch (err) {
      setError(normalizeError(err).message);
      setBusy(false);
    }
  }

  const paid = receipt?.status === 'paid';
  const steps = [
    ['stepCause', 1],
    ['stepPerson', 2],
    ['stepPay', 3],
  ];

  function summary() {
    if (!campaign) return null;
    return (
      <aside className="donate-summary">
        <p className="kicker">{t(language, 'summary')}</p>
        <h2>{formatMoney(Math.max(amountCents, 0), campaign.currency, language)}</h2>
        <p className="summary-line"><span>{t(language, 'causeLabel')}</span><strong>{campaign.title}</strong></p>
        {step > 1 ? <p className="summary-line"><span>{t(language, 'name')}</span><strong>{form.anonymous ? t(language, 'anonymousGift') : form.donorName}</strong></p> : null}
        {step > 2 ? <p className="summary-line"><span>{t(language, 'phone')}</span><strong>{mobile}</strong></p> : null}
        <p className="meta">{t(language, 'payfastBody')}</p>
      </aside>
    );
  }

  return (
    <div className="wrap donate-page">
      <PageHead title={t(language, 'donate')} description={t(language, 'donateLede')} path="/donate" />
      <header className="donate-head">
        <p className="kicker">{t(language, 'donate')}</p>
        <h1>{t(language, 'donate')}</h1>
        <p className="donate-lede">{t(language, 'donateLede')}</p>
      </header>

      {campaigns.status === 'loading' || (ref && saved.status === 'loading') ? <SkeletonRenderer variant="detail" /> : null}
      {campaigns.status === 'error' ? <ErrorState message={t(language, 'causesUnavailable')} onRetry={campaigns.reload} /> : null}
      {ref && saved.status === 'error' ? <ErrorState message={saved.error.message} onRetry={saved.reload} /> : null}
      {campaigns.status === 'success' && !campaigns.data.length ? <EmptyState title={t(language, 'noCampaigns')} /> : null}

      {receipt ? (
        <section className="gift-receipt panel" role="status">
          <p className="kicker">{paid ? t(language, 'giftPaid') : t(language, 'reference')}</p>
          <h2>{receipt.reference}</h2>
          <p className="summary-total">{formatMoney(receipt.amountCents, receipt.currency, language)}</p>
          <p>{receipt.campaign?.title}</p>
          <p className="donate-lede">{paid ? t(language, 'giftPaid') : (receipt.payfastReady === false ? t(language, 'payfastMissing') : t(language, 'payfastBody'))}</p>
          {returned === 'failed' && !paid ? <p className="form-error">{t(language, 'giftFailed')}</p> : null}
          {returned === 'unverified' ? <p className="form-error">{t(language, 'giftUnverified')}</p> : null}
          {error ? <p className="form-error">{error}</p> : null}
          <div className="gift-actions">
            <Link className="copy-btn" to="/donate">{t(language, 'giveAgain')}</Link>
            {!paid && receipt.payfastReady !== false ? (
              <button className="btn" type="button" disabled={busy} onClick={retryPay}>{busy ? t(language, 'paying') : t(language, 'payAgain')}</button>
            ) : null}
          </div>
        </section>
      ) : null}

      {campaign && !receipt && campaigns.status === 'success' ? (
        <form className="donate-form" onSubmit={step === 1 ? goDetails : step === 2 ? goPayment : submit}>
          <ol className="gift-steps" aria-label={t(language, 'donate')}>
            {steps.map(([key, number]) => (
              <li key={key} className={step === number ? 'is-on' : step > number ? 'is-done' : ''}>
                <span>{number}</span> {t(language, key)}
              </li>
            ))}
          </ol>
          <div className="donate-layout">
            <div>
              {step === 1 ? (
                <>
                  <div className="cause-grid">
                    {campaigns.data.map((item) => (
                      <button key={item.id} className={form.campaignId === item.id ? 'cause is-on' : 'cause'} type="button" onClick={() => setField('campaignId', item.id)}>
                        <strong>{item.title}</strong>
                        <span>{item.summary}</span>
                      </button>
                    ))}
                  </div>
                  <section className="donate-progress" aria-label={campaign.title}>
                    <p className="meta">{t(language, 'forCampaign')} {campaign.title}</p>
                    <div className="donate-bar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(raised)}>
                      <span style={{ width: `${raised}%` }} />
                    </div>
                    <p className="meta">
                      {formatMoney(campaign.raisedAmountCents, campaign.currency, language)} {t(language, 'raisedOf')} {formatMoney(campaign.goalAmountCents, campaign.currency, language)}
                    </p>
                  </section>
                  <div className="field">
                    <span>{t(language, 'amount')}</span>
                    <div className="amount-row" role="group" aria-label={t(language, 'amount')}>
                      {GIFT_AMOUNTS.map((value) => (
                        <button key={value} className={form.amount === String(value) ? 'amount-chip is-on' : 'amount-chip'} type="button" onClick={() => setField('amount', String(value))}>
                          {formatMoney(value * 100, campaign.currency, language)}
                        </button>
                      ))}
                    </div>
                    <label className="field">
                      <span>{t(language, 'otherAmount')}</span>
                      <input required inputMode="decimal" min="1" step="1" value={form.amount} onChange={(event) => setField('amount', event.target.value)} />
                    </label>
                  </div>
                </>
              ) : null}

              {step === 2 ? (
                <section className="donate-section">
                  <h2>{t(language, 'stepPerson')}</h2>
                  <div className="donate-fields">
                    <div className="donate-pair">
                      <label className="field"><span>{t(language, 'name')}</span><input required autoComplete="name" value={form.donorName} onChange={(event) => setField('donorName', event.target.value)} /></label>
                      <label className="field"><span>{t(language, 'email')}</span><input required type="email" autoComplete="email" value={form.donorEmail} onChange={(event) => setField('donorEmail', event.target.value)} /></label>
                    </div>
                    <label className="field"><span>{t(language, 'phone')}</span><input required type="tel" autoComplete="tel" inputMode="tel" placeholder="03XXXXXXXXX" value={form.phone} onChange={(event) => setField('phone', event.target.value)} /></label>
                    <label className="field"><span>{t(language, 'note')}</span><textarea value={form.message} onChange={(event) => setField('message', event.target.value)} rows={3} /></label>
                    <label className="auth-check"><input type="checkbox" checked={form.anonymous} onChange={(event) => setField('anonymous', event.target.checked)} /> {t(language, 'anonymousGift')}</label>
                  </div>
                </section>
              ) : null}

              {step === 3 ? (
                <section className="donate-section">
                  <h2>{t(language, 'stepPay')}</h2>
                  <p className="donate-lede">{t(language, 'payfastBody')}</p>
                  <div className="pay-static-row">
                    <div className="pay-static"><strong>{t(language, 'bankTransfer')}</strong><small>{t(language, 'payOnNext')}</small></div>
                    <div className="pay-static"><strong>{t(language, 'easyPaisa')}</strong><small>{t(language, 'payOnNext')}</small></div>
                    <div className="pay-static"><strong>{t(language, 'jazzCash')}</strong><small>{t(language, 'payOnNext')}</small></div>
                  </div>
                </section>
              ) : null}

              {error ? <p className="form-error">{error}</p> : null}
              <div className="gift-actions">
                {step > 1 ? <button className="copy-btn" type="button" onClick={() => { setError(''); setStep(step - 1); }}>{t(language, 'backStep')}</button> : null}
                <button className="btn" disabled={busy} type="submit">
                  {step === 3 ? (busy ? t(language, 'paying') : t(language, 'payWithPayfast')) : t(language, 'nextStep')}
                </button>
              </div>
            </div>
            {summary()}
          </div>
        </form>
      ) : null}
    </div>
  );
}
