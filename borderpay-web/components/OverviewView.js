"use client";
import { useState } from "react";
import {
  TokenIcon,
  IconCopy,
  IconCheck,
} from "./Icons";
import { useToast } from "./ToastContext";

export default function OverviewView({
  walletAddress = "",
  tokenBalances = { mUSD: "10,000.00", mEUR: "10,000.00", mJPY: "1,000,000" },
  ethBalance = "0.482",
  onSelectTab,
  onOpenScanner,
  onOpenAssetModal,
  onOpenGuide,
  onOpenReceipt,
}) {
  const toast = useToast();
  const [copiedHeroWallet, setCopiedHeroWallet] = useState(false);
  const [activeChartFilter, setActiveChartFilter] = useState("7d");
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
      {/* 1. Header Row (Crisp White Typography over Ocean 3D Glass Backdrop) */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(3,30,60,0.22)]">
            Overview Panel
          </h1>
          <p className="text-xs sm:text-sm text-white/85 font-medium mt-0.5">
            Kelola invoice QR, token simulasi, dan aktivitas blockchain dalam satu antarmuka terpadu.
          </p>
        </div>
        <span className="text-[10px] font-extrabold uppercase text-white/75 tracking-wider">
          TERAKHIR DIPERBARUI 14:32 WIB
        </span>
      </div>

      {/* 2. Top Hero Section (3-Column Translucent Frosted Glass Grid matching Figma Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Column: Wallet Status Card (Translucent Frosted Glass over 3D Ocean) */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-3xl glass-hero-ocean flex flex-col justify-between space-y-5 text-white">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-white/75 tracking-wider">
                WALLET TERHUBUNG
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-extrabold border border-emerald-300/40 backdrop-blur-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>ACTIVE</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-base text-white tracking-tight">
                {shortAddr}
              </span>
              <button
                type="button"
                onClick={copyAddress}
                className="text-white/75 hover:text-white transition cursor-pointer"
                title="Salin Alamat"
              >
                {copiedHeroWallet ? (
                  <IconCheck className="w-4 h-4 text-emerald-300" />
                ) : (
                  <IconCopy className="w-4 h-4" />
                )}
              </button>
            </div>

            <div className="pt-2">
              <span className="text-[11px] text-white/75 font-medium block">Saldo Test ETH</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-0.5">
                {ethBalance} <span className="text-sm font-bold text-white/75">ETH</span>
              </div>
              <p className="text-[10px] text-white/65 mt-1">
                *Test ETH is gas only. Mock tokens in simulation values.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-white/25">
            <button
              type="button"
              onClick={() => onSelectTab("terminal")}
              className="btn-press glass-hero-pill-btn py-2 px-2 rounded-full text-white text-xs font-bold text-center cursor-pointer"
            >
              Buat QR
            </button>
            <button
              type="button"
              onClick={onOpenScanner}
              className="btn-press glass-hero-pill-btn py-2 px-2 rounded-full text-white text-xs font-bold text-center cursor-pointer"
            >
              Scan & Bayar
            </button>
            <button
              type="button"
              onClick={onOpenAssetModal}
              className="btn-press glass-hero-pill-btn py-2 px-2 rounded-full text-white text-xs font-bold text-center cursor-pointer"
            >
              Saldo Token
            </button>
          </div>
        </div>

        {/* Center Column: Pure Vector 3D Glass Torus Sculpture (Single Crisp Badge Set, Zero Duplication) */}
        <div className="lg:col-span-4 rounded-3xl overflow-hidden shadow-2xl border border-white/45 relative flex items-center justify-center min-h-[240px] bg-[radial-gradient(circle_at_50%_38%,#14507a_0%,#09253f_62%,#04111f_100%)] group">
          {/* Ambient Pedestal Halo */}
          <div className="absolute bottom-3 w-48 h-8 rounded-full bg-cyan-400/25 blur-xl pointer-events-none" />

          {/* Clean Multi-Layered SVG 3D Glossy Mobius Glass Torus */}
          <svg
            className="w-56 h-56 drop-shadow-[0_18px_36px_rgba(14,165,233,0.45)] animate-float select-none"
            viewBox="0 0 240 240"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Outer Glossy Glass Loop */}
            <path
              d="M120 34C72.5 34 34 72.5 34 120C34 167.5 72.5 206 120 206C167.5 206 206 167.5 206 120C206 72.5 167.5 34 120 34ZM120 174C90.2 174 66 149.8 66 120C66 90.2 90.2 66 120 66C149.8 66 174 90.2 174 120C174 149.8 149.8 174 120 174Z"
              fill="url(#torus-outer-grad)"
            />
            {/* Twisted Inner S-Curve Glass Ribbon */}
            <path
              d="M46 118C52 84 86 64 122 86C158 108 192 92 194 120C190 156 156 174 118 152C82 130 50 144 46 118Z"
              fill="url(#torus-ribbon-grad)"
              opacity="0.92"
            />
            {/* Specular Ice Highlights */}
            <path
              d="M66 66C84 48 112 42 138 48"
              stroke="rgba(224,242,254,0.85)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <path
              d="M174 172C154 192 126 198 98 190"
              stroke="rgba(56,189,248,0.75)"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <path
              d="M64 114C78 96 104 94 126 106"
              stroke="rgba(255,255,255,0.7)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            {/* Subtle Floor Reflection Ellipse */}
            <ellipse cx="120" cy="214" rx="64" ry="8" fill="url(#floor-glow)" />
            <defs>
              <linearGradient id="torus-outer-grad" x1="34" y1="34" x2="206" y2="206" gradientUnits="userSpaceOnUse">
                <stop stopColor="#60a5fa" />
                <stop offset="0.35" stopColor="#1951FC" />
                <stop offset="0.7" stopColor="#0284c7" />
                <stop offset="1" stopColor="#072b6b" />
              </linearGradient>
              <linearGradient id="torus-ribbon-grad" x1="46" y1="90" x2="194" y2="155" gradientUnits="userSpaceOnUse">
                <stop stopColor="#38bdf8" />
                <stop offset="0.5" stopColor="#1d4ed8" />
                <stop offset="1" stopColor="#22d3ee" />
              </linearGradient>
              <radialGradient id="floor-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(120 214) scale(64 8)">
                <stop stopColor="#38bdf8" stopOpacity="0.6" />
                <stop offset="1" stopColor="#38bdf8" stopOpacity="0" />
              </radialGradient>
            </defs>
          </svg>

          {/* Single Clean Set of Floating Glass Token Badges */}
          <button
            type="button"
            onClick={onOpenAssetModal}
            className="btn-press absolute top-5 right-5 px-3 py-1 rounded-full bg-[#1951FC]/90 backdrop-blur-md text-white text-[11px] font-extrabold shadow-lg flex items-center gap-1.5 border border-white/45 cursor-pointer animate-float"
          >
            <span>mUSD</span>
            <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px]">$</span>
          </button>

          <button
            type="button"
            onClick={onOpenAssetModal}
            className="btn-press absolute bottom-14 left-5 px-3 py-1 rounded-full bg-teal-500/90 backdrop-blur-md text-white text-[11px] font-extrabold shadow-lg flex items-center gap-1.5 border border-white/45 cursor-pointer animate-float"
            style={{ animationDelay: "0.7s" }}
          >
            <span>mJPY</span>
            <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px]">¥</span>
          </button>

          <button
            type="button"
            onClick={onOpenAssetModal}
            className="btn-press absolute bottom-4 left-9 px-3 py-1 rounded-full bg-indigo-600/90 backdrop-blur-md text-white text-[11px] font-extrabold shadow-lg flex items-center gap-1.5 border border-white/45 cursor-pointer animate-float"
            style={{ animationDelay: "1.4s" }}
          >
            <span>mEUR</span>
            <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px]">€</span>
          </button>
        </div>

        {/* Right Column: Aktivitas Terbaru Card (Translucent Frosted Glass over 3D Ocean) */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-3xl glass-hero-ocean flex flex-col justify-between space-y-4 text-white">
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/25">
              <h3 className="font-extrabold text-sm text-white">Aktivitas Terbaru</h3>
              <button
                type="button"
                onClick={() => onSelectTab("ledger")}
                className="text-white/75 hover:text-white transition cursor-pointer"
                aria-label="Lihat Ledger"
              >
                →
              </button>
            </div>

            <div className="space-y-2">
              <div
                onClick={() => onSelectTab("ledger")}
                className="p-2.5 rounded-2xl glass-hero-row flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-emerald-400/25 text-emerald-200 border border-emerald-300/35 flex items-center justify-center text-xs font-extrabold">
                    ✓
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-emerald-200 block leading-tight">
                      CONFIRMED
                    </span>
                    <span className="font-mono text-xs text-white font-semibold">0x8a23...e11c</span>
                  </div>
                </div>
                <span className="text-white/60 text-xs">›</span>
              </div>

              <div
                onClick={() => onSelectTab("ledger")}
                className="p-2.5 rounded-2xl glass-hero-row flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-amber-400/25 text-amber-200 border border-amber-300/35 flex items-center justify-center text-xs font-extrabold">
                    ⏱
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-amber-200 block leading-tight">
                      PENDING
                    </span>
                    <span className="font-mono text-xs text-white font-semibold">0xf441...88a9</span>
                  </div>
                </div>
                <span className="text-white/60 text-xs">›</span>
              </div>

              <div
                onClick={() => onSelectTab("ledger")}
                className="p-2.5 rounded-2xl glass-hero-row flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-white/15 text-white/80 border border-white/25 flex items-center justify-center text-xs font-extrabold">
                    ✕
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-extrabold text-white/75 block leading-tight">
                      EXPIRED
                    </span>
                    <span className="font-mono text-xs text-white font-semibold">0x33b1...d22e</span>
                  </div>
                </div>
                <span className="text-white/60 text-xs">›</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab("ledger")}
            className="text-xs font-bold text-white/90 hover:text-white text-center block w-full transition pt-1 cursor-pointer"
          >
            Lihat detail transaksi
          </button>
        </div>
      </div>

      {/* 3. Middle Row (3 Crisp White Data Cards matching Figma Image 2) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        {/* Card 1: Saldo Token Mock */}
        <div className="p-6 sm:p-7 rounded-3xl surface-card flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Saldo Token Mock</h3>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase">
                EXISTING
              </span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl glass-sub-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[#1951FC] text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
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

              <div className="flex items-center justify-between p-3.5 rounded-2xl glass-sub-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
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

              <div className="flex items-center justify-between p-3.5 rounded-2xl glass-sub-card">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-teal-500 text-white flex items-center justify-center font-extrabold text-xs shadow-xs">
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
        <div className="p-6 sm:p-7 rounded-3xl surface-card flex flex-col justify-between space-y-4">
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
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    activeChartFilter === "7d" ? "bg-white text-[#0B192C] shadow-2xs" : "text-slate-500"
                  }`}
                >
                  7 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartFilter("30d")}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    activeChartFilter === "30d" ? "bg-white text-[#0B192C] shadow-2xs" : "text-slate-500"
                  }`}
                >
                  30 Hari
                </button>
                <button
                  type="button"
                  onClick={() => setActiveChartFilter("all")}
                  className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                    activeChartFilter === "all" ? "bg-white text-[#0B192C] shadow-2xs" : "text-slate-500"
                  }`}
                >
                  Semua
                </button>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Total Transaksi
              </span>
              <div className="text-3xl font-extrabold text-[#0B192C] tracking-tight">128</div>
              <div className="w-full h-2 rounded-full bg-slate-100 mt-2 flex overflow-hidden">
                <div className="w-2/3 h-full bg-[#1951FC]" />
                <div className="w-1/3 h-full bg-cyan-400" />
              </div>
            </div>

            <div className="pt-2">
              <svg className="w-full h-24 overflow-visible" viewBox="0 0 280 80">
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="80" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1951FC" stopOpacity="0.22" />
                    <stop offset="1" stopColor="#1951FC" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="20" x2="280" y2="20" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="50" x2="280" y2="50" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                <text x="0" y="18" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">20</text>
                <text x="0" y="48" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">10</text>
                <path
                  d="M20 60 Q 55 42, 90 52 T 160 35 T 225 58 T 270 25 L 270 75 L 20 75 Z"
                  fill="url(#chart-grad)"
                />
                <path
                  d="M20 60 Q 55 42, 90 52 T 160 35 T 225 58 T 270 25"
                  fill="none"
                  stroke="#1951FC"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
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
        <div className="p-6 sm:p-7 rounded-3xl surface-card flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Ringkasan Invoice</h3>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase">
                PROPOSED
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                <span className="text-xs font-semibold text-slate-600">Aktif</span>
                <span className="text-base font-extrabold text-[#0B192C]">4</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                <span className="text-xs font-semibold text-slate-600">Kedaluwarsa</span>
                <span className="text-base font-extrabold text-[#0B192C]">2</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
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
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl surface-card flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-[#0B192C]">Kalkulator Swap</h3>

            <div className="p-3.5 rounded-2xl glass-sub-card flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">BAYAR</span>
                <input
                  type="text"
                  value={swapInAmount}
                  onChange={(e) => setSwapInAmount(e.target.value)}
                  className="font-extrabold text-lg text-[#0B192C] bg-transparent focus:outline-none w-32"
                />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-800">
                <TokenIcon symbol="mUSD" size="w-4 h-4" />
                <span>mUSD</span>
              </div>
            </div>

            <div className="flex justify-center -my-2">
              <button
                type="button"
                onClick={() => {
                  const t = swapInAmount;
                  setSwapInAmount(swapOutAmount);
                  setSwapOutAmount(t);
                }}
                className="w-8 h-8 rounded-full bg-white hover:bg-blue-50 text-blue-600 flex items-center justify-center border border-slate-200 shadow-2xs transition cursor-pointer"
              >
                ⇄
              </button>
            </div>

            <div className="p-3.5 rounded-2xl glass-sub-card flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">TERIMA</span>
                <input
                  type="text"
                  value={swapOutAmount}
                  readOnly
                  className="font-extrabold text-lg text-[#0B192C] bg-transparent focus:outline-none w-32"
                />
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-800">
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

        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl surface-card space-y-4">
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
              <tbody className="divide-y divide-slate-100/80 font-sans">
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
                    className="hover:bg-slate-50/80 transition cursor-pointer"
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
                    <td className="py-3 px-3 font-mono font-bold text-[#0B192C]">{row.io}</td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{row.type}</td>
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
      <div className="p-6 sm:p-7 rounded-3xl surface-card space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-[#0B192C]">Panduan Mulai</h3>
            <span className="text-[11px] text-slate-400">Lengkapi langkah-langkah untuk simulasi penuh</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase">
            PROPOSED
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between h-24 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-emerald-800">1</span>
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
            </div>
            <span className="font-bold text-xs text-emerald-900">Connect Wallet</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between h-24 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-emerald-800">2</span>
              <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">✓</span>
            </div>
            <span className="font-bold text-xs text-emerald-900">Create or Scan QR</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-blue-50/80 border-2 border-blue-600 flex flex-col justify-between h-24 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="font-extrabold text-xs text-blue-800">3</span>
              <span className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center text-xs text-blue-600 font-bold">◎</span>
            </div>
            <span className="font-extrabold text-xs text-blue-900">Review Payment</span>
          </div>

          <div className="p-3.5 rounded-2xl glass-sub-card flex flex-col justify-between h-24 text-slate-400">
            <span className="font-extrabold text-xs">4</span>
            <span className="font-bold text-xs text-slate-500">Confirm Transaction</span>
          </div>

          <div className="p-3.5 rounded-2xl glass-sub-card flex flex-col justify-between h-24 text-slate-400">
            <span className="font-extrabold text-xs">5</span>
            <span className="font-bold text-xs text-slate-500">Verify Blockchain</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
              <div className="w-2/5 h-full bg-[#1951FC]" />
            </div>
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Progress: 2/5
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-medium hidden md:inline">
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
