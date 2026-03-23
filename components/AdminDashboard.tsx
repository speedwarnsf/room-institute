import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../services/auth';
import GlobalTypeset from './GlobalTypeset';
import {
  BarChart3, Globe, Users, Eye, Layers, ArrowRight,
  TrendingUp, Clock, Smartphone, Monitor, Tablet,
  FileText, Plus, ChevronRight, ExternalLink, Building2,
  Palette, UserCircle, Home
} from 'lucide-react';

// ═══════════════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════════════

interface Market {
  id: string;
  name: string;
  region: string;
  status: string;
  launched_at: string | null;
}

interface EventAgg {
  event_type: string;
  count: number;
}

interface DailyCount {
  date: string;
  count: number;
}

interface DesignEngagement {
  design_id: string;
  design_name: string;
  listing_address: string;
  views: number;
  go_deeper: number;
  avg_time_ms: number;
}

interface DeviceBreakdown {
  device_type: string;
  count: number;
}

interface SourceBreakdown {
  source: string;
  count: number;
}

interface PitchPortfolio {
  id: string;
  name: string;
  prospect_type: string;
  prospect_name: string;
  status: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════
//  Pitch Builder
// ═══════════════════════════════════════════════════

function PitchBuilder({
  pitches,
  onPitchCreated,
  totalEvents,
  listingCount,
  designCount,
  agentCount,
  eventBreakdown,
  deviceBreakdown,
  sourceBreakdown,
}: {
  pitches: PitchPortfolio[];
  onPitchCreated: (p: PitchPortfolio) => void;
  totalEvents: number;
  listingCount: number;
  designCount: number;
  agentCount: number;
  eventBreakdown: EventAgg[];
  deviceBreakdown: DeviceBreakdown[];
  sourceBreakdown: SourceBreakdown[];
}) {
  const [mode, setMode] = useState<'list' | 'build'>('list');
  const [prospectType, setProspectType] = useState<'design_firm' | 'agency' | 'investor' | 'custom'>('design_firm');
  const [prospectName, setProspectName] = useState('');
  const [pitchName, setPitchName] = useState('');
  const [includeEngagement, setIncludeEngagement] = useState(true);
  const [includeDevices, setIncludeDevices] = useState(true);
  const [includeSources, setIncludeSources] = useState(true);
  const [includeDesignTrends, setIncludeDesignTrends] = useState(true);
  const [customContext, setCustomContext] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedNarrative, setGeneratedNarrative] = useState('');
  const [generatedInsights, setGeneratedInsights] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const prospectTypes = [
    { value: 'design_firm', label: 'Design Firm', desc: 'Interior designers seeking homebuyer engagement data' },
    { value: 'agency', label: 'Real Estate Agency', desc: 'Brokerages looking to adopt Room for their agents' },
    { value: 'investor', label: 'Investor', desc: 'VCs or angels evaluating market traction' },
    { value: 'custom', label: 'Custom', desc: 'Custom pitch for any prospect' },
  ];

  const getEvtCount = (type: string) => eventBreakdown.find(e => e.event_type === type)?.count || 0;

  const buildInsightsSnapshot = () => {
    const snapshot: any = { generated_at: new Date().toISOString() };

    if (includeEngagement) {
      snapshot.engagement = {
        total_interactions: totalEvents,
        page_views: getEvtCount('page_view'),
        design_views: getEvtCount('design_viewed'),
        design_expansions: getEvtCount('design_expanded'),
        go_deeper_taps: getEvtCount('go_deeper_tapped'),
        spread_reads: getEvtCount('spread_loaded'),
        partner_clicks: getEvtCount('partner_clicked'),
        listings: listingCount,
        designs: designCount,
        agents: agentCount,
      };
    }

    if (includeDevices) {
      snapshot.devices = deviceBreakdown.reduce((acc: any, d) => {
        acc[d.device_type || 'unknown'] = d.count;
        return acc;
      }, {});
    }

    if (includeSources) {
      snapshot.sources = sourceBreakdown.reduce((acc: any, s) => {
        acc[s.source || 'unknown'] = s.count;
        return acc;
      }, {});
    }

    return snapshot;
  };

