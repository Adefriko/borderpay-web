"use client";
import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
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
import PaymentTimeline from "../../components/PaymentTimeline";
import TransactionReceiptModal from "../../components/TransactionReceiptModal";
import OceanBackdrop from "../../components/OceanBackdrop";
import { useToast } from "../../components/ToastContext";
import { verifyInvoiceIntegrity } from "../../lib/invoiceIntegrity";
import { updateInvoiceStatus } from "../../lib/invoiceStore";
import {
  IconBorderPayMark,
  TokenIcon,
  IconCheck,
  IconCopy,
  IconExternalLink,
  IconShieldCheck,
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
    // Ignore audio restrictions
  }
}

function PaymentContent() {
  const searchParams = useSearchParams();
  const toast = useToast();

  const orderId = searchParams.get("orderId") || "";
  const receiver = searchParams.get("receiver") || "";
  const tokenOutAddr = searchParams.get("tokenOut") || TOKENS[0].address;
  const amountOut = searchParams.get("amount") || "0";
  const deadline = parseInt(searchParams.get("deadline") || "0");
  const memo = searchParams.get("memo") || "Pembayaran Tagihan BorderPay";
  const merchantName = searchParams.get("merchant") || "";
  const checksum = searchParams.get("checksum") || "";

  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [tokenInAddr, setTokenInAddr] = useState(TOKENS[0].address);
  const [allBalances, setAllBalances] = useState({});
  const [ethBalance, setEthBalance] = useState("0");
  const [requiredAmountIn, setRequiredAmountIn] = useState(amountOut);
  const [rateDisplay, setRateDisplay] = useState("1.0000");

  const [estimatedGasEth, setEstimatedGasEth] = useState("~0.0008");
  const [isGasSufficient, setIsGasSufficient] = useState(true);
  const [isEstimatingGas, setIsEstimatingGas] = useState(false);

  const [status, setStatus] = useState("IDLE"); // "IDLE" | "APPROVING" | "SWAPPING" | "SUCCESS" | "ERROR"
  const [txHash, setTxHash] = useState("");
  const [approvalTxHash, setApprovalTxHash] = useState("");
  const [confirmedBlock, setConfirmedBlock] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [isApprovalRequired, setIsApprovalRequired] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const [isExpired, setIsExpired] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [integrityState, setIntegrityState] = useState({
    status: "CHECKING",
    isValid: true,
    isTampered: false,
    message: "",
  });

  const [copiedOrder, setCopiedOrder] = useState(false);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const tokenOutInfo =
    TOKENS.find((t) => t.address.toLowerCase() === tokenOutAddr.toLowerCase()) || TOKENS[0];
  const tokenInInfo =
    TOKENS.find((t) => t.address.toLowerCase() === tokenInAddr.toLowerCase()) || TOKENS[0];

  useEffect(() => {
    const res = verifyInvoiceIntegrity({
      orderId,
      receiver,
      tokenOut: tokenOutAddr,
      amount: amountOut,
      deadline,
      checksum,
    });
    setIntegrityState(res);
  }, [orderId, receiver, tokenOutAddr, amountOut, deadline, checksum]);

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

  const refreshWalletState = useCallback(async () => {
    if (!walletAddress || typeof window === "undefined" || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);

      const ethBal = await provider.getBalance(walletAddress);
      const formattedEth = ethers.formatEther(ethBal);
      setEthBalance(formattedEth);

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

      const inContract = new ethers.Contract(tokenInAddr, ERC20_ABI, provider);
      const allowance = await inContract.allowance(walletAddress, CONTRACT_ADDRESSES.CoinSwapPayment);
      const reqInWei = ethers.parseUnits(requiredAmountIn || "0", 18);

      if (tokenInAddr.toLowerCase() !== tokenOutAddr.toLowerCase() || true) {
        const needsApprove = allowance < reqInWei;
        setIsApprovalRequired(needsApprove);
        setIsApproved(!needsApprove);
      }

      setIsEstimatingGas(true);
      try {
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice || ethers.parseUnits("2", "gwei");
        // Gas limit units: ~150,000 swap, ~50,000 approve
        const estimatedUnits = isApprovalRequired ? 220000n : 160000n;
        const totalGasWei = gasPrice * estimatedUnits;
        const estEth = parseFloat(ethers.formatEther(totalGasWei)).toFixed(5);
        setEstimatedGasEth(estEth);

        setIsGasSufficient(parseFloat(formattedEth) >= parseFloat(estEth));
      } catch (gasErr) {
        console.warn("Gas estimation notice:", gasErr);
      } finally {
        setIsEstimatingGas(false);
      }
    } catch (err) {
      console.error("Gagal memuat saldo atau gas:", err);
    }
  }, [walletAddress, tokenInAddr, tokenOutAddr, requiredAmountIn, isApprovalRequired]);

  useEffect(() => {
    refreshWalletState();
  }, [refreshWalletState]);

  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const handleAccounts = (accounts) => {
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        toast.info("Akun Berganti", `Terhubung: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
      } else {
        setWalletAddress("");
        toast.warning("Wallet Terputus", "Koneksi wallet telah dihentikan.");
      }
    };

    const handleChain = (chain) => {
      setChainId(chain);
      if (chain.toLowerCase() !== SEPOLIA_CHAIN_ID.toLowerCase()) {
        toast.warning("Jaringan Salah", "Harap beralih ke Ethereum Sepolia.");
      } else {
        toast.success("Jaringan Sepolia", "Terhubung ke Sepolia Testnet.");
      }
    };

    window.ethereum.on?.("accountsChanged", handleAccounts);
    window.ethereum.on?.("chainChanged", handleChain);

    return () => {
      window.ethereum.removeListener?.("accountsChanged", handleAccounts);
      window.ethereum.removeListener?.("chainChanged", handleChain);
    };
  }, [toast]);

  const connectAndValidateNetwork = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("MetaMask Tidak Ditemukan", "Harap pasang ekstensi MetaMask di browser.");
      return;
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
      toast.success("Wallet Terhubung", `${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
    } catch (err) {
      setErrorMsg("Gagal menghubungkan wallet atau berpindah ke jaringan Sepolia.");
    }
  };

  const handlePayment = async () => {
    setErrorMsg("");

    if (integrityState.isTampered) {
      return setErrorMsg(
        "Peringatan Keamanan: Invoice telah dimodifikasi secara ilegal. Pembayaran dibatalkan!"
      );
    }
    if (isExpired) {
      return setErrorMsg("QR Invoice sudah kedaluwarsa!");
    }
    if (chainId.toLowerCase() !== SEPOLIA_CHAIN_ID.toLowerCase()) {
      return setErrorMsg("Harap gunakan jaringan Ethereum Sepolia (0xaa36a7)!");
    }
    if (!isGasSufficient) {
      return setErrorMsg(
        `Saldo Sepolia ETH Anda (${parseFloat(ethBalance).toFixed(4)} ETH) tidak mencukupi untuk estimasi gas (${estimatedGasEth} ETH)!`
      );
    }

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const amountInWei = ethers.parseUnits(requiredAmountIn, 18);
      const minAmountOutWei = (ethers.parseUnits(amountOut, 18) * 995n) / 1000n; // 0.5% slippage safety

      const tokenContract = new ethers.Contract(tokenInAddr, ERC20_ABI, signer);
      const swapContract = new ethers.Contract(CONTRACT_ADDRESSES.CoinSwapPayment, SWAP_ABI, signer);

      // Anti-Replay check on-chain
      const alreadyUsed = await swapContract.isOrderProcessed(orderId);
      if (alreadyUsed) {
        return setErrorMsg("Order ID ini sudah pernah diproses sebelumnya (Anti-Replay Protection)!");
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
        toast.info("Menyetujui Allowance", "Harap konfirmasi transaksi persetujuan token di wallet...");
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.CoinSwapPayment, amountInWei);
        setApprovalTxHash(approveTx.hash);
        const approveReceipt = await approveTx.wait();
        if (approveReceipt.status === 1) {
          setIsApproved(true);
          toast.success("Allowance Disetujui", "Izin pengeluaran token telah dikonfirmasi di blok.");
        }
      }

      setStatus("SWAPPING");
      toast.info("Eksekusi Pembayaran", "Harap konfirmasi transaksi pembayaran/swap di wallet...");
      const tx = await swapContract.payOrSwap(
        orderId,
        tokenInAddr,
        tokenOutAddr,
        receiver,
        amountInWei,
        minAmountOutWei,
        deadline
      );

      toast.info("Transaksi Terkirim", "Menunggu konfirmasi blockchain Sepolia...");
      const receipt = await tx.wait();

      if (receipt.status === 1) {
        setTxHash(receipt.hash);
        setConfirmedBlock(receipt.blockNumber);
        setStatus("SUCCESS");

        updateInvoiceStatus(orderId, "PAID");

        triggerConfetti();
        playPaymentSuccessChime();
        toast.success("Pembayaran Sukses!", "Transaksi telah tercatat permanen di Sepolia.");
      } else {
        throw new Error("Transaksi gagal dieksekusi di blockchain.");
      }
    } catch (err) {
      console.error(err);
      setStatus("ERROR");
      const cleanErr =
        err.reason || err.shortMessage || err.message || "Transaksi dibatalkan atau gagal di blockchain.";
      setErrorMsg(cleanErr);
      toast.error("Transaksi Gagal", cleanErr);
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
    toast.info("Order ID Tersalin", orderId);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  const currentPayerBalance = parseFloat(allBalances[tokenInAddr.toLowerCase()] || "0");
  const formattedReqIn = parseFloat(requiredAmountIn || "0").toLocaleString("en-US", {
    maximumFractionDigits: 4,
    minimumFractionDigits: 2,
  });

  const isBalanceSufficient =
    !walletAddress || currentPayerBalance >= parseFloat(requiredAmountIn || "0");

  const receiptData = {
    txHash,
    orderId,
    blockNumber: confirmedBlock,
    sender: walletAddress,
    receiver,
    pair: `${tokenInInfo.symbol} → ${tokenOutInfo.symbol}`,
    tokenInSymbol: tokenInInfo.symbol,
    tokenOutSymbol: tokenOutInfo.symbol,
    amountIn: formattedReqIn,
    amountOut,
  };

  const checkoutStep = !walletAddress
    ? 2
    : status === "SUCCESS"
    ? 5
    : status === "APPROVING" || status === "SWAPPING" || (isApprovalRequired && !isApproved)
    ? 4
    : 3;

  return (
    <div className="min-h-screen text-[#0B192C] flex flex-col items-center p-4 sm:p-6 lg:p-8 relative selection:bg-blue-600/20 selection:text-blue-900">
      <OceanBackdrop variant="light" />

      <div className="w-full max-w-5xl space-y-6">
        {/* Top Floating Checkout Navbar (Matched to Figma Image 10) */}
        <header className="glass-nav-light rounded-full px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
          <Link href="/" className="btn-press flex items-center gap-2.5 hover:opacity-90 transition">
            <IconBorderPayMark className="w-8 h-8 rounded-xl shadow-2xs" />
            <span className="font-extrabold text-sm sm:text-base tracking-tight text-[#0B192C]">
              BorderPay
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-slate-100/80 text-xs font-bold">
            <Link href="/" className="px-3.5 py-1.5 rounded-full text-slate-600 hover:text-[#0B192C]">
              Overview
            </Link>
            <span className="px-3.5 py-1.5 rounded-full bg-white text-[#1951FC] shadow-2xs">
              Scan & Pay Checkout
            </span>
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden sm:flex text-[11px] font-extrabold px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>SEPOLIA TESTNET</span>
            </span>
            {walletAddress && (
              <span className="text-[11px] font-mono font-bold px-3 py-1.5 rounded-full bg-[#0B192C] text-white">
                {walletAddress.slice(0, 6)}..{walletAddress.slice(-4)}
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsAssetModalOpen(true)}
              className="btn-press text-xs font-bold px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 transition shadow-2xs cursor-pointer"
              title="Cek Saldo Koin"
            >
              Saldo 💳
            </button>
          </div>
        </header>

        {/* 5-Step Checkout Progress Header (Matched to Figma Image 10) */}
        <div className="surface-card rounded-full p-2 px-4 hidden sm:flex items-center justify-between gap-2 text-xs font-bold">
          {[
            { num: 1, label: "Review Invoice" },
            { num: 2, label: "Connect Wallet" },
            { num: 3, label: "Select Token" },
            { num: 4, label: "Approve" },
            { num: 5, label: "Confirm" },
          ].map((s, idx) => {
            const done = checkoutStep > s.num || status === "SUCCESS";
            const active = checkoutStep === s.num && status !== "SUCCESS";
            return (
              <div key={s.num} className="flex items-center gap-2 flex-1 justify-center">
                <div
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full transition ${
                    active
                      ? "bg-[#1951FC] text-white shadow-sm"
                      : done
                      ? "text-emerald-600"
                      : "text-slate-400"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-extrabold ${
                      active
                        ? "bg-white/25 text-white"
                        : done
                        ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {done ? "✓" : s.num}
                  </span>
                  <span className="whitespace-nowrap">{s.label}</span>
                </div>
                {idx < 4 && <div className="h-px flex-1 bg-slate-200/80 hidden lg:block" />}
              </div>
            );
          })}
        </div>

        {integrityState.isTampered && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 shadow-md flex items-start gap-3 text-rose-800 animate-shake">
            <span className="text-xl">🚨</span>
            <div>
              <h4 className="font-bold text-sm text-rose-900">
                Peringatan Keamanan: Integritas Invoice Gagal!
              </h4>
              <p className="text-xs text-rose-700 mt-0.5 leading-relaxed">
                Parameter tagihan ini (nominal, penerima, atau deadline) telah dimodifikasi dari
                data asli yang dibuat merchant. Pembayaran otomatis dinonaktifkan untuk melindungi
                dana Anda.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 rounded-3xl p-6 sm:p-7 surface-card space-y-5 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-extrabold text-[#0B192C]">Ringkasan Invoice</h2>
              <span
                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                  isExpired
                    ? "bg-rose-50 text-rose-600 border border-rose-200"
                    : integrityState.isValid
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    : "bg-amber-50 text-amber-600 border border-amber-200"
                }`}
              >
                {isExpired
                  ? "Kedaluwarsa"
                  : integrityState.isValid
                  ? "✓ Verified Hash"
                  : "Legacy Invoice"}
              </span>
            </div>

            {merchantName && (
              <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center gap-3">
                <span className="w-9 h-9 rounded-xl bg-[#1951FC] text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {merchantName[0].toUpperCase()}
                </span>
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-bold text-[#0B192C]">{merchantName}</p>
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-700">
                      Merchant POS
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">Verified Profile</p>
                </div>
              </div>
            )}

            <div className="py-2 space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 font-extrabold block">
                JUMLAH YANG DITERIMA
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-[#0B192C]">
                  {amountOut}
                </span>
                <span className="text-sm font-bold text-slate-500">{tokenOutInfo.symbol}</span>
              </div>
              {memo && <p className="text-xs text-slate-600 pt-1 font-medium">{memo}</p>}
            </div>

            <div className="space-y-3 text-xs border-t border-slate-100 pt-3">
              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Penerima:</span>
                <span className="font-mono font-bold text-slate-800">
                  {receiver ? `${receiver.slice(0, 6)}..${receiver.slice(-4)}` : "-"}
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">SISA WAKTU</span>
                  <span className={`font-bold text-xs ${isExpired ? "text-rose-600" : "text-emerald-600"}`}>
                    {isExpired ? "Invoice kedaluwarsa" : "Invoice aktif"}
                  </span>
                </div>
                <div className="relative w-12 h-12 flex items-center justify-center">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <circle cx="18" cy="18" r="15" fill="none" stroke="#e2e8f0" strokeWidth="3" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15"
                      fill="none"
                      stroke={isExpired ? "#e11d48" : "#0891b2"}
                      strokeWidth="3"
                      strokeDasharray="94"
                      strokeDashoffset={isExpired ? "94" : "18"}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute font-mono font-extrabold text-[10px] text-[#0B192C]">
                    {timeRemaining > 0 ? formatTimer(timeRemaining) : "00:00"}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Jaringan:</span>
                <span className="text-slate-800 font-bold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#1951FC]" />
                  <span>Ethereum Sepolia Testnet</span>
                </span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Biaya Protokol:</span>
                <span className="text-emerald-600 font-bold">0.00%</span>
              </div>

              <div className="flex justify-between items-center py-1 border-b border-slate-100">
                <span className="text-slate-500 font-medium">Tipe Smart Contract:</span>
                <span className="text-slate-800 font-bold flex items-center gap-1">
                  <IconShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Non-Custodial Escrow</span>
                </span>
              </div>

              <div className="space-y-1 pt-1">
                <span className="text-slate-500 block text-[11px] font-medium">Order ID (Hash):</span>
                <button
                  type="button"
                  onClick={copyOrderId}
                  className="w-full text-left font-mono text-[11px] text-slate-700 break-all bg-slate-50 p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 transition flex items-center justify-between cursor-pointer"
                  title="Klik untuk salin Order ID"
                >
                  <span className="truncate">{orderId}</span>
                  {copiedOrder ? (
                    <IconCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 ml-1" />
                  ) : (
                    <IconCopy className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 ml-1" />
                  )}
                </button>
              </div>
            </div>

            <div className="pt-2 text-center">
              <Link
                href="/"
                className="text-xs text-blue-600 hover:text-blue-800 font-bold transition flex items-center justify-center gap-1.5"
              >
                <span>← Kembali ke Dashboard</span>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-5 text-slate-800">
            {/* Vibrant Blue Token Picker Banner Card (Matched to Figma Image 10) */}
            <div className="rounded-3xl p-6 bg-gradient-to-br from-[#0e86b8] via-[#1951FC] to-[#0b35c4] text-white shadow-xl shadow-blue-900/15 space-y-4">
              <h2 className="text-sm font-extrabold tracking-wide">Pilih token pembayaran</h2>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {TOKENS.map((t) => {
                  const isSelected = tokenInAddr.toLowerCase() === t.address.toLowerCase();
                  return (
                    <button
                      key={t.address}
                      type="button"
                      disabled={
                        status === "APPROVING" || status === "SWAPPING" || status === "SUCCESS"
                      }
                      onClick={() => setTokenInAddr(t.address)}
                      className={`btn-press p-3 rounded-2xl border transition text-left cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? "bg-white text-[#0B192C] border-white shadow-md"
                          : "bg-white/15 hover:bg-white/25 text-white border-white/30 backdrop-blur-md"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <TokenIcon symbol={t.symbol} size="w-6 h-6" />
                        <span className="font-extrabold text-xs">{t.symbol}</span>
                      </div>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-[#1951FC] text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between text-xs text-blue-100">
                <span>
                  Saldo:{" "}
                  <strong className="text-white font-mono">
                    {walletAddress ? `${currentPayerBalance.toFixed(2)} ${tokenInInfo.symbol}` : "Hubungkan wallet"}
                  </strong>
                </span>
                {walletAddress && (
                  <span className="font-mono text-[11px] bg-white/15 px-2.5 py-0.5 rounded-full">
                    {walletAddress.slice(0, 6)}..{walletAddress.slice(-4)}
                  </span>
                )}
              </div>
            </div>

            {/* White Execution Details Card */}
            <div className="rounded-3xl p-6 sm:p-7 surface-card space-y-5">

            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-500 font-semibold">Kurs Eksekusi Smart Contract:</span>
                <span className="font-mono font-extrabold text-blue-600">
                  1 {tokenInInfo.symbol} = {rateDisplay} {tokenOutInfo.symbol}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500 font-medium block">
                    Total yang Harus Anda Bayar:
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <TokenIcon symbol={tokenInInfo.symbol} size="w-5 h-5" />
                    <span className="text-xl font-extrabold text-[#0B192C]">
                      {formattedReqIn} {tokenInInfo.symbol}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-medium">Slippage Tolerance</span>
                  <span className="text-xs font-bold text-emerald-600">Maks. 0.5%</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-white border border-slate-200 flex items-center justify-between text-xs font-mono">
                <div className="space-y-0.5">
                  <span className="text-slate-400 text-[10px] block uppercase font-sans">Estimasi Gas Network</span>
                  <span className="text-slate-800 font-bold">
                    {isEstimatingGas ? "Menghitung..." : `~${estimatedGasEth} Sepolia ETH`}
                  </span>
                </div>
                <div className="text-right space-y-0.5">
                  <span className="text-slate-400 text-[10px] block uppercase font-sans">Saldo Gas Anda</span>
                  <span
                    className={`font-bold ${
                      isGasSufficient ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {walletAddress ? `${parseFloat(ethBalance).toFixed(4)} ETH` : "—"}
                  </span>
                </div>
              </div>

              {walletAddress && !isBalanceSufficient && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-800 text-xs flex items-center justify-between">
                  <span>Saldo {tokenInInfo.symbol} Anda kurang dari jumlah yang ditagih!</span>
                  <button
                    onClick={() => setIsAssetModalOpen(true)}
                    className="underline text-amber-900 font-bold ml-2 cursor-pointer"
                  >
                    Cek Aset
                  </button>
                </div>
              )}

              {walletAddress && !isGasSufficient && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-xs flex items-center justify-between">
                  <span>Saldo Sepolia ETH Anda tidak mencukupi untuk membayar gas!</span>
                  <a
                    href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-rose-900 font-bold ml-2 cursor-pointer flex-shrink-0"
                  >
                    Klaim Faucet ↗
                  </a>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 text-rose-700 text-xs leading-relaxed font-medium">
                ⚠️ {errorMsg}
              </div>
            )}

            {walletAddress && (
              <PaymentTimeline
                status={status}
                isApprovalRequired={isApprovalRequired}
                isApproved={isApproved}
                isTampered={integrityState.isTampered}
                isExpired={isExpired}
                txHash={txHash}
                approvalTxHash={approvalTxHash}
              />
            )}

            {!walletAddress ? (
              <button
                type="button"
                onClick={connectAndValidateNetwork}
                className="w-full py-4 rounded-2xl bg-[#1951FC] hover:bg-blue-600 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
              >
                <IconWallet className="w-4 h-4" />
                <span>Hubungkan Wallet Sepolia untuk Membayar</span>
              </button>
            ) : status === "SUCCESS" ? (
              <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-300 text-center space-y-4 animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md shadow-emerald-500/30">
                  <IconCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#0B192C]">Pembayaran Sukses Dikonfirmasi!</h3>
                  <p className="text-xs text-emerald-700 mt-1">
                    Swap dari {tokenInInfo.symbol} ke {tokenOutInfo.symbol} berhasil dieksekusi di
                    Ethereum Sepolia.
                  </p>
                </div>

                <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-1.5 font-mono text-slate-700">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Tx Hash:</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline truncate max-w-[200px]"
                    >
                      {txHash} ↗
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Jumlah Terbayar:</span>
                    <span className="text-slate-900 font-bold">
                      {formattedReqIn} {tokenInInfo.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Penerima Tagihan:</span>
                    <span className="text-emerald-600 font-bold">
                      {amountOut} {tokenOutInfo.symbol}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsReceiptModalOpen(true)}
                    className="py-2.5 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <span>Struk Lengkap 🧾</span>
                  </button>

                  <a
                    href={`https://sepolia.etherscan.io/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition flex items-center justify-center gap-1.5 border border-slate-200"
                  >
                    <span>Buka Etherscan</span>
                    <IconExternalLink className="w-3 h-3" />
                  </a>

                  <Link
                    href="/"
                    className="py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs transition flex items-center justify-center border border-slate-200"
                  >
                    Selesai
                  </Link>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handlePayment}
                disabled={
                  isExpired ||
                  integrityState.isTampered ||
                  !isBalanceSufficient ||
                  !isGasSufficient ||
                  status === "APPROVING" ||
                  status === "SWAPPING"
                }
                className="w-full py-4 rounded-2xl bg-[#1951FC] hover:bg-blue-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
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
      </div>

      <TokenBalancesModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        walletAddress={walletAddress}
      />

      <TransactionReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        tx={receiptData}
      />
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#eef4f8] text-[#0B192C] flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 border-2 border-[#1951FC] border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-bold text-slate-700">
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
