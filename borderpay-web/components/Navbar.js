"use client";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import { SEPOLIA_CHAIN_ID, TOKENS, ERC20_ABI } from "../constants/contracts";
import {
  IconBorderPayLogo,
  IconWallet,
  IconCopy,
  IconCheck,
  TokenIcon,
  IconQrCode,
} from "./Icons";

export default function Navbar({
  walletAddress,
  onConnectWallet,
  activeTab = "terminal",
  onSelectTab,
  onOpenAssetModal,
  onOpenScanner,
  onOpenHistory,
  onOpenGuide,
  currentUser,
  onOpenAuthModal,
  onLogout,
}) {
  const [copied, setCopied] = useState(false);
  const [balances, setBalances] = useState({});
  const [currentChain, setCurrentChain] = useState("");
  const [showWalletMenu, setShowWalletMenu] = useState(false);

  const copyAddress = () => {
    if (!walletAddress) return;
    navigator.clipboard.writeText(walletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const switchToSepolia = async () => {
    if (typeof window === "undefined" || !window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      });
      setCurrentChain(SEPOLIA_CHAIN_ID);
    } catch (err) {
      console.error("Switch chain error:", err);
    }
  };

  useEffect(() => {
    const fetchQuickBalances = async () => {
      if (!walletAddress || typeof window === "undefined" || !window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const chain = await window.ethereum.request({ method: "eth_chainId" });
        setCurrentChain(chain);

        const newBals = {};
        for (const token of TOKENS) {
          try {
            const contract = new ethers.Contract(token.address, ERC20_ABI, provider);
            const bal = await contract.balanceOf(walletAddress);
            newBals[token.symbol] = parseFloat(ethers.formatUnits(bal, 18)).toFixed(1);
          } catch {
            newBals[token.symbol] = "0.0";
          }
        }
        setBalances(newBals);
      } catch (e) {
        console.error("Error fetching navbar balances:", e);
      }
    };

    fetchQuickBalances();
    const interval = setInterval(fetchQuickBalances, 12000);

    if (typeof window !== "undefined" && window.ethereum) {
      const handleAccountsChanged = () => fetchQuickBalances();
      const handleChainChanged = (chain) => {
        setCurrentChain(chain);
        fetchQuickBalances();
      };
      window.ethereum.on?.("accountsChanged", handleAccountsChanged);
      window.ethereum.on?.("chainChanged", handleChainChanged);

      return () => {
        clearInterval(interval);
        window.ethereum.removeListener?.("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener?.("chainChanged", handleChainChanged);
      };
    }

    return () => clearInterval(interval);
  }, [walletAddress]);

  const isSepolia = currentChain.toLowerCase() === SEPOLIA_CHAIN_ID.toLowerCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/[0.08] bg-[#030a22]/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <IconBorderPayLogo className="w-8 h-8 drop-shadow-[0_0_12px_rgba(25,81,252,0.5)]" />
          <span className="font-extrabold text-lg tracking-tight text-white">
            BorderPay
          </span>
        </div>

        {onSelectTab && (
          <nav className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
            <button
              onClick={() => onSelectTab("terminal")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "terminal"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[#A9BEE4] hover:text-white"
              }`}
            >
              POS Kasir
            </button>
            <button
              onClick={() => onSelectTab("ledger")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "ledger"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[#A9BEE4] hover:text-white"
              }`}
            >
              Ledger
            </button>
            <button
              onClick={() => onSelectTab("rates")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === "rates"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-[#A9BEE4] hover:text-white"
              }`}
            >
              Kurs Swap
            </button>
          </nav>
        )}

        <div className="flex items-center gap-2">
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-[#CBE9FD] text-xs font-semibold transition cursor-pointer"
              title="Scan QR Tagihan"
            >
              <IconQrCode className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline text-xs">Scan</span>
            </button>
          )}

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs bg-white/[0.04] border border-white/[0.08] text-white">
            <span
              className={`w-2 h-2 rounded-full ${
                walletAddress
                  ? isSepolia
                    ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"
                    : "bg-rose-400 animate-pulse"
                  : "bg-slate-500"
              }`}
            />
            <span className="text-[11px] font-medium text-slate-300">
              {walletAddress ? (
                isSepolia ? (
                  "Sepolia"
                ) : (
                  <button onClick={switchToSepolia} className="text-rose-400 underline cursor-pointer">
                    Switch
                  </button>
                )
              ) : (
                "Sepolia"
              )}
            </span>
          </div>

          {walletAddress ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="flex items-center gap-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-400/30 px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition cursor-pointer"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="font-mono text-xs">
                  {currentUser?.storeName
                    ? currentUser.storeName
                    : `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`}
                </span>
                <span className="text-[10px] text-blue-300">▾</span>
              </button>

              {showWalletMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowWalletMenu(false)}
                  />
                  <div
                    className="absolute right-0 mt-2 w-56 bg-[#03195b]/95 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 text-xs backdrop-blur-xl animate-fadeIn"
                  >
                    <div className="p-2 border-b border-white/10 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[11px] text-[#A9BEE4] truncate">
                          {walletAddress.slice(0, 8)}...{walletAddress.slice(-6)}
                        </span>
                        <button
                          onClick={copyAddress}
                          className="text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          {copied ? (
                            <IconCheck className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <IconCopy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-300 pt-0.5">
                        <span className="text-[#A9BEE4]">Saldo:</span>
                        <span className="font-mono font-bold text-white">
                          {balances.mUSD !== undefined ? `${balances.mUSD}` : "0"} mUSD
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => {
                          setShowWalletMenu(false);
                          onOpenAssetModal?.();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 transition cursor-pointer flex items-center gap-2"
                      >
                        <span>💳</span>
                        <span>Saldo & Faucet</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowWalletMenu(false);
                          onOpenHistory?.();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 transition cursor-pointer flex items-center gap-2"
                      >
                        <span>📋</span>
                        <span>Riwayat Tagihan</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowWalletMenu(false);
                          onOpenGuide?.();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 transition cursor-pointer flex items-center gap-2"
                      >
                        <span>🧭</span>
                        <span>Panduan Web3</span>
                      </button>
                      <button
                        onClick={() => {
                          setShowWalletMenu(false);
                          onOpenAuthModal?.();
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl text-slate-200 hover:bg-white/10 transition cursor-pointer flex items-center gap-2"
                      >
                        <span>🏪</span>
                        <span>Profil Merchant</span>
                      </button>
                    </div>

                    {currentUser && (
                      <div className="pt-1 border-t border-white/10">
                        <button
                          onClick={() => {
                            setShowWalletMenu(false);
                            onLogout?.();
                          }}
                          className="w-full text-left px-3 py-1.5 rounded-xl text-rose-400 hover:bg-rose-950/40 transition cursor-pointer font-semibold"
                        >
                          Keluar Akun
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onConnectWallet}
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl shadow-md transition cursor-pointer"
            >
              <IconWallet className="w-3.5 h-3.5" />
              <span>Connect</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
