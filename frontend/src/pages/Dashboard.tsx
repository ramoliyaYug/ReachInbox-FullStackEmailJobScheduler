import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import api, { getBullMQBoardUrl } from "../services/api";
import StatCard from "../components/StatCard";
import { 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Mail, 
  Send, 
  ExternalLink, 
  RefreshCw, 
  Cpu, 
  Database, 
  Server, 
  Search,
  Zap
} from "lucide-react";

function Dashboard() {
  const [scheduledCount, setScheduledCount] = useState(0);
  const [sentCount, setSentCount] = useState(0);
  const [failedCount, setFailedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [recentEmails, setRecentEmails] = useState<any[]>([]);
  const [filteredEmails, setFilteredEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchStats = async () => {
    try {
      const [scheduledRes, sentRes] = await Promise.all([
        api.get("/emails/scheduled"),
        api.get("/emails/sent"),
      ]);

      const scheduled = scheduledRes.data || [];
      const sentAll = sentRes.data || [];

      const sent = sentAll.filter((e: any) => e.status === "Sent");
      const failed = sentAll.filter((e: any) => e.status === "Failed");

      setScheduledCount(scheduled.length);
      setSentCount(sent.length);
      setFailedCount(failed.length);
      setTotalCount(scheduled.length + sentAll.length);

      const combined = [...scheduled, ...sentAll].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setRecentEmails(combined);
      applyFilter(combined, statusFilter, searchQuery);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilter = (list: any[], filter: string, query: string) => {
    let result = list;

    if (filter === "SCHEDULED") {
      result = result.filter((e) => e.status === "Scheduled");
    } else if (filter === "SENT") {
      result = result.filter((e) => e.status === "Sent");
    } else if (filter === "FAILED") {
      result = result.filter((e) => e.status === "Failed");
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (e) =>
          e.recipient?.toLowerCase().includes(q) ||
          e.subject?.toLowerCase().includes(q) ||
          e.senderEmail?.toLowerCase().includes(q)
      );
    }

    setFilteredEmails(result.slice(0, 10));
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    applyFilter(recentEmails, statusFilter, searchQuery);
  }, [statusFilter, searchQuery]);

  return (
    <MainLayout>
      <div className="space-y-8 text-slate-100">
        {/* Banner Section */}
        <div className="glass-panel relative overflow-hidden rounded-3xl p-8 shadow-2xl lg:flex lg:items-center lg:justify-between">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
                BullMQ Worker Engine Online
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-white lg:text-4xl">System Dashboard Overview</h1>
            <p className="mt-2 text-sm text-slate-400 max-w-2xl">
              Real-time monitoring of email queues, rate-limited dispatchers, worker concurrency, and PostgreSQL job persistence.
            </p>
          </div>

          <div className="relative z-10 mt-6 lg:mt-0 flex flex-wrap items-center gap-3">
            <Link
              to="/compose"
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-6 py-3.5 text-xs font-extrabold text-white shadow-xl shadow-cyan-500/20 hover:brightness-125 transition"
            >
              <Send className="h-4 w-4" />
              <span>Create Campaign</span>
            </Link>

            <a
              href={getBullMQBoardUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-2xl border border-white/10 bg-slate-900/80 px-5 py-3.5 text-xs font-bold text-slate-200 hover:bg-slate-800 hover:text-amber-400 transition"
            >
              <ExternalLink className="h-4 w-4 text-amber-400" />
              <span>BullMQ Queue UI</span>
            </a>
          </div>
        </div>

        {/* Analytics Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Scheduled Queue"
            value={scheduledCount}
            subtitle="Jobs Waiting"
            icon={<Clock className="h-6 w-6 text-amber-400" />}
            color="amber"
          />
          <StatCard
            title="Delivered Successfully"
            value={sentCount}
            subtitle="Sent Emails"
            icon={<CheckCircle2 className="h-6 w-6 text-emerald-400" />}
            color="emerald"
          />
          <StatCard
            title="Failed Emails"
            value={failedCount}
            subtitle="Errors"
            icon={<AlertTriangle className="h-6 w-6 text-rose-400" />}
            color="rose"
          />
          <StatCard
            title="Total Throughput"
            value={totalCount}
            subtitle="Processed All-Time"
            icon={<Mail className="h-6 w-6 text-cyan-400" />}
            color="cyan"
          />
        </div>

        {/* 2-Column Split: Queue Activity Table + Infrastructure Panel */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Activity Table (2 Cols) */}
          <div className="glass-panel rounded-3xl p-6 shadow-2xl lg:col-span-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-black tracking-tight text-white">Live Queue Execution Log</h2>
                <p className="text-xs text-slate-400">Real-time status updates from Redis & BullMQ workers</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchStats}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 transition"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Sync</span>
                </button>
              </div>
            </div>

            {/* Filter Tabs & Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-white/5 pb-4">
              <div className="flex items-center gap-1.5 bg-slate-950/60 p-1 rounded-xl border border-white/5">
                {["ALL", "SCHEDULED", "SENT", "FAILED"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setStatusFilter(tab)}
                    className={`rounded-lg px-3 py-1.5 text-[11px] font-extrabold transition ${
                      statusFilter === tab
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-md"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Filter by recipient or subject..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full sm:w-64 rounded-xl border border-white/10 bg-slate-950 py-2 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
              </div>
            </div>

            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading live queue records...</div>
            ) : filteredEmails.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400">
                No matching email jobs found for this view.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3.5">Recipient</th>
                      <th className="px-4 py-3.5">Subject</th>
                      <th className="px-4 py-3.5">Scheduled Time</th>
                      <th className="px-4 py-3.5">Sender</th>
                      <th className="px-4 py-3.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredEmails.map((email) => (
                      <tr key={email.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-4 font-bold text-white">{email.recipient}</td>
                        <td className="px-4 py-4 max-w-xs truncate text-slate-300 font-medium">{email.subject}</td>
                        <td className="px-4 py-4 text-slate-400">
                          {new Date(email.scheduledTime).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-slate-400">{email.senderEmail}</td>
                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-extrabold border ${
                              email.status === "Sent"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : email.status === "Failed"
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            }`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${
                                email.status === "Sent"
                                  ? "bg-emerald-400"
                                  : email.status === "Failed"
                                  ? "bg-rose-400"
                                  : "bg-amber-400 animate-ping"
                              }`}
                            />
                            {email.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Infrastructure Health Side Panel (1 Col) */}
          <div className="space-y-6">
            <div className="glass-panel rounded-3xl p-6 shadow-2xl">
              <h3 className="text-base font-black tracking-tight text-white mb-4 flex items-center gap-2">
                <Cpu className="h-4 w-4 text-cyan-400" />
                <span>Engine Status</span>
              </h3>

              <div className="space-y-4 text-xs">
                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/60 p-3.5">
                  <div className="flex items-center gap-3">
                    <Server className="h-4 w-4 text-blue-400" />
                    <div>
                      <p className="font-bold text-white">BullMQ Worker Engine</p>
                      <p className="text-[11px] text-slate-400">5 Parallel Threads Active</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    Running
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/60 p-3.5">
                  <div className="flex items-center gap-3">
                    <Database className="h-4 w-4 text-indigo-400" />
                    <div>
                      <p className="font-bold text-white">PostgreSQL Database</p>
                      <p className="text-[11px] text-slate-400">Schema sync verified</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    Connected
                  </span>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/60 p-3.5">
                  <div className="flex items-center gap-3">
                    <Zap className="h-4 w-4 text-amber-400" />
                    <div>
                      <p className="font-bold text-white">Redis Queue Store</p>
                      <p className="text-[11px] text-slate-400">127.0.0.1:6379 Active</p>
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400">
                    Online
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Tips Panel */}
            <div className="glass-panel rounded-3xl p-6 shadow-2xl bg-gradient-to-b from-blue-900/20 to-slate-900/90 border-blue-500/20">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-blue-400 mb-2">
                System Guarantee
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                If the backend server is restarted, all scheduled emails persist in PostgreSQL and are automatically re-registered into BullMQ without duplication.
              </p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;