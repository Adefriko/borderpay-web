"use client";
import { useState } from "react";
import { IconCheck, IconCopy, IconExternalLink, IconDownload } from "./Icons";

export default function TransactionReceiptModal({ isOpen, onClose, tx }) {
  const [copied, setCopied] = useState(false);
  const [copiedField, setCopiedField] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !tx) return null;

  const copyField = (val, id) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedField(id);
    setTimeout(() => setCopiedField(""), 1800);
  };

  const copySummary = () => {
    const text = `BorderPay Receipt\nTx Hash: ${tx.txHash}\nOrder ID: ${tx.orderId || "-"}\nSwap Pair: ${tx.pair}\nAmount: ${tx.amountIn} -> ${tx.amountOut}\nSender: ${tx.sender || "-"}\nReceiver: ${tx.receiver || "-"}\nNetwork: Ethereum Sepolia`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportReceiptPng = () => {
    setIsExporting(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 750;
      const ctx = canvas.getContext("2d");

      ctx.fillStyle = "#F3F7FC";
      ctx.fillRect(0, 0, 600, 750);

      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(30, 30, 540, 690, 24);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = "#0B192C";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("BorderPay Protocol", 60, 80);

      ctx.fillStyle = "#1951FC";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("OFFICIAL ON-CHAIN SETTLEMENT RECEIPT", 60, 105);

      ctx.fillStyle = "#ECFDF5";
      ctx.strokeStyle = "#A7F3D0";
      ctx.fillRect(60, 130, 480, 60);
      ctx.strokeRect(60, 130, 480, 60);

      ctx.fillStyle = "#059669";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("✓ PAYMENT CONFIRMED ON SEPOLIA", 80, 158);

      ctx.fillStyle = "#4B5563";
      ctx.font = "12px sans-serif";
      ctx.fillText(`Block #${tx.blockNumber || "Finalized"} • Multi-Currency Gateway`, 80, 176);

      const fields = [
        ["Pair Executed", tx.pair || "-"],
        ["Amount Paid (Input)", `${tx.amountIn || "-"} ${tx.tokenInSymbol || ""}`],
        ["Amount Settled (Output)", `${tx.amountOut || "-"} ${tx.tokenOutSymbol || ""}`],
        ["Sender (Payer)", tx.sender || "-"],
        ["Receiver (Merchant)", tx.receiver || "-"],
        ["Order ID Hash", tx.orderId ? `${tx.orderId.slice(0, 24)}...` : "-"],
        ["Transaction Hash", tx.txHash ? `${tx.txHash.slice(0, 24)}...` : "-"],
        ["Network", "Ethereum Sepolia Testnet"],
      ];

      let yPos = 230;
      fields.forEach(([label, value]) => {
        ctx.fillStyle = "#64748B";
        ctx.font = "13px sans-serif";
        ctx.fillText(label, 60, yPos);

        ctx.fillStyle = "#0B192C";
        ctx.font = "bold 13px monospace";
        ctx.fillText(value, 240, yPos);

        ctx.strokeStyle = "#E2E8F0";
        ctx.beginPath();
        ctx.moveTo(60, yPos + 12);
        ctx.lineTo(540, yPos + 12);
        ctx.stroke();

        yPos += 44;
      });

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.download = `BorderPay-Receipt-${(tx.txHash || "tx").slice(0, 8)}.png`;
      a.href = dataUrl;
      a.click();
    } catch (err) {
      console.error("Receipt export error:", err);
    } finally {
      setIsExporting(false);
    }
  };

  const shortAddr = (addr) => (addr ? `${addr.slice(0, 6)}..${addr.slice(-4)}` : "-");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#072a3a]/60 backdrop-blur-md animate-fadeIn">
      {/* Receipt Card with Teal Framing Accent (Matched to Figma Image 11) */}
      <div className="relative w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-slate-800 animate-modal-pop border border-white overflow-hidden">
        
        {/* Top Verified Halo */}
        <div className="text-center space-y-2 pt-1">
          <div className="w-12 h-12 rounded-full bg-emerald-50 border-4 border-emerald-100/70 text-emerald-600 flex items-center justify-center mx-auto">
            <IconCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold uppercase">
              ● DIKONFIRMASI
            </span>
          </div>
          <h3 className="text-xl font-extrabold text-[#0B192C] tracking-tight">
            Pembayaran Dikonfirmasi
          </h3>
          <p className="text-xs text-slate-500">Terverifikasi di Ethereum Sepolia Testnet</p>
        </div>

        {/* Comparison Swap Box */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-center">
          <div className="flex items-center justify-between gap-2">
            <div className="text-left">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 block">
                TOKEN DIKIRIM
              </span>
              <span className="text-base sm:text-lg font-extrabold text-[#0B192C] font-mono">
                {tx.amountIn || "-"}{" "}
                <span className="text-xs text-slate-500">{tx.tokenInSymbol || "-"}</span>
              </span>
            </div>

            <span className="text-slate-400 font-bold">→</span>

            <div className="text-right">
              <span className="text-[9px] font-extrabold uppercase text-slate-400 block">
                TOKEN DITERIMA
              </span>
              <span className="text-base sm:text-lg font-extrabold text-[#1951FC] font-mono">
                {tx.amountOut || "-"}{" "}
                <span className="text-xs text-blue-500">{tx.tokenOutSymbol || "-"}</span>
              </span>
            </div>
          </div>
          <p className="text-[10px] text-slate-400 pt-1 border-t border-slate-200/70 font-mono">
            Rate simulasi kontrak: {tx.pair || "-"}
          </p>
        </div>

        {/* Detail Key-Value Rows */}
        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Pengirim</span>
            <button
              type="button"
              onClick={() => copyField(tx.sender, "sender")}
              className="font-mono font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
            >
              <span>{shortAddr(tx.sender)}</span>
              {copiedField === "sender" ? <IconCheck className="w-3 h-3 text-emerald-500" /> : <IconCopy className="w-3 h-3 text-slate-400" />}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Penerima</span>
            <button
              type="button"
              onClick={() => copyField(tx.receiver, "receiver")}
              className="font-mono font-bold text-slate-700 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
            >
              <span>{shortAddr(tx.receiver)}</span>
              {copiedField === "receiver" ? <IconCheck className="w-3 h-3 text-emerald-500" /> : <IconCopy className="w-3 h-3 text-slate-400" />}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Order ID</span>
            <span className="font-mono font-bold text-slate-800">
              {tx.orderId ? `${tx.orderId.slice(0, 14)}...` : "-"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Hash transaksi</span>
            <button
              type="button"
              onClick={() => copyField(tx.txHash, "hash")}
              className="font-mono font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{shortAddr(tx.txHash)}</span>
              {copiedField === "hash" ? <IconCheck className="w-3 h-3 text-emerald-500" /> : <IconCopy className="w-3 h-3 text-slate-400" />}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Nomor blok</span>
            <span className="font-mono font-bold text-slate-800">
              {tx.blockNumber ? tx.blockNumber.toLocaleString() : "-"}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Jaringan</span>
            <span className="font-bold text-slate-800">Ethereum Sepolia Testnet</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400 font-medium">Waktu</span>
            <span className="font-semibold text-slate-800">{tx.time || "Baru saja"}</span>
          </div>
        </div>

        {/* Ticket Perforation Divider (Matched to Figma Image 11) */}
        <div className="relative py-1">
          <div className="border-t-2 border-dashed border-slate-200" />
          <span className="absolute -left-9 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#072a3a]/60" />
          <span className="absolute -right-9 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#072a3a]/60" />
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={copySummary}
              className="btn-press py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              {copied ? <IconCheck className="w-3.5 h-3.5 text-emerald-500" /> : <IconCopy className="w-3.5 h-3.5" />}
              <span>{copied ? "Tersalin!" : "Salin Ringkasan"}</span>
            </button>

            <a
              href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-press py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
            >
              <span>Lihat di Etherscan</span>
              <IconExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          </div>

          <button
            type="button"
            onClick={exportReceiptPng}
            disabled={isExporting}
            className="btn-press w-full py-3 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-extrabold flex items-center justify-center gap-1.5 transition shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <IconDownload className="w-3.5 h-3.5" />
            <span>{isExporting ? "Membuat PNG..." : "Unduh Struk"}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