  const generatePitch = async () => {
    setGenerating(true);
    const insights = buildInsightsSnapshot();
    setGeneratedInsights(insights);

    const prospectLabel = prospectTypes.find(p => p.value === prospectType)?.label || prospectType;

    try {
      const res = await fetch('/api/admin/generate-pitch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prospectType: prospectLabel,
          prospectName,
          insights,
          customContext,
        }),
      });
      const data = await res.json();
      setGeneratedNarrative(data.narrative || data.error || 'Generation failed');
    } catch (err) {
      setGeneratedNarrative('Error generating pitch narrative.');
    }
    setGenerating(false);
  };

  const savePitch = async () => {
    setSaving(true);
    const id = `pitch-${Date.now().toString(36)}`;
    const name = pitchName || `${prospectTypes.find(p => p.value === prospectType)?.label} Pitch — ${new Date().toLocaleDateString()}`;

    const { error } = await supabase.from('pitch_portfolios').insert({
      id,
      name,
      prospect_type: prospectType,
      prospect_name: prospectName || null,
      insights: generatedInsights,
      narrative: generatedNarrative,
      status: 'draft',
    });

    if (!error) {
      onPitchCreated({
        id,
        name,
        prospect_type: prospectType,
        prospect_name: prospectName,
        status: 'draft',
        created_at: new Date().toISOString(),
      });
      setMode('list');
      setGeneratedNarrative('');
      setGeneratedInsights(null);
      setProspectName('');
      setPitchName('');
      setCustomContext('');
    }
    setSaving(false);
  };

  if (mode === 'build' || generatedNarrative) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-stone-100" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              {generatedNarrative ? 'Review Pitch' : 'Build Pitch'}
            </h2>
            <p className="text-stone-500 text-sm mt-1">
              {generatedNarrative ? 'Review, edit, and save your pitch' : 'Configure what data to include'}
            </p>
          </div>
          <button
            onClick={() => { setMode('list'); setGeneratedNarrative(''); setGeneratedInsights(null); }}
            className="text-stone-500 text-sm hover:text-stone-300 transition-colors"
          >
            Cancel
          </button>
        </div>

        {!generatedNarrative ? (
          <div className="space-y-6">
            {/* Prospect Type */}
            <div>
              <label className="block text-stone-300 text-sm mb-3">Prospect Type</label>
              <div className="grid grid-cols-2 gap-3">
                {prospectTypes.map(pt => (
                  <button
                    key={pt.value}
                    onClick={() => setProspectType(pt.value as any)}
                    className={`p-4 border text-left transition-colors ${
                      prospectType === pt.value
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-stone-800 bg-stone-900 hover:border-stone-700'
                    }`}
                  >
                    <span className="text-stone-200 text-sm font-bold block">{pt.label}</span>
                    <span className="text-stone-500 text-xs mt-1 block">{pt.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Prospect Name */}
            <div>
              <label className="block text-stone-300 text-sm mb-2">Prospect Name</label>
              <input
                type="text"
                value={prospectName}
                onChange={e => setProspectName(e.target.value)}
                placeholder="e.g., MODTAGE Design, Compass SF..."
                className="w-full px-4 py-2 bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-600 focus:border-emerald-500 focus:outline-none text-sm"
              />
            </div>

            {/* Pitch Name */}
            <div>
              <label className="block text-stone-300 text-sm mb-2">Pitch Title</label>
              <input
                type="text"
                value={pitchName}
                onChange={e => setPitchName(e.target.value)}
                placeholder="e.g., SF Design Intelligence Q1 2026"
                className="w-full px-4 py-2 bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-600 focus:border-emerald-500 focus:outline-none text-sm"
              />
            </div>

            {/* Data Inclusions */}
            <div>
              <label className="block text-stone-300 text-sm mb-3">Include Data</label>
              <div className="space-y-2">
                {[
                  { key: 'engagement', label: 'Engagement Metrics', desc: `${totalEvents} interactions, ${getEvtCount('go_deeper_tapped')} deep reads`, state: includeEngagement, set: setIncludeEngagement },
                  { key: 'devices', label: 'Device Breakdown', desc: deviceBreakdown.map(d => `${d.device_type}: ${d.count}`).join(', ') || 'No data yet', state: includeDevices, set: setIncludeDevices },
                  { key: 'sources', label: 'Traffic Sources', desc: sourceBreakdown.map(s => `${s.source}: ${s.count}`).join(', ') || 'No data yet', state: includeSources, set: setIncludeSources },
                  { key: 'trends', label: 'Design Trends', desc: `${designCount} designs across ${listingCount} listings`, state: includeDesignTrends, set: setIncludeDesignTrends },
                ].map(item => (
                  <button
                    key={item.key}
                    onClick={() => item.set(!item.state)}
                    className={`w-full p-3 border text-left flex items-center gap-3 transition-colors ${
                      item.state
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-stone-800 bg-stone-900 opacity-60'
                    }`}
                  >
                    <div className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center ${
                      item.state ? 'border-emerald-500 bg-emerald-500' : 'border-stone-600'
                    }`}>
                      {item.state && <span className="text-stone-900 text-[10px] font-bold">✓</span>}
                    </div>
                    <div>
                      <span className="text-stone-200 text-sm block">{item.label}</span>
                      <span className="text-stone-500 text-xs">{item.desc}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Context */}
            <div>
              <label className="block text-stone-300 text-sm mb-2">Additional Context <span className="text-stone-600">(optional)</span></label>
              <textarea
                value={customContext}
                onChange={e => setCustomContext(e.target.value)}
                placeholder="Any specific details about this prospect or what you want to emphasize..."
                rows={3}
                className="w-full px-4 py-2 bg-stone-950 border border-stone-800 text-stone-200 placeholder-stone-600 focus:border-emerald-500 focus:outline-none text-sm resize-none"
              />
            </div>

            {/* Generate Button */}
            <button
              onClick={generatePitch}
              disabled={generating}
              className="w-full py-3 bg-emerald-500 text-stone-900 font-bold text-sm hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-stone-900 border-t-transparent loading-circle animate-spin" />
                  Generating pitch...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Generate Pitch Narrative
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Generated narrative preview */}
            <div className="border border-stone-800 bg-stone-900 p-6">
              <div
                className="prose prose-invert prose-sm max-w-none text-stone-300"
                style={{ fontFamily: 'Nunito, sans-serif' }}
                dangerouslySetInnerHTML={{
                  __html: generatedNarrative
                    .replace(/^### (.*$)/gim, '<h3 class="text-stone-100 text-lg font-bold mt-6 mb-2" style="font-family: Cormorant Garamond, serif">$1</h3>')
                    .replace(/^## (.*$)/gim, '<h2 class="text-stone-100 text-xl font-bold mt-6 mb-2" style="font-family: Cormorant Garamond, serif">$1</h2>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong class="text-stone-100">$1</strong>')
                    .replace(/\n/g, '<br />')
                }}
              />
            </div>

            {/* Data snapshot */}
            {generatedInsights && (
              <details className="border border-stone-800 bg-stone-900">
                <summary className="px-4 py-3 text-stone-400 text-sm cursor-pointer hover:text-stone-300">
                  View raw data snapshot
                </summary>
                <pre className="px-4 py-3 text-stone-500 text-xs overflow-x-auto border-t border-stone-800">
                  {JSON.stringify(generatedInsights, null, 2)}
                </pre>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => setGeneratedNarrative('')}
                className="flex-1 py-3 border border-stone-700 text-stone-300 font-bold text-sm hover:border-stone-500 transition-colors"
              >
                Regenerate
              </button>
              <button
                onClick={savePitch}
                disabled={saving}
                className="flex-1 py-3 bg-emerald-500 text-stone-900 font-bold text-sm hover:bg-emerald-400 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? 'Saving...' : 'Save Pitch'}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-stone-100" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            Pitch Portfolios
          </h2>
          <p className="text-stone-500 text-sm mt-1">
            Packaged insights for prospective partners
          </p>
        </div>
        <button
          onClick={() => setMode('build')}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-stone-900 font-bold text-sm hover:bg-emerald-400 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Build Pitch
        </button>
      </div>

      {pitches.length === 0 ? (
        <div className="border border-dashed border-stone-700 p-12 text-center">
          <FileText className="w-10 h-10 mx-auto text-stone-600 mb-4" />
          <h3 className="text-lg font-semibold text-stone-300 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
            No pitches yet
          </h3>
          <p className="text-stone-500 text-sm max-w-md mx-auto mb-6">
            Build your first pitch portfolio. Select a prospect type, choose which market data to include, and generate a narrative-driven insight package.
          </p>
          <button
            onClick={() => setMode('build')}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 text-stone-900 font-bold hover:bg-emerald-400 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Build First Pitch
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {pitches.map(p => (
            <div key={p.id} className="border border-stone-800 bg-stone-900 p-5 flex items-center justify-between hover:border-stone-700 transition-colors">
              <div>
                <h3 className="text-stone-200 font-bold">{p.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-stone-500 text-xs capitalize">{p.prospect_type.replace(/_/g, ' ')}</span>
                  {p.prospect_name && (
                    <>
                      <span className="text-stone-700">|</span>
                      <span className="text-stone-500 text-xs">{p.prospect_name}</span>
                    </>
                  )}
                  <span className="text-stone-700">|</span>
                  <span className={`text-xs px-2 py-0.5 ${
                    p.status === 'ready' ? 'bg-green-900/50 text-green-400' :
                    p.status === 'sent' ? 'bg-blue-900/50 text-blue-400' :
                    p.status === 'converted' ? 'bg-emerald-950/50 text-emerald-300' :
                    'bg-stone-800 text-stone-400'
                  }`}>
                    {p.status}
                  </span>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-stone-600" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
//  Admin Dashboard
// ═══════════════════════════════════════════════════

export function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'publication' | 'events' | 'designs' | 'pitches' | 'strategy'>('overview');
  const [pubListings, setPubListings] = useState<any[]>([]);
  const [savingOrder, setSavingOrder] = useState(false);

  // Data
  const [markets, setMarkets] = useState<Market[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [eventBreakdown, setEventBreakdown] = useState<EventAgg[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<DeviceBreakdown[]>([]);
  const [sourceBreakdown, setSourceBreakdown] = useState<SourceBreakdown[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [listingCount, setListingCount] = useState(0);
  const [designCount, setDesignCount] = useState(0);
  const [agentCount, setAgentCount] = useState(0);
  const [pitches, setPitches] = useState<PitchPortfolio[]>([]);
  const [sampleListingId, setSampleListingId] = useState<string | null>(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Nunito:wght@300;400;600;700&family=Space+Grotesk:wght@400;500;600;700&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    loadData();
    return () => { document.head.removeChild(link); };
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      // Parallel fetches
      const [
        marketsRes,
        eventsCountRes,
        listingsCountRes,
        designsCountRes,
        agentsCountRes,
        recentEventsRes,
        pitchesRes,
      ] = await Promise.all([
        supabase.from('markets').select('*').order('name'),
        supabase.from('interaction_events').select('*', { count: 'exact', head: true }),
        supabase.from('listings').select('*', { count: 'exact', head: true }),
        supabase.from('listing_designs').select('*', { count: 'exact', head: true }),
        supabase.from('agents').select('*', { count: 'exact', head: true }),
        supabase.from('interaction_events').select('event_type, listing_id, design_id, device_type, source, duration_ms, created_at').order('created_at', { ascending: false }).limit(200),
        supabase.from('pitch_portfolios').select('*').order('created_at', { ascending: false }),
      ]);

      setMarkets(marketsRes.data || []);
      setTotalEvents(eventsCountRes.count || 0);
      setListingCount(listingsCountRes.count || 0);
      setDesignCount(designsCountRes.count || 0);
      setAgentCount(agentsCountRes.count || 0);
      setPitches(pitchesRes.data || []);

      // Grab a listing ID for quick-access links
      const { data: sampleListing } = await supabase
        .from('listings')
        .select('id')
        .eq('status', 'ready')
        .limit(1)
        .single();
      if (sampleListing) setSampleListingId(sampleListing.id);

      const events = recentEventsRes.data || [];
      setRecentEvents(events);

      // Compute breakdowns from recent events
      const typeCounts: Record<string, number> = {};
      const deviceCounts: Record<string, number> = {};
      const sourceCounts: Record<string, number> = {};

      for (const e of events) {
        typeCounts[e.event_type] = (typeCounts[e.event_type] || 0) + 1;
        if (e.device_type) deviceCounts[e.device_type] = (deviceCounts[e.device_type] || 0) + 1;
        if (e.source) sourceCounts[e.source] = (sourceCounts[e.source] || 0) + 1;
      }

      setEventBreakdown(Object.entries(typeCounts).map(([event_type, count]) => ({ event_type, count })).sort((a, b) => b.count - a.count));
      setDeviceBreakdown(Object.entries(deviceCounts).map(([device_type, count]) => ({ device_type, count })).sort((a, b) => b.count - a.count));
      setSourceBreakdown(Object.entries(sourceCounts).map(([source, count]) => ({ source, count })).sort((a, b) => b.count - a.count));

    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Computed
  const goDeepRate = useMemo(() => {
    const views = eventBreakdown.find(e => e.event_type === 'page_view')?.count || 0;
    const deeper = eventBreakdown.find(e => e.event_type === 'go_deeper_tapped')?.count || 0;
    if (views === 0) return 0;
    return Math.round((deeper / views) * 100);
  }, [eventBreakdown]);

  const avgTimeMs = useMemo(() => {
    const timeEvents = recentEvents.filter(e => e.event_type === 'time_on_page' && e.duration_ms);
    if (timeEvents.length === 0) return 0;
    return Math.round(timeEvents.reduce((s, e) => s + e.duration_ms, 0) / timeEvents.length);
  }, [recentEvents]);

  const partnerClicks = useMemo(() => {
    return eventBreakdown.find(e => e.event_type === 'partner_clicked')?.count || 0;
  }, [eventBreakdown]);

  const deviceIcon = (type: string) => {
    if (type === 'mobile') return <Smartphone className="w-4 h-4" />;
    if (type === 'tablet') return <Tablet className="w-4 h-4" />;
    return <Monitor className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-stone-400" style={{ fontFamily: 'Nunito, sans-serif' }}>Loading command center...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-200" style={{ fontFamily: 'Nunito, sans-serif', fontSize: '14px' }}>
      <GlobalTypeset />

      {/* Header */}
      <header className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 sm:gap-4">
              <a href="https://room.institute" className="hover:opacity-80 transition-opacity">
                <img src="/room-logo.png" alt="Room" style={{ height: 20 }} />
              </a>
              <h1 className="text-lg sm:text-2xl font-bold text-stone-100" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Command Center
              </h1>
            </div>
            <button
              onClick={() => setActiveTab('pitches')}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-emerald-500 text-stone-900 font-bold text-xs sm:text-sm hover:bg-emerald-400 transition-colors flex-shrink-0"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Pitch</span>
              <span className="sm:hidden">Pitch</span>
            </button>
          </div>
        </div>
      </header>

      {/* Quick Access — all four interfaces */}
      <div className="border-b border-stone-800 bg-stone-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          <span className="text-stone-600 text-[9px] sm:text-[10px] uppercase tracking-widest mr-1 sm:mr-2 flex-shrink-0">Jump to</span>
          <Link
            to="/for/agencies"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors flex-shrink-0"
          >
            <Building2 className="w-3 h-3" />
            Agency Pitch
          </Link>
          <Link
            to="/agent/onboard"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors flex-shrink-0"
          >
            <UserCircle className="w-3 h-3" />
            Agent Onboarding
          </Link>
          <Link
            to="/agent/dashboard"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors flex-shrink-0"
          >
            <Layers className="w-3 h-3" />
            Agent Dashboard
          </Link>
          {sampleListingId && (
            <>
              <Link
                to={`/listing/${sampleListingId}`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors flex-shrink-0"
              >
                <Home className="w-3 h-3" />
                Buyer Experience
              </Link>
              <Link
                to={`/listing/${sampleListingId}/classic`}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors flex-shrink-0"
              >
                <Home className="w-3 h-3" />
                Buyer Classic
              </Link>
            </>
          )}
          <Link
            to="/design"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition-colors flex-shrink-0"
          >
            <Palette className="w-3 h-3" />
            Room Camera
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <nav className="border-b border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0 overflow-x-auto scrollbar-hide" style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
          {[
            { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
            { id: 'publication' as const, label: 'Publication', icon: Layers },
            { id: 'events' as const, label: 'Events', icon: Eye },
            { id: 'designs' as const, label: 'Designs', icon: Layers },
            { id: 'pitches' as const, label: 'Pitches', icon: FileText },
            { id: 'strategy' as const, label: 'Strategy', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-5 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-500'
                  : 'border-transparent text-stone-500 hover:text-stone-300'
              }`}
            >
              <tab.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* ── Overview ── */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Hero stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Interactions', value: totalEvents.toLocaleString(), icon: TrendingUp },
                { label: 'Listings', value: listingCount, icon: Layers },
                { label: 'Designs', value: designCount, icon: Eye },
                { label: 'Agents', value: agentCount, icon: Users },
              ].map(stat => (
                <div key={stat.label} className="border border-stone-800 bg-stone-900 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <stat.icon className="w-5 h-5 text-stone-600" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-bold text-stone-100" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-stone-500 uppercase tracking-wide mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Engagement metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-stone-800 bg-stone-900 p-5">
                <div className="text-xs text-stone-500 uppercase tracking-wide mb-2">Go Deeper Rate</div>
                <div className="text-2xl sm:text-4xl font-bold text-emerald-500" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {goDeepRate}%
                </div>
                <div className="text-xs text-stone-600 mt-1">of page views led to a deep dive</div>
              </div>
              <div className="border border-stone-800 bg-stone-900 p-5">
                <div className="text-xs text-stone-500 uppercase tracking-wide mb-2">Avg Time on Page</div>
                <div className="text-2xl sm:text-4xl font-bold text-emerald-500" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {avgTimeMs > 0 ? `${Math.round(avgTimeMs / 1000)}s` : '--'}
                </div>
                <div className="text-xs text-stone-600 mt-1">across all listing and room pages</div>
              </div>
              <div className="border border-stone-800 bg-stone-900 p-5">
                <div className="text-xs text-stone-500 uppercase tracking-wide mb-2">Partner CTA Clicks</div>
                <div className="text-2xl sm:text-4xl font-bold text-emerald-500" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                  {partnerClicks}
                </div>
                <div className="text-xs text-stone-600 mt-1">clicked through to design partner</div>
              </div>
            </div>

            {/* Device + Source breakdown side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Devices */}
              <div className="border border-stone-800 bg-stone-900 p-5">
                <div className="text-xs text-stone-500 uppercase tracking-wide mb-4">Device Breakdown</div>
                {deviceBreakdown.length === 0 ? (
                  <p className="text-stone-600 text-sm">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {deviceBreakdown.map(d => {
                      const total = deviceBreakdown.reduce((s, x) => s + x.count, 0);
                      const pct = Math.round((d.count / total) * 100);
                      return (
                        <div key={d.device_type} className="flex items-center gap-3">
                          {deviceIcon(d.device_type)}
                          <span className="text-stone-300 text-sm flex-1 capitalize">{d.device_type}</span>
                          <span className="text-stone-500 text-sm">{d.count}</span>
                          <div className="w-24 h-1.5 bg-stone-800 overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-stone-500 text-xs w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Sources */}
              <div className="border border-stone-800 bg-stone-900 p-5">
                <div className="text-xs text-stone-500 uppercase tracking-wide mb-4">Traffic Sources</div>
                {sourceBreakdown.length === 0 ? (
                  <p className="text-stone-600 text-sm">No data yet</p>
                ) : (
                  <div className="space-y-3">
                    {sourceBreakdown.map(s => {
                      const total = sourceBreakdown.reduce((sum, x) => sum + x.count, 0);
                      const pct = Math.round((s.count / total) * 100);
                      return (
                        <div key={s.source} className="flex items-center gap-3">
                          <span className="text-stone-300 text-sm flex-1 capitalize">{s.source}</span>
                          <span className="text-stone-500 text-sm">{s.count}</span>
                          <div className="w-24 h-1.5 bg-stone-800 overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-stone-500 text-xs w-8 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Event type breakdown */}
            <div className="border border-stone-800 bg-stone-900 p-5">
              <div className="text-xs text-stone-500 uppercase tracking-wide mb-4">Event Types</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {eventBreakdown.map(e => (
                  <div key={e.event_type} className="bg-stone-950 border border-stone-800 p-3">
                    <div className="text-lg font-bold text-stone-200" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {e.count}
                    </div>
                    <div className="text-xs text-stone-500 mt-1">{e.event_type.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Markets */}
            <div className="border border-stone-800 bg-stone-900 p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xs text-stone-500 uppercase tracking-wide">Markets</div>
                <button className="text-emerald-500 hover:text-emerald-400 text-xs font-medium flex items-center gap-1">
                  <Plus className="w-3 h-3" /> Add Market
                </button>
              </div>
              {markets.length === 0 ? (
                <div className="text-center py-8 border border-dashed border-stone-700">
                  <Globe className="w-8 h-8 mx-auto text-stone-600 mb-3" />
                  <p className="text-stone-500 text-sm">No markets configured yet</p>
                  <p className="text-stone-600 text-xs mt-1">Add your first market to start organizing deployments</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {markets.map(m => (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b border-stone-800 last:border-0">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-stone-600" />
                        <span className="text-stone-200 font-medium">{m.name}</span>
                        {m.region && <span className="text-stone-500 text-xs">{m.region}</span>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs px-2 py-0.5 ${
                          m.status === 'active' ? 'bg-green-900/50 text-green-400' :
                          m.status === 'planned' ? 'bg-stone-800 text-stone-400' :
                          'bg-emerald-950/50 text-emerald-300'
                        }`}>
                          {m.status}
                        </span>
                        <ChevronRight className="w-4 h-4 text-stone-600" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Per-Listing Engagement */}
            <div className="border border-stone-800 bg-stone-900 p-5">
              <div className="text-xs text-stone-500 uppercase tracking-wide mb-4">Listing Performance</div>
              {(() => {
                // Group events by listing
                const byListing: Record<string, { views: number; designs: number; goDeeper: number; timeMs: number; timeCount: number; spreads: number; products: number }> = {};
                for (const e of recentEvents) {
                  const lid = e.listing_id || 'unknown';
                  if (!byListing[lid]) byListing[lid] = { views: 0, designs: 0, goDeeper: 0, timeMs: 0, timeCount: 0, spreads: 0, products: 0 };
                  if (e.event_type === 'page_view') byListing[lid].views++;
                  if (e.event_type === 'design_expanded' || e.event_type === 'design_viewed') byListing[lid].designs++;
                  if (e.event_type === 'go_deeper_tapped') byListing[lid].goDeeper++;
                  if (e.event_type === 'spread_loaded') byListing[lid].spreads++;
                  if (e.event_type === 'partner_clicked' || e.event_type === 'room_cta_clicked') byListing[lid].products++;
                  if (e.event_type === 'time_on_page' && e.duration_ms) { byListing[lid].timeMs += e.duration_ms; byListing[lid].timeCount++; }
                }
                const entries = Object.entries(byListing).filter(([id]) => id !== 'unknown').sort((a, b) => b[1].views - a[1].views);
                if (entries.length === 0) return <p className="text-stone-600 text-sm">No listing data yet</p>;
                return (
                  <div className="space-y-3">
                    {entries.map(([lid, stats]) => (
                      <div key={lid} className="border border-stone-800 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <a href={`/listing/${lid}`} className="text-emerald-500 hover:text-emerald-400 text-sm font-mono transition-colors" target="_blank" rel="noopener">{lid}</a>
                          <a href={`/listing/${lid}/manage`} className="text-stone-600 hover:text-stone-400 text-[10px] uppercase tracking-wider transition-colors">Manage</a>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
                          <div>
                            <div className="text-xl font-bold text-stone-200" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stats.views}</div>
                            <div className="text-[10px] text-stone-500 uppercase">Views</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-stone-200" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stats.designs}</div>
                            <div className="text-[10px] text-stone-500 uppercase">Design Taps</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-stone-200" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stats.goDeeper}</div>
                            <div className="text-[10px] text-stone-500 uppercase">Go Deeper</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-stone-200" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{stats.spreads}</div>
                            <div className="text-[10px] text-stone-500 uppercase">Spreads</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-stone-200" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                              {stats.timeCount > 0 ? `${Math.round(stats.timeMs / stats.timeCount / 1000)}s` : '--'}
                            </div>
                            <div className="text-[10px] text-stone-500 uppercase">Avg Time</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Publication Manager ── */}
        {activeTab === 'publication' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-stone-100" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Publication Order
              </h2>
              <div className="flex items-center gap-3">
                <a href="/" target="_blank" rel="noopener" className="text-emerald-500 hover:text-emerald-400 text-xs uppercase tracking-wider transition-colors" style={{ fontFamily: 'Nunito, sans-serif' }}>
                  View Live
                </a>
                <button
                  onClick={async () => {
                    setSavingOrder(true);
                    for (let i = 0; i < pubListings.length; i++) {
                      await supabase.from('listings').update({ display_order: i + 1 }).eq('id', pubListings[i].id);
                    }
                    setSavingOrder(false);
                  }}
                  disabled={savingOrder}
                  className="px-4 py-2 bg-emerald-500 text-stone-900 font-bold text-xs uppercase tracking-wider hover:bg-emerald-400 transition-colors disabled:opacity-50"
                  style={{ fontFamily: 'Nunito, sans-serif' }}
                >
                  {savingOrder ? 'Saving...' : 'Save Order'}
                </button>
              </div>
            </div>
            <p className="text-stone-500 text-sm mb-6" style={{ fontFamily: 'Nunito, sans-serif' }}>
              Drag listings to reorder. The first listing appears as the hero on the homepage. Toggle featured to highlight specific properties.
            </p>
            {pubListings.length === 0 ? (
              <button
                onClick={async () => {
                  const { data } = await supabase.from('listings').select('id, address, city, state, price, neighborhood, is_featured, display_order, sold_date, hero_image').eq('status', 'ready').order('display_order');
                  setPubListings(data || []);
                }}
                className="px-4 py-2 border border-stone-700 text-stone-400 text-sm hover:border-stone-500 transition-colors"
              >
                Load Listings
              </button>
            ) : (
              <div className="space-y-2">
                {pubListings.map((listing, idx) => (
                  <div
                    key={listing.id}
                    className={`flex items-center gap-4 border p-4 transition-colors ${
                      listing.is_featured ? 'border-emerald-500/30 bg-emerald-950/10' : 'border-stone-800 bg-stone-900'
                    }`}
                  >
                    {/* Position controls */}
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => {
                          if (idx === 0) return;
                          const next = [...pubListings];
                          [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
                          setPubListings(next);
                        }}
                        className="text-stone-500 hover:text-stone-300 text-xs"
                        disabled={idx === 0}
                      >
                        ▲
                      </button>
                      <span className="text-stone-600 text-xs font-mono text-center w-6">{idx + 1}</span>
                      <button
                        onClick={() => {
                          if (idx === pubListings.length - 1) return;
                          const next = [...pubListings];
                          [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
                          setPubListings(next);
                        }}
                        className="text-stone-500 hover:text-stone-300 text-xs"
                        disabled={idx === pubListings.length - 1}
                      >
                        ▼
                      </button>
                    </div>

                    {/* Thumbnail */}
                    <div className="w-16 h-12 bg-stone-800 flex-shrink-0 overflow-hidden">
                      {listing.hero_image ? (
                        <img src={listing.hero_image} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-600 text-[8px]">No img</div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="text-stone-200 text-sm font-medium truncate">{listing.address}</div>
                      <div className="text-stone-500 text-xs" style={{ fontFamily: 'Nunito, sans-serif' }}>
                        {listing.city}, {listing.state} · ${(listing.price / 1_000_000).toFixed(1)}M
                        {listing.neighborhood ? ` · ${listing.neighborhood}` : ''}
                      </div>
                    </div>

                    {/* Featured toggle */}
                    <button
                      onClick={async () => {
                        const updated = pubListings.map(l => l.id === listing.id ? { ...l, is_featured: !l.is_featured } : l);
                        setPubListings(updated);
                        await supabase.from('listings').update({ is_featured: !listing.is_featured }).eq('id', listing.id);
                      }}
                      className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                        listing.is_featured
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'text-stone-600 border border-stone-700 hover:border-stone-500'
                      }`}
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                    >
                      {listing.is_featured ? 'Featured' : 'Feature'}
                    </button>

                    {/* SOLD toggle */}
                    <button
                      onClick={async () => {
                        const newDate = listing.sold_date ? null : new Date().toISOString().split('T')[0];
                        const updated = pubListings.map(l => l.id === listing.id ? { ...l, sold_date: newDate } : l);
                        setPubListings(updated);
                        await supabase.from('listings').update({ sold_date: newDate }).eq('id', listing.id);
                      }}
                      className={`px-3 py-1 text-[10px] uppercase tracking-wider transition-colors ${
                        listing.sold_date
                          ? 'bg-white/10 text-white border border-white/20'
                          : 'text-stone-600 border border-stone-700 hover:border-stone-500'
                      }`}
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                    >
                      {listing.sold_date ? 'Sold' : 'Mark Sold'}
                    </button>

                    {/* Manage link */}
                    <a
                      href={`/listing/${listing.id}/manage`}
                      target="_blank"
                      rel="noopener"
                      className="text-stone-600 hover:text-stone-400 text-[10px] uppercase tracking-wider transition-colors"
                      style={{ fontFamily: 'Nunito, sans-serif' }}
                    >
                      Manage
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Event Stream ── */}
        {activeTab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-stone-100" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Live Event Stream
              </h2>
              <button
                onClick={loadData}
                className="text-emerald-500 hover:text-emerald-400 text-sm font-medium"
              >
                Refresh
              </button>
            </div>
            <div className="border border-stone-800 bg-stone-900 overflow-hidden">
              <div className="max-h-[70vh] overflow-y-auto">
                {recentEvents.length === 0 ? (
                  <div className="text-center py-12">
                    <Eye className="w-8 h-8 mx-auto text-stone-600 mb-3" />
                    <p className="text-stone-500 text-sm">No events recorded yet</p>
                    <p className="text-stone-600 text-xs mt-1">Events will appear here as users interact with listings</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-stone-950 sticky top-0">
                      <tr className="text-left text-stone-500 text-xs uppercase tracking-wide">
                        <th className="px-4 py-3">Event</th>
                        <th className="px-4 py-3">Listing</th>
                        <th className="px-4 py-3">Device</th>
                        <th className="px-4 py-3">Source</th>
                        <th className="px-4 py-3">Duration</th>
                        <th className="px-4 py-3">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentEvents.map((e, i) => (
                        <tr key={i} className="border-t border-stone-800/50 hover:bg-stone-800/30">
                          <td className="px-4 py-2.5">
                            <span className="text-stone-300">{e.event_type.replace(/_/g, ' ')}</span>
                          </td>
                          <td className="px-4 py-2.5 text-stone-500 text-xs">{e.listing_id?.slice(0, 12) || '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-stone-500 text-xs capitalize">{e.device_type || '—'}</span>
                          </td>
                          <td className="px-4 py-2.5">
                            <span className="text-stone-500 text-xs capitalize">{e.source || '—'}</span>
                          </td>
                          <td className="px-4 py-2.5 text-stone-500 text-xs">
                            {e.duration_ms ? `${Math.round(e.duration_ms / 1000)}s` : '—'}
                          </td>
                          <td className="px-4 py-2.5 text-stone-600 text-xs">
                            {new Date(e.created_at).toLocaleTimeString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Design Intel ── */}
        {activeTab === 'designs' && (
          <div>
            <h2 className="text-xl font-bold text-stone-100 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
              Design Intelligence
            </h2>
            <p className="text-stone-500 text-sm mb-8">
              Which design directions resonate. Which get explored. Which drive action.
            </p>

            <div className="border border-stone-800 bg-stone-900 p-6">
              <p className="text-stone-500 text-sm mb-4">
                As interaction data accumulates, this view will surface:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  'Most viewed design directions by market',
                  'Go Deeper conversion rate by design style',
                  'Average time spent per design mood (warm vs minimal vs bold)',
                  'Which frameworks (Wabi-Sabi, Biophilic, etc.) generate the most engagement',
                  'Design partner click-through rate by design type',
                  'QR scan to Go Deeper funnel completion',
                  'Room type popularity (Living Room vs Kitchen vs Terrace)',
                  'Device-specific engagement patterns (mobile QR users vs desktop browsers)',
                ].map((insight, i) => (
                  <div key={i} className="flex items-start gap-3 py-2">
                    <div className="w-1 h-1 bg-emerald-500 mt-2 flex-shrink-0" />
                    <span className="text-stone-400 text-sm">{insight}</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-stone-800">
                <p className="text-stone-600 text-xs">
                  This intelligence is exclusive to you. It becomes the foundation for pitch portfolios sold to design firms and agencies.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Pitch Portfolios ── */}
        {activeTab === 'pitches' && (
          <PitchBuilder
            pitches={pitches}
            onPitchCreated={(p: PitchPortfolio) => setPitches(prev => [p, ...prev])}
            totalEvents={totalEvents}
            listingCount={listingCount}
            designCount={designCount}
            agentCount={agentCount}
            eventBreakdown={eventBreakdown}
            deviceBreakdown={deviceBreakdown}
            sourceBreakdown={sourceBreakdown}
          />
        )}

        {/* ── Strategy ── */}
        {activeTab === 'strategy' && (
          <div className="space-y-8">
            {/* Revenue Engines */}
            <div className="border border-stone-800 bg-stone-900 p-6">
              <h2 className="text-xl font-bold text-stone-100 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Revenue Engines
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    name: 'Affiliate Commerce',
                    status: 'pending',
                    action: 'Apply for Skimlinks',
                    potential: '$72K-$5.4M/yr',
                    desc: 'Every product click across every listing generates commission. Volume = revenue.',
                  },
                  {
                    name: 'Agent Subscriptions',
                    status: 'ready',
                    action: 'Launch Pro tier ($29/mo)',
                    potential: '$110K-$2.2M/yr',
                    desc: 'Free tier drives saturation. Pro unlocks unlimited listings, analytics, portraits.',
                  },
                  {
                    name: 'Design Partner Referrals',
                    status: 'live',
                    action: 'Formalize MODTAGE deal',
                    potential: '$300K-$2.4M/yr',
                    desc: 'Premium placement as "Advertisement" in every listing in their market.',
                  },
                  {
                    name: 'Data & Insights',
                    status: 'building',
                    action: 'Package pitch portfolios',
                    potential: '$100K-$500K/yr',
                    desc: 'Aggregated engagement data sold to agencies and design firms.',
                  },
                ].map(engine => (
                  <div key={engine.name} className="border border-stone-800 bg-stone-950 p-5">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-stone-200 font-bold text-sm">{engine.name}</h3>
                      <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${
                        engine.status === 'live' ? 'text-emerald-400 bg-emerald-500/10' :
                        engine.status === 'ready' ? 'text-blue-400 bg-blue-500/10' :
                        engine.status === 'building' ? 'text-amber-400 bg-amber-500/10' :
                        'text-stone-500 bg-stone-800'
                      }`}>{engine.status}</span>
                    </div>
                    <p className="text-stone-400 text-xs mb-3">{engine.desc}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-500 text-sm font-bold" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{engine.potential}</span>
                      <span className="text-stone-500 text-[10px]">{engine.action}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Unit Economics */}
            <div className="border border-stone-800 bg-stone-900 p-6">
              <h2 className="text-xl font-bold text-stone-100 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Unit Economics
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Cost per listing', value: '$0.32', sub: 'API + storage' },
                  { label: 'Cost per spread', value: '$0.005', sub: 'Gemini Flash' },
                  { label: 'Cost per portrait', value: '$0.06', sub: '3 generations' },
                  { label: 'Storage per listing', value: '~5 MB', sub: 'images + metadata' },
                ].map(metric => (
                  <div key={metric.label} className="bg-stone-950 border border-stone-800 p-4">
                    <div className="text-lg font-bold text-emerald-500" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {metric.value}
                    </div>
                    <div className="text-xs text-stone-400 mt-1">{metric.label}</div>
                    <div className="text-[10px] text-stone-600 mt-0.5">{metric.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* This Week's Actions */}
            <div className="border border-stone-800 bg-stone-900 p-6">
              <h2 className="text-xl font-bold text-stone-100 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Action Items
              </h2>
              <div className="space-y-3">
                {[
                  { priority: 'critical', task: 'Apply for Skimlinks account', owner: 'Dustin', due: 'This week' },
                  { priority: 'critical', task: 'Invite 5 SF agents to test', owner: 'Dustin', due: 'This week' },
                  { priority: 'high', task: 'Deploy i18n + multi-platform scraping', owner: 'Io', due: 'Ready to deploy' },
                  { priority: 'high', task: 'Contact MODTAGE about partnership terms', owner: 'Dustin', due: 'This week' },
                  { priority: 'high', task: 'Build agent landing page', owner: 'Io', due: 'Week 2' },
                  { priority: 'medium', task: 'Set up Google Analytics conversion tracking', owner: 'Io', due: 'Week 2' },
                  { priority: 'medium', task: 'Submit to Product Hunt', owner: 'Both', due: 'Week 3' },
                  { priority: 'medium', task: 'Create agent referral program', owner: 'Io', due: 'Week 3' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 bg-stone-950 border border-stone-800 p-3">
                    <span className={`w-2 h-2 flex-shrink-0 ${
                      item.priority === 'critical' ? 'bg-red-500' :
                      item.priority === 'high' ? 'bg-amber-500' :
                      'bg-stone-600'
                    }`} />
                    <span className="text-stone-200 text-sm flex-1">{item.task}</span>
                    <span className="text-stone-500 text-xs">{item.owner}</span>
                    <span className="text-stone-600 text-[10px]">{item.due}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Market Coverage */}
            <div className="border border-stone-800 bg-stone-900 p-6">
              <h2 className="text-xl font-bold text-stone-100 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Platform Coverage
              </h2>
              <p className="text-stone-400 text-xs mb-4">Listing intake supports 80+ real estate platforms worldwide</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { region: 'USA', platforms: 'Compass, Zillow, Redfin, Realtor.com, Coldwell Banker, Sotheby\'s, RE/MAX, Century 21, KW, Berkshire Hathaway', count: 15 },
                  { region: 'Canada', platforms: 'Realtor.ca, Royal LePage, REW', count: 4 },
                  { region: 'UK & Ireland', platforms: 'Rightmove, Zoopla, OnTheMarket, Purplebricks, Daft.ie', count: 7 },
                  { region: 'Europe', platforms: 'Idealista, Hemnet, Funda, ImmobilienScout24, SeLoger, Immobiliare.it', count: 18 },
                  { region: 'Australia & NZ', platforms: 'realestate.com.au, Domain, TradeMe', count: 4 },
                  { region: 'Asia', platforms: 'PropertyGuru, 99.co, MagicBricks, SUUMO', count: 8 },
                  { region: 'Middle East', platforms: 'Bayut, PropertyFinder, Dubizzle', count: 3 },
                  { region: 'Americas & Africa', platforms: 'Lamudi, VivaReal, Property24', count: 6 },
                ].map(region => (
                  <div key={region.region} className="bg-stone-950 border border-stone-800 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-stone-200 text-xs font-bold">{region.region}</span>
                      <span className="text-emerald-500 text-[10px]" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>{region.count}</span>
                    </div>
                    <p className="text-stone-500 text-[10px] leading-relaxed">{region.platforms}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div className="border border-stone-800 bg-stone-900 p-6">
              <h2 className="text-xl font-bold text-stone-100 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Path to $1M ARR
              </h2>
              <div className="space-y-4">
                {[
                  { milestone: '$10K MRR', timeline: 'Month 6', requirements: '50K monthly visitors, 250 Pro agents, 5 design partners', status: 'building' },
                  { milestone: '$50K MRR', timeline: 'Month 12', requirements: '150K visitors, 1,250 Pro agents, 20 design partners, 3 Agency accounts', status: 'planned' },
                  { milestone: '$83K MRR', timeline: 'Month 18', requirements: '250K visitors, 2,500 Pro agents, 50 design partners, 10 Agency accounts', status: 'planned' },
                  { milestone: '$10M ARR', timeline: 'Year 3', requirements: 'International expansion, 5,000 Pro + 200 Agency, 100 design partners', status: 'vision' },
                ].map(m => (
                  <div key={m.milestone} className="flex items-center gap-4 bg-stone-950 border border-stone-800 p-4">
                    <div className="text-lg font-bold text-emerald-500 w-24 flex-shrink-0" style={{ fontFamily: 'Space Grotesk, sans-serif' }}>
                      {m.milestone}
                    </div>
                    <div className="flex-1">
                      <div className="text-stone-200 text-sm mb-1">{m.timeline}</div>
                      <div className="text-stone-500 text-xs">{m.requirements}</div>
                    </div>
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-0.5 ${
                      m.status === 'building' ? 'text-emerald-400 bg-emerald-500/10' :
                      m.status === 'planned' ? 'text-blue-400 bg-blue-500/10' :
                      'text-stone-500 bg-stone-800'
                    }`}>{m.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
