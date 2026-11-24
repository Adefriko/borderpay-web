# BorderPay — Multi-Currency Web3 Payment Protocol
### Premium Blue Glassmorphism Cross-Border QR Payment Gateway
**Branch:** `EditWebBlockchain` • **Network:** Ethereum Sepolia Testnet (`0xaa36a7`)

> **Disclaimer Akademik:** Seluruh token (`mUSD`, `mEUR`, `mJPY`) bersifat mock ERC-20 simulasi tanpa nilai ekonomi riil. Proyek ini merupakan demonstrasi akademik non-komersial Web3 (Kelompok 8 - Blockchain TI-B).

---

## 1. Overview & Arsitektur Sistem

BorderPay adalah protokol pembayaran lintas negara terdesentralisasi yang memungkinkan merchant menerbitkan invoice dinamis berbasis QR Code dan menerima koin simulasi stabil. Payer dapat membayar menggunakan mata uang yang sama atau melakukan pertukaran otomatis (*on-chain swap*) secara atomik melalui smart contract di jaringan **Ethereum Sepolia Testnet**.

### Modul Proyek
- `borderpay-web` — Frontend Next.js 16 (App Router), React 19, Tailwind CSS 4, ethers.js v6, Blue Glassmorphism Design System.
- `borderpay-contracts` — Smart contract Solidity 0.8.20, Hardhat, OpenZeppelin (Ownable, Pausable, ReentrancyGuard, SafeERC20).
- `docs/` — Dokumentasi arsitektur, audit, design system, user flows, laporan QA, laporan keamanan, dan screenshot UI.

---

## 2. Alamat Smart Contract (Sepolia Testnet)

