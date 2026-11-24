"use client";
import { useState } from "react";
import { IconExternalLink } from "./Icons";

export default function OnboardingGuideModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      tab: "Selamat Datang",
      title: "BorderPay Web3 QR",
      subtitle: "Protokol Pembayaran Lintas Mata Uang Berbasis Web3",
      bullets: [
        "Buat tagihan QR lintas valuta dengan verifikasi hash integritas.",
        "Token mUSD, mEUR, dan mJPY berjalan di jaringan uji coba Sepolia.",
        "Smart contract otomatis menghitung estimasi tukar secara transparan.",
      ],
      art: (
        <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-[#0e7490] via-[#1951FC] to-[#0b2cb1] flex items-center justify-center relative overflow-hidden p-4 shadow-md">
          <div className="w-24 h-24 rounded-2xl bg-white/15 backdrop-blur-md border border-white/40 flex items-center justify-center text-white font-mono text-xs font-bold shadow-lg">
            [ QR ORB ]
          </div>
        </div>
      ),
    },
    {
      tab: "Wallet & Sepolia",
      title: "Wallet & Sepolia",
      subtitle: "Siapkan identitas Web3 Anda untuk berinteraksi dengan smart contract BorderPay.",
      bullets: [
        "Hubungkan MetaMask atau wallet kompatibel lainnya.",
        "Pindah ke Ethereum Sepolia Testnet di pengaturan jaringan.",
        "Keamanan wallet: BorderPay tidak pernah meminta seed phrase atau private key Anda.",
      ],
      art: (
        <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-[#094c69] via-[#0e8db5] to-[#174691] flex items-center justify-center p-4 shadow-md">
          <div className="w-40 h-28 rounded-2xl bg-white/20 backdrop-blur-md border border-white/50 p-3 flex flex-col justify-between text-white shadow-xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-100">Ethereum Sepolia</span>
            <span className="font-mono text-xs font-bold">Ξ Testnet Ready</span>
          </div>
        </div>
      ),
    },
    {
      tab: "Faucet & Token",
      title: "Dapatkan Test ETH",
      subtitle: "Biaya eksekusi kontrak Sepolia menggunakan Test ETH gratis.",
      bullets: [
        "Klaim Sepolia ETH gratis dari faucet Google Cloud atau PoW Faucet.",
        "Tambahkan token mock mUSD, mEUR, atau mJPY ke MetaMask Anda.",
        "Gunakan tombol Saldo di navigasi atas untuk memantau aset testnet.",
      ],
      extraLink: {
        label: "Buka Faucet Sepolia",
        href: "https://cloud.google.com/application/web3/faucet/ethereum/sepolia",
      },
      art: (
        <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-[#083344] via-[#0369a1] to-[#1e40af] flex items-center justify-center p-4 shadow-md">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-200 border-4 border-white/60 flex items-center justify-center text-[#0B192C] font-extrabold text-xl shadow-lg">
            Ξ
          </div>
        </div>
      ),
    },
    {
      tab: "Buat & Bayar",
      title: "Proses Transaksi",
      subtitle: "Alur end-to-end dari pembuatan QR hingga verifikasi struk blockchain.",
      bullets: [
        "1. Buat QR Invoice dengan nominal dan batas kedaluwarsa.",
        "2. Scan & Setujui allowance token dari wallet pembayar.",
        "3. Cek struk transaksi permanen di On-Chain Ledger Sepolia.",
      ],
      art: (
        <div className="w-full h-44 rounded-2xl bg-gradient-to-br from-[#071926] via-[#0d466b] to-[#1951FC] flex items-center justify-center p-4 shadow-md">
          <div className="px-4 py-2.5 rounded-xl bg-white/15 backdrop-blur-md border border-white/30 text-white text-xs font-bold">
            ✓ Verified On-Chain Settlement
          </div>
        </div>
      ),
    },
  ];

  if (!isOpen) return null;

  const current = steps[currentStep];
  const progressPct = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-3xl bg-white/95 backdrop-blur-xl border border-white shadow-2xl p-6 sm:p-7 text-slate-800 space-y-5 animate-modal-pop max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-[#0B192C]">Panduan Pengguna & Faucet</h3>
          <button
            type="button"
            onClick={onClose}
            className="btn-press w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        {/* Linear Progress + Step Count (Matched to Figma Image 9) */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-[#1951FC] transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
            LANGKAH {currentStep + 1} DARI {steps.length}
          </span>
        </div>

        {/* Numbered Tab Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {steps.map((s, idx) => (
            <button
              key={s.tab}
              type="button"
              onClick={() => setCurrentStep(idx)}
              className={`px-2.5 py-2 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                currentStep === idx
                  ? "bg-[#1951FC] text-white shadow-xs"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-extrabold ${
                  currentStep === idx ? "bg-white/25 text-white" : "bg-white text-slate-600"
                }`}
              >
                {idx + 1}
              </span>
              <span className="truncate">{s.tab}</span>
            </button>
          ))}
        </div>

        {/* Academic Notice Banner */}
        <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 text-[11px] text-slate-700 leading-relaxed">
          🎓 Aplikasi ini adalah <strong>demo akademik</strong> di Ethereum Sepolia Testnet. Jangan pernah membagikan{" "}
          <span className="text-rose-600 font-bold">seed phrase</span> atau{" "}
          <span className="text-rose-600 font-bold">private key</span> kepada siapa pun.
        </div>

        {/* 2-Column Content (Matched to Figma Image 9) */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center py-1">
          <div className="md:col-span-7 space-y-3">
            <div>
              <h4 className="text-lg font-extrabold text-[#0B192C]">{current.title}</h4>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{current.subtitle}</p>
            </div>

            <div className="space-y-2">
              {current.bullets.map((b, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
                  <span className="w-4 h-4 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                    ✓
                  </span>
                  <span>{b}</span>
                </div>
              ))}
            </div>

            {current.extraLink && (
              <a
                href={current.extraLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-press inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-white text-xs font-bold shadow-xs transition"
              >
                <span>{current.extraLink.label}</span>
                <IconExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          <div className="md:col-span-5">{current.art}</div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-500 hover:text-slate-800 transition cursor-pointer font-bold"
          >
            Lewati
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="btn-press px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                ← Kembali
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="btn-press px-5 py-2 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-xs font-bold text-white transition shadow-xs cursor-pointer"
              >
                Lanjut →
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="btn-press px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-xs cursor-pointer"
              >
                Selesai ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
