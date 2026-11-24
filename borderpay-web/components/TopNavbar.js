"use client";
import { useState, useRef, useEffect } from "react";
import {
  IconBorderPayMark,
  IconDashboard,
  IconQrCode,
  IconScan,
  IconSwap,
  IconLedger,
  IconBell,
  IconEthereum,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconStore,
  IconWallet,
  IconDocument,
  IconSettings,
  IconHelp,
} from "./Icons";

export default function TopNavbar({
  activeTab = "overview",
  onSelectTab,
  walletAddress = "",
  onConnectWallet,
  onDisconnectWallet,
  currentUser = null,
  onOpenScanner,
  onOpenHistory,
  onOpenAssetModal,
  onOpenAuthModal,
  onOpenGuide,
  searchQuery = "",
  onSearchChange,
}) {
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [copied, setCopied] = useState(false);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formattedAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "";

  const isOverviewActive = activeTab === "overview" || activeTab === "dashboard";
  const isCreateActive = activeTab === "terminal" || activeTab === "create";
  const isRatesActive = activeTab === "rates";
  const isLedgerActive = activeTab === "ledger";
  const isSettingsActive = activeTab === "settings";

  return (
    <header className="sticky top-0 z-40 w-full pt-3 px-3 sm:px-6 max-w-[1560px] mx-auto pointer-events-none">
      <div className="pointer-events-auto glass-pill-nav rounded-full px-4 sm:px-6 py-2 flex items-center justify-between gap-2 sm:gap-4 transition-all">
        
        {/* Left: Brand Logo Pill */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab("overview")}
          className="btn-press flex items-center gap-2.5 px-2.5 py-1 rounded-full hover:bg-white/60 transition cursor-pointer flex-shrink-0 group"
          title="Kembali ke Dashboard Overview"
        >
          <IconBorderPayMark className="w-8 h-8 rounded-xl shadow-xs group-hover:scale-105 transition-transform" />
          <div className="text-left hidden xs:block">
            <span className="font-extrabold text-base tracking-tight text-[#0B192C] block leading-none">
              BorderPay
            </span>
            <span className="text-[10px] font-bold text-slate-500 block leading-tight mt-0.5">
              Web3 Payment
            </span>
          </div>
        </button>

        {/* Center: Floating Navigation Pills */}
        <nav className="hidden md:flex items-center gap-1 p-1 bg-white/40 backdrop-blur-md border border-white/60 rounded-full shadow-inner">
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("overview")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isOverviewActive
                ? "bg-white/95 text-[#0B192C] shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <IconDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("terminal")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isCreateActive
                ? "bg-[#1951FC] text-white shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <IconQrCode className="w-3.5 h-3.5" />
            <span>Create QR</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenScanner && onOpenScanner()}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-white/70 transition-all cursor-pointer"
          >
            <IconScan className="w-3.5 h-3.5" />
            <span>Scan & Pay</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("rates")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isRatesActive
                ? "bg-white/95 text-[#0B192C] shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <IconSwap className="w-3.5 h-3.5" />
            <span>Swap Rates</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("ledger")}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isLedgerActive
                ? "bg-white/95 text-[#0B192C] shadow-xs"
                : "text-slate-700 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <IconLedger className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>
        </nav>

        {/* Right Cluster: Network, Wallet, Notifications, Avatar */}
        <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
          
          {/* Sepolia Testnet Pill */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/80 text-[11px] font-bold text-emerald-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SEPOLIA</span>
          </div>

          {/* Wallet Address / Connect Button */}
          {walletAddress ? (
            <div className="relative">
              <button
                type="button"
                onClick={onOpenAssetModal}
                className="btn-press flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
                title="Kelola Saldo & Token"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-mono">{formattedAddress}</span>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onConnectWallet}
              className="btn-press flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <span>Connect Wallet</span>
            </button>
          )}

          {/* Notification Bell Dropdown */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="btn-press relative p-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
              title="Notifikasi"
            >
              <IconBell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 text-xs z-50 animate-modal-pop">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-[#0B192C]">Notifikasi</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px]">
                      3 Baru
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowNotifications(false)}
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Tandai dibaca
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto">
                  <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 hover:bg-blue-50 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-blue-700">Pembayaran Diterima</span>
                      <span className="text-[10px] text-slate-400">5 menit lalu</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      100.00 mUSD berhasil masuk via kontrak CoinSwapPayment.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Invoice Dibuat</span>
                      <span className="text-[10px] text-slate-400">18 menit lalu</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      INV-7F3A-2291 siap dipindai oleh pembeli.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100 transition">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">Node Sepolia Tersinkron</span>
                      <span className="text-[10px] text-slate-400">1 jam lalu</span>
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Query event PaymentProcessed aktif pada blok terbaru.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Avatar Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="btn-press flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-sky-400 text-white font-extrabold text-xs shadow-xs border-2 border-white hover:opacity-90 transition cursor-pointer"
              title="Menu Profil"
            >
              {currentUser?.storeName ? currentUser.storeName.slice(0, 2).toUpperCase() : "BP"}
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl border border-slate-200 shadow-xl p-2.5 text-xs z-50 animate-modal-pop">
                {/* Profile Header */}
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                  <span className="font-extrabold text-[#0B192C] block truncate">
                    {currentUser?.storeName || "BorderPay Merchant"}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono block truncate mt-0.5">
                    {formattedAddress || "Wallet belum terhubung"}
                  </span>
                </div>

                {/* Menu items */}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenAuthModal && onOpenAuthModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold transition text-left cursor-pointer"
                  >
                    <IconStore className="w-4 h-4 text-blue-600" />
                    <span>Akun & Profil Merchant</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenAssetModal && onOpenAssetModal();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold transition text-left cursor-pointer"
                  >
                    <IconWallet className="w-4 h-4 text-blue-600" />
                    <span>Saldo & Token Simulasi</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenHistory && onOpenHistory();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold transition text-left cursor-pointer"
                  >
                    <IconDocument className="w-4 h-4 text-blue-600" />
                    <span>Riwayat Invoice Lokal</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onOpenGuide && onOpenGuide();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold transition text-left cursor-pointer"
                  >
                    <IconHelp className="w-4 h-4 text-blue-600" />
                    <span>Panduan Pengguna & Faucet</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileMenu(false);
                      onSelectTab && onSelectTab("settings");
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 font-semibold transition text-left cursor-pointer"
                  >
                    <IconSettings className="w-4 h-4 text-blue-600" />
                    <span>Pengaturan</span>
                  </button>

                  <div className="border-t border-slate-100 pt-1 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        onDisconnectWallet && onDisconnectWallet();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-red-600 hover:bg-red-50 font-semibold transition text-left cursor-pointer"
                    >
                      <span>🚪 Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mobile Menu Hamburger */}
          <button
            type="button"
            onClick={() => setShowMobileNav(!showMobileNav)}
            className="md:hidden p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 transition cursor-pointer"
            aria-label="Toggle menu"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown */}
      {showMobileNav && (
        <div className="pointer-events-auto mt-2 md:hidden bg-white/98 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl p-3 space-y-1 animate-modal-pop">
          <button
            type="button"
            onClick={() => {
              onSelectTab("overview");
              setShowMobileNav(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
              isOverviewActive ? "bg-[#1951FC] text-white" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <IconDashboard className="w-4 h-4" />
            <span>Overview Panel</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab("terminal");
              setShowMobileNav(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
              isCreateActive ? "bg-[#1951FC] text-white" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <IconQrCode className="w-4 h-4" />
            <span>Buat Invoice QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setShowMobileNav(false);
              onOpenScanner && onOpenScanner();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition text-left"
          >
            <IconScan className="w-4 h-4 text-blue-600" />
            <span>Scan & Bayar QR</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab("rates");
              setShowMobileNav(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
              isRatesActive ? "bg-[#1951FC] text-white" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <IconSwap className="w-4 h-4" />
            <span>Kurs & Simulator</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab("ledger");
              setShowMobileNav(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
              isLedgerActive ? "bg-[#1951FC] text-white" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <IconLedger className="w-4 h-4" />
            <span>On-Chain Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab("settings");
              setShowMobileNav(false);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition text-left ${
              isSettingsActive ? "bg-[#1951FC] text-white" : "text-slate-700 hover:bg-slate-50"
            }`}
          >
            <IconSettings className="w-4 h-4" />
            <span>Pengaturan</span>
          </button>
        </div>
      )}
    </header>
  );
}
