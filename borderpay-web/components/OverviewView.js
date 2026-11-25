"use client";
import { useState } from "react";
import { TOKENS } from "../constants/contracts";
import {
  formatShortAddress,
  formatRelativeTimeId,
  isTxForAddress,
  summarizeInvoices,
  buildActivityBuckets,
} from "../lib/activityUtils";
import {
  TokenIcon,
  IconCopy,
  IconCheck,
  IconRefresh,
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
  { symbol: "mUSD", quoteTo: "mEUR" },
  { symbol: "mEUR", quoteTo: "mUSD" },
  { symbol: "mJPY", quoteTo: "mUSD" },
];

export default function OverviewView({
  walletAddress = "",
  effectiveAddress = "",
  currentUser = null,
  tokenBalances = { mUSD: "0.00", mEUR: "0.00", mJPY: "0" },
  ethBalance = "0.000",
  history = [],
  localInvoices = [],
  isLoadingHistory = false,
  historyError = "",
  onRefreshActivity,
  onConnectWallet,
  onSelectTab,
  onOpenScanner,
  onOpenAssetModal,
  onOpenHistory,
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
  const [selectedHeroToken, setSelectedHeroToken] = useState("mUSD");
  const [nowSec] = useState(() => Math.floor(Date.now() / 1000));

  const activeAddress = effectiveAddress || walletAddress || currentUser?.address || "";
  const hasMetaMask = Boolean(walletAddress);
  const isProfileOnly = !walletAddress && Boolean(currentUser?.address);
  const shortAddr = activeAddress ? formatShortAddress(activeAddress) : "Belum terhubung";

  const copyAddress = () => {
    if (!activeAddress) return;
    navigator.clipboard.writeText(activeAddress);
    setCopiedHeroWallet(true);
    toast.info("Alamat Tersalin", activeAddress);
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

  const activeHeroNode =
    HERO_NODES.find((node) => node.symbol === selectedHeroToken) || HERO_NODES[0];
  const heroRate =
    SIMULATED_RATES[`${activeHeroNode.symbol}->${activeHeroNode.quoteTo}`] || 1;
  const heroBalance =
    tokenBalances?.[activeHeroNode.symbol] ??
    (activeHeroNode.symbol === "mJPY" ? "0" : "0.00");

  // Live DB, wallet, and Sepolia blockchain aggregations
  const walletHistory = activeAddress
    ? history.filter((tx) => isTxForAddress(tx, activeAddress))
    : [];
  const prioritizedHistory = activeAddress
    ? [
        ...walletHistory,
        ...history.filter((tx) => !isTxForAddress(tx, activeAddress)),
      ]
    : history;

  const invoiceStats = summarizeInvoices(localInvoices, history, nowSec);
  const activityBuckets = buildActivityBuckets({
    history,
    filter: activeChartFilter,
  });

  // Hero "Aktivitas Terbaru": combine real blockchain events first, then real DB invoices
  const heroFeedItems = [];
  for (const tx of prioritizedHistory.slice(0, 3)) {
    const mine = isTxForAddress(tx, activeAddress);
    heroFeedItems.push({
      key: `tx-${tx.id || tx.txHash}`,
      kind: "tx",
      tx,
      badge: mine ? `WALLET • ${tx.pair}` : `CONFIRMED • ${tx.pair}`,
      primaryText: formatShortAddress(tx.txHash),
      subText: `${tx.amountIn} ${tx.tokenInSymbol} → ${tx.amountOut} ${tx.tokenOutSymbol}`,
      tone: mine ? "emerald" : "sky",
    });
  }

  if (heroFeedItems.length < 3) {
    const remainingSlots = 3 - heroFeedItems.length;
    for (const inv of localInvoices.slice(0, remainingSlots)) {
      const key = inv?.orderId ? String(inv.orderId).toLowerCase() : "";
      const paid = inv.status === "PAID" || invoiceStats.matchedSet.has(key);
      const expired = !paid && inv.deadline && Number(inv.deadline) < nowSec;
      heroFeedItems.push({
        key: `inv-${inv.orderId}`,
        kind: "inv",
        inv,
        badge: paid
          ? `TERBAYAR • ${inv.tokenSymbol || "mUSD"}`
          : expired
          ? `KEDALUWARSA • ${inv.tokenSymbol || "mUSD"}`
          : `INVOICE LOKAL • ${inv.tokenSymbol || "mUSD"}`,
        primaryText: `${inv.amount} ${inv.tokenSymbol || "mUSD"}`,
        subText: inv.memo || formatRelativeTimeId(inv.createdAt),
        tone: paid ? "emerald" : expired ? "amber" : "sky",
      });
    }
  }

  // Onboarding guide steps strictly bound to real wallet, DB, and blockchain state
  const guideSteps = [
    {
      num: 1,
      label: "Connect Wallet",
      done: hasMetaMask,
    },
    {
      num: 2,
      label: "Create or Scan QR",
      done: localInvoices.length > 0,
    },
    {
      num: 3,
      label: "Review Payment",
      done: invoiceStats.paidCount > 0 || walletHistory.length > 0,
    },
    {
      num: 4,
      label: "Confirm Transaction",
      done: walletHistory.length > 0 || invoiceStats.paidCount > 0,
    },
    {
      num: 5,
      label: "Verify Blockchain",
      done: history.length > 0 && (walletHistory.length > 0 || invoiceStats.paidCount > 0),
    },
  ];
  const completedGuideCount = guideSteps.filter((s) => s.done).length;
  const activeGuideIdx = guideSteps.findIndex((s) => !s.done);

  const recentTableTxs = prioritizedHistory.slice(0, 5);
  const yAxisMid = activityBuckets.peak > 1 ? Math.ceil(activityBuckets.peak / 2) : null;

  return (
    <div className="space-y-6 text-[#0B192C]">
      {/* 1. Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight drop-shadow-[0_2px_10px_rgba(3,30,60,0.22)]">
            Overview Panel
          </h1>
          <p className="text-xs sm:text-sm text-white/85 font-medium mt-0.5">
            Sinkronisasi langsung dengan DB lokal, wallet Anda, dan event kontrak Sepolia Testnet.
          </p>
        </div>

        <button
          type="button"
          onClick={onRefreshActivity}
          disabled={isLoadingHistory}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#062c48]/40 hover:bg-[#062c48]/60 border border-white/25 text-[10px] font-extrabold uppercase text-white/90 tracking-wider transition cursor-pointer"
          title="Muat ulang saldo dan transaksi Sepolia"
        >
          <IconRefresh className="w-3 h-3" isSpinning={isLoadingHistory} />
          <span>
            {isLoadingHistory
              ? "MENYINKRONKAN SEPOLIA..."
              : historyError
              ? "RPC OFFLINE • LOKAL AKTIF"
              : "SEPOLIA TESTNET • LIVE SYNC"}
          </span>
        </button>
      </div>

      {/* 2. Top Hero Section (3-Column Translucent Frosted Glass Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch stagger-1">
        {/* Left Column: Real Wallet / Session Card */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-3xl glass-hero-ocean glass-sheen-hover flex flex-col justify-between space-y-5 text-white transition-transform duration-300 hover:-translate-y-0.5">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-extrabold uppercase text-white/80 tracking-wider">
                {hasMetaMask
                  ? "WALLET METAMASK TERHUBUNG"
                  : isProfileOnly
                  ? "WALLET PROFIL TERDAFTAR"
                  : "WALLET BELUM TERHUBUNG"}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border backdrop-blur-md flex items-center gap-1 ${
                  hasMetaMask
                    ? "bg-emerald-400/20 text-emerald-200 border-emerald-300/40"
                    : isProfileOnly
                    ? "bg-sky-400/20 text-sky-100 border-sky-300/40"
                    : "bg-white/10 text-white/75 border-white/25"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    hasMetaMask
                      ? "bg-emerald-400 animate-pulse"
                      : isProfileOnly
                      ? "bg-sky-300"
                      : "bg-white/50"
                  }`}
                />
                <span>{hasMetaMask ? "ACTIVE" : isProfileOnly ? "SEPOLIA RPC" : "OFFLINE"}</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-base text-white tracking-tight">
                {shortAddr}
              </span>
              {activeAddress ? (
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
              ) : (
                onConnectWallet && (
                  <button
                    type="button"
                    onClick={onConnectWallet}
                    className="text-[11px] font-bold underline text-sky-200 hover:text-white cursor-pointer"
                  >
                    Hubungkan MetaMask
                  </button>
                )
              )}
            </div>

            <div className="pt-2">
              <span className="text-[11px] text-white/75 font-medium block">Saldo Sepolia ETH</span>
              <div className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mt-0.5">
                {ethBalance} <span className="text-sm font-bold text-white/75">ETH</span>
              </div>
              <p className="text-[10px] text-white/70 mt-1">
                {activeAddress
                  ? "Dibaca langsung dari jaringan Ethereum Sepolia Testnet."
                  : "Hubungkan wallet untuk membaca saldo ETH dan token Anda."}
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

        {/* Center Column: Clean Ocean-Glass QR Settlement Visualizer Card */}
        <div className="lg:col-span-4 p-6 sm:p-7 rounded-3xl glass-hero-ocean glass-sheen-hover flex flex-col justify-between space-y-4 text-white transition-transform duration-300 hover:-translate-y-0.5">
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/25">
            <h3 className="font-extrabold text-sm text-white truncate">Settlement QR Cepat</h3>
            <div
              role="group"
              aria-label="Pilih token settlement"
              className="inline-flex items-center p-0.5 rounded-full bg-[#062c48]/50 border border-white/25 shrink-0"
            >
              {HERO_NODES.map((node) => {
                const isSelected = activeHeroNode.symbol === node.symbol;
                return (
                  <button
                    key={node.symbol}
                    type="button"
                    onClick={() => setSelectedHeroToken(node.symbol)}
                    aria-pressed={isSelected}
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold transition cursor-pointer ${
                      isSelected
                        ? "bg-white text-[#0B192C] shadow-xs"
                        : "text-white/80 hover:text-white"
                    }`}
                  >
                    {node.symbol}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl bg-[#05233b]/35 border border-white/20 p-4 space-y-3.5">
            <div className="flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() =>
                  onQuickCreateInvoice
                    ? onQuickCreateInvoice(activeHeroNode.symbol)
                    : onSelectTab("terminal")
                }
                className="group/qr flex flex-col items-center gap-1.5 cursor-pointer shrink-0"
                title={`Buat Invoice QR ${activeHeroNode.symbol}`}
              >
                <div className="w-14 h-14 rounded-2xl bg-white p-2 shadow-md relative overflow-hidden transition-transform duration-200 group-hover/qr:scale-105">
                  <svg viewBox="0 0 36 36" className="w-full h-full text-[#0B192C]" aria-hidden="true">
                    <rect x="2" y="2" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <rect x="5.5" y="5.5" width="4" height="4" rx="0.8" fill="#1951FC" />
                    <rect x="23" y="2" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <rect x="26.5" y="5.5" width="4" height="4" rx="0.8" fill="currentColor" />
                    <rect x="2" y="23" width="11" height="11" rx="2" fill="none" stroke="currentColor" strokeWidth="2.5" />
                    <rect x="5.5" y="26.5" width="4" height="4" rx="0.8" fill="currentColor" />
                    <rect x="16.5" y="16.5" width="5" height="5" rx="1" fill="#1951FC" />
                    <path d="M16 4h4M16 9h2M23 18h4M25 23h7v4h-5M17 26h4v7" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" fill="none" />
                  </svg>
                  <div className="absolute inset-x-1 h-0.5 bg-sky-400/80 animate-scan pointer-events-none" />
                </div>
                <span className="text-[10px] font-bold text-white/85 group-hover/qr:text-white">
                  QR {activeHeroNode.symbol}
                </span>
              </button>

              <div className="flex-1 flex flex-col items-center gap-1 min-w-0 px-1">
                <span className="px-2 py-0.5 rounded-full bg-white/15 border border-white/25 font-mono text-[10px] font-bold text-sky-100 whitespace-nowrap">
                  1 = {heroRate} {activeHeroNode.quoteTo}
                </span>
                <svg className="w-full h-4 text-sky-300" viewBox="0 0 100 16" fill="none" aria-hidden="true">
                  <line
                    x1="4"
                    y1="8"
                    x2="90"
                    y2="8"
                    stroke="rgba(186, 230, 253, 0.45)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                  <circle cx="4" cy="8" r="2.5" fill="#7dd3fc" />
                  <path
                    d="M86 4L94 8L86 12"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="text-[10px] text-white/70 font-medium truncate">
                  Sepolia Auto-Swap
                </span>
              </div>

              <button
                type="button"
                onClick={onOpenAssetModal}
                className="group/tok flex flex-col items-center gap-1.5 cursor-pointer shrink-0"
                title="Lihat Saldo Token"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#062c48]/65 border border-white/30 flex items-center justify-center shadow-inner transition-transform duration-200 group-hover/tok:scale-105">
                  <TokenIcon symbol={activeHeroNode.quoteTo} size="w-8 h-8" />
                </div>
                <span className="text-[10px] font-bold text-white/85 group-hover/tok:text-white">
                  Terima {activeHeroNode.quoteTo}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenAssetModal}
              className="w-full pt-2.5 border-t border-white/15 flex items-center justify-between text-xs cursor-pointer group/bal"
            >
              <span className="text-white/75 group-hover/bal:text-white transition-colors">
                Saldo {activeHeroNode.symbol}
              </span>
              <span
                key={activeHeroNode.symbol}
                className="font-mono font-extrabold text-white animate-pop"
              >
                {heroBalance} {activeHeroNode.symbol} ›
              </span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/25">
            <button
              type="button"
              onClick={() =>
                onQuickCreateInvoice
                  ? onQuickCreateInvoice(activeHeroNode.symbol)
                  : onSelectTab("terminal")
              }
              className="btn-press glass-hero-pill-btn py-2 px-3 rounded-full text-white text-xs font-bold text-center cursor-pointer truncate"
            >
              Buat QR {activeHeroNode.symbol}
            </button>
            <button
              type="button"
              onClick={() => onSelectTab("rates")}
              className="btn-press glass-hero-pill-btn py-2 px-3 rounded-full text-white text-xs font-bold text-center cursor-pointer truncate"
            >
              Simulasi Kurs
            </button>
          </div>
        </div>

        {/* Right Column: Live Activity Feed (Sepolia On-Chain + DB Invoices) */}
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

            {heroFeedItems.length === 0 ? (
              <div className="p-4 rounded-2xl glass-hero-row text-center space-y-2.5 my-2">
                <p className="text-xs font-semibold text-white/90">
                  {isLoadingHistory
                    ? "Memuat aktivitas blockchain Sepolia..."
                    : "Belum ada transaksi on-chain maupun invoice lokal."}
                </p>
                <button
                  type="button"
                  onClick={() => onSelectTab("terminal")}
                  className="btn-press glass-hero-pill-btn px-3.5 py-1.5 rounded-full text-[11px] font-bold text-white cursor-pointer"
                >
                  + Buat QR Pertama
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {heroFeedItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => {
                      if (item.kind === "tx" && onOpenReceipt) onOpenReceipt(item.tx);
                      else if (item.kind === "inv" && onOpenHistory) onOpenHistory();
                    }}
                    className="w-full text-left p-2.5 rounded-2xl glass-hero-row flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full border shrink-0 flex items-center justify-center text-xs font-extrabold ${
                          item.tone === "emerald"
                            ? "bg-emerald-400/25 text-emerald-200 border-emerald-300/35"
                            : item.tone === "amber"
                            ? "bg-amber-400/25 text-amber-200 border-amber-300/35"
                            : "bg-sky-400/25 text-sky-200 border-sky-300/35"
                        }`}
                      >
                        {item.kind === "tx" ? "✓" : "•"}
                      </div>
                      <div className="min-w-0">
                        <span
                          className={`text-[10px] uppercase font-extrabold block leading-tight truncate ${
                            item.tone === "amber" ? "text-amber-200" : "text-emerald-200"
                          }`}
                        >
                          {item.badge}
                        </span>
                        <span className="font-mono text-xs text-white font-semibold block truncate">
                          {item.primaryText}
                          {item.subText ? ` · ${item.subText}` : ""}
                        </span>
                      </div>
                    </div>
                    <span className="text-white/70 text-xs shrink-0 pl-2">›</span>
                  </button>
                ))}
              </div>
            )}
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
        {/* Live Sepolia Token Balances */}
        <div className="p-6 sm:p-7 rounded-3xl surface-card flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Saldo Token Mock</h3>
              <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase">
                {hasMetaMask ? "ON-CHAIN WALLET" : activeAddress ? "SEPOLIA RPC" : "BELUM TERHUBUNG"}
              </span>
            </div>

            <div className="space-y-3">
              {[
                { sym: "mUSD", badge: "mU", color: "bg-[#1951FC]", val: tokenBalances.mUSD || "0.00" },
                { sym: "mEUR", badge: "mE", color: "bg-indigo-600", val: tokenBalances.mEUR || "0.00" },
                { sym: "mJPY", badge: "mJ", color: "bg-teal-500", val: tokenBalances.mJPY || "0" },
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
            {activeAddress
              ? `Saldo real mock-token kontrak Sepolia untuk ${shortAddr}.`
              : "Hubungkan wallet untuk memuat saldo mock-token kontrak Sepolia."}
          </p>
        </div>

        {/* Live Blockchain Activity Chart */}
        <div className="p-6 sm:p-7 rounded-3xl surface-card flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-sm text-[#0B192C]">Aktivitas On-Chain</h3>
                <span className="text-[10px] text-slate-400">
                  Event Sepolia PaymentProcessed
                </span>
              </div>

              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 text-[10px] font-bold shrink-0">
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
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">
                  Total Transaksi
                </span>
                <span className="text-[10px] font-bold text-slate-500">
                  Swap {activityBuckets.swapCount} · Transfer {activityBuckets.transferCount}
                </span>
              </div>
              <div className="text-3xl font-extrabold text-[#0B192C] tracking-tight">
                {activityBuckets.total}
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 mt-2 flex overflow-hidden">
                {activityBuckets.total > 0 && (
                  <>
                    <div
                      className="h-full bg-[#1951FC] transition-all duration-300"
                      style={{ width: `${activityBuckets.swapPct}%` }}
                    />
                    <div
                      className="h-full bg-cyan-400 transition-all duration-300"
                      style={{ width: `${activityBuckets.transferPct}%` }}
                    />
                  </>
                )}
              </div>
            </div>

            <div className="pt-2">
              <svg
                key={`${activeChartFilter}-${activityBuckets.total}`}
                className="w-full h-24 overflow-visible"
                viewBox="0 0 280 80"
              >
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="80" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#1951FC" stopOpacity="0.22" />
                    <stop offset="1" stopColor="#1951FC" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <line x1="0" y1="16" x2="280" y2="16" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="42" x2="280" y2="42" stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="0" y1="68" x2="280" y2="68" stroke="#e2e8f0" strokeWidth="1" />
                <text x="0" y="14" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">
                  {activityBuckets.peak}
                </text>
                {yAxisMid !== null && (
                  <text x="0" y="40" fill="#94a3b8" fontSize="8" fontFamily="sans-serif">
                    {yAxisMid}
                  </text>
                )}
                <path d={activityBuckets.areaPath} fill="url(#chart-grad)" />
                <path
                  d={activityBuckets.linePath}
                  fill="none"
                  stroke="#1951FC"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="animate-chart-draw"
                />
                {activityBuckets.points.map((pt, idx) => (
                  <circle
                    key={idx}
                    cx={pt.x}
                    cy={pt.y}
                    r="3.5"
                    fill="#1951FC"
                    stroke="white"
                    strokeWidth="1.5"
                    className="animate-pop"
                  />
                ))}
              </svg>

              <div className="flex justify-between text-[9px] text-slate-400 font-bold uppercase mt-1 px-1">
                {activityBuckets.buckets.map((bucket, idx) => (
                  <span key={idx}>{bucket.label}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Live Local DB Invoice Summary */}
        <div className="p-6 sm:p-7 rounded-3xl surface-card flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Ringkasan Invoice</h3>
              <button
                type="button"
                onClick={onOpenHistory}
                className="px-2 py-0.5 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase cursor-pointer transition"
              >
                DB LOKAL
              </button>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                <span className="text-xs font-semibold text-slate-600">Aktif</span>
                <span className="text-base font-extrabold text-emerald-600">
                  {invoiceStats.activeCount}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-slate-100/80">
                <span className="text-xs font-semibold text-slate-600">Kedaluwarsa</span>
                <span className="text-base font-extrabold text-rose-500">
                  {invoiceStats.expiredCount}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs font-semibold text-slate-600">Terbayar On-Chain</span>
                <span className="text-base font-extrabold text-[#0B192C]">
                  {invoiceStats.paidCount}
                </span>
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
                style={{ transform: swapRotated ? "rotate(180deg)" : "rotate(0deg)" }}
                className="btn-press w-8 h-8 rounded-full bg-white hover:bg-blue-50 text-blue-600 flex items-center justify-center border border-slate-200 shadow-2xs transition-transform duration-300 cursor-pointer"
                title="Tukar Pasangan"
              >
                ⇄
              </button>
            </div>

            <div className="p-3.5 rounded-2xl glass-sub-card flex items-center justify-between gap-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">TERIMA (EST.)</span>
                <div key={computedOut} className="font-extrabold text-lg text-[#0B192C] animate-pop">
                  {computedOut}
                </div>
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
            <div>
              <h3 className="font-extrabold text-sm text-[#0B192C]">Transaksi On-Chain Terbaru</h3>
              {activeAddress && walletHistory.length > 0 && (
                <span className="text-[10px] text-blue-600 font-bold">
                  {walletHistory.length} transaksi terkait wallet Anda
                </span>
              )}
            </div>
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
                {recentTableTxs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-10 text-center space-y-2">
                      <p className="text-xs font-semibold text-slate-500">
                        {isLoadingHistory
                          ? "Memindai event PaymentProcessed di Sepolia..."
                          : historyError ||
                            "Belum ada transaksi PaymentProcessed dalam rentang blok Sepolia terbaru."}
                      </p>
                      <div className="flex items-center justify-center gap-2 pt-1">
                        {onRefreshActivity && (
                          <button
                            type="button"
                            onClick={onRefreshActivity}
                            className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold cursor-pointer"
                          >
                            Muat Ulang
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onSelectTab("terminal")}
                          className="px-3 py-1 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-[11px] font-bold cursor-pointer"
                        >
                          Buat Invoice QR
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  recentTableTxs.map((row, idx) => {
                    const isMine = isTxForAddress(row, activeAddress);
                    return (
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
                            {isMine && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[9px] font-extrabold">
                                Anda
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-[#0B192C]">
                          {row.amountIn === row.amountOut
                            ? row.amountIn
                            : `${row.amountIn} → ${row.amountOut}`}
                        </td>
                        <td className="py-3 px-3 text-slate-600 font-medium">{row.type || "Swap"}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-600 border border-emerald-200">
                            CONFIRMED
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-blue-600 font-semibold">
                          <span>{row.txHash ? formatShortAddress(row.txHash) : "-"}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5. Full-Width Bottom Row: Live-Tracked Onboarding Steps */}
      <div className="p-6 sm:p-7 rounded-3xl surface-card space-y-5">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-sm text-[#0B192C]">Panduan Mulai</h3>
            <span className="text-[11px] text-slate-400">
              Progres otomatis mengikuti status wallet, DB lokal, dan transaksi on-chain Anda
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase">
            QUICK START
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {guideSteps.map((step, idx) => {
            const isCurrent = idx === activeGuideIdx;
            if (step.done) {
              return (
                <div
                  key={step.num}
                  className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col justify-between h-24 shadow-2xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-emerald-800">{step.num}</span>
                    <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs">
                      ✓
                    </span>
                  </div>
                  <span className="font-bold text-xs text-emerald-900">{step.label}</span>
                </div>
              );
            }
            if (isCurrent) {
              return (
                <div
                  key={step.num}
                  className="p-3.5 rounded-2xl bg-blue-50/80 border-2 border-blue-600 flex flex-col justify-between h-24 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-blue-800">{step.num}</span>
                    <span className="w-5 h-5 rounded-full border-2 border-blue-600 flex items-center justify-center text-xs text-blue-600 font-bold">
                      ◎
                    </span>
                  </div>
                  <span className="font-extrabold text-xs text-blue-900">{step.label}</span>
                </div>
              );
            }
            return (
              <div
                key={step.num}
                className="p-3.5 rounded-2xl glass-sub-card flex flex-col justify-between h-24 text-slate-400"
              >
                <span className="font-extrabold text-xs">{step.num}</span>
                <span className="font-bold text-xs text-slate-500">{step.label}</span>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="w-full h-2 rounded-full bg-slate-100 flex overflow-hidden">
              <div
                className="h-full bg-[#1951FC] transition-all duration-500"
                style={{ width: `${(completedGuideCount / guideSteps.length) * 100}%` }}
              />
            </div>
            <span className="text-xs font-bold text-slate-600 whitespace-nowrap">
              Progress: {completedGuideCount}/{guideSteps.length}
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
              <span>
                {activeGuideIdx >= 0
                  ? `Lanjut: ${guideSteps[activeGuideIdx].label}`
                  : "Lihat Panduan Lengkap"}
              </span>
              <span>›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
