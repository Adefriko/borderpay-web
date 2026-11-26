/**
 * Pure utility functions to compute live statistics, notifications, and chart series
 * from connected Web3 wallets, browser DB (localStorage), and Sepolia blockchain logs.
 */

const DAY_MS = 86_400_000;
const SHORT_DAYS_ID = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

export function isSameAddress(a, b) {
  if (!a || !b) return false;
  return String(a).toLowerCase() === String(b).toLowerCase();
}

export function formatShortAddress(addr, front = 6, back = 4) {
  if (!addr || typeof addr !== "string") return "";
  if (addr.length <= front + back + 2) return addr;
  return `${addr.slice(0, front)}...${addr.slice(-back)}`;
}

export function formatRelativeTimeId(timestampSecOrMs, nowMs = Date.now()) {
  const numeric = Number(timestampSecOrMs);
  if (!Number.isFinite(numeric) || numeric <= 0) return "Baru saja";
  const tsMs = numeric < 1e12 ? numeric * 1000 : numeric;
  const diffSec = Math.max(0, Math.floor((nowMs - tsMs) / 1000));

  if (diffSec < 60) return "Baru saja";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 30) return `${diffDay} hari lalu`;
  return new Date(tsMs).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function isTxForAddress(tx, address) {
  if (!tx || !address) return false;
  return isSameAddress(tx.sender, address) || isSameAddress(tx.receiver, address);
}

export function getMatchedOrderIds(history = []) {
  const set = new Set();
  for (const tx of history) {
    if (tx?.orderId) set.add(String(tx.orderId).toLowerCase());
  }
  return set;
}

export function summarizeInvoices(localInvoices = [], history = [], nowSec = Math.floor(Date.now() / 1000)) {
  const matchedSet = getMatchedOrderIds(history);
  let activeCount = 0;
  let expiredCount = 0;
  let paidCount = 0;

  for (const inv of localInvoices) {
    const orderKey = inv?.orderId ? String(inv.orderId).toLowerCase() : "";
    const isPaid = inv?.status === "PAID" || (orderKey && matchedSet.has(orderKey));
    if (isPaid) {
      paidCount += 1;
    } else if (inv?.deadline && Number(inv.deadline) < nowSec) {
      expiredCount += 1;
    } else {
      activeCount += 1;
    }
  }

  return {
    totalLocal: localInvoices.length,
    activeCount,
    expiredCount,
    paidCount,
    matchedSet,
  };
}

