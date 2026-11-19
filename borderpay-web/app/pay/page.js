"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ethers } from "ethers";
import {
  TOKENS,
  CONTRACT_ADDRESSES,
  ERC20_ABI,
  SWAP_ABI,
  SEPOLIA_CHAIN_ID,
} from "../../constants/contracts";
import { triggerConfetti } from "../../components/Confetti";
import TokenBalancesModal from "../../components/TokenBalancesModal";
import {
  IconBorderPayLogo,
  TokenIcon,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconShieldCheck,
  IconClock,
  IconSwap,
  IconWallet,
  IconRefresh,
} from "../../components/Icons";

function playPaymentSuccessChime() {
  if (typeof window === "undefined") return;
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = "sine";
    osc2.type = "triangle";

    osc1.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    osc2.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.18);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.6);
    osc2.stop(ctx.currentTime + 0.6);
  } catch (e) {
    // Ignore audio permission restrictions
  }
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const receiver = searchParams.get("receiver") || "";
  const tokenOutAddr = searchParams.get("tokenOut") || TOKENS[0].address;
  const amountOut = searchParams.get("amount") || "0";
  const deadline = parseInt(searchParams.get("deadline") || "0");
  const memo = searchParams.get("memo") || "Pembayaran Tagihan BorderPay";
  const merchantName = searchParams.get("merchant") || "";

  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [tokenInAddr, setTokenInAddr] = useState(TOKENS[0].address);
  const [allBalances, setAllBalances] = useState({});
  const [requiredAmountIn, setRequiredAmountIn] = useState(amountOut);
  const [rateDisplay, setRateDisplay] = useState("1.0000");
  const [status, setStatus] = useState("IDLE");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);

  const tokenOutInfo = TOKENS.find((t) => t.address.toLowerCase() === tokenOutAddr.toLowerCase()) || TOKENS[0];
  const tokenInInfo = TOKENS.find((t) => t.address.toLowerCase() === tokenInAddr.toLowerCase()) || TOKENS[0];

  useEffect(() => {
    const checkExpiry = () => {
      const now = Math.floor(Date.now() / 1000);
      if (deadline > 0) {
        const diff = deadline - now;
        if (diff <= 0) {
          setIsExpired(true);
          setTimeRemaining(0);
        } else {
          setTimeRemaining(diff);
        }
      }
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  useEffect(() => {
    const fetchQuote = async () => {
      if (tokenInAddr.toLowerCase() === tokenOutAddr.toLowerCase()) {
        setRequiredAmountIn(amountOut);
        setRateDisplay("1.0000");
        return;
      }
      try {
        const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
        const swapContract = new ethers.Contract(CONTRACT_ADDRESSES.CoinSwapPayment, SWAP_ABI, provider);

        const rawRate = await swapContract.mockRates(tokenInAddr, tokenOutAddr);
        setRateDisplay((Number(rawRate) / 10000).toFixed(4));

        const amountOutWei = ethers.parseUnits(amountOut || "0", 18);
        const reqInWei = await swapContract.quoteRequiredIn(tokenInAddr, tokenOutAddr, amountOutWei);
        setRequiredAmountIn(ethers.formatUnits(reqInWei, 18));
      } catch (err) {
        console.error("Gagal mengambil quote dari smart contract:", err);
      }
    };
    fetchQuote();
  }, [tokenInAddr, tokenOutAddr, amountOut]);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!walletAddress || typeof window === "undefined" || !window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const bals = {};
        for (const token of TOKENS) {
          try {
            const tokenContract = new ethers.Contract(token.address, ERC20_ABI, provider);
            const rawBal = await tokenContract.balanceOf(walletAddress);
            bals[token.address.toLowerCase()] = ethers.formatUnits(rawBal, 18);
          } catch {
            bals[token.address.toLowerCase()] = "0";
          }
        }
        setAllBalances(bals);
      } catch (err) {
        console.error("Gagal load saldo wallet:", err);
      }
    };
    fetchBalances();
  }, [walletAddress]);

  const connectAndValidateNetwork = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      return alert("Wallet tidak ditemukan! Harap pasang ekstensi MetaMask.");
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);

      const currentChain = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(currentChain);

      if (currentChain.toLowerCase() !== SEPOLIA_CHAIN_ID.toLowerCase()) {
        try {
          await window.ethereum.request({
            method: "wallet_switchEthereumChain",
            params: [{ chainId: SEPOLIA_CHAIN_ID }],
          });
          setChainId(SEPOLIA_CHAIN_ID);
        } catch (switchError) {
          setErrorMsg("Harap ganti jaringan wallet ke Ethereum Sepolia.");
        }
      }
    } catch (err) {
      setErrorMsg("Gagal menghubungkan wallet atau berpindah ke jaringan Sepolia.");
    }
  };

  const handlePayment = async () => {
    setErrorMsg("");
    if (isExpired) return setErrorMsg("QR Invoice sudah kedaluwarsa!");
    if (chainId.toLowerCase() !== SEPOLIA_CHAIN_ID.toLowerCase()) {
      return setErrorMsg("Harap gunakan jaringan Ethereum Sepolia!");
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const amountInWei = ethers.parseUnits(requiredAmountIn, 18);
      const minAmountOutWei = ethers.parseUnits(amountOut, 18);

      const tokenContract = new ethers.Contract(tokenInAddr, ERC20_ABI, signer);
      const swapContract = new ethers.Contract(CONTRACT_ADDRESSES.CoinSwapPayment, SWAP_ABI, signer);

      const alreadyUsed = await swapContract.isOrderProcessed(orderId);
      if (alreadyUsed) {
        return setErrorMsg("Order ID ini sudah pernah diproses sebelumnya (Anti-Replay)!");
      }

      const userBal = await tokenContract.balanceOf(walletAddress);
      if (userBal < amountInWei) {
        return setErrorMsg(
          `Saldo ${tokenInInfo.symbol} Anda tidak mencukupi untuk membayar tagihan ini!`
        );
      }

      const currentAllowance = await tokenContract.allowance(
        walletAddress,
        CONTRACT_ADDRESSES.CoinSwapPayment
      );

      if (currentAllowance < amountInWei) {
        setStatus("APPROVING");
        const approveTx = await tokenContract.approve(
          CONTRACT_ADDRESSES.CoinSwapPayment,
          amountInWei
        );
        await approveTx.wait();
      }

      setStatus("SWAPPING");
      const tx = await swapContract.payOrSwap(
        orderId,
        tokenInAddr,
        tokenOutAddr,
        receiver,
        amountInWei,
        minAmountOutWei,
        deadline
      );

      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setStatus("SUCCESS");

      triggerConfetti();
      playPaymentSuccessChime();
    } catch (err) {
      console.error(err);
      setStatus("ERROR");
      setErrorMsg(
        err.reason || err.shortMessage || err.message || "Transaksi dibatalkan atau gagal di blockchain."
      );
    }
  };

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const copyOrderId = () => {
    navigator.clipboard.writeText(orderId);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  const currentPayerBalance = parseFloat(allBalances[tokenInAddr.toLowerCase()] || "0");
  const formattedReqIn = parseFloat(requiredAmountIn || "0").toLocaleString("en-US", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
  });

  const isBalanceSufficient =
    !walletAddress || currentPayerBalance >= parseFloat(requiredAmountIn || "0");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 lg:p-10 relative selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Background Soft Glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 left-1/4 w-96 h-96 bg-indigo-100/60 rounded-full blur-[140px]" />
        <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-emerald-100/50 rounded-full blur-[140px]" />
      </div>

      <div className="w-full max-w-4xl space-y-6">
        {/* Top Mini Brand Bar */}
        <div className="flex items-center justify-between">
          <a href="/" className="flex items-center gap-2.5 hover:opacity-85 transition">
            <IconBorderPayLogo className="w-8 h-8" />
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              BorderPay Checkout
            </span>
          </a>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-700 flex items-center gap-1.5 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sepolia Testnet</span>
            </span>
            <button
              onClick={() => setIsAssetModalOpen(true)}
              className="text-xs font-semibold px-3 py-1 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition shadow-sm cursor-pointer"
              title="Cek Saldo Koin"
            >
              Saldo 💳
            </button>
          </div>
        </div>

        {/* 2-Column Checkout Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Order Summary */}
          <div className="lg:col-span-5 glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 bg-white shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-600" />
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                  Ringkasan Tagihan
                </h2>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isExpired
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                }`}
              >
                {isExpired ? "Kedaluwarsa" : "Invoice Aktif"}
              </span>
            </div>

            {/* Merchant Identity if Available */}
            {merchantName && (
              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm">
                  {merchantName[0].toUpperCase()}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-slate-900">{merchantName}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                      ✓ Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Merchant Terverifikasi</p>
                </div>
              </div>
            )}

            {/* Amount Highlight */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 text-center space-y-1">
              <span className="text-xs text-slate-500 font-medium">Total Diterima Merchant</span>
              <div className="flex items-center justify-center gap-2">
                <TokenIcon symbol={tokenOutInfo.symbol} size="w-7 h-7" />
                <span className="text-3xl font-extrabold text-slate-900">
                  {amountOut} {tokenOutInfo.symbol}
                </span>
              </div>
              {memo && <p className="text-xs text-slate-500 mt-1 italic font-sans">{memo}</p>}
            </div>

            {/* Breakdown Details */}
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Merchant Penerima:</span>
                <span className="font-mono font-medium text-slate-800">
                  {receiver ? `${receiver.slice(0, 8)}...${receiver.slice(-6)}` : "-"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Masa Berlaku Invoice:</span>
                <span
                  className={`font-semibold flex items-center gap-1 ${
                    timeRemaining < 120 ? "text-amber-600 animate-pulse" : "text-slate-800"
                  }`}
                >
                  <IconClock className="w-3.5 h-3.5" />
                  <span>{timeRemaining > 0 ? formatTimer(timeRemaining) : "Habis"}</span>
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Biaya Protokol Swap:</span>
                <span className="text-emerald-700 font-semibold">0.00% (Simulasi Bebas Biaya)</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500">Jaminan Keamanan:</span>
                <span className="text-slate-800 font-medium flex items-center gap-1">
                  <IconShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Non-Custodial Escrow</span>
                </span>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-slate-500 block text-[11px]">Order ID (Hash):</span>
                <button
                  type="button"
                  onClick={copyOrderId}
                  className="w-full text-left font-mono text-[11px] text-slate-700 break-all bg-slate-50 p-2 rounded-xl border border-slate-200 hover:border-slate-300 transition flex items-center justify-between"
                  title="Klik untuk salin Order ID"
                >
                  <span className="truncate">{orderId}</span>
                  {copiedOrder ? (
                    <IconCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 ml-1" />
                  ) : (
                    <IconCopy className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 text-center">
              <a
                href="/"
                className="text-xs text-slate-500 hover:text-slate-800 font-medium transition flex items-center justify-center gap-1.5"
              >
                <span>← Kembali ke Pembuat QR</span>
              </a>
            </div>
          </div>

          {/* Right Column: Multi-Currency Payment Engine */}
          <div className="lg:col-span-7 glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 bg-white shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900">Metode Pembayaran & Koin</h2>
                <p className="text-xs text-slate-500">Pilih token yang ingin Anda belanjakan</p>
              </div>

              {walletAddress && (
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Payer Terhubung:</span>
                  <span className="font-mono text-xs font-semibold text-slate-700">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
              )}
            </div>

            {/* Token Selector Cards */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-700">
                Pilih Token untuk Membayar:
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TOKENS.map((t) => {
                  const isSelected = tokenInAddr.toLowerCase() === t.address.toLowerCase();
                  const bal = parseFloat(allBalances[t.address.toLowerCase()] || "0").toFixed(2);

                  return (
                    <button
                      key={t.address}
                      type="button"
                      disabled={status === "APPROVING" || status === "SWAPPING" || status === "SUCCESS"}
                      onClick={() => setTokenInAddr(t.address)}
                      className={`p-3.5 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? "bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20 shadow-sm"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <TokenIcon symbol={t.symbol} size="w-7 h-7" />
                        {isSelected && <IconCheck className="w-4 h-4 text-indigo-600" />}
                      </div>

                      <div className="mt-2.5">
                        <span className="block font-bold text-sm text-slate-900">{t.symbol}</span>
                        <span className="text-[11px] text-slate-500 font-mono mt-0.5 block">
                          Saldo: <strong className="text-slate-800">{walletAddress ? bal : "—"}</strong>
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Swap Calculation Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Kurs Eksekusi Smart Contract:</span>
                <span className="font-mono font-bold text-indigo-700">
                  1 {tokenInInfo.symbol} = {rateDisplay} {tokenOutInfo.symbol}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 block">Total yang Harus Anda Bayar:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TokenIcon symbol={tokenInInfo.symbol} size="w-5 h-5" />
                    <span className="text-xl font-extrabold text-slate-900">
                      {formattedReqIn} {tokenInInfo.symbol}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Slippage Tolerance</span>
                  <span className="text-xs font-semibold text-emerald-700">Maks. 0.5%</span>
                </div>
              </div>

              {walletAddress && !isBalanceSufficient && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
                  <span>Saldo {tokenInInfo.symbol} Anda kurang dari jumlah yang ditagih!</span>
                  <button
                    onClick={() => setIsAssetModalOpen(true)}
                    className="underline text-amber-900 font-bold ml-2 cursor-pointer"
                  >
                    Cek Aset
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                {errorMsg}
              </div>
            )}

            {/* 2-Step Process Stepper */}
            {walletAddress && status !== "SUCCESS" && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div
                  className={`p-2.5 rounded-xl border text-xs text-center transition ${
                    status === "APPROVING"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 animate-pulse font-bold"
                      : status === "SWAPPING"
                      ? "bg-emerald-50 border-emerald-300 text-emerald-700 font-medium"
                      : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                >
                  <span className="block font-bold">1. Approve Allowance</span>
                  <span className="text-[10px] text-slate-400">Izin transfer token</span>
                </div>

                <div
                  className={`p-2.5 rounded-xl border text-xs text-center transition ${
                    status === "SWAPPING"
                      ? "bg-indigo-50 border-indigo-600 text-indigo-700 animate-pulse font-bold"
                      : "bg-slate-50 border-slate-200 text-slate-500"
                  }`}
                >
                  <span className="block font-bold">2. Eksekusi Swap & Bayar</span>
                  <span className="text-[10px] text-slate-400">Finalisasi di kontrak</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!walletAddress ? (
              <button
                type="button"
                onClick={connectAndValidateNetwork}
                className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <IconWallet className="w-4 h-4" />
                <span>Hubungkan Wallet Sepolia untuk Membayar</span>
              </button>
            ) : status === "SUCCESS" ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-4 animate-fadeIn">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <IconCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Pembayaran Sukses Dikonfirmasi!</h3>
                  <p className="text-xs text-emerald-800 mt-1">
                    Swap dari {tokenInInfo.symbol} ke {tokenOutInfo.symbol} berhasil dieksekusi di Sepolia.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Tx Hash:</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline truncate max-w-[200px]"
                    >
                      {txHash} ↗
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Jumlah Terbayar:</span>
                    <span className="text-slate-800 font-semibold">
                      {formattedReqIn} {tokenInInfo.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Penerima Tagihan:</span>
                    <span className="text-emerald-700 font-semibold">
                      {amountOut} {tokenOutInfo.symbol}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Buka Sepolia Etherscan</span>
                    <IconExternalLink className="w-3 h-3" />
                  </a>
                  <a
                    href="/"
                    className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center justify-center"
                  >
                    Selesai
                  </a>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePayment}
                disabled={
                  isExpired ||
                  !isBalanceSufficient ||
                  status === "APPROVING" ||
                  status === "SWAPPING"
                }
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                {status === "APPROVING" ? (
                  <>
                    <IconRefresh className="w-4 h-4" isSpinning />
                    <span>Langkah 1/2: Menyetujui Allowance di Wallet...</span>
                  </>
                ) : status === "SWAPPING" ? (
                  <>
                    <IconRefresh className="w-4 h-4" isSpinning />
                    <span>Langkah 2/2: Memproses Swap & Settlement...</span>
                  </>
                ) : (
                  <>
                    <IconSwap className="w-4 h-4" />
                    <span>
                      {tokenInAddr.toLowerCase() === tokenOutAddr.toLowerCase()
                        ? `Bayar ${formattedReqIn} ${tokenInInfo.symbol}`
                        : `Swap & Bayar ${formattedReqIn} ${tokenInInfo.symbol}`}
                    </span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Asset / Faucet Modal */}
      <TokenBalancesModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        walletAddress={walletAddress}
      />
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 text-slate-900 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-600">
              Memuat Invoice Pembayaran...
            </span>
          </div>
        </div>
      }
    >
      <PaymentContent />
    </Suspense>
  );
}
