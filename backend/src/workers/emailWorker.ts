import { Worker } from "bullmq";
import prisma from "../config/prisma";
import redis from "../config/redis";
import { sendEmail } from "../services/emailService";
import { indexEmail } from "../services/elasticsearchService";
import { sendSlackNotification } from "../services/slackService";
import emailQueue from "../queue/emailQueue";

console.log("⚡ ReachInbox Email Worker Starting...");

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const getSenderHourKey = (senderEmail: string) => {
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}-${now.getHours()}`;
  return `emails:sender:${senderEmail}:${dateStr}`;
};

const getMsUntilNextHour = (): number => {
  const now = new Date();
  const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0, 0, 0);
  return nextHour.getTime() - now.getTime();
};

const emailWorker = new Worker(
  "email-queue",
  async (job) => {
    const { emailId } = job.data;
    console.log(`----------------------------------------`);
    console.log(`Processing Job: ${job.id} | Email ID: ${emailId}`);

    const email = await prisma.email.findUnique({
      where: { id: emailId },
    });

    if (!email) {
      console.warn(`Email ID ${emailId} not found in database.`);
      return;
    }

    // Maintain idempotency
    if (email.status === "Sent") {
      console.log(`Email ID ${emailId} was already sent. Skipping.`);
      return;
    }

    // Per-email throttling delay
    const delaySeconds = Number(process.env.EMAIL_DELAY_SECONDS) || 2;
    await sleep(delaySeconds * 1000);

    // Sender-based hourly rate limit checking via Redis counters
    const hourKey = getSenderHourKey(email.senderEmail);
    const currentCount = await redis.incr(hourKey);
    await redis.expire(hourKey, 3600);

    const maxEmails = Number(process.env.MAX_EMAILS_PER_HOUR) || 10;

    if (currentCount > maxEmails) {
      const msToNextHour = getMsUntilNextHour();
      const minutesRemaining = Math.ceil(msToNextHour / (60 * 1000));

      console.warn(
        `🚨 Rate limit hit for sender ${email.senderEmail}! (${currentCount}/${maxEmails} emails sent this hour)`
      );
      console.log(`Rescheduling Email ID ${emailId} for next hour window in ${minutesRemaining} minutes...`);

      // Send live Slack alert
      await sendSlackNotification(
        `Hourly Rate Limit Exceeded for Sender: *${email.senderEmail}*`,
        {
          "Sender Email": email.senderEmail,
          "Hourly Limit": maxEmails,
          "Current Attempts": currentCount,
          "Rescheduled Delay": `${minutesRemaining} mins`,
          "Target Email ID": email.id,
        }
      );

      // Reschedule job in BullMQ to next hour window preserving order
      await emailQueue.add(
        "send-email",
        { emailId: email.id },
        {
          jobId: `email-${email.id}-rescheduled-${Date.now()}`,
          delay: msToNextHour,
        }
      );

      return;
    }

    console.log(`Sending email from ${email.senderEmail} to ${email.recipient}...`);
    const result = await sendEmail(email.recipient, email.subject, email.body, email.senderEmail);

    if (result.success) {
      const updatedEmail = await prisma.email.update({
        where: { id: email.id },
        data: {
          status: "Sent",
          sentAt: new Date(),
        },
      });

      // Index in Elasticsearch
      await indexEmail(updatedEmail);

      console.log(`✅ Email ID ${email.id} sent successfully! (${currentCount}/${maxEmails} sent this hour)`);
    } else {
      const updatedEmail = await prisma.email.update({
        where: { id: email.id },
        data: { status: "Failed" },
      });

      await indexEmail(updatedEmail);
      console.error(`❌ Email ID ${email.id} failed to send.`);
    }
  },
  {
    connection: redis,
    concurrency: Number(process.env.WORKER_CONCURRENCY) || 5,
  }
);

emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed.`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

export default emailWorker;