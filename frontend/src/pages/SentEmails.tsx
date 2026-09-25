import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import { Search, CheckCircle2, RefreshCw, Mail, AlertTriangle, Eye, X } from "lucide-react";

function SentEmails() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<any | null>(null);

  const fetchSentEmails = async (query = "") => {
    setLoading(true);
    try {
      const url = query ? `/emails/sent?q=${encodeURIComponent(query)}` : "/emails/sent";
      const res = await api.get(url);
      setEmails(res.data || []);
    } catch (err) {
      console.error("Error fetching sent emails:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSentEmails();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSentEmails(searchQuery);
  };

  return (
    <MainLayout>
      <div className="space-y-6 text-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">Sent Emails History</h1>
            <p className="text-xs text-slate-400">Delivered via Ethereal SMTP & indexed in Elasticsearch</p>
          </div>

          <form onSubmit={handleSearch} className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search recipient, subject, body..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-72 rounded-xl border border-white/10 bg-slate-950 py-2 pl-10 pr-4 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            <button
              type="submit"
              className="rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white hover:brightness-110 transition"
            >
              Search
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                fetchSentEmails("");
              }}
              className="rounded-xl border border-white/10 bg-slate-900 p-2 text-slate-400 hover:bg-slate-800 transition"
              title="Reset Search"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </form>
        </div>

        <div className="glass-panel rounded-3xl p-6 shadow-2xl">
          {loading ? (
            <div className="py-20 text-center text-slate-400 text-xs">
              <CheckCircle2 className="mx-auto h-8 w-8 animate-spin text-emerald-400 mb-2" />
              Loading sent email logs...
            </div>
          ) : emails.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Mail className="mx-auto h-12 w-12 text-slate-600 mb-3" />
              <p className="text-base font-bold text-slate-200">No Sent Emails Found</p>
              <p className="mt-1 text-xs text-slate-500">
                {searchQuery ? "No emails matching search query." : "Processed emails will appear here automatically."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-white/10">
                  <tr>
                    <th className="px-4 py-3.5">Recipient</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5">Sent At</th>
                    <th className="px-4 py-3.5">Sender</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {emails.map((email) => (
                    <tr key={email.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-4 font-bold text-white">{email.recipient}</td>
                      <td className="px-4 py-4 font-medium text-slate-300 max-w-xs truncate">{email.subject}</td>
                      <td className="px-4 py-4 text-slate-400 font-mono">
                        {email.sentAt ? new Date(email.sentAt).toLocaleString() : "N/A"}
                      </td>
                      <td className="px-4 py-4 text-slate-400">{email.senderEmail}</td>
                      <td className="px-4 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold border ${
                            email.status === "Sent"
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                              : "bg-rose-500/10 text-rose-400 border-rose-500/20"
                          }`}
                        >
                          {email.status === "Sent" ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                          )}
                          {email.status}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <button
                          onClick={() => setSelectedEmail(email)}
                          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-1.5 text-[11px] font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                        >
                          <Eye className="h-3.5 w-3.5 inline mr-1" /> Inspect
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Inspect Modal */}
      {selectedEmail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-base font-bold text-white">Sent Log Details</h3>
              <button
                onClick={() => setSelectedEmail(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400 uppercase tracking-wider font-bold">Recipient:</span>
                <p className="font-bold text-white text-sm mt-0.5">{selectedEmail.recipient}</p>
              </div>

              <div>
                <span className="text-slate-400 uppercase tracking-wider font-bold">Subject:</span>
                <p className="font-bold text-slate-200 mt-0.5">{selectedEmail.subject}</p>
              </div>

              <div>
                <span className="text-slate-400 uppercase tracking-wider font-bold">Message Content:</span>
                <div className="mt-1 rounded-xl border border-white/5 bg-slate-950 p-3 text-slate-300 whitespace-pre-wrap">
                  {selectedEmail.body}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-bold">Sent Timestamp:</span>
                  <p className="text-slate-300 font-mono mt-0.5">
                    {selectedEmail.sentAt ? new Date(selectedEmail.sentAt).toLocaleString() : "N/A"}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase tracking-wider font-bold">Sender Email:</span>
                  <p className="text-slate-300 mt-0.5">{selectedEmail.senderEmail}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEmail(null)}
                className="rounded-xl border border-white/10 bg-slate-800 px-5 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default SentEmails;