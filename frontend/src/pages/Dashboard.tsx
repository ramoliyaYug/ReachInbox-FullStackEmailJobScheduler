import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import { Search, Filter, RotateCw, Star, ArrowLeft, Trash2, Archive } from "lucide-react";

function Dashboard() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  const fetchAllEmails = async () => {
    setLoading(true);
    try {
      const [scheduledRes, sentRes] = await Promise.all([
        api.get("/emails/scheduled"),
        api.get("/emails/sent"),
      ]);

      const scheduled = scheduledRes.data || [];
      const sentAll = sentRes.data || [];

      const combined = [...scheduled, ...sentAll].sort(
        (a, b) => new Date(b.createdAt || b.scheduledTime).getTime() - new Date(a.createdAt || a.scheduledTime).getTime()
      );
      setEmails(combined);
    } catch (err) {
      console.error("Error fetching emails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllEmails();
  }, []);

  const filteredEmails = searchQuery
    ? emails.filter(
        (e) =>
          e.recipient?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          e.body?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : emails;

  return (
    <MainLayout>
      {selectedEmail ? (
        /* Email Detail View - Matching Figma Image 4 */
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header Action Bar */}
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedEmail(null)}
                className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-base font-bold text-gray-900 truncate">
                {selectedEmail.subject || "No Subject"}
              </h2>
            </div>

            <div className="flex items-center gap-3 text-gray-400">
              <Star className="h-4 w-4 hover:text-amber-400 cursor-pointer" />
              <Archive className="h-4 w-4 hover:text-gray-700 cursor-pointer" />
              <Trash2 className="h-4 w-4 hover:text-red-500 cursor-pointer" />
            </div>
          </div>

          {/* Sender Card */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00C853] font-bold text-white text-sm">
                {selectedEmail.recipient ? selectedEmail.recipient[0].toUpperCase() : "A"}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">
                  {selectedEmail.recipient || "Recipient"}
                </p>
                <p className="text-[11px] text-gray-400">
                  to {selectedEmail.senderEmail || "me"}
                </p>
              </div>
            </div>

            <span className="text-[11px] text-gray-400">
              {new Date(selectedEmail.scheduledTime || selectedEmail.sentAt || Date.now()).toLocaleString()}
            </span>
          </div>

          {/* Email Body Content */}
          <div className="space-y-4 pt-2 text-xs text-gray-700 leading-relaxed">
            <p className="whitespace-pre-wrap">{selectedEmail.body}</p>

            {/* Figma Special Callout Notice */}
            <div className="rounded-xl bg-[#FFFDE7] border-l-4 border-amber-400 p-4 text-xs font-medium text-gray-800 space-y-1">
              <p className="font-bold">⚡ Scheduled via ReachInbox BullMQ Queue Service ⚡</p>
              <p className="text-gray-600">
                Email job status: <span className="font-bold text-green-600">{selectedEmail.status}</span>
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Email List View - Matching Figma Image 2 & 3 */
        <div className="space-y-4">
          {/* Search Header Bar */}
          <div className="flex items-center gap-3 pb-2">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full bg-[#F4F6F4] py-2 pl-10 pr-4 text-xs text-gray-800 placeholder-gray-400 outline-none focus:ring-1 focus:ring-green-500"
              />
            </div>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Filter className="h-4 w-4" />
            </button>
            <button onClick={fetchAllEmails} className="p-2 text-gray-400 hover:text-gray-600">
              <RotateCw className="h-4 w-4" />
            </button>
          </div>

          {/* List Rows */}
          {loading ? (
            <div className="py-12 text-center text-xs text-gray-400">Loading inbox...</div>
          ) : filteredEmails.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400">
              No emails found. Schedule a campaign!
            </div>
          ) : (
            <div className="space-y-1">
              {filteredEmails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className="flex items-center justify-between rounded-xl px-4 py-3 text-xs transition hover:bg-[#F9FAFB] cursor-pointer"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className="w-32 font-bold text-gray-900 truncate">
                      To: {email.recipient}
                    </span>
                    <span className="rounded-md bg-[#F4F6F4] px-2 py-0.5 text-[11px] font-medium text-gray-500">
                      {email.status}
                    </span>
                    <span className="truncate text-gray-700 flex-1">
                      <strong className="font-semibold text-gray-900">{email.subject}</strong> -{" "}
                      <span className="text-gray-400">{email.body}</span>
                    </span>
                  </div>
                  <Star className="h-4 w-4 text-gray-300 hover:text-amber-400 ml-4 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </MainLayout>
  );
}

export default Dashboard;