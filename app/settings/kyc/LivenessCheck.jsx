"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, AlertCircle, Camera,
  Eye, Smile, ArrowLeft, ArrowRight,
  RotateCcw, Video, VideoOff,
} from "lucide-react";
import {
  LIVENESS_PROMPTS, MOTION_THRESHOLDS,
  SAMPLE_W, SAMPLE_H, EMA_ALPHA, CONFIRM_FRAMES, BLIND_FRAMES,
  STILLNESS_THRESHOLD, STILL_CONFIRM_FRAMES,
  MAX_RETRIES_PER_PROMPT, COUNTDOWN_SECS,
  shuffle,
} from "./constants";

// ── Prompt icon ───────────────────────────────────────────────────────────────
function PromptIcon({ icon, size = 18 }) {
  const cls = "text-amber-500";
  if (icon === "eye")   return <Eye size={size} className={cls} />;
  if (icon === "smile") return <Smile size={size} className={cls} />;
  if (icon === "left")  return <ArrowLeft size={size} className={cls} />;
  if (icon === "right") return <ArrowRight size={size} className={cls} />;
  if (icon === "nod")   return <span className={cls} style={{ fontSize: size * 0.85, lineHeight: 1 }}>↕</span>;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
export default function LivenessCheck({ onCapture, captured, onRetake, fullHeight = false }) {
  const videoRef       = useRef(null);
  const canvasRef      = useRef(null);
  const sampleRef      = useRef(null);
  const streamRef      = useRef(null);
  const rafRef         = useRef(null);
  const prevDataRef    = useRef(null);
  const emaRef         = useRef(0);
  const detectionOnRef = useRef(false);
  const tabHiddenRef   = useRef(false);
  const timerRef       = useRef(null);

  const [phase, setPhase]             = useState("idle");
  const [prompts, setPrompts]         = useState([]);
  const [promptIdx, setPromptIdx]     = useState(0);
  const [motionPct, setMotionPct]     = useState(0);
  const [completedIdxs, setCompleted] = useState([]);
  const [errorMsg, setErrorMsg]       = useState("");
  const [timeLeft, setTimeLeft]       = useState(0);
  const [retryCount, setRetryCount]   = useState(0);
  const [retryMsg, setRetryMsg]       = useState("");

  const promptsRef    = useRef([]);
  const promptIdxRef  = useRef(0);
  const retryCountRef = useRef(0);
  const timeLeftRef   = useRef(0);

  useEffect(() => { promptsRef.current    = prompts;    }, [prompts]);
  useEffect(() => { promptIdxRef.current  = promptIdx;  }, [promptIdx]);
  useEffect(() => { retryCountRef.current = retryCount; }, [retryCount]);

  const advancePromptRef           = useRef(null);
  const startDetectionCountdownRef = useRef(null);
  const handleTimeoutRef           = useRef(null);

  // ── Full reset ──────────────────────────────────────────────────────────────
  const resetState = useCallback(() => {
    setPhase("idle");
    setCompleted([]);
    setRetryCount(0);  retryCountRef.current = 0;
    setRetryMsg("");
    setMotionPct(0);
    setPrompts([]);
    setPromptIdx(0);   promptIdxRef.current  = 0;
    setErrorMsg("");
  }, []);

  const stopStream = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    clearInterval(timerRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current      = null;
    detectionOnRef.current = false;
    prevDataRef.current    = null;
    emaRef.current         = 0;
  }, []);

  useEffect(() => () => stopStream(), [stopStream]);

  // ── Retake: parent sets captured → null, we fully reset ────────────────────
  const prevCapturedRef = useRef(captured);
  useEffect(() => {
    if (prevCapturedRef.current && !captured) {
      stopStream();
      resetState();
    }
    prevCapturedRef.current = captured;
  }, [captured, stopStream, resetState]);

  // ── Tab visibility guard ────────────────────────────────────────────────────
  useEffect(() => {
    const onVis = () => {
      if (document.hidden && streamRef.current) {
        tabHiddenRef.current = true;
        stopStream();
        setErrorMsg("Tab switch detected. Please keep this tab active during the check.");
        setPhase("error");
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [stopStream]);

  // ── Screenshot prevention ───────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "PrintScreen" || (e.metaKey && e.shiftKey && ["3","4","5"].includes(e.key))) {
        e.preventDefault();
        if (streamRef.current) {
          stopStream();
          setErrorMsg("Screenshot detected. Please complete liveness without capturing the screen.");
          setPhase("error");
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stopStream]);

  // ── Motion measurement ──────────────────────────────────────────────────────
  const measureMotion = useCallback(() => {
    const video  = videoRef.current;
    const canvas = sampleRef.current;
    if (!video || !canvas || video.readyState < 2) return 0;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, SAMPLE_W, SAMPLE_H);
    const { data } = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);
    const grey = new Uint8Array(SAMPLE_W * SAMPLE_H);
    for (let i = 0; i < grey.length; i++) {
      const p = i * 4;
      grey[i] = (data[p] * 77 + data[p + 1] * 150 + data[p + 2] * 29) >> 8;
    }
    if (!prevDataRef.current) { prevDataRef.current = grey; return 0; }
    let diff = 0;
    for (let i = 0; i < grey.length; i++) diff += Math.abs(grey[i] - prevDataRef.current[i]);
    prevDataRef.current = grey;
    return diff / (grey.length * 255);
  }, []);

  // ── Frame entropy (replay / static camera) ──────────────────────────────────
  const checkFrameEntropy = useCallback(() => {
    const canvas = sampleRef.current;
    const video  = videoRef.current;
    if (!canvas || !video || video.readyState < 2) return true;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, SAMPLE_W, SAMPLE_H);
    const { data } = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);
    let sum = 0, sumSq = 0;
    const n = SAMPLE_W * SAMPLE_H;
    for (let i = 0; i < n; i++) {
      const p = i * 4;
      const g = (data[p] * 77 + data[p + 1] * 150 + data[p + 2] * 29) >> 8;
      sum += g; sumSq += g * g;
    }
    const mean = sum / n;
    return sumSq / n - mean * mean > 60;
  }, []);

  // ── Selfie capture ──────────────────────────────────────────────────────────
  const captureSelfie = useCallback(() => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(blob => {
      if (!blob) return;
      stopStream();
      onCapture(new File([blob], "liveness_selfie.jpg", { type: "image/jpeg" }));
    }, "image/jpeg", 0.92);
  }, [stopStream, onCapture]);

  // ── Stillness → capture ─────────────────────────────────────────────────────
  const startStillnessCapture = useCallback(() => {
    setPhase("stillness");
    prevDataRef.current    = null;
    emaRef.current         = 0;
    detectionOnRef.current = true;
    let stillFrames = 0;
    const loop = () => {
      if (!detectionOnRef.current) return;
      const raw = measureMotion();
      emaRef.current = EMA_ALPHA * raw + (1 - EMA_ALPHA) * emaRef.current;
      if (emaRef.current < STILLNESS_THRESHOLD) {
        stillFrames++;
        if (stillFrames >= STILL_CONFIRM_FRAMES) {
          detectionOnRef.current = false;
          captureSelfie();
          return;
        }
      } else { stillFrames = 0; }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [measureMotion, captureSelfie]);

  // ── Timeout → retry same prompt or hard-fail ────────────────────────────────
  const handleTimeout = useCallback((promptIndex) => {
    detectionOnRef.current = false;
    cancelAnimationFrame(rafRef.current);

    const currentRetries = retryCountRef.current;
    if (currentRetries < MAX_RETRIES_PER_PROMPT) {
      const attemptsLeft = MAX_RETRIES_PER_PROMPT - currentRetries;
      const newRetry = currentRetries + 1;
      setRetryCount(newRetry);
      retryCountRef.current = newRetry;

      const prompt = promptsRef.current[promptIndex];
      setRetryMsg(
        `We didn't detect the action. Please try again — ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining.`
      );
      setPhase("retry_warning");

      setTimeout(() => {
        if (!streamRef.current) return;
        setRetryMsg("");
        setPhase("warmup");
        setTimeout(() => {
          if (!streamRef.current) return;
          const thresh = MOTION_THRESHOLDS[prompt?.icon] ?? 0.020;
          setPhase("detecting");
          startDetectionCountdownRef.current?.(thresh, promptIndex);
        }, 1500);
      }, 2200);
    } else {
      stopStream();
      setErrorMsg(
        `We couldn't verify the action "${promptsRef.current[promptIndex]?.text}". ` +
        "Please ensure you're in a well-lit area and facing the camera, then try again."
      );
      setPhase("error");
    }
  }, [stopStream]);

  handleTimeoutRef.current = handleTimeout;

  // ── Advance to next prompt on confirmed success ─────────────────────────────
  const advancePrompt = useCallback((doneIdx) => {
    setCompleted(prev => [...prev, doneIdx]);
    setRetryCount(0);  retryCountRef.current = 0;
    setRetryMsg("");
    setMotionPct(0);
    setPhase("success_flash");

    setTimeout(() => {
      const currentPrompts = promptsRef.current;
      if (doneIdx < currentPrompts.length - 1) {
        const nextIdx = doneIdx + 1;
        setPromptIdx(nextIdx);
        setPhase("warmup");
        setTimeout(() => {
          if (!streamRef.current) return;
          const thresh = MOTION_THRESHOLDS[currentPrompts[nextIdx]?.icon] ?? 0.020;
          setPhase("detecting");
          startDetectionCountdownRef.current?.(thresh, nextIdx);
        }, 1200);
      } else {
        startStillnessCapture();
      }
    }, 900);
  }, [startStillnessCapture]);

  advancePromptRef.current = advancePrompt;

  // ── Detection loop ──────────────────────────────────────────────────────────
  const startDetectionLoop = useCallback((promptIndex, threshold) => {
    detectionOnRef.current = true;
    prevDataRef.current    = null;
    emaRef.current         = 0;
    let detectedThisRound = false;
    let motionFrames      = 0;
    let frameCount        = 0;
    let noMotionFrames    = 0;
    let entropyOkFrames   = 0;

    const loop = () => {
      if (!detectionOnRef.current) return;

      if (frameCount % 30 === 0) {
        if (checkFrameEntropy()) { entropyOkFrames++; }
        else if (entropyOkFrames === 0 && frameCount > 60) {
          setErrorMsg("Static or virtual camera detected. Please use your real device camera.");
          setPhase("error");
          stopStream();
          return;
        }
      }

      const raw = measureMotion();

      if (raw < 0.0003) {
        noMotionFrames++;
        if (noMotionFrames > 120) {
          setErrorMsg("No live movement detected. Please ensure you are in front of your camera.");
          setPhase("error");
          stopStream();
          return;
        }
      } else { noMotionFrames = 0; }

      emaRef.current = EMA_ALPHA * raw + (1 - EMA_ALPHA) * emaRef.current;
      frameCount++;

      if (frameCount > BLIND_FRAMES) {
        const pct = Math.min(100, Math.round((emaRef.current / (threshold * 3)) * 100));
        setMotionPct(pct);

        if (emaRef.current >= threshold) motionFrames++;
        else motionFrames = 0; // must be consecutive

        if (!detectedThisRound && motionFrames >= CONFIRM_FRAMES) {
          detectedThisRound      = true;
          detectionOnRef.current = false;
          clearInterval(timerRef.current);
          setTimeout(() => advancePromptRef.current?.(promptIndex), 200);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [measureMotion, checkFrameEntropy, stopStream]);

  // ── Countdown — expiry → handleTimeout, never advancePrompt ────────────────
  const startDetectionCountdown = useCallback((thresh, idx) => {
    timeLeftRef.current = COUNTDOWN_SECS;
    setTimeLeft(COUNTDOWN_SECS);

    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        clearInterval(timerRef.current);
        setTimeout(() => handleTimeoutRef.current?.(idx), 100);
      }
    }, 1000);

    startDetectionLoop(idx, thresh);
  }, [startDetectionLoop]);

  startDetectionCountdownRef.current = startDetectionCountdown;

  const lastUsedIconsRef = useRef(new Set());

  // ── Start camera ────────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    tabHiddenRef.current  = false;
    setPhase("requesting");
    setErrorMsg("");
    setRetryMsg("");
    setCompleted([]);
    setMotionPct(0);
    setRetryCount(0);  retryCountRef.current = 0;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 24, max: 30 } },
        audio: false,
      });

      const label = (stream.getVideoTracks()[0]?.label || "").toLowerCase();
      const virtualKeywords = ["obs","virtual","snap camera","manycam","droidcam","iriun","xsplit","mmhmm","camo"];
      if (virtualKeywords.some(k => label.includes(k))) {
        stream.getTracks().forEach(t => t.stop());
        setErrorMsg("Virtual camera software detected. Please use your built-in device camera.");
        setPhase("error");
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const excluded  = lastUsedIconsRef.current;
      const preferred = shuffle(LIVENESS_PROMPTS.filter(p => !excluded.has(p.icon)));
      const fallback  = shuffle(LIVENESS_PROMPTS.filter(p =>  excluded.has(p.icon)));
      const chosen    = [...preferred, ...fallback].slice(0, 2);
      lastUsedIconsRef.current = new Set(chosen.map(p => p.icon));

      promptsRef.current = chosen;
      setPrompts(chosen);
      setPromptIdx(0);  promptIdxRef.current = 0;
      setPhase("warmup");

      setTimeout(() => {
        if (!streamRef.current) return;
        setPhase("detecting");
        startDetectionCountdownRef.current?.(MOTION_THRESHOLDS[chosen[0]?.icon] ?? 0.020, 0);
      }, 2500);

    } catch (err) {
      setErrorMsg(
        err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access and try again."
          : "Could not access camera. Please ensure it is connected and try again."
      );
      setPhase("error");
    }
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────
  const currentPrompt = prompts[promptIdx];
  const thresholdPct  = 65;

  const capturedUrl = useMemo(() => captured ? URL.createObjectURL(captured) : null, [captured]);
  useEffect(() => () => { if (capturedUrl) URL.revokeObjectURL(capturedUrl); }, [capturedUrl]);

  // ── Render ───────────────────────────────────────────────────────────────────
  const isLive      = ["warmup","detecting","success_flash","stillness","retry_warning"].includes(phase);
  const isDetecting = phase === "detecting";
  const isStillness = phase === "stillness";
  const isRetry     = phase === "retry_warning";

  const ovalStroke = phase === "success_flash" ? "#10b981"
    : isStillness  ? "#818cf8"
    : isRetry      ? "#f97316"
    : isDetecting  ? "#f59e0b"
    : "rgba(255,255,255,0.4)";

  const viewportH = fullHeight ? "clamp(300px, 65vw, 480px)" : "clamp(220px, 48vw, 340px)";

  // ── Captured state ───────────────────────────────────────────────────────────
  if (captured && capturedUrl) {
    return (
      <div className="space-y-3">
        <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/40">
          <img
            src={capturedUrl}
            alt="liveness"
            className="w-full object-cover"
            style={{ transform: "scaleX(-1)", height: fullHeight ? "clamp(280px, 60vw, 440px)" : "clamp(160px, 40vw, 220px)" }}
          />
          <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow">
            <CheckCircle size={11} /> Liveness verified
          </div>
        </div>
        <button type="button" onClick={onRetake}
          className="flex items-center gap-2 text-sm text-white/30 hover:text-amber-500 font-semibold transition-colors py-1">
          <RotateCcw size={13} /> Retake
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ── Viewport ── */}
      <div className="relative rounded-2xl overflow-hidden bg-black/40 border border-white/10" style={{ height: viewportH }}>
        <video
          ref={videoRef}
          playsInline muted
          className="w-full h-full object-cover"
          style={{ transform: "scaleX(-1)", display: isLive ? "block" : "none" }}
        />
        <canvas ref={canvasRef} className="hidden" />
        <canvas ref={sampleRef} width={SAMPLE_W} height={SAMPLE_H} className="hidden" />

        {/* Face oval */}
        {isLive && (
          <div className="absolute inset-0 pointer-events-none">
            <svg width="100%" height="100%" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet">
              <defs>
                <mask id="liveness-cut">
                  <rect width="400" height="300" fill="white" />
                  <ellipse cx="200" cy="148" rx="98" ry="126" fill="black" />
                </mask>
              </defs>
              <rect width="400" height="300" fill="rgba(0,0,0,0.5)" mask="url(#liveness-cut)" />
              <ellipse cx="200" cy="148" rx="98" ry="126" fill="none"
                stroke={ovalStroke} strokeWidth="2.5"
                strokeDasharray={isDetecting ? "10 4" : "0"} />
            </svg>
          </div>
        )}

        {/* Progress dots */}
        {isLive && prompts.length > 0 && (
          <div className="absolute top-3 left-3 flex items-center gap-2">
            {prompts.map((_, i) => (
              <div key={i} className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                completedIdxs.includes(i) ? "bg-emerald-400 border-emerald-200 scale-110"
                  : i === promptIdx       ? "bg-amber-400 border-amber-200 scale-125"
                  : "bg-white/20 border-white/40"
              }`} />
            ))}
          </div>
        )}

        {/* Retry badge */}
        {isDetecting && retryCount > 0 && (
          <div className="absolute top-3 right-14 flex items-center gap-1 bg-orange-500/80 text-white text-xs font-bold px-2.5 py-1 rounded-full">
            Retry {retryCount}/{MAX_RETRIES_PER_PROMPT}
          </div>
        )}

        {/* Countdown ring */}
        {isDetecting && (
          <div className="absolute top-3 right-3 w-11 h-11 flex items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 44 44">
              <circle cx="22" cy="22" r="18" fill="rgba(0,0,0,0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
              <motion.circle cx="22" cy="22" r="18" fill="none"
                stroke={retryCount > 0 ? "#f97316" : "#f59e0b"}
                strokeWidth="2.5" strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 18}`}
                animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - timeLeft / COUNTDOWN_SECS) }}
                transition={{ duration: 0.9, ease: "linear" }} />
            </svg>
            <span className="text-white font-bold text-sm z-10 relative tabular-nums">{timeLeft}</span>
          </div>
        )}

        {/* Motion bar */}
        {isDetecting && !isStillness && (
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3 pt-6"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)" }}>
            <p className="text-white text-xs font-semibold mb-1.5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse inline-block" />
              Motion detected
            </p>
            <div className="relative h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="absolute top-0 bottom-0 w-0.5 bg-white/60 rounded-full z-10" style={{ left: `${thresholdPct}%` }} />
              <motion.div className="h-full rounded-full"
                style={{
                  background: motionPct >= thresholdPct
                    ? "linear-gradient(to right, #34d399, #10b981)"
                    : "linear-gradient(to right, #fbbf24, #f59e0b)",
                  width: `${Math.min(100, motionPct)}%`,
                }}
                transition={{ duration: 0.08 }} />
            </div>
          </div>
        )}

        {/* Retry warning overlay */}
        {isRetry && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center bg-black/70">
            <div className="w-14 h-14 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
              <AlertCircle size={24} className="text-orange-400" />
            </div>
            <p className="text-orange-300 font-bold text-sm leading-relaxed">{retryMsg}</p>
            <p className="text-white/40 text-xs">Please perform the action clearly and slowly.</p>
          </motion.div>
        )}

        {/* Stillness capture */}
        {isStillness && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40">
            <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 1.6 }}
              className="w-16 h-16 rounded-full bg-indigo-500/80 flex items-center justify-center shadow-lg">
              <Camera size={26} className="text-white" />
            </motion.div>
            <p className="text-white font-bold text-sm tracking-wide drop-shadow">Hold still… taking photo</p>
          </div>
        )}

        {/* Success flash */}
        {phase === "success_flash" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <CheckCircle size={30} className="text-white" />
            </motion.div>
            <p className="text-white font-bold text-sm">
              {promptIdx < prompts.length - 1 ? "Got it! Next action…" : "All done!"}
            </p>
          </motion.div>
        )}

        {/* Warmup */}
        {phase === "warmup" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/50">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full" />
            <p className="text-white text-sm font-medium">Get ready…</p>
          </div>
        )}

        {/* Idle / requesting */}
        {(phase === "idle" || phase === "requesting") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
              {phase === "requesting"
                ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full" />
                : <Video size={24} className="text-white/30" />}
            </div>
            <p className="text-white/40 text-sm">{phase === "requesting" ? "Starting camera…" : "Camera ready"}</p>
          </div>
        )}

        {/* Error */}
        {phase === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
            <VideoOff size={24} className="text-red-400" />
            <p className="text-red-400 text-sm leading-relaxed">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* ── Prompt card ── */}
      <AnimatePresence mode="wait">
        {(isDetecting || phase === "warmup") && !isStillness && !isRetry && currentPrompt && (
          <motion.div key={`prompt-${promptIdx}-${retryCount}`}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className={`rounded-xl border px-4 py-4 flex items-center gap-4 ${
              retryCount > 0 ? "border-orange-500/20 bg-orange-500/5" : "border-amber-500/20 bg-amber-500/5"
            }`}>
            <div className={`w-10 h-10 rounded-full bg-white/5 border flex items-center justify-center shrink-0 ${
              retryCount > 0 ? "border-orange-500/20" : "border-amber-500/20"
            }`}>
              <PromptIcon icon={currentPrompt.icon} size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${
                retryCount > 0 ? "text-orange-500/70" : "text-amber-500/70"
              }`}>
                {retryCount > 0
                  ? `Retry · Task ${promptIdx + 1} of ${prompts.length}`
                  : `Task ${promptIdx + 1} of ${prompts.length}`}
              </p>
              <p className="text-white font-semibold text-sm leading-snug">{currentPrompt.text}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── CTA buttons ── */}
      {phase === "idle" && (
        <>
          <button type="button" onClick={startCamera}
            className="w-full flex items-center justify-center gap-2 font-bold text-sm px-5 py-4 rounded-xl transition-all active:scale-95 touch-manipulation text-[#0D1F1A]"
            style={{ background: "linear-gradient(135deg, #C8873A 0%, #E8A850 100%)" }}>
            <Camera size={15} /> Start Liveness Check
          </button>
          <p className="text-white/20 text-xs leading-relaxed text-center px-2">
            Movements are analysed locally. No video is recorded — only a single captured frame is submitted.
          </p>
        </>
      )}
      {phase === "error" && (
        <button type="button" onClick={startCamera}
          className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-sm px-5 py-4 rounded-xl transition-all touch-manipulation">
          <RotateCcw size={13} /> Try Again
        </button>
      )}
    </div>
  );
}