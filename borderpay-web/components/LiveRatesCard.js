"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { TOKENS, CONTRACT_ADDRESSES, SWAP_ABI } from "../constants/contracts";
import { TokenIcon, IconSwap, IconRefresh } from "./Icons";
import { useToast } from "./ToastContext";

export default function LiveRatesCard() {
  const toast = useToast();
  const [rates, setRates] = useState({
    "mUSD-mEUR": "0.9200",
    "mEUR-mUSD": "1.0870",
    "mUSD-mJPY": "150.0000",
    "mJPY-mUSD": "0.0067",
    "mEUR-mJPY": "163.0000",
    "mJPY-mEUR": "0.0061",
  });
  const [loading, setLoading] = useState(false);
  const [simAmount, setSimAmount] = useState("100");
  const [simTokenIn, setSimTokenIn] = useState(TOKENS[0].address);
  const [simTokenOut, setSimTokenOut] = useState(TOKENS[1].address);
  const [calcResult, setCalcResult] = useState({
    out: "92.0000",
    minOut: "91.5400",
    rate: "0.9200",
  });
  const [lastUpdated, setLastUpdated] = useState("Baru saja");
  const [showStatePreviews, setShowStatePreviews] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);

  const fetchRates = useCallback(async () => {
    setLoading(true);
    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.CoinSwapPayment, SWAP_ABI, provider);

      const pairs = [
        { from: TOKENS[0], to: TOKENS[1] },
        { from: TOKENS[1], to: TOKENS[0] },
        { from: TOKENS[0], to: TOKENS[2] },
        { from: TOKENS[2], to: TOKENS[0] },
        { from: TOKENS[1], to: TOKENS[2] },
        { from: TOKENS[2], to: TOKENS[1] },
      ];

      const results = {};
      for (const p of pairs) {
        try {
          const raw = await contract.mockRates(p.from.address, p.to.address);
          results[`${p.from.symbol}-${p.to.symbol}`] = (Number(raw) / 10000).toFixed(4);
        } catch {
          // Fallback to baseline default
        }
      }
      setRates((prev) => ({ ...prev, ...results }));

      if (simTokenIn && simTokenOut) {
        if (simTokenIn.toLowerCase() === simTokenOut.toLowerCase()) {
          setCalcResult({
            out: simAmount || "0",
            minOut: simAmount || "0",
            rate: "1.0000",
          });
        } else {
          const parsedIn = ethers.parseUnits(simAmount || "0", 18);
          const outWei = await contract.quoteSwap(simTokenIn, simTokenOut, parsedIn);
          const rawRate = await contract.mockRates(simTokenIn, simTokenOut);
          const outFormatted = parseFloat(ethers.formatUnits(outWei, 18)).toFixed(4);
          const minOutFormatted = (parseFloat(outFormatted) * 0.995).toFixed(4);

          setCalcResult({
            out: outFormatted,
            minOut: minOutFormatted,
            rate: (Number(rawRate) / 10000).toFixed(4),
          });
        }
      }
      setLastUpdated("Baru saja");
      toast.success("Rate Diperbarui", "Kurs Sepolia berhasil disinkronkan.");
    } catch {
      // Keep existing simulated rates
      setLastUpdated("2 menit lalu");
    } finally {
      setLoading(false);
    }
  }, [simAmount, simTokenIn, simTokenOut, toast]);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const tokenInInfo =
    TOKENS.find((t) => t.address.toLowerCase() === simTokenIn.toLowerCase()) || TOKENS[0];
  const tokenOutInfo =
    TOKENS.find((t) => t.address.toLowerCase() === simTokenOut.toLowerCase()) || TOKENS[1];

  const handleFlip = () => {
    const temp = simTokenIn;
    setSimTokenIn(simTokenOut);
    setSimTokenOut(temp);
    setIsFlipped((f) => !f);
  };

  const handleSelectPair = (symIn, symOut) => {
    const inTok = TOKENS.find((t) => t.symbol === symIn);
    const outTok = TOKENS.find((t) => t.symbol === symOut);
    if (inTok && outTok) {
      setSimTokenIn(inTok.address);
      setSimTokenOut(outTok.address);
    }
  };

  const currentPairKey = `${tokenInInfo.symbol}-${tokenOutInfo.symbol}`;
  const currentPairRate = rates[currentPairKey] || calcResult?.rate || "0.9200";

  return (
    <div className="space-y-6 text-[#0B192C]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0B192C] tracking-tight">
            Kurs & Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Simulasi kurs enam pasangan token mock di Ethereum Sepolia Testnet.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchRates}
          disabled={loading}
          className="btn-press self-start sm:self-auto flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs cursor-pointer"
        >
          <IconRefresh className="w-3.5 h-3.5 text-blue-600" isSpinning={loading} />
          <span>{loading ? "Memperbarui..." : "Segarkan"}</span>
        </button>
      </div>

      {/* Main Simulator Card (Matching Figma Image 4) */}
      <div className="rounded-3xl p-4 sm:p-6 lg:p-8 glass-panel space-y-6 relative overflow-hidden">
        
        {/* Converter Inputs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* ANDA BAYAR */}
          <div className="min-w-0 p-4 sm:p-5 rounded-2xl glass-sub-card space-y-2">
            <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider block">
              ANDA BAYAR
            </span>
            <div className="flex items-center justify-between gap-2.5 min-w-0">
              <input
                type="number"
                value={simAmount}
                onChange={(e) => setSimAmount(e.target.value)}
                placeholder="100"
                className="min-w-0 flex-1 text-xl sm:text-3xl font-extrabold text-[#0B192C] bg-transparent focus:outline-none"
              />
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/90 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-2xs shrink-0">
                <TokenIcon symbol={tokenInInfo.symbol} size="w-5 h-5" />
                <select
                  value={simTokenIn}
                  onChange={(e) => setSimTokenIn(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
                >
                  {TOKENS.map((t) => (
                    <option key={t.address} value={t.address}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block truncate">
              {tokenInInfo.symbol} — {tokenInInfo.name}
            </span>
          </div>

          {/* Centered Flip Button */}
          <div className="flex justify-center -my-2 md:my-0">
            <button
              type="button"
              onClick={handleFlip}
              style={{ transform: isFlipped ? "rotate(180deg)" : "rotate(0deg)" }}
              className="btn-press w-11 h-11 rounded-full bg-[#1951FC] hover:bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/30 transition-transform duration-300 ease-out cursor-pointer"
              title="Tukar Posisi Token"
            >
              <IconSwap className="w-5 h-5" />
            </button>
          </div>

          {/* DITERIMA (ESTIMASI) */}
          <div className="min-w-0 p-4 sm:p-5 rounded-2xl glass-sub-card space-y-2">
            <span className="text-[11px] font-extrabold uppercase text-slate-500 tracking-wider block">
              DITERIMA (ESTIMASI)
            </span>
            <div className="flex items-center justify-between gap-2.5 min-w-0">
              <div className="min-w-0 flex-1 text-xl sm:text-3xl font-extrabold text-[#0B192C] truncate">
                {calcResult?.out || "0.0000"}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 bg-white/90 border border-slate-200 px-2.5 sm:px-3 py-1.5 rounded-xl shadow-2xs shrink-0">
                <TokenIcon symbol={tokenOutInfo.symbol} size="w-5 h-5" />
                <select
                  value={simTokenOut}
                  onChange={(e) => setSimTokenOut(e.target.value)}
                  className="bg-transparent font-bold text-xs text-slate-800 focus:outline-none cursor-pointer"
                >
                  {TOKENS.map((t) => (
                    <option key={t.address} value={t.address}>
                      {t.symbol}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 font-medium block truncate">
              {tokenOutInfo.symbol} — {tokenOutInfo.name}
            </span>
          </div>
        </div>

        {/* Centered Conversion Navy Pill */}
        <div className="flex flex-col items-center justify-center space-y-2">
          <div
            key={`${tokenInInfo.symbol}-${tokenOutInfo.symbol}-${calcResult?.out}`}
            className="px-4 sm:px-5 py-2.5 rounded-xl bg-[#0B192C] text-white font-extrabold text-xs sm:text-sm tracking-wide shadow-sm flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 max-w-full text-center animate-pop"
          >
            <span className="break-all">{simAmount || "0"} {tokenInInfo.symbol}</span>
            <span>→</span>
            <span className="break-all">{calcResult?.out || "0.0000"} {tokenOutInfo.symbol}</span>
          </div>
          <p className="text-[11px] text-slate-500 font-medium text-center">
            ℹ️ Rate simulasi kontrak pintar: 1 {tokenInInfo.symbol} = {currentPairRate} {tokenOutInfo.symbol}
          </p>
        </div>

        {/* Card Footer */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p className="text-[11px] text-slate-400 max-w-md leading-relaxed">
            ℹ️ Quote ini dihitung dari rate simulasi smart contract, bukan harga pasar real. Tidak ada eksekusi swap dari halaman ini.
          </p>

          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-3">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Diperbarui {lastUpdated}</span>
            </span>
            <button
              type="button"
              onClick={fetchRates}
              className="btn-press px-5 py-2.5 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Hitung Quote
            </button>
          </div>
        </div>
      </div>

      {/* 6 Pair Cards Sub-Grid (Matching Figma Image 4) */}
      <div className="space-y-3">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
          NILAI CONTOH MOCKUP, BUKAN KURS PASAR REAL. KLIK KARTU UNTUK MEMILIH PASANGAN TOKEN DI KALKULATOR.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { in: "mUSD", out: "mEUR", rate: rates["mUSD-mEUR"] || "0.9200" },
            { in: "mEUR", out: "mUSD", rate: rates["mEUR-mUSD"] || "1.0870" },
            { in: "mUSD", out: "mJPY", rate: rates["mUSD-mJPY"] || "150.0000" },
            { in: "mJPY", out: "mUSD", rate: rates["mJPY-mUSD"] || "0.0067" },
            { in: "mEUR", out: "mJPY", rate: rates["mEUR-mJPY"] || "163.0000" },
            { in: "mJPY", out: "mEUR", rate: rates["mJPY-mEUR"] || "0.0061" },
          ].map((pair) => {
            const isSelected =
              tokenInInfo.symbol === pair.in && tokenOutInfo.symbol === pair.out;
            return (
              <button
                key={`${pair.in}-${pair.out}`}
                type="button"
                onClick={() => handleSelectPair(pair.in, pair.out)}
                className={`p-3.5 rounded-2xl border text-left transition cursor-pointer interactive-tile ${
                  isSelected
                    ? "bg-gradient-to-br from-blue-500/15 via-blue-500/10 to-white/90 border-blue-500 shadow-md ring-1 ring-blue-500/30"
                    : "glass-panel hover:bg-white/90"
                }`}
              >
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500 mb-1">
                  <span>{pair.in}</span>
                  <span>→</span>
                  <span>{pair.out}</span>
                </div>
                <div className="text-base sm:text-lg font-mono font-extrabold text-[#0B192C]">
                  {pair.rate}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* State Previews Toggle (as in Figma Image 4) */}
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
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Rate Error</span>
              <p className="text-[11px] text-slate-600">Rate tidak tersedia dari kontrak saat ini.</p>
              <button onClick={fetchRates} className="text-xs font-bold text-blue-600 hover:underline">
                🔄 Coba Lagi
              </button>
            </div>

            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-rose-500 block">Validation Error</span>
              <p className="text-[11px] text-rose-700 font-medium">⚠ Masukkan angka lebih dari 0.</p>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 block">Status Toast</span>
              <p className="text-[11px] text-emerald-800 font-bold">✓ Rate diperbarui.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
