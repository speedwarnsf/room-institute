/**
 * Affiliate click tracking service
 * Stores analytics in localStorage for monetization insights
 */

interface ClickEvent {
  productId: string;
  productName: string;
  designDirection: string;
  category: string;
  timestamp: number;
  sessionId: string;
}

const STORAGE_KEY = 'room-institute_affiliate_clicks';

function getClicks(): ClickEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveClicks(clicks: ClickEvent[]): void {
  try {
    // Keep last 500 events to avoid storage bloat
    const trimmed = clicks.slice(-500);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // Storage full — silently fail
  }
}

export function trackProductClick(
  productId: string,
  productName: string,
  designDirection: string,
  category: string,
  sessionId: string
): void {
  const event: ClickEvent = {
    productId,
    productName,
    designDirection,
    category,
    timestamp: Date.now(),
    sessionId,
  };
  const clicks = getClicks();
  clicks.push(event);
  saveClicks(clicks);
}

export function getClickAnalytics() {
  const clicks = getClicks();
  const byDesign: Record<string, number> = {};
  const byCategory: Record<string, number> = {};

  for (const c of clicks) {
    byDesign[c.designDirection] = (byDesign[c.designDirection] || 0) + 1;
    byCategory[c.category] = (byCategory[c.category] || 0) + 1;
  }

  return { total: clicks.length, byDesign, byCategory, events: clicks };
}
