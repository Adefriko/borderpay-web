"use client";
import { useState } from "react";
import Image from "next/image";
import {
  TokenIcon,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconQrCode,
  IconScan,
  IconWallet,
  IconSwap,
  IconLedger,
} from "./Icons";
import { TOKENS } from "../constants/contracts";
import { useToast } from "./ToastContext";

export default function OverviewView({
  walletAddress = "",
  tokenBalances = { mUSD: "10,000.00", mEUR: "10,000.00", mJPY: "1,000,000" },
  ethBalance = "0.482",
  history = [],
  onSelectTab,
  onOpenScanner,
  onOpenAssetModal,
  onOpenGuide,
  onOpenReceipt,
}) {
  const toast = useToast();
  const [copiedHeroWallet, setCopiedHeroWallet] = useState(false);
  const [activeChartFilter, setActiveChartFilter] = useState("7d"); // "7d" | "30d" | "all"
  const [swapInAmount, setSwapInAmount] = useState("1,000.00");
  const [swapOutAmount, setSwapOutAmount] = useState("920.00");

  const displayAddr = walletAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d89A3F";
  const shortAddr = `${displayAddr.slice(0, 6)}...${displayAddr.slice(-4)}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(displayAddr);
    setCopiedHeroWallet(true);
    toast.info("Alamat Tersalin", displayAddr);
    setTimeout(() => setCopiedHeroWallet(false), 2000);
  };

  return (
    <div className="space-y-6 text-[#0B192C]">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
            Overview Panel
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Kelola invoice QR, token simulasi, dan aktivitas blockchain dalam satu antarmuka terpadu.
          </p>
        </div>
        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
          TERAKHIR DIPERBARUI 14:32 WIB
        </span>
      </div>

      {/* 2. Top Hero Section (3-Column Grid matching Figma Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column: Wallet Status Card (4 or 5 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            {/* Top row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  WALLET TERHUBUNG
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-extrabold border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>ACTIVE</span>
              </span>
            </div>

            {/* Address with copy */}
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-base text-[#0B192C]">
                {shortAddr}
              </span>
              <button
                type="button"
                onClick={copyAddress}
                className="text-slate-400 hover:text-blue-600 transition cursor-pointer"
                title="Salin Alamat"
              >
                {copiedHeroWallet ? (
                  <IconCheck className="w-4 h-4 text-emerald-600" />
                ) : (
                  <IconCopy className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Saldo Test ETH */}
            <div className="pt-2">
              <span className="text-[11px] text-slate-400 font-medium block">Saldo Test ETH</span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
                {ethBalance} <span className="text-sm font-bold text-slate-400">ETH</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                *Test ETH is gas only. Mock tokens in simulation values.
              </p>
            </div>
          </div>

          {/* 3 Action Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => onSelectTab("terminal")}
              className="btn-press py-2 px-2 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 text-xs font-bold transition text-center cursor-pointer"
            >
              Buat QR
            </button>
            <button
              type="button"
              onClick={onOpenScanner}
              className="btn-press py-2 px-2 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 text-xs font-bold transition text-center cursor-pointer"
            >
              Scan & Bayar
            </button>
            <button
              type="button"
              onClick={onOpenAssetModal}
              className="btn-press py-2 px-2 rounded-xl bg-blue-50/70 hover:bg-blue-100/70 text-blue-700 text-xs font-bold transition text-center cursor-pointer"
            >
              Saldo Token
            </button>
          </div>
        </div>

        {/* Center Column: 3D Glossy Torus Ring with Floating Badges (4 Cols) */}
        <div className="lg:col-span-4 rounded-3xl bg-white/70 backdrop-blur-md border border-slate-200/90 shadow-sm relative overflow-hidden flex items-center justify-center min-h-[220px]">
          {/* Subtle background glow */}
          <div className="absolute inset-0 bg-radial from-blue-400/15 via-transparent to-transparent pointer-events-none" />

          {/* 3D Ring Graphic */}
          <div className="relative w-44 h-44 flex items-center justify-center animate-float">
            <img
              src="/hero-3d-ring.png"
              alt="3D Fluid Torus"
              className="w-full h-full object-contain drop-shadow-xl select-none"
              onError={(e) => {
                // Fallback SVG ring if image doesn't load
                e.target.style.display = "none";
              }}
            />

            {/* Floating Token Badges matching Figma Image 2 */}
            {/* Top Right: mUSD */}
            <div className="absolute -top-1 -right-2 px-2.5 py-1 rounded-full bg-[#1951FC] text-white text-[11px] font-extrabold shadow-md flex items-center gap-1">
              <span>mUSD</span>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">$</span>
            </div>

            {/* Bottom Center/Left: mJPY */}
            <div className="absolute bottom-6 left-1 px-2.5 py-1 rounded-full bg-teal-500 text-white text-[11px] font-extrabold shadow-md flex items-center gap-1">
              <span>mJPY</span>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">¥</span>
            </div>

            {/* Bottom Left: mEUR */}
            <div className="absolute -bottom-1 left-4 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[11px] font-extrabold shadow-md flex items-center gap-1">
              <span>mEUR</span>
              <span className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-[10px]">€</span>
            </div>
          </div>
        </div>

        {/* Right Column: Aktivitas Terbaru Card (4 Cols) */}
        <div className="lg:col-span-4 p-6 rounded-3xl bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Aktivitas Terbaru</h3>
              <button
                type="button"
                onClick={() => onSelectTab("ledger")}
                className="text-slate-400 hover:text-blue-600 transition"
              >
                →
              </button>
            </div>

            <div className="space-y-2">
              {/* Item 1: Confirmed */}
              <div
                onClick={() => onSelectTab("ledger")}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[11px] font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block leading-tight">
                      CONFIRMED
                    </span>
                    <span className="font-mono text-xs text-slate-700">0x8a23...e11c</span>
                  </div>
                </div>
                <span className="text-slate-400 text-xs">›</span>
              </div>

              {/* Item 2: Pending */}
              <div
                onClick={() => onSelectTab("ledger")}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-[11px] font-bold">
                    ⏱
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-amber-600 block leading-tight">
                      PENDING
                    </span>
                    <span className="font-mono text-xs text-slate-700">0xf441...88a9</span>
                  </div>
                </div>
                <span className="text-slate-400 text-xs">›</span>
              </div>

              {/* Item 3: Expired */}
              <div
                onClick={() => onSelectTab("ledger")}
                className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/70 flex items-center justify-between cursor-pointer transition"
              >
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-[11px] font-bold">
                    ✕
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-rose-600 block leading-tight">
                      EXPIRED
                    </span>
                    <span className="font-mono text-xs text-slate-700">0x33b1...d22e</span>
                  </div>
                </div>
                <span className="text-slate-400 text-xs">›</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab("ledger")}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 text-center block w-full transition"
          >
            Lihat detail transaksi
          </button>
        </div>
      </div>

      {/* 3. Middle Row (3 Equal Cards matching Figma Image 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Saldo Token Mock */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Saldo Token Mock</h3>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-extrabold uppercase">
                EXISTING
              </span>
            </div>

            <div className="space-y-3">
              {/* mUSD */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1951FC] text-white flex items-center justify-center font-extrabold text-xs">
                    mU
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-[#0B192C] block">
                      {tokenBalances.mUSD || "10,000.00"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block">mUSD</span>
                  </div>
                </div>
              </div>

              {/* mEUR */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xs">
                    mE
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-[#0B192C] block">
                      {tokenBalances.mEUR || "10,000.00"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block">mEUR</span>
                  </div>
                </div>
              </div>

              {/* mJPY */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50/80 border border-slate-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-extrabold text-xs">
                    mJ
                  </div>
                  <div>
                    <span className="font-extrabold text-sm text-[#0B192C] block">
                      {tokenBalances.mJPY || "1,000,000"}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold block">mJPY</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-tight">
            Contoh saldo mock-token untuk simulasi, bukan nilai finansial riil.
          </p>
        </div>

        {/* Card 2: Aktivitas On-Chain */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-[#0B192C]">Aktivitas On-Chain</h3>
                <span className="text-[10px] text-slate-400">Berdasarkan event blockchain</span>
              </div>

              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setActiveChartFilter("7d")}
                  className={`px-2 py-0.5 rounded-md transition ${
                    activeChartFilter === "7d" ? "bg-white text-[#0B192C] shadow-2xs" : "text-slate-500"
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartFilter("30d")}
                  className={`px-2 py-0.5 rounded-md transition ${
                    activeChartFilter === "30d" ? "bg-white text-[#0B192C] shadow-2xs" : "text-slate-500"
                  }`}
                >
                  30 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartFilter("all")}
                  className={`px-2 py-0.5 rounded-md transition ${
                    activeChartFilter === "all" ? "bg-white text-[#0B192C] shadow-2xs" : "text-slate-500"
                  }`}
                >
                  Semua
                </button>
              </div>
            </div>

            {/* Total Transaksi */}
            <div className="pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Total Transaksi
              </span>
              <div className="text-3xl font-extrabold text-[#0B192C] tracking-tight">128</div>
              {/* Dual-color bar (cyan & royal blue) */}
              <div className="w-full h-2 rounded-full bg-slate-100 mt-2 flex overflow-hidden">
                <div className="w-2/3 h-full bg-[#1951FC]" />
                <div className="w-1/3 h-full bg-cyan-400" />
              </div>
            </div>

            {/* Interactive SVG Sparkline Chart */}
            <div className="pt-2">
              <svg className="w-full h-24 overflow-visible" viewBox="0 0 280 80">
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="80" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1951FC" stopOpacity="0.25" />
                    <stop offset="1" stopColor="#1951FC" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal guide lines */}
                <line x1="0" y1="20" x2="280" y2="20" stroke="#f1f5f9" strokeWidth="1" />
                <line x1="0" y1="50" x2="280" y2="50" stroke="#f1f5f9" strokeWidth="1" />
                <text x="0" y="18" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">20</text>
                <text x="0" y="48" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">10</text>
                
                {/* Area under curve */}
                <path
                  d="M20 60 Q 55 42, 90 52 T 160 35 T 225 58 T 270 25 L 270 75 L 20 75 Z"
                  fill="url(#chart-grad)"
                />
                {/* Main line */}
                <path
                  d="M20 60 Q 55 42, 90 52 T 160 35 T 225 58 T 270 25"
                  fill="none"
                  stroke="#1951FC"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                {/* Data points */}
                <circle cx="20" cy="60" r="3.5" fill="#1951FC" stroke="white" strokeWidth="1.5" />
                <circle cx="90" cy="52" r="3.5" fill="#1951FC" stroke="white" strokeWidth="1.5" />
                <circle cx="160" cy="35" r="3.5" fill="#1951FC" stroke="white" strokeWidth="1.5" />
                <circle cx="225" cy="58" r="3.5" fill="#1951FC" stroke="white" strokeWidth="1.5" />
                <circle cx="270" cy="25" r="3.5" fill="#1951FC" stroke="white" strokeWidth="1.5" />
              </svg>

              <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mt-1 px-1">
                <span>Mon</span>
                <span>Tue</span>
                <span>Wed</span>
                <span>Thu</span>
                <span>Fri</span>
                <span>Sat</span>
                <span>Sun</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Ringkasan Invoice */}
        <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Ringkasan Invoice</h3>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase">
                PROPOSED
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-xs font-semibold text-slate-600">Aktif</span>
                <span className="text-base font-extrabold text-[#0B192C]">4</span>
              </div>
              <div className="flex items-center justify-between py-1 border-b border-slate-50">
                <span className="text-xs font-semibold text-slate-600">Kedaluwarsa</span>
                <span className="text-base font-extrabold text-[#0B192C]">2</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-xs font-semibold text-slate-600">Cocok</span>
                <span className="text-base font-extrabold text-[#0B192C]">7</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab("terminal")}
            className="btn-press w-full py-2.5 rounded-2xl border-2 border-blue-600 text-blue-600 hover:bg-blue-50 font-extrabold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <span>+ Invoice Baru</span>
          </button>
        </div>
      </div>

      {/* 4. Lower Row (Kalkulator Swap + Transaksi On-Chain Terbaru) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left: Kalkulator Swap (4.5 or 5 Cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-[#0B192C]">Kalkulator Swap</h3>

            {/* Input BAYAR */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">BAYAR</span>
                <input
                  type="text"
                  value={swapInAmount}
                  onChange={(e) => setSwapInAmount(e.target.value)}
                  className="font-extrabold text-lg text-[#0B192C] bg-transparent focus:outline-none w-32"
                />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-800">
                <TokenIcon symbol="mUSD" size="w-4 h-4" />
                <span>mUSD</span>
              </div>
            </div>

            {/* Middle Switch Icon */}
            <div className="flex justify-center -my-2">
              <button
                type="button"
                onClick={() => {
                  const t = swapInAmount;
                  setSwapInAmount(swapOutAmount);
                  setSwapOutAmount(t);
                }}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-blue-50 text-blue-600 flex items-center justify-center border border-slate-200 shadow-2xs transition cursor-pointer"
              >
                ⇄
              </button>
            </div>

            {/* Input TERIMA */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">TERIMA</span>
                <input
                  type="text"
                  value={swapOutAmount}
                  readOnly
                  className="font-extrabold text-lg text-[#0B192C] bg-transparent focus:outline-none w-32"
                />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-800">
                <TokenIcon symbol="mEUR" size="w-4 h-4" />
                <span>mEUR</span>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 leading-tight">
              <span className="font-bold text-slate-600 block">Kurs Mock On-chain: 1 mUSD = 0.92 mEUR</span>
              <span>Simulasi kontrak, bukan kurs pasar.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab("rates")}
            className="btn-press w-full py-2.5 rounded-2xl bg-[#1951FC] hover:bg-blue-600 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
          >
            Hitung Quote
          </button>
        </div>

        {/* Right: Transaksi On-Chain Terbaru (7 Cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-[#0B192C]">Transaksi On-Chain Terbaru</h3>
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 text-[10px] font-extrabold uppercase">
              EXISTING
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">PAIR / ASET</th>
                  <th className="py-2.5 px-3">INPUT → OUTPUT</th>
                  <th className="py-2.5 px-3">TYPE</th>
                  <th className="py-2.5 px-3">STATUS</th>
                  <th className="py-2.5 px-3 text-right">HASH</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {[
                  {
                    pair: "mUSD/mEUR",
                    icons: ["mUSD", "mEUR"],
                    io: "100.00 → 92.00",
                    type: "Swap",
                    status: "CONFIRMED",
                    hash: "0x8a23...e11c",
                    fullHash: "0x8a23e11c91d84b2c4091e8473820a4b7e8d91c2a",
                  },
                  {
                    pair: "mUSD",
                    icons: ["mUSD"],
                    io: "250.00",
                    type: "Transfer",
                    status: "CONFIRMED",
                    hash: "0xf441...88a9",
                    fullHash: "0xf44188a991d84b2c4091e8473820a4b7e8d91c2a",
                  },
                  {
                    pair: "mJPY/mUSD",
                    icons: ["mJPY", "mUSD"],
                    io: "15,000 → 98.10",
                    type: "Swap",
                    status: "PENDING",
                    hash: "0x33b1...d22e",
                    fullHash: "0x33b1d22e91d84b2c4091e8473820a4b7e8d91c2a",
                  },
                  {
                    pair: "mEUR",
                    icons: ["mEUR"],
                    io: "40.00",
                    type: "Transfer",
                    status: "FAILED",
                    hash: "0xbc72...11f4",
                    fullHash: "0xbc7211f491d84b2c4091e8473820a4b7e8d91c2a",
                  },
                ].map((row, idx) => (
                  <tr
                    key={idx}
                    onClick={() => onOpenReceipt && onOpenReceipt({ txHash: row.fullHash, pair: row.pair })}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <div className="flex items-center -space-x-1">
                          {row.icons.map((sym, i) => (
                            <TokenIcon key={i} symbol={sym} size="w-4 h-4" />
                          ))}
                        </div>
                        <span>{row.pair}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold text-[#0B192C]">
                      {row.io}
                    </td>

                    <td className="py-3 px-3 text-slate-600 font-medium">
                      {row.type}
                    </td>

                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                          row.status === "CONFIRMED"
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : row.status === "PENDING"
                            ? "bg-amber-50 text-amber-600 border border-amber-200"
                            : "bg-rose-50 text-rose-600 border border-rose-200"
                        }`}
                      >
                        {row.status}
                      </span>
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-blue-600 font-semibold">
                      <span>{row.hash}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Full-Width Bottom Row: Panduan Mulai (5-Step Stepper) */}
      <div className="p-6 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-[#0B192C]">Panduan Mulai</h3>
            <span className="text-[11px] text-slate-400">Lengkapi langkah-langkah untuk simulasi penuh</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase">
            PROPOSED
          </span>
        </div>

        {/* 5 Horizontal Step Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Step 1: Connect Wallet (Done) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-emerald-800">1</span>
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                ✓
              </span>
            </div>
            <span className="font-bold text-xs text-emerald-900">Connect Wallet</span>
          </div>

          {/* Step 2: Create or Scan QR (Done) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex flex-col justify-between h-24">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-emerald-800">2</span>
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                ✓
              </span>
            </div>
            <span className="font-bold text-xs text-emerald-900">Create or Scan QR</span>
          </div>

          {/* Step 3: Review Payment (Active/Focused) */}
          <div className="p-3.5 rounded-2xl bg-blue-50/70 border-2 border-blue-600 flex flex-col justify-between h-24 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-blue-800">3</span>
              <span className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center text-xs text-blue-600 font-bold">
                ◎
              </span>
            </div>
            <span className="font-extrabold text-xs text-blue-900">Review Payment</span>
          </div>

          {/* Step 4: Confirm Transaction */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between h-24 text-slate-400">
            <span className="font-extrabold text-xs">4</span>
            <span className="font-bold text-xs text-slate-500">Confirm Transaction</span>
          </div>

          {/* Step 5: Verify Blockchain */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between h-24 text-slate-400">
            <span className="font-extrabold text-xs">5</span>
            <span className="font-bold text-xs text-slate-500">Verify Blockchain</span>
          </div>
        </div>

        {/* Bottom Stepper Progress Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Dual-color bar */}
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
              <div className="w-2/5 h-full bg-[#1951FC]" />
            </div>
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Progress: 2/5
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium hidden md:inline">
              Quick note: Test ETH is gas only.
            </span>
            <button
              type="button"
              onClick={onOpenGuide}
              className="btn-press text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Lanjut ke Review</span>
              <span>›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
