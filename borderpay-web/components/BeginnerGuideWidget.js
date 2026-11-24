"use client";
import {
  IconRocket,
  IconWallet,
  IconQrCode,
  IconSwap,
  IconShieldCheck,
} from "./Icons";

export default function BeginnerGuideWidget({ onOpenGuide }) {
  const steps = [
    {
      num: 1,
      title: "Hubungkan Wallet",
      desc: "MetaMask di jaringan Sepolia.",
      icon: IconWallet,
    },
    {
      num: 2,
      title: "Buat atau Pindai QR",
      desc: "Buat atau pindai tagihan pembayaran.",
      icon: IconQrCode,
    },
    {
      num: 3,
      title: "Lakukan Pembayaran",
      desc: "Pilih token & konfirmasi di wallet.",
      icon: IconSwap,
    },
    {
      num: 4,
      title: "Lihat di On-Chain",
      desc: "Pantau di Ledger & Etherscan.",
      icon: IconShieldCheck,
    },
  ];

  return (
    <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <IconRocket className="w-4 h-4 text-blue-600" />
          <h3 className="font-extrabold text-sm text-[#0B192C]">Panduan Pemula</h3>
        </div>
        <p className="text-[11px] text-slate-500 leading-snug">
          Langkah ringkas transaksi Web3.
        </p>
      </div>

      {/* Stepper Timeline */}
      <div className="space-y-1 relative">
        {steps.map((s, index) => {
          const isLast = index === steps.length - 1;

          return (
            <div
              key={s.num}
              onClick={onOpenGuide}
              className="relative flex items-start gap-3 p-2 rounded-xl hover:bg-blue-50/60 active:scale-[0.98] transition-all cursor-pointer group"
              title="Klik untuk membuka panduan langkah ini"
            >
              {/* Left Number & Dotted Line */}
              <div className="flex flex-col items-center flex-shrink-0">
                <span className="w-6 h-6 rounded-full bg-blue-50 group-hover:bg-blue-600 group-hover:text-white border border-blue-200 text-blue-600 text-xs font-extrabold flex items-center justify-center transition-colors shadow-2xs">
                  {s.num}
                </span>
                {!isLast && (
                  <div className="w-0.5 h-7 border-l-2 border-dotted border-blue-200 my-0.5" />
                )}
              </div>

              {/* Step Info */}
              <div className="pt-0.5 min-w-0">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-xs font-bold text-[#0B192C] group-hover:text-blue-600 transition-colors">
                    {s.title}
                  </h4>
                </div>
                <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                  {s.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Link */}
      <div className="pt-2 border-t border-slate-100">
        <button
          type="button"
          onClick={onOpenGuide}
          className="btn-press w-full py-2 px-3 rounded-xl bg-slate-50 hover:bg-blue-50/80 text-blue-600 hover:text-blue-700 text-xs font-bold transition flex items-center justify-between cursor-pointer active:scale-[0.98]"
        >
          <span className="flex items-center gap-2">
            <span>📖</span>
            <span>Pelajari Lebih Lanjut</span>
          </span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </button>
      </div>
    </div>
  );
}
