import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from 'lucide-react';
import GlobalTypeset from './GlobalTypeset';
import { useI18n } from '../i18n/I18nContext';

export function ListingIntake() {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [agentName, setAgentName] = useState('');
  const [agentEmail, setAgentEmail] = useState('');
  const [agentPhone, setAgentPhone] = useState('');
  const [agentBrokerage, setAgentBrokerage] = useState('');
  const [status, setStatus] = useState<'idle' | 'processing' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [progress, setProgress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!url.trim()) {
      return;
    }

    setStatus('processing');
    setProgress(t('intake.starting'));
    setErrorMessage('');

    try {
      const response = await fetch('/api/listings/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: url.trim(),
          agent: {
            name: agentName.trim() || undefined,
            email: agentEmail.trim() || undefined,
            phone: agentPhone.trim() || undefined,
            brokerage: agentBrokerage.trim() || undefined
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to process listing');
      }

      const data = await response.json();

      // Redirect to the manage page (designs generated there)
      navigate(`${data.url}/manage`);
    } catch (error) {
      console.error('Intake error:', error);
      setStatus('error');
      setErrorMessage(error instanceof Error ? error.message : t('intake.failed'));
    }
  };

  return (
    <div className="min-h-screen bg-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-950">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <a href="/" className="text-emerald-500 text-2xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Room
          </a>
          <p className="text-stone-400 mt-2">{t('intake.tagline')}</p>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-5 py-8 md:py-12">
        <div className="mb-8">
          <h1
            className="text-2xl md:text-4xl font-bold text-stone-100 mb-3"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {t('intake.title')}
          </h1>
          <p className="text-stone-400 text-sm md:text-base">
            {t('intake.subtitle')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* URL Input */}
          <div>
            <label htmlFor="url" className="block text-stone-200 font-medium mb-2">
              {t('intake.listingURL')} <span className="text-emerald-500">*</span>
            </label>
            <input
              type="text"
              id="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder={t('intake.placeholder')}
              required
              disabled={status === 'processing'}
              className="w-full px-4 py-3 bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-600 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
            />
          </div>

          {/* Optional Agent Info */}
          <div className="border-t border-stone-800 pt-6">
            <h2 className="text-lg font-bold text-stone-200 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('intake.agentInfo')} <span className="text-stone-500 text-xs font-normal">({t('intake.optional')})</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="agent-name" className="block text-stone-300 text-sm mb-2">
                  {t('onboard.name')}
                </label>
                <input
                  type="text"
                  id="agent-name"
                  value={agentName}
                  onChange={e => setAgentName(e.target.value)}
                  disabled={status === 'processing'}
                  className="w-full px-4 py-2 bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-600 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="agent-email" className="block text-stone-300 text-sm mb-2">
                  {t('onboard.email')}
                </label>
                <input
                  type="text"
                  id="agent-email"
                  value={agentEmail}
                  onChange={e => setAgentEmail(e.target.value)}
                  disabled={status === 'processing'}
                  className="w-full px-4 py-2 bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-600 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="agent-phone" className="block text-stone-300 text-sm mb-2">
                  {t('onboard.phone')}
                </label>
                <input
                  type="text"
                  id="agent-phone"
                  value={agentPhone}
                  onChange={e => setAgentPhone(e.target.value)}
                  disabled={status === 'processing'}
                  className="w-full px-4 py-2 bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-600 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                />
              </div>

              <div>
                <label htmlFor="agent-brokerage" className="block text-stone-300 text-sm mb-2">
                  {t('onboard.brokerage')}
                </label>
                <input
                  type="text"
                  id="agent-brokerage"
                  value={agentBrokerage}
                  onChange={e => setAgentBrokerage(e.target.value)}
                  disabled={status === 'processing'}
                  className="w-full px-4 py-2 bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-600 focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={status === 'processing' || !url.trim()}
              className="w-full md:w-auto px-8 py-4 bg-emerald-500 text-stone-900 font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {status === 'processing' ? (
                <>
                  <div className="inline-block w-5 h-5 border-2 border-stone-900 border-t-transparent rounded-full animate-spin" />
                  {t('intake.processing')}
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  {t('intake.processListing')}
                </>
              )}
            </button>
          </div>

          {/* Progress/Status */}
          {status === 'processing' && progress && (
            <div className="bg-stone-950 border border-stone-800 p-4">
              <p className="text-stone-300">{progress}</p>
              <p className="text-stone-500 text-sm mt-2">
                {t('intake.mayTakeMinutes')}
              </p>
            </div>
          )}

          {status === 'error' && errorMessage && (
            <div className="bg-red-950 border border-red-800 p-4">
              <p className="text-red-300 font-medium">{t('intake.error')}</p>
              <p className="text-red-200 text-sm mt-1">{errorMessage}</p>
            </div>
          )}
        </form>

        {/* Info Box */}
        <div className="mt-12 bg-stone-950 border border-stone-800 p-5">
          <h3 className="text-sm font-bold text-stone-200 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            {t('intake.howItWorks')}
          </h3>
          <ol className="text-stone-400 space-y-1.5 text-xs" style={{ fontFamily: 'Nunito, sans-serif' }}>
            <li>{t('intake.step1')}</li>
            <li>{t('intake.step2')}</li>
            <li>{t('intake.step3')}</li>
            <li>{t('intake.step4')}</li>
          </ol>
          <p className="text-stone-600 text-[10px] mt-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
            {t('intake.platforms')}
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-stone-800 py-6 mt-12">
        <p data-no-smooth className="max-w-4xl mx-auto px-6 text-center text-stone-600 text-[11px]" style={{ fontFamily: 'Nunito, sans-serif' }}>
          {t('footer.poweredByFull')}
        </p>
      </footer>

      <GlobalTypeset />
    </div>
  );
}
