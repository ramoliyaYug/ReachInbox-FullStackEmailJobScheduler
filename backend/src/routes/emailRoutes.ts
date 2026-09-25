import { Router } from "express";
import {
  scheduleEmail,
  scheduleBatch,
  getScheduledEmails,
  getSentEmails,
  searchEmails,
} from "../controllers/emailController";

const router = Router();

router.post("/schedule", scheduleEmail);
router.post("/schedule-batch", scheduleBatch);
router.get("/scheduled", getScheduledEmails);
router.get("/sent", getSentEmails);
router.get("/search", searchEmails);

export default router;