import express from 'express';
import path from 'path';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(cors());
  app.use(express.json());

  // --- API Routes (From Vercel serverless functions) ---

  // /api/config-check
  app.get('/api/config-check', (req, res) => {
    return res.status(200).json({
      node_version: process.version,
      env: process.env.NODE_ENV,
      discord_token_set: !!process.env.DISCORD_BOT_TOKEN,
      discord_token_length: process.env.DISCORD_BOT_TOKEN?.length || 0,
      discord_owner_id_set: !!process.env.DISCORD_OWNER_ID,
      fetch_available: typeof fetch !== "undefined",
      is_vercel: false,
      is_express: true
    });
  });

  // /api/test-discord
  app.post('/api/test-discord', async (req, res) => {
    try {
      const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
      const ownerId = process.env.DISCORD_OWNER_ID?.trim();

      if (!botToken || !ownerId) {
        return res.status(500).json({ error: "Discord configuration is missing: TOKEN or ID not set in environment." });
      }

      const botInfoRes = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { "Authorization": `Bot ${botToken}` }
      });
      if (!botInfoRes.ok) {
        const err = await botInfoRes.json().catch(() => ({}));
        return res.status(401).json({ error: "Invalid Discord Bot Token.", details: err?.message || 'Unknown API Error' });
      }
      const botData = await botInfoRes.json();

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
          details: errorData?.message || "Unknown error"
        });
      }
      const dmChannel = await dmChannelRes.json();
      const channelId = dmChannel.id;

      const messageRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bot ${botToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: "🔔 **Discord Notification Test (Express Backend)**\nIf you see this message, your bot is configured correctly! 🎉" })
      });

      if (!messageRes.ok) {
        return res.status(500).json({ error: "DM channel created but failed to send message." });
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
  });

  // /api/notify-order
  app.post('/api/notify-order', async (req, res) => {
    try {
      const { order, items } = req.body;
      const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
      const ownerId = process.env.DISCORD_OWNER_ID?.trim();

      if (!botToken || !ownerId) {
        return res.status(500).json({ error: "Discord configuration is missing." });
      }

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
  });

  // /api/request-admin
  app.post('/api/request-admin', async (req, res) => {
    try {
      const { user, reason } = req.body;
      const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
      const ownerId = process.env.DISCORD_OWNER_ID?.trim();

      if (!botToken || !ownerId) {
        return res.status(500).json({ error: "Discord configuration is missing: TOKEN or ID not set in environment." });
      }

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
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    // Notice Express 5 compatibility, use *
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
