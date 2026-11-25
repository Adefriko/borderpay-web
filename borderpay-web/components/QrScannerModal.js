"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { parseBorderPayPaymentLink } from "../lib/activityUtils";
import { IconQrCode, IconCopy, IconRefresh, IconCheck } from "./Icons";
import { useToast } from "./ToastContext";

function stopMediaStream(stream) {
  if (!stream) return;
  stream.getTracks().forEach((track) => {
    try {
      track.stop();
    } catch {
      // Ignore already stopped track
    }
  });
}

function mapCameraErrorMessage(err) {
  const name = err?.name || "";
  if (name === "NotAllowedError" || name === "PermissionDeniedError") {
    return "Izin akses kamera ditolak. Izinkan kamera di pengaturan browser Anda, lalu klik Coba Lagi.";
  }
  if (name === "NotFoundError" || name === "DevicesNotFoundError") {
    return "Perangkat kamera tidak ditemukan. Anda dapat mengunggah gambar QR atau menempelkan link invoice.";
  }
  if (name === "NotReadableError" || name === "TrackStartError") {
    return "Kamera sedang digunakan oleh aplikasi atau tab lain. Tutup aplikasi tersebut lalu klik Coba Lagi.";
  }
  if (name === "SecurityError") {
    return "Akses kamera membutuhkan koneksi HTTPS atau localhost.";
  }
  return err?.message || "Gagal menghubungkan ke kamera.";
}

