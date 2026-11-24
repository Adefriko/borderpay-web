# BorderPay — Feature Requirements Matrix & Traceability
**Document ID:** BP-REQ-002  
**Author:** AGENT 01 (Project Lead / Solution Architect)  
**Date:** November 2026  
**Target Branch:** `EditWebBlockchain`

---

## 1. Feature Classification Matrix

| Feature ID | Feature Name | Priority | Existing State | Target Specification | Status |
|---|---|---|---|---|---|
| **F-00** | **Blue Glassmorphism UI/UX** | **P0** | Light slate theme (`#f8fafc`) with standard borders | Deep navy background (`#030A22`), glowing glass cards (`#03195B`/`#0B2CB1`), backdrop blur, electric blue accents (`#1951FC`), responsive layouts | **In Progress** |
| **F-01** | **Camera QR Scanner** | **P1** | None | HTML5 camera scanner with permissions request, URL format validator, manual paste fallback, error handling | **Pending P1** |
| **F-02** | **Invoice Integrity Protection** | **P0** | Plain URL query params, easily tampered | Canonical invoice hashing + HMAC/signature verification, tampering detection alert, anti-tampering banner | **In Progress** |
| **F-03** | **Estimated Gas & Payment Preview** | **P0** | Rough input amount display without gas estimation | Real-time `estimateGas` check, Sepolia ETH gas sufficiency warning, detailed breakdown breakdown cards | **In Progress** |
| **F-04** | **Payment Status Timeline** | **P0** | Basic 2-state loading text | 8-step visual state timeline tracker (Validated -> Connected -> Approving -> Approved -> Swapping -> Confirmed -> Receipt) | **In Progress** |
| **F-05** | **Invoice History & Management** | **P1** | None | Dedicated tab/modal storing generated invoices locally with status, countdowns, copy link, and direct checkout shortcuts | **Pending P1** |
| **F-06** | **Transaction Receipt Export** | **P1** | Basic text modal | High-res PNG receipt export via HTML5 canvas, verified badge, block info, Etherscan link, BorderPay watermark | **Pending P1** |
| **F-07** | **Interactive Swap Calculator** | **P1** | Basic card in `LiveRatesCard` | Interactive rate calculator supporting all 6 pairs, invert direction, slippage simulation, exact wei math | **Pending P1** |
| **F-08** | **Wallet Onboarding & Faucet Guide**| **P1** | None | Guided modal with step-by-step instructions for MetaMask, Sepolia testnet setup, test ETH gas faucets, and mock token minting | **Pending P1** |
| **F-09** | **In-App Notification Center** | **P1** | Standard browser `alert()` calls | Non-intrusive floating Toast notification system for wallet events, network changes, approval steps, tx confirmations | **Pending P1** |
| **F-10** | **Dashboard Analytics** | **P2** | Simple transaction counter | Visual analytics cards showing token pair distribution, transfer vs swap volume, and recent 24h activity | **Pending P2** |
| **F-11** | **Transaction Ledger CSV Export** | **P2** | Display table only | CSV export utility generating sanitized comma-separated ledger data matching active search & filters | **Pending P2** |
| **F-12** | **Theme & Motion Preferences** | **P2** | Static style | Support for reduced-motion CSS media queries and accessibility contrast validation | **Pending P2** |
| **F-13** | **Pre-Flight Transaction Safety Checks** | **P0** | Partial balance check | Multi-layer validation: Chain ID, token allowlist, valid 0x address, deadline check, orderId replay check, allowance check, ETH gas check | **In Progress** |
| **F-14** | **EIP-1193 Wallet Event Sync** | **P0** | Basic connect button | Auto-listeners for `accountsChanged`, `chainChanged`, `disconnect` with instant state clearance and reactive re-renders | **In Progress** |

---

## 2. Priority Phasing Schedule

```mermaid
flowchart TD
    subgraph Phase 1: Baseline & Audit
        A1[Codebase Audit] --> A2[Hardhat Setup & Fix]
        A2 --> A3[Baseline Documents]
    end

    subgraph Phase 2: Design System Overhaul
        B1[Design Tokens & Palette] --> B2[Blue Glassmorphism Primitives]
        B2 --> B3[Responsive Shell & Navigation]
    end

    subgraph Phase 3: P0 Core Implementation
        C1[F-02: Invoice Integrity & Tampering Check] --> C2[F-13: Pre-Flight Safety Checks]
        C2 --> C3[F-03: Real-Time Gas Estimation]
        C3 --> C4[F-04: Visual Status Timeline]
        C4 --> C5[F-14: EIP-1193 Event Synchronization]
    end

    subgraph Phase 4: P1 Advanced Features
        D1[F-01: Camera QR Scanner] --> D2[F-05: Local Invoice Management]
        D2 --> D3[F-06: High-Res Receipt Export]
        D3 --> D4[F-07: Interactive Swap Calculator]
        D4 --> D5[F-08: Onboarding & Faucet Guide]
        D5 --> D6[F-09: Toast Notification System]
    end

    subgraph Phase 5: P2 Polish & Analytics
        E1[F-10: Dashboard Analytics] --> E2[F-11: Ledger CSV Export]
        E2 --> E3[F-12: Accessibility & Reduced Motion]
    end

    subgraph Phase 6: QA, Contracts & E2E Verification
        F1[Hardhat Smart Contract Test Suite] --> F2[Frontend Component Tests]
        F2 --> F3[Playwright / Automated E2E Scenarios]
        F3 --> F4[Screenshots & Final Reports]
    end

    Phase 1 --> Phase 2
    Phase 2 --> Phase 3
    Phase 3 --> Phase 4
    Phase 4 --> Phase 5
    Phase 5 --> Phase 6
```

---

## 3. Strict Verification & Integrity Rules
- **No Mock Confirmations:** Transferred or swapped funds must only be marked `Confirmed` after actual transaction receipt `receipt.status === 1` is returned from Ethereum Sepolia.
- **Academic Simulation Transparency:** Every rate card and token card must state `On-Chain Mock Rates` and `ERC-20 Simulation`.
- **Tampering Detection:** Modifying `amount`, `receiver`, `tokenOut`, or `deadline` in the checkout URL must immediately flag the invoice as untrusted or invalid, blocking automated execution.
