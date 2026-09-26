import type { VercelRequest, VercelResponse } from '@vercel/node';

const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'https://your-app.com';

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>(); // for single-instance; use Redis in prod

function rateLimited(key: string, max = 3, windowMs = 60 * 60_000) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (b.count >= max) return true;
  b.count++;
  return false;
}

function sanitize(s: unknown, max: number) {
  return String(s ?? '').replace(/[`*_~<>|]/g, '').slice(0, max);
}

let cachedDmChannelId: string | null = null;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
    const ownerId = process.env.DISCORD_OWNER_ID?.trim();
    if (!botToken || !ownerId) {
      console.error('Discord env vars missing');
      return res.status(500).json({ error: 'Service unavailable' });
    }

    // 1) rate limit by IP
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
    if (rateLimited(ip)) return res.status(429).json({ error: 'Too many requests' });

    // 2) auth: only signed-in users can request (verify Supabase JWT here)
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    if (!token) return res.status(401).json({ error: 'Unauthorized' });
    const user = await verifySupabaseUser(token); // <- your own helper
    if (!user) return res.status(401).json({ error: 'Unauthorized' });

    // 3) validate
    const reason = sanitize(req.body?.reason, 500).trim();
    if (reason.length < 5) return res.status(400).json({ error: 'Reason is too short' });

    // 4) get or create DM channel
    if (!cachedDmChannelId) {
      const r = await fetch('https://discord.com/api/v10/users/@me/channels', {
        method: 'POST',
        headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient_id: ownerId }),
      });
      if (!r.ok) {
        console.error('DM channel failed', r.status, await r.text());
        return res.status(502).json({ error: 'Notification failed' });
      }
      cachedDmChannelId = (await r.json()).id;
    }

    // 5) send
    const m = await fetch(
      `https://discord.com/api/v10/channels/${cachedDmChannelId}/messages`,
      {
        method: 'POST',
        headers: { Authorization: `Bot ${botToken}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content:
            `🚨 **New Admin Access Request** 🚨\n` +
            `**User:** ${sanitize(user.email, 100)}\n` +
            `**ID:** ${sanitize(user.id, 64)}\n` +
            `**Reason:** ${reason || 'No reason provided'}\n\n` +
            `Please review this request in Supabase Auth.`,
        }),
      }
    );
    if (!m.ok) {
      console.error('Send failed', m.status, await m.text());
      return res.status(502).json({ error: 'Notification failed' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('request-admin error', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
