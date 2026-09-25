import express from "express";
import cors from "cors";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";

import emailRoutes from "./routes/emailRoutes";
import slackRoutes from "./routes/slackRoutes";
import emailQueue from "./queue/emailQueue";

const app = express();

app.use(cors());
app.use(express.json());

// Set up live BullBoard Queue Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter,
});

app.use("/admin/queues", serverAdapter.getRouter());

app.get("/", (req, res) => {
  res.send("🚀 ReachInbox Email Scheduler API is Running. Live Queue Dashboard at /admin/queues");
});

app.use("/api/emails", emailRoutes);
app.use("/api/slack", slackRoutes);

export default app;