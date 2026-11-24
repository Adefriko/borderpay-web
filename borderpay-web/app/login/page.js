"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthLandingView from "../../components/AuthLandingView";
import { useToast } from "../../components/ToastContext";
import { getActiveSession, findUserByAddress } from "../../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [walletAddress, setWalletAddress] = useState("");

  useEffect(() => {
    const session = getActiveSession();
    if (session) {
      router.push("/");
    }
  }, [router]);

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
        toast.success("Wallet Terhubung", `${addr.slice(0, 6)}...${addr.slice(-4)}`);
      }
    } catch (err) {
      toast.error("Gagal Terhubung ke Wallet", err.message || "Periksa koneksi wallet.");
    }
  };

  const handleAuthSuccess = (user) => {
    toast.success("Login Berhasil", `Selamat datang, ${user.storeName || user.name}!`);
    router.push("/");
  };

  const handleContinueAsGuest = () => {
    toast.info("Mode Eksplorasi", "Melanjutkan ke Dashboard...");
    router.push("/");
  };

  return (
    <AuthLandingView
      walletAddress={walletAddress}
      onConnectWallet={connectWallet}
      onAuthSuccess={handleAuthSuccess}
      onContinueAsGuest={handleContinueAsGuest}
    />
  );
}
