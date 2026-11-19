"use client";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ethers } from "ethers";
import { TOKENS, CONTRACT_ADDRESSES, SWAP_ABI } from "../constants/contracts";
import Navbar from "../components/Navbar";
import TokenBalancesModal from "../components/TokenBalancesModal";
import AuthModal from "../components/AuthModal";
import LiveRatesCard from "../components/LiveRatesCard";
import StatsOverview from "../components/StatsOverview";
import TransactionReceiptModal from "../components/TransactionReceiptModal";
import { getActiveSession, findUserByAddress, logoutUser } from "../lib/auth";
import {
  TokenIcon,
  IconQrCode,
  IconCopy,
  IconCheck,
  IconExternalLink,
  IconDownload,
  IconRefresh,
  IconShieldCheck,
  IconClock,
  IconSparkles,
  IconWallet,
} from "../components/Icons";

export default function Home() {
  const [receiver, setReceiver] = useState("");
  const [tokenOut, setTokenOut] = useState(TOKENS[0].address);
  const [amount, setAmount] = useState("10");
  const [expiryMinutes, setExpiryMinutes] = useState("15");
  const [memo, setMemo] = useState("Pembayaran Tagihan BorderPay");
  const [paymentLink, setPaymentLink] = useState("");
  const [orderIdDisplay, setOrderIdDisplay] = useState("");
  const [deadlineDisplay, setDeadlineDisplay] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // App UI States
  const [activeTab, setActiveTab] = useState("terminal");
  const [walletAddress, setWalletAddress] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOrder, setCopiedOrder] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  // History & Ledger States
  const [history, setHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [tokenFilter, setTokenFilter] = useState("ALL");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Initialize active session on client load
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
  }, []);

  // Connect Wallet
  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      return alert("Ekstensi Wallet tidak terdeteksi! Pastikan MetaMask terpasang.");
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        setWalletAddress(addr);

        // Check if this wallet is already registered
        const existing = findUserByAddress(addr);
        if (existing) {
          setCurrentUser(existing);
          setReceiver(existing.address);
        } else if (!receiver) {
          setReceiver(addr);
        }
      }
    } catch (err) {
      alert("Gagal terhubung ke wallet: " + (err.message || "Periksa ekstensi wallet."));
    }
  };

  const handleLogout = () => {
    logoutUser();
    setCurrentUser(null);
  };

  // Generate Invoice
  const generateInvoice = (e) => {
    if (e) e.preventDefault();
    if (!ethers.isAddress(receiver)) {
      return alert("Alamat wallet penerima tidak valid! Harus diawali '0x' dan berjumlah 42 karakter.");
    }

    const rawId = `BP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const orderIdHash = ethers.id(rawId);
    const deadline = Math.floor(Date.now() / 1000) + parseInt(expiryMinutes) * 60;

    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      orderId: orderIdHash,
      receiver,
      tokenOut,
      amount,
      deadline: deadline.toString(),
      memo: memo || "Pembayaran Tagihan BorderPay",
      merchant: currentUser?.storeName || "",
    });

    const fullLink = `${baseUrl}/pay?${params.toString()}`;
    setPaymentLink(fullLink);
    setOrderIdDisplay(orderIdHash);
    setDeadlineDisplay(deadline);
    setTimeRemaining(parseInt(expiryMinutes) * 60);
  };

  // Countdown Timer
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

  // Fetch On-Chain History
  const fetchOnChainHistory = async () => {
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

      const formatted = events.reverse().map((ev) => {
        const tIn = TOKENS.find((t) => t.address.toLowerCase() === ev.args.tokenIn.toLowerCase())?.symbol || "TOKEN";
        const tOut = TOKENS.find((t) => t.address.toLowerCase() === ev.args.tokenOut.toLowerCase())?.symbol || "TOKEN";
        return {
          txHash: ev.transactionHash,
          orderId: ev.args.orderId,
          sender: ev.args.sender,
          receiver: ev.args.receiver,
          tokenInSymbol: tIn,
          tokenOutSymbol: tOut,
          pair: `${tIn} → ${tOut}`,
          amountIn: parseFloat(ethers.formatUnits(ev.args.amountIn, 18)).toFixed(4),
          amountOut: parseFloat(ethers.formatUnits(ev.args.amountOut, 18)).toFixed(4),
          blockNumber: ev.blockNumber,
        };
      });
      setHistory(formatted);
    } catch (err) {
      console.error("Gagal mengambil log on-chain:", err);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchOnChainHistory();
  }, []);

  const formatTimer = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const copyPaymentLink = () => {
    if (!paymentLink) return;
    navigator.clipboard.writeText(paymentLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const copyOrderId = () => {
    if (!orderIdDisplay) return;
    navigator.clipboard.writeText(orderIdDisplay);
    setCopiedOrder(true);
    setTimeout(() => setCopiedOrder(false), 2000);
  };

  const downloadQrCode = () => {
    const svg = document.getElementById("borderpay-qr-code");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 40;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `BorderPay-QR-${orderIdDisplay.slice(0, 8)}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      item.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.receiver.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sender.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesToken =
      tokenFilter === "ALL" ||
      item.tokenInSymbol === tokenFilter ||
      item.tokenOutSymbol === tokenFilter;

    return matchesSearch && matchesToken;
  });

  const selectedTokenOutObj = TOKENS.find((t) => t.address === tokenOut) || TOKENS[0];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col relative selection:bg-indigo-500/20 selection:text-indigo-900">
      {/* Background Soft Ambient Light Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-indigo-100/70 rounded-full blur-[100px]" />
        <div className="absolute top-1/4 -right-32 w-96 h-96 bg-blue-100/60 rounded-full blur-[120px]" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-cyan-100/60 rounded-full blur-[100px]" />
      </div>

      {/* Navbar */}
      <Navbar
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAssetModal={() => setIsAssetModalOpen(true)}
        currentUser={currentUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header & Protocol Stats */}
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-2">
                <IconSparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Multi-Currency Web3 Settlement Engine</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
                Cross-Border QR Payment Gateway
              </h1>
              <p className="text-slate-600 text-sm mt-1 max-w-2xl">
                Solusi pembayaran multi-valuta instan (USD, EUR, JPY) berbasis QR Code dengan pertukaran
                otomatis di smart contract Ethereum Sepolia.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {!currentUser && (
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-xs font-bold text-indigo-700 transition cursor-pointer shadow-sm"
                >
                  👤 Masuk / Daftar Akun
                </button>
              )}
              <button
                onClick={() => setIsAssetModalOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>🦊</span>
                <span>Saldo & Faucet</span>
              </button>
            </div>
          </div>

          {/* Metric Overview Cards */}
          <StatsOverview totalTx={history.length} />
        </div>

        {/* Tab 1: Terminal & POS View */}
        {activeTab === "terminal" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Invoice Generator Form */}
            <div className="lg:col-span-6 glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 bg-white shadow-sm hover:shadow-md transition space-y-6">
              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Buat Permintaan Pembayaran</h2>
                    <p className="text-xs text-slate-500">Tentukan nominal tagihan dan koin yang diterima</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Fixed-Rate POS
                </span>
              </div>

              {/* Merchant Account Notice Banner */}
              {currentUser ? (
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                      {currentUser.storeName[0].toUpperCase()}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">{currentUser.storeName}</p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        Alamat Penerima: {currentUser.address.slice(0, 6)}...{currentUser.address.slice(-4)}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    Akun Aktif
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-center justify-between text-xs text-amber-800">
                  <span>💡 Ingin nama toko Anda muncul di invoice?</span>
                  <button
                    type="button"
                    onClick={() => setIsAuthModalOpen(true)}
                    className="font-bold underline text-amber-900 ml-2 cursor-pointer"
                  >
                    Daftar Akun
                  </button>
                </div>
              )}

              <form onSubmit={generateInvoice} className="space-y-5">
                {/* Receiver Wallet */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">
                      Alamat Wallet Penerima (Sepolia)
                    </label>
                    {walletAddress && (
                      <button
                        type="button"
                        onClick={() => setReceiver(walletAddress)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 cursor-pointer"
                      >
                        Gunakan Alamat Dompet Saya
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-mono text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
                    />
                    {ethers.isAddress(receiver) && (
                      <span className="absolute right-3 top-3.5 text-emerald-600">
                        <IconCheck className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount & Quick Presets */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-semibold text-slate-700">Jumlah Tagihan</label>
                    <div className="flex items-center gap-1">
                      {["5", "10", "25", "50", "100"].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setAmount(val)}
                          className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition cursor-pointer ${
                            amount === val
                              ? "bg-indigo-600 text-white shadow-sm"
                              : "bg-slate-100 hover:bg-slate-200 text-slate-700"
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                    />
                    <div className="absolute right-3 top-2.5 flex items-center gap-2">
                      <TokenIcon symbol={selectedTokenOutObj.symbol} size="w-6 h-6" />
                      <span className="text-xs font-bold text-slate-700">
                        {selectedTokenOutObj.symbol}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Token Choice Cards */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    Mata Uang yang Diterima (Penerima)
                  </label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {TOKENS.map((t) => {
                      const isSelected = tokenOut === t.address;
                      return (
                        <button
                          key={t.address}
                          type="button"
                          onClick={() => setTokenOut(t.address)}
                          className={`p-3.5 rounded-2xl border transition text-left cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-600 ring-2 ring-indigo-600/20 shadow-sm"
                              : "bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-700"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <TokenIcon symbol={t.symbol} size="w-6 h-6" />
                            {isSelected && <IconCheck className="w-3.5 h-3.5 text-indigo-600" />}
                          </div>
                          <div className="mt-2">
                            <span className="block font-bold text-sm text-slate-900">{t.symbol}</span>
                            <span className="text-[11px] text-slate-500">{t.name}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Expiry & Memo */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Masa Berlaku QR</label>
                    <select
                      value={expiryMinutes}
                      onChange={(e) => setExpiryMinutes(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                    >
                      <option value="5">5 Menit (Sesi Cepat)</option>
                      <option value="15">15 Menit (Standar POS)</option>
                      <option value="60">1 Jam (Fleksibel)</option>
                      <option value="1440">24 Jam (Tagihan Harian)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Keterangan / Memo</label>
                    <input
                      type="text"
                      placeholder="Contoh: Kopi Latte / Jasa IT"
                      value={memo}
                      onChange={(e) => setMemo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600 transition"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition transform active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
                >
                  <IconQrCode className="w-4 h-4" />
                  <span>Generate QR Invoice Dinamis</span>
                </button>
              </form>
            </div>

            {/* Right: Interactive Smart POS Terminal */}
            <div className="lg:col-span-6 glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 bg-white shadow-sm hover:shadow-md transition flex flex-col justify-between min-h-[520px]">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-cyan-50 border border-cyan-100 flex items-center justify-center text-cyan-600 font-bold text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-slate-900">Smart POS Terminal</h2>
                    <p className="text-xs text-slate-500">Tampilan scannable QR untuk pengirim</p>
                  </div>
                </div>
                {paymentLink && (
                  <span
                    className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                      timeRemaining > 0
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}
                  >
                    <IconClock className="w-3 h-3" />
                    <span>{timeRemaining > 0 ? formatTimer(timeRemaining) : "Expired"}</span>
                  </span>
                )}
              </div>

              {/* QR Display Area */}
              {paymentLink ? (
                <div className="my-auto py-4 flex flex-col items-center space-y-5">
                  <div className="text-center">
                    {currentUser && (
                      <span className="inline-block text-xs font-bold text-indigo-700 px-2.5 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 mb-1">
                        🏪 {currentUser.storeName}
                      </span>
                    )}
                    <span className="block text-xs uppercase font-semibold text-slate-500 tracking-wider">
                      Total Tagihan
                    </span>
                    <div className="flex items-center justify-center gap-2 mt-1">
                      <TokenIcon symbol={selectedTokenOutObj.symbol} size="w-7 h-7" />
                      <span className="text-3xl font-extrabold text-slate-900">
                        {amount} {selectedTokenOutObj.symbol}
                      </span>
                    </div>
                    {memo && <p className="text-xs text-slate-500 mt-1 italic font-sans">{memo}</p>}
                  </div>

                  {/* Scannable QR Frame with Laser Scan */}
                  <div className="relative p-5 bg-white rounded-3xl shadow-xl border-2 border-slate-200 overflow-hidden">
                    <QRCodeSVG
                      id="borderpay-qr-code"
                      value={paymentLink}
                      size={210}
                      level="H"
                      includeMargin={false}
                    />
                    {timeRemaining > 0 && (
                      <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-indigo-600 to-transparent animate-scan shadow-lg shadow-indigo-600/50" />
                    )}
                  </div>

                  {/* Details Card */}
                  <div className="w-full max-w-sm bg-slate-50 rounded-2xl p-3 border border-slate-200/80 text-xs space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Order ID:</span>
                      <button
                        type="button"
                        onClick={copyOrderId}
                        className="font-mono text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                        title="Salin Order ID"
                      >
                        <span>{orderIdDisplay.slice(0, 14)}...</span>
                        {copiedOrder ? (
                          <IconCheck className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <IconCopy className="w-3 h-3 text-slate-400" />
                        )}
                      </button>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500 font-medium">Penerima:</span>
                      <span className="font-mono text-slate-700">
                        {receiver.slice(0, 6)}...{receiver.slice(-4)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="w-full max-w-sm flex flex-col sm:flex-row gap-2">
                    <button
                      type="button"
                      onClick={copyPaymentLink}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {copiedLink ? (
                        <IconCheck className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <IconCopy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedLink ? "Tersalin!" : "Salin Link"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={downloadQrCode}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-semibold text-slate-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <IconDownload className="w-3.5 h-3.5" />
                      <span>Unduh QR</span>
                    </button>

                    <a
                      href={paymentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <span>Bayar</span>
                      <IconExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="my-auto py-16 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-slate-200 rounded-3xl p-6 bg-slate-50/50">
                  <div className="w-16 h-16 rounded-3xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 shadow-sm">
                    <IconQrCode className="w-8 h-8 opacity-60" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-700 text-sm">Belum Ada Tagihan Aktif</h3>
                    <p className="text-xs text-slate-500 max-w-xs mt-1">
                      Lengkapi nominal dan token di form sebelah kiri, lalu klik &quot;Generate QR Invoice Dinamis&quot;.
                    </p>
                  </div>
                </div>
              )}

              {/* Protocol Security Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <IconShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Ethereum Sepolia Validated</span>
                </span>
                <span>Anti-Replay Protection Active</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: On-Chain Ledger & Reconciliation */}
        {activeTab === "ledger" && (
          <div className="glass-card rounded-3xl p-6 sm:p-7 border border-slate-200 bg-white shadow-sm hover:shadow-md transition space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Dashboard Rekonsiliasi On-Chain</span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Live Blocks
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Log penyelesaian transaksi langsung dari event kontrak (PaymentProcessed)
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchOnChainHistory}
                  disabled={isLoadingHistory}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 transition cursor-pointer"
                >
                  <IconRefresh className="w-3.5 h-3.5" isSpinning={isLoadingHistory} />
                  <span>{isLoadingHistory ? "Memuat..." : "Refresh Event"}</span>
                </button>
              </div>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
              <div className="w-full sm:w-72">
                <input
                  type="text"
                  placeholder="Cari Tx Hash, Order ID, atau Wallet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-indigo-600"
                />
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                {["ALL", "mUSD", "mEUR", "mJPY"].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setTokenFilter(sym)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                      tokenFilter === sym
                        ? "bg-indigo-600 text-white shadow-sm"
                        : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            {/* Ledger Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Tx Hash</th>
                    <th className="py-3 px-4">Pasangan Token</th>
                    <th className="py-3 px-4">Input Dibayar</th>
                    <th className="py-3 px-4">Output Diterima</th>
                    <th className="py-3 px-4">Penerima</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="py-12 text-center text-slate-400">
                        {isLoadingHistory
                          ? "Sedang membaca log blockchain Sepolia..."
                          : "Tidak ada transaksi yang cocok dengan filter."}
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.txHash} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono text-indigo-600 font-medium">
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
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-800 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                            {item.pair}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-slate-700">
                          {item.amountIn} {item.tokenInSymbol}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-600">
                          {item.amountOut} {item.tokenOutSymbol}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {item.receiver.slice(0, 6)}...{item.receiver.slice(-4)}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Confirmed
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedTx(item)}
                            className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                          >
                            Struk 🧾
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 3: Live Rates */}
        {activeTab === "rates" && <LiveRatesCard />}
      </main>

      {/* Asset / Faucet Modal */}
      <TokenBalancesModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        walletAddress={walletAddress}
      />

      {/* Auth Modal (Sign Up, Login, Profile) */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        currentUser={currentUser}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user) setReceiver(user.address);
        }}
      />

      {/* Transaction Receipt Modal */}
      <TransactionReceiptModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        tx={selectedTx}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© 2026 BorderPay Protocol • Demonstrasi Akademik Blockchain TI-B Kelompok 8</p>
          <div className="flex items-center gap-4 text-slate-600">
            <a
              href={`https://sepolia.etherscan.io/address/${CONTRACT_ADDRESSES.CoinSwapPayment}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-1 font-medium"
            >
              <span>Smart Contract</span>
              <IconExternalLink className="w-3 h-3" />
            </a>
            <span>•</span>
            <span>Sepolia Testnet</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
