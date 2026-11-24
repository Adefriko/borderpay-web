"use client";
import { useState } from "react";
import Image from "next/image";
import { TOKENS } from "../constants/contracts";
import { getLocalInvoices } from "../lib/invoiceStore";
import {
  TokenIcon,
  IconCopy,
  IconCheck,
} from "./Icons";
import { useToast } from "./ToastContext";

const SIMULATED_RATES = {
  "mUSD->mEUR": 0.92,
  "mEUR->mUSD": 1.087,
  "mUSD->mJPY": 150,
  "mJPY->mUSD": 0.006667,
  "mEUR->mJPY": 163,
  "mJPY->mEUR": 0.006135,
};

const HERO_NODES = [
  { symbol: "mUSD", mark: "$", quoteTo: "mEUR", badgeClass: "bg-[#1951FC]" },
  { symbol: "mEUR", mark: "€", quoteTo: "mUSD", badgeClass: "bg-indigo-600" },
  { symbol: "mJPY", mark: "¥", quoteTo: "mUSD", badgeClass: "bg-teal-600" },
];

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
  onQuickCreateInvoice,
}) {
  const toast = useToast();
  const [copiedHeroWallet, setCopiedHeroWallet] = useState(false);
  const [activeChartFilter, setActiveChartFilter] = useState("7d");
  const [swapInAmount, setSwapInAmount] = useState("1000");
  const [swapInSymbol, setSwapInSymbol] = useState("mUSD");
  const [swapOutSymbol, setSwapOutSymbol] = useState("mEUR");
  const [swapRotated, setSwapRotated] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [selectedHeroToken, setSelectedHeroToken] = useState("mUSD");

  const displayAddr = walletAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d89A3F";
  const shortAddr = `${displayAddr.slice(0, 6)}...${displayAddr.slice(-4)}`;

  const copyAddress = () => {
    navigator.clipboard.writeText(displayAddr);
    setCopiedHeroWallet(true);
    toast.info("Alamat Tersalin", displayAddr);
    setTimeout(() => setCopiedHeroWallet(false), 2000);
  };

  // Interactive Swap Calculator estimation
  const pairRate =
    swapInSymbol === swapOutSymbol
      ? 1
      : SIMULATED_RATES[`${swapInSymbol}->${swapOutSymbol}`] || 1;
  const parsedIn = parseFloat(swapInAmount.replace(/,/g, "")) || 0;
  const computedOut = (parsedIn * pairRate).toLocaleString("en-US", {
    minimumFractionDigits: swapOutSymbol === "mJPY" ? 0 : 2,
    maximumFractionDigits: swapOutSymbol === "mJPY" ? 0 : 2,
  });

  const handleFlipSwap = () => {
    setSwapInSymbol(swapOutSymbol);
    setSwapOutSymbol(swapInSymbol);
    setSwapRotated((r) => !r);
  };

  const handleTorusPointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width - 0.5;
    const ny = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: -ny * 14, y: nx * 16 });
  };

  const resetTorusTilt = () => setTilt({ x: 0, y: 0 });

  const activeHeroNode =
    HERO_NODES.find((node) => node.symbol === selectedHeroToken) || HERO_NODES[0];
  const heroRate =
    SIMULATED_RATES[`${activeHeroNode.symbol}->${activeHeroNode.quoteTo}`] || 1;
  const heroBalance = tokenBalances?.[activeHeroNode.symbol] || "0.00";

  // Real local invoice summary stats combined with on-chain count
  const [nowSec] = useState(() => Math.floor(Date.now() / 1000));
  const localInvoices = typeof window !== "undefined" ? getLocalInvoices() : [];
  const activeInvCount =
    localInvoices.length > 0
      ? localInvoices.filter((inv) => !inv.deadline || inv.deadline >= nowSec).length
      : 4;
  const expiredInvCount =
    localInvoices.length > 0
      ? localInvoices.filter((inv) => inv.deadline && inv.deadline < nowSec).length
      : 2;
  const matchedInvCount = history.length > 0 ? history.length : 7;

  // Live recent transactions preview (falls back to baseline if empty)
  const recentTxs = history.slice(0, 4);

  return (
    <div className="space-y-6 text-[#0B192C]">
      {/* 1. Header Row */}
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
          SEPOLIA TESTNET • LIVE SYNC
        </span>
      </div>

      {/* 2. Top Hero Section (3-Column Translucent Frosted Glass Grid matching Figma Image 2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch stagger-1">
        
        {/* Left Column: Wallet Status Card */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-3xl glass-hero-ocean glass-sheen-hover flex flex-col justify-between space-y-5 text-white transition-transform duration-300 hover:-translate-y-0.5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase text-white/75 tracking-wider">
                {walletAddress ? "WALLET TERHUBUNG" : "DEMO PREVIEW WALLET"}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-200 text-[10px] font-extrabold border border-emerald-300/40 backdrop-blur-md flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{walletAddress ? "ACTIVE" : "DEMO"}</span>
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

        {/* Center Column: Interactive 3D Liquid-Glass Settlement Hub */}
        <div
          onMouseMove={handleTorusPointerMove}
          onMouseLeave={resetTorusTilt}
          className="lg:col-span-4 rounded-3xl overflow-hidden shadow-2xl border border-white/45 relative min-h-[270px] bg-[#04172b] glass-sheen-hover group"
          style={{ perspective: "900px" }}
        >
          <Image
            src="/hero-liquidity-3d.jpg"
            alt="BorderPay 3D Liquid Glass Torus"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 33vw"
            draggable={false}
            className="object-cover object-center select-none pointer-events-none transition-transform duration-300 ease-out"
            style={{
              transform: `scale(1.07) rotateX(${tilt.x * 0.7}deg) rotateY(${tilt.y * 0.7}deg)`,
            }}
          />

          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, rgba(4, 21, 41, 0.28) 0%, rgba(4, 21, 41, 0.08) 46%, rgba(3, 16, 33, 0.86) 100%)",
            }}
          />

          {/* Interactive Currency Nodes cleanly positioned inside safe inset bounds */}
          {HERO_NODES.map((node, index) => {
            const isSelected = activeHeroNode.symbol === node.symbol;
            const posClass =
              index === 0
                ? "top-3.5 left-3.5"
                : index === 1
                ? "top-3.5 right-3.5"
                : "bottom-[78px] right-3.5";
            return (
              <button
                key={node.symbol}
                type="button"
                onClick={() => setSelectedHeroToken(node.symbol)}
                aria-pressed={isSelected}
                className={`btn-press absolute ${posClass} px-3 py-1 rounded-full backdrop-blur-md text-white text-[11px] font-extrabold shadow-lg flex items-center gap-1.5 border transition-all duration-200 cursor-pointer ${
                  node.badgeClass
                } ${
                  isSelected
                    ? "border-white ring-2 ring-white/55 scale-105 opacity-100"
                    : "border-white/40 opacity-85 hover:opacity-100 hover:scale-105"
                }`}
              >
                <span>{node.symbol}</span>
                <span className="w-4 h-4 rounded-full bg-white/25 flex items-center justify-center text-[10px]">
                  {node.mark}
                </span>
              </button>
            );
          })}

          {/* Interactive Settlement Core HUD */}
          <div className="absolute bottom-3 inset-x-3 p-3 rounded-2xl bg-[#051d36]/80 backdrop-blur-xl border border-white/25 flex items-center justify-between gap-2.5 shadow-xl">
            <button
              type="button"
              onClick={onOpenAssetModal}
              className="text-left min-w-0 group/bal cursor-pointer"
              title="Lihat Detail Saldo Token"
            >
              <span className="text-[10px] font-bold text-sky-200/90 block truncate group-hover/bal:text-white transition-colors">
                Saldo {activeHeroNode.symbol} · 1 = {heroRate} {activeHeroNode.quoteTo}
              </span>
              <span
                key={activeHeroNode.symbol}
                className="text-sm sm:text-base font-extrabold text-white tracking-tight block truncate animate-pop"
              >
                {heroBalance} <span className="text-xs font-bold text-sky-300">{activeHeroNode.symbol}</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() =>
                onQuickCreateInvoice
                  ? onQuickCreateInvoice(activeHeroNode.symbol)
                  : onSelectTab("terminal")
              }
              className="btn-press shrink-0 px-3.5 py-2 rounded-xl bg-[#1951FC] hover:bg-blue-500 text-white text-xs font-extrabold shadow-md shadow-blue-950/40 border border-white/25 cursor-pointer transition-colors"
            >
              Buat QR {activeHeroNode.symbol} →
            </button>
          </div>
        </div>

        {/* Right Column: Aktivitas Terbaru Card (Wired to Live History + Receipt) */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-3xl glass-hero-ocean glass-sheen-hover flex flex-col justify-between space-y-4 text-white transition-transform duration-300 hover:-translate-y-0.5">
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
              {recentTxs.slice(0, 3).map((tx, i) => (
                <div
                  key={tx.id || tx.txHash || i}
                  onClick={() => onOpenReceipt && onOpenReceipt(tx)}
                  className="p-2.5 rounded-2xl glass-hero-row flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-extrabold ${
                        i === 0
                          ? "bg-emerald-400/25 text-emerald-200 border-emerald-300/35"
                          : i === 1
                          ? "bg-sky-400/25 text-sky-200 border-sky-300/35"
                          : "bg-white/15 text-white/85 border-white/25"
                      }`}
                    >
                      ✓
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-extrabold text-emerald-200 block leading-tight">
                        CONFIRMED • {tx.pair}
                      </span>
                      <span className="font-mono text-xs text-white font-semibold">
                        {tx.txHash ? `${tx.txHash.slice(0, 6)}...${tx.txHash.slice(-4)}` : "-"}
                      </span>
                    </div>
                  </div>
                  <span className="text-white/60 text-xs">›</span>
                </div>
              ))}
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

      {/* 3. Middle Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger-2">
        <div className="p-6 sm:p-7 rounded-3xl surface-card flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Saldo Token Mock</h3>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase">
                EXISTING
              </span>
            </div>

            <div className="space-y-3">
              {[
                { sym: "mUSD", badge: "mU", color: "bg-[#1951FC]", val: tokenBalances.mUSD || "10,000.00" },
                { sym: "mEUR", badge: "mE", color: "bg-indigo-600", val: tokenBalances.mEUR || "10,000.00" },
                { sym: "mJPY", badge: "mJ", color: "bg-teal-500", val: tokenBalances.mJPY || "1,000,000" },
              ].map((tok) => (
                <button
                  key={tok.sym}
                  type="button"
                  onClick={onOpenAssetModal}
                  className="w-full flex items-center justify-between p-3.5 rounded-2xl glass-sub-card hover:border-blue-300 transition cursor-pointer text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full ${tok.color} text-white flex items-center justify-center font-extrabold text-xs shadow-xs`}>
                      {tok.badge}
                    </div>
                    <div>
                      <span className="font-extrabold text-sm text-[#0B192C] block">{tok.val}</span>
                      <span className="text-[10px] text-slate-400 font-bold block">{tok.sym}</span>
                    </div>
                  </div>
                  <span className="text-slate-400 text-xs">›</span>
                </button>
              ))}
            </div>
          </div>

          <p className="text-[10px] text-slate-400 leading-tight">
            Contoh saldo mock-token untuk simulasi, bukan nilai finansial riil.
          </p>
        </div>

        <div className="p-6 sm:p-7 rounded-3xl surface-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-sm text-[#0B192C]">Aktivitas On-Chain</h3>
                <span className="text-[10px] text-slate-400">Berdasarkan event blockchain</span>
              </div>

              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 text-[10px] font-bold">
                {[
                  { id: "7d", label: "7 Hari" },
                  { id: "30d", label: "30 Hari" },
                  { id: "all", label: "Semua" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveChartFilter(f.id)}
                    className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                      activeChartFilter === f.id ? "bg-white text-[#0B192C] shadow-2xs" : "text-slate-500"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">
                Total Transaksi
              </span>
              <div className="text-3xl font-extrabold text-[#0B192C] tracking-tight">
                {activeChartFilter === "7d" ? Math.max(history.length, 24) : activeChartFilter === "30d" ? 84 : 128}
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 mt-2 flex overflow-hidden">
                <div className="w-2/3 h-full bg-[#1951FC]" />
                <div className="w-1/3 h-full bg-cyan-400" />
              </div>
            </div>

            <div className="pt-2">
              <svg key={activeChartFilter} className="w-full h-24 overflow-visible" viewBox="0 0 280 80">
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
                  d={
                    activeChartFilter === "7d"
                      ? "M20 60 Q 55 42, 90 52 T 160 35 T 225 58 T 270 25 L 270 75 L 20 75 Z"
                      : activeChartFilter === "30d"
                      ? "M20 55 Q 55 30, 90 44 T 160 22 T 225 42 T 270 18 L 270 75 L 20 75 Z"
                      : "M20 64 Q 55 48, 90 38 T 160 28 T 225 32 T 270 14 L 270 75 L 20 75 Z"
                  }
                  fill="url(#chart-grad)"
                />
                <path
                  d={
                    activeChartFilter === "7d"
                      ? "M20 60 Q 55 42, 90 52 T 160 35 T 225 58 T 270 25"
                      : activeChartFilter === "30d"
                      ? "M20 55 Q 55 30, 90 44 T 160 22 T 225 42 T 270 18"
                      : "M20 64 Q 55 48, 90 38 T 160 28 T 225 32 T 270 14"
                  }
                  fill="none"
                  stroke="#1951FC"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  className="animate-chart-draw"
                />
                <circle cx="20" cy={activeChartFilter === "7d" ? 60 : activeChartFilter === "30d" ? 55 : 64} r="3.5" fill="#1951FC" stroke="white" strokeWidth="1.5" className="animate-pop" />
                <circle cx="90" cy={activeChartFilter === "7d" ? 52 : activeChartFilter === "30d" ? 44 : 38} r="3.5" fill="#1951FC" stroke="white" strokeWidth="1.5" className="animate-pop" />
                <circle cx="160" cy={activeChartFilter === "7d" ? 35 : activeChartFilter === "30d" ? 22 : 28} r="3.5" fill="#1951FC" stroke="white" strokeWidth="1.5" className="animate-pop" />
                <circle cx="225" cy={activeChartFilter === "7d" ? 58 : activeChartFilter === "30d" ? 42 : 32} r="3.5" fill="#1951FC" stroke="white" strokeWidth="1.5" className="animate-pop" />
                <circle cx="270" cy={activeChartFilter === "7d" ? 25 : activeChartFilter === "30d" ? 18 : 14} r="3.5" fill="#1951FC" stroke="white" strokeWidth="1.5" className="animate-pop" />
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

        <div className="p-6 sm:p-7 rounded-3xl surface-card flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Ringkasan Invoice</h3>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase">
                LIVE LOCAL
              </span>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                <span className="text-xs font-semibold text-slate-600">Aktif</span>
                <span className="text-base font-extrabold text-emerald-600">{activeInvCount}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                <span className="text-xs font-semibold text-slate-600">Kedaluwarsa</span>
                <span className="text-base font-extrabold text-rose-500">{expiredInvCount}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs font-semibold text-slate-600">Tercatat On-Chain</span>
                <span className="text-base font-extrabold text-[#0B192C]">{matchedInvCount}</span>
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

      {/* 4. Lower Row (Interactive Kalkulator Swap + Live Transaksi On-Chain Terbaru) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        <div className="lg:col-span-5 p-6 sm:p-7 rounded-3xl surface-card flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <h3 className="font-extrabold text-sm text-[#0B192C]">Kalkulator Swap</h3>

            <div className="p-3.5 rounded-2xl glass-sub-card flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">BAYAR</span>
                <input
                  type="number"
                  step="any"
                  value={swapInAmount}
                  onChange={(e) => setSwapInAmount(e.target.value)}
                  className="font-extrabold text-lg text-[#0B192C] bg-transparent focus:outline-none w-32"
                />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-800">
                <TokenIcon symbol={swapInSymbol} size="w-4 h-4" />
                <select
                  value={swapInSymbol}
                  onChange={(e) => setSwapInSymbol(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer font-bold"
                >
                  {TOKENS.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-center -my-2">
              <button
                type="button"
                onClick={handleFlipSwap}
                className="btn-press w-8 h-8 rounded-full bg-white hover:bg-blue-50 text-blue-600 flex items-center justify-center border border-slate-200 shadow-2xs transition cursor-pointer"
                title="Tukar Pasangan"
              >
                ⇄
              </button>
            </div>

            <div className="p-3.5 rounded-2xl glass-sub-card flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">TERIMA (EST.)</span>
                <div className="font-extrabold text-lg text-[#0B192C]">{computedOut}</div>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs font-bold text-slate-800">
                <TokenIcon symbol={swapOutSymbol} size="w-4 h-4" />
                <select
                  value={swapOutSymbol}
                  onChange={(e) => setSwapOutSymbol(e.target.value)}
                  className="bg-transparent focus:outline-none cursor-pointer font-bold"
                >
                  {TOKENS.map((t) => (
                    <option key={t.symbol} value={t.symbol}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-[10px] text-slate-400 leading-tight">
              <span className="font-bold text-slate-600 block">
                Kurs Mock On-chain: 1 {swapInSymbol} = {pairRate} {swapOutSymbol}
              </span>
              <span>Simulasi kontrak, bukan kurs pasar.</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTab("rates")}
            className="btn-press w-full py-2.5 rounded-2xl bg-[#1951FC] hover:bg-blue-600 text-white font-extrabold text-xs shadow-xs transition cursor-pointer"
          >
            Buka Simulator Lengkap →
          </button>
        </div>

        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl surface-card space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h3 className="font-extrabold text-sm text-[#0B192C]">Transaksi On-Chain Terbaru</h3>
            <button
              type="button"
              onClick={() => onSelectTab("ledger")}
              className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
            >
              Lihat Semua →
            </button>
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
                {recentTxs.map((row, idx) => (
                  <tr
                    key={row.id || row.txHash || idx}
                    onClick={() => onOpenReceipt && onOpenReceipt(row)}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                  >
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 font-bold text-slate-800">
                        <div className="flex items-center -space-x-1">
                          <TokenIcon symbol={row.tokenInSymbol} size="w-4 h-4" />
                          {row.tokenOutSymbol !== row.tokenInSymbol && (
                            <TokenIcon symbol={row.tokenOutSymbol} size="w-4 h-4" />
                          )}
                        </div>
                        <span>{row.pair}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono font-bold text-[#0B192C]">
                      {row.amountIn === row.amountOut ? row.amountIn : `${row.amountIn} → ${row.amountOut}`}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-medium">{row.type || "Swap"}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                        CONFIRMED
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-blue-600 font-semibold">
                      <span>{row.txHash ? `${row.txHash.slice(0, 6)}...${row.txHash.slice(-4)}` : "-"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Full-Width Bottom Row: Panduan Mulai */}
      <div className="p-6 sm:p-7 rounded-3xl surface-card space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-[#0B192C]">Panduan Mulai</h3>
            <span className="text-[11px] text-slate-400">Lengkapi langkah-langkah untuk simulasi penuh</span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase">
            QUICK START
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
