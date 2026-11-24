"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { TOKENS, CONTRACT_ADDRESSES, SWAP_ABI } from "../constants/contracts";
import { TokenIcon, IconSwap, IconRefresh } from "./Icons";

export default function LiveRatesCard() {
  const [rates, setRates] = useState({});
  const [loading, setLoading] = useState(false);
  const [simAmount, setSimAmount] = useState("100");
  const [simTokenIn, setSimTokenIn] = useState(TOKENS[0].address);
  const [simTokenOut, setSimTokenOut] = useState(TOKENS[1].address);
  const [calcResult, setCalcResult] = useState(null);

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
          results[`${p.from.symbol}-${p.to.symbol}`] = "N/A";
        }
      }
      setRates(results);

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
    } catch (err) {
      console.error("Gagal ambil kurs:", err);
    } finally {
      setLoading(false);
    }
  }, [simAmount, simTokenIn, simTokenOut]);

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
  };

  return (
    <div className="rounded-2xl p-6 border border-slate-200/80 bg-white shadow-xs space-y-5 text-[#0B192C]">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div>
          <h3 className="text-base font-extrabold text-[#0B192C]">Kurs & Kalkulator Swap</h3>
          <p className="text-xs text-slate-500">Estimasi pertukaran instan lintas token mock ERC-20 di Sepolia</p>
        </div>

        <button
          onClick={fetchRates}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
        >
          <IconRefresh className="w-3.5 h-3.5 text-blue-600" isSpinning={loading} />
          <span>{loading ? "..." : "Refresh"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/70">
        <div className="md:col-span-5 space-y-1">
          <label className="text-[11px] text-slate-500 font-semibold">Input (Anda Bayar)</label>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <TokenIcon symbol={tokenInInfo.symbol} size="w-6 h-6" />
            <input
              type="number"
              step="any"
              min="0"
              value={simAmount}
              onChange={(e) => setSimAmount(e.target.value)}
              className="w-full bg-transparent text-[#0B192C] font-extrabold text-base focus:outline-none"
            />
            <select
              value={simTokenIn}
              onChange={(e) => setSimTokenIn(e.target.value)}
              className="bg-slate-50 text-xs font-bold text-slate-800 rounded-lg px-2 py-1 border border-slate-200 focus:outline-none cursor-pointer"
            >
              {TOKENS.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-2 flex justify-center">
          <button
            type="button"
            onClick={handleFlip}
            className="w-9 h-9 rounded-xl bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 flex items-center justify-center transition cursor-pointer shadow-2xs"
            title="Tukar Posisi"
          >
            <IconSwap className="w-4 h-4" />
          </button>
        </div>

        <div className="md:col-span-5 space-y-1">
          <label className="text-[11px] text-slate-500 font-semibold">Output (Diterima)</label>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2">
            <TokenIcon symbol={tokenOutInfo.symbol} size="w-6 h-6" />
            <span className="w-full text-emerald-600 font-extrabold text-base truncate">
              {calcResult?.out || "0.00"}
            </span>
            <select
              value={simTokenOut}
              onChange={(e) => setSimTokenOut(e.target.value)}
              className="bg-slate-50 text-xs font-bold text-slate-800 rounded-lg px-2 py-1 border border-slate-200 focus:outline-none cursor-pointer"
            >
              {TOKENS.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {[
          { pair: "mUSD → mEUR", key: "mUSD-mEUR" },
          { pair: "mEUR → mUSD", key: "mEUR-mUSD" },
          { pair: "mUSD → mJPY", key: "mUSD-mJPY" },
          { pair: "mJPY → mUSD", key: "mJPY-mUSD" },
          { pair: "mEUR → mJPY", key: "mEUR-mJPY" },
          { pair: "mJPY → mEUR", key: "mJPY-mEUR" },
        ].map((item) => (
          <div
            key={item.key}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-center"
          >
            <span className="text-[11px] font-semibold text-slate-500 block">{item.pair}</span>
            <span className="text-xs font-mono font-extrabold text-blue-600 mt-0.5 block">
              {rates[item.key] || "..."}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
