import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchStudents, fetchAttendanceReport } from "../api";

export default function MonthlyReport() {
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);

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
          return {
            ...student,
            totalPresent: studentRecords.length,
          };
        });

        setReportData(aggregatedData);
      })
      .catch((err) => console.error("Error loading monthly report:", err))
      .finally(() => setLoading(false));
  }, []);

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-semibold text-white tracking-tight">Monthly Attendance Report</h2>
          <p className="text-sm text-zinc-400 mt-1">Overview for {currentMonth}</p>
        </div>
        <button className="px-4 py-2 bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 text-xs font-semibold rounded-xl hover:bg-indigo-600/40 transition-colors shadow-lg flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export PDF
        </button>
      </motion.div>

      {/* Data Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8 bg-white/[0.02]">
                {["Roll Number", "Student Name", "Total Days Present", "Status"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-zinc-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500">Generating report...</td></tr>
              ) : reportData.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-12 text-center text-zinc-500">No students found.</td></tr>
              ) : (
                reportData.map((student, idx) => (
                  <tr key={student.id} className="border-b border-white/5 hover:bg-white/3 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-zinc-400">{student.roll_number}</td>
                    <td className="px-6 py-4 text-white font-medium">{student.name}</td>
                    <td className="px-6 py-4">
                      <span className="text-emerald-400 font-bold text-lg">{student.totalPresent}</span>
                      <span className="text-zinc-500 text-xs ml-1">days</span>
                    </td>
                    <td className="px-6 py-4">
                      {student.totalPresent > 0 ? (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE</span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md text-[11px] font-bold bg-red-500/10 text-red-400 border border-red-500/20">NO DATA</span>
                      )}
                    </td>
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