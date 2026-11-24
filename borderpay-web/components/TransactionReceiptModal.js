"use client";
import { useState } from "react";
import { IconCheck, IconCopy, IconExternalLink, IconBorderPayLogo, IconDownload } from "./Icons";

export default function TransactionReceiptModal({ isOpen, onClose, tx }) {
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen || !tx) return null;

  const copySummary = () => {
    const text = `BorderPay Receipt\nTx Hash: ${tx.txHash}\nOrder ID: ${tx.orderId}\nSwap Pair: ${tx.pair}\nAmount: ${tx.amountIn} -> ${tx.amountOut}\nSender: ${tx.sender}\nReceiver: ${tx.receiver}\nNetwork: Ethereum Sepolia`;
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

      // Background
      ctx.fillStyle = "#F3F7FC";
      ctx.fillRect(0, 0, 600, 750);

      // Card body
      ctx.fillStyle = "#FFFFFF";
      ctx.strokeStyle = "#CBD5E1";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(30, 30, 540, 690, 24);
      ctx.fill();
      ctx.stroke();

      // Brand
      ctx.fillStyle = "#0B192C";
      ctx.font = "bold 24px sans-serif";
      ctx.fillText("BorderPay Protocol", 60, 80);

      ctx.fillStyle = "#1951FC";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText("OFFICIAL ON-CHAIN SETTLEMENT RECEIPT", 60, 105);

      // Verified Box
      ctx.fillStyle = "#ECFDF5";
      ctx.strokeStyle = "#A7F3D0";
      ctx.fillRect(60, 130, 480, 60);
      ctx.strokeRect(60, 130, 480, 60);

      ctx.fillStyle = "#059669";
      ctx.font = "bold 15px sans-serif";
      ctx.fillText("✓ PAYMENT CONFIRMED ON SEPOLIA", 80, 158);

      ctx.fillStyle = "#4B5563";
      ctx.font = "12px sans-serif";
      ctx.fillText(`Block #${tx.blockNumber || "Finalized"} • Non-Custodial Multi-Currency Gateway`, 80, 176);

      // Data Table
      const fields = [
        ["Pair Executed", tx.pair || "-"],
        ["Amount Paid (Input)", `${tx.amountIn} ${tx.tokenInSymbol || ""}`],
        ["Amount Settled (Output)", `${tx.amountOut} ${tx.tokenOutSymbol || ""}`],
        ["Sender (Payer)", tx.sender || "-"],
        ["Receiver (Merchant)", tx.receiver || "-"],
        ["Order ID Hash", tx.orderId ? `${tx.orderId.slice(0, 24)}...` : "-"],
        ["Transaction Hash", tx.txHash ? `${tx.txHash.slice(0, 24)}...` : "-"],
        ["Network", "Ethereum Sepolia Testnet (0xaa36a7)"],
        ["Protocol Fee", "0.00% (Academic Demonstration)"],
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

        yPos += 42;
      });

      // Footer
      ctx.fillStyle = "#94A3B8";
      ctx.font = "italic 11px sans-serif";
      ctx.fillText("Academic Web3 Proof-of-Concept • Kelompok 8 Blockchain TI-B", 60, 675);
      ctx.fillText("Mock ERC-20 Tokens possess zero real economic value", 60, 695);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-slate-800 animate-modal-pop">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <IconBorderPayLogo className="w-8 h-8 text-blue-600" />
            <div>
              <h3 className="text-base font-bold text-[#0B192C]">Struk Pembayaran On-Chain</h3>
              <p className="text-[11px] text-slate-500">BorderPay Blockchain Receipt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-press w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
          <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-300">
            <IconCheck className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-emerald-800">Transaksi Berhasil Dikonfirmasi</p>
          <p className="text-xs text-emerald-600">
            Tercatat permanen di Ethereum Sepolia Testnet {tx.blockNumber ? `(Blok #${tx.blockNumber})` : ""}
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Pasangan Swap:</span>
            <span className="font-bold text-blue-700 px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200">
              {tx.pair}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Input Terbayar:</span>
            <span className="font-mono font-bold text-[#0B192C]">
              {tx.amountIn} {tx.tokenInSymbol || ""}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Output Diterima:</span>
            <span className="font-mono font-bold text-emerald-600">
              {tx.amountOut} {tx.tokenOutSymbol || ""}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Pengirim (Payer):</span>
            <span className="font-mono text-slate-800">
              {tx.sender ? `${tx.sender.slice(0, 6)}...${tx.sender.slice(-4)}` : "-"}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Penerima (Receiver):</span>
            <span className="font-mono text-slate-800">
              {tx.receiver ? `${tx.receiver.slice(0, 6)}...${tx.receiver.slice(-4)}` : "-"}
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-slate-500 block text-[11px]">Order ID Hash:</span>
            <p className="font-mono text-[11px] text-slate-700 break-all bg-white p-2.5 rounded-xl border border-slate-200">
              {tx.orderId}
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-slate-500 block text-[11px]">Tx Hash (Sepolia):</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-blue-600 hover:text-blue-800 break-all bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between"
            >
              <span className="truncate">{tx.txHash}</span>
              <IconExternalLink className="w-3 h-3 flex-shrink-0 ml-1" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={copySummary}
            className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copied ? (
              <IconCheck className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <IconCopy className="w-3.5 h-3.5" />
            )}
            <span>{copied ? "Tersalin!" : "Salin Teks"}</span>
          </button>

          <button
            onClick={exportReceiptPng}
            disabled={isExporting}
            className="py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
          >
            <IconDownload className="w-3.5 h-3.5" />
            <span>{isExporting ? "Membuat PNG..." : "Unduh Struk PNG"}</span>
          </button>

          <a
            href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-sm text-center"
          >
            <span>Etherscan</span>
            <IconExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
