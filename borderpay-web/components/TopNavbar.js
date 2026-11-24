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
  IconStore,
  IconWallet,
  IconDocument,
  IconSettings,
  IconHelp,
} from "./Icons";

export default function TopNavbar({
  activeTab = "overview",
  onSelectTab,
  isOceanHeader = true,
  walletAddress = "",
  onConnectWallet,
  onDisconnectWallet,
  currentUser = null,
  onOpenScanner,
  onOpenHistory,
  onOpenAssetModal,
  onOpenAuthModal,
  onOpenGuide,
}) {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifFilter, setNotifFilter] = useState("all"); // "all" | "unread"
  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      title: "Wallet terhubung",
      desc: "Wallet berhasil terhubung ke Sepolia Testnet.",
      time: "Baru saja",
      unread: true,
      tone: "blue",
      actionLabel: null,
    },
    {
      id: "notif-2",
      title: "QR invoice dibuat",
      desc: "Invoice ORD-20931 sebesar 25.00 mUSD berhasil dibuat.",
      time: "2 menit lalu",
      unread: true,
      tone: "emerald",
      actionLabel: "Lihat Invoice",
      actionType: "history",
    },
    {
      id: "notif-3",
      title: "Invoice kedaluwarsa",
      desc: "Invoice ORD-20874 telah melewati batas waktu pembayaran.",
      time: "1 jam lalu",
      unread: false,
      tone: "amber",
      actionLabel: "Buat Ulang",
      actionType: "create",
    },
    {
      id: "notif-4",
      title: "Pembayaran dikonfirmasi",
      desc: "Swap 100.00 mUSD → 92.00 mEUR selesai di kontrak Sepolia.",
      time: "3 jam lalu",
      unread: true,
      tone: "emerald",
      actionLabel: "Lihat Ledger",
      actionType: "ledger",
    },
  ]);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);

  const notificationsRef = useRef(null);
  const profileRef = useRef(null);

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

  const unreadCount = notifications.filter((n) => n.unread).length;
  const visibleNotifications =
    notifFilter === "unread" ? notifications.filter((n) => n.unread) : notifications;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleNotifAction = (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, unread: false } : n))
    );
    setShowNotifications(false);
    if (notif.actionType === "history" && onOpenHistory) onOpenHistory();
    else if (notif.actionType === "create" && onSelectTab) onSelectTab("terminal");
    else if (notif.actionType === "ledger" && onSelectTab) onSelectTab("ledger");
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
    <header className="sticky top-0 z-40 w-full pt-3.5 px-3 sm:px-6 max-w-[1560px] mx-auto pointer-events-none">
      <div className="pointer-events-auto flex items-center justify-between gap-2 sm:gap-4 transition-all">
        {/* Left: Floating Brand Pill (Clicking goes straight to Overview) */}
        <button
          type="button"
          onClick={() => onSelectTab && onSelectTab("overview")}
          className="btn-press flex items-center gap-2.5 px-3.5 py-2 rounded-full bg-white/95 backdrop-blur-xl border border-white shadow-sm hover:shadow-md transition cursor-pointer flex-shrink-0 group"
          title="Kembali ke Dashboard Overview"
        >
          <IconBorderPayMark className="w-7 h-7 rounded-lg shadow-2xs group-hover:scale-105 transition-transform" />
          <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#0B192C] hidden xs:inline">
            BorderPay
          </span>
        </button>

        {/* Center: Floating Translucent Glass Navigation Capsule */}
        <nav
          className={`hidden md:flex items-center gap-1 p-1.5 rounded-full transition-all ${
            isOceanHeader ? "glass-nav-ocean" : "glass-nav-light"
          }`}
        >
          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("overview")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isOverviewActive
                ? "bg-white text-[#0B192C] shadow-sm"
                : isOceanHeader
                ? "text-white/90 hover:text-white hover:bg-white/15"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <IconDashboard className="w-3.5 h-3.5" />
            <span>Overview</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("terminal")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isCreateActive
                ? isOceanHeader
                  ? "bg-white text-[#0B192C] shadow-sm"
                  : "bg-[#1951FC] text-white shadow-sm"
                : isOceanHeader
                ? "text-white/90 hover:text-white hover:bg-white/15"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <IconQrCode className="w-3.5 h-3.5" />
            <span>Create QR</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenScanner && onOpenScanner()}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isOceanHeader
                ? "text-white/90 hover:text-white hover:bg-white/15"
                : "text-slate-600 hover:text-blue-600 hover:bg-slate-100/70"
            }`}
          >
            <IconScan className="w-3.5 h-3.5" />
            <span>Scan & Pay</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("rates")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isRatesActive
                ? isOceanHeader
                  ? "bg-white text-[#0B192C] shadow-sm"
                  : "bg-slate-900 text-white shadow-sm"
                : isOceanHeader
                ? "text-white/90 hover:text-white hover:bg-white/15"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <IconSwap className="w-3.5 h-3.5" />
            <span>Swap Rates</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("ledger")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isLedgerActive
                ? isOceanHeader
                  ? "bg-white text-[#0B192C] shadow-sm"
                  : "bg-slate-900 text-white shadow-sm"
                : isOceanHeader
                ? "text-white/90 hover:text-white hover:bg-white/15"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <IconLedger className="w-3.5 h-3.5" />
            <span>Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab && onSelectTab("settings")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isSettingsActive
                ? "bg-white text-[#0B192C] shadow-sm"
                : isOceanHeader
                ? "text-white/90 hover:text-white hover:bg-white/15"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/70"
            }`}
          >
            <IconSettings className="w-3.5 h-3.5" />
            <span>More</span>
          </button>
        </nav>

        {/* Right Cluster: Translucent Pill with Network, Wallet, Notifications, Avatar */}
        <div
          className={`flex items-center gap-2 p-1.5 rounded-full flex-shrink-0 transition-all ${
            isOceanHeader ? "glass-nav-ocean" : "glass-nav-light"
          }`}
        >
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 border border-white text-[11px] font-extrabold text-emerald-700 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>SEPOLIA</span>
          </div>

          {walletAddress ? (
            <button
              type="button"
              onClick={onOpenAssetModal}
              className="btn-press flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
              title="Kelola Saldo & Token"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="font-mono">{formattedAddress}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onConnectWallet}
              className="btn-press flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              <span>Connect Wallet</span>
            </button>
          )}

          {/* Notification Bell Dropdown (Matched to Figma Image 12) */}
          <div className="relative" ref={notificationsRef}>
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className={`btn-press relative p-2 rounded-full transition cursor-pointer ${
                isOceanHeader
                  ? "bg-white/20 hover:bg-white/30 text-white border border-white/30"
                  : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
              }`}
              title="Notifikasi"
            >
              <IconBell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white/98 backdrop-blur-xl rounded-3xl border border-slate-200/90 shadow-2xl p-4 text-xs z-50 animate-modal-pop space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-[#0B192C]">Notifikasi</span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-bold text-[10px]">
                        {unreadCount} belum dibaca
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllRead}
                        className="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                      >
                        Tandai semua dibaca
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setNotifFilter("all")}
                    className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                      notifFilter === "all"
                        ? "bg-white text-[#0B192C] shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Semua
                  </button>
                  <button
                    type="button"
                    onClick={() => setNotifFilter("unread")}
                    className={`flex-1 py-1 rounded-lg transition cursor-pointer ${
                      notifFilter === "unread"
                        ? "bg-white text-[#0B192C] shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    Belum dibaca
                  </button>
                </div>

                {/* Notification Feed */}
                {visibleNotifications.length === 0 ? (
                  <div className="py-8 text-center space-y-2">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                      <IconBell className="w-4 h-4" />
                    </div>
                    <p className="font-bold text-slate-700 text-xs">Belum ada notifikasi</p>
                    <p className="text-[11px] text-slate-400 max-w-[220px] mx-auto leading-relaxed">
                      Notifikasi muncul saat ada aktivitas wallet, invoice, atau transaksi di aplikasi ini.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-0.5">
                    {visibleNotifications.map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-2xl border transition space-y-2 ${
                          item.unread
                            ? "bg-blue-50/50 border-blue-200/80"
                            : "bg-slate-50/80 border-slate-200/70"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-[#0B192C]">{item.title}</span>
                              {item.unread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 leading-snug">{item.desc}</p>
                          </div>
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {item.time}
                          </span>
                        </div>

                        {item.actionLabel && (
                          <button
                            type="button"
                            onClick={() => handleNotifAction(item)}
                            className="px-3 py-1 rounded-lg bg-[#0B192C] hover:bg-slate-800 text-white text-[10px] font-bold transition cursor-pointer"
                          >
                            {item.actionLabel}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
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
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl border border-slate-200 shadow-2xl p-2.5 text-xs z-50 animate-modal-pop">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 mb-2">
                  <span className="font-extrabold text-[#0B192C] block truncate">
                    {currentUser?.storeName || "BorderPay Merchant"}
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono block truncate mt-0.5">
                    {formattedAddress || "Wallet belum terhubung"}
                  </span>
                </div>

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
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 font-semibold transition text-left cursor-pointer"
                    >
                      <span>Keluar (Logout)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setShowMobileNav(!showMobileNav)}
            className="md:hidden p-2 rounded-full bg-white/80 hover:bg-white border border-slate-200 text-slate-700 transition cursor-pointer"
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
        <div className="pointer-events-auto mt-2 md:hidden bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-xl p-3 space-y-1 animate-modal-pop">
          {[
            { id: "overview", label: "Overview Panel", active: isOverviewActive, icon: IconDashboard },
            { id: "terminal", label: "Buat Invoice QR", active: isCreateActive, icon: IconQrCode },
            { id: "rates", label: "Kurs & Simulator", active: isRatesActive, icon: IconSwap },
            { id: "ledger", label: "On-Chain Ledger", active: isLedgerActive, icon: IconLedger },
            { id: "settings", label: "Pengaturan", active: isSettingsActive, icon: IconSettings },
          ].map((nav) => {
            const Icon = nav.icon;
            return (
              <button
                key={nav.id}
                type="button"
                onClick={() => {
                  onSelectTab(nav.id);
                  setShowMobileNav(false);
                }}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition text-left cursor-pointer ${
                  nav.active ? "bg-[#1951FC] text-white" : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{nav.label}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => {
              setShowMobileNav(false);
              onOpenScanner && onOpenScanner();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition text-left cursor-pointer"
          >
            <IconScan className="w-4 h-4 text-blue-600" />
            <span>Scan & Bayar QR</span>
          </button>
        </div>
      )}
    </header>
  );
}
