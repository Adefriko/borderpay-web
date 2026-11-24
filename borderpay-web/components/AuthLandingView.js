"use client";
import { useState, useEffect } from "react";
import {
  registerUser,
  loginUser,
  findUserByAddress,
  getRegisteredUsers,
} from "../lib/auth";
import {
  IconBorderPayMark,
  IconWallet,
  IconMetaMask,
  IconCheck,
  IconCopy,
  IconStore,
  IconShieldCheck,
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

    try {
      const user = registerUser({
        address: walletAddress,
        name,
        storeName: storeName || name,
        email,
        businessType,
        preferredCurrency,
      });

      setSuccessMsg("Akun berhasil didaftarkan! Mengarahkan ke Dashboard...");
      setTimeout(() => {
        onAuthSuccess(user);
      }, 700);
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
    }, 700);
  };

  const handleSelectDemoUser = (user) => {
    loginUser(user.address);
    setSuccessMsg(`Masuk sebagai ${user.storeName}...`);
    setTimeout(() => {
      onAuthSuccess(user);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-[#F3F7FC] text-[#0B192C] flex flex-col justify-center items-center p-4 sm:p-6 lg:p-8 relative selection:bg-blue-600/20">
      {/* Background Soft Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] bg-gradient-to-tr from-blue-400/15 via-sky-300/10 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs mb-1">
            <IconBorderPayMark className="w-12 h-12" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#0B192C]">
              BorderPay Portal
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Web3 QR Payment & Cross-Border Swap
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-[10px] font-bold text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Ethereum Sepolia Testnet</span>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-xl space-y-5 animate-modal-pop">
          {/* Wallet Status Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                  walletAddress ? "bg-emerald-500 animate-pulse" : "bg-amber-400"
                }`}
              />
              <div className="truncate">
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
                className="btn-press p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 transition cursor-pointer shadow-2xs"
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
                className="btn-press px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer flex-shrink-0"
              >
                <IconMetaMask className="w-4 h-4" />
                <span>Hubungkan</span>
              </button>
            )}
          </div>

          {/* Tab Switcher */}
          <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setErrorMsg("");
                setSuccessMsg("");
              }}
              className={`btn-press py-2 rounded-xl transition cursor-pointer ${
                tab === "login"
                  ? "bg-white text-blue-600 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Masuk (Login)
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
                  ? "bg-white text-blue-600 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Daftar Akun (Sign Up)
            </button>
          </div>

          {/* Feedback Alerts */}
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

          {/* TAB 1: LOGIN */}
          {tab === "login" && (
            <form onSubmit={handleLogin} className="space-y-4">
              {connectedAccount ? (
                <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm shadow-2xs">
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
                    Silakan hubungkan MetaMask untuk masuk ke akun Anda.
                  </p>
                  <button
                    type="button"
                    onClick={onConnectWallet}
                    className="btn-press w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-sm transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <IconMetaMask className="w-4 h-4" />
                    <span>Hubungkan Dompet MetaMask</span>
                  </button>
                </div>
              )}

              {/* Login Submit Button */}
              {connectedAccount && (
                <button
                  type="submit"
                  className="btn-electric btn-press w-full py-3 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Masuk ke Dashboard →
                </button>
              )}

              {/* Demo Profiles (If Any Exist in Storage) */}
              {savedUsers.length > 0 && !connectedAccount && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Atau Pilih Profil Demo Tersimpan:
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

          {/* TAB 2: SIGN UP */}
          {tab === "signup" && (
            <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Toko / Merchant <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Senja Nusantara"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Penanggung Jawab <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap Pemilik"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Kontak (Opsional)</label>
                <input
                  type="email"
                  placeholder="merchant@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={businessType}
                    onChange={(e) => setBusinessType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    <option value="F&B / Kafe & Resto">F&B / Kafe</option>
                    <option value="Jasa IT / Digital">Jasa Digital</option>
                    <option value="Retail & Toko">Retail & Toko</option>
                    <option value="E-Commerce">E-Commerce</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Valuta Default</label>
                  <select
                    value={preferredCurrency}
                    onChange={(e) => setPreferredCurrency(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 transition cursor-pointer"
                  >
                    {TOKENS.map((t) => (
                      <option key={t.symbol} value={t.symbol}>
                        {t.symbol} ({t.name})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={!walletAddress}
                className="btn-electric btn-press w-full py-3 rounded-xl font-bold text-xs shadow-md shadow-blue-500/20 disabled:bg-slate-200 disabled:text-slate-400 transition cursor-pointer mt-1"
              >
                {walletAddress ? "Daftar & Masuk ke Dashboard →" : "Hubungkan Wallet Terlebih Dahulu"}
              </button>
            </form>
          )}

          {/* Continue as Guest Button */}
          <div className="pt-3 border-t border-slate-100 text-center">
            <button
              type="button"
              onClick={onContinueAsGuest}
              className="btn-press text-xs font-semibold text-slate-500 hover:text-blue-600 transition cursor-pointer"
            >
              Lanjut sebagai Tamu (Mode Eksplorasi) →
            </button>
          </div>
        </div>

        {/* Footer Disclaimer */}
        <p className="text-[11px] text-slate-400 text-center leading-relaxed">
          Demo Akademik Kelompok 8 TI-B • Seluruh token mock di Sepolia bernilai 0
        </p>
      </div>
    </div>
  );
}
