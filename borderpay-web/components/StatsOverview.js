"use client";
import { CONTRACT_ADDRESSES } from "../constants/contracts";
import { IconExternalLink } from "./Icons";

export default function StatsOverview({ totalTx = 0 }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-white border border-slate-200/80 text-xs shadow-xs">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-slate-500 font-medium">Total Transaksi:</span>
        <span className="font-mono font-extrabold text-[#0B192C]">{totalTx} Tx</span>
      </div>

      <div className="hidden sm:block h-3.5 w-px bg-slate-200" />

      <div className="flex items-center gap-2">
        <span className="text-slate-500 font-medium">Valuta Simulasi:</span>
        <span className="font-bold text-slate-800">mUSD • mEUR • mJPY</span>
      </div>

      <div className="hidden sm:block h-3.5 w-px bg-slate-200" />

      <div className="flex items-center gap-2">
        <span className="text-slate-500 font-medium">Smart Contract Gateway:</span>
        <a
          href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.CoinSwapPayment}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 transition"
        >
          <span>{CONTRACT_ADDRESSES.CoinSwapPayment.slice(0, 6)}...{CONTRACT_ADDRESSES.CoinSwapPayment.slice(-4)}</span>
          <IconExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}
