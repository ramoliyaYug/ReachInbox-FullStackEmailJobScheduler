import "dotenv/config";

import app from "./app";
import "./queue/emailQueue";
import "./workers/emailWorker";
import { initElasticsearch } from "./services/elasticsearchService";
import { recoverScheduledEmails } from "./services/recoveryService";

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Live BullMQ Dashboard available at http://localhost:${PORT}/admin/queues`);

  // Initialize Elasticsearch
  await initElasticsearch();

  // Run Server Restart Persistence Check
  await recoverScheduledEmails();
});