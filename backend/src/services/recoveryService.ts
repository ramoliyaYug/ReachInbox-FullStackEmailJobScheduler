import prisma from "../config/prisma";
import emailQueue from "../queue/emailQueue";

export const recoverScheduledEmails = async () => {
  try {
    console.log("🔄 Running Server Restart Recovery Check...");
    const scheduledEmails = await prisma.email.findMany({
      where: { status: "Scheduled" },
    });

    let reQueuedCount = 0;

    for (const email of scheduledEmails) {
      const jobId = `email-${email.id}`;
      const existingJob = await emailQueue.getJob(jobId);

      if (!existingJob) {
        const delay = new Date(email.scheduledTime).getTime() - Date.now();
        await emailQueue.add(
          "send-email",
          { emailId: email.id },
          {
            jobId,
            delay: Math.max(delay, 0),
            removeOnComplete: false,
            removeOnFail: false,
          }
        );
        reQueuedCount++;
      }
    }

    console.log(
      `✅ Recovery check completed. ${scheduledEmails.length} scheduled emails found, ${reQueuedCount} re-queued into BullMQ.`
    );
  } catch (err) {
    console.error("❌ Recovery check failed:", (err as Error).message);
  }
};
