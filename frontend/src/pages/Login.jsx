import { loginStudentProfile, loginProfessor, registerProfessor } from "../api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
// Notice we deleted the fake STUDENT_ID and STUDENT_PASSWORD constants
// because we are using the real database for students now!

const COURSES = [
  { id: "1", label: "CS201 — Data Structures" },
  { id: "2", label: "CS301 — Operating Systems" },
  { id: "3", label: "CS401 — Machine Learning" },
];

export default function Login({ onSuccess }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("student"); // "student" | "admin"


// Professor form state
  const [profEmail, setProfEmail] = useState("");
  const [profPass, setProfPass] = useState("");

  // Create account form state
  const [newName, setNewName] = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);

  // Student form state
  const [studentId, setStudentId] = useState("");
  const [studentPass, setStudentPass] = useState("");

  // 2. UPDATED ADMIN LOGIN (Adds the Admin Role)
  const handleProfessorLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await loginProfessor(profEmail, profPass);
      const data = res.data;
      if (data.status === "success") {
        sessionStorage.setItem("authed", "true");
        sessionStorage.setItem("role", "admin"); // keeps existing route-guard logic working
        sessionStorage.setItem("professorProfile", JSON.stringify(data.professor));
        onSuccess?.();
        toast.success(`Welcome, ${data.professor.name}!`, { icon: "🔐" });
        window.location.href = "/dashboard";
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid email or password.");
    }
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const res = await registerProfessor(newName, newSubject, newPassword);
      const email = res.data.professor.email;
      toast.success(
        `Account created! Login email: ${email} — save this, it won't be shown again.`,
        { duration: 10000 }
      );
      setNewName("");
      setNewSubject("");
      setNewPassword("");
      setProfEmail(email); // pre-fill professor login tab
      setMode("professor"); // jump straight to login tab
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create account.");
    } finally {
      setCreating(false);
    }
  };

  // 3. UPDATED STUDENT LOGIN (Connects to Database)
  const handleStudentLogin = async (e) => {
    e.preventDefault();
    
    try {
      // Send the entered Roll Number (studentId) and Passcode to the Python backend
      const res = await loginStudentProfile(studentId, studentPass);
      const data = res.data;
      
      if (data.status === "success") {
        // Save metadata to global memory session space
        sessionStorage.setItem("authed", "true");
        sessionStorage.setItem("role", "student"); // <-- Tells the app you are a Student
        sessionStorage.setItem("studentProfile", JSON.stringify(data.student));
        
        onSuccess?.();
        toast.success(`Welcome back, ${data.student.name}!`, { icon: "👋" });
        window.location.href = "/student-dashboard"; // Redirects to their new private dashboard
      }
    } catch (err) {
      // If Python rejects the login, show the error
      const errorMsg = err.response?.data?.detail || "Invalid roll number or password credentials.";
      toast.error(errorMsg);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0d1117]">

      {/* ── Ambient background blobs ── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-indigo-600/20 blur-[120px]" />
        <div className="absolute -bottom-40 -right-20 w-[500px] h-[500px] rounded-full bg-violet-700/20 blur-[100px]" />
        <div className="absolute top-1/3 left-1/2 w-[300px] h-[300px] rounded-full bg-cyan-500/10 blur-[80px]" />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Two-column wrapper ── */}
      <div className="relative z-10 w-full max-w-5xl mx-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-16 py-12">

        {/* ── LEFT: Hero panel ── */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex-1 text-left hidden lg:block"
        >
          {/* Brand */}
          <div className="flex items-center gap-3 mb-10">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30">
              <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-9 8l4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
            </div>
            <span className="text-white font-semibold text-lg tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>AttendAI</span>
          </div>

          {/* Hero headline */}
          <h2 className="text-5xl font-bold text-white leading-tight mb-4" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            Attendance,{" "}
            <span className="text-indigo-400">recognised</span>{" "}
            in a glance.
          </h2>
          <p className="text-zinc-400 text-base leading-relaxed mb-10 max-w-sm">
            Replace manual roll calls with biometric facial recognition. Register students once, then mark a whole class present in seconds.
          </p>

          {/* Stats row */}
          <div className="flex gap-4">
            {[
              { value: "<2s", label: "per mark" },
              { value: "5", label: "photos / student" },
              { value: "99%", label: "less paperwork" },
            ].map(({ value, label }) => (
              <div
                key={label}
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm px-4 py-4 text-center"
              >
                <p className="text-white text-2xl font-bold" style={{ fontFamily: "'DM Sans', sans-serif" }}>{value}</p>
                <p className="text-zinc-500 text-xs mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── RIGHT: Form card ── */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="w-full lg:w-[420px] shrink-0"
        >
        {/* Mobile brand header (hidden on lg) */}
        <div className="mb-8 text-center lg:hidden">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 mb-4">
            <svg className="w-7 h-7 text-indigo-300" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h6m-9 8l4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
            </svg>
          </div>
          <h1 className="text-2xl font-semibold text-white tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>
            AttendAI
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Facial Recognition Attendance System</p>
        </div>

        {/* Glass card body */}
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-2xl shadow-2xl shadow-black/40 overflow-hidden">

          {/* Mode toggle tabs */}
          <div className="flex p-1.5 m-4 rounded-xl bg-white/5 border border-white/10 gap-1">
               {["student", "professor", "create"].map((tab) => (      
                <button
                key={tab}
                onClick={() => setMode(tab)}
                className="relative flex-1 py-2 text-sm font-medium rounded-lg transition-colors duration-200 z-10"
                style={{ color: mode === tab ? "#fff" : "rgba(255,255,255,0.45)" }}
              >
                {mode === tab && (
                  <motion.div
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-lg bg-indigo-600/70 border border-indigo-400/30"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
               <span className="relative z-10 capitalize">
               {tab === "student" ? "Student" : tab === "professor" ? "Professor" : "Create"}
               </span>  
         </button>
            ))}
          </div>

          {/* Sliding form panel */}
          <div className="px-6 pb-7 overflow-hidden">
            <AnimatePresence mode="wait">
              {mode === "student" ? (
                <motion.form
                  key="student"
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 24 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  onSubmit={handleStudentLogin}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 tracking-wide uppercase">
                      Student ID (Roll Number)
                    </label>
                    <input
                      type="text"
                      value={studentId}
                      onChange={(e) => setStudentId(e.target.value)}
                      placeholder="e.g. CS2024001"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500/70 focus:bg-black/40 transition-all [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 tracking-wide uppercase">
                      Password
                    </label>
                    <input
                      type="password"
                      value={studentPass}
                      onChange={(e) => setStudentPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500/70 focus:bg-black/40 transition-all [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
                      required
                    />
                  </div>
                  <p className="text-xs text-zinc-500">Default PW: <span className="text-zinc-300 font-mono">student123</span></p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-indigo-900/40"
                  >
                    Sign in as Student
                  </motion.button>
                </motion.form>
               ) : mode === "professor" ? (                
               <motion.form
                  key="professor"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  onSubmit={handleProfessorLogin}
                  className="space-y-4"
                >
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 tracking-wide uppercase">
                      Email
                    </label>
                    <input
                      type="email"
                      value={profEmail}
                      onChange={(e) => setProfEmail(e.target.value)}
                      placeholder="yourname@college.edu"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500/70 focus:bg-black/40 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 tracking-wide uppercase">
                      Password
                    </label>
                    <input
                      type="password"
                      value={profPass}
                      onChange={(e) => setProfPass(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500/70 focus:bg-black/40 transition-all"
                      required
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-900/40"
                  >
                    Sign in as Professor
                  </motion.button>
                </motion.form>
                ) : (
                <motion.form
                  key="create"
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -24 }}
                  transition={{ duration: 0.28, ease: "easeOut" }}
                  onSubmit={handleCreateAccount}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    <p className="text-xs text-emerald-300">Creates a new professor login. Login email is auto-generated.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 tracking-wide uppercase">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="e.g. Dr. Manish Taram"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500/70 focus:bg-black/40 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 tracking-wide uppercase">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="e.g. Data Structures"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500/70 focus:bg-black/40 transition-all"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5 tracking-wide uppercase">
                      Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-emerald-500/70 focus:bg-black/40 transition-all"
                      required
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: creating ? 1 : 1.02 }}
                    whileTap={{ scale: creating ? 1 : 0.98 }}
                    type="submit"
                    disabled={creating}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors shadow-lg shadow-emerald-900/40 disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Professor Account"}
                  </motion.button>
                </motion.form>
               )}
            </AnimatePresence>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-600 mt-6">
          AttendAI · College Presentation Demo
        </p>
        </motion.div>
      </div>
    </div>
  );
}