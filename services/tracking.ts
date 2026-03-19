/**
 * ZenSpace Interaction Tracking — Privacy-first, no PII
 *
 * - No cookies, no localStorage persistence
 * - Session token is random per page load (not persistent across visits)
 * - No IP logging (Supabase REST doesn't store client IP by default)
 * - No fingerprinting, no user identification
 * - Captures WHAT happened, never WHO did it
 */

const SUPABASE_URL = 'https://vqkoxfenyjomillmxawh.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_tbmaJvWmkumAPUuI133fXw_JcHXJU4o';

// Random session token per page load — dies when tab closes
const SESSION_TOKEN = crypto.randomUUID?.() || Math.random().toString(36).slice(2);

function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  const w = window.innerWidth;
  if (w < 768) return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

function getReferrerDomain(): string | null {
  if (typeof document === 'undefined') return null;
  try {
    const ref = document.referrer;
    if (!ref) return null;
    return new URL(ref).hostname;
  } catch {
    return null;
  }
}

function getSource(): string {
  if (typeof window === 'undefined') return 'direct';
  const params = new URLSearchParams(window.location.search);
  if (params.get('source') === 'qr') return 'qr';
  if (params.get('utm_source')) return params.get('utm_source')!;
  if (document.referrer) return 'referral';
  return 'direct';
}

interface TrackOptions {
  eventType: string;
  listingId?: string;
  roomId?: string;
  designId?: string;
  marketId?: string;
  durationMs?: number;
  metadata?: Record<string, unknown>;
}

// Queue events and flush in batches (reduces API calls)
let eventQueue: TrackOptions[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

function flushEvents() {
  if (eventQueue.length === 0) return;

  const events = [...eventQueue];
  eventQueue = [];

  const rows = events.map(e => ({
    event_type: e.eventType,
    listing_id: e.listingId || null,
    room_id: e.roomId || null,
    design_id: e.designId || null,
    market_id: e.marketId || null,
    duration_ms: e.durationMs || null,
    metadata: e.metadata || {},
    session_token: SESSION_TOKEN,
    device_type: getDeviceType(),
    source: getSource(),
    referrer_domain: getReferrerDomain(),
  }));

  // Fire and forget — tracking should never block the UI
  fetch(`${SUPABASE_URL}/rest/v1/interaction_events`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify(rows),
  }).catch(() => {
    // Silent fail — never interrupt the user experience for tracking
  });
}

/**
 * Track an interaction event.
 * Events are batched and flushed every 2 seconds to reduce API calls.
 */
export function track(options: TrackOptions) {
  eventQueue.push(options);

  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(flushEvents, 2000);
}

/**
 * Track time spent on a page/spread.
 * Returns a cleanup function that sends the duration when called.
 */
export function trackTimeOnPage(options: Omit<TrackOptions, 'eventType' | 'durationMs'>) {
  const start = Date.now();
  let sent = false;

  const send = () => {
    if (sent) return;
    sent = true;
    const duration = Date.now() - start;
    if (duration > 1000) { // Only track if > 1 second (filter bounces)
      track({ ...options, eventType: 'time_on_page', durationMs: duration });
      flushEvents(); // Flush immediately on page leave
    }
  };

  // Send on page hide (covers tab close, navigate away, app switch on mobile)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') send();
    }, { once: true });
  }

  return send;
}

/**
 * Flush any remaining events (call on unmount or before navigation).
 */
export function flushTracking() {
  flushEvents();
}

/**
 * Track time an element is visible in the viewport.
 * Uses IntersectionObserver — starts timer when element enters view,
 * logs duration when it leaves. Returns a cleanup function.
 *
 * Use for: design cards, spread sections, partner blocks.
 */
export function trackVisibility(
  element: HTMLElement | null,
  options: Omit<TrackOptions, 'eventType' | 'durationMs'> & { eventType: string; threshold?: number }
) {
  if (!element || typeof IntersectionObserver === 'undefined') return () => {};

  let enterTime: number | null = null;
  let totalVisible = 0;

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          enterTime = Date.now();
        } else if (enterTime !== null) {
          totalVisible += Date.now() - enterTime;
          enterTime = null;
        }
      }
    },
    { threshold: options.threshold ?? 0.5 }
  );

  observer.observe(element);

  // Return cleanup that logs the final duration
  return () => {
    // Capture any remaining visible time
    if (enterTime !== null) {
      totalVisible += Date.now() - enterTime;
      enterTime = null;
    }
    observer.disconnect();
    if (totalVisible > 500) { // Only log if visible > 0.5s
      track({
        ...options,
        durationMs: totalVisible,
      });
    }
  };
}
