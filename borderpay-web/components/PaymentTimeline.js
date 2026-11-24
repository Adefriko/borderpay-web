"use client";
import { IconCheck, IconRefresh, IconExternalLink } from "./Icons";

export default function PaymentTimeline({
  status,
  isApprovalRequired = false,
  isApproved = false,
  isTampered = false,
  isExpired = false,
  txHash = "",
  approvalTxHash = "",
}) {
  const steps = [
    {
      id: "verify",
      title: "Verifikasi Integritas",
      desc: isTampered
        ? "Checksum tidak cocok (Tampered!)"
        : isExpired
        ? "Tagihan sudah kedaluwarsa"
        : "Format & Checksum Terverifikasi",
      state: isTampered || isExpired ? "error" : "completed",
    },
    {
      id: "allowance",
      title: "1. Izin Pengeluaran Token",
      desc: !isApprovalRequired
        ? "Tidak diperlukan (Allowance Cukup)"
        : isApproved
        ? "Izin Disetujui di Blok Sepolia"
        : status === "APPROVING"
        ? "Menunggu Konfirmasi Transaksi Approve..."
        : "Persetujuan Allowance Diperlukan",
      state: !isApprovalRequired || isApproved ? "completed" : status === "APPROVING" ? "active" : "pending",
      hash: approvalTxHash,
    },
    {
      id: "execution",
      title: "2. Eksekusi Pembayaran / Swap",
      desc:
        status === "SUCCESS"
          ? "Pembayaran Terkonfirmasi di Blok Sepolia"
          : status === "SWAPPING"
          ? "Sedang Memproses Transaksi di Kontrak..."
          : "Menunggu Eksekusi Pembayaran",
      state: status === "SUCCESS" ? "completed" : status === "SWAPPING" ? "active" : "pending",
      hash: txHash,
    },
    {
      id: "receipt",
      title: "3. Penerbitan Struk On-Chain",
      desc: status === "SUCCESS" ? "Struk Tersedia & Dapat Diunduh" : "Menunggu Finalisasi Transaksi",
      state: status === "SUCCESS" ? "completed" : "pending",
    },
  ];

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse" />
          <h3 className="text-xs font-bold text-[#0B192C] uppercase tracking-wider">
            Status Timeline Pembayaran
          </h3>
        </div>
        <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
          Sepolia Engine
        </span>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => {
          const isDone = step.state === "completed";
          const isActive = step.state === "active";
          const isErr = step.state === "error";

          return (
            <div key={step.id} className="flex items-start gap-3 relative">
              {idx < steps.length - 1 && (
                <div
                  className={`absolute left-3.5 top-7 bottom-0 w-0.5 ${
                    isDone ? "bg-emerald-400" : "bg-slate-200"
                  }`}
                  style={{ height: "calc(100% - 10px)" }}
                />
              )}

              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 z-10 text-xs font-bold transition-all ${
                  isDone
                    ? "bg-emerald-50 border border-emerald-400 text-emerald-600"
                    : isErr
                    ? "bg-rose-50 border border-rose-400 text-rose-600"
                    : isActive
                    ? "bg-blue-600 border border-blue-500 text-white shadow-xs animate-pulse"
                    : "bg-white border border-slate-200 text-slate-400"
                }`}
              >
                {isDone ? (
                  <IconCheck className="w-4 h-4 text-emerald-600" />
                ) : isErr ? (
                  "✕"
                ) : isActive ? (
                  <IconRefresh className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h4
                    className={`text-xs font-semibold ${
                      isDone
                        ? "text-emerald-700"
                        : isErr
                        ? "text-rose-700 font-bold"
                        : isActive
                        ? "text-blue-700 font-bold"
                        : "text-slate-700"
                    }`}
                  >
                    {step.title}
                  </h4>
                  {step.hash && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${step.hash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-mono text-blue-600 hover:text-blue-800 flex items-center gap-1 transition"
                    >
                      <span>{step.hash.slice(0, 6)}...{step.hash.slice(-4)}</span>
                      <IconExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
