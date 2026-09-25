import { Client } from "@elastic/elasticsearch";

const esNode = process.env.ELASTICSEARCH_NODE || "http://localhost:9200";

let client: Client | null = null;
let isConnected = false;

// In-memory fallback index if Elasticsearch cluster is unavailable
const memoryIndex: Map<number, any> = new Map();

export const initElasticsearch = async () => {
  try {
    client = new Client({ node: esNode, requestTimeout: 3000 });
    const ping = await client.ping();
    if (ping) {
      isConnected = true;
      console.log("⚡ Elasticsearch Connected successfully");
    }
  } catch {
    isConnected = false;
    console.log("⚠️ Elasticsearch connection unavailable. Operating with local memory search index fallback.");
  }
};

export const indexEmail = async (email: {
  id: number;
  recipient: String;
  subject: String;
  body: String;
  scheduledTime: Date;
  status: String;
  senderEmail: String;
  sentAt?: Date | null;
}) => {
  // Always update memory fallback
  memoryIndex.set(email.id, email);

  if (!isConnected || !client) return;

  try {
    await client.index({
      index: "emails",
      id: email.id.toString(),
      document: {
        id: email.id,
        recipient: email.recipient,
        subject: email.subject,
        body: email.body,
        scheduledTime: email.scheduledTime,
        status: email.status,
        senderEmail: email.senderEmail,
        sentAt: email.sentAt,
      },
    });
  } catch (err) {
    console.warn("Elasticsearch indexing warning:", (err as Error).message);
  }
};

export const searchEmailsInES = async (queryStr: string) => {
  if (!queryStr || queryStr.trim() === "") return null;

  if (isConnected && client) {
    try {
      const response = await client.search({
        index: "emails",
        query: {
          multi_match: {
            query: queryStr,
            fields: ["recipient", "subject", "body", "senderEmail", "status"],
            fuzziness: "AUTO",
          },
        },
      });

      return response.hits.hits.map((hit) => hit._source);
    } catch (err) {
      console.warn("Elasticsearch search query failed, using memory fallback:", (err as Error).message);
    }
  }

  // Memory fallback search
  const q = queryStr.toLowerCase();
  return Array.from(memoryIndex.values()).filter((email) => {
    return (
      email.recipient?.toLowerCase().includes(q) ||
      email.subject?.toLowerCase().includes(q) ||
      email.body?.toLowerCase().includes(q) ||
      email.senderEmail?.toLowerCase().includes(q) ||
      email.status?.toLowerCase().includes(q)
    );
  });
};
