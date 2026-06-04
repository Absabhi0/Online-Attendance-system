import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchStudents, fetchAttendanceReport } from "../api";

const TOTAL_WORKING_DAYS = 20;

// ── Minimal bar chart (no external lib needed) ──────────────────────────────
function AttendanceBarChart({ data }) {
  const max = TOTAL_WORKING_DAYS;
  const barW = Math.max(24, Math.min(48, Math.floor(480 / (data.length || 1)) - 16));

  return (
    <div className="overflow-x-auto">
      <div style={{ minWidth: data.length * (barW * 2 + 20) + 60 }} className="relative">
        {/* Y-axis grid lines */}
        <div className="relative h-48 ml-10 mr-4">
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const val = Math.round(frac * max);
            return (
              <div
                key={frac}
                className="absolute w-full flex items-center"
                style={{ bottom: `${frac * 100}%` }}
              >
                <span className="text-[10px] text-zinc-600 w-8 text-right pr-2 -translate-y-1/2 absolute -left-10">{val}</span>
                <div className="w-full border-t border-dashed border-white/[0.06]" />
              </div>
            );
          })}

          {/* Bars */}
          <div className="absolute inset-0 flex items-end gap-1 px-2">
            {data.map((s) => {
              const presentH = (s.totalPresent / max) * 100;
              const absentH = (s.totalAbsent / max) * 100;
              const shortId = s.roll_number?.slice(-3) || String(s.id).padStart(3, "0");
              return (
                <div key={s.id} className="flex flex-col items-center" style={{ width: barW * 2 + 8, flexShrink: 0 }}>
                  <div className="flex items-end gap-1 w-full justify-center">
                    {/* Present bar */}
                    <div
                      className="rounded-t-sm transition-all duration-700"
                      style={{
                        width: barW,
                        height: `${presentH * 1.68}px`,
                        minHeight: s.totalPresent > 0 ? 4 : 0,
                        background: "linear-gradient(to top, #10b981, #34d399)",
                      }}
                      title={`Present: ${s.totalPresent}`}
                    />
                    {/* Absent bar */}
                    <div
                      className="rounded-t-sm transition-all duration-700"
                      style={{
                        width: barW,
                        height: `${absentH * 1.68}px`,
                        minHeight: s.totalAbsent > 0 ? 4 : 0,
                        background: "linear-gradient(to top, #f43f5e, #fb7185)",
                      }}
                      title={`Absent: ${s.totalAbsent}`}
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 mt-1.5">#{shortId}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-5 mt-3 ml-10">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-emerald-400" />
            <span className="text-xs text-zinc-400">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-rose-400" />
            <span className="text-xs text-zinc-400">Absent</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function MonthlyReport() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("monthly"); // "daily" | "monthly"

  // ── All original API logic — untouched ──────────────────────────────────
  useEffect(() => {
    Promise.all([fetchStudents(), fetchAttendanceReport()])
      .then(([studentsRes, attendanceRes]) => {
        const students = studentsRes.data.students || [];
        const records = attendanceRes.data.records || [];

        // Calculate total present days per student
        const aggregatedData = students.map((student) => {
          const studentRecords = records.filter(
            (r) => r.students?.roll_number === student.roll_number
          );
          const totalPresent = studentRecords.length;
          return {
            ...student,
            totalPresent,
            totalAbsent: Math.max(0, TOTAL_WORKING_DAYS - totalPresent),
            percentage: Math.round((totalPresent / TOTAL_WORKING_DAYS) * 100),
          };
        });

        setReportData(aggregatedData);
      })
      .catch((err) => console.error("Error loading monthly report:", err))
      .finally(() => setLoading(false));
  }, []);

  const currentMonth = new Date().toLocaleString("default", { month: "long", year: "numeric" });
  const currentMonthCode = new Date().toISOString().slice(0, 7); // e.g. "2026-06"

  return (
    <div className="max-w-5xl mx-auto">

      {/* ── Page Header ── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Attendance Analytics</h2>
          <p className="text-sm text-zinc-400 mt-1">Daily reports and monthly compilation sheets.</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold rounded-xl hover:bg-indigo-600/40 transition-colors shadow-lg flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PDF
        </button>
      </motion.div>

      {/* ── Tab Toggle ── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="flex gap-2 mb-6">
        {[
          { id: "daily", icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z", label: "Daily Report" },
          { id: "monthly", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", label: "Monthly Sheet" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-900/40"
                : "bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
            </svg>
            {tab.label}
          </button>
        ))}
      </motion.div>

      {/* ── DAILY TAB — placeholder ── */}
      {activeTab === "daily" && (
        <motion.div
          key="daily"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-12 flex flex-col items-center justify-center text-center gap-3"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-2">
            <svg className="w-6 h-6 text-indigo-400" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-white font-medium">Daily Report</p>
          <p className="text-zinc-500 text-sm max-w-xs">Day-by-day attendance breakdown will appear here once daily data is available.</p>
        </motion.div>
      )}

      {/* ── MONTHLY TAB ── */}
      {activeTab === "monthly" && (
        <motion.div key="monthly" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

          {/* Bar Chart Card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-semibold text-white">
                Present vs Absent — <span className="text-zinc-400">{currentMonthCode}</span>
              </h3>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-zinc-300">
                <svg className="w-3.5 h-3.5 text-zinc-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {currentMonth}
              </div>
            </div>
            {loading ? (
              <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">Loading chart...</div>
            ) : reportData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-zinc-500 text-sm">No data available.</div>
            ) : (
              <AttendanceBarChart data={reportData} />
            )}
          </div>

          {/* Compilation Sheet Table */}
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-white/8">
              <h3 className="text-sm font-semibold text-white">Compilation Sheet</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/8 bg-white/[0.02]">
                    {["Student", "Roll", "Present", "Absent", "%"].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-widest">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">Generating report...</td></tr>
                  ) : reportData.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-zinc-500">No students found.</td></tr>
                  ) : (
                    reportData.map((student) => (
                      <tr key={student.id} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="px-6 py-3.5 text-white font-medium">{student.name}</td>
                        <td className="px-6 py-3.5 font-mono text-xs text-zinc-400">{student.roll_number}</td>
                        <td className="px-6 py-3.5 text-emerald-400 font-semibold">{student.totalPresent}</td>
                        <td className="px-6 py-3.5 text-rose-400 font-semibold">{student.totalAbsent}</td>
                        <td className="px-6 py-3.5">
                          <span className={`font-bold text-sm ${student.percentage >= 75 ? "text-emerald-400" : "text-rose-400"}`}>
                            {student.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {!loading && reportData.length > 0 && (
              <div className="px-6 py-3 border-t border-white/5 flex items-center gap-2">
                <span className="text-xs text-zinc-600">Based on {TOTAL_WORKING_DAYS} working days · </span>
                <span className="text-xs text-zinc-600">75% attendance required</span>
              </div>
            )}
          </div>

        </motion.div>
      )}

    </div>
  );
}