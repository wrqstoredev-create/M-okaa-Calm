import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  return res.status(200).json({
    node_version: process.version,
    env: process.env.NODE_ENV,
    discord_token_set: !!process.env.DISCORD_BOT_TOKEN,
    discord_token_length: process.env.DISCORD_BOT_TOKEN?.length || 0,
    discord_owner_id_set: !!process.env.DISCORD_OWNER_ID,
    fetch_available: typeof fetch !== "undefined",
    is_vercel: true
  });
}
