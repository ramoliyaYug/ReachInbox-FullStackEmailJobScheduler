import { Request, Response } from "express";
import prisma from "../config/prisma";
import { sendSlackNotification } from "../services/slackService";

export const getSlackStatus = async (req: Request, res: Response) => {
  try {
    const config = await prisma.slackConfig.findFirst({
      where: { userId: "default_user" },
    });

    return res.json({
      isConnected: config?.isConnected || false,
      webhookUrl: config?.webhookUrl || null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch Slack status" });
  }
};

export const connectSlack = async (req: Request, res: Response) => {
  try {
    const { webhookUrl } = req.body;

    if (!webhookUrl || !webhookUrl.startsWith("http")) {
      return res.status(400).json({ message: "Valid Slack Webhook URL is required" });
    }

    const updated = await prisma.slackConfig.upsert({
      where: { userId: "default_user" },
      update: {
        webhookUrl,
        isConnected: true,
      },
      create: {
        userId: "default_user",
        webhookUrl,
        isConnected: true,
      },
    });

    // Send welcome / test notification
    await sendSlackNotification("🔗 Slack successfully connected to ReachInbox Email Scheduler!", {
      Status: "Active",
      "Connected At": new Date().toLocaleString(),
    });

    return res.json({
      message: "Slack connected successfully",
      isConnected: true,
      webhookUrl: updated.webhookUrl,
    });
  } catch (error) {
    console.error("Error connecting Slack:", error);
    return res.status(500).json({ message: "Failed to connect Slack" });
  }
};

export const disconnectSlack = async (req: Request, res: Response) => {
  try {
    await prisma.slackConfig.updateMany({
      where: { userId: "default_user" },
      data: { isConnected: false },
    });

    return res.json({ message: "Slack disconnected successfully", isConnected: false });
  } catch (error) {
    return res.status(500).json({ message: "Failed to disconnect Slack" });
  }
};
