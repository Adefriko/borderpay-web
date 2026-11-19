"use client";
import { useState } from "react";
import { IconCheck, IconCopy, IconExternalLink, IconBorderPayLogo } from "./Icons";

export default function TransactionReceiptModal({ isOpen, onClose, tx }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen || !tx) return null;

  const copySummary = () => {
    const text = `BorderPay Receipt\nTx: ${tx.txHash}\nOrder: ${tx.orderId}\nSwap: ${tx.pair}\nAmount: ${tx.amountIn} -> ${tx.amountOut}\nReceiver: ${tx.receiver}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Receipt Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <IconBorderPayLogo className="w-8 h-8" />
            <div>
              <h3 className="text-base font-bold text-slate-900">Struk Pembayaran On-Chain</h3>
              <p className="text-[11px] text-slate-500">BorderPay Blockchain Receipt</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status Badge */}
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-1">
          <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
            <IconCheck className="w-5 h-5" />
          </div>
          <p className="text-sm font-bold text-emerald-900">Transaksi Berhasil Dikonfirmasi</p>
          <p className="text-xs text-emerald-700">Tercatat permanen di Ethereum Sepolia Testnet</p>
        </div>

        {/* Transaction Details */}
        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 space-y-3 text-xs">
          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Pasangan Swap:</span>
            <span className="font-bold text-slate-900">{tx.pair}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Input Terbayar:</span>
            <span className="font-mono font-bold text-slate-800">{tx.amountIn}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Output Diterima:</span>
            <span className="font-mono font-bold text-emerald-600">{tx.amountOut}</span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Pengirim (Payer):</span>
            <span className="font-mono text-slate-700">
              {tx.sender ? `${tx.sender.slice(0, 6)}...${tx.sender.slice(-4)}` : "-"}
            </span>
          </div>

          <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
            <span className="text-slate-500">Penerima (Receiver):</span>
            <span className="font-mono text-slate-700">
              {tx.receiver ? `${tx.receiver.slice(0, 6)}...${tx.receiver.slice(-4)}` : "-"}
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-slate-500 block">Order ID Hash:</span>
            <p className="font-mono text-[11px] text-slate-700 break-all bg-white p-2 rounded-lg border border-slate-200">
              {tx.orderId}
            </p>
          </div>

          <div className="space-y-1 pt-1">
            <span className="text-slate-500 block">Tx Hash (Sepolia):</span>
            <a
              href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[11px] text-indigo-600 hover:underline break-all bg-white p-2 rounded-lg border border-slate-200 block flex items-center justify-between"
            >
              <span className="truncate">{tx.txHash}</span>
              <IconExternalLink className="w-3 h-3 flex-shrink-0 ml-1" />
            </a>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2.5">
          <button
            onClick={copySummary}
            className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <IconCheck className="w-3.5 h-3.5 text-emerald-600" /> : <IconCopy className="w-3.5 h-3.5" />}
            <span>{copied ? "Tersalin!" : "Salin Ringkasan"}</span>
          </button>
          <a
            href={`https://sepolia.etherscan.io/tx/${tx.txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <span>Buka Etherscan</span>
            <IconExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
