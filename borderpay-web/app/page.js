"use client";
import { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { ethers } from "ethers";
import { TOKENS, CONTRACT_ADDRESSES, SWAP_ABI } from "../constants/contracts";

export default function Home() {
  const [receiver, setReceiver] = useState("");
  const [tokenOut, setTokenOut] = useState(TOKENS[0].address);
  const [amount, setAmount] = useState("10");
  const [expiryMinutes, setExpiryMinutes] = useState("15");
  const [paymentLink, setPaymentLink] = useState("");
  const [orderIdDisplay, setOrderIdDisplay] = useState("");
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const connectWallet = async () => {
    if (typeof window === "undefined" || !window.ethereum) {
      return alert("Ekstensi Wallet tidak terdeteksi! Pastikan MetaMask / Coinbase Wallet aktif.");
    }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      if (accounts && accounts.length > 0) {
        setReceiver(accounts[0]);
      }
    } catch (err) {
      alert("Gagal terhubung ke wallet: " + (err.message || "Periksa pop-up ekstensi wallet kamu."));
    }
  };

  const generateInvoice = (e) => {
    e.preventDefault();
    if (!ethers.isAddress(receiver)) {
      return alert("Alamat wallet penerima tidak valid! Harus diawali '0x' dan berjumlah 42 karakter.");
    }

    const rawId = `BP-${Date.now()}-${Math.random()}`;
    const orderIdHash = ethers.id(rawId);
    const deadline = Math.floor(Date.now() / 1000) + parseInt(expiryMinutes) * 60;

    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      orderId: orderIdHash,
      receiver,
      tokenOut,
      amount,
      deadline: deadline.toString(),
    });

    const fullLink = `${baseUrl}/pay?${params.toString()}`;
    setPaymentLink(fullLink);
    setOrderIdDisplay(orderIdHash);
  };

  const fetchOnChainHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
      const contract = new ethers.Contract(CONTRACT_ADDRESSES.CoinSwapPayment, SWAP_ABI, provider);
      
      const currentBlock = await provider.getBlockNumber();
      const events = await contract.queryFilter("PaymentProcessed", currentBlock - 5000, currentBlock);
      
      const formatted = events.reverse().map((ev) => {
        const tIn = TOKENS.find((t) => t.address.toLowerCase() === ev.args.tokenIn.toLowerCase())?.symbol || "TOKEN";
        const tOut = TOKENS.find((t) => t.address.toLowerCase() === ev.args.tokenOut.toLowerCase())?.symbol || "TOKEN";
        return {
          txHash: ev.transactionHash,
          orderId: ev.args.orderId,
          sender: ev.args.sender,
          receiver: ev.args.receiver,
          pair: `${tIn} → ${tOut}`,
          amountIn: ethers.formatUnits(ev.args.amountIn, 18),
          amountOut: ethers.formatUnits(ev.args.amountOut, 18),
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

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="border-b border-slate-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">
                BorderPay QR
              </h1>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Simulasi Akademik • Sepolia Testnet
              </span>
            </div>
            <p className="text-slate-400 text-sm mt-1">
              Prototipe Transfer & Swap Koin Simulasi (mUSD, mEUR, mJPY) Berbasis QR
            </p>
          </div>
          <button
            type="button"
            onClick={connectWallet}
            className="bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2.5 rounded-lg transition cursor-pointer"
          >
            {receiver ? `Terhubung: ${receiver.slice(0, 6)}...${receiver.slice(-4)}` : "Isi Otomatis dari Wallet"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4 text-white">1. Buat Permintaan Pembayaran (Invoice)</h2>
            <form onSubmit={generateInvoice} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Alamat Wallet Penerima (Sepolia)</label>
                <input
                  type="text"
                  required
                  placeholder="0x..."
                  value={receiver}
                  onChange={(e) => setReceiver(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Token yang Diterima</label>
                  <select
                    value={tokenOut}
                    onChange={(e) => setTokenOut(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {TOKENS.map((t) => (
                      <option key={t.address} value={t.address}>
                        {t.symbol} ({t.name})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Jumlah Tagihan</label>
                  <input
                    type="number"
                    step="any"
                    required
                    min="1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Masa Berlaku QR (Menit)</label>
                <select
                  value={expiryMinutes}
                  onChange={(e) => setExpiryMinutes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="5">5 Menit</option>
                  <option value="15">15 Menit</option>
                  <option value="60">60 Menit</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-lg transition cursor-pointer mt-2"
              >
                Generate QR Invoice
              </button>
            </form>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center text-center">
            <h2 className="text-lg font-semibold mb-4 text-white w-full text-left">2. QR Code Pembayaran</h2>
            {paymentLink ? (
              <div className="space-y-4 flex flex-col items-center w-full">
                <div className="bg-white p-4 rounded-xl">
                  <QRCodeSVG value={paymentLink} size={200} />
                </div>
                <div className="text-xs text-slate-400 space-y-1 max-w-sm">
                  <p className="font-mono text-slate-300 truncate">Order ID: {orderIdDisplay.slice(0, 18)}...</p>
                  <p>Pindai QR dengan HP atau klik tautan simulasi di bawah untuk membuka halaman pembayaran pengirim:</p>
                </div>
                <a
                  href={paymentLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-blue-600/20 border border-blue-500/40 hover:bg-blue-600/30 text-blue-300 text-xs font-medium px-4 py-2 rounded-lg transition"
                >
                  Buka Halaman Pembayaran (Simulasi Scan) ↗
                </a>
              </div>
            ) : (
              <div className="text-slate-500 text-sm py-16 border-2 border-dashed border-slate-800 rounded-xl w-full">
                Isi form di sebelah kiri untuk membuat QR Invoice
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">3. Dashboard Rekonsiliasi On-Chain (Sepolia)</h2>
            <button
              type="button"
              onClick={fetchOnChainHistory}
              className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg text-slate-300 cursor-pointer"
            >
              {isLoadingHistory ? "Memuat..." : "Refresh Log Blockchain"}
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3">Tx Hash (Etherscan)</th>
                  <th className="pb-3">Pasangan Token</th>
                  <th className="pb-3">Input → Output</th>
                  <th className="pb-3">Penerima</th>
                  <th className="pb-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-6 text-center text-slate-500 text-xs">
                      Belum ada transaksi tercatat di blok terbaru.
                    </td>
                  </tr>
                ) : (
                  history.map((item) => (
                    <tr key={item.txHash} className="hover:bg-slate-800/30">
                      <td className="py-3 font-mono text-xs text-blue-400">
                        <a
                          href={`https://sepolia.etherscan.io/tx/${item.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {item.txHash.slice(0, 12)}...↗
                        </a>
                      </td>
                      <td className="py-3 font-medium">{item.pair}</td>
                      <td className="py-3 text-slate-300">
                        {item.amountIn} → {item.amountOut}
                      </td>
                      <td className="py-3 font-mono text-xs text-slate-400">
                        {item.receiver.slice(0, 6)}...{item.receiver.slice(-4)}
                      </td>
                      <td className="py-3">
                        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full">
                          Confirmed
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  );
}