import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware to parse JSON body
  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/request-admin", async (req, res) => {
    try {
      const { user, reason } = req.body;
      const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
      const ownerId = process.env.DISCORD_OWNER_ID?.trim();

      if (!botToken || !ownerId) {
        console.error("Discord configuration is missing: TOKEN or ID not set.");
        return res.status(500).json({ error: "Discord configuration is missing." });
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
        const errorData = await dmChannelRes.json();
        console.error("Discord API Error (Create DM):", errorData);
        return res.status(500).json({ 
          error: "Failed to connect to Discord.",
          details: errorData.message || "Unknown error"
        });
      }

      const dmChannel = await dmChannelRes.json();
      const channelId = dmChannel.id;

      // Step 2: Send message to the channel
      const messageContent = `🚨 **New Admin Request** 🚨\n\n**User:** ${user || "Unknown"}\n**Reason:** ${reason || "No reason provided"}`;
      
      const messageRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bot ${botToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ content: messageContent })
      });

      if (!messageRes.ok) {
        const errorData = await messageRes.json();
        console.error("Discord API Error (Send Message):", errorData);
        return res.status(500).json({ 
          error: "Failed to send message via Discord.",
          details: errorData.message || "Unknown error"
        });
      }

      res.json({ success: true, message: "Request sent to server owner." });
    } catch (error: any) {
      console.error("Error in /api/request-admin:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/test-discord", async (req, res) => {
    try {
      const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
      const ownerId = process.env.DISCORD_OWNER_ID?.trim();

      if (!botToken || !ownerId) {
        return res.status(400).json({ error: "Missing DISCORD_BOT_TOKEN or DISCORD_OWNER_ID in environment variables." });
      }

      // Step 1: Validate Token and Get Bot Info
      const botInfoRes = await fetch("https://discord.com/api/v10/users/@me", {
        headers: { "Authorization": `Bot ${botToken}` }
      });

      if (!botInfoRes.ok) {
        return res.status(401).json({ error: "Invalid Discord Bot Token." });
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
        const errorData = await dmChannelRes.json();
        return res.status(500).json({ 
          error: "Failed to create DM channel with owner.",
          details: errorData.message || "Unknown error (possibly ID is wrong or bot lacks permissions)"
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
        body: JSON.stringify({ content: "🔔 **Discord Notification Test**\nIf you see this message, your MokaaStore bot is configured correctly! 🎉" })
      });

      if (!messageRes.ok) {
        return res.status(500).json({ error: "DM channel created but failed to send message." });
      }

      res.json({ 
        success: true, 
        bot_name: botData.username,
        message: "Test message sent successfully! Please check your Discord DMs."
      });
    } catch (error: any) {
      console.error("Error in /api/test-discord:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/notify-order", async (req, res) => {
    try {
      const { order, items } = req.body;
      const botToken = process.env.DISCORD_BOT_TOKEN?.trim();
      const ownerId = process.env.DISCORD_OWNER_ID?.trim();

      console.log(`Processing order notification for order #${order?.id || 'unknown'}`);

      if (!botToken || !ownerId) {
        console.error("Discord configuration is missing: TOKEN or ID not set.");
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
        const errorData = await dmChannelRes.json();
        console.error("Discord API Error (Create DM for order):", errorData);
        return res.status(500).json({ 
          error: "Failed to connect to Discord.",
          details: errorData.message || "Unknown error"
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
      }).join('\n').substring(0, 1024); // Truncate to avoid field limit

      const embed: any = {
        title: "🛒 New Order Received!",
        color: 0xcc2229, // Brand red
        fields: [
          { name: "Order ID", value: `#${order.id || 'N/A'}`, inline: true },
          { name: "Customer", value: order.customer_email || 'N/A', inline: true },
          { name: "Total Price", value: `${order.total_price || 0} EGP`, inline: true },
          { name: "Payment Method", value: (order.payment_method || 'unknown').split('___')[0], inline: true },
          { name: "Status", value: order.status || 'pending', inline: true },
          { name: "Items & Details", value: itemsList || "No items listed" }
        ],
        timestamp: new Date().toISOString(),
        footer: { text: "MokaaStore Order Notification" }
      };

      if (order.payment_screenshot_url) {
        embed.image = { url: order.payment_screenshot_url };
      }

      const messageRes = await fetch(`https://discord.com/api/v10/channels/${channelId}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Bot ${botToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ embeds: [embed] })
      });

      if (!messageRes.ok) {
        const errorData = await messageRes.json();
        console.error("Discord API Error (Send order message):", errorData);
        return res.status(500).json({ 
          error: "Failed to send order notification.",
          details: errorData.message || "Unknown error"
        });
      }

      console.log(`Successfully sent Discord notification for order #${order?.id}`);
      res.json({ success: true });
    } catch (error: any) {
      console.error("Error in /api/notify-order:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Vite middleware or Static Serving - Defined AFTER API routes
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  return app;
}

export const appPromise = startServer();
