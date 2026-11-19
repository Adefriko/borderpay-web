"use client";
import { IconShieldCheck, IconClock } from "./Icons";
import { CONTRACT_ADDRESSES } from "../constants/contracts";

export default function StatsOverview({ totalTx = 0 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Stat 1 */}
      <div className="glass-card glass-card-interactive p-4 sm:p-5 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Total Transaksi On-Chain</span>
          <span className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center text-sm">
            ⚡
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-extrabold text-slate-900 tracking-tight">{totalTx}</p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Live Sepolia Event Listener
          </p>
        </div>
      </div>

      {/* Stat 2 */}
      <div className="glass-card glass-card-interactive p-4 sm:p-5 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Mata Uang Didukung</span>
          <span className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center text-sm">
            🌐
          </span>
        </div>
        <div className="mt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-extrabold text-slate-900">3</span>
            <span className="text-xs text-slate-500 font-medium">Currencies</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            mUSD (USD) • mEUR (EUR) • mJPY (JPY)
          </p>
        </div>
      </div>

      {/* Stat 3 */}
      <div className="glass-card glass-card-interactive p-4 sm:p-5 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Kecepatan Finalitas</span>
          <span className="w-8 h-8 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
            <IconClock className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-extrabold text-purple-700">~12 Detik</p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            1 Block Confirmation di Sepolia
          </p>
        </div>
      </div>

      {/* Stat 4 */}
      <div className="glass-card glass-card-interactive p-4 sm:p-5 rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500">Smart Contract V2</span>
          <span className="w-8 h-8 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex items-center justify-center">
            <IconShieldCheck className="w-4 h-4" />
          </span>
        </div>
        <div className="mt-3">
          <a
            href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.CoinSwapPayment}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-mono font-bold text-indigo-600 hover:text-indigo-800 hover:underline flex items-center gap-1"
          >
            {CONTRACT_ADDRESSES.CoinSwapPayment.slice(0, 6)}...
            {CONTRACT_ADDRESSES.CoinSwapPayment.slice(-4)} ↗
          </a>
          <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">
            Terverifikasi & Reentrancy-Safe
          </p>
        </div>
      </div>
    </div>
  );
}
