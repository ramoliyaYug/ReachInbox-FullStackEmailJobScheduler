import axios from "axios";
import prisma from "../config/prisma";

export const sendSlackNotification = async (message: string, details?: any) => {
  try {
    const slackConfig = await prisma.slackConfig.findFirst({
      where: { isConnected: true },
    });

    if (!slackConfig || !slackConfig.webhookUrl) {
      console.log("ℹ️ Slack notification skipped: User has not connected Slack.");
      return false;
    }

    const payload = {
      text: `🚨 *ReachInbox Rate Limit Alert* 🚨\n${message}`,
      attachments: details
        ? [
            {
              color: "#FF385C",
              fields: Object.entries(details).map(([key, val]) => ({
                title: key,
                value: String(val),
                short: true,
              })),
              ts: Math.floor(Date.now() / 1000),
            },
          ]
        : undefined,
    };

    await axios.post(slackConfig.webhookUrl, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    console.log("✅ Live Slack notification sent successfully!");
    return true;
  } catch (err) {
    console.error("❌ Failed to send Slack notification:", (err as Error).message);
    return false;
  }
};
