"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { ethers } from "ethers";
import { TOKENS, CONTRACT_ADDRESSES, ERC20_ABI, SWAP_ABI, SEPOLIA_CHAIN_ID } from "../../constants/contracts";

function PaymentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const receiver = searchParams.get("receiver") || "";
  const tokenOutAddr = searchParams.get("tokenOut") || TOKENS[0].address;
  const amountOut = searchParams.get("amount") || "0";
  const deadline = parseInt(searchParams.get("deadline") || "0");

  const [walletAddress, setWalletAddress] = useState("");
  const [chainId, setChainId] = useState("");
  const [tokenInAddr, setTokenInAddr] = useState(TOKENS[0].address);
  const [balanceIn, setBalanceIn] = useState("0");
  const [requiredAmountIn, setRequiredAmountIn] = useState(amountOut);
  const [rateDisplay, setRateDisplay] = useState("1");
  const [status, setStatus] = useState("IDLE");
  const [txHash, setTxHash] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  const tokenOutInfo = TOKENS.find((t) => t.address.toLowerCase() === tokenOutAddr.toLowerCase()) || TOKENS[0];
  const tokenInInfo = TOKENS.find((t) => t.address.toLowerCase() === tokenInAddr.toLowerCase()) || TOKENS[0];

  useEffect(() => {
    const checkExpiry = () => {
      if (deadline > 0 && Math.floor(Date.now() / 1000) > deadline) {
        setIsExpired(true);
      }
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 3000);
    return () => clearInterval(interval);
  }, [deadline]);

  // Ambil kurs & hitung jumlah token input secara real-time dari Smart Contract
  useEffect(() => {
    const fetchQuote = async () => {
      if (tokenInAddr.toLowerCase() === tokenOutAddr.toLowerCase()) {
        setRequiredAmountIn(amountOut);
        setRateDisplay("1");
        return;
      }
      try {
        const provider = new ethers.JsonRpcProvider("https://ethereum-sepolia-rpc.publicnode.com");
        const swapContract = new ethers.Contract(CONTRACT_ADDRESSES.CoinSwapPayment, SWAP_ABI, provider);
        
        const rawRate = await swapContract.mockRates(tokenInAddr, tokenOutAddr);
        setRateDisplay((Number(rawRate) / 10000).toString());

        const amountOutWei = ethers.parseUnits(amountOut || "0", 18);
        const reqInWei = await swapContract.quoteRequiredIn(tokenInAddr, tokenOutAddr, amountOutWei);
        setRequiredAmountIn(ethers.formatUnits(reqInWei, 18));
      } catch (err) {
        console.error("Gagal mengambil quote:", err);
      }
    };
    fetchQuote();
  }, [tokenInAddr, tokenOutAddr, amountOut]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!walletAddress || !window.ethereum) return;
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const tokenContract = new ethers.Contract(tokenInAddr, ERC20_ABI, provider);
        const rawBal = await tokenContract.balanceOf(walletAddress);
        setBalanceIn(ethers.formatUnits(rawBal, 18));
      } catch (err) {
        console.error(err);
      }
    };
    fetchBalance();
  }, [walletAddress, tokenInAddr]);

  const connectAndValidateNetwork = async () => {
    if (!window.ethereum) return alert("Wallet tidak ditemukan!");
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      setWalletAddress(accounts[0]);

      const currentChain = await window.ethereum.request({ method: "eth_chainId" });
      setChainId(currentChain);

      if (currentChain !== SEPOLIA_CHAIN_ID) {
        await window.ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: SEPOLIA_CHAIN_ID }],
        });
        setChainId(SEPOLIA_CHAIN_ID);
      }
    } catch (err) {
      setErrorMsg("Gagal menghubungkan wallet atau berpindah ke jaringan Sepolia.");
    }
  };

  const handlePayment = async () => {
    setErrorMsg("");
    if (isExpired) return setErrorMsg("QR Invoice sudah kedaluwarsa!");
    if (chainId !== SEPOLIA_CHAIN_ID) return setErrorMsg("Harap gunakan jaringan Ethereum Sepolia!");

    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();

      const amountInWei = ethers.parseUnits(requiredAmountIn, 18);
      const minAmountOutWei = ethers.parseUnits(amountOut, 18);

      const tokenContract = new ethers.Contract(tokenInAddr, ERC20_ABI, signer);
      const swapContract = new ethers.Contract(CONTRACT_ADDRESSES.CoinSwapPayment, SWAP_ABI, signer);

      const alreadyUsed = await swapContract.isOrderProcessed(orderId);
      if (alreadyUsed) {
        return setErrorMsg("Order ID ini sudah pernah dibayar sebelumnya (Replay dicegah)!");
      }

      setStatus("APPROVING");
      const currentAllowance = await tokenContract.allowance(walletAddress, CONTRACT_ADDRESSES.CoinSwapPayment);
      if (currentAllowance < amountInWei) {
        const approveTx = await tokenContract.approve(CONTRACT_ADDRESSES.CoinSwapPayment, amountInWei);
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
    } catch (err) {
      console.error(err);
      setStatus("ERROR");
      setErrorMsg(err.reason || err.message || "Transaksi dibatalkan atau gagal di blockchain.");
    }
  };

  const formattedReqIn = parseFloat(requiredAmountIn).toLocaleString("en-US", { maximumFractionDigits: 4 });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
        <div className="border-b border-slate-800 pb-4">
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
            Sepolia Testnet • Fixed-Rate Simulasi
          </span>
          <h1 className="text-xl font-bold text-white mt-2">Konfirmasi Pembayaran QR</h1>
          <p className="text-xs text-slate-400 font-mono mt-1 break-all">Order: {orderId}</p>
        </div>

        <div className="bg-slate-950 rounded-xl p-4 space-y-2.5 text-sm border border-slate-800/80">
          <div className="flex justify-between">
            <span className="text-slate-400">Tujuan Penerima</span>
            <span className="font-mono text-xs text-slate-200">
              {receiver ? `${receiver.slice(0, 8)}...${receiver.slice(-6)}` : "-"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Tagihan Diterima</span>
            <span className="font-semibold text-emerald-400">
              {amountOut} {tokenOutInfo.symbol}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Status QR</span>
            {isExpired ? (
              <span className="text-red-400 font-semibold">Kedaluwarsa</span>
            ) : (
              <span className="text-cyan-400">Aktif (Valid)</span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <label className="text-xs text-slate-400">Bayar Menggunakan Token:</label>
            {walletAddress && (
              <span className="text-xs text-slate-400">
                Saldo: <strong className="text-slate-200">{parseFloat(balanceIn).toFixed(2)} {tokenInInfo.symbol}</strong>
              </span>
            )}
          </div>
          <select
            value={tokenInAddr}
            onChange={(e) => setTokenInAddr(e.target.value)}
            disabled={status === "APPROVING" || status === "SWAPPING" || status === "SUCCESS"}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3.5 py-2.5 text-sm"
          >
            {TOKENS.map((t) => (
              <option key={t.address} value={t.address}>
                {t.symbol} ({t.name})
              </option>
            ))}
          </select>

          <div className="text-xs bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-lg text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Kurs Simulasi:</span>
              <span className="font-mono text-cyan-300">
                1 {tokenInInfo.symbol} = {rateDisplay} {tokenOutInfo.symbol}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-700/60 pt-1.5">
              <span className="text-slate-400">Total yang Dibayar:</span>
              <span className="font-semibold text-white">
                {formattedReqIn} {tokenInInfo.symbol} → {amountOut} {tokenOutInfo.symbol}
              </span>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
            {errorMsg}
          </div>
        )}

        {!walletAddress ? (
          <button
            onClick={connectAndValidateNetwork}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition cursor-pointer"
          >
            Hubungkan Wallet Sepolia
          </button>
        ) : status === "SUCCESS" ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-2">
            <p className="text-emerald-400 font-semibold text-sm">Transaksi Berhasil Dikonfirmasi!</p>
            <a
              href={`https://sepolia.etherscan.io/tx/${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block text-xs text-blue-400 underline break-all"
            >
              Lihat Bukti di Sepolia Etherscan ↗
            </a>
          </div>
        ) : (
          <button
            onClick={handlePayment}
            disabled={isExpired || status === "APPROVING" || status === "SWAPPING"}
            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-400 text-white font-semibold py-3 rounded-xl transition cursor-pointer"
          >
            {status === "APPROVING"
              ? "1/2 Menyetujui Allowance ERC-20..."
              : status === "SWAPPING"
              ? "2/2 Mengeksekusi Smart Contract..."
              : tokenInAddr.toLowerCase() === tokenOutAddr.toLowerCase()
              ? `Transfer ${formattedReqIn} ${tokenInInfo.symbol}`
              : `Swap & Bayar ${formattedReqIn} ${tokenInInfo.symbol}`}
          </button>
        )}

        <div className="text-center">
          <a href="/" className="text-xs text-slate-500 hover:text-slate-300">
            ← Kembali ke Halaman Pembuat QR
          </a>
        </div>
      </div>
    </div>
  );
}

export default function PayPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-10">Memuat Invoice...</div>}>
      <PaymentContent />
    </Suspense>
  );
}