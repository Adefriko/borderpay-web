"use client";
import { useState } from "react";
import Link from "next/link";
import { getLocalInvoices, clearLocalInvoices } from "../lib/invoiceStore";
import { TokenIcon, IconCopy, IconCheck, IconExternalLink } from "./Icons";

export default function InvoiceHistoryModal({ isOpen, onClose }) {
  const [copiedId, setCopiedId] = useState("");
  const [, setRefreshCount] = useState(0);

  if (!isOpen) return null;

  const invoices = getLocalInvoices();
  const currentTimestamp = Math.floor(new Date().getTime() / 1000);

  const copyLink = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  const formatTimestamp = (ts) => {
    if (!ts) return "-";
    const d = new Date(ts * 1000);
    return (
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      ", " +
      d.toLocaleDateString()
    );
  };

  const isExpired = (deadline) => {
    if (!deadline) return false;
    return currentTimestamp > deadline;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[85vh] rounded-3xl bg-white border border-slate-200/90 shadow-2xl p-6 text-slate-800 flex flex-col space-y-5 animate-modal-pop">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#0B192C]">Riwayat Invoice Lokal</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Local-Only Demo
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Daftar tagihan QR yang dibuat di browser ini (Penyimpanan localStorage)
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn-press w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {invoices.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center mx-auto text-slate-400">
                📄
              </div>
              <p className="text-sm font-semibold text-slate-700">Belum ada invoice lokal</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Invoice yang Anda buat pada menu Buat QR Invoice akan otomatis tersimpan di sini.
              </p>
            </div>
          ) : (
            invoices.map((inv) => {
              const expired = isExpired(inv.deadline);
              return (
                <div
                  key={inv.orderId}
                  className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <TokenIcon symbol={inv.tokenSymbol || "mUSD"} size="w-7 h-7" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-base font-extrabold text-[#0B192C]">
                            {inv.amount} {inv.tokenSymbol || "mUSD"}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                              expired
                                ? "bg-rose-50 text-rose-600 border border-rose-200"
                                : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            }`}
                          >
                            {expired ? "Kedaluwarsa" : "Aktif"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{inv.memo || "Pembayaran Tagihan"}</p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Dibuat:</span>
                      <span className="text-[11px] font-mono text-slate-700">
                        {formatTimestamp(inv.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 font-mono">
                    <div>
                      <span className="text-slate-400">Order ID: </span>
                      <span className="text-slate-800">{inv.orderId.slice(0, 10)}...</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Penerima: </span>
                      <span className="text-slate-800">
                        {inv.receiver ? `${inv.receiver.slice(0, 6)}...${inv.receiver.slice(-4)}` : "-"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => copyLink(inv.link, inv.orderId)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                    >
                      {copiedId === inv.orderId ? (
                        <>
                          <IconCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Tersalin!</span>
                        </>
                      ) : (
                        <>
                          <IconCopy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Salin Link</span>
                        </>
                      )}
                    </button>

                    <Link
                      href={inv.link || `/pay?orderId=${inv.orderId}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white flex items-center gap-1.5 transition shadow-2xs"
                    >
                      <span>Buka Pembayaran</span>
                      <IconExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <button
            type="button"
            onClick={() => {
              if (confirm("Hapus seluruh riwayat invoice lokal?")) {
                clearLocalInvoices();
                setRefreshCount((c) => c + 1);
              }
            }}
            className="text-rose-600 hover:text-rose-700 text-xs underline cursor-pointer"
          >
            Hapus Riwayat Lokal
          </button>
          <span className="text-[11px] text-slate-500">
            {invoices.length} Invoice Tersimpan
          </span>
        </div>
      </div>
    </div>
  );
}
