import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { registerProfessor } from "../api";

export default function CreateProfessor() {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await registerProfessor(name, subject, password);
      const email = res.data.professor.email;
      toast.success(`Professor created! Login email: ${email}`, { duration: 8000 });
      setName("");
      setSubject("");
      setPassword("");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to create professor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-white tracking-tight mb-6">Create Professor Account</h2>
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/70"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. Data Structures"
            className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/70"
            required
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white text-sm focus:outline-none focus:border-indigo-500/70"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {loading ? "Creating..." : "Create Professor"}
        </button>
      </form>
    </div>
  );
}