| Kontrak / Token | Simbol | Alamat Sepolia | Etherscan Explorer |
|---|---|---|---|
| **CoinSwapPayment Gateway (V2)** | `CSP` | `0x236D5D12241808ba9AB716c0bB410cCa30eA6923` | [Buka di Etherscan](https://sepolia.etherscan.io/address/0x236D5D12241808ba9AB716c0bB410cCa30eA6923) |
| **Mock USD** | `mUSD` | `0xEF70d487Ee882e97a3F0A1Febd58d9f72e4859dd` | [Buka di Etherscan](https://sepolia.etherscan.io/address/0xEF70d487Ee882e97a3F0A1Febd58d9f72e4859dd) |
| **Mock EUR** | `mEUR` | `0x4f895D138BE52f4926Cba27DDe85Fe9d67AeeCd5` | [Buka di Etherscan](https://sepolia.etherscan.io/address/0x4f895D138BE52f4926Cba27DDe85Fe9d67AeeCd5) |
| **Mock JPY** | `mJPY` | `0x1e6128D71cfbbF071FE21391460BE7191e92BDF0` | [Buka di Etherscan](https://sepolia.etherscan.io/address/0x1e6128D71cfbbF071FE21391460BE7191e92BDF0) |

---

## 3. Fitur Utama yang Diimplementasikan

### 🛡️ Fitur Keamanan P0
1. **Invoice Integrity Protection (F-02):** Validasi integritas invoice menggunakan canonical hashing `keccak256(orderId, receiver, tokenOut, amount, deadline, salt)`. Modifikasi URL secara ilegal langsung memicu deteksi **Red Glass Alert** dan menonaktifkan tombol eksekusi.
2. **Pre-flight Safety Checks (F-13):** Validasi format address 0x, allowlist token, batas waktu (deadline), pengecekan anti-replay `isOrderProcessed`, saldo token, kecukupan Sepolia ETH gas, dan validasi Chain ID Sepolia.
3. **Estimated Gas & Payment Preview (F-03):** Estimasi gas real-time dari RPC node, perbandingan dengan saldo Sepolia ETH payer, dan peringatan jika gas tidak cukup.
4. **Visual Payment Status Timeline (F-04):** Stepper status transaksi 8 tahap interaktif: Validated -> Wallet Connected -> Allowance Check -> Approving -> Approved -> Swapping -> Blockchain Confirmed -> Receipt.
5. **EIP-1193 Wallet Event Synchronization (F-14):** Penanganan event `accountsChanged`, `chainChanged`, dan `disconnect` secara real-time.

### 🚀 Fitur Pengguna P1 & P2
1. **Camera QR Scanner (F-01):** Scanner kamera browser berbasis HTML5 dengan validasi link invoice BorderPay otomatis dan opsi manual paste fallback.
2. **Local Invoice History & Management (F-05):** Penyimpanan riwayat invoice lokal di browser (localStorage) dengan status aktif/kedaluwarsa, salin link, dan direct checkout.
3. **High-Resolution Transaction Receipt Export (F-06):** Ekspor struk transaksi on-chain ke format PNG digital berkualitas tinggi melalui HTML5 canvas.
4. **Interactive Swap Calculator (F-07):** Simulasi perhitungan swap on-chain untuk 6 pasangan mata uang dengan tombol balik posisi (invert) dan toleransi slippage 0.5%.
5. **Wallet Onboarding & Faucet Guide (F-08):** Panduan interaktif bertahap untuk pengguna baru (MetaMask, Sepolia Testnet, kran gas faucet, dan peringatan keamanan private key).
6. **In-App Toast Notification Center (F-09):** Sistem notifikasi non-intrusive untuk milestone transaksi, wallet connected, dan peringatan jaringan.
7. **Dashboard Analytics & CSV Export (F-10, F-11):** Metrik protokol transaksi live dan tombol ekspor rekonsiliasi ledger ke file CSV.

---

## 4. Tampilan Antarmuka (Blue Glassmorphism)

Antarmuka BorderPay dibangun menggunakan tema **Premium Blue Glassmorphism**:
- Deep Navy Canvas (`#030A22`)
- Frosted-glass surfaces (`backdrop-blur-xl`, `border-white/10`)
- Electric Blue refractive glow (`#1951FC`)
- Ice Blue technical typography (`#CBE9FD`)

### Screenshot Dokumentasi
- **Desktop Merchant POS & Terminal:** [`docs/screenshots/01_dashboard_desktop.png`](docs/screenshots/01_dashboard_desktop.png)
- **Dynamic Scannable QR Invoice:** [`docs/screenshots/02_create_invoice_qr.png`](docs/screenshots/02_create_invoice_qr.png)
- **On-Chain Reconciliation Ledger:** [`docs/screenshots/03_onchain_ledger.png`](docs/screenshots/03_onchain_ledger.png)
- **Kurs & Kalkulator Swap:** [`docs/screenshots/04_rates_calculator.png`](docs/screenshots/04_rates_calculator.png)
- **Desktop Checkout & Verified Hash:** [`docs/screenshots/05_checkout_desktop.png`](docs/screenshots/05_checkout_desktop.png)
- **Mobile Responsive Dashboard:** [`docs/screenshots/06_dashboard_mobile.png`](docs/screenshots/06_dashboard_mobile.png)
- **Mobile Responsive Checkout:** [`docs/screenshots/07_checkout_mobile.png`](docs/screenshots/07_checkout_mobile.png)

---

## 5. Cara Menjalankan & Menguji Secara Lokal

### Prasyarat
- Node.js v18+ (atau v20+)
- Ekstensi browser Web3 (MetaMask) terhubung ke **Sepolia Testnet**

### 1. Menjalankan Smart Contract Tests (Hardhat)
```bash
cd borderpay-contracts
npm test
```
*Hasil:* 21 unit & integration tests passing 100%.

### 2. Menjalankan Frontend Unit & Integration Tests
```bash
cd borderpay-web
npm test
```
*Hasil:* 12 tests passing 100% (Integritas invoice, deteksi tampering, presisi BigInt, slippage, simulasi swap).

### 3. Menjalankan Build Produksi Frontend
```bash
cd borderpay-web
npm run build
```
*Hasil:* Next.js static pages generated successfully dalam mode Webpack.

### 4. Menjalankan Server Pengembangan Lokal
```bash
cd borderpay-web
npm run dev
```
Akses di browser pada: `http://localhost:3000`

---

## 6. Dokumentasi Lengkap Proyek

- [Audit Teknis Proyek (`docs/PROJECT_AUDIT.md`)](docs/PROJECT_AUDIT.md)
- [Matriks Fitur & Kebutuhan (`docs/FEATURE_MATRIX.md`)](docs/FEATURE_MATRIX.md)
- [Rencana Implementasi Multi-Agent (`docs/IMPLEMENTATION_PLAN.md`)](docs/IMPLEMENTATION_PLAN.md)
- [Spesifikasi Design System Blue Glassmorphism (`docs/DESIGN_SYSTEM.md`)](docs/DESIGN_SYSTEM.md)
- [Diagram Alur Pengguna (`docs/USER_FLOWS.md`)](docs/USER_FLOWS.md)
- [Laporan Pengujian & Bukti QA (`docs/TEST_REPORT.md`)](docs/TEST_REPORT.md)
- [Laporan Keamanan & Kinerja (`docs/SECURITY_REPORT.md`)](docs/SECURITY_REPORT.md)

---
© 2026 BorderPay Protocol Team • Demonstrasi Akademik Blockchain TI-B Kelompok 8
