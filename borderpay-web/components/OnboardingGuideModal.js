"use client";
import { useState } from "react";
import { IconExternalLink } from "./Icons";

export default function OnboardingGuideModal({ isOpen, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: "Selamat Datang di BorderPay",
      subtitle: "Protokol Pembayaran Lintas Mata Uang Berbasis Web3",
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-600">
          <p>
            BorderPay adalah prototipe pembayaran lintas negara terdesentralisasi yang memungkinkan
            merchant membuat tagihan QR dan menerima koin stabil simulasi (mUSD, mEUR, mJPY).
          </p>
          <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
            <span className="font-bold text-blue-950 block mb-1">🎓 Demonstrasi Akademik</span>
            Aplikasi ini berjalan di jaringan uji coba <strong>Ethereum Sepolia Testnet</strong>. Seluruh token
            bersifat mock (simulasi) dan <strong>TIDAK memiliki nilai ekonomi riil</strong>.
          </div>
        </div>
      ),
    },
    {
      title: "1. Dompet Web3 (MetaMask)",
      subtitle: "Identitas dan Pengendali Aset Non-Custodial",
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-600">
          <p>
            Untuk bertransaksi, Anda memerlukan dompet Web3 seperti <strong>MetaMask</strong> atau Rabby di browser Anda.
            Dompet ini menyimpan kunci pribadi Anda secara aman di perangkat lokal.
          </p>
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900">
            <span className="font-bold text-amber-950 block mb-0.5">🔒 Aturan Keamanan Mutlak:</span>
            BorderPay <strong>tidak pernah</strong> meminta Secret Recovery Phrase atau Private Key Anda.
            Jangan pernah membagikan frasa sandi Anda kepada siapa pun di internet!
          </div>
        </div>
      ),
    },
    {
      title: "2. Jaringan Sepolia & Gas Fee",
      subtitle: "Mengapa Butuh Test ETH?",
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-600">
          <p>
            Setiap interaksi smart contract (seperti <em>approve</em> dan <em>payOrSwap</em>) memerlukan biaya eksekusi
            jaringan yang disebut <strong>Gas Fee</strong>, dibayar menggunakan <strong>Sepolia ETH</strong> gratis.
          </p>
          <div className="space-y-2">
            <span className="font-semibold text-slate-800 block">Kran Gas (Faucet Resmi Gratis):</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-medium">
              <a
                href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-blue-600"
              >
                <span>Google Cloud Faucet</span>
                <IconExternalLink className="w-3 h-3" />
              </a>
              <a
                href="https://sepolia-faucet.pk910.de/"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 flex items-center justify-between text-blue-600"
              >
                <span>Sepolia PoW Faucet</span>
                <IconExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "3. Minting Koin Simulasi",
      subtitle: "Dapatkan mUSD, mEUR, dan mJPY",
      content: (
        <div className="space-y-3 text-xs leading-relaxed text-slate-600">
          <p>
            Setelah memiliki Sepolia ETH untuk gas, Anda dapat mengisi saldo koin simulasi pengujian dengan mengklik tombol
            <strong> Saldo 💳</strong> di pojok kanan atas aplikasi.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-700">
            <li><strong>mUSD:</strong> Mock US Dollar (1:1 simulasi)</li>
            <li><strong>mEUR:</strong> Mock Euro (Kurs smart contract)</li>
            <li><strong>mJPY:</strong> Mock Japanese Yen (Kurs smart contract)</li>
          </ul>
          <p className="text-[11px] italic text-blue-700">
            Smart contract BorderPay akan otomatis menukar valuta pengirim menjadi valuta yang diminta merchant secara real-time.
          </p>
        </div>
      ),
    },
  ];

  if (!isOpen) return null;

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 sm:p-7 text-slate-800 space-y-6 animate-modal-pop">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧭</span>
            <div>
              <h3 className="text-sm font-bold text-[#0B192C]">Panduan Pengguna & Faucet</h3>
              <p className="text-[11px] text-slate-500">Langkah {currentStep + 1} dari {steps.length}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-press w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer text-xs"
          >
            ✕
          </button>
        </div>

        <div className="space-y-3 min-h-[180px]">
          <div>
            <h4 className="text-base font-bold text-[#0B192C]">{current.title}</h4>
            <p className="text-xs text-blue-600 font-medium">{current.subtitle}</p>
          </div>
          {current.content}
        </div>

        <div className="flex items-center justify-center gap-1.5 pt-2">
          {steps.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentStep(idx)}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                currentStep === idx ? "w-6 bg-blue-600" : "w-1.5 bg-slate-200 hover:bg-slate-300"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-700 transition cursor-pointer font-medium"
          >
            Lewati Panduan
          </button>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
              >
                Kembali
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep((prev) => prev + 1)}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition shadow-2xs cursor-pointer"
              >
                Selanjutnya
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition shadow-2xs cursor-pointer"
              >
                Mulai Gunakan BorderPay ✓
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
