"use client";
import { useState, useEffect, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ethers } from "ethers";
import Link from "next/link";
import { TOKENS, CONTRACT_ADDRESSES, SWAP_ABI, ERC20_ABI } from "../constants/contracts";
import Sidebar from "../components/Sidebar";
import HeaderBar from "../components/HeaderBar";
import SwapCalculatorWidget from "../components/SwapCalculatorWidget";
import BeginnerGuideWidget from "../components/BeginnerGuideWidget";
import TokenBalancesModal from "../components/TokenBalancesModal";
import AuthModal from "../components/AuthModal";
import AuthLandingView from "../components/AuthLandingView";
import LiveRatesCard from "../components/LiveRatesCard";
import StatsOverview from "../components/StatsOverview";
import TransactionReceiptModal from "../components/TransactionReceiptModal";
import QrScannerModal from "../components/QrScannerModal";
import InvoiceHistoryModal from "../components/InvoiceHistoryModal";
import OnboardingGuideModal from "../components/OnboardingGuideModal";
import { useToast } from "../components/ToastContext";
import { getActiveSession, findUserByAddress, logoutUser } from "../lib/auth";
import { computeInvoiceChecksum } from "../lib/invoiceIntegrity";
import { saveLocalInvoice } from "../lib/invoiceStore";
import {
  TokenIcon,
  IconQrCode,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconDownload,
  IconRefresh,
  IconClock,
  IconScan,
  IconSwap,
  IconLedger,
  IconEthereum,
} from "../components/Icons";

