import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { user, reason } = req.body;
    const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
    const ownerId = process.env.DISCORD_OWNER_ID?.trim();

    if (!botToken || !ownerId) {
      return res.status(500).json({ error: "Discord configuration is missing: TOKEN or ID not set in environment." });
    }

    // Step 1: Create a DM channel with the owner
    const dmChannelRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST",
      headers: {
        "Authorization": `Bot ${botToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ recipient_id: ownerId })
    });

    if (!dmChannelRes.ok) {
      const errorData = await dmChannelRes.json().catch(() => ({ message: "Unknown error" }));
      return res.status(500).json({ 
        error: "Discord connection failed (DM Channel).",
        details: errorData?.message || "Unknown Discord error"
      });
    }

    const dmChannel = await dmChannelRes.json();
    const channelId = dmChannel.id;

    // Step 2: Send the notification message
    const messageRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${botToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ 
        content: `🚨 **New Admin Access Request** 🚨\n\n**User:** ${user?.email}\n**ID:** ${user?.id}\n**Reason:** ${reason || 'No reason provided'}\n\nPlease review this request in Supabase Auth.` 
      })
    });

    if (!messageRes.ok) {
      const errorData = await messageRes.json().catch(() => ({ message: "Unknown error" }));
      return res.status(500).json({ 
        error: "Failed to send message via Discord.",
        details: errorData?.message || "Unknown Discord error"
      });
    }

    return res.status(200).json({ success: true, message: "Admin request sent to owner." });
  } catch (error: any) {
    console.error("Error in /api/request-admin:", error.message);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
