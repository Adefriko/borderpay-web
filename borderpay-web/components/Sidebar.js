"use client";
import {
  IconBorderPayMark,
  IconDashboard,
  IconQrCode,
  IconScan,
  IconSwap,
  IconLedger,
  IconDocument,
  IconWallet,
  IconStore,
  IconHelp,
  IconSettings,
} from "./Icons";

export default function Sidebar({
  activeTab = "dashboard",
  onSelectTab,
  onOpenScanner,
  onOpenHistory,
  onOpenAssetModal,
  onOpenAuthModal,
  onOpenGuide,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const navItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: IconDashboard,
      action: () => onSelectTab("dashboard"),
    },
    {
      id: "terminal",
      label: "Create QR Invoice",
      icon: IconQrCode,
      action: () => onSelectTab("terminal"),
    },
    {
      id: "scan",
      label: "Pay / Scan QR",
      icon: IconScan,
      action: () => {
        if (onOpenScanner) onOpenScanner();
        else onSelectTab("scan");
      },
    },
    {
      id: "rates",
      label: "Swap Rates",
      icon: IconSwap,
      action: () => onSelectTab("rates"),
    },
    {
      id: "ledger",
      label: "On-Chain Ledger",
      icon: IconLedger,
      action: () => onSelectTab("ledger"),
    },
    {
      id: "invoices",
      label: "My Invoices",
      icon: IconDocument,
      action: () => {
        if (onOpenHistory) onOpenHistory();
      },
    },
    {
      id: "wallet",
      label: "Wallet & Assets",
      icon: IconWallet,
      action: () => {
        if (onOpenAssetModal) onOpenAssetModal();
      },
    },
    {
      id: "merchant",
      label: "Merchant Account",
      icon: IconStore,
      action: () => {
        if (onOpenAuthModal) onOpenAuthModal();
      },
    },
  ];

  const handleNavClick = (item) => {
    item.action();
    if (onCloseMobile) onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/80 p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isMobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
      >
        <div className="space-y-6">
          {/* Brand Header — Klik untuk langsung ke Dashboard */}
          <button
            type="button"
            onClick={() => {
              onSelectTab("dashboard");
              if (onCloseMobile) onCloseMobile();
            }}
            className="btn-press flex items-center gap-3 px-2 text-left cursor-pointer hover:opacity-90 transition-opacity w-full group"
            title="Kembali ke Dashboard"
          >
            <IconBorderPayMark className="w-10 h-10 flex-shrink-0 drop-shadow-sm group-hover:scale-105 transition-transform" />
            <div>
              <span className="font-extrabold text-xl tracking-tight text-[#0B192C] block leading-tight group-hover:text-blue-600 transition-colors">
                BorderPay
              </span>
              <span className="text-[10px] font-medium text-slate-400 block tracking-tight">
                Web3 QR Payment & Swap
              </span>
            </div>
          </button>

          {/* Main Navigation Menu */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleNavClick(item)}
                  className={`btn-press w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left hover:translate-x-1 active:scale-[0.97] ${
                    isActive
                      ? "bg-[#1951FC] text-white shadow-md shadow-blue-500/25"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 transition-transform ${
                      isActive ? "text-white scale-105" : "text-slate-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <button
              type="button"
              onClick={() => {
                if (onOpenGuide) onOpenGuide();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition cursor-pointer text-left"
            >
              <IconHelp className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Help & Guide</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenGuide) onOpenGuide();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 transition cursor-pointer text-left"
            >
              <IconSettings className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Settings</span>
            </button>
          </div>

          {/* BorderPay Guide Booklet Card */}
          <div className="interactive-tile p-4 rounded-2xl bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-50/50 border border-blue-100/80 shadow-xs space-y-2 relative overflow-hidden group">
            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-200/60 flex items-center justify-center text-blue-600 shadow-2xs mb-1 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                <polygon points="10 8 10 14 15 11" fill="currentColor" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#0B192C]">BorderPay Guide</h4>
              <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                Panduan kilat penggunaan untuk pemula.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (onOpenGuide) onOpenGuide();
                if (onCloseMobile) onCloseMobile();
              }}
              className="btn-press w-full py-1.5 px-3 rounded-xl bg-[#1951FC] hover:bg-blue-600 active:scale-95 text-white text-[11px] font-bold transition shadow-xs cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Mulai Tutorial</span>
              <span className="group-hover:translate-x-0.5 transition-transform">→</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
