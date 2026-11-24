"use client";
import { useState } from "react";
import { CONTRACT_ADDRESSES } from "../constants/contracts";
import {
  TokenIcon,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconRefresh,
  IconDownload,
  IconSearch,
} from "./Icons";
import { useToast } from "./ToastContext";

export default function LedgerView({
  history = [],
  isLoading = false,
  onRefresh,
  onExportCsv,
  onOpenReceipt,
}) {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenFilter, setTokenFilter] = useState("ALL");
  const [selectedTx, setSelectedTx] = useState(null);
  const [copiedHash, setCopiedHash] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showStatePreviews, setShowStatePreviews] = useState(false);

  const copyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    toast.info("Tersalin", `${label} disalin ke clipboard.`);
    setTimeout(() => setCopiedHash(""), 2000);
  };

  const copySummary = (tx) => {
    const summary = `BorderPay Transaction\nHash: ${tx.txHash}\nPair: ${tx.pair}\nAmount: ${tx.amountIn} ${tx.tokenInSymbol} → ${tx.amountOut} ${tx.tokenOutSymbol}\nReceiver: ${tx.receiver}\nBlock: ${tx.blockNumber || "Sepolia"}`;
    navigator.clipboard.writeText(summary);
    toast.success("Ringkasan Tersalin", "Detail transaksi disalin.");
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.orderId && item.orderId.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.receiver && item.receiver.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.sender && item.sender.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesToken =
      tokenFilter === "ALL" ||
      item.tokenInSymbol === tokenFilter ||
      item.tokenOutSymbol === tokenFilter;

    return matchesSearch && matchesToken;
  });

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(filteredHistory.length / pageSize));
  const displayedHistory = filteredHistory.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Active detail tx (defaults to first item if none selected)
  const activeTx = selectedTx || (displayedHistory.length > 0 ? displayedHistory[0] : null);

  const gatewayShort = `${CONTRACT_ADDRESSES.CoinSwapPayment.slice(0, 6)}...${CONTRACT_ADDRESSES.CoinSwapPayment.slice(-4)}`;

  return (
    <div className="space-y-6 text-[#0B192C]">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B192C] tracking-tight">
          On-Chain Ledger
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Log penyelesaian transaksi kontrak Sepolia (PaymentProcessed).
        </p>
      </div>

      {/* Top Stats Overview Card (Matching Figma Image 5) */}
      <div className="p-5 sm:p-6 rounded-3xl glass-panel flex flex-wrap items-center justify-between gap-6">
        <div>
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block">
            Jumlah transaksi tersedia: {history.length}
          </span>
          <span className="text-xs text-slate-600 font-medium">
            Rentang query event Q-Blok terbaru
          </span>
        </div>

        <div>
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
            TOKEN DIDUKUNG
          </span>
          <div className="flex items-center gap-2">
            {["mUSD", "mEUR", "mJPY"].map((sym) => (
              <span
                key={sym}
                className="px-2.5 py-1 rounded-xl glass-sub-card text-slate-800 text-xs font-bold"
              >
                {sym}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider block mb-1">
            ALAMAT GATEWAY
          </span>
          <button
            type="button"
            onClick={() => copyText(CONTRACT_ADDRESSES.CoinSwapPayment, "Gateway Contract")}
            className="flex items-center gap-1.5 font-mono text-xs font-bold text-blue-700 hover:text-blue-800 cursor-pointer"
          >
            <span>{gatewayShort}</span>
            <IconCopy className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Grid: Transactions Table (Left) + Detail Flyout (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Table Container (7 or 8 Cols) */}
        <div className="lg:col-span-8 p-6 sm:p-7 rounded-3xl glass-panel space-y-4">
          
          {/* Table Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <h3 className="font-extrabold text-base text-[#0B192C]">Daftar Transaksi</h3>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportCsv}
                className="btn-press flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
              >
                <IconDownload className="w-3.5 h-3.5" />
                <span>Ekspor CSV</span>
              </button>

              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="btn-press flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-xs font-bold text-white transition shadow-xs cursor-pointer"
              >
                <IconRefresh className="w-3.5 h-3.5" isSpinning={isLoading} />
                <span>{isLoading ? "Memuat..." : "Refresh"}</span>
              </button>
            </div>
          </div>

          {/* Search & Token Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
            {/* Filter Pills */}
            <div className="flex items-center gap-1 self-start sm:self-auto">
              {["ALL", "mUSD", "mEUR", "mJPY"].map((sym) => (
                <button
                  key={sym}
                  type="button"
                  onClick={() => {
                    setTokenFilter(sym);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    tokenFilter === sym
                      ? "bg-[#1951FC] text-white shadow-2xs"
                      : "bg-slate-100 hover:bg-slate-200/80 text-slate-600"
                  }`}
                >
                  {sym}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <IconSearch className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder="Cari hash transaksi..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200/70">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">TX HASH</th>
                  <th className="py-3 px-4">PASANGAN</th>
                  <th className="py-3 px-4">INPUT</th>
                  <th className="py-3 px-4">OUTPUT</th>
                  <th className="py-3 px-4">PENERIMA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {displayedHistory.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-slate-400 font-medium">
                      {isLoading ? "Membaca log blockchain Sepolia..." : "Tidak ada transaksi ditemukan."}
                    </td>
                  </tr>
                ) : (
                  displayedHistory.map((item) => {
                    const isSelected = activeTx?.txHash === item.txHash;
                    const shortHash = `${item.txHash.slice(0, 6)}..${item.txHash.slice(-4)}`;
                    const shortReceiver = item.receiver
                      ? `${item.receiver.slice(0, 6)}..${item.receiver.slice(-4)}`
                      : "-";

                    return (
                      <tr
                        key={item.id || item.txHash}
                        onClick={() => setSelectedTx(item)}
                        className={`transition cursor-pointer ${
                          isSelected
                            ? "bg-blue-50/80 font-semibold"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-blue-600 flex items-center gap-1.5">
                          <span>{shortHash}</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              copyText(item.txHash, "Tx Hash");
                            }}
                            className="text-slate-400 hover:text-blue-600"
                            title="Salin Tx Hash"
                          >
                            {copiedHash === item.txHash ? (
                              <IconCheck className="w-3 h-3 text-emerald-600" />
                            ) : (
                              <IconCopy className="w-3 h-3" />
                            )}
                          </button>
                        </td>

                        <td className="py-3 px-4">
                          <div className="flex items-center -space-x-1.5">
                            <TokenIcon symbol={item.tokenInSymbol} size="w-5 h-5" />
                            <TokenIcon symbol={item.tokenOutSymbol} size="w-5 h-5" />
                          </div>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-800">
                          {item.amountIn} {item.tokenInSymbol}
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                          {item.amountOut} {item.tokenOutSymbol}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-500">
                          {shortReceiver}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
            <span>
              Menampilkan {displayedHistory.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, filteredHistory.length)} dari {filteredHistory.length} event
            </span>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50"
              >
                ‹
              </button>
              {Array.from({ length: totalPages }).map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setCurrentPage(idx + 1)}
                  className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                    currentPage === idx + 1
                      ? "bg-[#1951FC] text-white"
                      : "border border-slate-200 hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center disabled:opacity-30 hover:bg-slate-50"
              >
                ›
              </button>
            </div>
          </div>
        </div>

        {/* Right Detail Card (Matching Figma Image 5 Flyout) */}
        <div
          key={activeTx?.txHash || "empty"}
          className="lg:col-span-4 p-6 sm:p-7 rounded-3xl glass-panel space-y-5 animate-slide-right"
        >
          {activeTx ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-extrabold text-base text-[#0B192C]">Detail Transaksi</h3>
                  <span className="text-[11px] font-mono text-slate-400">
                    {activeTx.orderId ? activeTx.orderId.slice(0, 10) : "ORD-20931"}
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 text-[10px] font-extrabold border border-emerald-400/30">
                  Confirmed
                </span>
              </div>

              {/* Hash Box */}
              <div className="p-3 rounded-2xl glass-sub-card space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400 block tracking-wider">
                  HASH TRANSAKSI
                </span>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-blue-600 truncate">
                    {activeTx.txHash}
                  </span>
                  <button
                    type="button"
                    onClick={() => copyText(activeTx.txHash, "Tx Hash")}
                    className="text-slate-400 hover:text-blue-600 flex-shrink-0"
                  >
                    <IconCopy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Amounts Sent & Received */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-blue-50/40 border border-blue-100 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">TOKEN DIKIRIM</span>
                  <span className="font-mono font-extrabold text-slate-800 text-sm">
                    {activeTx.amountIn} {activeTx.tokenInSymbol}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-600 block">TOKEN DITERIMA</span>
                  <span className="font-mono font-extrabold text-emerald-600 text-sm">
                    {activeTx.amountOut} {activeTx.tokenOutSymbol}
                  </span>
                </div>
              </div>

              {/* Metadata rows */}
              <div className="space-y-2 text-xs border-y border-slate-100 py-3">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Nomor Blok</span>
                  <span className="font-mono font-bold text-slate-700">
                    {activeTx.blockNumber ? activeTx.blockNumber.toLocaleString() : "7,421,890"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Pengirim</span>
                  <span className="font-mono text-slate-700">
                    {activeTx.sender ? `${activeTx.sender.slice(0, 6)}...${activeTx.sender.slice(-4)}` : "0x811c..E004"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Penerima</span>
                  <span className="font-mono text-slate-700">
                    {activeTx.receiver ? `${activeTx.receiver.slice(0, 6)}...${activeTx.receiver.slice(-4)}` : "0x3B1d..8eA0"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Waktu Konfirmasi</span>
                  <span className="text-slate-700 font-medium">{activeTx.time || "Baru saja"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Jaringan</span>
                  <span className="font-bold text-blue-600">Sepolia Testnet</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => onOpenReceipt && onOpenReceipt(activeTx)}
                  className="btn-press w-full py-2.5 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Lihat Struk</span>
                  <span>📄</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${activeTx.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-press py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold text-center flex items-center justify-center gap-1 transition"
                  >
                    <span>Etherscan</span>
                    <IconExternalLink className="w-3 h-3 text-slate-400" />
                  </a>

                  <button
                    type="button"
                    onClick={() => copySummary(activeTx)}
                    className="btn-press py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
                  >
                    Salin Ringkasan
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-slate-400 text-xs">
              Pilih transaksi di tabel untuk melihat detail.
            </div>
          )}
        </div>
      </div>

      {/* State Previews (Design Reference) */}
      <div className="pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setShowStatePreviews(!showStatePreviews)}
          className="text-xs font-bold text-slate-500 hover:text-blue-600 transition flex items-center gap-1.5"
        >
          <span>{showStatePreviews ? "▼ Sembunyikan" : "► Tampilkan"} State Previews (Design Reference)</span>
        </button>

        {showStatePreviews && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Loading State</span>
              <div className="h-4 bg-slate-100 rounded animate-pulse w-3/4" />
              <div className="h-3 bg-slate-100 rounded animate-pulse w-1/2" />
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">RPC Tidak Tersedia</span>
              <p className="text-[11px] text-slate-600">Tidak dapat terhubung ke RPC Sepolia. Coba lagi nanti.</p>
              <button onClick={onRefresh} className="text-xs font-bold text-blue-600 hover:underline">
                🔄 Coba Lagi
              </button>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">No search results</span>
              <p className="text-[11px] text-slate-500">Tidak ada hasil untuk pencarian ini.</p>
              <button onClick={() => setSearchQuery("")} className="text-xs font-bold text-blue-600 hover:underline">
                Atur ulang filter
              </button>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">CSV export feedback</span>
              <p className="text-[11px] text-emerald-800 font-bold">✓ CSV berhasil diunduh.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
