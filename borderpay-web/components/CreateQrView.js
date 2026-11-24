"use client";
import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import Link from "next/link";
import { TOKENS } from "../constants/contracts";
import {
  TokenIcon,
  IconCopy,
  IconCheck,
  IconDownload,
  IconExternalLink,
  IconClock,
  IconBorderPayMark,
} from "./Icons";
import { useToast } from "./ToastContext";

export default function CreateQrView({
  receiver,
  setReceiver,
  amount,
  setAmount,
  tokenOut,
  setTokenOut,
  memo,
  setMemo,
  expiryMinutes,
  setExpiryMinutes,
  merchantName,
  setMerchantName,
  onGenerate,
  walletAddress,
  paymentLink,
  orderIdDisplay,
  timeRemaining,
  formatTimer,
  downloadQrCode,
  copyPaymentLink,
  copiedLink,
}) {
  const toast = useToast();
  const [showStatePreviews, setShowStatePreviews] = useState(false);

  const selectedToken =
    TOKENS.find((t) => t.address.toLowerCase() === tokenOut.toLowerCase()) || TOKENS[0];

  const shortReceiver = receiver
    ? `${receiver.slice(0, 6)}...${receiver.slice(-4)}`
    : walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : "0x71C7...9A3F";

  const shortOrderId = orderIdDisplay
    ? `${orderIdDisplay.slice(0, 12)}...`
    : "INV-7F3A-2291";

  const useConnectedWallet = () => {
    if (walletAddress) {
      setReceiver(walletAddress);
      toast.info("Alamat Dimuat", walletAddress);
    } else {
      toast.error("Wallet Belum Terhubung", "Hubungkan wallet terlebih dahulu.");
    }
  };

  const isExpired = timeRemaining <= 0 && paymentLink;

  return (
    <div className="space-y-6 text-[#0B192C]">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0B192C] tracking-tight">
          Buat Invoice QR
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Susun permintaan pembayaran mock-token dan bagikan sebagai QR di Ethereum Sepolia Testnet.
        </p>
      </div>

      {/* 2. Main 2-Column Grid matching Figma Image 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Form Card (7 Cols) */}
        <div className="lg:col-span-7 p-6 sm:p-7 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-5">
          <form onSubmit={onGenerate} className="space-y-4">
            
            {/* Alamat Penerima */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Alamat penerima
                </label>
                <button
                  type="button"
                  onClick={useConnectedWallet}
                  className="btn-press text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                >
                  Gunakan wallet terhubung
                </button>
              </div>
              <input
                type="text"
                value={receiver}
                onChange={(e) => setReceiver(e.target.value)}
                placeholder="0x71C7...9A3F"
                required
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition"
              />
            </div>

            {/* Nama Merchant (Opsional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">
                Nama merchant (opsional)
              </label>
              <input
                type="text"
                value={merchantName}
                onChange={(e) => setMerchantName(e.target.value)}
                placeholder="Toko Kopi Nusantara"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition"
              />
            </div>

            {/* Row: Jumlah & Token Selector Pills */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
              {/* Jumlah */}
              <div className="sm:col-span-6 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Jumlah</label>
                <input
                  type="number"
                  step="any"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="250.00"
                  required
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-extrabold text-[#0B192C] placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition"
                />
                <span className="text-[10px] text-slate-400 block font-medium">
                  Maksimum mock: 10,000.00
                </span>
              </div>

              {/* Token Selector Pills */}
              <div className="sm:col-span-6 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Token</label>
                <div className="flex items-center gap-1.5">
                  {TOKENS.map((tok) => {
                    const isSel = tokenOut.toLowerCase() === tok.address.toLowerCase();
                    return (
                      <button
                        key={tok.symbol}
                        type="button"
                        onClick={() => setTokenOut(tok.address)}
                        className={`flex-1 flex items-center justify-center gap-1 py-2 px-2 rounded-2xl border text-xs font-bold transition cursor-pointer ${
                          isSel
                            ? "border-blue-600 bg-blue-50/80 text-blue-700 shadow-2xs"
                            : "border-slate-200 bg-slate-50/80 hover:bg-slate-100 text-slate-600"
                        }`}
                      >
                        <TokenIcon symbol={tok.symbol} size="w-3.5 h-3.5" />
                        <span>{tok.symbol}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Memo Invoice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Memo invoice</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="Contoh: Pembayaran pesanan #A-024"
                className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 focus:outline-none transition"
              />
            </div>

            {/* Kedaluwarsa Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Kedaluwarsa</label>
              <div className="flex items-center gap-2">
                {[
                  { val: "5", label: "5 menit" },
                  { val: "15", label: "15 menit" },
                  { val: "60", label: "1 jam" },
                  { val: "1440", label: "24 jam" },
                ].map((exp) => (
                  <button
                    key={exp.val}
                    type="button"
                    onClick={() => setExpiryMinutes(exp.val)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                      expiryMinutes === exp.val
                        ? "bg-[#1951FC] text-white shadow-2xs"
                        : "bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600"
                    }`}
                  >
                    {exp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Generate Button */}
            <div className="pt-2">
              <button
                type="submit"
                className="btn-press w-full py-3 rounded-2xl bg-[#1951FC] hover:bg-blue-600 text-white font-extrabold text-sm shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                Generate QR
              </button>
              <p className="text-[11px] text-slate-400 text-center mt-2 font-medium">
                ℹ️ Membuat invoice belum berarti pembayaran berhasil.
              </p>
            </div>
          </form>
        </div>

        {/* Right Column: Vibrant Royal Blue Preview Card (5 Cols, Matching Figma Image 1) */}
        <div className="lg:col-span-5 rounded-3xl p-6 sm:p-7 bg-gradient-to-b from-[#1951FC] via-[#1444E0] to-[#0B2CB1] text-white shadow-xl shadow-blue-900/20 space-y-5 relative overflow-hidden">
          
          {/* Card Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-extrabold text-xs text-white">
                B
              </div>
              <span className="font-extrabold text-base tracking-tight text-white">
                BorderPay
              </span>
            </div>

            <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-extrabold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isExpired ? "Kedaluwarsa" : "Aktif"}</span>
            </span>
          </div>

          {/* Centered White Rounded QR Container */}
          <div className="flex justify-center py-2">
            <div className="p-4 rounded-3xl bg-white shadow-lg shadow-black/10 flex items-center justify-center">
              <QRCodeSVG
                id="borderpay-qr-code"
                value={paymentLink || "https://borderpay.finance/preview"}
                size={180}
                level="M"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Amount & Subtitle */}
          <div className="text-center space-y-0.5">
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              {amount || "250.00"} {selectedToken.symbol}
            </div>
            <div className="text-[10px] uppercase font-bold tracking-widest text-blue-200">
              SEPOLIA TESTNET · MOCK TOKEN
            </div>
          </div>

          {/* Metadata Rows */}
          <div className="space-y-2 py-3 border-y border-white/15 text-xs text-blue-100">
            <div className="flex justify-between">
              <span className="text-blue-200/70">Penerima</span>
              <span className="font-mono font-bold text-white truncate max-w-[200px]">
                {shortReceiver}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200/70">Invoice ID</span>
              <span className="font-mono text-white">{shortOrderId}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-200/70">Memo</span>
              <span className="text-white font-medium truncate max-w-[200px]">
                {memo || "Pembayaran pesanan #A-024"}
              </span>
            </div>
          </div>

          {/* Countdown Clock Ring Pill */}
          <div className="flex items-center justify-center gap-2 py-1">
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs text-white">
              <IconClock className="w-3.5 h-3.5 text-blue-300" />
              <span className="text-[10px] uppercase font-bold text-blue-200 tracking-wider">
                BERLAKU SELAMA
              </span>
              <span className="font-mono font-extrabold text-white text-sm">
                {timeRemaining > 0 ? formatTimer(timeRemaining) : "14:52"}
              </span>
            </div>
          </div>

          {/* 2 Buttons: Salin link & Unduh PNG */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={copyPaymentLink}
              className="btn-press py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <IconCopy className="w-3.5 h-3.5" />
              <span>{copiedLink ? "Tersalin!" : "Salin link"}</span>
            </button>

            <button
              type="button"
              onClick={downloadQrCode}
              className="btn-press py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
            >
              <IconDownload className="w-3.5 h-3.5" />
              <span>Unduh PNG</span>
            </button>
          </div>

          {/* Large Bottom White Button */}
          {paymentLink ? (
            <Link
              href={paymentLink}
              target="_blank"
              className="btn-press block w-full py-3 rounded-2xl bg-white hover:bg-slate-100 text-[#1951FC] font-extrabold text-xs text-center shadow-md transition"
            >
              Buka Halaman Pembayaran
            </Link>
          ) : (
            <button
              type="button"
              onClick={onGenerate}
              className="btn-press w-full py-3 rounded-2xl bg-white hover:bg-slate-100 text-[#1951FC] font-extrabold text-xs text-center shadow-md transition cursor-pointer"
            >
              Buka Halaman Pembayaran
            </button>
          )}
        </div>
      </div>

      {/* 3. Bottom State Badges Bar (Matching Figma Image 1) */}
      <div className="pt-4 border-t border-slate-200 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-slate-300" />
              <span>KOSONG</span>
            </span>
            <span className="flex items-center gap-1 text-blue-600">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>DIBUAT</span>
            </span>
            <span className="flex items-center gap-1 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>AKTIF</span>
            </span>
            <span className="flex items-center gap-1 text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>KEDALUWARSA</span>
            </span>
            <span className="flex items-center gap-1 text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>INVALID</span>
            </span>
          </div>

          <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full flex items-center gap-1.5">
            <span>ℹ️</span>
            <span>Invoice sync with Sepolia Testnet nodes.</span>
          </span>
        </div>

        {/* State Previews (Expired & Invalid cards as in Figma) */}
        <div>
          <button
            type="button"
            onClick={() => setShowStatePreviews(!showStatePreviews)}
            className="text-xs font-bold text-slate-500 hover:text-blue-600 transition flex items-center gap-1.5"
          >
            <span>{showStatePreviews ? "▼ Sembunyikan" : "► Tampilkan"} State Previews (Expired & Invalid)</span>
          </button>

          {showStatePreviews && (
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-amber-700 block">
                  ⏱ EXPIRED
                </span>
                <p className="text-xs text-amber-900 font-medium">
                  Invoice kedaluwarsa. Buat invoice baru untuk melanjutkan.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-1">
                <span className="text-[10px] font-extrabold uppercase text-rose-700 block">
                  ⚠ INVALID
                </span>
                <p className="text-xs text-rose-900 font-medium">
                  Data invoice tidak valid. Periksa alamat atau jumlah.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