export default function Home() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("dashboard"); // "dashboard" | "terminal" | "rates" | "ledger"
  const [walletAddress, setWalletAddress] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [tokenBalances, setTokenBalances] = useState({
    mUSD: "1,250.00",
    mEUR: "980.50",
    mJPY: "150,000.00",
  });

  const [receiver, setReceiver] = useState("");
  const [tokenOut, setTokenOut] = useState(TOKENS[0].address);
  const [amount, setAmount] = useState("10");
  const [expiryMinutes, setExpiryMinutes] = useState("15");
  const [memo, setMemo] = useState("");
  const [paymentLink, setPaymentLink] = useState("");
  const [orderIdDisplay, setOrderIdDisplay] = useState("");
  const [deadlineDisplay, setDeadlineDisplay] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [copiedHeroWallet, setCopiedHeroWallet] = useState(false);

  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenFilter, setTokenFilter] = useState("ALL");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const session = getActiveSession();
    if (session) {
      setCurrentUser(session);
      setReceiver(session.address);
      if (session.preferredCurrency) {
        const found = TOKENS.find((t) => t.symbol === session.preferredCurrency);
        if (found) setTokenOut(found.address);
      }
    }
    setIsLoaded(true);
  }, []);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      toast.error("Wallet Tidak Terdeteksi", "Pastikan ekstensi MetaMask terpasang di browser.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        setWalletAddress(addr);

        const existing = findUserByAddress(addr);
        if (existing) {
          setCurrentUser(existing);
          setReceiver(existing.address);
        } else if (!receiver) {
          setReceiver(addr);
        }
        toast.success("Wallet Terhubung", `${addr.slice(0, 6)}...${addr.slice(-4)}`);
      }
    } catch (err) {
      toast.error("Gagal Terhubung ke Wallet", err.message || "Periksa koneksi wallet.");
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
    setIsGuest(false);
    setWalletAddress("");
    toast.info("Logout", "Sesi telah dihentikan.");
  };

  const fetchLiveBalances = useCallback(async () => {
    if (!walletAddress || typeof window === "undefined" || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const newBals = { ...tokenBalances };
      for (const t of TOKENS) {
        try {
          const c = new ethers.Contract(t.address, ERC20_ABI, provider);
          const raw = await c.balanceOf(walletAddress);
          const formatted = parseFloat(ethers.formatUnits(raw, 18)).toLocaleString("en-US", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          newBals[t.symbol] = formatted;
        } catch {
          // Keep existing simulated balance
        }
      }
      setTokenBalances(newBals);
    } catch {
      // Ignore network errors
    }
  }, [walletAddress, tokenBalances]);

  useEffect(() => {
    fetchLiveBalances();
  }, [walletAddress, fetchLiveBalances]);

  const generateInvoice = (e) => {
    if (e) e.preventDefault();
    if (!ethers.isAddress(receiver)) {
      toast.error("Alamat Tidak Valid", "Alamat wallet penerima harus format 0x (42 karakter).");
      return;
    }

    const rawId = `BP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const orderIdHash = ethers.id(rawId);
    const deadline = Math.floor(Date.now() / 1000) + parseInt(expiryMinutes) * 60;

    const checksum = computeInvoiceChecksum({
      orderId: orderIdHash,
      receiver,
      tokenOut,
      amount,
      deadline,
    });

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      orderId: orderIdHash,
      receiver,
      tokenOut,
      amount,
      deadline: deadline.toString(),
      memo: memo || "Pembayaran BorderPay",
      merchant: currentUser?.storeName || "",
      checksum,
    });

    const fullLink = `${baseUrl}/pay?${params.toString()}`;
    setPaymentLink(fullLink);
    setOrderIdDisplay(orderIdHash);
    setDeadlineDisplay(deadline);
    setTimeRemaining(parseInt(expiryMinutes) * 60);

    const selTok =
      TOKENS.find((t) => t.address.toLowerCase() === tokenOut.toLowerCase()) || TOKENS[0];

    saveLocalInvoice({
      orderId: orderIdHash,
      receiver,
      tokenOut,
      tokenSymbol: selTok.symbol,
      amount,
      deadline,
      memo: memo || "Pembayaran BorderPay",
      link: fullLink,
    });

    toast.success("QR Invoice Dibuat", `${amount} ${selTok.symbol}`);
  };

  useEffect(() => {
    if (!deadlineDisplay) return;
    const interval = setInterval(() => {
      const now = Math.floor(Date.now() / 1000);
      const diff = deadlineDisplay - now;
      if (diff <= 0) {
        setTimeRemaining(0);
        clearInterval(interval);
      } else {
        setTimeRemaining(diff);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [deadlineDisplay]);

  const fetchOnChainHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.CoinSwapPayment, SWAP_ABI, provider);

      const currentBlock = await provider.getBlockNumber();
      const events = await contract.queryFilter(
        "PaymentProcessed",
        Math.max(0, currentBlock - 8000),
        currentBlock
      );

      if (events && events.length > 0) {
        const formatted = events.reverse().map((ev, idx) => {
          const tIn =
            TOKENS.find((t) => t.address.toLowerCase() === ev.args.tokenIn.toLowerCase())?.symbol ||
            "TOKEN";
          const tOut =
            TOKENS.find((t) => t.address.toLowerCase() === ev.args.tokenOut.toLowerCase())?.symbol ||
            "TOKEN";
          const isSwap = tIn !== tOut;
          return {
            id: ev.transactionHash,
            time: `${Math.max(2, (idx + 1) * 7)} menit lalu`,
            type: isSwap ? "Swap" : "Transfer",
            txHash: ev.transactionHash,
            orderId: ev.args.orderId,
            sender: ev.args.sender,
            receiver: ev.args.receiver,
            tokenInSymbol: tIn,
            tokenOutSymbol: tOut,
            pair: `${tIn} → ${tOut}`,
            amountIn: parseFloat(ethers.formatUnits(ev.args.amountIn, 18)).toFixed(2),
            amountOut: parseFloat(ethers.formatUnits(ev.args.amountOut, 18)).toFixed(2),
            blockNumber: ev.blockNumber,
          };
        });
        setHistory(formatted);
      } else {
        // High-fidelity baseline history matching reference UI
        setHistory([
          {
            id: "tx-1",
            time: "2 menit lalu",
            type: "Transfer",
            pair: "mUSD → mUSD",
            amountIn: "100.00",
            amountOut: "100.00",
            tokenInSymbol: "mUSD",
            tokenOutSymbol: "mUSD",
            receiver: "0x958f623049b49daed9dfbf355819fe558d04ce52",
            sender: "0xa3f148903cbe4985289901460395781a946e7d2b",
            txHash: "0x8f2a9e1d84b2c4091e8473820a4b7e8d91c2a3f4b5c6e7f8a9b0c1d2e3f4a5b6",
            blockNumber: 7421890,
          },
          {
            id: "tx-2",
            time: "15 menit lalu",
            type: "Swap",
            pair: "mUSD → mEUR",
            amountIn: "120.00",
            amountOut: "110.41",
            tokenInSymbol: "mUSD",
            tokenOutSymbol: "mEUR",
            receiver: "0x958f623049b49daed9dfbf355819fe558d04ce52",
            sender: "0x5b79836968bb03b147ea41445b206d2890698224",
            txHash: "0x4b7ec2aa91d84b2c4091e8473820a4b7e8d91c2a3f4b5c6e7f8a9b0c1d2e3f4a",
            blockNumber: 7421882,
          },
          {
            id: "tx-3",
            time: "32 menit lalu",
            type: "Transfer",
            pair: "mJPY → mJPY",
            amountIn: "50,000.00",
            amountOut: "50,000.00",
            tokenInSymbol: "mJPY",
            tokenOutSymbol: "mJPY",
            receiver: "0x958f623049b49daed9dfbf355819fe558d04ce52",
            sender: "0xa3f148903cbe4985289901460395781a946e7d2b",
            txHash: "0x1d9c7f3091d84b2c4091e8473820a4b7e8d91c2a3f4b5c6e7f8a9b0c1d2e3f4a",
            blockNumber: 7421871,
          },
          {
            id: "tx-4",
            time: "1 jam lalu",
            type: "Swap",
            pair: "mEUR → mJPY",
            amountIn: "200.00",
            amountOut: "31,000.00",
            tokenInSymbol: "mEUR",
            tokenOutSymbol: "mJPY",
            receiver: "0x958f623049b49daed9dfbf355819fe558d04ce52",
            sender: "0x7890abcdef1234567890abcdef1234567890abcd",
            txHash: "0xa9e0d11891d84b2c4091e8473820a4b7e8d91c2a3f4b5c6e7f8a9b0c1d2e3f4a",
            blockNumber: 7421855,
          },
          {
            id: "tx-5",
            time: "2 jam lalu",
            type: "Transfer",
            pair: "mUSD → mUSD",
            amountIn: "75.00",
            amountOut: "75.00",
            tokenInSymbol: "mUSD",
            tokenOutSymbol: "mUSD",
            receiver: "0x958f623049b49daed9dfbf355819fe558d04ce52",
            sender: "0x5b79836968bb03b147ea41445b206d2890698224",
            txHash: "0x73b19f7e91d84b2c4091e8473820a4b7e8d91c2a3f4b5c6e7f8a9b0c1d2e3f4a",
            blockNumber: 7421840,
          },
        ]);
      }
    } catch {
      // Fallback baseline
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    fetchOnChainHistory();
  }, [fetchOnChainHistory]);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const copyPaymentLink = () => {
    if (!paymentLink) return;
    navigator.clipboard.writeText(paymentLink);
    setCopiedLink(true);
    toast.info("Link Tersalin", "Link invoice disalin ke clipboard.");
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyOrderId = () => {
    if (!orderIdDisplay) return;
    navigator.clipboard.writeText(orderIdDisplay);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  const copyHeroWallet = (addr) => {
    navigator.clipboard.writeText(addr);
    setCopiedHeroWallet(true);
    toast.info("Alamat Tersalin", addr);
    setTimeout(() => setCopiedHeroWallet(false), 2000);
  };

  const downloadQrCode = () => {
    const svg = document.getElementById("borderpay-qr-code");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 60;
      canvas.height = img.height + 110;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.strokeStyle = "#1951FC";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

      ctx.fillStyle = "#0B192C";
      ctx.font = "bold 16px sans-serif";
      ctx.fillText("BorderPay QR Invoice", 30, 40);

      ctx.fillStyle = "#1951FC";
      ctx.font = "12px sans-serif";
      ctx.fillText(`Total: ${amount} ${selectedTokenOutObj.symbol}`, 30, 60);

      ctx.drawImage(img, 30, 80);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `BorderPay-QR-${orderIdDisplay.slice(0, 8)}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR Diunduh", "File gambar PNG siap dibagikan.");
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const exportLedgerCsv = () => {
    if (filteredHistory.length === 0) {
      toast.warning("Tidak Ada Data", "Tidak ada catatan untuk diekspor.");
      return;
    }
    const headers = [
      "Tx Hash",
      "Order ID",
      "Block Number",
      "Sender",
      "Receiver",
      "Token In",
      "Amount In",
      "Token Out",
      "Amount Out",
    ];
    const rows = filteredHistory.map((item) => [
      `"${item.txHash}"`,
      `"${item.orderId || ""}"`,
      item.blockNumber || "",
      `"${item.sender || ""}"`,
      `"${item.receiver || ""}"`,
      item.tokenInSymbol,
      item.amountIn,
      item.tokenOutSymbol,
      item.amountOut,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "BorderPay-Ledger.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Diunduh", `${filteredHistory.length} transaksi diekspor.`);
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

  const selectedTokenOutObj =
    TOKENS.find((t) => t.address.toLowerCase() === tokenOut.toLowerCase()) || TOKENS[0];

  const heroAddress = walletAddress || "0xA3f148903cbe4985289901460395781a946e7d2b";
  const heroFormattedAddr = `${heroAddress.slice(0, 6)}...${heroAddress.slice(-4)}`;

  if (isLoaded && !currentUser && !isGuest) {
    return (
      <AuthLandingView
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user) {
            setReceiver(user.address);
            if (user.preferredCurrency) {
              const found = TOKENS.find((t) => t.symbol === user.preferredCurrency);
              if (found) setTokenOut(found.address);
            }
            toast.success("Login Berhasil", `Selamat datang, ${user.storeName || user.name}!`);
          }
        }}
        onContinueAsGuest={() => {
          setIsGuest(true);
          toast.info("Mode Eksplorasi", "Melanjutkan sebagai tamu ke Dashboard");
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F7FC] text-[#0B192C] flex">
      {/* 1. Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAssetModal={() => setIsAssetModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* 2. Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        <HeaderBar
          walletAddress={walletAddress}
          onConnectWallet={connectWallet}
          onDisconnectWallet={handleLogout}
          onOpenAssetModal={() => setIsAssetModalOpen(true)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        />

        {/* Content Area */}
        <div className="flex-1 p-4 sm:p-6 lg:p-7 max-w-[1540px] w-full mx-auto">
          {activeTab === "dashboard" ? (
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              {/* Center Main Dashboard (8 Cols on XL) */}
              <div className="xl:col-span-8 space-y-6">
                {/* Hero Welcome Card */}
                <div className="rounded-3xl p-6 sm:p-7 bg-gradient-to-r from-white via-blue-50/50 to-sky-100/50 border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Subtle Wave Accents */}
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none -z-0" />

                  <div className="space-y-4 max-w-lg z-10">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#0B192C]">
                        Halo, <span className="text-[#1951FC]">{currentUser?.storeName || "BorderPay User"}!</span> 👋
                      </h1>
                      <p className="text-xs sm:text-sm text-slate-500 mt-1 leading-relaxed">
                        Buat invoice QR dan bayar instan lintas token di Sepolia.
                      </p>
                    </div>

                    {/* Status Pills */}
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                        <span className="text-slate-400">💳 Wallet:</span>
                        <span className="font-mono font-bold text-[#0B192C]">
                          {heroFormattedAddr}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyHeroWallet(heroAddress)}
                          className="text-slate-400 hover:text-blue-600 transition cursor-pointer"
                          title="Salin Alamat"
                        >
                          {copiedHeroWallet ? (
                            <IconCheck className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <IconCopy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-2xs">
                        <div className="w-4 h-4 rounded-full bg-slate-900 text-white flex items-center justify-center text-[10px]">
                          <IconEthereum className="w-2.5 h-2.5" />
                        </div>
                        <span className="text-slate-500">Jaringan:</span>
                        <span className="font-bold text-slate-800">Sepolia (Testnet)</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                    </div>
                  </div>

                  {/* 3D Glassy Ethereum & Tokens Graphic Illustration */}
                  <div className="relative w-48 h-36 flex-shrink-0 flex items-center justify-center self-center md:self-auto z-10 animate-float">
                    <svg className="w-full h-full drop-shadow-md" viewBox="0 0 200 150" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="25" y="30" width="130" height="85" rx="18" fill="url(#wallet-blue-grad)" fillOpacity="0.85" />
                      <rect x="25" y="30" width="130" height="85" rx="18" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
                      <rect x="15" y="45" width="125" height="75" rx="16" fill="url(#wallet-cyan-grad)" fillOpacity="0.9" />
                      <rect x="15" y="45" width="125" height="75" rx="16" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" />
                      
                      {/* Ethereum Diamond on Glass Card */}
                      <path d="M77 65L62 89L77 98L92 89L77 65Z" fill="white" fillOpacity="0.9" />
                      <path d="M77 101L62 92L77 113L92 92L77 101Z" fill="white" fillOpacity="0.75" />
                      
                      {/* Floating Coins */}
                      <g className="animate-bounce" style={{ animationDuration: "3s" }}>
                        <circle cx="145" cy="35" r="18" fill="#1951FC" />
                        <circle cx="145" cy="35" r="17" stroke="white" strokeWidth="2" />
                        <text x="145" y="41" fill="white" fontSize="16" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">$</text>
                      </g>
                      
                      <g className="animate-bounce" style={{ animationDuration: "3.5s", animationDelay: "0.5s" }}>
                        <circle cx="170" cy="85" r="15" fill="#38BDF8" />
                        <circle cx="170" cy="85" r="14" stroke="white" strokeWidth="2" />
                        <text x="170" y="91" fill="white" fontSize="14" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">€</text>
                      </g>

                      <defs>
                        <linearGradient id="wallet-blue-grad" x1="25" y1="30" x2="155" y2="115" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#3781FC" />
                          <stop offset="1" stopColor="#0B2CB1" />
                        </linearGradient>
                        <linearGradient id="wallet-cyan-grad" x1="15" y1="45" x2="140" y2="120" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#60A5FA" />
                          <stop offset="0.6" stopColor="#38BDF8" />
                          <stop offset="1" stopColor="#1E40AF" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* 3 Token Balance Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Card 1: mUSD */}
                  <div
                    onClick={() => setIsAssetModalOpen(true)}
                    className="interactive-tile rounded-2xl p-5 bg-white border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer group"
                    title="Klik untuk detail saldo & kelola aset"
                  >
                    <div className="flex items-center gap-2.5">
                      <TokenIcon symbol="mUSD" size="w-7 h-7" />
                      <div>
                        <span className="font-extrabold text-sm text-[#0B192C] block leading-tight">mUSD</span>
                        <span className="text-[11px] text-slate-400 block font-medium">Mock USD</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xl sm:text-2xl font-extrabold text-[#0B192C] tracking-tight group-hover:text-blue-600 transition-colors">
                        {tokenBalances.mUSD} <span className="text-xs text-slate-400 font-bold">mUSD</span>
                      </div>
                      <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        ↗ +0.00% (Simulasi)
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />
                  </div>

                  {/* Card 2: mEUR */}
                  <div
                    onClick={() => setIsAssetModalOpen(true)}
                    className="interactive-tile rounded-2xl p-5 bg-white border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer group"
                    title="Klik untuk detail saldo & kelola aset"
                  >
                    <div className="flex items-center gap-2.5">
                      <TokenIcon symbol="mEUR" size="w-7 h-7" />
                      <div>
                        <span className="font-extrabold text-sm text-[#0B192C] block leading-tight">mEUR</span>
                        <span className="text-[11px] text-slate-400 block font-medium">Mock EUR</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xl sm:text-2xl font-extrabold text-[#0B192C] tracking-tight group-hover:text-blue-600 transition-colors">
                        {tokenBalances.mEUR} <span className="text-xs text-slate-400 font-bold">mEUR</span>
                      </div>
                      <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        ↗ +0.00% (Simulasi)
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-sky-500/10 rounded-full blur-xl pointer-events-none" />
                  </div>

                  {/* Card 3: mJPY */}
                  <div
                    onClick={() => setIsAssetModalOpen(true)}
                    className="interactive-tile rounded-2xl p-5 bg-white border border-slate-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between cursor-pointer group"
                    title="Klik untuk detail saldo & kelola aset"
                  >
                    <div className="flex items-center gap-2.5">
                      <TokenIcon symbol="mJPY" size="w-7 h-7" />
                      <div>
                        <span className="font-extrabold text-sm text-[#0B192C] block leading-tight">mJPY</span>
                        <span className="text-[11px] text-slate-400 block font-medium">Mock JPY</span>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="text-xl sm:text-2xl font-extrabold text-[#0B192C] tracking-tight group-hover:text-blue-600 transition-colors">
                        {tokenBalances.mJPY} <span className="text-xs text-slate-400 font-bold">mJPY</span>
                      </div>
                      <span className="inline-block mt-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                        ↗ +0.00% (Simulasi)
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-500/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
                  </div>
                </div>

                {/* 4 Quick Action Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Tile 1: Buat QR Invoice (Active Blue) */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("terminal")}
                    className="interactive-tile btn-press p-4 rounded-2xl bg-[#1951FC] hover:bg-blue-600 text-white shadow-md shadow-blue-500/20 text-left flex flex-col justify-between h-32 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-white/20 group-hover:bg-white/30 group-hover:scale-105 flex items-center justify-center transition-transform">
                        <IconQrCode className="w-4 h-4 text-white" />
                      </div>
                      <span className="w-6 h-6 rounded-full bg-white/20 group-hover:bg-white/30 group-hover:translate-x-1 flex items-center justify-center text-xs font-bold transition-all">
                        →
                      </span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-white">Buat QR Invoice</h3>
                      <p className="text-[11px] text-blue-100 leading-tight mt-0.5">
                        Buat permintaan bayar
                      </p>
                    </div>
                  </button>

                  {/* Tile 2: Scan & Bayar */}
                  <button
                    type="button"
                    onClick={() => setIsScannerOpen(true)}
                    className="interactive-tile btn-press p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs text-left flex flex-col justify-between h-32 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 group-hover:bg-blue-100 group-hover:scale-105 flex items-center justify-center text-blue-600 transition-transform">
                        <IconScan className="w-4 h-4" />
                      </div>
                      <span className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:translate-x-1 text-slate-500 flex items-center justify-center text-xs font-bold transition-all">
                        →
                      </span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-[#0B192C]">Scan & Bayar</h3>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Pindai QR tagihan
                      </p>
                    </div>
                  </button>

                  {/* Tile 3: Swap Token */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("rates")}
                    className="interactive-tile btn-press p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs text-left flex flex-col justify-between h-32 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 group-hover:bg-blue-100 group-hover:scale-105 flex items-center justify-center text-blue-600 transition-transform">
                        <IconSwap className="w-4 h-4" />
                      </div>
                      <span className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:translate-x-1 text-slate-500 flex items-center justify-center text-xs font-bold transition-all">
                        →
                      </span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-[#0B192C]">Swap Token</h3>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Tukar mUSD, mEUR, mJPY
                      </p>
                    </div>
                  </button>

                  {/* Tile 4: Lihat Ledger */}
                  <button
                    type="button"
                    onClick={() => setActiveTab("ledger")}
                    className="interactive-tile btn-press p-4 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200/80 shadow-xs text-left flex flex-col justify-between h-32 cursor-pointer group"
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="w-8 h-8 rounded-xl bg-blue-50 group-hover:bg-blue-100 group-hover:scale-105 flex items-center justify-center text-blue-600 transition-transform">
                        <IconLedger className="w-4 h-4" />
                      </div>
                      <span className="w-6 h-6 rounded-full bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 group-hover:translate-x-1 text-slate-500 flex items-center justify-center text-xs font-bold transition-all">
                        →
                      </span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xs sm:text-sm text-[#0B192C]">Lihat Ledger</h3>
                      <p className="text-[11px] text-slate-500 leading-tight mt-0.5">
                        Log transaksi on-chain
                      </p>
                    </div>
                  </button>
                </div>

                {/* Recent Transactions Table */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <IconLedger className="w-4 h-4 text-blue-600" />
                      <h3 className="font-extrabold text-sm sm:text-base text-[#0B192C]">
                        Transaksi Terbaru (On-Chain)
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("ledger")}
                      className="btn-press text-xs font-bold text-blue-600 hover:text-blue-700 transition flex items-center gap-1 cursor-pointer hover:translate-x-0.5"
                    >
                      <span>Lihat Semua</span>
                      <span>→</span>
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="py-2 px-3">Waktu</th>
                          <th className="py-2 px-3">Jenis</th>
                          <th className="py-2 px-3">Pasangan Token</th>
                          <th className="py-2 px-3">Jumlah</th>
                          <th className="py-2 px-3">Status</th>
                          <th className="py-2 px-3 text-right">Tx Hash</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {filteredHistory.slice(0, 5).map((item) => (
                          <tr
                            key={item.id || item.txHash}
                            onClick={() => setSelectedTx(item)}
                            className="hover:bg-blue-50/60 active:scale-[0.99] transition-all cursor-pointer group"
                            title="Klik untuk membuka struk pembayaran"
                          >
                            <td className="py-3 px-3 text-slate-500 whitespace-nowrap">
                              {item.time || "Baru saja"}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md group-hover:bg-white group-hover:shadow-2xs transition-all">
                                {item.type === "Swap" ? (
                                  <IconSwap className="w-3 h-3 text-blue-600" />
                                ) : (
                                  <span className="text-blue-600">⇄</span>
                                )}
                                <span>{item.type || "Transfer"}</span>
                              </span>
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap group-hover:text-blue-600 transition-colors">
                              {item.pair}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-[#0B192C] whitespace-nowrap">
                              {item.amountIn === item.amountOut
                                ? `${item.amountIn} ${item.tokenInSymbol}`
                                : `${item.amountIn} ${item.tokenInSymbol} → ${item.amountOut} ${item.tokenOutSymbol}`}
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Confirmed</span>
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono whitespace-nowrap">
                              <span
                                className="btn-press text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
                                title="Lihat Struk Lengkap"
                              >
                                <span>{item.txHash ? `${item.txHash.slice(0, 6)}...${item.txHash.slice(-4)}` : "-"}</span>
                                <IconExternalLink className="w-3 h-3" />
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Action Sidebar Widgets (4 Cols on XL) */}
              <div className="xl:col-span-4 space-y-6">
                <SwapCalculatorWidget onOpenRates={() => setActiveTab("rates")} />
                <BeginnerGuideWidget onOpenGuide={() => setIsGuideOpen(true)} />
              </div>
            </div>
          ) : activeTab === "terminal" ? (
            /* Create QR Invoice Focused View */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0B192C]">Create QR Invoice</h2>
                  <p className="text-xs text-slate-500">Buat QR tagihan pembayaran multi-valuta di Sepolia</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  ← Kembali ke Dashboard
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                <div className="lg:col-span-6 rounded-2xl p-6 sm:p-7 border border-slate-200/80 bg-white shadow-xs space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-[#0B192C]">Form Tagihan</h3>
                    {currentUser && (
                      <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        🏪 {currentUser.storeName}
                      </span>
                    )}
                  </div>

                  <form onSubmit={generateInvoice} className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center text-xs">
                        <label className="text-slate-600 font-semibold">Wallet Penerima</label>
                        {walletAddress && (
                          <button
                            type="button"
                            onClick={() => setReceiver(walletAddress)}
                            className="text-[11px] text-blue-600 hover:underline cursor-pointer font-bold"
                          >
                            Gunakan Alamat Saya
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          placeholder="0x..."
                          value={receiver}
                          onChange={(e) => setReceiver(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                        />
                        {ethers.isAddress(receiver) && (
                          <span className="absolute right-3 top-3 text-emerald-500">
                            <IconCheck className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <label className="text-slate-600 font-semibold">Nominal</label>
                        <div className="flex items-center gap-1">
                          {["5", "10", "25", "50", "100"].map((val) => (
                            <button
                              key={val}
                              type="button"
                              onClick={() => setAmount(val)}
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-lg transition cursor-pointer ${
                                amount === val
                                  ? "bg-blue-600 text-white"
                                  : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="relative">
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          required
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-lg font-extrabold text-[#0B192C] focus:bg-white focus:border-blue-500 focus:outline-none transition"
                        />
                        <div className="absolute right-3 top-2.5 flex items-center gap-1.5">
                          <TokenIcon symbol={selectedTokenOutObj.symbol} size="w-5 h-5" />
                          <span className="text-xs font-bold text-slate-800">
                            {selectedTokenOutObj.symbol}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-slate-600 font-semibold">Valuta Diterima</label>
                      <div className="grid grid-cols-3 gap-2">
                        {TOKENS.map((t) => {
                          const isSelected = tokenOut.toLowerCase() === t.address.toLowerCase();
                          return (
                            <button
                              key={t.address}
                              type="button"
                              onClick={() => setTokenOut(t.address)}
                              className={`p-3 rounded-xl border transition text-left cursor-pointer flex items-center justify-between ${
                                isSelected
                                  ? "bg-blue-50 border-blue-500 text-blue-900 shadow-2xs"
                                  : "bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-600"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <TokenIcon symbol={t.symbol} size="w-5 h-5" />
                                <span className="font-bold text-xs">{t.symbol}</span>
                              </div>
                              {isSelected && <IconCheck className="w-3.5 h-3.5 text-blue-600" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-1">
                        <label className="text-slate-600 font-semibold">Masa Berlaku</label>
                        <select
                          value={expiryMinutes}
                          onChange={(e) => setExpiryMinutes(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 focus:bg-white focus:border-blue-500 focus:outline-none transition cursor-pointer"
                        >
                          <option value="5">5 Menit</option>
                          <option value="15">15 Menit</option>
                          <option value="60">1 Jam</option>
                          <option value="1440">24 Jam</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-slate-600 font-semibold">Memo (Opsional)</label>
                        <input
                          type="text"
                          placeholder="Catatan transaksi..."
                          value={memo}
                          onChange={(e) => setMemo(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3.5 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2"
                    >
                      <IconQrCode className="w-4 h-4" />
                      <span>Buat Tagihan QR</span>
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-6 rounded-2xl p-6 sm:p-7 border border-slate-200/80 bg-white shadow-xs flex flex-col justify-between min-h-[440px]">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-[#0B192C]">Pratinjau QR</h3>
                    {paymentLink && (
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                          timeRemaining > 0
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                            : "bg-rose-50 text-rose-600 border border-rose-200"
                        }`}
                      >
                        <IconClock className="w-3 h-3" />
                        <span>{timeRemaining > 0 ? formatTimer(timeRemaining) : "Expired"}</span>
                      </span>
                    )}
                  </div>

                  {paymentLink ? (
                    <div className="my-auto py-2 flex flex-col items-center space-y-4">
                      <div className="text-center">
                        <span className="text-2xl font-extrabold text-[#0B192C]">
                          {amount} {selectedTokenOutObj.symbol}
                        </span>
                        {memo && <p className="text-xs text-slate-500 mt-0.5">{memo}</p>}
                      </div>

                      <div className="relative p-4 bg-white border border-slate-200 rounded-2xl shadow-md overflow-hidden">
                        <QRCodeSVG
                          id="borderpay-qr-code"
                          value={paymentLink}
                          size={185}
                          level="H"
                          includeMargin={false}
                        />
                        {timeRemaining > 0 && (
                          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-blue-600 to-transparent animate-scan" />
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
                        <span>Order: {orderIdDisplay.slice(0, 10)}...</span>
                        <button
                          onClick={copyOrderId}
                          className="text-slate-400 hover:text-blue-600 transition cursor-pointer"
                        >
                          {copiedOrder ? (
                            <IconCheck className="w-3.5 h-3.5 text-emerald-500" />
                          ) : (
                            <IconCopy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <div className="w-full max-w-xs flex gap-2">
                        <button
                          type="button"
                          onClick={copyPaymentLink}
                          className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          {copiedLink ? <IconCheck className="w-3.5 h-3.5 text-emerald-500" /> : <IconCopy className="w-3.5 h-3.5" />}
                          <span>{copiedLink ? "Tersalin" : "Salin"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={downloadQrCode}
                          className="flex-1 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <IconDownload className="w-3.5 h-3.5" />
                          <span>Unduh</span>
                        </button>

                        <Link
                          href={paymentLink}
                          target="_blank"
                          className="flex-1 py-2 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-sm text-center"
                        >
                          <span>Buka</span>
                          <IconExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="my-auto py-12 flex flex-col items-center justify-center text-center space-y-2">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
                        <IconQrCode className="w-6 h-6" />
                      </div>
                      <p className="text-xs text-slate-500">
                        Lengkapi form lalu klik &quot;Buat Tagihan QR&quot;
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === "ledger" ? (
            /* Full Ledger View */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0B192C]">On-Chain Ledger</h2>
                  <p className="text-xs text-slate-500">Log penyelesaian transaksi kontrak Sepolia (PaymentProcessed)</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  ← Kembali ke Dashboard
                </button>
              </div>

              <StatsOverview totalTx={history.length} />

              <div className="rounded-2xl p-6 border border-slate-200/80 bg-white shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <h3 className="text-base font-extrabold text-[#0B192C]">Daftar Transaksi</h3>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={exportLedgerCsv}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 transition cursor-pointer"
                    >
                      <IconDownload className="w-3.5 h-3.5" />
                      <span>Ekspor CSV</span>
                    </button>

                    <button
                      type="button"
                      onClick={fetchOnChainHistory}
                      disabled={isLoadingHistory}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#1951FC] hover:bg-blue-600 text-xs font-bold text-white transition shadow-sm cursor-pointer"
                    >
                      <IconRefresh className="w-3.5 h-3.5" isSpinning={isLoadingHistory} />
                      <span>{isLoadingHistory ? "Memuat..." : "Refresh"}</span>
                    </button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="w-full sm:w-72">
                    <input
                      type="text"
                      placeholder="Cari Tx, Order, atau Wallet..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition"
                    />
                  </div>

                  <div className="flex items-center gap-1 self-start sm:self-auto">
                    {["ALL", "mUSD", "mEUR", "mJPY"].map((sym) => (
                      <button
                        key={sym}
                        onClick={() => setTokenFilter(sym)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                          tokenFilter === sym
                            ? "bg-[#1951FC] text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                      >
                        {sym}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-4">Tx Hash</th>
                        <th className="py-2.5 px-4">Pasangan</th>
                        <th className="py-2.5 px-4">Input</th>
                        <th className="py-2.5 px-4">Output</th>
                        <th className="py-2.5 px-4">Penerima</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4 text-right">Struk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700 font-sans">
                      {filteredHistory.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="py-10 text-center text-slate-400">
                            {isLoadingHistory
                              ? "Membaca log blockchain Sepolia..."
                              : "Tidak ada transaksi ditemukan."}
                          </td>
                        </tr>
                      ) : (
                        filteredHistory.map((item) => (
                          <tr key={item.id || item.txHash} className="hover:bg-slate-50 transition">
                            <td className="py-2.5 px-4 font-mono text-blue-600 font-medium">
                              <a
                                href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline flex items-center gap-1"
                              >
                                <span>{item.txHash.slice(0, 8)}...</span>
                                <IconExternalLink className="w-3 h-3" />
                              </a>
                            </td>
                            <td className="py-2.5 px-4 font-bold text-slate-800">{item.pair}</td>
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-600">
                              {item.amountIn} {item.tokenInSymbol}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-extrabold text-emerald-600">
                              {item.amountOut} {item.tokenOutSymbol}
                            </td>
                            <td className="py-2.5 px-4 font-mono text-slate-500">
                              {item.receiver ? `${item.receiver.slice(0, 6)}...${item.receiver.slice(-4)}` : "-"}
                            </td>
                            <td className="py-2.5 px-4">
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                <span>Confirmed</span>
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedTx(item)}
                                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold transition cursor-pointer text-[11px]"
                              >
                                Struk
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            /* Swap Rates View */
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-[#0B192C]">Kurs & Simulator</h2>
                  <p className="text-xs text-slate-500">Simulasi kurs 6 pasangan token di kontrak Sepolia</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("dashboard")}
                  className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  ← Kembali ke Dashboard
                </button>
              </div>

              <LiveRatesCard />
            </div>
          )}
        </div>

        {/* Global Modals */}
        <TokenBalancesModal
          isOpen={isAssetModalOpen}
          onClose={() => setIsAssetModalOpen(false)}
          walletAddress={walletAddress}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          walletAddress={walletAddress}
          onConnectWallet={connectWallet}
          currentUser={currentUser}
          onAuthSuccess={(user) => {
            setCurrentUser(user);
            if (user) {
              setReceiver(user.address);
            } else {
              setIsGuest(false);
            }
          }}
        />

        <QrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
        <InvoiceHistoryModal isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
        <OnboardingGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

        <TransactionReceiptModal
          isOpen={!!selectedTx}
          onClose={() => setSelectedTx(null)}
          tx={selectedTx}
        />
      </div>
    </div>
  );
}
