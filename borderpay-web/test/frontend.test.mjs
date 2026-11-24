import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "ethers";
import {
  computeInvoiceChecksum,
  verifyInvoiceIntegrity,
  buildCanonicalInvoicePayload,
} from "../lib/invoiceIntegrity.js";

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
});
