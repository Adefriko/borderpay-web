"use client";
import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { getLocalInvoices, clearLocalInvoices } from "../lib/invoiceStore";
import { IconCopy, IconCheck, IconExternalLink, IconSearch } from "./Icons";

export default function InvoiceHistoryModal({ isOpen, onClose, onRecreateInvoice }) {
  const [copiedId, setCopiedId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // "all" | "active" | "expired"
  const [showQrInline, setShowQrInline] = useState(false);
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [confirmClear, setConfirmClear] = useState(false);
  const [currentTimestamp] = useState(() => Math.floor(Date.now() / 1000));
  const [, setRefreshCount] = useState(0);

  if (!isOpen) return null;

  const invoices = getLocalInvoices();

  const isExpired = (deadline) => {
    if (!deadline) return false;
    return currentTimestamp > deadline;
  };

  const filtered = invoices
    .filter((inv) => {
      const expired = isExpired(inv.deadline);
      if (statusFilter === "active" && expired) return false;
      if (statusFilter === "expired" && !expired) return false;

      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        (inv.memo && inv.memo.toLowerCase().includes(q)) ||
        (inv.orderId && inv.orderId.toLowerCase().includes(q)) ||
        (inv.receiver && inv.receiver.toLowerCase().includes(q))
      );
    })
    .sort((a, b) =>
      sortNewestFirst ? (b.createdAt || 0) - (a.createdAt || 0) : (a.createdAt || 0) - (b.createdAt || 0)
    );

  const copyLink = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "-";
    const d = new Date(ts * 1000);
    return (
      d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }) +
      ", " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/45 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[88vh] rounded-3xl bg-white/95 backdrop-blur-xl border border-white shadow-2xl p-6 text-slate-800 flex flex-col space-y-4 animate-modal-pop">
        
        {/* Header (Matched to Figma Image 6) */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-extrabold text-[#0B192C]">Riwayat Invoice Lokal</h3>
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase">
                Local-Only Demo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar tagihan QR yang dibuat di browser ini.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-press w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Info Banner */}
        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500 leading-relaxed">
          ℹ️ Tersimpan di <code className="font-mono text-slate-700">localStorage</code> browser ini. Tidak tersinkron ke server atau perangkat lain. Status terkonfirmasi hanya ditampilkan jika pembayaran dicocokkan dengan bukti blockchain.
        </div>

        {/* Search & Filter Row */}
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <IconSearch className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari memo, Order ID, atau alamat wallet"
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold">
              {[
                { id: "all", label: "Semua" },
                { id: "active", label: "Aktif" },
                { id: "expired", label: "Kedaluwarsa" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1 rounded-lg transition cursor-pointer ${
                    statusFilter === tab.id
                      ? "bg-white text-[#0B192C] shadow-2xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <span>Tampilkan QR</span>
              <input
                type="checkbox"
                checked={showQrInline}
                onChange={(e) => setShowQrInline(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#1951FC] cursor-pointer"
              />
            </label>

            <button
              type="button"
              onClick={() => setSortNewestFirst((v) => !v)}
              className="font-bold text-blue-600 hover:underline cursor-pointer"
            >
              ⇅ Urutkan ({sortNewestFirst ? "Terbaru" : "Terlama"})
            </button>
          </div>
        </div>

        {/* Destructive Confirmation Overlay */}
        {confirmClear ? (
          <div className="p-6 rounded-2xl bg-rose-50/90 border border-rose-200 text-center space-y-4 my-auto animate-modal-pop">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-lg">
              🔒
            </div>
            <div>
              <h4 className="text-base font-extrabold text-[#0B192C]">Hapus riwayat lokal?</h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto mt-1">
                Tindakan ini hanya menghapus daftar invoice di browser ini. Tidak membatalkan transaksi blockchain yang sudah terjadi.
              </p>
            </div>
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmClear(false)}
                className="btn-press px-5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  clearLocalInvoices();
                  setConfirmClear(false);
                  setRefreshCount((c) => c + 1);
                }}
                className="btn-press px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold cursor-pointer"
              >
                Hapus Riwayat
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {filtered.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                  📄
                </div>
                <p className="text-sm font-extrabold text-slate-700">Belum ada invoice lokal</p>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Invoice yang dibuat di browser ini akan muncul di sini untuk memudahkan pelacakan Anda.
                </p>
              </div>
            ) : (
              filtered.map((inv) => {
                const expired = isExpired(inv.deadline);
                const sym = inv.tokenSymbol || "mUSD";
                const badgeShort = sym.slice(0, 2);
                const badgeColor =
                  sym === "mUSD"
                    ? "bg-sky-50 text-sky-700"
                    : sym === "mEUR"
                    ? "bg-teal-50 text-teal-700"
                    : "bg-indigo-50 text-indigo-700";

                return (
                  <div
                    key={inv.orderId}
                    className="p-4 rounded-2xl bg-slate-50/75 border border-slate-200/80 hover:border-blue-300 transition space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className={`w-9 h-9 rounded-xl ${badgeColor} font-extrabold text-xs flex items-center justify-center flex-shrink-0`}>
                          {badgeShort}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-base font-extrabold ${expired ? "line-through text-slate-400" : "text-[#0B192C]"}`}>
                              {inv.amount}
                            </span>
                            <span className="text-xs font-bold text-slate-500">{sym}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-700">{inv.memo || "Pembayaran Tagihan"}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
                            {formatTimestamp(inv.createdAt)} • {inv.orderId.slice(0, 10)}...
                          </p>
                        </div>
                      </div>

                      <span
                        className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                          expired
                            ? "bg-slate-100 text-slate-500 border border-slate-200"
                            : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        }`}
                      >
                        {expired ? "‹ Kedaluwarsa" : "✓ Aktif"}
                      </span>
                    </div>

                    {showQrInline && inv.link && (
                      <div className="flex justify-center p-3 rounded-xl bg-white border border-slate-200">
                        <QRCodeSVG value={inv.link} size={110} level="M" />
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                      <span className="text-[11px] font-mono text-slate-500">
                        {inv.receiver ? `${inv.receiver.slice(0, 6)}..${inv.receiver.slice(-4)}` : "-"}
                      </span>

                      <div className="flex items-center gap-2">
                        {expired && onRecreateInvoice ? (
                          <button
                            type="button"
                            onClick={() => {
                              onRecreateInvoice(inv);
                              onClose();
                            }}
                            className="btn-press px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 cursor-pointer"
                          >
                            ↻ Buat Ulang
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => copyLink(inv.link, inv.orderId)}
                              className="btn-press px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer"
                            >
                              {copiedId === inv.orderId ? (
                                <>
                                  <IconCheck className="w-3.5 h-3.5 text-emerald-500" />
                                  <span>Tersalin!</span>
                                </>
                              ) : (
                                <>
                                  <IconCopy className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Salin Link</span>
                                </>
                              )}
                            </button>

                            <Link
                              href={inv.link || `/pay?orderId=${inv.orderId}`}
                              target="_blank"
                              className="btn-press px-3.5 py-1.5 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-xs font-bold text-white flex items-center gap-1 shadow-2xs"
                            >
                              <span>Buka Pembayaran</span>
                              <IconExternalLink className="w-3 h-3" />
                            </Link>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-500">
            <strong className="text-slate-800">{invoices.length}</strong> invoice tersimpan di browser ini
          </span>
          <div className="flex items-center gap-3">
            {invoices.length > 0 && !confirmClear && (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                className="text-rose-600 hover:text-rose-700 text-xs font-bold cursor-pointer"
              >
                Hapus Riwayat Lokal
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-press px-5 py-2 rounded-xl bg-[#0B192C] hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
