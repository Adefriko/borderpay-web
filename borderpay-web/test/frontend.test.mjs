import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  computeInvoiceChecksum,
  verifyInvoiceIntegrity,
  buildCanonicalInvoicePayload,
} from "../lib/invoiceIntegrity.js";
import {
  isTxForAddress,
  summarizeInvoices,
  buildActivityBuckets,
  buildLiveNotifications,
} from "../lib/activityUtils.js";

describe("BorderPay Frontend Logic & Web3 Verification Suite", () => {
  const sampleInvoice = {
    orderId: ethers.id("BP-TEST-ORDER-12345"),
    receiver: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    tokenOut: "0xEF70d487Ee882e97a3F0A1Febd58d9f72e4859dd",
    amount: "25.5",
    deadline: 1893456000,
  };

  describe("1. Invoice Integrity & Tampering Protection (F-02)", () => {
    it("Should generate a valid, reproducible 16-character hex checksum", () => {
      const checksum = computeInvoiceChecksum(sampleInvoice);
      assert.equal(typeof checksum, "string");
      assert.equal(checksum.length, 16);

      // Reproducibility test
      const checksum2 = computeInvoiceChecksum(sampleInvoice);
      assert.equal(checksum, checksum2);
    });

    it("Should successfully verify an authentic untampered invoice", () => {
      const checksum = computeInvoiceChecksum(sampleInvoice);
      const result = verifyInvoiceIntegrity({
        ...sampleInvoice,
        checksum,
      });

      assert.equal(result.status, "VERIFIED");
      assert.equal(result.isValid, true);
      assert.equal(result.isTampered, false);
    });

    it("Should detect and reject a tampered recipient address", () => {
      const checksum = computeInvoiceChecksum(sampleInvoice);
      const attackerAddress = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

      const result = verifyInvoiceIntegrity({
        ...sampleInvoice,
        receiver: attackerAddress,
        checksum,
      });

      assert.equal(result.status, "TAMPERED");
      assert.equal(result.isValid, false);
      assert.equal(result.isTampered, true);
    });

    it("Should detect and reject a tampered nominal amount", () => {
      const checksum = computeInvoiceChecksum(sampleInvoice);

      const result = verifyInvoiceIntegrity({
        ...sampleInvoice,
        amount: "500.0", // Altered amount
        checksum,
      });

      assert.equal(result.status, "TAMPERED");
      assert.equal(result.isValid, false);
      assert.equal(result.isTampered, true);
    });

    it("Should detect and reject a tampered settlement token", () => {
      const checksum = computeInvoiceChecksum(sampleInvoice);
      const alteredToken = "0x1e6128D71cfbbF071FE21391460BE7191e92BDF0"; // Swapped to mJPY

      const result = verifyInvoiceIntegrity({
        ...sampleInvoice,
        tokenOut: alteredToken,
        checksum,
      });

      assert.equal(result.status, "TAMPERED");
      assert.equal(result.isValid, false);
      assert.equal(result.isTampered, true);
    });

    it("Should detect and reject a tampered deadline timestamp", () => {
      const checksum = computeInvoiceChecksum(sampleInvoice);

      const result = verifyInvoiceIntegrity({
        ...sampleInvoice,
        deadline: 9999999999, // Artificially extended deadline
        checksum,
      });

      assert.equal(result.status, "TAMPERED");
      assert.equal(result.isValid, false);
      assert.equal(result.isTampered, true);
    });

    it("Should flag an invoice without a checksum as UNVERIFIED (Legacy)", () => {
      const result = verifyInvoiceIntegrity({
        ...sampleInvoice,
        checksum: "",
      });

      assert.equal(result.status, "UNVERIFIED");
      assert.equal(result.isValid, false);
      assert.equal(result.isTampered, false);
    });
  });

  describe("2. Fixed-Point Token Math & Precision Verification", () => {
    it("Should correctly parse and format 18 decimal ERC-20 token units without float drift", () => {
      const nominal = "123.456789123456789123";
      const wei = ethers.parseUnits(nominal, 18);
      const formatted = ethers.formatUnits(wei, 18);
      assert.equal(formatted, nominal);
    });

    it("Should calculate 0.5% maximum slippage tolerance correctly using BigInt", () => {
      const expectedOutWei = ethers.parseUnits("100", 18);
      // Min output with 0.5% slippage: 100 * 995 / 1000 = 99.5
      const minOutWei = (expectedOutWei * 995n) / 1000n;
      assert.equal(ethers.formatUnits(minOutWei, 18), "99.5");
    });

    it("Should validate valid 42-character 0x Ethereum addresses", () => {
      assert.equal(ethers.isAddress(sampleInvoice.receiver), true);
      assert.equal(ethers.isAddress("0xInvalidNotAnAddress"), false);
      assert.equal(ethers.isAddress("0x0000000000000000000000000000000000000000"), true);
      assert.equal(ethers.isAddress(""), false);
    });
  });

  describe("3. On-Chain Mock Conversion Arithmetic Simulation", () => {
    const RATE_PRECISION = 10000n;

    it("Should simulate swap calculation matching smart contract quoteSwap", () => {
      // 100 USD at 0.9200 EUR rate (9200) -> 92 EUR
      const amountIn = ethers.parseUnits("100", 18);
      const rate = 9200n;
      const expectedOut = (amountIn * rate) / RATE_PRECISION;
      assert.equal(ethers.formatUnits(expectedOut, 18), "92.0");
    });

    it("Should simulate ceiling division matching smart contract quoteRequiredIn", () => {
      // Want 92 EUR at 9200 rate -> requires 100 USD
      const amountOut = ethers.parseUnits("92", 18);
      const rate = 9200n;
      const requiredIn = ((amountOut * RATE_PRECISION) + rate - 1n) / rate;
      assert.equal(ethers.formatUnits(requiredIn, 18), "100.0");
    });
  });

  describe("4. DB, Wallet & Blockchain Activity Aggregation", () => {
    const alice = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";
    const bob = "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC";

    it("Should return exact zero counts when DB invoices and blockchain history are empty", () => {
      const summary = summarizeInvoices([], [], 1_700_000_000);
      assert.equal(summary.activeCount, 0);
      assert.equal(summary.expiredCount, 0);
      assert.equal(summary.paidCount, 0);

      const buckets = buildActivityBuckets({ history: [], filter: "7d", nowMs: 1_700_000_000_000 });
      assert.equal(buckets.total, 0);
      assert.equal(buckets.peak, 0);
      assert.equal(buckets.points.length, 7);
    });

    it("Should reconcile local DB invoices against on-chain PaymentProcessed orderIds", () => {
      const nowSec = 1_700_001_000;
      const invoices = [
        { orderId: "0xORDER1", deadline: nowSec + 900, amount: "25", tokenSymbol: "mUSD", createdAt: nowSec - 60 },
        { orderId: "0xORDER2", deadline: nowSec - 100, amount: "10", tokenSymbol: "mEUR", createdAt: nowSec - 900 },
        { orderId: "0xORDER3", deadline: nowSec + 500, amount: "50", tokenSymbol: "mUSD", status: "PAID", createdAt: nowSec - 120 },
      ];
      const history = [
        { orderId: "0xorder1", txHash: "0xhash1", sender: alice, receiver: bob, type: "Swap", pair: "mUSD/mEUR", amountIn: "27.17", amountOut: "25.00", tokenInSymbol: "mUSD", tokenOutSymbol: "mEUR", timestamp: nowSec * 1000 },
      ];

      const summary = summarizeInvoices(invoices, history, nowSec);
      assert.equal(summary.activeCount, 0);
      assert.equal(summary.expiredCount, 1);
      assert.equal(summary.paidCount, 2);
      assert.equal(isTxForAddress(history[0], alice.toLowerCase()), true);
      assert.equal(isTxForAddress(history[0], "0x0000000000000000000000000000000000000001"), false);
    });

    it("Should compute real Swap/Transfer splits and dynamic buckets over active time window", () => {
      const nowMs = Date.UTC(2026, 10, 25, 12, 0, 0);
      const history = [
        { type: "Swap", timestamp: nowMs - 3600_000 },
        { type: "Swap", timestamp: nowMs - 86_400_000 },
        { type: "Transfer", timestamp: nowMs - 2 * 86_400_000 },
        { type: "Transfer", timestamp: nowMs - 14 * 86_400_000 },
      ];

      const week = buildActivityBuckets({ history, filter: "7d", nowMs });
      assert.equal(week.total, 3);
      assert.equal(week.swapCount, 2);
      assert.equal(week.transferCount, 1);
      assert.equal(week.swapPct, 67);

      const all = buildActivityBuckets({ history, filter: "all", nowMs });
      assert.equal(all.total, 4);
      assert.equal(all.swapPct, 50);
    });

    it("Should build notifications strictly from real wallet, DB invoices, and on-chain events", () => {
      const emptyNotifs = buildLiveNotifications({});
      assert.equal(emptyNotifs.length, 0);

      const populated = buildLiveNotifications({
        walletAddress: alice,
        localInvoices: [{ orderId: "0xINV1234567890", amount: "20", tokenSymbol: "mUSD", createdAt: 1_700_000_000, deadline: 1_700_000_900 }],
        history: [{ txHash: "0xTXHASH123456", type: "Swap", amountIn: "20", tokenInSymbol: "mUSD", amountOut: "18.40", tokenOutSymbol: "mEUR", timestamp: 1_700_000_050_000 }],
        nowSec: 1_700_000_100,
        nowMs: 1_700_000_100_000,
      });
      assert.equal(populated.length, 3);
      assert.match(populated[0].title, /Wallet MetaMask terhubung/);
    });
  });
});