export default function QrScannerModal({ isOpen, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const streamRef = useRef(null);
  const isOpenRef = useRef(isOpen);
  const attemptIdRef = useRef(0);
  const cooldownRef = useRef(0);

  const [cameraState, setCameraState] = useState("idle"); // "idle" | "requesting" | "active" | "error" | "detected"
  const [cameraError, setCameraError] = useState("");
  const [facingMode, setFacingMode] = useState("environment");
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const [showStatePreviews, setShowStatePreviews] = useState(false);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const stopCamera = useCallback(() => {
    attemptIdRef.current += 1;
    if (streamRef.current) {
      stopMediaStream(streamRef.current);
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const startCamera = useCallback(
    async (requestedFacing = facingMode) => {
      const attemptId = ++attemptIdRef.current;

      if (streamRef.current) {
        stopMediaStream(streamRef.current);
        streamRef.current = null;
      }

      await Promise.resolve();
      if (!isOpenRef.current || attemptIdRef.current !== attemptId) return;

      setCameraError("");
      setValidationError("");
      setCameraState("requesting");

      try {
        if (typeof window !== "undefined" && !window.isSecureContext) {
          throw new Error(
            "Browser memblokir kamera pada alamat HTTP non-localhost. Buka melalui HTTPS/localhost atau unggah gambar QR."
          );
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error(
            "Browser ini tidak mendukung akses kamera langsung. Gunakan fitur Unggah QR atau tempel link."
          );
        }

        let stream;
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: {
              facingMode: { ideal: requestedFacing },
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
            audio: false,
          });
        } catch (constraintErr) {
          const fallbackErrors = ["OverconstrainedError", "ConstraintNotSatisfiedError", "NotFoundError", "AbortError"];
          if (!fallbackErrors.includes(constraintErr?.name)) {
            throw constraintErr;
          }
          // Desktop/laptop webcams frequently reject facingMode/resolution hints
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        }

        if (!isOpenRef.current || attemptIdRef.current !== attemptId) {
          stopMediaStream(stream);
          return;
        }

        streamRef.current = stream;

        if (navigator.mediaDevices.enumerateDevices) {
          navigator.mediaDevices
            .enumerateDevices()
            .then((devices) => {
              if (!isOpenRef.current || attemptIdRef.current !== attemptId) return;
              const videoInputs = devices.filter((d) => d.kind === "videoinput");
              setHasMultipleCameras(videoInputs.length > 1);
            })
            .catch(() => {});
        }

        const videoEl = videoRef.current;
        if (videoEl) {
          videoEl.srcObject = stream;
          videoEl.muted = true;
          videoEl.setAttribute("playsinline", "true");
          videoEl.setAttribute("webkit-playsinline", "true");
          try {
            await videoEl.play();
          } catch (playErr) {
            if (playErr?.name !== "AbortError") {
              throw playErr;
            }
          }
        }

        if (!isOpenRef.current || attemptIdRef.current !== attemptId) {
          stopMediaStream(stream);
          streamRef.current = null;
          return;
        }

        setCameraState("active");
      } catch (err) {
        if (!isOpenRef.current || attemptIdRef.current !== attemptId) return;
        console.warn("Camera access failed:", err);
        setCameraError(mapCameraErrorMessage(err));
        setCameraState("error");
      }
    },
    [facingMode]
  );

  const navigateToInvoice = useCallback(
    (targetPath) => {
      stopCamera();
      setCameraState("detected");
      setTimeout(() => {
        onClose();
        router.push(targetPath);
      }, 360);
    },
    [onClose, router, stopCamera]
  );

  const processInvoiceLink = useCallback(
    (rawText) => {
      setValidationError("");
      try {
        const origin = typeof window !== "undefined" ? window.location.origin : "https://borderpay.local";
        const targetPath = parseBorderPayPaymentLink(rawText, origin);
        navigateToInvoice(targetPath);
      } catch (err) {
        setValidationError(err.message || "Link invoice tidak valid.");
      }
    },
    [navigateToInvoice]
  );

  useEffect(() => {
    if (isOpen) {
      startCamera(facingMode);
    } else {
      stopCamera();
      Promise.resolve().then(() => {
        setCameraState("idle");
        setCameraError("");
        setManualInput("");
        setValidationError("");
      });
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, startCamera, stopCamera]);

  // Real-time QR decoding loop while camera stream is active
  useEffect(() => {
    if (!isOpen || cameraState !== "active") return;

    const timerId = setInterval(() => {
      const video = videoRef.current;
      if (!video || video.readyState < 2 || video.videoWidth <= 0 || video.videoHeight <= 0) {
        return;
      }

      if (!canvasRef.current) {
        canvasRef.current = document.createElement("canvas");
      }
      const canvas = canvasRef.current;
      const scale = Math.min(1, 720 / Math.max(video.videoWidth, video.videoHeight));
      const width = Math.max(1, Math.floor(video.videoWidth * scale));
      const height = Math.max(1, Math.floor(video.videoHeight * scale));

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);
      const imageData = ctx.getImageData(0, 0, width, height);
      const decoded = jsQR(imageData.data, width, height, {
        inversionAttempts: "attemptBoth",
      });

      if (decoded?.data) {
        const now = Date.now();
        if (now - cooldownRef.current < 1500) return;
        cooldownRef.current = now;

        setManualInput(decoded.data);
        try {
          const origin = typeof window !== "undefined" ? window.location.origin : "https://borderpay.local";
          const targetPath = parseBorderPayPaymentLink(decoded.data, origin);
          toast.success("QR Terdeteksi", "Membuka halaman pembayaran invoice...");
          navigateToInvoice(targetPath);
        } catch (err) {
          setValidationError(err.message || "QR terbaca, namun bukan tagihan BorderPay.");
        }
      }
    }, 170);

    return () => clearInterval(timerId);
  }, [isOpen, cameraState, navigateToInvoice, toast]);

  const handleToggleCameraFacing = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setManualInput(text);
        toast.info("Link Ditempel", "Link invoice dari clipboard dimasukkan.");
      }
    } catch {
      toast.warning("Izin Clipboard Diperlukan", "Silakan tempel (Ctrl+V) langsung pada input.");
    }
  };

  const handleImageFileSelect = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setValidationError("");
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const maxDim = 1024;
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.max(1, Math.floor(img.width * scale));
        const h = Math.max(1, Math.floor(img.height * scale));
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        // Paint white base first in case uploaded QR PNG has transparency
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, w, h);
        ctx.drawImage(img, 0, 0, w, h);

        const imageData = ctx.getImageData(0, 0, w, h);
        const decoded = jsQR(imageData.data, w, h, { inversionAttempts: "attemptBoth" });
        if (!decoded?.data) {
          setValidationError("Tidak ditemukan QR code yang jelas pada gambar tersebut.");
          return;
        }
        setManualInput(decoded.data);
        processInvoiceLink(decoded.data);
      };
      img.onerror = () => {
        setValidationError("Gagal membaca file gambar QR.");
      };
      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-4 sm:p-6 lg:p-7 text-slate-800 space-y-4 sm:space-y-5 animate-modal-pop max-h-[90dvh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs shrink-0">
              <IconQrCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-extrabold text-[#0B192C] truncate">
                Scan QR Tagihan BorderPay
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">
                Pindai kamera, unggah gambar QR, atau tempel link
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-press w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer shrink-0"
          >
            ✕
          </button>
        </div>

        {/* Camera Viewport (Video stays mounted unconditionally so videoRef is always ready) */}
        <div className="relative min-h-[220px] sm:aspect-video rounded-2xl overflow-hidden bg-[#071926] border border-cyan-900/40 flex items-center justify-center">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${
              cameraState === "active" ? "opacity-100" : "opacity-0 pointer-events-none"
            }`}
          />

          {/* Overlay State: Requesting Camera */}
          {cameraState === "requesting" && (
            <div className="p-4 text-center space-y-2.5 relative z-10">
              <div className="w-9 h-9 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-semibold text-cyan-100">
                Menghubungkan ke kamera...
              </p>
            </div>
          )}

          {/* Overlay State: Detected Valid QR */}
          {cameraState === "detected" && (
            <div className="p-4 text-center space-y-2 relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/50 text-emerald-300 flex items-center justify-center mx-auto">
                <IconCheck className="w-6 h-6" />
              </div>
              <p className="text-xs font-extrabold text-emerald-200">
                QR Terdeteksi! Membuka tagihan...
              </p>
            </div>
          )}

          {/* Overlay State: Idle or Camera Error */}
          {(cameraState === "idle" || cameraState === "error") && (
            <div className="p-4 sm:p-6 text-center space-y-3 relative z-10">
              <div className="w-11 h-11 rounded-2xl bg-cyan-950/70 border border-cyan-800/50 flex items-center justify-center mx-auto text-cyan-300 text-lg">
                📷
              </div>
              <p className="text-xs text-slate-200 max-w-xs mx-auto leading-relaxed">
                {cameraError || "Kamera siap diaktifkan untuk memindai QR BorderPay."}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => startCamera(facingMode)}
                  className="btn-press px-4 py-2 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-bold transition shadow-xs cursor-pointer inline-flex items-center gap-1.5"
                >
                  <IconRefresh className="w-3.5 h-3.5" />
                  <span>{cameraState === "error" ? "Coba Lagi" : "Aktifkan Kamera"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-press px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold border border-white/25 transition cursor-pointer"
                >
                  Unggah Gambar QR
                </button>
              </div>
            </div>
          )}

          {/* Active Camera Overlay Frame & Flip Control */}
          {cameraState === "active" && (
            <div className="absolute inset-3 sm:inset-4 flex flex-col justify-between pointer-events-none z-10">
              <div className="flex justify-between items-center text-[10px] text-cyan-300 font-mono">
                <span className="flex items-center gap-1.5 bg-cyan-950/80 px-2.5 py-1 rounded-md border border-cyan-800/50">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Memindai QR...</span>
                </span>

                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleToggleCameraFacing}
                    className="pointer-events-auto px-2.5 py-1 rounded-md bg-slate-900/75 hover:bg-slate-900 text-white border border-white/25 text-[10px] font-sans font-bold cursor-pointer transition"
                  >
                    ↻ Ganti Kamera
                  </button>
                )}
              </div>

              <div className="self-center w-28 h-28 sm:w-36 sm:h-36 border-2 border-dashed border-cyan-400/85 rounded-2xl relative shadow-[0_0_25px_rgba(6,182,212,0.3)] flex items-center justify-center">
                <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" />
              </div>

              <div className="text-center text-[10px] sm:text-[11px] text-cyan-100/90 font-medium drop-shadow">
                Arahkan kamera tepat ke kotak QR BorderPay
              </div>
            </div>
          )}
        </div>

        {/* Hidden File Input for Image QR Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageFileSelect}
          className="hidden"
        />

        {/* Manual Link & Image QR Fallback */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">
              LINK INVOICE / GAMBAR QR
            </label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
            >
              Scan dari file gambar
            </button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              placeholder="https://... atau tempel link invoice"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="w-full sm:flex-1 min-w-0 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition font-mono"
            />
            <div className="grid grid-cols-2 sm:flex gap-2 shrink-0">
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="btn-press px-3 py-2.5 sm:py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1"
              >
                <IconCopy className="w-3.5 h-3.5" />
                <span>Tempel Link</span>
              </button>
              <button
                type="button"
                onClick={() => processInvoiceLink(manualInput)}
                className="btn-press px-4 py-2.5 sm:py-2 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white font-bold text-xs transition shadow-2xs cursor-pointer flex items-center justify-center"
              >
                Buka Invoice
              </button>
            </div>
          </div>
          {validationError && (
            <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200 font-medium">
              ⚠️ {validationError}
            </p>
          )}
        </div>

        {/* Security / Validation Notice Points */}
        <div className="space-y-1.5 pt-1 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold">ℹ</span>
            <span>Validasi format otomatis dilakukan saat QR dipindai.</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-blue-600 font-bold">🛡</span>
            <span>Memindai QR tidak otomatis menandatangani atau mengirim transaksi.</span>
          </div>
        </div>

        {/* Modal Buttons */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="btn-press px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onClose}
            className="btn-press px-6 py-2 rounded-xl bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-extrabold shadow-xs transition cursor-pointer"
          >
            Tutup
          </button>
        </div>

        {/* Toggle State Previews */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowStatePreviews(!showStatePreviews)}
            className="text-[11px] text-slate-400 hover:text-blue-600 font-bold block transition cursor-pointer"
          >
            {showStatePreviews ? "▼ Sembunyikan" : "► Tampilkan"} 8 Camera State Previews (Design Reference)
          </button>

          {showStatePreviews && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold block text-slate-500 mb-1">1) Kamera Tidak Aktif</span>
                <span className="text-slate-400">Kamera saat ini dinonaktifkan</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold block text-slate-500 mb-1">2) Izin Diminta</span>
                <span className="text-blue-600">Menunggu izin browser...</span>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-950 text-cyan-200 border border-cyan-800">
                <span className="font-bold block mb-1">3) Kamera Aktif</span>
                <span className="text-cyan-400">Memindai...</span>
              </div>
              <div className="p-2.5 rounded-xl bg-emerald-950 text-emerald-200 border border-emerald-800">
                <span className="font-bold block mb-1">4) QR Terdeteksi</span>
                <span className="text-emerald-400">✓ Valid QR</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                <span className="font-bold block mb-1">5) Izin Ditolak</span>
                <span>Buka pengaturan browser</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold block text-slate-500 mb-1">6) Kamera Tidak Tersedia</span>
                <span className="text-slate-400">Hardware tidak terdeteksi</span>
              </div>
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800">
                <span className="font-bold block mb-1">7) QR Tidak Valid</span>
                <span>Format tidak dikenali</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold block text-slate-500 mb-1">8) Manual Invalid</span>
                <span className="text-rose-600">Link invalid</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
