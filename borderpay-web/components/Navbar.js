"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { SEPOLIA_CHAIN_ID, TOKENS, ERC20_ABI } from "../constants/contracts";
import { IconBorderPayLogo, IconWallet, IconCopy, IconCheck, TokenIcon } from "./Icons";

export default function Navbar({
  walletAddress,
  onConnectWallet,
  activeTab = "terminal",
  onSelectTab,
  onOpenAssetModal,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) {
  const [copied, setCopied] = useState(false);
  const [balances, setBalances] = useState({});
  const [currentChain, setCurrentChain] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchQuickBalances = async () => {
      if (!walletAddress || typeof window === "undefined" || !window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const chain = await window.ethereum.request({ method: "eth_chainId" });
        setCurrentChain(chain);

        const newBals = {};
        for (const token of TOKENS) {
          try {
            const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
            const bal = await contract.balanceOf(walletAddress);
            newBals[token.symbol] = parseFloat(ethers.formatUnits(bal, 18)).toFixed(1);
          } catch {
            newBals[token.symbol] = "0.0";
          }
        }
        setBalances(newBals);
      } catch (e) {
        console.error("Error fetching navbar balances:", e);
      }
    };

    fetchQuickBalances();
    const interval = setInterval(fetchQuickBalances, 12000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  const isSepolia = currentChain.toLowerCase() === SEPOLIA_CHAIN_ID.toLowerCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <IconBorderPayLogo className="w-10 h-10" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                BorderPay
              </span>
              <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                v2.0 QR
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Cross-Border Multi-Currency Payment Protocol
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        {onSelectTab && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
            <button
              onClick={() => onSelectTab("terminal")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "terminal"
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              Merchant POS
            </button>
            <button
              onClick={() => onSelectTab("ledger")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "ledger"
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              On-Chain Ledger
            </button>
            <button
              onClick={() => onSelectTab("rates")}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "rates"
                  ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-200/50"
              }`}
            >
              Live Kurs Swap
            </button>
          </nav>
        )}

        {/* Right Action & User Controls */}
        <div className="flex items-center gap-2.5">
          {/* Network Status Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-slate-50 border border-slate-200 text-slate-700">
            <span
              className={`w-2 h-2 rounded-full ${
                walletAddress
                  ? isSepolia
                    ? "bg-emerald-500 animate-pulse"
                    : "bg-amber-500 animate-ping"
                  : "bg-slate-400"
              }`}
            />
            <span className="font-medium text-[11px]">
              {walletAddress ? (isSepolia ? "Sepolia Testnet" : "Wrong Chain") : "Sepolia"}
            </span>
          </div>

          {/* Quick Token Balances Button */}
          {walletAddress && onOpenAssetModal && (
            <button
              type="button"
              onClick={onOpenAssetModal}
              className="hidden sm:flex items-center gap-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl text-xs transition cursor-pointer text-slate-700"
              title="Lihat Detail Saldo Token"
            >
              <div className="flex -space-x-1.5 items-center">
                <TokenIcon symbol="mUSD" size="w-4 h-4" />
                <TokenIcon symbol="mEUR" size="w-4 h-4" />
                <TokenIcon symbol="mJPY" size="w-4 h-4" />
              </div>
              <span className="text-[11px] font-semibold text-slate-800">
                {balances.mUSD !== undefined ? `${balances.mUSD} mUSD` : "Dompet"}
              </span>
            </button>
          )}

          {/* User Account / Profile Section */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold text-indigo-900 transition cursor-pointer shadow-sm"
              >
                <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-[10px]">
                  {currentUser.storeName ? currentUser.storeName[0].toUpperCase() : "M"}
                </span>
                <span className="max-w-[110px] truncate">{currentUser.storeName}</span>
                <span className="text-[10px] text-indigo-400">▼</span>
              </button>

              {/* Profile Dropdown */}
              {showDropdown && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 text-xs animate-fadeIn"
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <div className="p-2 border-b border-slate-100">
                    <p className="font-bold text-slate-900 truncate">{currentUser.storeName}</p>
                    <p className="text-[11px] text-slate-500 truncate">{currentUser.name}</p>
                    <p className="text-[10px] font-mono text-slate-400 mt-1 truncate">
                      {walletAddress}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onOpenAuthModal();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                  >
                    ⚙️ Detail Profil Merchant
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onOpenAssetModal();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-50 transition"
                  >
                    💳 Dompet & Saldo Koin
                  </button>
                  <button
                    onClick={() => {
                      setShowDropdown(false);
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition"
                  >
                    🚪 Keluar (Logout)
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-sm transition cursor-pointer"
            >
              <span>Masuk / Daftar</span>
            </button>
          )}

          {/* Wallet Address Pill */}
          {walletAddress ? (
            <button
              type="button"
              onClick={copyAddress}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition"
              title="Klik untuk salin alamat"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>
                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
              </span>
              {copied ? (
                <IconCheck className="w-3 h-3 text-emerald-600" />
              ) : (
                <IconCopy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnectWallet}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold px-3 py-2 rounded-xl transition cursor-pointer"
            >
              <IconWallet className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hubungkan Wallet</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
