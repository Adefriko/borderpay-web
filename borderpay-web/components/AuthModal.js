"use client";
import { useState, useEffect } from "react";
import { registerUser, loginUser, findUserByAddress, logoutUser } from "../lib/auth";
import { IconWallet, IconCheck, IconBorderPayLogo, TokenIcon } from "./Icons";
import { TOKENS } from "../constants/contracts";

export default function AuthModal({
  isOpen,
  onClose,
  walletAddress,
  onConnectWallet,
  currentUser,
  onAuthSuccess,
}) {
  const [tab, setTab] = useState("signup"); // "login" | "signup" | "profile"
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState("F&B / Kafe & Resto");
  const [preferredCurrency, setPreferredCurrency] = useState("mUSD");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const existingAccount = walletAddress ? findUserByAddress(walletAddress) : null;

  useEffect(() => {
    if (!isOpen) return;
    setErrorMsg("");
    setSuccessMsg("");
    if (currentUser) {
      setTab("profile");
    } else if (existingAccount) {
      setTab("login");
    } else {
      setTab("signup");
    }
  }, [isOpen, walletAddress, currentUser]);

  if (!isOpen) return null;

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

      setSuccessMsg("Akun berhasil didaftarkan dan terhubung!");
      setTimeout(() => {
        onAuthSuccess(user);
        onClose();
      }, 800);
    } catch (err) {
      setErrorMsg(err.message || "Gagal mendaftarkan akun.");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!walletAddress) {
      return setErrorMsg("Harap hubungkan dompet terlebih dahulu!");
    }

    const user = loginUser(walletAddress);
    if (!user) {
      return setErrorMsg("Wallet ini belum terdaftar. Silakan beralih ke tab Daftar.");
    }

    setSuccessMsg(`Selamat datang kembali, ${user.storeName || user.name}!`);
    setTimeout(() => {
      onAuthSuccess(user);
      onClose();
    }, 800);
  };

  const handleLogout = () => {
    logoutUser();
    onAuthSuccess(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <IconBorderPayLogo className="w-8 h-8" />
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {currentUser ? "Profil Akun Merchant" : "Akun & Autentikasi Wallet"}
              </h3>
              <p className="text-[11px] text-slate-500">BorderPay Web3 Identity</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Wallet Connection Status Bar */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={`w-3 h-3 rounded-full ${walletAddress ? "bg-emerald-500" : "bg-amber-500"}`} />
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                Status Dompet (Sepolia)
              </p>
              <p className="text-xs font-mono font-bold text-slate-800">
                {walletAddress
                  ? `${walletAddress.slice(0, 8)}...${walletAddress.slice(-6)}`
                  : "Belum Terhubung"}
              </p>
            </div>
          </div>

          {!walletAddress && (
            <button
              type="button"
              onClick={onConnectWallet}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition flex items-center gap-1 cursor-pointer"
            >
              <IconWallet className="w-3.5 h-3.5" />
              <span>Connect</span>
            </button>
          )}
        </div>

        {/* Tab Switcher (Sign In vs Sign Up) */}
        {!currentUser && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-2xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setErrorMsg("");
              }}
              className={`py-2 rounded-xl transition ${
                tab === "login"
                  ? "bg-white text-indigo-600 shadow-sm"
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
              }}
              className={`py-2 rounded-xl transition ${
                tab === "signup"
                  ? "bg-white text-indigo-600 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Daftar (Sign Up)
            </button>
          </div>
        )}

        {/* Notification Alert */}
        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-1.5">
            <IconCheck className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* TAB 1: LOGIN */}
        {!currentUser && tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            {existingAccount ? (
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                    {existingAccount.storeName ? existingAccount.storeName[0].toUpperCase() : "M"}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{existingAccount.storeName}</h4>
                    <p className="text-xs text-slate-500">Pemilik: {existingAccount.name}</p>
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 pt-1 border-t border-indigo-100 flex justify-between">
                  <span>Kategori: {existingAccount.businessType}</span>
                  <span>Valuta: {existingAccount.preferredCurrency}</span>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <p className="text-xs text-slate-600">
                  {walletAddress
                    ? "Alamat wallet ini belum terdaftar sebagai akun merchant."
                    : "Silakan hubungkan wallet Anda terlebih dahulu."}
                </p>
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className="text-xs font-semibold text-indigo-600 hover:underline"
                >
                  Daftar Akun Baru Sekarang →
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={!walletAddress || !existingAccount}
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer"
            >
              Masuk ke Dashboard Merchant
            </button>
          </form>
        )}

        {/* TAB 2: SIGN UP */}
        {!currentUser && tab === "signup" && (
          <form onSubmit={handleRegister} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Nama Merchant / Toko <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Kopi Senja Nusantara"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Penanggung Jawab <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama Lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Bisnis</label>
                <input
                  type="email"
                  placeholder="merchant@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Kategori Usaha</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                >
                  <option value="F&B / Kafe & Resto">F&B / Kafe & Resto</option>
                  <option value="Jasa IT / Digital">Jasa IT / Digital</option>
                  <option value="Retail & Toko">Retail & Toko</option>
                  <option value="Ekspor & Impor">Ekspor & Impor</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Valuta Default</label>
                <select
                  value={preferredCurrency}
                  onChange={(e) => setPreferredCurrency(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
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
              className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition cursor-pointer mt-2"
            >
              Daftar & Hubungkan ke Wallet
            </button>
          </form>
        )}

        {/* TAB 3: CURRENT PROFILE (LOGGED IN) */}
        {currentUser && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold flex items-center justify-center text-lg shadow-md shadow-indigo-600/20">
                  {currentUser.storeName ? currentUser.storeName[0].toUpperCase() : "M"}
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-base font-bold text-slate-900">{currentUser.storeName}</h4>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">Pemilik: {currentUser.name}</p>
                </div>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-200 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Wallet:</span>
                  <span className="font-mono text-slate-700">
                    {currentUser.displayAddress || currentUser.address}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-700">{currentUser.email || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kategori:</span>
                  <span className="text-slate-700">{currentUser.businessType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Valuta Default:</span>
                  <span className="font-semibold text-indigo-600">{currentUser.preferredCurrency}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-3 rounded-2xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs border border-red-200 transition cursor-pointer"
            >
              Keluar dari Akun (Logout)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
