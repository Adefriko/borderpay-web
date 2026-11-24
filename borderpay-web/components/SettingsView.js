"use client";
import { useState, useEffect } from "react";
import { CONTRACT_ADDRESSES, TOKENS } from "../constants/contracts";
import { registerUser } from "../lib/auth";
import { TokenIcon, IconCopy, IconCheck, IconExternalLink } from "./Icons";
import { useToast } from "./ToastContext";

const SETTINGS_KEY = "borderpay_settings_v1";

const DEFAULT_PREFS = {
  theme: "glass",
  reducedMotion: false,
  glassEnabled: true,
  defaultToken: "mUSD",
  language: "id",
  notifyWallet: true,
  notifyInvoiceCreated: true,
  notifyInvoiceExpired: false,
  notifyPending: true,
  notifyConfirmed: true,
  notifyRpcError: true,
};

function ToggleSwitch({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer flex-shrink-0 ${
        checked ? "bg-[#1951FC]" : "bg-slate-200"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-xs transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

export default function SettingsView({
  currentUser,
  walletAddress,
  onDefaultTokenChange,
  onUserUpdated,
}) {
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState("all"); // "all" | "tampilan" | "notifikasi" | "token" | "profil" | "sepolia"
  const [prefs, setPrefs] = useState(DEFAULT_PREFS);
  const [storeNameInput, setStoreNameInput] = useState(currentUser?.storeName || "Kopi Nusantara");
  const [emailInput, setEmailInput] = useState(currentUser?.email || "kopinusantara.demo@example.com");
  const [categoryInput, setCategoryInput] = useState(currentUser?.businessType || "Makanan & Minuman");
  const [copiedAddr, setCopiedAddr] = useState("");
  const [savedNotice, setSavedNotice] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) setPrefs({ ...DEFAULT_PREFS, ...JSON.parse(raw) });
    } catch {
      // Keep default prefs
    }
  }, []);

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(text);
    toast.info("Tersalin", `${label} disalin ke clipboard.`);
    setTimeout(() => setCopiedAddr(""), 2000);
  };

  const handleSavePrefs = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(prefs));
      document.documentElement.dataset.reducedMotion = prefs.reducedMotion ? "true" : "false";
      if (onDefaultTokenChange) onDefaultTokenChange(prefs.defaultToken);

      if (walletAddress || currentUser?.address) {
        const updated = registerUser({
          address: walletAddress || currentUser.address,
          name: currentUser?.name || storeNameInput,
          storeName: storeNameInput,
          email: emailInput,
          businessType: categoryInput,
          preferredCurrency: prefs.defaultToken,
        });
        if (onUserUpdated) onUserUpdated(updated);
      }

      setSavedNotice(true);
      toast.success("Preferensi Disimpan", "Pengaturan lokal berhasil diperbarui di browser.");
    } catch (err) {
      toast.error("Gagal Menyimpan", err.message);
    }
  };

  const handleResetPrefs = () => {
    setPrefs(DEFAULT_PREFS);
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(DEFAULT_PREFS));
    document.documentElement.dataset.reducedMotion = DEFAULT_PREFS.reducedMotion ? "true" : "false";
    if (onDefaultTokenChange) onDefaultTokenChange(DEFAULT_PREFS.defaultToken);
    toast.info("Direset ke Default", "Semua preferensi dikembalikan ke pengaturan awal.");
  };

  const showSection = (id) => activeSubTab === "all" || activeSubTab === id;
  const initials = storeNameInput ? storeNameInput.slice(0, 2).toUpperCase() : "KN";

  return (
    <div className="space-y-6 text-[#0B192C]">
      {/* Header over Ocean Backdrop (Matched to Figma Image 13) */}
      <div className="pt-1 text-center space-y-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(3,30,60,0.22)]">
          Pengaturan
        </h1>
        <p className="text-xs sm:text-sm text-white/85 font-medium max-w-lg mx-auto">
          Preferensi lokal untuk demo ini. Beberapa opsi disimpan langsung di penyimpanan browser Anda.
        </p>
      </div>

      {/* Centered Sub-Tabs Floating Capsule (Matched to Figma Image 13) */}
      <div className="flex justify-center">
        <div className="inline-flex flex-wrap items-center justify-center gap-1 p-1.5 bg-white/95 backdrop-blur-xl border border-white rounded-2xl shadow-md">
          {[
            { id: "all", label: "Semua" },
            { id: "tampilan", label: "Tampilan" },
            { id: "notifikasi", label: "Notifikasi" },
            { id: "token", label: "Token Default" },
            { id: "profil", label: "Profil Lokal" },
            { id: "sepolia", label: "Sepolia" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? "bg-[#05354e] text-white shadow-xs"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2-Column Bento Settings Grid (Matched 1:1 to Figma Image 13) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start max-w-5xl mx-auto">
        
        {/* 1. Tampilan Card */}
        {showSection("tampilan") && (
          <div className="p-6 rounded-3xl surface-card space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Tampilan</h3>
              <span className="text-blue-600 text-xs font-bold">Tema</span>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-600 block">Tema Visual</span>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                {[
                  { id: "glass", label: "Liquid Glass" },
                  { id: "light", label: "Terang" },
                  { id: "system", label: "Sistem" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setPrefs((p) => ({ ...p, theme: opt.id }))}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      prefs.theme === opt.id
                        ? "bg-white text-[#0B192C] shadow-2xs"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#0B192C] block">
                    Kurangi animasi (Reduced motion)
                  </span>
                  <span className="text-[11px] text-slate-400 block">
                    Mengurangi transisi dan efek paralaks jika diperlukan.
                  </span>
                </div>
                <ToggleSwitch
                  checked={prefs.reducedMotion}
                  onChange={(val) => {
                    setPrefs((p) => ({ ...p, reducedMotion: val }));
                    document.documentElement.dataset.reducedMotion = val ? "true" : "false";
                  }}
                />
              </div>

              <div className="flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-[#0B192C] block">Efek kaca transparan</span>
                  <span className="text-[11px] text-slate-400 block">
                    Aktifkan blur optik dan transparansi pada panel hero.
                  </span>
                </div>
                <ToggleSwitch
                  checked={prefs.glassEnabled}
                  onChange={(val) => setPrefs((p) => ({ ...p, glassEnabled: val }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* 2. Token Default Card */}
        {showSection("token") && (
          <div className="p-6 rounded-3xl surface-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Token Default</h3>
              <span className="text-blue-600 text-xs font-bold">Settlement</span>
            </div>

            <p className="text-xs text-slate-500">
              Token awal di halaman Create QR dan Kurs & Simulator.
            </p>

            <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl">
              {TOKENS.map((tok) => (
                <button
                  key={tok.symbol}
                  type="button"
                  onClick={() => setPrefs((p) => ({ ...p, defaultToken: tok.symbol }))}
                  className={`py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 text-xs font-bold transition cursor-pointer ${
                    prefs.defaultToken === tok.symbol
                      ? "bg-white text-[#1951FC] shadow-2xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <TokenIcon symbol={tok.symbol} size="w-4 h-4" />
                  <span>{tok.symbol}</span>
                </button>
              ))}
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-600 leading-relaxed">
              ℹ️ Pilihan ini akan disimpan sebagai <strong>Preferred Settlement Asset</strong> pada profil lokal browser Anda.
            </div>
          </div>
        )}

        {/* 3. Notifikasi Card */}
        {showSection("notifikasi") && (
          <div className="p-6 rounded-3xl surface-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Notifikasi</h3>
              <span className="text-blue-600 text-xs font-bold">Alerts</span>
            </div>

            <div className="space-y-3">
              {[
                { key: "notifyWallet", label: "Koneksi wallet" },
                { key: "notifyInvoiceCreated", label: "QR invoice dibuat" },
                { key: "notifyInvoiceExpired", label: "Invoice kedaluwarsa" },
                { key: "notifyPending", label: "Pembayaran menunggu" },
                { key: "notifyConfirmed", label: "Pembayaran dikonfirmasi" },
                { key: "notifyRpcError", label: "Error jaringan RPC" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-0.5">
                  <span className="text-xs font-semibold text-slate-700">{item.label}</span>
                  <ToggleSwitch
                    checked={prefs[item.key]}
                    onChange={(val) => setPrefs((p) => ({ ...p, [item.key]: val }))}
                  />
                </div>
              ))}
            </div>

            <p className="text-[10px] text-slate-400 text-center pt-1">
              Hanya berlaku di browser ini.
            </p>
          </div>
        )}

        {/* 4. Profil Lokal Card */}
        {showSection("profil") && (
          <div className="p-6 rounded-3xl surface-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Profil Lokal</h3>
              <span className="text-blue-600 text-xs font-bold">Merchant</span>
            </div>

            <div className="flex items-center gap-3 pb-2">
              <div className="w-11 h-11 rounded-2xl bg-[#05354e] text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                {initials}
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-[#0B192C]">{storeNameInput}</h4>
                <span className="text-[11px] font-mono text-slate-400">
                  ID Merchant: BP-8829-LOCAL
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  NAMA MERCHANT
                </label>
                <input
                  type="text"
                  value={storeNameInput}
                  onChange={(e) => setStoreNameInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-semibold focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  EMAIL KONTAK
                </label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 focus:bg-white focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-extrabold uppercase text-slate-400 block mb-1">
                  KATEGORI USAHA
                </label>
                <select
                  value={categoryInput}
                  onChange={(e) => setCategoryInput(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-800 font-medium focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
                >
                  <option value="Makanan & Minuman">Makanan & Minuman</option>
                  <option value="F&B / Kafe & Resto">F&B / Kafe & Resto</option>
                  <option value="Jasa IT / Digital">Jasa IT / Digital</option>
                  <option value="Retail & Toko">Retail & Toko</option>
                  <option value="E-Commerce">E-Commerce</option>
                </select>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 pt-1">
              Disimpan di localStorage browser ini sebagai demo. Tidak ada sinkronisasi server.
            </p>
          </div>
        )}

        {/* 5. Sepolia Testnet Card */}
        {showSection("sepolia") && (
          <div className="p-6 rounded-3xl surface-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Sepolia Testnet</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
                ● TERHUBUNG
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">NETWORK NAME</span>
                <span className="font-bold text-[#0B192C]">Ethereum Sepolia</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase block">CHAIN ID</span>
                <span className="font-mono font-bold text-[#0B192C]">11155111</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase">GATEWAY CONTRACT</span>
                <button
                  type="button"
                  onClick={() => copyText(CONTRACT_ADDRESSES.CoinSwapPayment, "Gateway Contract")}
                  className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {copiedAddr === CONTRACT_ADDRESSES.CoinSwapPayment ? (
                    <>
                      <IconCheck className="w-3 h-3 text-emerald-600" />
                      <span>Tersalin</span>
                    </>
                  ) : (
                    <>
                      <IconCopy className="w-3 h-3" />
                      <span>Salin</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-[11px] text-slate-700 break-all">
                {CONTRACT_ADDRESSES.CoinSwapPayment}
              </p>
            </div>

            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.CoinSwapPayment}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-press w-full py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition"
            >
              <span>Lihat di Etherscan</span>
              <IconExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>
          </div>
        )}

        {/* 6. Bahasa Card */}
        {showSection("tampilan") && (
          <div className="p-6 rounded-3xl surface-card space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-sm text-[#0B192C]">Bahasa</h3>
              <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-extrabold uppercase">
                LOKAL
              </span>
            </div>

            <select
              value={prefs.language}
              onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer"
            >
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English (International)</option>
            </select>
          </div>
        )}
      </div>

      {/* Bottom Save & Reset Action Bar (Matched to Figma Image 13) */}
      <div className="flex flex-col items-center gap-3 pt-2 pb-6">
        {savedNotice && (
          <div className="px-4 py-1.5 rounded-full bg-[#05354e] text-white text-[11px] font-bold shadow-sm flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Preferensi lokal disimpan di browser ini.</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSavePrefs}
            className="btn-press px-6 py-2.5 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-extrabold shadow-md shadow-blue-500/20 transition cursor-pointer"
          >
            Simpan Preferensi
          </button>
          <button
            type="button"
            onClick={handleResetPrefs}
            className="btn-press px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer"
          >
            Reset ke Default
          </button>
        </div>
      </div>
    </div>
  );
}
