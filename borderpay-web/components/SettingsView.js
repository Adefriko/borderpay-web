"use client";
import { useState } from "react";
import { CONTRACT_ADDRESSES, TOKENS } from "../constants/contracts";
import { TokenIcon, IconCopy, IconCheck, IconExternalLink } from "./Icons";
import { useToast } from "./ToastContext";

export default function SettingsView({ currentUser, walletAddress, onOpenAuthModal }) {
  const toast = useToast();
  const [activeSubTab, setActiveSubTab] = useState("tampilan"); // "tampilan" | "notifikasi" | "token" | "profil" | "sepolia"
  const [theme, setTheme] = useState("glass");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [txNotify, setTxNotify] = useState(true);
  const [defaultToken, setDefaultToken] = useState("mUSD");
  const [copiedAddr, setCopiedAddr] = useState("");

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedAddr(text);
    toast.info("Tersalin", `${label} disalin ke clipboard.`);
    setTimeout(() => setCopiedAddr(""), 2000);
  };

  return (
    <div className="space-y-6 text-[#0B192C]">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#0B192C]">
          Pengaturan & Konfigurasi
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Sesuaikan preferensi antarmuka, notifikasi, profil toko, dan koneksi Sepolia.
        </p>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-slate-200/80 rounded-2xl shadow-2xs">
        {[
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
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === tab.id
                ? "bg-[#1951FC] text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100/60"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content based on sub-tab */}
      {activeSubTab === "tampilan" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-[#0B192C]">Tema Visual Antarmuka</h3>
            <p className="text-xs text-slate-500">
              Pilih gaya visual dashboard BorderPay.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "glass", name: "Blue Glass (Figma)", desc: "Standar" },
                { id: "light", name: "Clean Light", desc: "Minimalis" },
                { id: "dark", name: "High Contrast", desc: "Aksentuasi" },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTheme(item.id);
                    toast.success("Tema Diperbarui", item.name);
                  }}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    theme === item.id
                      ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                      : "border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  <span className="font-bold text-xs text-[#0B192C] block">{item.name}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">{item.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="font-extrabold text-sm text-[#0B192C]">Efek & Micro-Interactions</h3>
            <p className="text-xs text-slate-500">
              Animasi tactile tombol, feedback QR scanner, dan glow refractive.
            </p>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span className="text-xs font-bold text-slate-700">Animasi Smooth Float</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span className="text-xs font-bold text-slate-700">Suara Konfirmasi Transaksi</span>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "notifikasi" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 max-w-xl">
          <h3 className="font-extrabold text-sm text-[#0B192C]">Preferensi Notifikasi On-Chain</h3>
          <p className="text-xs text-slate-500">
            Dapatkan peringatan instan saat transaksi blockchain berhasil diselesaikan.
          </p>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Notifikasi Pembayaran Diterima</span>
                <span className="text-[11px] text-slate-500">Event PaymentProcessed pada smart contract</span>
              </div>
              <input
                type="checkbox"
                checked={txNotify}
                onChange={(e) => setTxNotify(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
            </label>
            <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 cursor-pointer">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Peringatan Invoice Kedaluwarsa</span>
                <span className="text-[11px] text-slate-500">Countdown timer tagihan lokal</span>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
            </label>
          </div>
        </div>
      )}

      {activeSubTab === "token" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 max-w-2xl">
          <h3 className="font-extrabold text-sm text-[#0B192C]">Valuta & Token Settlement Utama</h3>
          <p className="text-xs text-slate-500">
            Token standar yang dipilih otomatis saat Anda membuat invoice QR baru.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {TOKENS.map((tok) => (
              <button
                key={tok.symbol}
                type="button"
                onClick={() => {
                  setDefaultToken(tok.symbol);
                  toast.success("Token Default Diubah", tok.symbol);
                }}
                className={`p-4 rounded-xl border flex items-center gap-3 transition cursor-pointer text-left ${
                  defaultToken === tok.symbol
                    ? "border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20"
                    : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <TokenIcon symbol={tok.symbol} size="w-8 h-8" />
                <div>
                  <span className="font-extrabold text-xs text-[#0B192C] block">{tok.symbol}</span>
                  <span className="text-[10px] text-slate-400 block">{tok.name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === "profil" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 max-w-xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-[#0B192C]">Profil Merchant Terdaftar</h3>
              <p className="text-xs text-slate-500">Data profil disimpan secara lokal di browser Anda.</p>
            </div>
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-3.5 py-1.5 rounded-xl bg-[#1951FC] text-white text-xs font-bold hover:bg-blue-600 transition"
            >
              Edit Profil
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Nama Toko:</span>
              <span className="font-bold text-slate-800">{currentUser?.storeName || "Toko Kopi Nusantara"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Penanggung Jawab:</span>
              <span className="font-bold text-slate-800">{currentUser?.name || "Merchant BorderPay"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 font-medium">Wallet Terhubung:</span>
              <span className="font-mono text-blue-600">{walletAddress || "Belum terhubung"}</span>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === "sepolia" && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-[#0B192C]">Kontrak Smart Sepolia Testnet</h3>
            <p className="text-xs text-slate-500">
              Alamat kontrak pintar terverifikasi yang digunakan pada ekosistem BorderPay.
            </p>
          </div>

          <div className="space-y-3 text-xs font-mono">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-400 text-[10px] block font-sans font-bold">GATEWAY (CoinSwapPayment)</span>
                <span className="font-bold text-slate-800">{CONTRACT_ADDRESSES.CoinSwapPayment}</span>
              </div>
              <button
                type="button"
                onClick={() => copyText(CONTRACT_ADDRESSES.CoinSwapPayment, "Gateway")}
                className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
              >
                {copiedAddr === CONTRACT_ADDRESSES.CoinSwapPayment ? (
                  <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <IconCopy className="w-3.5 h-3.5" />
                )}
              </button>
            </div>

            {TOKENS.map((t) => (
              <div key={t.symbol} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[10px] block font-sans font-bold">TOKEN {t.symbol} ({t.name})</span>
                  <span className="text-slate-700">{t.address}</span>
                </div>
                <button
                  type="button"
                  onClick={() => copyText(t.address, t.symbol)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-600"
                >
                  {copiedAddr === t.address ? (
                    <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <IconCopy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
