import { useState, useRef, useCallback } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";
import { scanFace } from "../api";



const professor = JSON.parse(sessionStorage.getItem("professorProfile") || "null");
const currentSubject = professor?.subject || "Unknown Subject";

const WEBCAM_CONSTRAINTS = {
  width: { ideal: 1280 },
  height: { ideal: 720 },
  facingMode: "user",
};

export default function Scanner() {
  const [scanning, setScanning] = useState(false);
  const [lastResult, setLastResult] = useState(null); // { type: "success"|"error", data }
  const [camReady, setCamReady] = useState(false);
  const [camError, setCamError] = useState(false);
  const webcamRef = useRef(null);

  const canScan = camReady && !scanning;

  const handleScan = useCallback(async () => {
    if (!canScan) return;

    const screenshot = webcamRef.current?.getScreenshot();
    if (!screenshot) {
      toast.error("Could not capture frame. Is the camera active?");
      return;
    }

    setScanning(true);
    setLastResult(null);

    try {
      const res = await scanFace(currentSubject, screenshot);
      const data = res.data;

      setLastResult({ type: "success", data });

      toast.success(
        `✓ ${data.student.name} (${data.student.roll_number}) — Present`,
        { duration: 6000, style: { fontWeight: "600" } }
      );
    } catch (err) {
      const detail = err.response?.data?.detail;
      const errorCode =
        typeof detail === "object" ? detail?.error : null;
      const errorMsg =
        typeof detail === "object"
          ? detail?.message
          : typeof detail === "string"
          ? detail
          : "An unexpected error occurred.";

      setLastResult({ type: "error", code: errorCode, message: errorMsg });

      if (errorCode === "UNREGISTERED_FACE") {
        toast.error("Unregistered face — please register this student first.", {
          duration: 7000,
          icon: "🚫",
        });
      } else if (errorCode === "ALREADY_MARKED") {
        toast("Already marked present today.", {
          icon: "ℹ️",
          duration: 5000,
          style: { color: "#92400e", background: "#fffbeb" },
        });
      } else {
        toast.error(errorMsg, { duration: 6000 });
      }
    } finally {
      setScanning(false);
    }
  }, [canScan]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h2 className="text-2xl font-semibold text-white tracking-tight">Live Face Scanner</h2>
        <p className="text-sm text-zinc-400 mt-1">
          Select a course, then hold a face up to the camera and press Scan.
        </p>
      </motion.div>

      <div className="space-y-5">
        {/* Subject context (from logged-in professor) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5"
        >
          <p className="text-xs text-zinc-400 uppercase tracking-wide mb-1">Subject</p>
          <p className="text-white text-sm font-semibold">{currentSubject}</p>
        </motion.div>

        {/* Step 2 — Webcam */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
            <span className="text-sm font-semibold text-zinc-200">Camera Feed</span>
            {camReady && (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            )}
          </div>

          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black/40 border border-white/5">
            {camError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 gap-3">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 16.318A4.486 4.486 0 0012.016 15a4.486 4.486 0 00-3.198 1.318M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75zm-.375 0h.008v.015h-.008V9.75zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75zm-.375 0h.008v.015h-.008V9.75z" />
                </svg>
                <p className="text-sm">Camera access denied or unavailable.</p>
                <p className="text-xs">Check browser permissions and refresh.</p>
              </div>
            ) : (
              <>
                <Webcam
                  ref={webcamRef}
                  audio={false}
                  screenshotFormat="image/jpeg"
                  videoConstraints={WEBCAM_CONSTRAINTS}
                  onUserMedia={() => setCamReady(true)}
                  onUserMediaError={() => setCamError(true)}
                  className="w-full h-full object-cover"
                />
                {/* Scan overlay animation */}
                <AnimatePresence>
                  {scanning && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
                    >
                      {/* Scanning reticle */}
                      <div className="relative w-40 h-40">
                        <motion.div
                          className="absolute inset-0 rounded-xl border-2 border-indigo-400"
                          animate={{ scale: [1, 1.05, 1], opacity: [1, 0.5, 1] }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                        />
                        {/* Corner markers */}
                        {[
                          "top-0 left-0 border-l-2 border-t-2",
                          "top-0 right-0 border-r-2 border-t-2",
                          "bottom-0 left-0 border-l-2 border-b-2",
                          "bottom-0 right-0 border-r-2 border-b-2",
                        ].map((cls, i) => (
                          <div key={i} className={`absolute w-5 h-5 border-indigo-300 ${cls}`} />
                        ))}
                        {/* Scan line */}
                        <motion.div
                          className="absolute left-0 right-0 h-0.5 bg-indigo-400/70"
                          animate={{ top: ["10%", "90%", "10%"] }}
                          transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                        />
                      </div>
                      <p className="text-indigo-200 text-sm font-medium mt-4 tracking-wide">
                        Scanning…
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Not-ready state */}
                {!camReady && !camError && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-zinc-500 text-sm flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Initialising camera…
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>

        {/* Step 3 — Scan button */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <motion.button
            whileHover={{ scale: canScan ? 1.02 : 1 }}
            whileTap={{ scale: canScan ? 0.97 : 1 }}
            onClick={handleScan}
            disabled={!canScan}
            className={`w-full py-4 rounded-2xl font-bold text-base tracking-wide transition-all flex items-center justify-center gap-3 ${
              canScan
                ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-900/40"
                : "bg-zinc-800 text-zinc-600 cursor-not-allowed"
            }`}
          >
            {scanning ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Scanning Face…
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                </svg>
                Scan Face
              </>
            )}
          </motion.button>
        </motion.div>

        {/* Result card */}
        <AnimatePresence>
          {lastResult && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-2xl border p-5 ${
                lastResult.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10"
                  : lastResult.code === "ALREADY_MARKED"
                  ? "border-amber-500/30 bg-amber-500/10"
                  : "border-red-500/30 bg-red-500/10"
              }`}
            >
              {lastResult.type === "success" ? (
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/>
                    </svg>
                  </div>
                  <div>
                    <p className="text-emerald-300 font-semibold">Attendance Marked ✓</p>
                    <p className="text-white text-sm mt-0.5">
                      {lastResult.data.student.name}
                      <span className="text-zinc-400 ml-2 font-mono text-xs">{lastResult.data.student.roll_number}</span>
                    </p>
                    <p className="text-zinc-400 text-xs mt-1">
                      {lastResult.data.subject} · {lastResult.data.date}
                      {lastResult.data.match_confidence && (
                        <span className="ml-2 text-emerald-400/70">{lastResult.data.match_confidence}% confidence</span>
                      )}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    lastResult.code === "ALREADY_MARKED" ? "bg-amber-500/20" : "bg-red-500/20"
                  }`}>
                    <svg className={`w-5 h-5 ${lastResult.code === "ALREADY_MARKED" ? "text-amber-400" : "text-red-400"}`} fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      {lastResult.code === "ALREADY_MARKED"
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                      }
                    </svg>
                  </div>
                  <div>
                    <p className={`font-semibold ${lastResult.code === "ALREADY_MARKED" ? "text-amber-300" : "text-red-300"}`}>
                      {lastResult.code === "UNREGISTERED_FACE"
                        ? "Unregistered / Invalid Face"
                        : lastResult.code === "ALREADY_MARKED"
                        ? "Already Marked Present"
                        : "Scan Failed"}
                    </p>
                    <p className="text-zinc-300 text-sm mt-0.5">{lastResult.message}</p>
                    {lastResult.code === "UNREGISTERED_FACE" && (
                      <p className="text-zinc-500 text-xs mt-1">
                        → Go to Register to add this student.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}