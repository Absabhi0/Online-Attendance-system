import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Register from "./pages/Register";
import Scanner from "./pages/Scanner";
import Students from "./pages/Students";
import StudentDashboard from "./pages/StudentDashboard";
import MonthlyReport from "./pages/MonthlyReport";

// ─── Auth guard ──────────────────────────────────────────────────────────────
// Simple session flag — replace with real auth when ready
const isAuthed = () => sessionStorage.getItem("authed") === "true";

function RequireAuth({ children }) {
  return isAuthed() ? children : <Navigate to="/" replace />;
}

// Get the current logged-in role ("admin" or "student")
const currentRole = sessionStorage.getItem("role") || "student";

// Define the master list of all possible routes
const ALL_NAV_ITEMS = [
  {
    to: "/dashboard",
    label: "Admin Dashboard",
    roles: ["admin"],
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
      </svg>
    ),
  },
  {
    to: "/student-dashboard",
    label: "My Attendance",
    roles: ["student"],
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    ),
  },
  {
    to: "/register",
    label: "Register Student",
    roles: ["admin"],
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
      </svg>
    ),
  },
 
  {
    to: "/scanner",
    label: "Live Scanner",
    roles: ["admin"],
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
      </svg>
    ),
    badge: "Live",
  },
  {
    to: "/monthly-report",
    label: "Monthly Report",
    roles: ["admin"],
    icon: (
      <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
];

//  Filter the list so the sidebar ONLY shows what this specific role is allowed to see
const NAV_ITEMS = ALL_NAV_ITEMS.filter((item) => item.roles.includes(currentRole));

// ─── App shell with sidebar ───────────────────────────────────────────────────
function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const userRole = sessionStorage.getItem("role") || "admin";
  const visibleNavItems = NAV_ITEMS.filter(item => item.roles.includes(userRole));

  const handleLogout = () => {
    sessionStorage.removeItem("authed");
    navigate("/", { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#0f1117]">

      {/* Ambient blobs (same as login) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-60 -left-40 w-[700px] h-[700px] rounded-full bg-indigo-700/10 blur-[140px]" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-violet-700/10 blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Sidebar ── */}
      <motion.aside
        animate={{ width: collapsed ? 64 : 220 }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="relative z-10 flex flex-col shrink-0 border-r border-white/8 bg-white/4 backdrop-blur-xl h-screen sticky top-0"
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 h-16 border-b border-white/8 overflow-hidden">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/80 border border-indigo-400/30 flex items-center justify-center shrink-0">
            <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-white font-semibold text-sm whitespace-nowrap overflow-hidden"
                style={{ fontFamily: "'DM Sans', sans-serif" }}
              >
                AttendAI
              </motion.span>
            )}
          </AnimatePresence>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors group ${isActive
                  ? "text-white bg-indigo-600/25 border border-indigo-500/30"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/6"
                }`
              }
            >
              <span className="shrink-0">{item.icon}</span>
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="whitespace-nowrap overflow-hidden flex items-center gap-2"
                  >
                    {item.label}
                    {item.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        {item.badge}
                      </span>
                    )}
                  </motion.span>
                )}
              </AnimatePresence>
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle + logout */}
        <div className="px-2 py-4 border-t border-white/8 space-y-1">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-zinc-500 hover:text-zinc-300 hover:bg-white/6 text-sm transition-colors"
          >
            <svg className={`w-4 h-4 shrink-0 transition-transform ${collapsed ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap text-xs">
                  Collapse
                </motion.span>
              )}
            </AnimatePresence>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/8 text-sm transition-colors"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap text-xs">
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* ── Main content ── */}
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22 }}
            >
              <Routes>
                {/* Admin Routes */}
                <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="/students" element={<RequireAuth><Students /></RequireAuth>} />
                <Route path="/register" element={<RequireAuth><Register /></RequireAuth>} />
                <Route path="/scanner" element={<RequireAuth><Scanner /></RequireAuth>} />
                <Route path="/monthly-report" element={<RequireAuth><MonthlyReport /></RequireAuth>} />
                <Route path="/student-dashboard" element={<RequireAuth><StudentDashboard /></RequireAuth>} />
                {/* Catch-all Fallback (Must always be at the bottom) */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

// ─── Login page wrapper (sets session flag on success) ────────────────────────
function LoginWrapper() {
  // Patch navigate so Login can set the flag before redirecting
  return <Login onSuccess={() => sessionStorage.setItem("authed", "true")} />;
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#1a1d27",
            color: "#e4e4e7",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "12px",
            fontSize: "13px",
            fontFamily: "'DM Sans', sans-serif",
          },
          success: { iconTheme: { primary: "#34d399", secondary: "#0f1117" } },
          error: { iconTheme: { primary: "#f87171", secondary: "#0f1117" } },
        }}
      />
      <Routes>
        <Route path="/" element={<LoginWrapper />} />
        <Route path="/*" element={<AppShell />} />
      </Routes>
    </BrowserRouter>
  );
}