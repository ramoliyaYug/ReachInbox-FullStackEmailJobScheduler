import { Router } from "express";
import { getSlackStatus, connectSlack, disconnectSlack } from "../controllers/slackController";

const router = Router();

router.get("/status", getSlackStatus);
router.post("/connect", connectSlack);
router.post("/disconnect", disconnectSlack);

export default router;
