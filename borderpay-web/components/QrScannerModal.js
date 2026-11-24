"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { IconQrCode, IconShieldCheck, IconCopy } from "./Icons";
import { useToast } from "./ToastContext";

export default function QrScannerModal({ isOpen, onClose }) {
  const router = useRouter();
  const toast = useToast();
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [manualInput, setManualInput] = useState("");
  const [validationError, setValidationError] = useState("");
  const [showStatePreviews, setShowStatePreviews] = useState(false);

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
          ? "Izin akses kamera ditolak. Silakan izinkan browser mengakses kamera atau gunakan opsi tempel link."
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
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-7 text-slate-800 space-y-5 animate-modal-pop">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
              <IconQrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B192C]">Scan QR Tagihan BorderPay</h3>
              <p className="text-xs text-slate-500">Pindai kamera atau tempel link invoice</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-press w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Camera Viewport (Matching Figma Image 3 Cyan Target Corners) */}
        <div className="relative aspect-video rounded-2xl overflow-hidden bg-[#071926] border border-cyan-900/40 flex items-center justify-center">
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
              <div className="w-12 h-12 rounded-2xl bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center mx-auto text-cyan-400">
                📷
              </div>
              <p className="text-xs text-slate-300 max-w-xs mx-auto">
                {cameraError || "Arahkan kamera ke QR invoice BorderPay"}
              </p>
              {!cameraActive && !cameraError && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="btn-press px-4 py-2 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  Aktifkan Kamera
                </button>
              )}
            </div>
          )}

          {/* Cyan Scanner Frame & Corner Brackets */}
          <div className="absolute inset-4 pointer-events-none flex flex-col justify-between">
            <div className="flex justify-between items-center text-[10px] text-cyan-400 font-mono">
              <span className="flex items-center gap-1.5 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800/50">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Kamera aktif</span>
              </span>
            </div>

            <div className="self-center w-40 h-40 border-2 border-dashed border-cyan-400/80 rounded-2xl relative shadow-[0_0_25px_rgba(6,182,212,0.3)] flex items-center justify-center">
              <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan" />
            </div>

            <div className="text-center text-[11px] text-cyan-200/80 font-medium">
              Arahkan kamera ke QR invoice BorderPay
            </div>
          </div>
        </div>

        {/* Manual Link Input (Matching Figma Image 3) */}
        <div className="space-y-2">
          <label className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider block">
            LINK INVOICE
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="https://... atau tempel link invoice"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition font-mono"
            />
            <button
              type="button"
              onClick={handlePasteClipboard}
              className="btn-press px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer flex items-center gap-1 flex-shrink-0"
            >
              <IconCopy className="w-3.5 h-3.5" />
              <span>Tempel Link</span>
            </button>
            <button
              type="button"
              onClick={() => processInvoiceLink(manualInput)}
              className="btn-press px-4 py-2 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white font-bold text-xs transition shadow-2xs cursor-pointer flex-shrink-0"
            >
              Buka Invoice
            </button>
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

        {/* Modal Buttons (Batal & Tutup) */}
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

        {/* Toggle State Previews (Matching Figma Image 3 below modal) */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowStatePreviews(!showStatePreviews)}
            className="text-[11px] text-slate-400 hover:text-blue-600 font-bold block transition"
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