function getLocalDayStartMs(ms) {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function buildActivityBuckets({ history = [], filter = "7d", nowMs = Date.now() }) {
  const todayStart = getLocalDayStartMs(nowMs);
  const validTxs = history.map((tx) => ({
    ...tx,
    tsMs: Number(tx.timestamp) > 0 ? Number(tx.timestamp) : nowMs,
  }));

  let windowStart = 0;
  const buckets = [];

  if (filter === "7d") {
    windowStart = todayStart - 6 * DAY_MS;
    for (let i = 6; i >= 0; i--) {
      const start = todayStart - i * DAY_MS;
      const d = new Date(start);
      buckets.push({
        label: i === 0 ? "Kini" : SHORT_DAYS_ID[d.getDay()],
        start,
        end: start + DAY_MS,
        count: 0,
      });
    }
  } else if (filter === "30d") {
    const totalSpan = 30 * DAY_MS;
    windowStart = nowMs - totalSpan;
    const step = totalSpan / 7;
    for (let i = 0; i < 7; i++) {
      const start = windowStart + i * step;
      const daysAgo = Math.round((nowMs - (start + step)) / DAY_MS);
      buckets.push({
        label: i === 6 ? "Kini" : `H-${Math.max(1, daysAgo)}`,
        start,
        end: i === 6 ? nowMs + 1000 : start + step,
        count: 0,
      });
    }
  } else {
    const timestamps = validTxs.map((t) => t.tsMs);
    const earliest = timestamps.length > 0 ? Math.min(...timestamps) : todayStart - 6 * DAY_MS;
    const span = Math.max(6 * DAY_MS, nowMs - earliest);
    windowStart = nowMs - span;
    const step = span / 7;
    for (let i = 0; i < 7; i++) {
      const start = windowStart + i * step;
      const d = new Date(start);
      buckets.push({
        label:
          i === 6
            ? "Kini"
            : d.toLocaleDateString("id-ID", { day: "2-digit", month: "short" }),
        start,
        end: i === 6 ? nowMs + 1000 : start + step,
        count: 0,
      });
    }
  }

  const filteredTxs =
    filter === "all"
      ? validTxs
      : validTxs.filter((tx) => tx.tsMs >= windowStart && tx.tsMs <= nowMs + 1000);

  let swapCount = 0;
  let transferCount = 0;
  for (const tx of filteredTxs) {
    if (tx.type === "Swap") swapCount += 1;
    else transferCount += 1;

    for (let i = 0; i < buckets.length; i++) {
      if (tx.tsMs >= buckets[i].start && tx.tsMs < buckets[i].end) {
        buckets[i].count += 1;
        break;
      }
    }
  }

  const total = filteredTxs.length;
  const peak = Math.max(0, ...buckets.map((b) => b.count));
  const chartMinX = 20;
  const chartMaxX = 268;
  const chartBottomY = 68;
  const chartTopY = 16;

  const points = buckets.map((b, idx) => {
    const x = Math.round(chartMinX + ((chartMaxX - chartMinX) * idx) / (buckets.length - 1));
    const y =
      peak > 0
        ? Math.round(chartBottomY - (b.count / peak) * (chartBottomY - chartTopY))
        : chartBottomY;
    return { x, y, count: b.count, label: b.label };
  });

  const linePath = points
    .map((pt, idx) => `${idx === 0 ? "M" : "L"} ${pt.x} ${pt.y}`)
    .join(" ");
  const areaPath = `${linePath} L ${chartMaxX} 75 L ${chartMinX} 75 Z`;

  return {
    total,
    swapCount,
    transferCount,
    swapPct: total > 0 ? Math.round((swapCount / total) * 100) : 0,
    transferPct: total > 0 ? Math.round((transferCount / total) * 100) : 0,
    peak,
    buckets,
    points,
    linePath,
    areaPath,
  };
}

export function buildLiveNotifications({
  walletAddress = "",
  currentUser = null,
  localInvoices = [],
  history = [],
  nowSec = Math.floor(Date.now() / 1000),
  nowMs = Date.now(),
}) {
  const items = [];
  const matchedSet = getMatchedOrderIds(history);

  if (walletAddress) {
    items.push({
      id: `wallet-${walletAddress.toLowerCase()}`,
      title: "Wallet MetaMask terhubung",
      desc: `Akun ${formatShortAddress(walletAddress)} aktif di Ethereum Sepolia Testnet.`,
      time: "Aktif",
      unread: true,
      tone: "blue",
      actionLabel: "Lihat Saldo",
      actionType: "assets",
    });
  } else if (currentUser?.address) {
    items.push({
      id: `profile-${currentUser.address.toLowerCase()}`,
      title: "Profil merchant aktif",
      desc: `${currentUser.storeName || currentUser.name} (${formatShortAddress(currentUser.address)}).`,
      time: "Lokal",
      unread: false,
      tone: "blue",
      actionLabel: "Kelola Akun",
      actionType: "auth",
    });
  }

  for (const inv of localInvoices.slice(0, 3)) {
    const orderKey = inv?.orderId ? String(inv.orderId).toLowerCase() : "";
    const isPaid = inv?.status === "PAID" || (orderKey && matchedSet.has(orderKey));
    const isExpired = !isPaid && inv?.deadline && Number(inv.deadline) < nowSec;
    const shortId = inv?.orderId ? `${inv.orderId.slice(0, 10)}...` : "Invoice";
    const sym = inv?.tokenSymbol || "mUSD";

    if (isPaid) {
      items.push({
        id: `inv-paid-${inv.orderId}`,
        title: "Pembayaran invoice terkonfirmasi",
        desc: `Invoice ${shortId} (${inv.amount} ${sym}) sudah tercatat terbayar.`,
        time: formatRelativeTimeId(inv.updatedAt || inv.createdAt, nowMs),
        unread: true,
        tone: "emerald",
        actionLabel: "Lihat Invoice",
        actionType: "history",
      });
    } else if (isExpired) {
      items.push({
        id: `inv-exp-${inv.orderId}`,
        title: "Invoice lokal kedaluwarsa",
        desc: `Invoice ${shortId} sebesar ${inv.amount} ${sym} telah melewati batas waktu.`,
        time: formatRelativeTimeId(inv.deadline, nowMs),
        unread: false,
        tone: "amber",
        actionLabel: "Buat Ulang",
        actionType: "history",
      });
    } else {
      items.push({
        id: `inv-act-${inv.orderId}`,
        title: "QR invoice lokal dibuat",
        desc: `Tagihan ${shortId} sebesar ${inv.amount} ${sym} siap dibayar.`,
        time: formatRelativeTimeId(inv.createdAt, nowMs),
        unread: true,
        tone: "emerald",
        actionLabel: "Lihat Invoice",
        actionType: "history",
      });
    }
  }

  for (const tx of history.slice(0, 3)) {
    items.push({
      id: `tx-${tx.txHash}`,
      title: `${tx.type === "Swap" ? "Settlement auto-swap" : "Transfer langsung"} Sepolia`,
      desc: `${tx.amountIn} ${tx.tokenInSymbol} → ${tx.amountOut} ${tx.tokenOutSymbol} (${formatShortAddress(tx.txHash)}).`,
      time: tx.time || formatRelativeTimeId(tx.timestamp, nowMs),
      unread: true,
      tone: "emerald",
      actionLabel: "Lihat Ledger",
      actionType: "ledger",
    });
  }

  return items;
}

export function parseBorderPayPaymentLink(rawText, baseOrigin = "https://borderpay.local") {
  const trimmed = typeof rawText === "string" ? rawText.trim() : "";
  if (!trimmed) {
    throw new Error("Harap masukkan atau pindai link invoice BorderPay.");
  }

  if (trimmed === "https://borderpay.finance/preview") {
    throw new Error(
      "QR masih berupa Draft Preview. Klik tombol 'Generate QR' di halaman Create QR terlebih dahulu."
    );
  }

  let urlObj;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    urlObj = new URL(trimmed);
  } else if (trimmed.startsWith("/pay?") || trimmed.startsWith("pay?")) {
    urlObj = new URL(trimmed.replace(/^pay\?/, "/pay?"), baseOrigin);
  } else {
    throw new Error("Format link tidak valid. Harus mengandung URL pembayaran BorderPay.");
  }

  if (!urlObj.pathname.includes("/pay")) {
    throw new Error("QR atau link ini bukan halaman pembayaran BorderPay (/pay).");
  }

  const params = urlObj.searchParams;
  if (!params.get("orderId") || !params.get("receiver") || !params.get("amount")) {
    throw new Error("Parameter invoice tidak lengkap (orderId, receiver, atau amount hilang).");
  }

  return `/pay?${params.toString()}`;
}
