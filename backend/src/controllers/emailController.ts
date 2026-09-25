import { Request, Response } from "express";
import prisma from "../config/prisma";
import emailQueue from "../queue/emailQueue";
import { indexEmail, searchEmailsInES } from "../services/elasticsearchService";

export const scheduleEmail = async (req: Request, res: Response) => {
  try {
    const { recipient, subject, body, scheduledTime, senderEmail } = req.body;

    if (!recipient || !subject || !body || !scheduledTime || !senderEmail) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const email = await prisma.email.create({
      data: {
        recipient,
        subject,
        body,
        scheduledTime: new Date(scheduledTime),
        senderEmail,
        status: "Scheduled",
      },
    });

    // Index initial record in Elasticsearch
    await indexEmail(email);

    const delay = new Date(scheduledTime).getTime() - Date.now();

    await emailQueue.add(
      "send-email",
      { emailId: email.id },
      {
        jobId: `email-${email.id}`,
        delay: Math.max(delay, 0),
        removeOnComplete: false,
        removeOnFail: false,
      }
    );

    return res.status(201).json(email);
  } catch (error) {
    console.error("Error scheduling email:", error);
    return res.status(500).json({ message: "Failed to schedule email" });
  }
};

export const scheduleBatch = async (req: Request, res: Response) => {
  try {
    const { recipients, subject, body, scheduledTime, senderEmail, delayBetweenEmails } = req.body;

    if (!Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({ message: "Recipients array is required" });
    }

    const createdEmails = [];
    const baseTime = new Date(scheduledTime).getTime();
    const staggerMs = (Number(delayBetweenEmails) || 2) * 1000;

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      const emailTime = new Date(baseTime + i * staggerMs);

      const email = await prisma.email.create({
        data: {
          recipient,
          subject,
          body,
          scheduledTime: emailTime,
          senderEmail,
          status: "Scheduled",
        },
      });

      await indexEmail(email);

      const delay = emailTime.getTime() - Date.now();

      await emailQueue.add(
        "send-email",
        { emailId: email.id },
        {
          jobId: `email-${email.id}`,
          delay: Math.max(delay, 0),
          removeOnComplete: false,
          removeOnFail: false,
        }
      );

      createdEmails.push(email);
    }

    return res.status(201).json({
      message: `Successfully scheduled ${createdEmails.length} emails`,
      emails: createdEmails,
    });
  } catch (error) {
    console.error("Error scheduling batch emails:", error);
    return res.status(500).json({ message: "Failed to schedule batch emails" });
  }
};

export const getScheduledEmails = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (query) {
      const esResults = await searchEmailsInES(query);
      if (esResults) {
        const filtered = esResults.filter((e: any) => e.status === "Scheduled");
        return res.json(filtered);
      }
    }

    const emails = await prisma.email.findMany({
      where: { status: "Scheduled" },
      orderBy: { scheduledTime: "asc" },
    });

    return res.json(emails);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching scheduled emails" });
  }
};

export const getSentEmails = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (query) {
      const esResults = await searchEmailsInES(query);
      if (esResults) {
        const filtered = esResults.filter((e: any) => e.status === "Sent" || e.status === "Failed");
        return res.json(filtered);
      }
    }

    const emails = await prisma.email.findMany({
      where: {
        status: { in: ["Sent", "Failed"] },
      },
      orderBy: { sentAt: "desc" },
    });

    return res.json(emails);
  } catch (error) {
    return res.status(500).json({ message: "Error fetching sent emails" });
  }
};

export const searchEmails = async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) {
      const all = await prisma.email.findMany({ orderBy: { createdAt: "desc" } });
      return res.json(all);
    }

    const results = await searchEmailsInES(q);
    if (results) {
      return res.json(results);
    }

    // DB fallback search
    const emails = await prisma.email.findMany({
      where: {
        OR: [
          { recipient: { contains: q, mode: "insensitive" } },
          { subject: { contains: q, mode: "insensitive" } },
          { body: { contains: q, mode: "insensitive" } },
          { senderEmail: { contains: q, mode: "insensitive" } },
        ],
      },
    });

    return res.json(emails);
  } catch (error) {
    return res.status(500).json({ message: "Error performing search" });
  }
};