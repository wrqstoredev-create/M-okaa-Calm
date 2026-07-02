import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup
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
    const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
    const ownerId = process.env.DISCORD_OWNER_ID?.trim();

    if (!botToken || !ownerId) {
      return res.status(500).json({ error: "Discord configuration is missing: TOKEN or ID not set in environment." });
    }

    // Step 1: Validate Token and Get Bot Info
    const botInfoRes = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { "Authorization": `Bot ${botToken}` }
    });

    if (!botInfoRes.ok) {
      const err = await botInfoRes.json().catch(() => ({}));
      return res.status(401).json({ error: "Invalid Discord Bot Token.", details: err?.message || 'Unknown API Error' });
    }

    const botData = await botInfoRes.json();

    // Step 2: Try to create DM channel
    const dmChannelRes = await fetch("https://discord.com/api/v10/users/@me/channels", {
      method: "POST",
      headers: {
        "Authorization": `Bot ${botToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ recipient_id: ownerId })
    });

    if (!dmChannelRes.ok) {
      const errorData = await dmChannelRes.json().catch(() => ({}));
      return res.status(500).json({ 
        error: "Failed to create DM channel with owner.",
        details: errorData?.message || "Unknown error (check if Owner ID is correct and Bot has DMs enabled)"
      });
    }

    const dmChannel = await dmChannelRes.json();
    const channelId = dmChannel.id;

    // Step 3: Send test message
    const messageRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${botToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content: "🔔 **Discord Notification Test (Vercel Serverless)**\nIf you see this message, your MokaaStore bot is configured correctly! 🎉" })
    });

    if (!messageRes.ok) {
      return res.status(500).json({ error: "DM channel created but failed to send message. Check Bot permissions." });
    }

    return res.status(200).json({ 
      success: true, 
      bot_name: botData.username,
      message: "Test message sent successfully! Please check your Discord DMs."
    });
  } catch (error: any) {
    console.error("Error in /api/test-discord:", error.message);
    return res.status(500).json({ error: "Server error during Discord test", message: error.message });
  }
}
