/**
 * Simple password gate for staging.
 * POST /api/auth-gate with { password } → sets cookie → redirects to /
 * 
 * Password: set via STAGING_PASSWORD env var (default: room2026)
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';

const STAGING_PASSWORD = process.env.STAGING_PASSWORD || 'room2026';
const COOKIE_NAME = 'room_access';
const COOKIE_VALUE = 'granted';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'POST') {
    const { password } = req.body || {};
    if (password === STAGING_PASSWORD) {
      // Set cookie for 30 days
      res.setHeader('Set-Cookie', `${COOKIE_NAME}=${COOKIE_VALUE}; Path=/; Max-Age=${30 * 24 * 60 * 60}; SameSite=Lax`);
      return res.status(200).json({ ok: true });
    }
    return res.status(401).json({ error: 'Wrong password' });
  }
  
  // GET — check if authenticated
  const cookies = req.headers.cookie || '';
  const hasAccess = cookies.includes(`${COOKIE_NAME}=${COOKIE_VALUE}`);
  return res.status(200).json({ authenticated: hasAccess });
}
