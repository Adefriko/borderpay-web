# BorderPay — Multi-Agent Engineering Implementation Plan
**Document ID:** BP-PLN-003  
**Author:** AGENT 01 (Project Lead / Solution Architect)  
**Date:** November 2026  
**Target Branch:** `EditWebBlockchain`

---

## 1. Project Execution Overview

This implementation plan operationalizes the transformation of BorderPay into a premium Blue Glassmorphism Web3 application with verified testnet integration, zero lint errors, robust test coverage, and comprehensive user workflows.

### 1.1 Coordinated Agent Responsibilities
- **AGENT 01 (Project Lead):** Oversees architectural compliance, task tracking, risk triage, and integration integrity.
- **AGENT 02 (UI/UX Designer):** Formulates design tokens, frosted-glass CSS classes, interactive component specs, and responsive UX flows.
- **AGENT 03 (Frontend Developer):** Implements React components, App Router pages, layout styling, animations, modals, and input controls.
- **AGENT 04 (Web3 Engineer):** Implements ethers.js v6 contracts integration, gas estimation, invoice integrity hashing, and EIP-1193 listeners.
- **AGENT 05 (QA Engineer):** Authors and runs Hardhat contract tests, component tests, and E2E verification suites.
- **AGENT 06 (Security & Performance Engineer):** Validates input sanitization, anti-tampering guards, RPC resilience, and non-custodial assertions.

---

## 2. Work Breakdown Structure by Phase

### Phase 1: Audit, Baseline Tests & Hardhat Environment Setup [COMPLETED]
- [x] Inspect repository, branch `EditWebBlockchain`, contract and web source files.
- [x] Configure Hardhat compile environment with sandboxed application directory isolation.
- [x] Compile contracts (`CoinSwapPayment.sol`, `MockToken.sol`) successfully.
- [x] Identify ESLint build issues and fix corrupted packages (`hermes-parser`, `tsconfig-paths`).
- [x] Author `docs/PROJECT_AUDIT.md`, `docs/FEATURE_MATRIX.md`, `docs/IMPLEMENTATION_PLAN.md`.

### Phase 2: Blue Glassmorphism Design System Overhaul [IN PROGRESS]
- [x] Author `docs/DESIGN_SYSTEM.md` and `docs/USER_FLOWS.md`.
- [ ] Upgrade `borderpay-web/app/globals.css`:
  - Deep Navy & Electric Blue palette (`#030A22`, `#03195B`, `#0B2CB1`, `#1951FC`, `#3781FC`, `#CBE9FD`).
  - Frosted-glass backdrop filters (`backdrop-blur-xl`, `bg-white/[0.04]`, subtle borders `border-white/10`).
  - Glow effects (`shadow-[0_0_25px_rgba(25,81,252,0.15)]`).
  - Glossy gradient token badges.
- [ ] Upgrade `borderpay-web/app/layout.js`:
  - Integrate Next.js Google font loaders (`Plus_Jakarta_Sans`, `JetBrains_Mono`).
  - Dark high-tech theme shell with ambient lighting gradients.
- [ ] Redesign `components/Navbar.js` with responsive glass nav, network badges, quick balances, and wallet selector.

### Phase 3: P0 Core Implementation
- [ ] **F-02 Invoice Integrity Engine:**
  - Create `borderpay-web/lib/invoiceIntegrity.js` computing canonical hash:
    `keccak256(abi.encodePacked(orderId, receiver, tokenOut, amount, deadline, salt))`
  - Add invoice checksum verification in `app/pay/page.js` with instant tampering warnings if URL parameters are modified.
- [ ] **F-13 Pre-Flight Safety Checks:**
  - Address validation, token allowlist verification, deadline verification, balance checking, and contract state checking.
- [ ] **F-03 Gas Estimation & ETH Sufficiency Preview:**
  - Fetch fee data via `provider.getFeeData()` and estimate transaction gas.
  - Warn user if Sepolia ETH balance is insufficient for gas fees.
- [ ] **F-04 Visual Transaction Status Timeline:**
  - Build `components/PaymentTimeline.js` displaying 8 distinct stages with live status indicators, hashes, and links.
- [ ] **F-14 EIP-1193 Wallet Event Synchronization:**
  - Sync MetaMask account and network events seamlessly across all components.

### Phase 4: P1 Advanced Features
- [ ] **F-01 Camera QR Scanner:**
  - Build `components/QrScannerModal.js` utilizing video stream / manual paste with URL parsing and invoice checksum validation.
- [ ] **F-05 Invoice History & Management:**
  - Build `components/InvoiceHistoryModal.js` and local storage manager with invoice status, copy link, and direct settlement action.
- [ ] **F-06 Transaction Receipt Export:**
  - Upgrade `components/TransactionReceiptModal.js` with downloadable branded PNG export via HTML5 canvas.
- [ ] **F-07 Interactive Swap Calculator:**
  - Upgrade `components/LiveRatesCard.js` into interactive simulator with reverse direction, live rate quotes, and slippage display.
- [ ] **F-08 Wallet Onboarding & Faucet Guide:**
  - Build `components/OnboardingGuideModal.js` explaining MetaMask, Sepolia testnet, gas, and mock tokens.
- [ ] **F-09 Toast Notification System:**
  - Build `components/ToastProvider.js` and `components/Toast.js` for non-blocking transaction notifications.

### Phase 5: P2 Polish & Analytics
- [ ] **F-10 Dashboard Analytics:**
  - Upgrade `components/StatsOverview.js` with visual token breakdown and activity indicators.
- [ ] **F-11 Transaction Ledger CSV Export:**
  - Add CSV export feature to the on-chain ledger tab.
- [ ] **F-12 Responsive & Accessibility Polish:**
  - Verify WCAG contrast, touch targets, and reduced-motion compatibility.

### Phase 6: QA Testing Suite & Verification
- [ ] **Hardhat Smart Contract Test Suite:**
  - Author `borderpay-contracts/test/CoinSwapPayment.test.js` verifying:
    - Same-token payment transfer
    - 6 cross-token pairs (mUSD, mEUR, mJPY)
    - Replay attack prevention (`isOrderProcessed`)
    - Expired deadline rejection
    - Slippage protection (`minAmountOut`)
    - Admin mock rate configuration & liquidity additions
    - Pausable contract behavior
- [ ] **Frontend Component & Integration Tests:**
  - Create test harness verifying address validation, invoice hashing, amount formatting, and URL parsing.
- [ ] **E2E Scenario Execution & Documentation:**
  - Document all 20 test scenarios with tangible execution evidence.
- [ ] **Final Deliverables & Screenshots:**
  - Capture real UI screenshots of the deployed screens.
  - Author Security & Performance Report (`docs/SECURITY_REPORT.md`).
  - Author QA Verification Report (`docs/TEST_REPORT.md`).
  - Update `README.md` with full reproduction steps.

---

## 3. Risk Mitigation Plan

| Risk | Impact | Mitigation Strategy |
|---|---|---|
| Public Sepolia RPC rate limiting | Medium | Maintain an array of fallback Sepolia RPC URLs (`publicnode.com`, `rpc.sepolia.org`, `1rpc.io`) with automatic failover. |
| Incompatible browser camera permissions | Low | Provide instant manual paste fallback for QR invoice URLs. |
| Next.js Turbopack css-loader panics | Low | Use webpack mode for production builds (`next build --webpack`), thoroughly validated during audit. |
| Floating point precision issues | Critical | Execute all currency math in token units (18 decimals via `ethers.parseUnits` and `ethers.formatUnits`). Never perform raw float multiplication for transaction payloads. |
