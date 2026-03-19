import React, { useState, useRef, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import GlobalTypeset from './GlobalTypeset';
import PortraitCrop from './PortraitCrop';
import { useI18n } from '../i18n/I18nContext';

const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tbmaJvWmkumAPUuI133fXw_JcHXJU4o';

interface Portrait {
  url: string;
  combo: Record<string, string>;
}

type Step = 'info' | 'photo' | 'generating' | 'choose' | 'crop' | 'complete';

export default function AgentOnboarding() {
  const { t } = useI18n();
  const [step, setStep] = useState<Step>('info');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [license, setLicense] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');

  const [originalUrl, setOriginalUrl] = useState('');
  const [portraits, setPortraits] = useState<Portrait[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [agentId, setAgentId] = useState('');
  const [error, setError] = useState('');
  const [generating, setGenerating] = useState(false);
  const [croppedUrl, setCroppedUrl] = useState('');
  const [finalPortraitUrl, setFinalPortraitUrl] = useState('');
  const [updatingListings, setUpdatingListings] = useState(false);
  const [listingsUpdated, setListingsUpdated] = useState<'none' | 'all' | 'current'>('none');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [searchParams] = useSearchParams();

  // Load existing agent and portrait options if returning
  useEffect(() => {
    const existingId = searchParams.get('agent');
    if (!existingId) return;

    fetch(`${SUPABASE_URL}/rest/v1/agents?id=eq.${existingId}&select=*`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
    })
      .then(r => r.json())
      .then(data => {
        const agent = data?.[0];
        if (!agent) return;

        setAgentId(agent.id);
        setName(agent.name || '');
        setCompany(agent.company || '');
        setEmail(agent.email || '');
        setPhone(agent.phone || '');
        setLicense(agent.license_number || '');

        // Restore saved portrait options
        if (agent.portrait_options?.portraits?.length) {
          setPortraits(agent.portrait_options.portraits);
          setOriginalUrl(agent.portrait_options.original || '');
          setStep('choose');
        } else {
          setStep('photo');
        }
      })
      .catch(() => {});
  }, [searchParams]);

  const handleInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !company.trim()) return;
    const id = `agent-${Date.now().toString(36)}`;
    setAgentId(id);
    setStep('photo');
  };

  const processImage = async (file: File | Blob) => {
    setError('');
    setGenerating(true);
    setStep('generating');

    try {
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1] || result;
          resolve(base64);
        };
      });
      reader.readAsDataURL(file);
      const imageBase64 = await base64Promise;
      const mimeType = file.type || 'image/jpeg';

      const response = await fetch('/api/agents/portrait', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, mimeType, agentId, gender }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Portrait generation failed');
      }

      const data = await response.json();
      setOriginalUrl(data.original);
      setPortraits(data.portraits);
      setStep('choose');
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setStep('photo');
    } finally {
      setGenerating(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1024, height: 1024 },
      });
      setStream(mediaStream);
      setShowCamera(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch (err) {
      setError('Camera access denied');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) {
        stopCamera();
        processImage(blob);
      }
    }, 'image/jpeg', 0.9);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const handleChoose = () => {
    if (selectedIndex === null) return;
    setStep('crop');
  };

  const handleCropConfirm = async (croppedDataUrl: string) => {
    setCroppedUrl(croppedDataUrl);
    setError('');

    try {
      // Upload the cropped portrait to Supabase storage
      const base64Data = croppedDataUrl.split(',')[1];
      if (!base64Data) throw new Error('Invalid crop data');

      const buffer = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
      const fileName = `portraits/${agentId}/cropped-${Date.now()}.jpg`;

      const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/listing-designs/${fileName}`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'image/jpeg',
          'x-upsert': 'true',
        },
        body: buffer,
      });

      let portraitUrl: string;
      if (uploadRes.ok) {
        portraitUrl = `${SUPABASE_URL}/storage/v1/object/public/listing-designs/${fileName}`;
      } else {
        // Fallback: use the uncropped URL
        portraitUrl = selectedIndex === -1 ? originalUrl : portraits[selectedIndex!]?.url || originalUrl;
      }

      // Save agent to Supabase
      const response = await fetch(`${SUPABASE_URL}/rest/v1/agents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
        body: JSON.stringify({
          id: agentId,
          name: name.trim(),
          company: company.trim(),
          email: email.trim() || null,
          phone: phone.trim() || null,
          license_number: license.trim() || null,
          portrait_url: portraitUrl,
          portrait_original_url: originalUrl,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Failed to save profile');
      }

      setFinalPortraitUrl(portraitUrl);

      // Sync agent data to all their listings
      await fetch(`${SUPABASE_URL}/rest/v1/listings?agent_id=eq.${agentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          agent_name: name.trim(),
          agent_photo: portraitUrl,
          agent_brokerage: company.trim(),
        }),
      }).catch(() => {}); // Non-blocking — listings may not exist yet

      setStep('complete');
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    }
  };

  return (
    <div
      className="min-h-screen bg-stone-900"
      style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px', lineHeight: '1.5' }}
    >
      <GlobalTypeset />
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="border-b border-stone-800">
        <div className="max-w-2xl mx-auto px-6 py-6">
          <Link to="/" className="hover:opacity-80 transition-opacity">
            <img src="/room-logo.png" alt="Room" style={{ height: 24 }} />
          </Link>
          <h1
            className="text-3xl md:text-4xl font-bold text-stone-100 mt-4"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            {t('onboard.pageTitle')}
          </h1>
          <p className="text-stone-400 mt-2" style={{ fontSize: '13px' }}>
            {t('onboard.pageSubtitle')}
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-800 text-red-300" style={{ fontSize: '13px' }}>
            {error}
          </div>
        )}

        {/* Step 1: Info */}
        {step === 'info' && (
          <form onSubmit={handleInfoSubmit} className="space-y-6">
            <div className="text-emerald-500 text-sm font-medium tracking-wide uppercase mb-6"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('onboard.yourInformation')}
            </div>

            <div>
              <label className="block text-stone-300 text-sm mb-2">{t('onboard.fullName')} *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-stone-100 px-4 py-3 focus:border-emerald-500 focus:outline-none"
                style={{ borderRadius: 0 }}
                required
              />
            </div>

            <div>
              <label className="block text-stone-300 text-sm mb-2">{t('onboard.brokerageCompany')} *</label>
              <input
                type="text"
                value={company}
                onChange={e => setCompany(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-stone-100 px-4 py-3 focus:border-emerald-500 focus:outline-none"
                style={{ borderRadius: 0 }}
                required
              />
            </div>

            <div>
              <label className="block text-stone-300 text-sm mb-2">{t('onboard.email')}</label>
              <input
                type="text"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-stone-100 px-4 py-3 focus:border-emerald-500 focus:outline-none"
                style={{ borderRadius: 0 }}
              />
            </div>

            <div>
              <label className="block text-stone-300 text-sm mb-2">{t('onboard.phone')}</label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-stone-100 px-4 py-3 focus:border-emerald-500 focus:outline-none"
                style={{ borderRadius: 0 }}
              />
            </div>

            <div>
              <label className="block text-stone-300 text-sm mb-2">{t('onboard.licenseNumber')}</label>
              <input
                type="text"
                value={license}
                onChange={e => setLicense(e.target.value)}
                className="w-full bg-stone-950 border border-stone-700 text-stone-100 px-4 py-3 focus:border-emerald-500 focus:outline-none"
                style={{ borderRadius: 0 }}
              />
            </div>

            <div>
              <label className="block text-stone-300 text-sm mb-2">{t('onboard.portraitStyle')}</label>
              <div className="flex gap-4">
                {(['male', 'female'] as const).map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`flex-1 py-3 px-4 border font-medium tracking-wide uppercase text-sm transition-colors ${
                      gender === g
                        ? 'border-emerald-500 text-emerald-500 bg-emerald-500/10'
                        : 'border-stone-700 text-stone-400 hover:border-stone-500'
                    }`}
                    style={{ borderRadius: 0 }}
                  >
                    {g === 'male' ? t('onboard.menswear') : t('onboard.womenswear')}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold py-3 px-6 tracking-wide uppercase transition-colors"
              style={{ borderRadius: 0 }}
            >
              {t('onboard.continue')}
            </button>
          </form>
        )}

        {/* Step 2: Photo */}
        {step === 'photo' && (
          <div className="space-y-6">
            <div className="text-emerald-500 text-sm font-medium tracking-wide uppercase mb-6"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('onboard.yourPortrait')}
            </div>

            <p className="text-stone-300" style={{ fontSize: '13px' }}>
              {t('onboard.portraitInstructions')}
            </p>

            {showCamera ? (
              <div className="space-y-4">
                <div className="relative aspect-square max-w-sm mx-auto overflow-hidden border border-stone-700">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                  />
                  {/* Circle guide overlay */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div
                      className="border-2 border-emerald-500/50"
                      style={{ width: '70%', height: '70%', borderRadius: '50%' }}
                    />
                  </div>
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={capturePhoto}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold py-3 px-6 tracking-wide uppercase transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    {t('onboard.capture')}
                  </button>
                  <button
                    onClick={stopCamera}
                    className="flex-1 border border-stone-600 text-stone-300 hover:text-stone-100 py-3 px-6 tracking-wide uppercase transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    {t('onboard.cancel')}
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-stone-700 hover:border-emerald-500 text-stone-300 hover:text-emerald-500 py-12 px-6 transition-colors text-center"
                  style={{ borderRadius: 0 }}
                >
                  <div className="text-3xl mb-3">+</div>
                  <div className="text-sm font-medium tracking-wide uppercase">{t('onboard.uploadPhoto')}</div>
                </button>

                <button
                  onClick={startCamera}
                  className="border border-stone-700 hover:border-emerald-500 text-stone-300 hover:text-emerald-500 py-12 px-6 transition-colors text-center"
                  style={{ borderRadius: 0 }}
                >
                  <div className="text-3xl mb-3">O</div>
                  <div className="text-sm font-medium tracking-wide uppercase">{t('onboard.takeSelfie')}</div>
                </button>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <button
              onClick={() => setStep('info')}
              className="text-stone-500 hover:text-stone-300 text-sm transition-colors"
            >
              {t('onboard.backToInfo')}
            </button>
          </div>
        )}

        {/* Step 3: Generating */}
        {step === 'generating' && (
          <div className="text-center py-16 space-y-6">
            <div className="text-emerald-500 text-sm font-medium tracking-wide uppercase"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('onboard.creatingPortraits')}
            </div>

            <div className="flex justify-center gap-2">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-3 h-3 bg-emerald-500"
                  style={{
                    animation: `pulse 1.4s ease-in-out ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>

            <p className="text-stone-400" style={{ fontSize: '13px' }}>
              {t('onboard.generatingHeadshots')}
            </p>
          </div>
        )}

        {/* Step 4: Choose */}
        {step === 'choose' && (
          <div className="space-y-8">
            <div className="text-emerald-500 text-sm font-medium tracking-wide uppercase"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('onboard.choosePortrait')}
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Original */}
              <button
                onClick={() => setSelectedIndex(-1)}
                className="text-center space-y-3 group"
              >
                <div
                  className={`lens-circle mx-auto overflow-hidden border-2 transition-colors ${
                    selectedIndex === -1 ? 'border-emerald-500' : 'border-stone-700 group-hover:border-stone-500'
                  }`}
                  style={{ width: 140, height: 140 }}
                >
                  <img
                    src={originalUrl}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="text-stone-400 text-xs uppercase tracking-wide">{t('onboard.original')}</div>
              </button>

              {/* Generated portraits */}
              {portraits.map((p, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedIndex(i)}
                  className="text-center space-y-3 group"
                >
                  <div
                    className={`lens-circle mx-auto overflow-hidden border-2 transition-colors ${
                      selectedIndex === i ? 'border-emerald-500' : 'border-stone-700 group-hover:border-stone-500'
                    }`}
                    style={{ width: 140, height: 140 }}
                  >
                    <img
                      src={p.url}
                      alt={`Portrait ${i + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-stone-400 text-xs uppercase tracking-wide">
                    {t('onboard.option')} {i + 1}
                  </div>
                </button>
              ))}
            </div>

            {/* Preview selected */}
            {selectedIndex !== null && (
              <div className="border border-stone-800 bg-stone-950 p-6">
                <div className="flex items-center gap-4">
                  <div
                    className="lens-circle overflow-hidden border border-stone-700 flex-shrink-0"
                    style={{ width: 64, height: 64 }}
                  >
                    <img
                      src={selectedIndex === -1 ? originalUrl : portraits[selectedIndex]?.url}
                      alt="Selected"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <div className="text-stone-100 font-bold">{name}</div>
                    <div className="text-stone-400 text-sm">{company}</div>
                  </div>
                </div>
                <div className="mt-4 text-stone-500" style={{ fontSize: '11px' }}>
                  {t('onboard.profilePreview')}
                </div>
              </div>
            )}

            <button
              onClick={handleChoose}
              disabled={selectedIndex === null}
              className={`w-full font-bold py-3 px-6 tracking-wide uppercase transition-colors ${
                selectedIndex !== null
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-stone-950'
                  : 'bg-stone-800 text-stone-500 cursor-not-allowed'
              }`}
              style={{ borderRadius: 0 }}
            >
              {t('onboard.useThisPortrait')}
            </button>

            {selectedIndex !== null && (
              <p className="text-center text-stone-500" style={{ fontSize: '11px' }}>
                {t('onboard.cropNextScreen')}
              </p>
            )}

            <div className="text-center text-stone-600" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
              {t('onboard.poweredBy')} <a href="https://nudio.ai" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-stone-400 transition-colors">nudio.ai</a>
            </div>
          </div>
        )}

        {/* Step 5: Crop */}
        {step === 'crop' && selectedIndex !== null && (
          <PortraitCrop
            imageUrl={selectedIndex === -1 ? originalUrl : portraits[selectedIndex]?.url || ''}
            size={280}
            onCrop={handleCropConfirm}
            onCancel={() => setStep('choose')}
          />
        )}

        {/* Step 6: Complete */}
        {step === 'complete' && (
          <div className="text-center py-16 space-y-6">
            <div
              className="text-3xl font-bold text-stone-100"
              style={{ fontFamily: 'Cormorant Garamond, serif' }}
            >
              {t('onboard.welcome')}, {name}
            </div>

            <div className="lens-circle mx-auto overflow-hidden border-2 border-emerald-500"
              style={{ width: 120, height: 120 }}>
              <img
                src={croppedUrl || (selectedIndex === -1 ? originalUrl : portraits[selectedIndex!]?.url)}
                alt={name}
                className="w-full h-full object-cover"
              />
            </div>

            <p className="text-stone-400" style={{ fontSize: '13px' }}>
              {t('onboard.profileReady')}
            </p>

            {/* Update listings option */}
            {finalPortraitUrl && listingsUpdated === 'none' && (
              <div className="border border-stone-800 bg-stone-950 p-5 text-left max-w-sm mx-auto space-y-3">
                <p className="text-stone-400 text-xs">{t('onboard.updatePhotoPrompt')}</p>
                <div className="flex gap-3">
                  <button
                    disabled={updatingListings}
                    onClick={async () => {
                      setUpdatingListings(true);
                      await fetch(`${SUPABASE_URL}/rest/v1/listings?agent_id=eq.${agentId}`, {
                        method: 'PATCH',
                        headers: {
                          'Content-Type': 'application/json',
                          'apikey': SUPABASE_ANON_KEY,
                          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                          'Prefer': 'return=minimal',
                        },
                        body: JSON.stringify({ agent_name: name.trim(), agent_photo: finalPortraitUrl, agent_brokerage: company.trim() }),
                      }).catch(() => {});
                      setUpdatingListings(false);
                      setListingsUpdated('all');
                    }}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs tracking-wide uppercase transition-colors disabled:opacity-50"
                    style={{ borderRadius: 0 }}
                  >
                    {updatingListings ? t('onboard.updating') : t('onboard.allListings')}
                  </button>
                  <button
                    onClick={() => setListingsUpdated('current')}
                    className="flex-1 py-2 border border-stone-600 text-stone-300 hover:text-stone-100 text-xs tracking-wide uppercase transition-colors"
                    style={{ borderRadius: 0 }}
                  >
                    {t('onboard.justThisOne')}
                  </button>
                </div>
              </div>
            )}

            {listingsUpdated === 'all' && (
              <p className="text-emerald-500 text-xs">{t('onboard.photoUpdatedAll')}</p>
            )}

            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                to={`/listing/new?agent=${agentId}`}
                className="bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold py-3 px-8 tracking-wide uppercase transition-colors inline-block"
                style={{ borderRadius: 0 }}
              >
                {t('onboard.createFirstListing')}
              </Link>
              <Link
                to="/agent/dashboard"
                className="bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold py-3 px-8 tracking-wide uppercase transition-colors inline-block"
                style={{ borderRadius: 0 }}
              >
                {t('onboard.goToDashboard')}
              </Link>
            </div>

            <div className="text-stone-600" style={{ fontSize: '10px', letterSpacing: '0.05em' }}>
              {t('onboard.poweredBy')} <a href="https://nudio.ai" target="_blank" rel="noopener noreferrer" className="text-stone-500 hover:text-stone-400 transition-colors">nudio.ai</a>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
