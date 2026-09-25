import "dotenv/config";
import nodemailer from "nodemailer";

let testAccountCache: nodemailer.TestAccount | null = null;

export const getTransporter = async () => {
  const host = process.env.SMTP_HOST || process.env.ETHEREAL_HOST || "smtp.ethereal.email";
  const port = Number(process.env.SMTP_PORT || process.env.ETHEREAL_PORT || 587);
  let user = process.env.SMTP_USER || process.env.ETHEREAL_USER;
  let pass = process.env.SMTP_PASS || process.env.ETHEREAL_PASS;

  // Auto-generate Ethereal credentials if missing or placeholder
  if (!user || user.includes("ethereal_user") || !pass || pass.includes("ethereal_pass")) {
    if (!testAccountCache) {
      console.log("🔑 Generating new Ethereal Email test account...");
      testAccountCache = await nodemailer.createTestAccount();
      console.log(`✅ Ethereal Test Account Created: User: ${testAccountCache.user}`);
    }
    user = testAccountCache.user;
    pass = testAccountCache.pass;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: false,
    auth: {
      user,
      pass,
    },
  });
};