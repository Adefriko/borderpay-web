import { ethers } from "ethers";

/**
 * BorderPay — Canonical Invoice Integrity Protection Engine (F-02)
 *
 * Implements deterministic cryptographic hashing to protect invoice parameters
 * from unauthorized client-side tampering (e.g. modified receiver, amount, token, or deadline).
 */

const INVOICE_SALT = "BORDERPAY_CANONICAL_V2_INTEGRITY_SALT";

/**
 * Builds a canonical string representation of an invoice payload.
 */
export function buildCanonicalInvoicePayload({
  orderId,
  receiver,
  tokenOut,
  amount,
  deadline,
}) {
  const normOrderId = (orderId || "").trim();
  const normReceiver = (receiver || "").trim().toLowerCase();
  const normTokenOut = (tokenOut || "").trim().toLowerCase();
  const normAmount = (amount || "0").trim();
  const normDeadline = String(deadline || "0").trim();

  return `${normOrderId}|${normReceiver}|${normTokenOut}|${normAmount}|${normDeadline}|${INVOICE_SALT}`;
}

/**
 * Computes a deterministic keccak256 checksum for the canonical invoice parameters.
 */
export function computeInvoiceChecksum({
  orderId,
  receiver,
  tokenOut,
  amount,
  deadline,
}) {
  try {
    const payload = buildCanonicalInvoicePayload({
      orderId,
      receiver,
      tokenOut,
      amount,
      deadline,
    });
    // keccak256 hash of UTF-8 encoded canonical payload
    const hash = ethers.keccak256(ethers.toUtf8Bytes(payload));
    // Return first 16 characters as a URL-friendly robust hex checksum (64-bit entropy)
    return hash.slice(2, 18);
  } catch (err) {
    console.error("Error computing invoice checksum:", err);
    return "";
  }
}

/**
 * Verifies if the invoice parameters match the provided checksum.
 * Returns:
 * - { status: "VERIFIED", message: "Integritas invoice terverifikasi secara kriptografis." }
 * - { status: "TAMPERED", message: "Peringatan Keamanan: Parameter invoice telah dimodifikasi!" }
 * - { status: "UNVERIFIED", message: "Invoice tidak memiliki checksum integritas (Legacy Invoice)." }
 */
export function verifyInvoiceIntegrity({
  orderId,
  receiver,
  tokenOut,
  amount,
  deadline,
  checksum,
}) {
  if (!checksum) {
    return {
      status: "UNVERIFIED",
      isValid: false,
      isTampered: false,
      message: "Invoice tidak menyertakan tanda tangan integritas.",
    };
  }

  const expectedChecksum = computeInvoiceChecksum({
    orderId,
    receiver,
    tokenOut,
    amount,
    deadline,
  });

  if (expectedChecksum.toLowerCase() === checksum.toLowerCase()) {
    return {
      status: "VERIFIED",
      isValid: true,
      isTampered: false,
      message: "Integritas invoice terverifikasi secara kriptografis.",
    };
  }

  return {
    status: "TAMPERED",
    isValid: false,
    isTampered: true,
    message: "Parameter invoice (nominal/penerima/koin) tidak cocok dengan checksum asli!",
  };
}
