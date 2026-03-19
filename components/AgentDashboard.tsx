import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/auth';
import GlobalTypeset from './GlobalTypeset';
import {
  Plus, QrCode, BarChart3, Settings, Eye, Loader2,
  MapPin, Clock, ArrowRight, Home, RefreshCw, Trash2,
  Download, ExternalLink, User, Edit3, Camera, Save, X as XIcon
} from 'lucide-react';
import { useI18n } from '../i18n/I18nContext';

interface AgentProfile {
  id: string;
  name: string;
  email: string;
  brokerage: string;
  portrait_url: string | null;
  logo_url: string | null;
  phone: string | null;
  city: string | null;
  languages: string[];
  design_partner_name: string | null;
  design_partner_url: string | null;
}

interface DashboardListing {
  id: string;
  address: string;
  city: string;
  state: string;
  price: number;
  beds: number;
  baths: number;
  sqft: number;
  hero_image: string;
  status: string;
  created_at: string;
  room_count?: number;
  design_count?: number;
  scan_count?: number;
}

function formatPrice(price: number): string {
  if (!price) return '';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(price);
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pending: 'bg-stone-700 text-stone-300',
    scraping: 'bg-blue-900 text-blue-300',
    generating: 'bg-emerald-950 text-emerald-200',
    review: 'bg-purple-900 text-purple-300',
    live: 'bg-green-900 text-green-300',
    draft: 'bg-stone-800 text-stone-400',
  };
  return (
    <span className={`px-2 py-1 text-xs font-medium uppercase tracking-wider ${colors[status] || colors.draft}`}>
      {status}
    </span>
  );
}

