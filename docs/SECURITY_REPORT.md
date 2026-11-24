# BorderPay — Security Architecture & Performance Report
**Document ID:** BP-SEC-001  
**Author:** AGENT 06 (Security & Performance Engineer)  
**Date:** November 2026  
**Scope:** Smart Contract Security, Frontend Cryptography, Trust Boundaries, RPC Resilience

---

## 1. Threat Model & Trust Boundaries

The BorderPay protocol operates in an adversarial environment where payers, merchants, and untrusted intermediaries may attempt to manipulate payment parameters, front-run transactions, or spoof settled payments.

```
       [ Merchant Client (Untrusted) ]
                      |
                      | Canonical Checksum (F-02)
                      v
         [ QR Code / URL Transmission ]
                      |
                      v
        [ Payer Browser Client (Untrusted) ]
                      |
                      | Pre-flight Safety Checks (F-13)
                      | Gas & Balance Verification (F-03)
                      v
            [ Web3 Wallet (Signer) ]
                      |
                      | EIP-1193 Safe Invocations (F-14)
                      v
    [ Sepolia Smart Contracts (Trust Anchor) ]
    - Replay Prevention (isOrderProcessed)
    - ReentrancyGuard
    - Slippage Enforcement (minAmountOut)
    - Deadline Check (block.timestamp <= deadline)
```

---

## 2. Key Security Enhancements Implemented

### 2.1 Cryptographic Invoice Integrity Protection (F-02)
- **Vulnerability Analyzed:** Previous URL parameters (`/pay?orderId=...&receiver=...&amount=...`) could be modified in transit by a malicious intermediary or altered by a user.
- **Architectural Solution:** Deterministic canonical hashing engine implemented in `lib/invoiceIntegrity.js`:
  ```
  Payload = orderId | receiver.toLowerCase() | tokenOut.toLowerCase() | amount | deadline | SALT
  Checksum = keccak256(UTF8(Payload))[2..18]
  ```
- **Validation:** If any single character in the receiver, tokenOut, amount, or deadline is modified, the recomputed checksum diverges, instantly triggering a **Red Glassmorphism Tampering Alert** and disabling payment execution buttons.

### 2.2 Replay Attack Prevention (Anti-Double Spending)
- **Mechanism:** `CoinSwapPayment.sol` maintains a mapping `mapping(bytes32 => bool) public isOrderProcessed;`.
- When an invoice is settled, `isOrderProcessed[orderId] = true` is permanently stored on-chain.
- Any subsequent attempt to reuse the same `orderId` reverts with `"Order already processed"`.
- Tested in `CoinSwapPayment.test.js` (Section 5) and frontend pre-flight check.

### 2.3 Strict Allowance Safety (No Unlimited Approvals)
- **Vulnerability Avoided:** Common decentralized apps request `MaxUint256` token approvals, exposing user balances if the contract ever suffers a vulnerability.
- **Remediation:** BorderPay requests approval **only for the exact required input amount** (`amountInWei`). Users never grant open-ended transfer rights to the contract.

### 2.4 Pre-Flight Transaction Safety Verification (F-13)
Before prompting the wallet signer, the application runs eight deterministic client-side checks:
1. `ethers.isAddress(receiver)` validates 42-character hex format.
2. `TOKENS.some(t => t.address === tokenOut)` verifies token allowlist.
3. `amount > 0` prevents zero-value transactions.
4. `block.timestamp <= deadline` ensures the order has not expired.
5. `isOrderProcessed(orderId) == false` prevents wasting gas on spent orders.
6. `tokenBalance >= requiredAmountIn` ensures sufficient mock token liquidity.
7. `ethBalance >= estimatedGasFee` prevents out-of-gas reverts.
8. `chainId === "0xaa36a7"` prevents broadcasting on unintended networks.

### 2.5 Real-Time Gas Estimation & Sufficiency Check (F-03)
- The application queries the current Sepolia fee market via `provider.getFeeData()` and calculates gas fees using the standard gas limit (~160k - 220k units).
- If payer ETH balance is insufficient, a clear warning banner prompts the user to access the Sepolia faucet before submitting a failing transaction.

### 2.6 Multi-Account Isolation & EIP-1193 Event Synchronization (F-14)
- Subscribes to `accountsChanged`, `chainChanged`, and `disconnect`.
- Any wallet switch instantly clears stale approval states, refreshes balances, and re-validates the invoice parameters against the newly active account.

---

## 3. Truth in Advertising & Non-Misleading UX

In accordance with strict ethical and academic guidelines:
1. **Academic Simulation Labeling:** All token rates are explicitly titled **"On-Chain Mock Rates / Kurs Simulasi"**, never live market forex rates.
2. **Local Merchant Profiles:** Browser storage is explicitly documented as **"Local-Only Demo Profile"**, eliminating false claims of production database authentication.
3. **Receipt Authenticity:** Payment status is only marked **"Confirmed"** after actual verification of `receipt.status === 1` from the Sepolia node.
4. **Zero Monetary Value:** Prominent disclaimers state mock tokens (`mUSD`, `mEUR`, `mJPY`) possess zero real-world economic value.

---

## 4. Performance & RPC Optimization

1. **Lightweight Static Build:** Next.js static page generation completes in under 1 second per route (`/` and `/pay`).
2. **No Layout Shift Fonts:** Font declarations use standard system fallback hierarchies with font-display swap to ensure instant First Contentful Paint (FCP).
3. **RPC Rate Limit Prevention:** Polling intervals for navbar balances and block events are throttled to 12-second cycles matching the Sepolia block time, preventing rate-limiting on public RPC nodes.
