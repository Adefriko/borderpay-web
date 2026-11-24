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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 text-slate-800 animate-modal-pop">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 text-lg shadow-2xs">
              💳
            </div>
            <div>
              <h3 className="text-base font-bold text-[#0B192C]">Dompet & Saldo Simulasi</h3>
              <p className="text-xs text-slate-500">Ethereum Sepolia Testnet</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-press w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TokenIcon symbol="ETH" size="w-9 h-9" />
            <div>
              <p className="text-xs text-slate-500 font-medium">Sepolia Gas Balance (ETH)</p>
              <p className="text-lg font-bold font-mono text-[#0B192C]">
                {loading ? "..." : `${ethBalance} ETH`}
              </p>
            </div>
          </div>
          <a
            href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <span>Faucet ETH</span>
            <IconExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Token Simulasi Multi-Valuta (ERC-20)
          </h4>

          <div className="space-y-2.5">
            {TOKENS.map((t) => (
              <div
                key={t.address}
                className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 hover:border-blue-400 transition flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <TokenIcon symbol={t.symbol} size="w-8 h-8" />
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-[#0B192C] text-sm">{t.symbol}</span>
                      <span className="text-xs text-slate-500 truncate">({t.name})</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] font-mono text-slate-500 truncate">
                        {t.address.slice(0, 6)}...{t.address.slice(-4)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(t.address, t.symbol)}
                        className="text-slate-400 hover:text-slate-700 transition cursor-pointer"
                        title="Salin Alamat Token"
                      >
                        {copiedAddress === t.symbol ? (
                          <IconCheck className="w-3 h-3 text-emerald-500" />
                        ) : (
                          <IconCopy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0 flex flex-col items-end gap-1.5">
                  <span className="font-mono font-bold text-sm text-[#0B192C]">
                    {loading ? "..." : balances[t.symbol] || "0.00"}
                  </span>
                  <button
                    onClick={() => addTokenToMetaMask(t)}
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs transition flex items-center gap-1 cursor-pointer"
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

        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
          <div className="flex justify-between items-center">
            <span>Kontrak Gateway (CoinSwapPayment):</span>
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.CoinSwapPayment}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 font-mono flex items-center gap-1"
            >
              <span>
                {CONTRACT_ADDRESSES.CoinSwapPayment.slice(0, 6)}...
                {CONTRACT_ADDRESSES.CoinSwapPayment.slice(-4)}
              </span>
              <IconExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-[11px] text-slate-500">
            Aset di atas adalah token simulasi non-komersial di Ethereum Sepolia.
          </p>
        </div>
      </div>
    </div>
  );
}
