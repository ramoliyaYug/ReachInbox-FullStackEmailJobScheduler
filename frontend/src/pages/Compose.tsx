import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import toast from "react-hot-toast";
import Papa from "papaparse";
import { 
  Upload, 
  Users, 
  Send, 
  Clock, 
  Mail, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Calendar,
  X
} from "lucide-react";

function Compose() {
  const [recipientInput, setRecipientInput] = useState("");
  const [recipientsList, setRecipientsList] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [senderEmail, setSenderEmail] = useState("mastermind57369@gmail.com");
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(2);
  const [loading, setLoading] = useState(false);
  const [fileDetails, setFileDetails] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileDetails(file.name);

    if (file.name.endsWith(".csv")) {
      Papa.parse(file, {
        complete: (results) => {
          const extractedEmails = new Set<string>();
          results.data.forEach((row: any) => {
            if (Array.isArray(row)) {
              row.forEach((cell) => {
                if (typeof cell === "string" && cell.includes("@")) {
                  const match = cell.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
                  if (match) match.forEach((em) => extractedEmails.add(em));
                }
              });
            } else if (typeof row === "object" && row !== null) {
              Object.values(row).forEach((val) => {
                if (typeof val === "string" && val.includes("@")) {
                  const match = val.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g);
                  if (match) match.forEach((em) => extractedEmails.add(em));
                }
              });
            }
          });

          const list = Array.from(extractedEmails);
          setRecipientsList(list);
          if (list.length > 0) {
            toast.success(`Extracted ${list.length} email leads from CSV!`);
          } else {
            toast.error("No valid email addresses found in CSV.");
          }
        },
        error: () => toast.error("Error parsing CSV file."),
      });
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
        const unique = Array.from(new Set(matches));
        setRecipientsList(unique);
        if (unique.length > 0) {
          toast.success(`Extracted ${unique.length} email leads from file!`);
        } else {
          toast.error("No valid email addresses found.");
        }
      };
      reader.readAsText(file);
    }
  };

  const handleManualRecipientChange = (val: string) => {
    setRecipientInput(val);
    if (!fileDetails) {
      const split = val
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.includes("@"));
      setRecipientsList(split);
    }
  };

  const removeRecipientTag = (emailToRemove: string) => {
    setRecipientsList(recipientsList.filter((e) => e !== emailToRemove));
  };

  const setQuickSchedule = (minutesOffset: number) => {
    const target = new Date(Date.now() + minutesOffset * 60 * 1000);
    // Format to datetime-local format: YYYY-MM-DDTHH:mm
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    const hours = String(target.getHours()).padStart(2, "0");
    const mins = String(target.getMinutes()).padStart(2, "0");
    setScheduledTime(`${year}-${month}-${day}T${hours}:${mins}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (recipientsList.length === 0 && recipientInput.trim()) {
      recipientsList.push(recipientInput.trim());
    }

    if (recipientsList.length === 0) {
      toast.error("Please provide recipient emails or upload CSV file.");
      return;
    }

    if (!subject || !body || !scheduledTime || !senderEmail) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      if (recipientsList.length === 1) {
        await api.post("/emails/schedule", {
          recipient: recipientsList[0],
          subject,
          body,
          scheduledTime,
          senderEmail,
        });
        toast.success("1 Email Scheduled Successfully!");
      } else {
        await api.post("/emails/schedule-batch", {
          recipients: recipientsList,
          subject,
          body,
          scheduledTime,
          senderEmail,
          delayBetweenEmails,
        });
        toast.success(`Batch of ${recipientsList.length} Emails Scheduled Successfully!`);
      }

      setRecipientInput("");
      setRecipientsList([]);
      setSubject("");
      setBody("");
      setScheduledTime("");
      setFileDetails(null);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to schedule email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="w-full text-slate-100 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Create Email Campaign
            <Sparkles className="h-5 w-5 text-cyan-400" />
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Schedule single or multi-lead email dispatches with rate-limited BullMQ worker execution.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Main 2-Column Wide Grid */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Left Column: Lead Management & Controls */}
            <div className="space-y-6">
              {/* CSV Upload Area */}
              <div className="glass-panel rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2">
                  <Upload className="h-5 w-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Import Lead List (CSV / TXT)
                  </h3>
                </div>

                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-950/60 p-6 text-center hover:border-cyan-500/50 transition">
                  <Upload className="h-8 w-8 text-cyan-400 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-white mb-1">
                    Drop CSV file or click to browse
                  </p>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Automatically extracts all valid email lead addresses.
                  </p>
                  <input
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="block w-full text-xs text-slate-400 file:mr-4 file:rounded-xl file:border file:border-white/10 file:bg-slate-900 file:px-4 file:py-2.5 file:text-xs file:font-bold file:text-cyan-400 hover:file:bg-slate-800 cursor-pointer"
                  />
                  {fileDetails && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" />
                      <span>Loaded: {fileDetails}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Recipients Input & Detected Chips */}
              <div className="glass-panel rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-400" />
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Recipients ({recipientsList.length})
                    </h3>
                  </div>
                  {recipientsList.length > 0 && (
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-extrabold text-cyan-400">
                      {recipientsList.length} Leads Active
                    </span>
                  )}
                </div>

                {/* Email Tag Pills */}
                {recipientsList.length > 0 && (
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-white/5">
                    {recipientsList.map((em) => (
                      <span
                        key={em}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-300"
                      >
                        {em}
                        <button
                          type="button"
                          onClick={() => removeRecipientTag(em)}
                          className="text-cyan-400 hover:text-white"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">
                    Enter Recipients Manually (Comma Separated)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="e.g. alex@acme.com, sarah@tech.co"
                    value={recipientInput}
                    onChange={(e) => handleManualRecipientChange(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                  />
                </div>
              </div>

              {/* Throttling & Provider Limits */}
              <div className="glass-panel rounded-3xl p-6 shadow-2xl space-y-4">
                <div className="flex items-center gap-2 text-slate-200">
                  <ShieldAlert className="h-5 w-5 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Throttling & Rate Limits
                  </h3>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 text-xs">
                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Min Delay between sends (sec)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={delayBetweenEmails}
                      onChange={(e) => setDelayBetweenEmails(Number(e.target.value))}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 p-3 text-xs text-white font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 font-semibold mb-1">
                      Hourly Rate Limit per Sender
                    </label>
                    <input
                      type="text"
                      disabled
                      value="10 / hour (Configured in .env)"
                      className="w-full rounded-xl border border-white/5 bg-slate-900/60 p-3 text-xs text-slate-500 font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Email Content & Schedule Options */}
            <div className="space-y-6">
              {/* Campaign Content */}
              <div className="glass-panel rounded-3xl p-6 shadow-2xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                  Email Message Content
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Subject Line
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Supercharge outreach with ReachInbox Email Scheduler"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
                    required
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Message Body
                    </label>
                    <span className="text-[11px] text-slate-500">
                      {body.length} characters
                    </span>
                  </div>
                  <textarea
                    rows={8}
                    placeholder="Write your email body message here..."
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 p-3.5 text-xs text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Sender & Scheduling Presets */}
              <div className="glass-panel rounded-3xl p-6 shadow-2xl space-y-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">
                  Dispatch Details
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Sender Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="email"
                      value={senderEmail}
                      onChange={(e) => setSenderEmail(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">
                    Start Schedule Date & Time
                  </label>
                  <div className="relative mb-3">
                    <Clock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full rounded-xl border border-white/10 bg-slate-950 py-3 pl-10 pr-3 text-xs text-slate-100 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 font-medium"
                      required
                    />
                  </div>

                  {/* Quick Presets */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> Presets:
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(2)}
                      className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-cyan-400 hover:bg-slate-800 transition"
                    >
                      +2 Mins
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(15)}
                      className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-cyan-400 hover:bg-slate-800 transition"
                    >
                      +15 Mins
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickSchedule(60)}
                      className="rounded-lg border border-white/10 bg-slate-900 px-2.5 py-1 text-[11px] font-semibold text-cyan-400 hover:bg-slate-800 transition"
                    >
                      +1 Hour
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Full-Width Action Banner */}
          <div className="glass-panel rounded-3xl p-6 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-white">Ready to Dispatch Campaign?</p>
              <p className="text-xs text-slate-400">
                Will register {recipientsList.length || 1} email job(s) into BullMQ queue.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 px-8 py-4 font-black text-sm text-white shadow-xl shadow-cyan-500/25 hover:brightness-125 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? (
                <span>Queueing Jobs...</span>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  <span>
                    Schedule {recipientsList.length > 1 ? `${recipientsList.length} Emails` : "Campaign"} Now
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </MainLayout>
  );
}

export default Compose;