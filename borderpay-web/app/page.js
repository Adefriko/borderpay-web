"use client";
import { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import {
  SEPOLIA_CHAIN_ID,
  TOKENS,
  CONTRACT_ADDRESSES,
  SWAP_ABI,
  ERC20_ABI,
} from "../constants/contracts";
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
import { saveLocalInvoice, getLocalInvoices } from "../lib/invoiceStore";
import { formatRelativeTimeId } from "../lib/activityUtils";

const EMPTY_BALANCES = {
  mUSD: "0.00",
  mEUR: "0.00",
  mJPY: "0",
};

const SEPOLIA_RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com";

export default function Home() {
  const toast = useToast();

  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "terminal" | "rates" | "ledger" | "settings"
  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState(SEPOLIA_CHAIN_ID);
  const [currentUser, setCurrentUser] = useState(null);
  const [isGuest, setIsGuest] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  const [tokenBalances, setTokenBalances] = useState(EMPTY_BALANCES);
  const [ethBalance, setEthBalance] = useState("0.000");

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
  const [historyError, setHistoryError] = useState("");
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [localInvoices, setLocalInvoices] = useState([]);

  const effectiveAddress = walletAddress || currentUser?.address || "";

  const refreshLocalInvoices = useCallback(() => {
    setLocalInvoices(getLocalInvoices());
  }, []);

  // Load saved session, settings, and local DB invoices on mount
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
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
          if (typeof parsed.reducedMotion === "boolean") {
            document.documentElement.dataset.reducedMotion = parsed.reducedMotion ? "true" : "false";
          }
        }
      } catch {
        // Ignore malformed prefs
      }

      setLocalInvoices(getLocalInvoices());
      setIsLoaded(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Silent MetaMask account sync & live account/network change listeners
  useEffect(() => {
    if (typeof window === "undefined" || !window.ethereum) return;

    const syncAuthorizedWallet = async () => {
      try {
        const accounts = await window.ethereum.request({ method: "eth_accounts" });
        if (accounts && accounts.length > 0) {
          const addr = accounts[0];
          setWalletAddress(addr);
          setReceiver((prev) => prev || addr);
          const existing = findUserByAddress(addr);
          if (existing) {
            setCurrentUser((prev) => prev || existing);
            if (existing.storeName) setMerchantName((prev) => prev || existing.storeName);
          }
        }
        const cid = await window.ethereum.request({ method: "eth_chainId" });
        if (cid) setChainId(cid);
      } catch {
        // Ignore wallet read restrictions
      }
    };

    const handleAccountsChanged = (accounts) => {
      if (accounts && accounts.length > 0) {
        const addr = accounts[0];
        setWalletAddress(addr);
        setReceiver(addr);
        const existing = findUserByAddress(addr);
        if (existing) {
          setCurrentUser(existing);
          if (existing.storeName) setMerchantName(existing.storeName);
        }
      } else {
        setWalletAddress("");
      }
    };

    const handleChainChanged = (cid) => {
      if (cid) setChainId(cid);
    };

    syncAuthorizedWallet();
    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum.removeListener("chainChanged", handleChainChanged);
    };
  }, []);

  // Sync DB invoices when localStorage changes across tabs or focus returns from /pay
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleSync = () => setLocalInvoices(getLocalInvoices());
    window.addEventListener("focus", handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener("focus", handleSync);
      window.removeEventListener("storage", handleSync);
    };
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
        const cid = await window.ethereum.request({ method: "eth_chainId" });
        if (cid) setChainId(cid);

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
    setEthBalance("0.000");
    setTokenBalances(EMPTY_BALANCES);
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
    if (!effectiveAddress) {
      await Promise.resolve();
      setEthBalance("0.000");
      setTokenBalances(EMPTY_BALANCES);
      return;
    }

    try {
      const useBrowserProvider =
        Boolean(walletAddress) &&
        typeof window !== "undefined" &&
        Boolean(window.ethereum) &&
        chainId.toLowerCase() === SEPOLIA_CHAIN_ID.toLowerCase();

      const provider = useBrowserProvider
        ? new ethers.BrowserProvider(window.ethereum)
        : new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

      try {
        const rawEth = await provider.getBalance(effectiveAddress);
        setEthBalance(parseFloat(ethers.formatEther(rawEth)).toFixed(3));
      } catch {
        setEthBalance("0.000");
      }

      const newBals = {};
      await Promise.all(
        TOKENS.map(async (t) => {
          const decimals = t.symbol === "mJPY" ? 0 : 2;
          try {
            const c = new ethers.Contract(t.address, ERC20_ABI, provider);
            const raw = await c.balanceOf(effectiveAddress);
            newBals[t.symbol] = parseFloat(ethers.formatUnits(raw, 18)).toLocaleString("en-US", {
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
            });
          } catch {
            newBals[t.symbol] = decimals === 0 ? "0" : "0.00";
          }
        })
      );
      setTokenBalances(newBals);
    } catch {
      // Preserve last fetched balances on transient RPC blip
    }
  }, [effectiveAddress, walletAddress, chainId]);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) fetchLiveBalances();
    });
    return () => {
      cancelled = true;
    };
  }, [fetchLiveBalances]);

  const generateInvoice = (e) => {
    if (e) e.preventDefault();
    const targetReceiver = receiver || walletAddress || currentUser?.address || "";
    if (!ethers.isAddress(targetReceiver)) {
      toast.error(
        "Alamat Penerima Diperlukan",
        "Masukkan alamat wallet 0x (42 karakter) atau hubungkan wallet Anda."
      );
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
    refreshLocalInvoices();

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
    await Promise.resolve();
    setIsLoadingHistory(true);
    setHistoryError("");
    try {
      const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.CoinSwapPayment, SWAP_ABI, provider);

      const currentBlock = await provider.getBlockNumber();
      let events = await contract.queryFilter(
        "PaymentProcessed",
        Math.max(0, currentBlock - 45000),
        currentBlock
      );

      if ((!events || events.length === 0) && currentBlock > 45000) {
        events = await contract.queryFilter(
          "PaymentProcessed",
          Math.max(0, currentBlock - 95000),
          Math.max(0, currentBlock - 45001)
        );
      }

      if (events && events.length > 0) {
        const sortedEvents = [...events].reverse();
        const blockTimestampMap = {};
        const uniqueBlocks = [...new Set(sortedEvents.slice(0, 20).map((ev) => ev.blockNumber))];
        await Promise.allSettled(
          uniqueBlocks.map(async (blkNum) => {
            const blk = await provider.getBlock(blkNum);
            if (blk?.timestamp) {
              blockTimestampMap[blkNum] = Number(blk.timestamp) * 1000;
            }
          })
        );

        const formatted = sortedEvents.map((ev) => {
          const tIn =
            TOKENS.find((t) => t.address.toLowerCase() === ev.args.tokenIn.toLowerCase())?.symbol ||
            "TOKEN";
          const tOut =
            TOKENS.find((t) => t.address.toLowerCase() === ev.args.tokenOut.toLowerCase())?.symbol ||
            "TOKEN";
          const isSwap = tIn !== tOut;
          const tsMs = blockTimestampMap[ev.blockNumber] || 0;
          return {
            id: `${ev.transactionHash}-${ev.index ?? 0}`,
            timestamp: tsMs,
            time: tsMs ? formatRelativeTimeId(tsMs) : `Blok #${ev.blockNumber}`,
            type: isSwap ? "Swap" : "Transfer",
            txHash: ev.transactionHash,
            orderId: ev.args.orderId,
            sender: ev.args.sender,
            receiver: ev.args.receiver,
            tokenInSymbol: tIn,
            tokenOutSymbol: tOut,
            pair: isSwap ? `${tIn}/${tOut}` : tIn,
            amountIn: parseFloat(ethers.formatUnits(ev.args.amountIn, 18)).toLocaleString("en-US", {
              minimumFractionDigits: tIn === "mJPY" ? 0 : 2,
              maximumFractionDigits: tIn === "mJPY" ? 0 : 2,
            }),
            amountOut: parseFloat(ethers.formatUnits(ev.args.amountOut, 18)).toLocaleString("en-US", {
              minimumFractionDigits: tOut === "mJPY" ? 0 : 2,
              maximumFractionDigits: tOut === "mJPY" ? 0 : 2,
            }),
            blockNumber: ev.blockNumber,
          };
        });
        setHistory(formatted);
      } else {
        setHistory([]);
      }
    } catch {
      setHistoryError("Tidak dapat memuat log transaksi dari RPC Sepolia saat ini.");
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) fetchOnChainHistory();
    });
    return () => {
      cancelled = true;
    };
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

      <TopNavbar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isOceanHeader={isOceanHero}
        walletAddress={walletAddress}
        effectiveAddress={effectiveAddress}
        onConnectWallet={connectWallet}
        onDisconnectWallet={handleLogout}
        currentUser={currentUser}
        history={history}
        localInvoices={localInvoices}
        onOpenScanner={() => setIsScannerOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenAssetModal={() => setIsAssetModalOpen(true)}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onOpenGuide={() => setIsGuideOpen(true)}
      />

      <main className="flex-1 max-w-[1560px] w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-clip">
        <div key={activeTab} className="animate-view-enter">
          {activeTab === "terminal" || activeTab === "create" ? (
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
              walletAddress={effectiveAddress}
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
              historyError={historyError}
              walletAddress={effectiveAddress}
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
              effectiveAddress={effectiveAddress}
              currentUser={currentUser}
              tokenBalances={tokenBalances}
              ethBalance={ethBalance}
              history={history}
              localInvoices={localInvoices}
              isLoadingHistory={isLoadingHistory}
              historyError={historyError}
              onRefreshActivity={() => {
                fetchLiveBalances();
                fetchOnChainHistory();
                refreshLocalInvoices();
              }}
              onConnectWallet={connectWallet}
              onSelectTab={setActiveTab}
              onOpenScanner={() => setIsScannerOpen(true)}
              onOpenAssetModal={() => setIsAssetModalOpen(true)}
              onOpenHistory={() => setIsHistoryOpen(true)}
              onOpenGuide={() => setIsGuideOpen(true)}
              onOpenReceipt={(tx) => setSelectedTx(tx)}
              onQuickCreateInvoice={(sym) => {
                const found = TOKENS.find((t) => t.symbol === sym);
                if (found) setTokenOut(found.address);
                setActiveTab("terminal");
              }}
            />
          )}
        </div>
      </main>

      <TokenBalancesModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        walletAddress={walletAddress}
        currentUser={currentUser}
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
        history={history}
        onInvoicesChanged={refreshLocalInvoices}
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