export function AgentDashboard() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [listings, setListings] = useState<DashboardListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'listings' | 'analytics' | 'branding' | 'qrcodes'>('listings');
  const [generatingQR, setGeneratingQR] = useState<string | null>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    brokerage: '',
    email: '',
    phone: '',
    license_number: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@300;400;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    loadDashboard();
    return () => { document.head.removeChild(link); };
  }, []);

  async function loadDashboard() {
    setLoading(true);
    try {
      // Load agent profile (most recently created)
      const { data: agentData } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (agentData) {
        setAgent(agentData);
        setEditForm({
          name: agentData.name || '',
          brokerage: agentData.brokerage || '',
          email: agentData.email || '',
          phone: agentData.phone || '',
          license_number: agentData.license_number || '',
        });
      }

      // Load all listings
      const { data: listingsData } = await supabase
        .from('listings')
        .select('*')
        .order('created_at', { ascending: false });

      if (listingsData) {
        // Enrich with room/design counts
        const enriched = await Promise.all(listingsData.map(async (l: any) => {
          const { count: roomCount } = await supabase
            .from('listing_rooms')
            .select('*', { count: 'exact', head: true })
            .eq('listing_id', l.id);

          const { count: designCount } = await supabase
            .from('listing_designs')
            .select('*', { count: 'exact', head: true })
            .eq('listing_id', l.id);

          return {
            ...l,
            room_count: roomCount || 0,
            design_count: designCount || 0,
            scan_count: l.scan_count || 0,
          };
        }));

        setListings(enriched);
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generateQRCodes(listingId: string) {
    setGeneratingQR(listingId);
    try {
      const res = await fetch('/api/listings/qrcodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId }),
      });
      if (!res.ok) throw new Error('QR generation failed');
      await loadDashboard();
      setActiveTab('qrcodes');
    } catch (err) {
      console.error(err);
    } finally {
      setGeneratingQR(null);
    }
  }

  async function saveProfile() {
    if (!agent) return;
    setSaving(true);
    try {
      const res = await fetch('/api/agents/update', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: agent.id,
          ...editForm,
        }),
      });
      if (!res.ok) throw new Error('Update failed');
      const { agent: updatedAgent } = await res.json();
      setAgent(updatedAgent);
      setEditingProfile(false);
    } catch (err) {
      console.error(err);
      alert('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  function cancelEdit() {
    if (!agent) return;
    setEditForm({
      name: agent.name || '',
      brokerage: agent.brokerage || '',
      email: agent.email || '',
      phone: agent.phone || '',
      license_number: agent.license_number || '',
    });
    setEditingProfile(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-stone-400" style={{ fontFamily: 'Nunito, sans-serif' }}>{t('dashboard.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200">
      <GlobalTypeset />

      {/* Header */}
      <header className="border-b border-stone-800 bg-stone-950">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {agent?.portrait_url && (
              <div className="lens-circle overflow-hidden flex-shrink-0" style={{ width: 40, height: 40 }}>
                <img src={agent.portrait_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <h1 className="text-lg font-bold text-stone-100" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {agent?.name || t('dashboard.agentDashboard')}
              </h1>
              {agent?.brokerage && (
                <p className="text-xs text-stone-500" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {agent.brokerage}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/listing/new"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-stone-900 font-bold text-sm hover:bg-emerald-400 transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t('dashboard.newListing')}
            </Link>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-6 flex gap-0">
          {[
            { id: 'listings' as const, label: t('dashboard.listings'), icon: Home },
            { id: 'qrcodes' as const, label: t('dashboard.qrCodes'), icon: QrCode },
            { id: 'analytics' as const, label: t('dashboard.analytics'), icon: BarChart3 },
            { id: 'branding' as const, label: t('dashboard.branding'), icon: Settings },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-stone-500 hover:text-stone-300'
              }`}
              style={{ fontFamily: 'Nunito, sans-serif' }}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* ── Listings Tab ── */}
        {activeTab === 'listings' && (
          <div>
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: t('dashboard.totalListings'), value: listings.length },
                { label: t('dashboard.live'), value: listings.filter(l => l.status === 'live').length },
                { label: t('dashboard.inReview'), value: listings.filter(l => l.status === 'review').length },
                { label: t('dashboard.totalDesigns'), value: listings.reduce((s, l) => s + (l.design_count || 0), 0) },
              ].map(stat => (
                <div key={stat.label} className="border border-stone-800 bg-stone-900 p-4">
                  <div className="text-2xl font-bold text-stone-100" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-stone-500 uppercase tracking-wide mt-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Listing Cards */}
            {listings.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-stone-700">
                <Home className="w-12 h-12 mx-auto text-stone-600 mb-4" />
                <h3 className="text-lg font-semibold text-stone-300 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {t('dashboard.noListingsYet')}
                </h3>
                <p className="text-stone-500 text-sm mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {t('dashboard.pasteListingURL')}
                </p>
                <Link
                  to="/listing/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-stone-900 font-bold hover:bg-emerald-400 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('dashboard.createListing')}
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {listings.map(listing => (
                  <div
                    key={listing.id}
                    className="border border-stone-800 bg-stone-900 hover:border-stone-700 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row">
                      {/* Hero image */}
                      <div className="w-full md:w-48 h-32 md:h-auto flex-shrink-0 bg-stone-800 overflow-hidden">
                        {listing.hero_image ? (
                          <img
                            src={listing.hero_image}
                            alt={listing.address}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Home className="w-8 h-8 text-stone-600" />
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 p-5">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-lg font-bold text-stone-100" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                              {listing.address}
                            </h3>
                            <p className="text-sm text-stone-500 flex items-center gap-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                              <MapPin className="w-3 h-3" />
                              {listing.city}, {listing.state}
                            </p>
                          </div>
                          {statusBadge(listing.status)}
                        </div>

                        <div className="flex gap-6 text-sm text-stone-400 mt-3 mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          {listing.price > 0 && <span>{formatPrice(listing.price)}</span>}
                          {listing.beds > 0 && <span>{listing.beds} {t('dashboard.bed')}</span>}
                          {listing.baths > 0 && <span>{listing.baths} {t('dashboard.bath')}</span>}
                          {listing.sqft > 0 && <span>{listing.sqft.toLocaleString()} {t('dashboard.sqft')}</span>}
                        </div>

                        <div className="flex gap-4 text-xs text-stone-500" style={{ fontFamily: 'Nunito, sans-serif' }}>
                          <span>{listing.room_count} {t('dashboard.rooms')}</span>
                          <span>{listing.design_count} {t('dashboard.designs')}</span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(listing.created_at).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Link
                            to={`/listing/${listing.id}/manage`}
                            className="px-3 py-1.5 text-xs bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors flex items-center gap-1"
                          >
                            <Settings className="w-3 h-3" />
                            {t('dashboard.manage')}
                          </Link>
                          <Link
                            to={`/listing/${listing.id}`}
                            className="px-3 py-1.5 text-xs bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            {t('dashboard.preview')}
                          </Link>
                          <button
                            onClick={() => generateQRCodes(listing.id)}
                            disabled={generatingQR === listing.id}
                            className="px-3 py-1.5 text-xs bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            {generatingQR === listing.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <QrCode className="w-3 h-3" />
                            )}
                            {t('dashboard.qrCodes')}
                          </button>
                          <a
                            href={`/listing/${listing.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 text-xs bg-stone-800 text-stone-300 hover:bg-stone-700 transition-colors flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {t('dashboard.live')}
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── QR Codes Tab ── */}
        {activeTab === 'qrcodes' && (
          <div>
            <h2 className="text-2xl font-bold text-stone-100 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('dashboard.qrCodeCenter')}
            </h2>
            <p className="text-stone-400 text-sm mb-8" style={{ fontFamily: 'Nunito, sans-serif' }} data-no-smooth>
              {t('dashboard.qrCodeInstructions')}
            </p>

            {listings.filter(l => l.status === 'live' || l.status === 'review').length === 0 ? (
              <div className="text-center py-12 border border-dashed border-stone-700">
                <QrCode className="w-10 h-10 mx-auto text-stone-600 mb-3" />
                <p className="text-stone-500 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {t('dashboard.noActiveListings')}
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {listings.filter(l => l.status === 'live' || l.status === 'review').map(listing => (
                  <div key={listing.id} className="border border-stone-800 bg-stone-900 p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-stone-100" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                          {listing.address}
                        </h3>
                        <p className="text-xs text-stone-500">{listing.city}, {listing.state}</p>
                      </div>
                      <button
                        onClick={() => generateQRCodes(listing.id)}
                        disabled={generatingQR === listing.id}
                        className="px-4 py-2 text-sm bg-emerald-500 text-stone-900 font-bold hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {generatingQR === listing.id ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> {t('dashboard.generating')}</>
                        ) : (
                          <><RefreshCw className="w-4 h-4" /> {t('dashboard.generateQRCodes')}</>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-stone-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {t('dashboard.qrCodeStorageNote')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Analytics Tab ── */}
        {activeTab === 'analytics' && (
          <div>
            <h2 className="text-2xl font-bold text-stone-100 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('dashboard.analytics')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="border border-stone-800 bg-stone-900 p-6 text-center">
                <div className="text-3xl font-bold text-emerald-500" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {listings.reduce((s, l) => s + (l.scan_count || 0), 0)}
                </div>
                <div className="text-xs text-stone-500 uppercase tracking-wide mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {t('dashboard.totalQRScans')}
                </div>
              </div>
              <div className="border border-stone-800 bg-stone-900 p-6 text-center">
                <div className="text-3xl font-bold text-emerald-500" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {listings.reduce((s, l) => s + (l.design_count || 0), 0)}
                </div>
                <div className="text-xs text-stone-500 uppercase tracking-wide mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {t('dashboard.designsGenerated')}
                </div>
              </div>
              <div className="border border-stone-800 bg-stone-900 p-6 text-center">
                <div className="text-3xl font-bold text-emerald-500" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                  {listings.filter(l => l.status === 'live').length}
                </div>
                <div className="text-xs text-stone-500 uppercase tracking-wide mt-2" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {t('dashboard.liveListings')}
                </div>
              </div>
            </div>
            <div className="border border-dashed border-stone-700 p-12 text-center">
              <BarChart3 className="w-10 h-10 mx-auto text-stone-600 mb-3" />
              <p className="text-stone-500 text-sm" style={{ fontFamily: 'Nunito, sans-serif' }}>
                {t('dashboard.analyticsComingSoon')}
              </p>
            </div>
          </div>
        )}

        {/* ── Branding Tab ── */}
        {activeTab === 'branding' && (
          <div>
            <h2 className="text-2xl font-bold text-stone-100 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {t('dashboard.agentBranding')}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Profile Preview */}
              <div className="border border-stone-800 bg-stone-900 p-6">
                <h3 className="text-sm text-stone-500 uppercase tracking-wide mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {t('dashboard.profilePreview')}
                </h3>
                <div className="flex items-center gap-4 mb-6">
                  {agent?.portrait_url ? (
                    <div className="lens-circle overflow-hidden flex-shrink-0" style={{ width: 64, height: 64 }}>
                      <img src={agent.portrait_url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="lens-circle flex-shrink-0 bg-stone-800 flex items-center justify-center" style={{ width: 64, height: 64 }}>
                      <User className="w-6 h-6 text-stone-600" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-stone-100" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                      {agent?.name || t('dashboard.yourName')}
                    </div>
                    <div className="text-sm text-stone-500" style={{ fontFamily: 'Nunito, sans-serif' }}>
                      {agent?.brokerage || t('dashboard.yourBrokerage')}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-stone-600" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {t('dashboard.brandingNote')}
                </div>
              </div>

              {/* Design Partner */}
              <div className="border border-stone-800 bg-stone-900 p-6">
                <h3 className="text-sm text-stone-500 uppercase tracking-wide mb-4" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  {t('dashboard.designPartner')}
                </h3>
                <div className="mb-4">
                  <div className="font-bold text-stone-100" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                    {agent?.design_partner_name || 'MODTAGE Design'}
                  </div>
                  <div className="text-sm text-stone-400 mt-1" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {t('dashboard.designPartnerDescription')}
                  </div>
                </div>
                <p className="text-xs text-stone-600" style={{ fontFamily: 'Nunito, sans-serif' }} data-no-smooth>
                  {t('dashboard.designPartnerPrompt')}
                </p>
              </div>

              {/* Edit Profile */}
              <div className="border border-stone-800 bg-stone-900 p-6 md:col-span-2">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm text-stone-500 uppercase tracking-wide" style={{ fontFamily: 'Nunito, sans-serif' }}>
                    {t('dashboard.updateProfile')}
                  </h3>
                  {!editingProfile && (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="px-3 py-1.5 bg-stone-800 text-stone-300 text-sm hover:bg-stone-700 transition-colors flex items-center gap-2"
                    >
                      <Edit3 className="w-3 h-3" />
                      Edit Info
                    </button>
                  )}
                </div>

                {editingProfile ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">Name</label>
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                        className="w-full bg-stone-800 border border-stone-700 text-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">Brokerage</label>
                      <input
                        type="text"
                        value={editForm.brokerage}
                        onChange={e => setEditForm({...editForm, brokerage: e.target.value})}
                        className="w-full bg-stone-800 border border-stone-700 text-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-stone-500 mb-1 block">Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={e => setEditForm({...editForm, email: e.target.value})}
                          className="w-full bg-stone-800 border border-stone-700 text-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-stone-500 mb-1 block">Phone</label>
                        <input
                          type="tel"
                          value={editForm.phone}
                          onChange={e => setEditForm({...editForm, phone: e.target.value})}
                          className="w-full bg-stone-800 border border-stone-700 text-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-stone-500 mb-1 block">License Number</label>
                      <input
                        type="text"
                        value={editForm.license_number}
                        onChange={e => setEditForm({...editForm, license_number: e.target.value})}
                        className="w-full bg-stone-800 border border-stone-700 text-stone-200 px-3 py-2 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={saveProfile}
                        disabled={saving}
                        className="px-4 py-2 bg-emerald-500 text-stone-900 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        {saving ? (
                          <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                        ) : (
                          <><Save className="w-4 h-4" /> Save Changes</>
                        )}
                      </button>
                      <button
                        onClick={cancelEdit}
                        disabled={saving}
                        className="px-4 py-2 border border-stone-600 text-stone-300 text-sm hover:border-stone-500 hover:text-stone-200 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 text-sm">
                    <div className="flex gap-2"><span className="text-stone-500">Name:</span> <span className="text-stone-300">{agent?.name || '—'}</span></div>
                    <div className="flex gap-2"><span className="text-stone-500">Brokerage:</span> <span className="text-stone-300">{agent?.brokerage || '—'}</span></div>
                    <div className="flex gap-2"><span className="text-stone-500">Email:</span> <span className="text-stone-300">{agent?.email || '—'}</span></div>
                    <div className="flex gap-2"><span className="text-stone-500">Phone:</span> <span className="text-stone-300">{agent?.phone || '—'}</span></div>
                    <div className="flex gap-2"><span className="text-stone-500">License:</span> <span className="text-stone-300">{agent?.license_number || '—'}</span></div>
                  </div>
                )}

                <div className="mt-6 pt-6 border-t border-stone-800">
                  <Link
                    to={`/agent/onboard${agent?.id ? `?agent=${agent.id}` : ''}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-stone-800 text-stone-300 text-sm hover:bg-stone-700 transition-colors"
                  >
                    <Camera className="w-4 h-4" />
                    Change Photo & Regenerate Portrait
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
