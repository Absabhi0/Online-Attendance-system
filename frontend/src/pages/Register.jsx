import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { registerStudent } from "../api";

const MAX_PHOTOS = 5;
const MIN_PHOTOS = 3;

export default function Register() {
  const [name, setName] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [email, setEmail] = useState("");
  const [photos, setPhotos] = useState([]); // Array of File objects
  const [previews, setPreviews] = useState([]); // Array of object URLs
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files);
    const combined = [...photos, ...selected].slice(0, MAX_PHOTOS);
    const newPreviews = combined.map((f) => URL.createObjectURL(f));

    // Revoke old object URLs to prevent memory leaks
    previews.forEach((url) => URL.revokeObjectURL(url));

    setPhotos(combined);
    setPreviews(newPreviews);
    // Reset input so same file can be re-selected if removed
    e.target.value = "";
  };

  const removePhoto = (idx) => {
    URL.revokeObjectURL(previews[idx]);
    setPhotos((p) => p.filter((_, i) => i !== idx));
    setPreviews((p) => p.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setName("");
    setRollNumber("");
    setEmail("");
    previews.forEach((url) => URL.revokeObjectURL(url));
    setPhotos([]);
    setPreviews([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (photos.length < MIN_PHOTOS) {
      toast.error(`Please upload at least ${MIN_PHOTOS} photos.`);
      return;
    }

    setLoading(true);
    try {
      const res = await registerStudent(name, rollNumber, photos);
      const data = res.data;

      toast.success(`${data.encodings_saved} face encodings saved for ${name}!`, {
        duration: 5000,
        icon: "🎓",
      });

      if (data.warnings) {
        setTimeout(() => toast(data.warnings, { icon: "⚠️", duration: 6000 }), 800);
      }

      resetForm();
    } catch (err) {
      const detail = err.response?.data?.detail;
      const msg =
        typeof detail === "string"
          ? detail
          : "Registration failed. Please check the backend.";
      toast.error(msg, { duration: 6000 });
    } finally {
      setLoading(false);
    }
  };

  const photoCount = photos.length;
  const progressPct = (photoCount / MAX_PHOTOS) * 100;
  const isReady = photoCount >= MIN_PHOTOS;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-semibold text-white tracking-tight">Register Student</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Upload 3–5 clear, well-lit frontal photos for best recognition accuracy.
        </p>
      </motion.div>

      <motion.form
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.05 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Student details */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest mb-4">
            Student Details
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Full Name *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arjun Sharma"
                required
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500/70 focus:bg-black/40 transition-all [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Roll Number *</label>
              <input
                type="text"
                value={rollNumber}
                onChange={(e) => setRollNumber(e.target.value)}
                placeholder="e.g. CS2024001"
                required
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500/60 focus:bg-black/40 transition-all [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">Email (optional)</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="student@college.edu"
              autoComplete="off"
              className="w-full px-4 py-2.5 rounded-xl bg-black/20 border border-white/10 text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-indigo-500/60 focus:bg-black/40 transition-all [&:-webkit-autofill]:[-webkit-text-fill-color:white] [&:-webkit-autofill]:[transition:background-color_9999s_ease-in-out_0s]"
            />
          </div>
        </div>

        {/* Photo upload */}
        <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-widest">
              Reference Photos
            </h3>
            <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full border ${
              isReady
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-zinc-500/15 border-zinc-500/30 text-zinc-400"
            }`}>
              {photoCount} / {MAX_PHOTOS}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-white/10 rounded-full mb-5 overflow-hidden">
            <motion.div
              className={`h-full rounded-full transition-colors ${isReady ? "bg-emerald-500" : "bg-indigo-500"}`}
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
            />
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-5 gap-2 mb-4">
            <AnimatePresence>
              {previews.map((src, idx) => (
                <motion.div
                  key={src}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.7 }}
                  transition={{ duration: 0.2 }}
                  className="relative group aspect-square"
                >
                  <img
                    src={src}
                    alt={`Photo ${idx + 1}`}
                    className="w-full h-full object-cover rounded-xl border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                  >
                    ×
                  </button>
                  <div className="absolute bottom-1 left-1 text-[9px] font-bold text-white/60 bg-black/40 rounded px-1">
                    {idx + 1}
                  </div>
                </motion.div>
              ))}

              {/* Empty slots */}
              {Array.from({ length: MAX_PHOTOS - photoCount }).map((_, i) => (
                <div
                  key={`empty-${i}`}
                  className="aspect-square rounded-xl border border-dashed border-white/15 bg-white/3 flex items-center justify-center"
                >
                  <span className="text-zinc-600 text-lg">+</span>
                </div>
              ))}
            </AnimatePresence>
          </div>

          {/* Drop zone / upload button */}
          {photoCount < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-3 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/60 text-indigo-300 text-sm transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Upload Photos ({MAX_PHOTOS - photoCount} remaining)
            </button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

          <p className="text-xs text-zinc-500 mt-3">
            Tips: Face the camera directly · Good lighting · No glasses or hat · Neutral expression
          </p>
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
          type="submit"
          disabled={loading || !name || !rollNumber || !isReady}
          className={`w-full py-3 rounded-xl font-semibold text-sm transition-all shadow-lg ${
            loading || !name || !rollNumber || !isReady
              ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40"
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Extracting Face Encodings…
            </span>
          ) : (
            "Register Student"
          )}
        </motion.button>
      </motion.form>
    </div>
  );
}