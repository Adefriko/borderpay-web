"use client";
import { useState, useEffect } from "react";
import { registerUser, loginUser, findUserByAddress, logoutUser } from "../lib/auth";
import { IconCheck, IconCopy, IconStore } from "./Icons";
import { TOKENS } from "../constants/contracts";

export default function AuthModal({
  isOpen,
  onClose,
  walletAddress,
  onConnectWallet,
  currentUser,
  onAuthSuccess,
}) {
  const [tab, setTab] = useState("signup"); // "login" | "signup"
  const [isEditing, setIsEditing] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [name, setName] = useState("");
  const [storeName, setStoreName] = useState("");
  const [email, setEmail] = useState("");
  const [businessType, setBusinessType] = useState("Kuliner & Minuman");
  const [preferredCurrency, setPreferredCurrency] = useState("mUSD");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (currentUser && isOpen) {
      setName(currentUser.name || "");
      setStoreName(currentUser.storeName || "");
      setEmail(currentUser.email || "");
      setBusinessType(currentUser.businessType || "Kuliner & Minuman");
      setPreferredCurrency(currentUser.preferredCurrency || "mUSD");
    }
  }, [currentUser, isOpen]);

  const existingAccount = walletAddress ? findUserByAddress(walletAddress) : null;

  if (!isOpen) return null;

  const copyAddr = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    const targetAddr = walletAddress || currentUser?.address;
    if (!targetAddr) {
      return setErrorMsg("Hubungkan wallet untuk mendaftar atau memperbarui profil.");
    }
    if (!storeName.trim()) {
      return setErrorMsg("Nama toko wajib diisi.");
    }
    if (!name.trim()) {
      return setErrorMsg("Nama penanggung jawab wajib diisi.");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return setErrorMsg("Format email tidak valid.");
    }

    try {
      const user = registerUser({
        address: targetAddr,
        name,
        storeName: storeName.trim(),
        email,
        businessType,
        preferredCurrency,
      });

      setSuccessMsg(isEditing ? "Profil lokal berhasil diperbarui." : "Profil lokal berhasil dibuat.");
      setIsEditing(false);
      setTimeout(() => {
        onAuthSuccess(user);
        onClose();
      }, 650);
    } catch (err) {
      setErrorMsg(err.message || "Gagal menyimpan profil.");
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!walletAddress) {
      return setErrorMsg("Harap hubungkan dompet terlebih dahulu.");
    }

    const user = loginUser(walletAddress);
    if (!user) {
      return setErrorMsg("Wallet ini belum terdaftar. Silakan beralih ke tab Daftar.");
    }

    setSuccessMsg(`Selamat datang kembali, ${user.storeName || user.name}!`);
    setTimeout(() => {
      onAuthSuccess(user);
      onClose();
    }, 600);
  };

  const handleLogout = () => {
    logoutUser();
    setConfirmLogout(false);
    setIsEditing(false);
    onAuthSuccess(null);
    onClose();
  };

  const showForm = !currentUser ? tab === "signup" : isEditing;
  const initials = currentUser?.storeName ? currentUser.storeName.slice(0, 2).toUpperCase() : "KN";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl border border-white rounded-3xl p-6 sm:p-7 shadow-2xl space-y-5 text-slate-800 animate-modal-pop max-h-[90vh] overflow-y-auto">
        
        {/* Header (Matched to Figma Image 8) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <IconStore className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B192C]">Akun & Profil Merchant</h3>
              <p className="text-[11px] text-slate-500">
                Profil lokal untuk demo. Bukan autentikasi produksi.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsEditing(false);
              setConfirmLogout(false);
              onClose();
            }}
            className="btn-press w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status Dompet Card */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
              STATUS DOMPET (SEPOLIA)
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`w-2 h-2 rounded-full ${
                  walletAddress ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
                }`}
              />
              <span className="text-xs font-mono font-bold text-[#0B192C]">
                {walletAddress
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : "Belum terhubung"}
              </span>
              {walletAddress && (
                <button
                  type="button"
                  onClick={() => copyAddr(walletAddress)}
                  className="text-slate-400 hover:text-blue-600 cursor-pointer"
                >
                  {copied ? <IconCheck className="w-3.5 h-3.5 text-emerald-500" /> : <IconCopy className="w-3.5 h-3.5" />}
                </button>
              )}
            </div>
          </div>

          {!walletAddress ? (
            <button
              type="button"
              onClick={onConnectWallet}
              className="btn-press px-4 py-2 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Connect Wallet
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
              ● Terhubung
            </span>
          )}
        </div>

        {/* Switcher Masuk / Daftar */}
        {!currentUser && (
          <div className="grid grid-cols-2 p-1 bg-slate-100 border border-slate-200/80 rounded-2xl text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setTab("login");
                setErrorMsg("");
              }}
              className={`py-2 rounded-xl transition cursor-pointer ${
                tab === "login"
                  ? "bg-white text-[#0B192C] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Masuk
            </button>
            <button
              type="button"
              onClick={() => {
                setTab("signup");
                setErrorMsg("");
              }}
              className={`py-2 rounded-xl transition cursor-pointer ${
                tab === "signup"
                  ? "bg-white text-[#0B192C] shadow-xs"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              Daftar
            </button>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            ⚠️ {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold flex items-center gap-1.5">
            <IconCheck className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Login View */}
        {!currentUser && tab === "login" && (
          <form onSubmit={handleLogin} className="space-y-4">
            {existingAccount ? (
              <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl bg-[#1951FC] text-white font-extrabold flex items-center justify-center text-sm">
                    {existingAccount.storeName ? existingAccount.storeName.slice(0, 2).toUpperCase() : "KN"}
                  </span>
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 uppercase block">
                      Profil ditemukan
                    </span>
                    <h4 className="text-sm font-extrabold text-[#0B192C]">{existingAccount.storeName}</h4>
                  </div>
                </div>
                <button
                  type="submit"
                  className="btn-press px-4 py-2 rounded-xl bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
                >
                  Masuk
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-2">
                <p className="text-xs text-slate-500">
                  {walletAddress
                    ? "Alamat wallet ini belum terdaftar di profil lokal browser."
                    : "Hubungkan wallet Anda untuk menemukan profil tersimpan."}
                </p>
                <button
                  type="button"
                  onClick={() => setTab("signup")}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Daftar Profil Baru →
                </button>
              </div>
            )}
          </form>
        )}

        {/* Register / Edit Form View */}
        {showForm && (
          <form onSubmit={handleSaveProfile} className="space-y-3.5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Merchant / Toko
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kopi Nusantara"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Nama Penanggung Jawab
                </label>
                <input
                  type="text"
                  required
                  placeholder="Nama lengkap"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Kontak</label>
              <input
                type="email"
                placeholder="nama@usaha.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Email hanya disimpan di browser ini.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Usaha</label>
                <select
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:outline-none focus:border-blue-500 transition cursor-pointer"
                >
                  <option value="Kuliner & Minuman">Kuliner & Minuman</option>
                  <option value="F&B / Kafe & Resto">F&B / Kafe & Resto</option>
                  <option value="Jasa IT / Digital">Jasa IT / Digital</option>
                  <option value="Retail & Toko">Retail & Toko</option>
                  <option value="E-Commerce">E-Commerce</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Valuta Default</label>
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

            <div>
              <label className="block font-bold text-slate-700 mb-1">Wallet terhubung</label>
              <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 font-mono text-slate-600">
                {walletAddress || currentUser?.address || "Belum terhubung"}
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              {isEditing && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="btn-press px-4 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                disabled={!walletAddress && !currentUser?.address}
                className="btn-press flex-1 py-3 rounded-2xl bg-[#1951FC] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-sm transition cursor-pointer"
              >
                {isEditing ? "Simpan Perubahan Profil" : "Daftar Profil Merchant Lokal"}
              </button>
            </div>
          </form>
        )}

        {/* Active Profile Detail View (Matched to Figma Image 8 State 7 & 8) */}
        {currentUser && !isEditing && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#1951FC] text-white font-extrabold flex items-center justify-center text-sm shadow-xs">
                    {initials}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-[#0B192C]">{currentUser.storeName}</h4>
                    <p className="text-[11px] text-slate-500">{currentUser.businessType}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Valuta Default</span>
                  <span className="text-xs font-extrabold text-blue-600">{currentUser.preferredCurrency}</span>
                </div>
              </div>

              <div className="space-y-1.5 pt-2.5 border-t border-slate-200 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Penanggung Jawab:</span>
                  <span className="font-semibold text-slate-800">{currentUser.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email:</span>
                  <span className="text-slate-800">{currentUser.email || "-"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wallet Address:</span>
                  <span className="font-mono text-slate-800">
                    {currentUser.displayAddress
                      ? `${currentUser.displayAddress.slice(0, 6)}...${currentUser.displayAddress.slice(-4)}`
                      : "-"}
                  </span>
                </div>
              </div>
            </div>

            {confirmLogout ? (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-3 animate-modal-pop">
                <div>
                  <h5 className="font-extrabold text-xs text-rose-900">Keluar dari profil lokal?</h5>
                  <p className="text-[11px] text-rose-700 mt-0.5">
                    Profil tetap tersimpan di browser ini. Anda dapat masuk kembali kapan saja.
                  </p>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setConfirmLogout(false)}
                    className="btn-press px-4 py-2 rounded-xl bg-white border border-rose-200 text-xs font-bold text-slate-700 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="btn-press px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
                  >
                    Keluar
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="btn-press py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
                >
                  Edit Profil
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmLogout(true)}
                  className="btn-press py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs border border-rose-200 transition cursor-pointer"
                >
                  Keluar
                </button>
              </div>
            )}
          </div>
        )}

        <p className="text-[10px] text-slate-400 text-center leading-relaxed pt-1">
          Data profil disimpan di localStorage browser ini sebagai demo. Tidak ada password, verifikasi KYC, atau sesi server.
        </p>
      </div>
    </div>
  );
}
