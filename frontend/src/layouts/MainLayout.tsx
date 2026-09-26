import { useState, useEffect, type ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import api, { getBullMQBoardUrl } from "../services/api";
import toast from "react-hot-toast";
import { 
  Clock, 
  Send, 
  ChevronDown, 
  MessageSquare, 
  ExternalLink,
  LogOut,
  X
} from "lucide-react";

interface Props {
  children: ReactNode;
}

function MainLayout({ children }: Props) {
  const navigate = useNavigate();
  const [user, setUser] = useState<{ name: string; email: string; avatar: string } | null>(null);
  const [scheduledCount, setScheduledCount] = useState<number>(0);
  const [sentCount, setSentCount] = useState<number>(0);

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
        name: "Oliver Brown",
        email: "oliver.brown@domain.io",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80",
      };
      setUser(defaultUser);
      localStorage.setItem("reachinbox_user", JSON.stringify(defaultUser));
    }

    fetchCounts();
    fetchSlackStatus();
  }, []);

  const fetchCounts = async () => {
    try {
      const [scheduledRes, sentRes] = await Promise.all([
        api.get("/emails/scheduled"),
        api.get("/emails/sent"),
      ]);
      setScheduledCount(scheduledRes.data?.length || 0);
      setSentCount(sentRes.data?.length || 0);
    } catch {
      // ignore
    }
  };

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
      toast.success("Slack connected successfully!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to connect Slack");
    } finally {
      setSlackLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("reachinbox_user");
    toast.success("Logged out");
    navigate("/");
  };

  const navClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition ${
      isActive
        ? "bg-[#E6F4EA] text-[#00C853]"
        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

  return (
    <div className="flex min-h-screen bg-white font-sans text-gray-900">
      {/* Sidebar */}
      <aside className="w-64 flex-col border-r border-gray-100 bg-white p-5 flex">
        {/* Brand Logo */}
        <div className="mb-6 px-1">
          <span className="text-2xl font-black tracking-widest text-black">ONG</span>
        </div>

        {/* User Card Badge */}
        <div className="mb-4 flex items-center justify-between rounded-xl bg-[#F4F6F4] p-2.5">
          <div className="flex items-center gap-2.5">
            <img
              src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
              alt="Avatar"
              className="h-8 w-8 rounded-full object-cover"
            />
            <div className="leading-tight">
              <p className="text-xs font-bold text-gray-900">{user?.name || "Oliver Brown"}</p>
              <p className="text-[10px] text-gray-500 truncate max-w-[110px]">
                {user?.email || "oliver.brown@domain.io"}
              </p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-400 cursor-pointer" />
        </div>

        {/* Compose Button */}
        <button
          onClick={() => navigate("/compose")}
          className="mb-8 flex w-full items-center justify-center gap-2 rounded-full border border-[#00C853] py-2 text-xs font-semibold text-[#00C853] transition hover:bg-[#E6F4EA] cursor-pointer"
        >
          <span>Compose</span>
        </button>

        {/* Navigation CORE */}
        <div className="flex-1 space-y-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2">
            CORE
          </p>

          <NavLink to="/scheduled" className={navClass}>
            <div className="flex items-center gap-2.5">
              <Clock className="h-4 w-4" />
              <span>Scheduled</span>
            </div>
            <span className="text-[11px] font-medium text-gray-400">{scheduledCount}</span>
          </NavLink>

          <NavLink to="/sent" className={navClass}>
            <div className="flex items-center gap-2.5">
              <Send className="h-4 w-4" />
              <span>Sent</span>
            </div>
            <span className="text-[11px] font-medium text-gray-400">{sentCount}</span>
          </NavLink>

          <div className="pt-4 space-y-1">
            <button
              onClick={() => setShowSlackModal(true)}
              className="flex w-full items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="h-4 w-4 text-[#00C853]" />
                <span>Slack Alerts</span>
              </div>
              <span
                className={`h-2 w-2 rounded-full ${
                  slackConnected ? "bg-[#00C853]" : "bg-gray-300"
                }`}
              />
            </button>

            <a
              href={getBullMQBoardUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 transition"
            >
              <div className="flex items-center gap-2.5">
                <ExternalLink className="h-4 w-4 text-amber-500" />
                <span>BullMQ Queue UI</span>
              </div>
            </a>
          </div>
        </div>

        {/* Logout Footer */}
        <div className="border-t border-gray-100 pt-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold text-gray-500 hover:bg-red-50 hover:text-red-600 transition cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 bg-white p-6 overflow-y-auto">{children}</main>

      {/* Slack Modal */}
      {showSlackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-900">Connect Slack Notifications</h3>
              <button onClick={() => setShowSlackModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleConnectSlack} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 mb-1">Slack Webhook URL</label>
                <input
                  type="url"
                  placeholder="https://hooks.slack.com/services/..."
                  value={slackWebhook}
                  onChange={(e) => setSlackWebhook(e.target.value)}
                  className="w-full rounded-xl bg-[#F4F6F4] p-3 text-xs text-gray-800 outline-none focus:ring-1 focus:ring-green-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSlackModal(false)}
                  className="rounded-xl border border-gray-200 px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={slackLoading}
                  className="rounded-xl bg-[#00C853] px-4 py-2 text-xs font-semibold text-white hover:bg-[#00E676] disabled:opacity-50"
                >
                  {slackLoading ? "Saving..." : "Save Webhook"}
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