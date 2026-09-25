import type { ReactNode } from "react";
import { TrendingUp, ArrowUpRight } from "lucide-react";

interface Props {
  title: string;
  value: number;
  color: "cyan" | "emerald" | "amber" | "rose" | string;
  icon: ReactNode;
  subtitle?: string;
}

function StatCard({ title, value, color, icon, subtitle }: Props) {
  const themes: Record<string, { accent: string; badge: string; text: string; glow: string }> = {
    cyan: {
      accent: "from-cyan-500 to-blue-500",
      badge: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      text: "text-cyan-400",
      glow: "shadow-cyan-500/10",
    },
    emerald: {
      accent: "from-emerald-500 to-teal-500",
      badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      text: "text-emerald-400",
      glow: "shadow-emerald-500/10",
    },
    amber: {
      accent: "from-amber-500 to-orange-500",
      badge: "bg-amber-500/10 text-amber-400 border-amber-500/20",
      text: "text-amber-400",
      glow: "shadow-amber-500/10",
    },
    rose: {
      accent: "from-rose-500 to-red-500",
      badge: "bg-rose-500/10 text-rose-400 border-rose-500/20",
      text: "text-rose-400",
      glow: "shadow-rose-500/10",
    },
  };

  const active = themes[color] || themes.cyan;

  return (
    <div className={`glass-panel glass-panel-hover relative overflow-hidden rounded-2xl p-6 shadow-2xl ${active.glow}`}>
      {/* Top Accent Gradient Bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${active.accent}`} />

      <div className="flex items-start justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
            {title}
          </span>
          <div className="mt-3 flex items-baseline gap-2.5">
            <span className="text-4xl font-black tracking-tight text-white">{value}</span>
            <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>Live</span>
            </div>
          </div>
          {subtitle && <p className="mt-1 text-xs text-slate-400 font-medium">{subtitle}</p>}
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${active.badge} shadow-inner`}>
          {icon}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3 text-[11px] text-slate-400">
        <span>BullMQ Realtime Queue</span>
        <ArrowUpRight className="h-3.5 w-3.5 text-slate-500 group-hover:text-white transition" />
      </div>
    </div>
  );
}

export default StatCard;