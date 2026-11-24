"use client";
import { useState } from "react";
import {
  IconSearch,
  IconEthereum,
  IconChevronDown,
  IconBell,
  IconWallet,
  IconMetaMask,
  IconCopy,
  IconCheck,
  IconExternalLink,
} from "./Icons";

export default function HeaderBar({
  walletAddress,
  onConnectWallet,
  onDisconnectWallet,
  onOpenAssetModal,
  searchQuery = "",
  onSearchChange,
  onToggleMobileMenu,
}) {
  const [showWalletDropdown, setShowWalletDropdown] = useState(false);
  const [showNetworkDropdown, setShowNetworkDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  return (
    <header className="h-16 px-4 sm:px-6 bg-white border-b border-slate-200/80 flex items-center justify-between gap-4 sticky top-0 z-30">
      {/* Left: Mobile Toggle & Global Search */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        {/* Search Input Bar */}
        <div className="relative w-full max-w-md hidden sm:block">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <IconSearch className="w-4 h-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Cari transaksi, invoice, wallet..."
            className="w-full pl-9 pr-14 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition"
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none">
            <kbd className="text-[10px] font-mono text-slate-400 bg-white border border-slate-200 rounded px-1.5 py-0.5 shadow-2xs">
              Ctrl K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Action Cluster */}
      <div className="flex items-center gap-2.5 sm:gap-3 flex-shrink-0">
        {/* Network Selector Pill */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowNetworkDropdown(!showNetworkDropdown)}
            className="btn-press flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-800 transition cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs"
          >
            <div className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
              <IconEthereum className="w-2.5 h-2.5" />
            </div>
            <span className="hidden md:inline">Ethereum Sepolia</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Testnet</span>
            </span>
            <IconChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showNetworkDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-2.5 text-xs z-50 animate-modal-pop">
              <span className="text-[11px] font-bold text-slate-400 px-2 block mb-1">
                Jaringan Aktif
              </span>
              <div className="p-2 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-between text-blue-900 font-bold">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>Ethereum Sepolia</span>
                </div>
                <span className="text-[10px] font-mono text-blue-600">0xaa36a7</span>
              </div>
              <p className="text-[10px] text-slate-500 p-2 leading-relaxed">
                Protokol BorderPay berjalan di testnet resmi Ethereum Sepolia dengan mock ERC-20.
              </p>
            </div>
          )}
        </div>

        {/* Wallet Pill or Connect Button */}
        {walletAddress ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWalletDropdown(!showWalletDropdown)}
              className="btn-press flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 transition cursor-pointer active:scale-95 shadow-2xs hover:shadow-xs"
            >
              <IconMetaMask className="w-5 h-5 flex-shrink-0" />
              <span className="font-mono">{formattedAddress}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <IconChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {showWalletDropdown && (
              <div className="absolute right-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 text-xs z-50 space-y-2 animate-modal-pop">
                <div className="pb-2 border-b border-slate-100">
                  <span className="text-[11px] text-slate-400 block font-medium">Akun Terhubung:</span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                      {formattedAddress}
                    </span>
                    <button
                      type="button"
                      onClick={copyAddress}
                      className="text-slate-400 hover:text-blue-600 transition cursor-pointer p-1"
                      title="Salin Alamat Wallet"
                    >
                      {copied ? (
                        <IconCheck className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <IconCopy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAssetModal) onOpenAssetModal();
                      setShowWalletDropdown(false);
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold transition flex items-center justify-between cursor-pointer"
                  >
                    <span>Saldo Token & Faucet</span>
                    <span>💳</span>
                  </button>

                  <a
                    href={`https://sepolia.etherscan.io/address/${walletAddress}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-slate-100 text-slate-700 font-semibold transition flex items-center justify-between"
                  >
                    <span>Buka di Etherscan</span>
                    <IconExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  {onDisconnectWallet && (
                    <button
                      type="button"
                      onClick={() => {
                        onDisconnectWallet();
                        setShowWalletDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded-xl hover:bg-rose-50 text-rose-600 font-semibold transition cursor-pointer"
                    >
                      Putuskan Koneksi
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={onConnectWallet}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            <IconWallet className="w-3.5 h-3.5" />
            <span>Hubungkan Wallet</span>
          </button>
        )}

        {/* Notification Bell */}
        <button
          type="button"
          onClick={() => {
            if (onOpenAssetModal) onOpenAssetModal();
          }}
          className="relative p-2 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
          title="Notifikasi Jaringan"
        >
          <IconBell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
        </button>
      </div>
    </header>
  );
}
