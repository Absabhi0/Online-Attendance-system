import { motion } from "framer-motion";
import { useState, useEffect, useMemo } from "react";
import { fetchStudents, fetchAttendanceReport } from "../api";

const cardVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" },
  }),
};

export default function Dashboard() {
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  useEffect(() => {
    fetchStudents()
      .then((r) => setStudents(r.data.students || []))
      .catch(() => {})
      .finally(() => setLoadingStudents(false));

    fetchAttendanceReport()
      .then((r) => setAttendance(r.data.records || []))
      .catch(() => {})
      .finally(() => setLoadingAttendance(false));
  }, []);

  // Get the logged-in professor's subject (if logged in as professor)
  const professorData = JSON.parse(sessionStorage.getItem("professorProfile") || "null");
  const mySubject = professorData?.subject || null;

  // Split attendance into "my subject" vs "other subjects"
  const { myAttendance, otherAttendance } = useMemo(() => {
    if (!mySubject) return { myAttendance: [], otherAttendance: attendance };
    return {
      myAttendance: attendance.filter((r) => r.subject === mySubject),
      otherAttendance: attendance.filter((r) => r.subject !== mySubject),
    };
  }, [attendance, mySubject]);

  const today = new Date().toLocaleDateString("en-IN", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const summaryCards = [
    {
      label: "Total Students",
      value: loadingStudents ? "—" : students.length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      ),
      color: "indigo",
      sub: "registered in system",
    },
    {
      label: "Attendance Today",
      value: loadingAttendance ? "—" : attendance.length,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      color: "emerald",
      sub: "scans recorded today",
    },
    {
      label: "Absent Today",
      value: loadingStudents || loadingAttendance ? "—" : Math.max(0, students.length - attendance.length),
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
        </svg>
      ),
      color: "red",
      sub: "estimated absent",
    },
    {
      label: "System Status",
      value: "Online",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728M9.172 16.243a4 4 0 010-5.657m5.657 0a4 4 0 010 5.657M13 12a1 1 0 11-2 0 1 1 0 012 0z"/>
        </svg>
      ),
      color: "violet",
      sub: "API connected",
    },
  ];

  const colorMap = {
    indigo: { bg: "bg-indigo-500/15", border: "border-indigo-500/25", icon: "text-indigo-400", value: "text-indigo-300" },
    emerald: { bg: "bg-emerald-500/15", border: "border-emerald-500/25", icon: "text-emerald-400", value: "text-emerald-300" },
    red: { bg: "bg-red-500/15", border: "border-red-500/25", icon: "text-red-400", value: "text-red-300" },
    violet: { bg: "bg-violet-500/15", border: "border-violet-500/25", icon: "text-violet-400", value: "text-violet-300" },
  };

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-semibold text-white tracking-tight">Dashboard</h2>
        <p className="text-sm text-zinc-400 mt-1">{today}</p>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {summaryCards.map((card, i) => {
          const c = colorMap[card.color];
          return (
            <motion.div
              key={card.label}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              animate="visible"
              className={`rounded-2xl border ${c.border} ${c.bg} p-5 backdrop-blur-sm`}
            >
              <div className={`${c.icon} mb-3`}>{card.icon}</div>
              <div className={`text-3xl font-bold ${c.value} tabular-nums`}>{card.value}</div>
              <div className="text-xs font-semibold text-zinc-300 mt-1">{card.label}</div>
              <div className="text-xs text-zinc-500 mt-0.5">{card.sub}</div>
            </motion.div>
          );
        })}
      </div>

      {/* Today's attendance table */}
      {/* Grid 1 — My subject's attendance */}
      {mySubject && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.45 }}
          className="rounded-2xl border border-indigo-500/25 bg-indigo-500/5 backdrop-blur-sm overflow-hidden mb-6"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-indigo-500/15">
            <h3 className="text-sm font-semibold text-indigo-300">My Subject — {mySubject}</h3>
            <span className="text-xs text-zinc-500 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/8">
              {loadingAttendance ? "…" : myAttendance.length} records
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/8">
                  {["#", "Student Name", "Roll Number", "Time"].map((h) => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingAttendance ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-zinc-500 text-sm">Loading…</td></tr>
                ) : myAttendance.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-zinc-500 text-sm">No attendance marked for {mySubject} today.</td></tr>
                ) : (
                  myAttendance.map((record, idx) => (
                    <tr key={record.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                      <td className="px-6 py-3.5 text-zinc-500 font-mono text-xs">{idx + 1}</td>
                      <td className="px-6 py-3.5 text-white font-medium">{record.students?.name ?? "—"}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-zinc-300">{record.students?.roll_number ?? "—"}</td>
                      <td className="px-6 py-3.5 text-zinc-400 text-xs font-mono">{record.time ? record.time.slice(0, 8) : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Grid 2 — All other subjects' attendance */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45 }}
        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="text-sm font-semibold text-zinc-200">{mySubject ? "Other Subjects — Today" : "Today's Attendance Log"}</h3>
          <span className="text-xs text-zinc-500 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/8">
            {loadingAttendance ? "…" : otherAttendance.length} records
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["#", "Student Name", "Roll Number", "Subject", "Time"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingAttendance ? (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">Loading records…</td></tr>
              ) : otherAttendance.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-zinc-500 text-sm">No other attendance records today.</td></tr>
              ) : (
                otherAttendance.map((record, idx) => (
                  <tr key={record.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-6 py-3.5 text-zinc-500 font-mono text-xs">{idx + 1}</td>
                    <td className="px-6 py-3.5 text-white font-medium">{record.students?.name ?? "—"}</td>
                    <td className="px-6 py-3.5 font-mono text-xs text-zinc-300">{record.students?.roll_number ?? "—"}</td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-mono">
                        {record.subject ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-zinc-400 text-xs font-mono">{record.time ? record.time.slice(0, 8) : "—"}</td>
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