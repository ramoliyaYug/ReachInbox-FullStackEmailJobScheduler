import React, { useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import toast from "react-hot-toast";
import Papa from "papaparse";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Paperclip, 
  Clock, 
  Calendar,
  Undo, 
  Redo, 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  List, 
  ListOrdered, 
  Quote, 
  Image as ImageIcon,
  ChevronDown,
  X
} from "lucide-react";

function Compose() {
  const navigate = useNavigate();

  const [senderEmail, setSenderEmail] = useState("mastermind57369@gmail.com");
  const [recipientInput, setRecipientInput] = useState("");
  const [recipientsList, setRecipientsList] = useState<string[]>([]);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [scheduledTime, setScheduledTime] = useState("");
  const [delayBetweenEmails, setDelayBetweenEmails] = useState(2);
  const [hourlyLimit, setHourlyLimit] = useState(10);
  const [loading, setLoading] = useState(false);
  const [showSendLaterModal, setShowSendLaterModal] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  // File Upload Handler (CSV / TXT)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);

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

  const setPresetTime = (offsetHours: number) => {
    const target = new Date(Date.now() + offsetHours * 60 * 60 * 1000);
    const year = target.getFullYear();
    const month = String(target.getMonth() + 1).padStart(2, "0");
    const day = String(target.getDate()).padStart(2, "0");
    const hours = String(target.getHours()).padStart(2, "0");
    const mins = String(target.getMinutes()).padStart(2, "0");
    setScheduledTime(`${year}-${month}-${day}T${hours}:${mins}`);
    toast.success("Schedule time updated");
  };

  const handleManualRecipientChange = (val: string) => {
    setRecipientInput(val);
    if (!uploadedFileName) {
      const split = val
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.includes("@"));
      setRecipientsList(split);
    }
  };

  const handleSendOrSchedule = async () => {
    let finalRecipients = recipientsList;
    if (finalRecipients.length === 0 && recipientInput.trim()) {
      finalRecipients = [recipientInput.trim()];
    }

    if (finalRecipients.length === 0) {
      toast.error("Please enter a recipient email or upload CSV leads.");
      return;
    }

    if (!subject || !body) {
      toast.error("Subject and Email Content are required.");
      return;
    }

    // Default to immediate send if no time picked
    const finalScheduleTime = scheduledTime || new Date().toISOString();

    setLoading(true);

    try {
      if (finalRecipients.length === 1) {
        await api.post("/emails/schedule", {
          recipient: finalRecipients[0],
          subject,
          body,
          scheduledTime: finalScheduleTime,
          senderEmail,
        });
        toast.success("Email Scheduled Successfully!");
      } else {
        await api.post("/emails/schedule-batch", {
          recipients: finalRecipients,
          subject,
          body,
          scheduledTime: finalScheduleTime,
          senderEmail,
          delayBetweenEmails,
        });
        toast.success(`Batch of ${finalRecipients.length} Emails Scheduled!`);
      }

      navigate("/dashboard");
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to schedule email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto space-y-6 bg-white font-sans text-gray-900">
        {/* Top Action Header - Matching Figma Image 5 */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-1 text-gray-500 hover:text-gray-900 cursor-pointer"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-base font-bold text-gray-900">Compose New Email</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Attachment icon */}
            <label className="cursor-pointer text-gray-400 hover:text-gray-600" title="Attach CSV leads file">
              <Paperclip className="h-5 w-5" />
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            {/* Clock/Schedule Icon */}
            <button
              onClick={() => setShowSendLaterModal(true)}
              className="text-gray-400 hover:text-[#00C853] transition cursor-pointer"
              title="Send Later Options"
            >
              <Clock className="h-5 w-5" />
            </button>

            {/* Send Pill Button */}
            <button
              onClick={handleSendOrSchedule}
              disabled={loading}
              className="rounded-full border border-[#00C853] px-6 py-1.5 text-xs font-semibold text-[#00C853] transition hover:bg-[#E6F4EA] disabled:opacity-50 cursor-pointer"
            >
              {loading ? "Sending..." : "Send"}
            </button>
          </div>
        </div>

        {/* Form Fields Section */}
        <div className="space-y-4 text-xs">
          {/* From */}
          <div className="flex items-center gap-4">
            <span className="w-12 text-gray-400 font-medium">From</span>
            <div className="flex items-center gap-2 rounded-lg bg-[#F4F6F4] px-3 py-1.5 text-xs text-gray-700 font-medium">
              <input
                type="email"
                value={senderEmail}
                onChange={(e) => setSenderEmail(e.target.value)}
                className="bg-transparent outline-none text-xs text-gray-800 font-medium"
              />
              <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </div>
          </div>

          {/* To */}
          <div className="flex items-center gap-4 border-b border-gray-100 pb-2">
            <span className="w-12 text-gray-400 font-medium">To</span>
            <input
              type="text"
              placeholder="recipient@example.com"
              value={recipientInput}
              onChange={(e) => handleManualRecipientChange(e.target.value)}
              className="flex-1 bg-transparent text-xs text-gray-900 placeholder-gray-300 outline-none"
            />
            {uploadedFileName && (
              <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-medium text-green-700">
                {uploadedFileName} ({recipientsList.length} leads)
              </span>
            )}
          </div>

          {/* Subject */}
          <div className="flex items-center gap-4 border-b border-gray-100 pb-2">
            <span className="w-12 text-gray-400 font-medium">Subject</span>
            <input
              type="text"
              placeholder="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="flex-1 bg-transparent text-xs text-gray-900 placeholder-gray-300 outline-none"
            />
          </div>

          {/* Delay & Hourly Limit Inputs */}
          <div className="flex items-center gap-8 py-2">
            <div className="flex items-center gap-3">
              <span className="text-gray-400 font-medium">Delay between 2 emails</span>
              <input
                type="number"
                min={1}
                max={60}
                value={delayBetweenEmails}
                onChange={(e) => setDelayBetweenEmails(Number(e.target.value))}
                className="w-16 rounded-lg bg-[#F4F6F4] p-2 text-center text-xs font-semibold text-gray-800 outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <span className="text-gray-400 font-medium">Hourly Limit</span>
              <input
                type="number"
                min={1}
                value={hourlyLimit}
                onChange={(e) => setHourlyLimit(Number(e.target.value))}
                className="w-16 rounded-lg bg-[#F4F6F4] p-2 text-center text-xs font-semibold text-gray-800 outline-none"
              />
            </div>
          </div>

          {/* Reply / Text Editor Area */}
          <div className="rounded-2xl bg-[#F8FAFC] p-4 min-h-[320px] flex flex-col justify-between border border-gray-100">
            <textarea
              rows={10}
              placeholder="Type Your Reply..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="w-full bg-transparent text-xs text-gray-800 placeholder-gray-400 outline-none resize-none"
            />

            {/* Formatting Toolbar - Matching Figma Image 5 */}
            <div className="flex flex-wrap items-center gap-3 border-t border-gray-200/60 pt-3 text-gray-400 text-xs">
              <button type="button" className="hover:text-gray-700"><Undo className="h-4 w-4" /></button>
              <button type="button" className="hover:text-gray-700"><Redo className="h-4 w-4" /></button>
              <span className="h-4 w-px bg-gray-200" />
              <button type="button" className="hover:text-gray-700 font-bold">TT</button>
              <button type="button" className="hover:text-gray-700"><Bold className="h-4 w-4" /></button>
              <button type="button" className="hover:text-gray-700"><Italic className="h-4 w-4" /></button>
              <button type="button" className="hover:text-gray-700"><Underline className="h-4 w-4" /></button>
              <span className="h-4 w-px bg-gray-200" />
              <button type="button" className="hover:text-gray-700"><AlignLeft className="h-4 w-4" /></button>
              <button type="button" className="hover:text-gray-700"><ListOrdered className="h-4 w-4" /></button>
              <button type="button" className="hover:text-gray-700"><List className="h-4 w-4" /></button>
              <button type="button" className="hover:text-gray-700"><Quote className="h-4 w-4" /></button>
              <button type="button" className="hover:text-gray-700"><ImageIcon className="h-4 w-4" /></button>
            </div>
          </div>
        </div>

        {/* Send Later Popover / Modal - Matching Figma Image 5 */}
        {showSendLaterModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl border border-gray-100 text-xs text-gray-800 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="font-bold text-sm text-gray-900">Send Later</h3>
                <button onClick={() => setShowSendLaterModal(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div>
                <label className="block text-gray-400 mb-1">Pick date & time</label>
                <div className="relative">
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    className="w-full rounded-xl bg-[#F4F6F4] p-3 text-xs text-gray-800 outline-none"
                  />
                  <Calendar className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Presets List */}
              <div className="space-y-2 pt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setPresetTime(24)}
                  className="w-full text-left py-1.5 px-2 hover:bg-[#F4F6F4] rounded-lg text-gray-600 font-medium"
                >
                  Tomorrow
                </button>
                <button
                  type="button"
                  onClick={() => setPresetTime(20)}
                  className="w-full text-left py-1.5 px-2 hover:bg-[#F4F6F4] rounded-lg text-gray-600 font-medium"
                >
                  Tomorrow, 10:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => setPresetTime(21)}
                  className="w-full text-left py-1.5 px-2 hover:bg-[#F4F6F4] rounded-lg text-gray-600 font-medium"
                >
                  Tomorrow, 11:00 AM
                </button>
                <button
                  type="button"
                  onClick={() => setPresetTime(25)}
                  className="w-full text-left py-1.5 px-2 hover:bg-[#F4F6F4] rounded-lg text-gray-600 font-medium"
                >
                  Tomorrow, 3:00 PM
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowSendLaterModal(false)}
                  className="px-4 py-1.5 font-semibold text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setShowSendLaterModal(false)}
                  className="rounded-full border border-[#00C853] px-5 py-1.5 font-semibold text-[#00C853] hover:bg-[#E6F4EA]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Compose;