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
    const { order, items } = req.body;
    const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
    const ownerId = process.env.DISCORD_OWNER_ID?.trim();

    if (!botToken || !ownerId) {
      return res.status(500).json({ error: "Discord configuration is missing." });
    }

    // Create DM channel
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
        error: "Failed to connect to Discord.",
        details: errorData?.message || "DM channel creation failed"
      });
    }

    const dmChannel = await dmChannelRes.json();
    const channelId = dmChannel.id;

    // Construct rich message
    const itemsList = (items || []).map((item: any) => {
      let text = `• ${item.title} (x${item.quantity})`;
      if (item.customerData) {
        const cd = item.customerData;
        if (cd.player_id) text += `\n  └ ID: ${cd.player_id}`;
        if (cd.player_username) text += `\n  └ User: ${cd.player_username}`;
        if (cd.player_phone) text += `\n  └ Phone: ${cd.player_phone}`;
        if (cd.player_social) text += `\n  └ Social: ${cd.player_social}`;
      }
      return text;
    }).join('\n').substring(0, 1024);

    const embed: any = {
      title: "🛒 New Order Received!",
      color: 0xff0000,
      fields: [
        { name: "Order ID", value: order.id.substring(0, 8), inline: true },
        { name: "Total Price", value: `${order.total_price || 0} EGP`, inline: true },
        { name: "Payment Method", value: (order.payment_method || 'unknown').split('___')[0], inline: true },
        { name: "Status", value: order.status || 'pending', inline: true },
        { name: "Items & Details", value: itemsList || "No items listed" }
      ],
      timestamp: new Date().toISOString(),
      footer: { text: "MokaaStore Order Notification" }
    };

    const messageRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
      method: "POST",
      headers: {
        "Authorization": `Bot ${botToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ embeds: [embed] })
    });

    if (!messageRes.ok) {
      const errorData = await messageRes.json().catch(() => ({}));
      return res.status(500).json({ 
        error: "Failed to send order notification via Discord.",
        details: errorData?.message || "Unknown error"
      });
    }

    return res.status(200).json({ success: true, message: "Order notification sent." });
  } catch (error: any) {
    console.error("Error in /api/notify-order:", error.message);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
}
