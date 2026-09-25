import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

function Login() {
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    const googleUser = {
      name: "Mastermind User",
      email: "mastermind57369@gmail.com",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=mastermind57369",
    };
    localStorage.setItem("reachinbox_user", JSON.stringify(googleUser));
    toast.success("Signed in as mastermind57369@gmail.com via Google");
    navigate("/dashboard");
  };

  const handleGuestLogin = () => {
    const guestUser = {
      name: "Guest User",
      email: "guest@reachinbox-scheduler.ai",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=GuestUser",
    };
    localStorage.setItem("reachinbox_user", JSON.stringify(guestUser));
    toast.success("Signed in as Guest");
    navigate("/dashboard");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#090D16] p-4 text-slate-100">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/90 p-8 sm:p-10 shadow-2xl backdrop-blur-2xl">
        {/* Subtle background glow */}
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-blue-600/20 blur-3xl" />
        <div className="absolute -bottom-20 -right-20 h-40 w-40 rounded-full bg-indigo-600/20 blur-3xl" />

        {/* Brand Header */}
        <div className="relative mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 font-black text-white shadow-xl shadow-blue-500/25">
            <span className="text-2xl">R</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-white">ReachInbox</h1>
          <p className="mt-1.5 text-xs text-slate-400">Production Email Job Scheduler</p>
        </div>

        {/* Buttons */}
        <div className="relative space-y-3.5">
          <button
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-800 bg-slate-950/80 py-3.5 px-4 text-xs font-semibold text-slate-200 shadow-lg transition-all duration-200 hover:border-slate-700 hover:bg-slate-950"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>

          <button
            onClick={handleGuestLogin}
            className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3.5 text-xs font-semibold text-white shadow-xl shadow-blue-500/20 transition-all duration-200 hover:from-blue-500 hover:to-indigo-500"
          >
            Continue as Guest
          </button>
        </div>

        <p className="mt-8 text-center text-[11px] text-slate-500">
          BullMQ + Redis + PostgreSQL Persistence
        </p>
      </div>
    </div>
  );
}

export default Login;