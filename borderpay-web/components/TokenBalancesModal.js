"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { TOKENS, CONTRACT_ADDRESSES, ERC20_ABI, SEPOLIA_CHAIN_ID } from "../constants/contracts";
import { TokenIcon, IconCopy, IconCheck, IconExternalLink, IconRefresh } from "./Icons";
import { useToast } from "./ToastContext";

export default function TokenBalancesModal({ isOpen, onClose, walletAddress, currentUser = null }) {
  const toast = useToast();
  const [balances, setBalances] = useState({
    USDC: "0.00",
    ETH: "0.00",
    LINK: "0.00",
  });
  const [ethBalance, setEthBalance] = useState("0.0000");
  const [chainId, setChainId] = useState(SEPOLIA_CHAIN_ID);
  const [loading, setLoading] = useState(false);
  const [copiedAddress, setCopiedAddress] = useState("");
  const [addedTokens, setAddedTokens] = useState({});

  const effectiveAddress = walletAddress || currentUser?.address || "";

  const fetchAllBalances = useCallback(async () => {
    if (!effectiveAddress) {
      setEthBalance("0.0000");
      setBalances({ USDC: "0.00", ETH: "0.00", LINK: "0.00" });
      return;
    }
    setLoading(true);
    try {
      let currentChain = SEPOLIA_CHAIN_ID;
      let provider;

      if (walletAddress && typeof window !== "undefined" && window.ethereum) {
        currentChain = (await window.ethereum.request({ method: "eth_chainId" })) || SEPOLIA_CHAIN_ID;
        setChainId(currentChain);
        provider =
          currentChain.toLowerCase() === SEPOLIA_CHAIN_ID.toLowerCase()
            ? new ethers.BrowserProvider(window.ethereum)
            : new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      } else {
        setChainId(SEPOLIA_CHAIN_ID);
        provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      }

      const ethBal = await provider.getBalance(effectiveAddress);
      setEthBalance(parseFloat(ethers.formatEther(ethBal)).toFixed(4));

      const newBals = {};
      for (const token of TOKENS) {
        try {
          const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
          const bal = await contract.balanceOf(effectiveAddress);
          newBals[token.symbol] = parseFloat(ethers.formatUnits(bal, 18)).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 3,
          });
        } catch {
          newBals[token.symbol] = "0.00";
        }
      }
      setBalances(newBals);
    } catch (err) {
      console.error("Gagal load balances:", err);
    } finally {
      setLoading(false);
    }
  }, [effectiveAddress, walletAddress]);

  useEffect(() => {
    if (isOpen) {
      fetchAllBalances();
    }
  }, [isOpen, fetchAllBalances]);

  const switchToSepolia = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      fetchAllBalances();
    } catch (err) {
      toast.error("Gagal Ganti Jaringan", err.message);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedAddress(id);
    toast.info("Alamat Tersalin", text);
    setTimeout(() => setCopiedAddress(""), 2000);
  };

  const addTokenToMetaMask = async (token) => {
    if (!window.ethereum) {
      toast.error("MetaMask Tidak Terdeteksi", "Pasang ekstensi MetaMask terlebih dahulu.");
      return;
    }
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
        toast.success(`${token.symbol} Ditambahkan`, `${token.symbol} ditambahkan ke MetaMask.`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (!isOpen) return null;

  const isWrongNetwork = walletAddress && chainId.toLowerCase() !== SEPOLIA_CHAIN_ID.toLowerCase();
  const isLowEth = parseFloat(ethBalance || "0") < 0.002;
  const shortWallet = effectiveAddress
    ? `${effectiveAddress.slice(0, 6)}..${effectiveAddress.slice(-4)}`
    : "Belum terhubung";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/45 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-white rounded-3xl p-4 sm:p-6 lg:p-7 shadow-2xl space-y-4 sm:space-y-5 text-slate-800 animate-modal-pop max-h-[90dvh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-extrabold text-sm">
              ⊞
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#0B192C]">Dompet & Saldo Sepolia</h3>
              <p className="text-xs text-slate-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
                <span>Ethereum Sepolia Testnet</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn-press w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Status Bar & Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold">
              ● {walletAddress ? "WALLET TERHUBUNG" : effectiveAddress ? "SEPOLIA RPC" : "BELUM TERHUBUNG"}
            </span>
            <button
              type="button"
              onClick={() => effectiveAddress && copyToClipboard(effectiveAddress, "wallet")}
              className="px-3 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-xs font-mono font-bold text-[#0B192C] flex items-center gap-1.5 transition cursor-pointer"
            >
              <span>{shortWallet}</span>
              {copiedAddress === "wallet" ? (
                <IconCheck className="w-3 h-3 text-emerald-600" />
              ) : effectiveAddress ? (
                <IconCopy className="w-3 h-3 text-slate-500" />
              ) : null}
            </button>
          </div>

          <button
            type="button"
            onClick={fetchAllBalances}
            disabled={loading}
            className="text-xs font-bold text-slate-600 hover:text-blue-600 flex items-center gap-1.5 transition cursor-pointer"
          >
            <span>Refresh Saldo</span>
            <IconRefresh className="w-3.5 h-3.5" isSpinning={loading} />
          </button>
        </div>

        {/* Wrong Network Alert */}
        {isWrongNetwork && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-xs">
            <span className="font-bold text-rose-700">Wallet tidak berada di Sepolia Testnet.</span>
            <button
              type="button"
              onClick={switchToSepolia}
              className="btn-press px-3.5 py-1.5 rounded-xl bg-[#1951FC] text-white font-bold cursor-pointer"
            >
              Ganti ke Sepolia
            </button>
          </div>
        )}

        {/* Vibrant Blue Sepolia Gas Banner */}
        <div className="p-5 rounded-2xl bg-gradient-to-r from-[#1951FC] via-[#1c59ff] to-[#0a82d9] text-white shadow-lg shadow-blue-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-100 block">
              SEPOLIA GAS BALANCE (ETH)
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-extrabold font-mono tracking-tight">
                {loading ? "..." : ethBalance}
              </span>
              <span className="text-sm font-bold text-blue-100">ETH</span>
            </div>
            <p className="text-[11px] text-blue-100/90">
              ETH Sepolia Testnet — hanya untuk gas, tidak memiliki nilai nyata.
            </p>
          </div>

          <div className="flex sm:flex-col items-end justify-between gap-2">
            <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/25 text-[10px] font-bold backdrop-blur-md">
              Ethereum Sepolia Testnet
            </span>
            <a
              href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-press px-4 py-2 rounded-xl bg-white hover:bg-blue-50 text-[#1951FC] text-xs font-extrabold shadow-xs transition flex items-center gap-1.5"
            >
              <span>Faucet ETH</span>
              <IconExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {isLowEth && walletAddress && (
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium">
            ⚠️ Test ETH tidak cukup untuk biaya gas. Ambil ETH gratis dari faucet Sepolia di atas.
          </div>
        )}

        {/* 3-Column Mock Token Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {TOKENS.map((t) => {
            return (
              <div
                key={t.address}
                className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 hover:border-blue-300 transition flex flex-col justify-between space-y-3"
              >
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-2">
                    <TokenIcon symbol={t.symbol} size="w-6 h-6" />
                    <span className="font-extrabold text-xs text-[#0B192C]">{t.symbol}</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-600 text-[9px] font-extrabold uppercase">
                    MOCK
                  </span>
                </div>

                <div>
                  <span className="text-[9px] font-bold uppercase text-slate-400 block">
                    SALDO SIMULASI
                  </span>
                  <div className="text-base font-extrabold text-[#0B192C] font-mono mt-0.5">
                    {loading ? "..." : balances[t.symbol] || "0.00"} {t.symbol}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                    <span>{t.address.slice(0, 6)}..{t.address.slice(-4)}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(t.address, t.symbol)}
                      className="text-slate-400 hover:text-blue-600 cursor-pointer"
                    >
                      {copiedAddress === t.symbol ? (
                        <IconCheck className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <IconCopy className="w-3 h-3" />
                      )}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => addTokenToMetaMask(t)}
                    className="btn-press w-full py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-700 transition cursor-pointer"
                  >
                    {addedTokens[t.symbol] ? "✓ Ditambahkan" : "Tambah ke MetaMask"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Gateway Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase text-slate-400">
              GATEWAY CONTRACT
            </span>
            <button
              type="button"
              onClick={() => copyToClipboard(CONTRACT_ADDRESSES.CoinSwapPayment, "gateway")}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 font-mono text-[11px] font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer"
            >
              <span>
                {CONTRACT_ADDRESSES.CoinSwapPayment.slice(0, 6)}..
                {CONTRACT_ADDRESSES.CoinSwapPayment.slice(-4)}
              </span>
              {copiedAddress === "gateway" ? (
                <IconCheck className="w-3 h-3 text-emerald-500" />
              ) : (
                <IconCopy className="w-3 h-3" />
              )}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.CoinSwapPayment}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>Lihat di Etherscan</span>
              <IconExternalLink className="w-3 h-3" />
            </a>
            <button
              type="button"
              onClick={fetchAllBalances}
              disabled={loading}
              className="btn-press px-4 py-2 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white text-xs font-bold shadow-xs transition cursor-pointer"
            >
              Segarkan Saldo
            </button>
          </div>
        </div>

        <p className="text-[10px] text-slate-400 text-center italic">
          Simulasi akademik. Token USDC, ETH, dan LINK di sini adalah mock token ERC-20 di Sepolia Testnet, bukan aset bernilai nyata.
        </p>
      </div>
    </div>
  );
}