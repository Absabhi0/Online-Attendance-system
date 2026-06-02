import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.45 }}
        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="text-sm font-semibold text-zinc-200">Today's Attendance Log</h3>
          <span className="text-xs text-zinc-500 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/8">
            {loadingAttendance ? "…" : attendance.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["#", "Student Name", "Roll Number", "Course", "Time"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingAttendance ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Loading records…
                    </div>
                  </td>
                </tr>
              ) : attendance.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-zinc-700" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                      </svg>
                      <p className="text-zinc-500 text-sm">No attendance records for today.</p>
                      <p className="text-zinc-600 text-xs">Use the Live Scanner to mark attendance.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                attendance.map((record, idx) => (
                  <motion.tr
                    key={record.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + idx * 0.04 }}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-6 py-3.5 text-zinc-500 font-mono text-xs">{idx + 1}</td>
                    <td className="px-6 py-3.5 text-white font-medium">
                      {record.students?.name ?? "—"}
                    </td>
                    <td className="px-6 py-3.5 font-mono text-xs text-zinc-300">
                      {record.students?.roll_number ?? "—"}
                    </td>
                    <td className="px-6 py-3.5">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-xs font-mono">
                        {record.courses?.code ?? "—"}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-zinc-400 text-xs font-mono">
                      {record.time ? record.time.slice(0, 8) : "—"}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}