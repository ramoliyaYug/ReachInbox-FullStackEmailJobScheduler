import { useState, useEffect, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api, { getBullMQBoardUrl } from "../services/api";
import toast from "react-hot-toast";
import { 
  LayoutDashboard, 
  Send, 
  Clock, 
  CheckCircle2, 
  LogOut, 
  ExternalLink,
  MessageSquare,
  Zap,
  X,
  Sparkles,
  ShieldCheck
} from "lucide-react";

interface Props {
  children: ReactNode;
}

function MainLayout({ children }: Props) {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [slackConnected, setSlackConnected] = useState(false);
  const [showSlackModal, setShowSlackModal] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState("");
  const [slackLoading, setSlackLoading] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("reachinbox_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    } else {
      const defaultUser = {
        name: "Mastermind User",
        email: "mastermind57369@gmail.com",
        avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mastermind57369",
      };
      setUser(defaultUser);
      localStorage.setItem("reachinbox_user", JSON.stringify(defaultUser));
    }

    fetchSlackStatus();
  }, []);

  const fetchSlackStatus = async () => {
    try {
      const res = await api.get("/slack/status");
      setSlackConnected(res.data.isConnected);
      if (res.data.webhookUrl) {
        setSlackWebhook(res.data.webhookUrl);
      }
    } catch {
      // ignore
    }
  };

  const handleConnectSlack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slackWebhook || !slackWebhook.startsWith("http")) {
      toast.error("Please enter a valid Slack Webhook URL");
      return;
    }

    setSlackLoading(true);
    try {
      await api.post("/slack/connect", { webhookUrl: slackWebhook });
      setSlackConnected(true);
      setShowSlackModal(false);
      toast.success("Slack connected successfully! Live notification sent.");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to connect Slack");
    } finally {
      setSlackLoading(false);
    }
  };

  const handleDisconnectSlack = async () => {
    try {
      await api.post("/slack/disconnect");
      setSlackConnected(false);
      setSlackWebhook("");
      toast.success("Slack disconnected");
    } catch {
      toast.error("Failed to disconnect Slack");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("reachinbox_user");
    toast.success("Logged out successfully");
    navigate("/");
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-bold transition-all duration-200 ${
      isActive
        ? "bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white shadow-xl shadow-cyan-500/20"
        : "text-slate-400 hover:bg-white/5 hover:text-white"
    }`;

  return (
    <div className="flex min-h-screen bg-[#030712] radial-glow text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="hidden w-72 flex-col border-r border-white/10 bg-[#0B0F19]/90 backdrop-blur-2xl text-slate-200 lg:flex">
        {/* Brand */}
        <div className="border-b border-white/10 px-6 py-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 font-black text-white shadow-lg shadow-cyan-500/25">
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-1.5">
                ReachInbox
                <Sparkles className="h-4 w-4 text-cyan-400" />
              </h1>
              <p className="text-xs font-semibold text-cyan-400">Email Job Scheduler</p>
            </div>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">
            Navigation
          </p>
          <NavLink to="/dashboard" className={navClass}>
            <LayoutDashboard className="h-4 w-4" />
            <span>Dashboard Overview</span>
          </NavLink>
          <NavLink to="/compose" className={navClass}>
            <Send className="h-4 w-4" />
            <span>Compose Campaign</span>
          </NavLink>
          <NavLink to="/scheduled" className={navClass}>
            <Clock className="h-4 w-4" />
            <span>Scheduled Emails</span>
          </NavLink>
          <NavLink to="/sent" className={navClass}>
            <CheckCircle2 className="h-4 w-4" />
            <span>Sent History</span>
          </NavLink>

          <div className="pt-6">
            <p className="px-3 text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-3">
              Infrastructure
            </p>
            <a
              href={getBullMQBoardUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3.5 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3 text-xs font-bold text-slate-300 hover:border-amber-500/40 hover:bg-slate-800 hover:text-amber-400 transition"
            >
              <ExternalLink className="h-4 w-4 text-amber-400" />
              <span>BullMQ Queue UI</span>
            </a>
          </div>
        </nav>

        {/* Slack Card */}
        <div className="mx-4 mb-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">Slack Alerts</span>
            </div>
            <span
              className={`inline-block h-2.5 w-2.5 rounded-full ${
                slackConnected ? "bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400" : "bg-slate-600"
              }`}
            />
          </div>
          <p className="text-xs text-slate-400 mb-3">
            {slackConnected ? "Live alerts connected" : "Connect Slack for alerts"}
          </p>
          <button
            onClick={() => setShowSlackModal(true)}
            className="w-full rounded-xl border border-white/10 bg-slate-800/80 py-2 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
          >
            {slackConnected ? "Manage Slack" : "Connect Slack"}
          </button>
        </div>

        {/* User Footer */}
        <div className="border-t border-white/10 p-4">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-slate-900/40 py-3 text-xs font-bold text-slate-400 hover:border-rose-500/40 hover:bg-rose-500/10 hover:text-rose-400 transition"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Screen Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header Bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-white/10 bg-[#0B0F19]/80 px-8 py-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-3 w-3 items-center justify-center">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                Email Job Scheduler Service
                <span className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-bold text-cyan-400">
                  v2.0 Active
                </span>
              </h2>
              <p className="text-xs text-slate-400">BullMQ Queue • Redis Cache • PostgreSQL Storage</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowSlackModal(true)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-bold transition ${
                slackConnected
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-white/10 bg-slate-900 text-slate-300 hover:bg-slate-800"
              }`}
            >
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              <span>{slackConnected ? "Slack Live" : "Connect Slack"}</span>
            </button>

            {/* Profile */}
            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/90 py-1.5 pl-2 pr-4 shadow-xl">
              <img
                src={user?.avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=mastermind57369"}
                alt="Avatar"
                className="h-9 w-9 rounded-xl bg-slate-800 border border-slate-700 object-cover"
              />
              <div className="leading-tight">
                <p className="text-xs font-black text-white flex items-center gap-1">
                  {user?.name || "Mastermind User"}
                  <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" />
                </p>
                <p className="text-[11px] font-medium text-slate-400">{user?.email || "mastermind57369@gmail.com"}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Viewport Content Area */}
        <main className="flex-1 overflow-y-auto p-8 lg:p-10">{children}</main>
      </div>

      {/* Slack Modal */}
      {showSlackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl text-slate-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Slack Webhook Setup</h3>
              </div>
              <button
                onClick={() => setShowSlackModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Enter your Slack Incoming Webhook URL to receive live notifications when rate limits are reached.
            </p>

            <form onSubmit={handleConnectSlack} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Slack Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                {slackConnected && (
                  <button
                    type="button"
                    onClick={handleDisconnectSlack}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition"
                  >
                    Disconnect
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSlackModal(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-bold text-slate-400 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={slackLoading}
                  className="rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-5 py-2 text-xs font-bold text-white hover:brightness-110 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50"
                >
                  {slackLoading ? "Connecting..." : slackConnected ? "Update Webhook" : "Connect Slack"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainLayout;