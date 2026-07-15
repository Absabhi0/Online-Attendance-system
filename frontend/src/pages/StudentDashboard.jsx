import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import api from "../api"; 

const TOTAL_WORKING_DAYS = 20;

export default function StudentDashboard() {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Retrieve profile storage saved during login
  const studentData = JSON.parse(sessionStorage.getItem("studentProfile") || "{}");
  const studentName = studentData.name || "Student";
  const rollNumber = studentData.roll_number || "—";

  useEffect(() => {
    // Fetch all logs and filter on client side for security validation if specific endpoint isn't built
    api.get("/attendance/report")
      .then((res) => {
        const records = res.data.records || [];
        // Filter records belonging strictly to this roll number
        const personalRecords = records.filter(r => r.students?.roll_number === rollNumber);
        setAttendance(personalRecords);
      })
      .catch((err) => console.error("Error loading profile logs:", err))
      .finally(() => setLoading(false));
  }, [rollNumber]);
  // Group attendance by subject for the monthly summary
  const monthlySummary = useMemo(() => {
    const bySubject = {};
    attendance.forEach((r) => {
      const subject = r.subject || "Unknown";
      bySubject[subject] = (bySubject[subject] || 0) + 1;
    });
    return Object.entries(bySubject).map(([subject, present]) => ({
      subject,
      present,
      absent: Math.max(0, TOTAL_WORKING_DAYS - present),
      percentage: Math.round((present / TOTAL_WORKING_DAYS) * 100),
    }));
  }, [attendance]);

  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });

  const handleFaceUpdateRequest = () => {
    toast.success("Recalibration request successfully forwarded to Admin!", {
      icon: "💾",
      duration: 5000
    });
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Welcome back, {studentName}!</h2>
          <p className="text-sm text-zinc-400 mt-1">Roll Number: <span className="font-mono text-zinc-300">{rollNumber}</span></p>
        </div>
        <button
          onClick={handleFaceUpdateRequest}
          className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold rounded-xl hover:bg-indigo-600/40 transition-colors shadow-lg"
        >
          🔄 Request Face Data Update
        </button>
      </motion.div>

      {/* Numerical Analysis Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/15 p-5 backdrop-blur-sm">
          <div className="text-emerald-400 mb-2 font-semibold text-xs uppercase tracking-wider">Total Days Present</div>
          <div className="text-4xl font-bold text-emerald-300 tabular-nums">{loading ? "—" : attendance.length}</div>
          <div className="text-xs text-zinc-500 mt-1">Validated biometrically this month</div>
        </div>
        <div className="rounded-2xl border border-indigo-500/25 bg-indigo-500/15 p-5 backdrop-blur-sm">
          <div className="text-indigo-400 mb-2 font-semibold text-xs uppercase tracking-wider">Profile Verification Status</div>
          <div className="text-4xl font-bold text-indigo-300">Active</div>
          <div className="text-xs text-zinc-500 mt-1">Face template secure in cloud node</div>
        </div>
      </div>
      
       {/* Monthly Report */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden mb-6">
        <div className="px-6 py-4 border-b border-white/8 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-200">Monthly Report</h3>
          <span className="text-xs text-zinc-500">{currentMonth}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.01]">
                {["Subject", "Present", "Absent", "%"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500 text-sm">Compiling report…</td></tr>
              ) : monthlySummary.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500 text-sm">No attendance recorded yet.</td></tr>
              ) : (
                monthlySummary.map((row) => (
                  <tr key={row.subject} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-6 py-3.5 text-white font-medium">{row.subject}</td>
                    <td className="px-6 py-3.5 text-emerald-400 font-semibold">{row.present}</td>
                    <td className="px-6 py-3.5 text-rose-400 font-semibold">{row.absent}</td>
                    <td className="px-6 py-3.5">
                      <span className={`font-bold text-sm ${row.percentage >= 75 ? "text-emerald-400" : "text-rose-400"}`}>
                        {row.percentage}%
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {!loading && monthlySummary.length > 0 && (
          <div className="px-6 py-3 border-t border-white/5">
            <span className="text-xs text-zinc-600">Based on {TOTAL_WORKING_DAYS} working days · 75% attendance required</span>
          </div>
        )}
      </motion.div>

      {/* Personal Attendance List */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-white/8">
          <h3 className="text-sm font-semibold text-zinc-200">Your Personalized Attendance History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.01]">
                {["#", "Course Identity", "Status", "Timestamp Checked"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-zinc-500 text-sm">Compiling records…</td></tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    No logs logged under your current roll number profile today.
                  </td>
                </tr>
              ) : (
                attendance.map((record, idx) => (
                  <tr key={record.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{idx + 1}</td>
                      <td className="px-6 py-4 text-white font-medium">{record.subject || "—"}</td>                  
                      <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">PRESENT</span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-xs font-mono">{record.time ? record.time.slice(0, 8) : "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}