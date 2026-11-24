"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { TOKENS, CONTRACT_ADDRESSES, SWAP_ABI, ERC20_ABI } from "../constants/contracts";
import TopNavbar from "../components/TopNavbar";
import OceanBackdrop from "../components/OceanBackdrop";
import OverviewView from "../components/OverviewView";
import CreateQrView from "../components/CreateQrView";
import LiveRatesCard from "../components/LiveRatesCard";
import LedgerView from "../components/LedgerView";
import SettingsView from "../components/SettingsView";
import AuthLandingView from "../components/AuthLandingView";
import TokenBalancesModal from "../components/TokenBalancesModal";
import AuthModal from "../components/AuthModal";
import QrScannerModal from "../components/QrScannerModal";
import InvoiceHistoryModal from "../components/InvoiceHistoryModal";
import OnboardingGuideModal from "../components/OnboardingGuideModal";
import TransactionReceiptModal from "../components/TransactionReceiptModal";
import { useToast } from "../components/ToastContext";
import { getActiveSession, findUserByAddress, logoutUser } from "../lib/auth";
import { computeInvoiceChecksum } from "../lib/invoiceIntegrity";
import { saveLocalInvoice } from "../lib/invoiceStore";

export default function Home() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "terminal" | "rates" | "ledger" | "settings"
  const [walletAddress, setWalletAddress] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [tokenBalances, setTokenBalances] = useState({
    mUSD: "10,000.00",
    mEUR: "10,000.00",
    mJPY: "1,000,000",
  });
  const [ethBalance, setEthBalance] = useState("0.482");

  const [receiver, setReceiver] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [tokenOut, setTokenOut] = useState(TOKENS[0].address);
  const [amount, setAmount] = useState("250.00");
  const [expiryMinutes, setExpiryMinutes] = useState("15");
  const [memo, setMemo] = useState("Pembayaran pesanan #A-024");
  const [paymentLink, setPaymentLink] = useState("");
  const [orderIdDisplay, setOrderIdDisplay] = useState("");
  const [deadlineDisplay, setDeadlineDisplay] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(15 * 60);

  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [selectedTx, setSelectedTx] = useState(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  useEffect(() => {
    const session = getActiveSession();
    if (session) {
      setCurrentUser(session);
      setReceiver(session.address);
      if (session.storeName) setMerchantName(session.storeName);
      if (session.preferredCurrency) {
        const found = TOKENS.find((t) => t.symbol === session.preferredCurrency);
        if (found) setTokenOut(found.address);
      }
    } else if (typeof window !== "undefined" && sessionStorage.getItem("borderpay_guest_mode") === "1") {
      setIsGuest(true);
    }

    try {
      const savedPrefs = localStorage.getItem("borderpay_settings_v1");
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.defaultToken) {
          const found = TOKENS.find((t) => t.symbol === parsed.defaultToken);
          if (found) setTokenOut(found.address);
        }
      }
    } catch {
      // Ignore malformed prefs
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
          if (existing.storeName) setMerchantName(existing.storeName);
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
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("borderpay_guest_mode");
    }
    setCurrentUser(null);
    setIsGuest(false);
    setWalletAddress("");
    toast.info("Logout", "Sesi telah dihentikan.");
  };

  const handleRecreateInvoice = (inv) => {
    if (inv.receiver) setReceiver(inv.receiver);
    if (inv.amount) setAmount(inv.amount);
    if (inv.tokenOut) setTokenOut(inv.tokenOut);
    if (inv.memo) setMemo(inv.memo);
    setPaymentLink("");
    setActiveTab("terminal");
    toast.info("Data Invoice Dimuat", "Sesuaikan lalu klik Generate QR untuk membuat ulang.");
  };

  const fetchLiveBalances = useCallback(async () => {
    if (!walletAddress || typeof window === "undefined" || !window.ethereum) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      // Fetch ETH
      try {
        const rawEth = await provider.getBalance(walletAddress);
        setEthBalance(parseFloat(ethers.formatEther(rawEth)).toFixed(3));
      } catch {
        // Fallback
      }

      // Fetch tokens
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
    const targetReceiver = receiver || walletAddress || "0x71C7656EC7ab88b098defB751B7401B5f6d89A3F";
    if (!ethers.isAddress(targetReceiver)) {
      toast.error("Alamat Tidak Valid", "Alamat wallet penerima harus format 0x (42 karakter).");
      return;
    }

    const rawId = `BP-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const orderIdHash = ethers.id(rawId);
    const deadline = Math.floor(Date.now() / 1000) + parseInt(expiryMinutes) * 60;

    const checksum = computeInvoiceChecksum({
      orderId: orderIdHash,
      receiver: targetReceiver,
      tokenOut,
      amount,
      deadline,
    });

    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const params = new URLSearchParams({
      orderId: orderIdHash,
      receiver: targetReceiver,
      tokenOut,
      amount,
      deadline: deadline.toString(),
      memo: memo || "Pembayaran BorderPay",
      merchant: merchantName || currentUser?.storeName || "",
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
      receiver: targetReceiver,
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
            pair: `${tIn}/${tOut}`,
            amountIn: parseFloat(ethers.formatUnits(ev.args.amountIn, 18)).toFixed(2),
            amountOut: parseFloat(ethers.formatUnits(ev.args.amountOut, 18)).toFixed(2),
            blockNumber: ev.blockNumber,
          };
        });
        setHistory(formatted);
      } else {
        // High-fidelity baseline history matching Figma design
        setHistory([
          {
            id: "tx-1",
            time: "2 menit lalu",
            type: "Swap",
            pair: "mUSD/mEUR",
            amountIn: "100.00",
            amountOut: "92.00",
            tokenInSymbol: "mUSD",
            tokenOutSymbol: "mEUR",
            receiver: "0x3B1d2491b9c948a08e1a84c41b71c7656ec7ab88b0",
            sender: "0x811cE004b9c948a08e1a84c41b71c7656ec7ab88b0",
            txHash: "0x9f2a2491b9c948a08e1a84c41b71c7656ec7ab88b0",
            blockNumber: 6429183,
          },
          {
            id: "tx-2",
            time: "15 menit lalu",
            type: "Transfer",
            pair: "mUSD",
            amountIn: "250.00",
            amountOut: "250.00",
            tokenInSymbol: "mUSD",
            tokenOutSymbol: "mUSD",
            receiver: "0x7F2a29C1b9c948a08e1a84c41b71c7656ec7ab88b0",
            sender: "0x811cE004b9c948a08e1a84c41b71c7656ec7ab88b0",
            txHash: "0x51de07a3b9c948a08e1a84c41b71c7656ec7ab88b0",
            blockNumber: 6429175,
          },
          {
            id: "tx-3",
            time: "32 menit lalu",
            type: "Swap",
            pair: "mJPY/mUSD",
            amountIn: "15,000.00",
            amountOut: "98.10",
            tokenInSymbol: "mJPY",
            tokenOutSymbol: "mUSD",
            receiver: "0x14D2f922b9c948a08e1a84c41b71c7656ec7ab88b0",
            sender: "0x3B1d2491b9c948a08e1a84c41b71c7656ec7ab88b0",
            txHash: "0xb83cf2d9b9c948a08e1a84c41b71c7656ec7ab88b0",
            blockNumber: 6429160,
          },
          {
            id: "tx-4",
            time: "1 jam lalu",
            type: "Swap",
            pair: "mJPY/mUSD",
            amountIn: "10,000.00",
            amountOut: "66.70",
            tokenInSymbol: "mJPY",
            tokenOutSymbol: "mUSD",
            receiver: "0x9928325bb9c948a08e1a84c41b71c7656ec7ab88b0",
            sender: "0x811cE004b9c948a08e1a84c41b71c7656ec7ab88b0",
            txHash: "0x2e7a93fcb9c948a08e1a84c41b71c7656ec7ab88b0",
            blockNumber: 6429142,
          },
          {
            id: "tx-5",
            time: "2 jam lalu",
            type: "Transfer",
            pair: "mEUR",
            amountIn: "20.00",
            amountOut: "21.74",
            tokenInSymbol: "mEUR",
            tokenOutSymbol: "mEUR",
            receiver: "0x811cE004b9c948a08e1a84c41b71c7656ec7ab88b0",
            sender: "0x3B1d2491b9c948a08e1a84c41b71c7656ec7ab88b0",
            txHash: "0xd4a16b58b9c948a08e1a84c41b71c7656ec7ab88b0",
            blockNumber: 6429120,
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

      const selTok =
        TOKENS.find((t) => t.address.toLowerCase() === tokenOut.toLowerCase()) || TOKENS[0];
      ctx.fillStyle = "#1951FC";
      ctx.font = "12px sans-serif";
      ctx.fillText(`Total: ${amount} ${selTok.symbol}`, 30, 60);

      ctx.drawImage(img, 30, 80);

      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `BorderPay-QR-${(orderIdDisplay || "INV").slice(0, 8)}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
      toast.success("QR Diunduh", "File gambar PNG siap dibagikan.");
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const exportLedgerCsv = () => {
    if (history.length === 0) {
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
    const rows = history.map((item) => [
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
    toast.success("CSV Diunduh", `${history.length} transaksi diekspor.`);
  };

  // If user is not logged in and didn't opt for guest mode, show AuthLandingView
  if (isLoaded && !currentUser && !isGuest) {
    return (
      <AuthLandingView
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        onAuthSuccess={(user) => {
          setCurrentUser(user);
          if (user) {
            setReceiver(user.address);
            if (user.storeName) setMerchantName(user.storeName);
            if (user.preferredCurrency) {
              const found = TOKENS.find((t) => t.symbol === user.preferredCurrency);
              if (found) setTokenOut(found.address);
            }
            toast.success("Login Berhasil", `Selamat datang, ${user.storeName || user.name}!`);
          }
        }}
        onContinueAsGuest={() => {
          setIsGuest(true);
          toast.info("Mode Eksplorasi", "Melanjutkan sebagai tamu ke Overview Panel");
        }}
      />
    );
  }

  const isOceanHero =
    activeTab === "overview" ||
    activeTab === "dashboard" ||
    activeTab === "terminal" ||
    activeTab === "create" ||
    activeTab === "settings";

  return (
    <div className="min-h-screen text-[#0B192C] flex flex-col relative selection:bg-blue-600 selection:text-white">
      <OceanBackdrop variant={isOceanHero ? "ocean" : "light"} />

      {/* Floating Top Navigation Bar (Matching Figma Design) */}
      <TopNavbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOceanHeader={isOceanHero}
        walletAddress={walletAddress}
        onConnectWallet={connectWallet}
        onDisconnectWallet={handleLogout}
        currentUser={currentUser}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAssetModal={() => setIsAssetModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1560px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === "overview" || activeTab === "dashboard" ? (
          <OverviewView
            walletAddress={walletAddress}
            tokenBalances={tokenBalances}
            ethBalance={ethBalance}
            history={history}
            onSelectTab={setActiveTab}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenAssetModal={() => setIsAssetModalOpen(true)}
            onOpenGuide={() => setIsGuideOpen(true)}
            onOpenReceipt={(tx) => setSelectedTx(tx)}
          />
        ) : activeTab === "terminal" || activeTab === "create" ? (
          <CreateQrView
            receiver={receiver}
            setReceiver={setReceiver}
            amount={amount}
            setAmount={setAmount}
            tokenOut={tokenOut}
            setTokenOut={setTokenOut}
            memo={memo}
            setMemo={setMemo}
            expiryMinutes={expiryMinutes}
            setExpiryMinutes={setExpiryMinutes}
            merchantName={merchantName}
            setMerchantName={setMerchantName}
            onGenerate={generateInvoice}
            walletAddress={walletAddress}
            paymentLink={paymentLink}
            orderIdDisplay={orderIdDisplay}
            timeRemaining={timeRemaining}
            formatTimer={formatTimer}
            downloadQrCode={downloadQrCode}
            copyPaymentLink={copyPaymentLink}
            copiedLink={copiedLink}
          />
        ) : activeTab === "rates" ? (
          <LiveRatesCard />
        ) : activeTab === "ledger" ? (
          <LedgerView
            history={history}
            isLoading={isLoadingHistory}
            onRefresh={fetchOnChainHistory}
            onExportCsv={exportLedgerCsv}
            onOpenReceipt={(tx) => setSelectedTx(tx)}
          />
        ) : activeTab === "settings" ? (
          <SettingsView
            currentUser={currentUser}
            walletAddress={walletAddress}
            onDefaultTokenChange={(sym) => {
              const found = TOKENS.find((t) => t.symbol === sym);
              if (found) setTokenOut(found.address);
            }}
            onUserUpdated={(user) => {
              setCurrentUser(user);
              if (user?.storeName) setMerchantName(user.storeName);
            }}
          />
        ) : (
          <OverviewView
            walletAddress={walletAddress}
            tokenBalances={tokenBalances}
            ethBalance={ethBalance}
            history={history}
            onSelectTab={setActiveTab}
            onOpenScanner={() => setIsScannerOpen(true)}
            onOpenAssetModal={() => setIsAssetModalOpen(true)}
            onOpenGuide={() => setIsGuideOpen(true)}
            onOpenReceipt={(tx) => setSelectedTx(tx)}
          />
        )}
      </main>

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
            if (user.storeName) setMerchantName(user.storeName);
          } else {
            setIsGuest(false);
          }
        }}
      />

      <QrScannerModal isOpen={isScannerOpen} onClose={() => setIsScannerOpen(false)} />
      <InvoiceHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        onRecreateInvoice={handleRecreateInvoice}
      />
      <OnboardingGuideModal isOpen={isGuideOpen} onClose={() => setIsGuideOpen(false)} />

      <TransactionReceiptModal
        isOpen={!!selectedTx}
        onClose={() => setSelectedTx(null)}
        tx={selectedTx}
      />
    </div>
  );
}
