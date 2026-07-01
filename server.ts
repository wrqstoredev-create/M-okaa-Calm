import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";

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
      const botToken = process.env.DISCORD_BOT_TOKEN;
      const ownerId = process.env.DISCORD_OWNER_ID;

      if (!botToken || !ownerId) {
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
        const error = await dmChannelRes.text();
        console.error("Failed to create DM channel:", error);
        return res.status(500).json({ error: "Failed to connect to Discord." });
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
        const error = await messageRes.text();
        console.error("Failed to send message:", error);
        return res.status(500).json({ error: "Failed to send message via Discord." });
      }

      res.json({ success: true, message: "Request sent to server owner." });
    } catch (error: any) {
      console.error("Error in /api/request-admin:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/notify-order", async (req, res) => {
    try {
      const { order, items } = req.body;
      const botToken = process.env.DISCORD_BOT_TOKEN;
      const ownerId = process.env.DISCORD_OWNER_ID;

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
        const error = await dmChannelRes.text();
        console.error("Failed to create DM channel:", error);
        return res.status(500).json({ error: "Failed to connect to Discord." });
      }

      const dmChannel = await dmChannelRes.json();
      const channelId = dmChannel.id;

      // Construct rich message
      const itemsList = items.map((item: any) => 
        `• ${item.title} (x${item.quantity}) - ${item.price} EGP`
      ).join('\n');

      const embed: any = {
        title: "🛒 New Order Received!",
        color: 0xcc2229, // Brand red
        fields: [
          { name: "Order ID", value: `#${order.id}`, inline: true },
          { name: "Customer", value: order.customer_email, inline: true },
          { name: "Total Price", value: `${order.total_price} EGP`, inline: true },
          { name: "Payment Method", value: order.payment_method.split('___')[0], inline: true },
          { name: "Status", value: order.status, inline: true },
          { name: "Items", value: itemsList || "No items listed" }
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
        const error = await messageRes.text();
        console.error("Failed to send order message:", error);
        return res.status(500).json({ error: "Failed to send order notification." });
      }

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error in /api/notify-order:", error.message);
      res.status(500).json({ error: "Internal server error" });
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
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
