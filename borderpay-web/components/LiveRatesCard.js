"use client";
import { useState, useEffect } from "react";
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

  const fetchRates = async () => {
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
        if (simTokenIn === simTokenOut) {
          setCalcResult({
            out: simAmount,
            rate: "1.0000",
          });
        } else {
          const parsedIn = ethers.parseUnits(simAmount || "0", 18);
          const outWei = await contract.quoteSwap(simTokenIn, simTokenOut, parsedIn);
          const rawRate = await contract.mockRates(simTokenIn, simTokenOut);
          setCalcResult({
            out: parseFloat(ethers.formatUnits(outWei, 18)).toFixed(4),
            rate: (Number(rawRate) / 10000).toFixed(4),
          });
        }
      }
    } catch (err) {
      console.error("Gagal ambil kurs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, [simAmount, simTokenIn, simTokenOut]);

  const tokenInInfo = TOKENS.find((t) => t.address === simTokenIn) || TOKENS[0];
  const tokenOutInfo = TOKENS.find((t) => t.address === simTokenOut) || TOKENS[1];

  const handleFlip = () => {
    const temp = simTokenIn;
    setSimTokenIn(simTokenOut);
    setSimTokenOut(temp);
  };

  return (
    <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 bg-white shadow-sm space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <IconSwap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Kalkulator & Kurs Real-Time Smart Contract
            </h3>
            <p className="text-xs text-slate-500">
              Rasio swap on-chain langsung dari smart contract (presisi basis point 10000)
            </p>
          </div>
        </div>
        <button
          onClick={fetchRates}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
        >
          <IconRefresh className="w-3.5 h-3.5" isSpinning={loading} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Simulator Widget */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200/80">
        <div className="md:col-span-5 space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Anda Kirim (Input)
          </label>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2.5 focus-within:border-indigo-600 focus-within:ring-1 focus-within:ring-indigo-600 transition shadow-sm">
            <TokenIcon symbol={tokenInInfo.symbol} size="w-6 h-6" />
            <input
              type="number"
              step="any"
              min="0"
              value={simAmount}
              onChange={(e) => setSimAmount(e.target.value)}
              className="w-full bg-transparent text-slate-900 font-bold text-base focus:outline-none"
            />
            <select
              value={simTokenIn}
              onChange={(e) => setSimTokenIn(e.target.value)}
              className="bg-slate-100 text-xs font-semibold text-slate-800 rounded-lg px-2 py-1 focus:outline-none border border-slate-200"
            >
              {TOKENS.map((t) => (
                <option key={t.address} value={t.address}>
                  {t.symbol}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="md:col-span-2 flex justify-center py-2 md:py-0">
          <button
            type="button"
            onClick={handleFlip}
            className="w-10 h-10 rounded-full bg-white hover:bg-indigo-600 border border-slate-200 hover:border-indigo-600 text-slate-700 hover:text-white flex items-center justify-center transition shadow-md cursor-pointer"
            title="Tukar Posisi Koin"
          >
            <IconSwap className="w-4 h-4" />
          </button>
        </div>

        <div className="md:col-span-5 space-y-1.5">
          <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Estimasi Diterima (Output)
          </label>
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2.5 shadow-sm">
            <TokenIcon symbol={tokenOutInfo.symbol} size="w-6 h-6" />
            <span className="w-full text-emerald-600 font-extrabold text-base truncate">
              {calcResult?.out || "0.00"}
            </span>
            <select
              value={simTokenOut}
              onChange={(e) => setSimTokenOut(e.target.value)}
              className="bg-slate-100 text-xs font-semibold text-slate-800 rounded-lg px-2 py-1 focus:outline-none border border-slate-200"
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

      {/* Quick Rate Tickers */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
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
            className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 text-center"
          >
            <p className="text-[11px] text-slate-500 font-medium">{item.pair}</p>
            <p className="text-xs font-mono font-bold text-indigo-700 mt-1">
              {rates[item.key] || "..."}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
