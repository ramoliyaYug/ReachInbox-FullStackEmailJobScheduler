import { getTransporter } from "../config/mail";
import nodemailer from "nodemailer";

export const sendEmail = async (
  recipient: string,
  subject: string,
  body: string,
  senderEmail: string
) => {
  try {
    const transporter = await getTransporter();

    const info = await transporter.sendMail({
      from: senderEmail || "scheduler@ethereal.email",
      to: recipient,
      subject,
      text: body,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);

    console.log("✅ Email Sent Successfully");
    if (previewUrl) {
      console.log("🔗 Ethereal Preview URL:", previewUrl);
    }

    return {
      success: true,
      info,
      previewUrl,
    };
  } catch (error) {
    console.error("❌ Failed to Send Email:", error);

    return {
      success: false,
      error,
    };
  }
};