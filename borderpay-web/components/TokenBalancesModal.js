"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { TOKENS, CONTRACT_ADDRESSES, ERC20_ABI } from "../constants/contracts";
import { TokenIcon, IconCopy, IconCheck, IconExternalLink } from "./Icons";

export default function TokenBalancesModal({ isOpen, onClose, walletAddress }) {
  const [balances, setBalances] = useState({});
  const [ethBalance, setEthBalance] = useState("0.0");
  const [loading, setLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState("");
  const [addedTokens, setAddedTokens] = useState({});

  useEffect(() => {
    if (!isOpen || !walletAddress) return;

    const fetchAllBalances = async () => {
      setLoading(true);
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);

        const ethBal = await provider.getBalance(walletAddress);
        setEthBalance(parseFloat(ethers.formatEther(ethBal)).toFixed(4));

        const newBals = {};
        for (const token of TOKENS) {
          try {
            const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
            const bal = await contract.balanceOf(walletAddress);
            newBals[token.symbol] = parseFloat(ethers.formatUnits(bal, 18)).toLocaleString("en-US", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 4,
            });
          } catch (err) {
            newBals[token.symbol] = "0.00";
          }
        }
        setBalances(newBals);
      } catch (err) {
        console.error("Gagal load balances:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllBalances();
  }, [isOpen, walletAddress]);

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(id);
    setTimeout(() => setCopiedAddress(""), 2000);
  };

  const addTokenToMetaMask = async (token) => {
    if (!window.ethereum) return alert("MetaMask tidak terdeteksi");
    try {
      const wasAdded = await window.ethereum.request({
        method: "wallet_watchAsset",
        params: {
          type: "ERC20",
          options: {
            address: token.address,
            symbol: token.symbol,
            decimals: 18,
          },
        },
      });
      if (wasAdded) {
        setAddedTokens((prev) => ({ ...prev, [token.symbol]: true }));
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xl">
              💳
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Dompet & Saldo Simulasi</h3>
              <p className="text-xs text-slate-500">Jaringan Sepolia Testnet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Sepolia ETH Header */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TokenIcon symbol="ETH" size="w-9 h-9" />
            <div>
              <p className="text-xs text-slate-500">Sepolia Gas Balance (ETH)</p>
              <p className="text-lg font-bold font-mono text-purple-900">
                {loading ? "..." : `${ethBalance} ETH`}
              </p>
            </div>
          </div>
          <a
            href="https://sepoliafaucet.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-white hover:bg-purple-100 text-purple-700 border border-purple-200 shadow-sm transition flex items-center gap-1.5"
          >
            <span>Faucet ETH</span>
            <IconExternalLink className="w-3 h-3" />
          </a>
        </div>

        {/* Token Balance List */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Token Simulasi Multi-Currency
          </h4>

          <div className="space-y-2.5">
            {TOKENS.map((t) => (
              <div
                key={t.address}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-slate-300 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TokenIcon symbol={t.symbol} size="w-8 h-8" />
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900 text-sm">{t.symbol}</span>
                      <span className="text-xs text-slate-500 truncate">({t.name})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono text-slate-500 truncate">
                        {t.address.slice(0, 6)}...{t.address.slice(-4)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(t.address, t.symbol)}
                        className="text-slate-400 hover:text-slate-600 transition"
                        title="Salin Alamat Token"
                      >
                        {copiedAddress === t.symbol ? (
                          <IconCheck className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <IconCopy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                  <span className="font-mono font-bold text-sm text-slate-900">
                    {loading ? "..." : balances[t.symbol] || "0.00"}
                  </span>
                  <button
                    onClick={() => addTokenToMetaMask(t)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm transition flex items-center gap-1 cursor-pointer"
                    title="Tambahkan token ini ke MetaMask"
                  >
                    <span>🦊</span>
                    <span>{addedTokens[t.symbol] ? "Ditambahkan" : "+ ke MetaMask"}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Smart Contract Info */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 space-y-1">
          <div className="flex justify-between items-center">
            <span>Kontrak Gateway (CoinSwapPayment):</span>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.CoinSwapPayment}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-mono"
            >
              {CONTRACT_ADDRESSES.CoinSwapPayment.slice(0, 6)}...
              {CONTRACT_ADDRESSES.CoinSwapPayment.slice(-4)} ↗
            </a>
          </div>
          <p className="text-[11px] text-slate-400">
            Aset di atas adalah token pengujian non-komersial di Ethereum Sepolia.
          </p>
        </div>
      </div>
    </div>
  );
}
