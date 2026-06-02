import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { fetchStudents } from "../api";

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudents()
      .then((res) => {
        setStudents(res.data.students || []);
      })
      .catch((err) => {
        console.error("Failed to fetch students:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-semibold text-white tracking-tight">Registered Students</h2>
        <p className="text-sm text-zinc-400 mt-1">
          View and manage all students enrolled in the facial recognition system.
        </p>
      </motion.div>

      {/* Data Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.45 }}
        className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="text-sm font-semibold text-zinc-200">Student Database</h3>
          <span className="text-xs text-zinc-500 font-mono bg-white/5 px-2.5 py-1 rounded-lg border border-white/8">
            {loading ? "…" : students.length} Total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/8">
                {["#", "Full Name", "Roll Number", "Registration Date"].map((h) => (
                  <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-zinc-500 text-sm">
                    Loading database…
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-zinc-500">
                    No students registered yet.
                  </td>
                </tr>
              ) : (
                students.map((student, idx) => (
                  <motion.tr
                    key={student.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-6 py-4 text-zinc-500 font-mono text-xs">{idx + 1}</td>
                    <td className="px-6 py-4 text-white font-medium">{student.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-zinc-300">{student.roll_number}</td>
                    <td className="px-6 py-4 text-zinc-400 text-xs">
                      {new Date(student.created_at).toLocaleDateString()}
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