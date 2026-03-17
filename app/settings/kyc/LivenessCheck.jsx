"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle, AlertCircle, Camera,
  Eye, Smile, ArrowLeft, ArrowRight,
  RotateCcw, Video, VideoOff,
} from "lucide-react";
import {
  LIVENESS_PROMPTS,
  SAMPLE_W, SAMPLE_H,
  EMA_ALPHA,
  DETECTION_EMA_ALPHA,  // lower alpha for detection phase — less reactive to jolts
  ACCUMULATOR_NEED,
  ACCUMULATOR_DECAY,
  MIN_SUSTAIN_FRAMES,   // consecutive above-threshold frames needed before accumulator counts
  JOLT_PEAK_MULTIPLIER, // peak/threshold ratio that classifies a burst as a jolt
  BASELINE_FRAMES,
  ACTION_MULTIPLIER,
  MIN_BRIGHTNESS,
  MAX_RETRIES_PER_PROMPT,
  COUNTDOWN_SECS,
  COUNTDOWN_BONUS,      // FIX Bug 5: imported from constants
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
  // Learned noise floor — measured once per camera session.
  // FIX Bug 3: cleared on every retry so a polluted baseline doesn't carry over.
  const idleBaselineRef = useRef(null);

  const [phase, setPhase]             = useState("idle");
  const [prompts, setPrompts]         = useState([]);
  const [promptIdx, setPromptIdx]     = useState(0);
  const [motionPct, setMotionPct]     = useState(0);
  const [completedIdxs, setCompleted] = useState([]);
  const [errorMsg, setErrorMsg]       = useState("");
  const [timeLeft, setTimeLeft]       = useState(0);
  const [retryCount, setRetryCount]   = useState(0);
  const [retryMsg, setRetryMsg]       = useState("");

  // ── Refs that mirror state so stable callbacks can read current values ──────
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
    idleBaselineRef.current = null;
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

  // ── Motion measurement ─────────────────────────────────────────────────────
  const measureMotion = useCallback(() => {
    const video  = videoRef.current;
    const canvas = sampleRef.current;
    if (!video || !canvas || video.readyState < 2) return 0;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    // Source crop: horizontal 20–80%, vertical 10–90% — keeps the face in frame
    const sw = video.videoWidth  || 640;
    const sh = video.videoHeight || 480;
    ctx.drawImage(video, sw * 0.2, sh * 0.1, sw * 0.6, sh * 0.8, 0, 0, SAMPLE_W, SAMPLE_H);

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

  // ── Brightness check — rejects dark/covered camera ────────────────────────
  const measureBrightness = useCallback(() => {
    const video  = videoRef.current;
    const canvas = sampleRef.current;
    if (!video || !canvas || video.readyState < 2) return 255;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(video, 0, 0, SAMPLE_W, SAMPLE_H);
    const { data } = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);
    let sum = 0;
    const n = SAMPLE_W * SAMPLE_H;
    for (let i = 0; i < n; i++) {
      const p = i * 4;
      sum += (data[p] * 77 + data[p + 1] * 150 + data[p + 2] * 29) >> 8;
    }
    return sum / n; // 0–255
  }, []);

  // ── Selfie capture ─────────────────────────────────────────────────────────
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

  // ── Stillness → capture ───────────────────────────────────────────────────
  const startStillnessCapture = useCallback(() => {
    setPhase("stillness");
    detectionOnRef.current = false;
    cancelAnimationFrame(rafRef.current);
    prevDataRef.current = null;
    emaRef.current      = 0;
    setTimeout(() => {
      captureSelfie();
    }, 900);
  }, [captureSelfie]);

  // ── Timeout → retry same prompt or hard-fail ──────────────────────────────
  const handleTimeout = useCallback((promptIndex) => {
    detectionOnRef.current = false;
    cancelAnimationFrame(rafRef.current);

    const currentRetries = retryCountRef.current;
    if (currentRetries < MAX_RETRIES_PER_PROMPT) {
      // FIX Bug 2: compute attemptsLeft BEFORE incrementing so the displayed
      // count is accurate (was: attemptsLeft = MAX - currentRetries, then
      // newRetry = currentRetries + 1, causing an off-by-one on last retry).
      const newRetry     = currentRetries + 1;
      const attemptsLeft = MAX_RETRIES_PER_PROMPT - newRetry;

      setRetryCount(newRetry);
      retryCountRef.current = newRetry;

      setRetryMsg(
        attemptsLeft > 0
          ? `We didn't detect the action. Please try again — ${attemptsLeft} attempt${attemptsLeft !== 1 ? "s" : ""} remaining.`
          : "We didn't detect the action. This is your last attempt."
      );
      setPhase("retry_warning");

      // FIX Bug 3: clear the learned baseline before each retry so that
      // accidental motion during the first attempt doesn't pollute subsequent
      // baseline measurements.
      idleBaselineRef.current = null;

      setTimeout(() => {
        if (!streamRef.current) return;
        setRetryMsg("");
        setPhase("warmup");
        setTimeout(() => {
          if (!streamRef.current) return;
          setPhase("detecting");
          startDetectionCountdownRef.current?.(promptsRef.current[promptIndex]?.icon, promptIndex);
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

  // ── Advance to next prompt on confirmed success ────────────────────────────
  // FIX Bug 1: capture the current promptIdx value as a local variable at call
  // time (doneIdx parameter) rather than reading the React state inside the
  // closure, which could be stale by the time the success_flash setTimeout fires.
  const advancePrompt = useCallback((doneIdx) => {
    setCompleted(prev => [...prev, doneIdx]);
    setRetryCount(0);  retryCountRef.current = 0;
    setRetryMsg("");
    setMotionPct(0);

    const currentPrompts = promptsRef.current;
    const isLast = doneIdx >= currentPrompts.length - 1;

    // FIX Bug 1: derive the flash label from doneIdx (passed in, always correct)
    // instead of reading the promptIdx state which may not have updated yet.
    setPhase("success_flash");

    setTimeout(() => {
      if (!isLast) {
        const nextIdx = doneIdx + 1;
        setPromptIdx(nextIdx);
        promptIdxRef.current = nextIdx;
        setPhase("warmup");
        setTimeout(() => {
          if (!streamRef.current) return;
          setPhase("detecting");
          startDetectionCountdownRef.current?.(currentPrompts[nextIdx]?.icon, nextIdx);
        }, 1200);
      } else {
        startStillnessCapture();
      }
    }, 900);
  }, [startStillnessCapture]);

  advancePromptRef.current = advancePrompt;

  // Store isLast in a ref so the success_flash overlay can read it without
  // depending on promptIdx state (which is what caused Bug 1).
  const isLastPromptRef = useRef(false);
  const runAdvancePrompt = useCallback((doneIdx) => {
    const currentPrompts = promptsRef.current;
    isLastPromptRef.current = doneIdx >= currentPrompts.length - 1;
    advancePromptRef.current?.(doneIdx);
  }, []);

  // ── Detection loop (adaptive baseline) ────────────────────────────────────
  const startDetectionLoop = useCallback((promptIcon, promptIndex) => {
    detectionOnRef.current = true;
    prevDataRef.current    = null;
    emaRef.current         = 0;

    let detectedThisRound = false;
    let motionFrames      = 0;
    let baselineSamples   = [];
    let brightnessSamples = [];

    // FIX Bug 3: idleBaselineRef is now cleared before every retry in
    // handleTimeout, so this check only reuses baseline within the same
    // uninterrupted detection attempt (e.g. prompt 2 reuses prompt 1's baseline).
    let baselineDone    = !!idleBaselineRef.current;
    let multiplier      = ACTION_MULTIPLIER[promptIcon] ?? ACTION_MULTIPLIER._default;
    let effectiveThresh = idleBaselineRef.current
      ? idleBaselineRef.current * multiplier
      : null;

    // ── Anti-jolt state (local to this detection round) ──────────────────────
    // consecutiveFrames: how many frames in a row the EMA has been above threshold.
    // peakEma:           the highest EMA value seen in the current above-threshold run.
    // Both reset to 0 whenever the EMA drops back below threshold.
    let consecutiveFrames = 0;
    let peakEma           = 0;

    const loop = () => {
      if (!detectionOnRef.current) return;

      const raw = measureMotion();

      // ── Phase 1: learn idle baseline (uses standard EMA_ALPHA) ───────────────
      if (!baselineDone) {
        emaRef.current = EMA_ALPHA * raw + (1 - EMA_ALPHA) * emaRef.current;
        baselineSamples.push(raw);
        brightnessSamples.push(measureBrightness());

        if (baselineSamples.length >= BASELINE_FRAMES) {
          const avgBrightness = brightnessSamples.reduce((a, b) => a + b, 0) / brightnessSamples.length;
          if (avgBrightness < MIN_BRIGHTNESS) {
            stopStream();
            setErrorMsg("Camera appears dark or covered. Please ensure you are well-lit and facing the camera.");
            setPhase("error");
            return;
          }

          // Median of middle 60% to exclude accidental fidgets
          const sorted  = [...baselineSamples].sort((a, b) => a - b);
          const lo      = Math.floor(sorted.length * 0.2);
          const hi      = Math.ceil(sorted.length * 0.8);
          const slice   = sorted.slice(lo, hi);
          const median  = slice.reduce((a, b) => a + b, 0) / slice.length;
          const learned = Math.max(median, 0.0006);
          idleBaselineRef.current = learned;
          effectiveThresh  = learned * multiplier;
          baselineDone     = true;
          // Reset EMA so the detection phase starts clean
          emaRef.current   = 0;
        }
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      // ── Phase 2: detect action ────────────────────────────────────────────────
      // Use the lower DETECTION_EMA_ALPHA so the signal is less reactive to jolts.
      emaRef.current = DETECTION_EMA_ALPHA * raw + (1 - DETECTION_EMA_ALPHA) * emaRef.current;

      const pct = Math.min(100, Math.round((emaRef.current / effectiveThresh) * 80));
      setMotionPct(pct);

      if (emaRef.current >= effectiveThresh) {
        // Track consecutive run length and peak for jolt detection
        consecutiveFrames += 1;
        peakEma = Math.max(peakEma, emaRef.current);
        motionFrames = Math.min(motionFrames + 1, ACCUMULATOR_NEED * 1.5);
      } else {
        // Motion dropped below threshold — evaluate whether the preceding run
        // was a jolt (very high peak but too short to be deliberate).
        if (consecutiveFrames > 0 && consecutiveFrames < MIN_SUSTAIN_FRAMES) {
          // Gate 3: jolt rejection — peak was far above threshold but the run
          // ended before MIN_SUSTAIN_FRAMES consecutive frames, so reset the
          // accumulator instead of letting those frames count toward detection.
          if (peakEma >= effectiveThresh * JOLT_PEAK_MULTIPLIER) {
            motionFrames = 0;
          }
        }
        consecutiveFrames = 0;
        peakEma           = 0;
        motionFrames      = Math.max(0, motionFrames - ACCUMULATOR_DECAY);
      }

      // Gate 1 (sustain): only allow the accumulator to trigger detection if the
      // current above-threshold run has lasted at least MIN_SUSTAIN_FRAMES frames.
      // A rapid jolt fills frames quickly but consecutiveFrames stays too low.
      const sustainMet = consecutiveFrames >= MIN_SUSTAIN_FRAMES;

      if (!detectedThisRound && sustainMet && motionFrames >= ACCUMULATOR_NEED) {
        detectedThisRound      = true;
        detectionOnRef.current = false;
        clearInterval(timerRef.current);
        setTimeout(() => runAdvancePrompt(promptIndex), 200);
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
  }, [measureMotion, measureBrightness, stopStream, runAdvancePrompt]);

  // ── Countdown — drift-proof via Date.now() snapshot ──────────────────────
  // FIX Bug 6: replaced setInterval(…, 1000) tick-counting with a deadline
  // computed from Date.now(). The interval polls at 250ms but rounds to whole
  // seconds for display, so the shown number stays accurate even under browser
  // throttling or CPU load.
  const startDetectionCountdown = useCallback((promptIcon, idx) => {
    const totalSecs = COUNTDOWN_SECS + COUNTDOWN_BONUS;
    const deadline  = Date.now() + totalSecs * 1000;
    timeLeftRef.current = totalSecs;
    setTimeLeft(totalSecs);

    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      timeLeftRef.current = remaining;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        setTimeout(() => handleTimeoutRef.current?.(idx), 100);
      }
    }, 250); // poll at 250ms for accuracy; display rounds to seconds

    startDetectionLoop(promptIcon, idx);
  }, [startDetectionLoop]);

  startDetectionCountdownRef.current = startDetectionCountdown;

  const lastUsedIconsRef = useRef(new Set());

  // ── Start camera ───────────────────────────────────────────────────────────
  const startCamera = useCallback(async () => {
    tabHiddenRef.current  = false;
    setPhase("requesting");
    setErrorMsg("");
    setRetryMsg("");
    setCompleted([]);
    setMotionPct(0);
    setRetryCount(0);  retryCountRef.current = 0;
    idleBaselineRef.current = null;

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
      isLastPromptRef.current = false;
      setPhase("warmup");

      setTimeout(() => {
        if (!streamRef.current) return;
        setPhase("detecting");
        startDetectionCountdownRef.current?.(chosen[0]?.icon, 0);
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

  // ── Derived ────────────────────────────────────────────────────────────────
  const currentPrompt = prompts[promptIdx];
  const thresholdPct  = 65;

  // FIX Bug 4: use a ref to track the previous object URL so we can revoke it
  // synchronously before creating the next one, avoiding the race between
  // useMemo and the useEffect cleanup when `captured` changes rapidly.
  const capturedUrlRef = useRef(null);
  const capturedUrl = useMemo(() => {
    if (capturedUrlRef.current) {
      URL.revokeObjectURL(capturedUrlRef.current);
      capturedUrlRef.current = null;
    }
    if (!captured) return null;
    const url = URL.createObjectURL(captured);
    capturedUrlRef.current = url;
    return url;
  }, [captured]);

  // Final cleanup when component unmounts
  useEffect(() => () => {
    if (capturedUrlRef.current) URL.revokeObjectURL(capturedUrlRef.current);
  }, []);

  // ── Render ─────────────────────────────────────────────────────────────────
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

  // ── Captured state ─────────────────────────────────────────────────────────
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
                animate={{ strokeDashoffset: 2 * Math.PI * 18 * (1 - timeLeft / (COUNTDOWN_SECS + COUNTDOWN_BONUS)) }}
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

        {/* Success flash
            FIX Bug 1: read isLastPromptRef.current (set synchronously in
            runAdvancePrompt before any state updates) instead of deriving
            from promptIdx state, which may not have updated yet. */}
        {phase === "success_flash" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
            <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg">
              <CheckCircle size={30} className="text-white" />
            </motion.div>
            <p className="text-white font-bold text-sm">
              {isLastPromptRef.current ? "All done!" : "Got it! Next action…"}
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