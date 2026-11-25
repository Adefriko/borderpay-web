"use client";
import { useState, useEffect } from "react";
import {
  registerUser,
  loginUser,
  findUserByAddress,
  getRegisteredUsers,
} from "../lib/auth";
import OceanBackdrop from "./OceanBackdrop";
import {
  IconBorderPayMark,
  IconMetaMask,
  IconCheck,
  IconCopy,
} from "./Icons";
import { TOKENS } from "../constants/contracts";

export default function AuthLandingView({
  onAuthSuccess,
  walletAddress,
  onConnectWallet,
  onContinueAsGuest,
}) {
  const [tab, setTab] = useState("login"); // "login" | "signup"
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState("F&B / Kafe & Resto");
  const [preferredCurrency, setPreferredCurrency] = useState("mUSD");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copiedAddr, setCopiedAddr] = useState(false);
  const [savedUsers, setSavedUsers] = useState([]);

  useEffect(() => {
    setSavedUsers(getRegisteredUsers());
  }, []);

  const connectedAccount = walletAddress ? findUserByAddress(walletAddress) : null;

  const handleCopyWallet = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopiedAddr(true);
    setTimeout(() => setCopiedAddr(false), 2000);
  };

  const handleRegister = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!walletAddress) {
      return setErrorMsg("Harap hubungkan dompet (MetaMask) Anda terlebih dahulu!");
    }
    if (!name.trim()) {
      return setErrorMsg("Nama lengkap penanggung jawab wajib diisi!");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setErrorMsg("Format email tidak valid.");
    }

    try {
      const user = registerUser({
        address: walletAddress,
        name,
        storeName: storeName || name,
        email,
        businessType,
        preferredCurrency,
      });

      setSuccessMsg("Akun berhasil didaftarkan! Mengarahkan ke Overview...");
      setTimeout(() => {
        onAuthSuccess(user);
      }, 650);
    } catch (err) {
      setErrorMsg(err.message || "Gagal mendaftarkan akun.");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!walletAddress) {
      return setErrorMsg("Harap hubungkan dompet MetaMask terlebih dahulu!");
    }

    const user = loginUser(walletAddress);
    if (!user) {
      return setErrorMsg("Wallet ini belum terdaftar. Silakan beralih ke tab 'Daftar Akun'.");
    }

    setSuccessMsg(`Selamat datang, ${user.storeName || user.name}!`);
    setTimeout(() => {
      onAuthSuccess(user);
    }, 650);
  };

  const handleSelectDemoUser = (user) => {
    loginUser(user.address);
    setSuccessMsg(`Masuk sebagai ${user.storeName}...`);
    setTimeout(() => {
      onAuthSuccess(user);
    }, 450);
  };

  return (
    <div className="min-h-screen text-[#0B192C] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative selection:bg-blue-600 selection:text-white">
      <OceanBackdrop variant="ocean" />

      <div className="w-full max-w-md space-y-5 relative z-10">
        {/* Brand Header over 3D Ocean Backdrop */}
        <div className="text-center space-y-2.5">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white/95 backdrop-blur-xl border border-white shadow-lg mb-1">
            <IconBorderPayMark className="w-11 h-11" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_10px_rgba(3,30,60,0.28)]">
              BorderPay Portal
            </h1>
            <p className="text-xs text-white/85 font-medium mt-0.5">
              Web3 QR Payment & Cross-Border Swap
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-[11px] font-bold text-white shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Ethereum Sepolia Testnet</span>
          </div>
        </div>

        {/* Main Frosted Glass Card */}
        <div className="glass-create-form rounded-3xl p-4 sm:p-6 lg:p-7 space-y-5 animate-modal-pop">
          {/* Wallet Status Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50/90 border border-slate-200/80 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  walletAddress ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                }`}
              />
              <div className="min-w-0 truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Status Dompet
                </span>
                <span className="text-xs font-mono font-bold text-slate-800 truncate block">
                  {walletAddress
                    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                    : "Belum Terhubung"}
                </span>
              </div>
            </div>

            {walletAddress ? (
              <button
                type="button"
                onClick={handleCopyWallet}
                className="btn-press p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition cursor-pointer shadow-2xs shrink-0"
                title="Salin Alamat Wallet"
              >
                {copiedAddr ? (
                  <IconCheck className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <IconCopy className="w-3.5 h-3.5" />
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={onConnectWallet}
                className="btn-press px-3 sm:px-3.5 py-2 rounded-full bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <IconMetaMask className="w-4 h-4" />
                <span>Connect Wallet</span>
              </button>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100/90 border border-slate-200/80 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`btn-press py-2 rounded-xl transition cursor-pointer ${
                tab === "login"
                  ? "bg-white text-[#1951FC] shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`btn-press py-2 rounded-xl transition cursor-pointer ${
                tab === "signup"
                  ? "bg-white text-[#1951FC] shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Daftar Akun
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              ⚠️ {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium flex items-center gap-1.5">
              <IconCheck className="w-4 h-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {connectedAccount ? (
                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-[#1951FC] text-white font-extrabold flex items-center justify-center text-sm shadow-2xs">
                      {connectedAccount.storeName ? connectedAccount.storeName[0].toUpperCase() : "M"}
                    </span>
                    <div>
                      <h4 className="text-sm font-bold text-[#0B192C]">
                        {connectedAccount.storeName}
                      </h4>
                      <p className="text-xs text-slate-500">Pemilik: {connectedAccount.name}</p>
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-600 pt-2 border-t border-blue-100 flex justify-between">
                    <span>{connectedAccount.businessType}</span>
                    <span className="font-bold text-blue-600">{connectedAccount.preferredCurrency}</span>
                  </div>
                </div>
              ) : walletAddress ? (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    Wallet ini belum terdaftar di profil lokal.
                  </p>
                  <button
                    type="button"
                    onClick={() => setTab("signup")}
                    className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                  >
                    Daftar Akun Baru Sekarang →
                  </button>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2.5">
                  <p className="text-xs text-slate-500">
                    Hubungkan MetaMask untuk masuk ke profil merchant lokal Anda.
                  </p>
                  <button
                    type="button"
                    onClick={onConnectWallet}
                    className="btn-press w-full py-2.5 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <IconMetaMask className="w-4 h-4" />
                    <span>Hubungkan Dompet MetaMask</span>
                  </button>
                </div>
              )}

              {connectedAccount && (
                <button
                  type="submit"
                  className="btn-press w-full py-3 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Masuk ke Overview Panel →
                </button>
              )}

              {savedUsers.length > 0 && !connectedAccount && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Profil Lokal Tersimpan:
                  </span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {savedUsers.slice(0, 3).map((u) => (
                      <button
                        key={u.address}
                        type="button"
                        onClick={() => handleSelectDemoUser(u)}
                        className="btn-press w-full p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200 text-left transition flex items-center justify-between text-xs cursor-pointer"
                      >
                        <div className="truncate">
                          <span className="font-bold text-slate-800 block truncate">
                            {u.storeName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400 truncate block">
                            {u.displayAddress || u.address}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold text-blue-600 flex-shrink-0 ml-2">
                          Masuk →
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </form>
          )}

          {tab === "signup" && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Nama Merchant / Toko <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Kopi Nusantara"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Penanggung Jawab <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nama lengkap"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Kontak</label>
                <input
                  type="email"
                  placeholder="nama@usaha.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori Usaha</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="F&B / Kafe & Resto">Kuliner & Minuman</option>
                    <option value="Jasa IT / Digital">Jasa Digital</option>
                    <option value="Retail & Toko">Retail & Toko</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valuta Default</label>
                  <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 rounded-xl border border-slate-200">
                    {TOKENS.map((t) => (
                      <button
                        key={t.symbol}
                        type="button"
                        onClick={() => setPreferredCurrency(t.symbol)}
                        className={`py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          preferredCurrency === t.symbol
                            ? "bg-[#0B192C] text-white shadow-2xs"
                            : "text-slate-600 hover:text-slate-900"
                        }`}
                      >
                        {t.symbol}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!walletAddress}
                className="btn-press w-full py-3 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 disabled:bg-slate-200 disabled:text-slate-400 transition cursor-pointer mt-1"
              >
                {walletAddress ? "Daftar Profil Merchant Lokal →" : "Hubungkan Wallet Terlebih Dahulu"}
              </button>
            </form>
          )}

          <div className="pt-3 border-t border-slate-200/70 text-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="btn-press text-xs font-bold text-slate-600 hover:text-blue-600 transition cursor-pointer"
            >
              Lanjut sebagai Tamu (Mode Eksplorasi) →
            </button>
          </div>
        </div>

        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
          BORDERPAY WEB3 PAYMENTS INTERFACE
        </p>
      </div>
    </div>
  );
}
