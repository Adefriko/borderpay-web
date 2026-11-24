"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { IconQrCode, IconShieldCheck } from "./Icons";

export default function QrScannerModal({ isOpen, onClose }) {
  const router = useRouter();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [validationError, setValidationError] = useState("");

  const startCamera = async () => {
    setCameraError("");
    setValidationError("");
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Kamera tidak didukung pada browser ini atau koneksi tidak aman (HTTPS/Localhost).");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute("playsinline", "true");
        await videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err) {
      console.warn("Camera access failed:", err);
      setCameraError(
        err.name === "NotAllowedError" || err.name === "PermissionDeniedError"
          ? "Izin akses kamera ditolak. Silakan izinkan browser mengakses kamera atau gunakan opsi paste link."
          : err.message || "Gagal membuka kamera."
      );
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      startCamera();
    } else {
      stopCamera();
      setManualInput("");
      setValidationError("");
      setCameraError("");
    }
    return () => {
      stopCamera();
    };
  }, [isOpen]);

  const processInvoiceLink = (rawText) => {
    setValidationError("");
    if (!rawText || !rawText.trim()) {
      return setValidationError("Harap masukkan atau scan link invoice BorderPay.");
    }

    try {
      let urlObj;
      if (rawText.startsWith("http://") || rawText.startsWith("https://")) {
        urlObj = new URL(rawText.trim());
      } else if (rawText.startsWith("/pay?") || rawText.startsWith("pay?")) {
        urlObj = new URL(rawText.trim().replace(/^pay\?/, "/pay?"), window.location.origin);
      } else {
        throw new Error("Format link tidak valid. Harus mengandung URL pembayaran BorderPay.");
      }

      if (!urlObj.pathname.includes("/pay")) {
        throw new Error("Link ini bukan halaman pembayaran BorderPay (/pay).");
      }

      const params = urlObj.searchParams;
      if (!params.get("orderId") || !params.get("receiver") || !params.get("amount")) {
        throw new Error("Parameter invoice tidak lengkap (orderId, receiver, atau amount hilang).");
      }

      stopCamera();
      onClose();
      router.push(`/pay?${params.toString()}`);
    } catch (err) {
      setValidationError(err.message || "Link invoice tidak valid.");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-7 text-slate-800 space-y-6 animate-modal-pop">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <IconQrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B192C]">Scan QR Tagihan BorderPay</h3>
              <p className="text-xs text-slate-500">Pindai kamera atau tempel link invoice</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-press w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 flex items-center justify-center">
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="p-6 text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto text-slate-300">
                📷
              </div>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                {cameraError || "Kamera tidak aktif. Gunakan input manual link di bawah."}
              </p>
              {!cameraActive && !cameraError && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Aktifkan Kamera
                </button>
              )}
            </div>
          )}

          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-dashed border-blue-400 rounded-2xl shadow-[0_0_20px_rgba(25,81,252,0.4)] relative">
                <div className="absolute inset-x-0 h-0.5 bg-blue-400 animate-scan" />
              </div>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>Atau Tempel Link Invoice (/pay?...):</span>
            <span className="text-[10px] text-slate-400 font-normal">Fallback Manual</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://.../pay?orderId=0x...&receiver=0x..."
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition font-mono"
            />
            <button
              type="button"
              onClick={() => processInvoiceLink(manualInput)}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-2xs cursor-pointer flex-shrink-0"
            >
              Buka Invoice
            </button>
          </div>
          {validationError && (
            <p className="text-xs text-rose-700 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
              ⚠️ {validationError}
            </p>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <IconShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>Validasi format otomatis aktif</span>
          </span>
          <span>Tidak ada penandatanganan otomatis</span>
        </div>
      </div>
    </div>
  );
}
