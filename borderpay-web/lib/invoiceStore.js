/**
 * BorderPay — Local Invoice History & Management Storage (F-05)
 *
 * Persists created invoices to browser localStorage with status tracking,
 * metadata, timestamps, and quick settlement shortcuts.
 */

const STORAGE_KEY = "borderpay_local_invoices_v2";

export function getLocalInvoices() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Failed to read local invoices:", e);
    return [];
  }
}

export function saveLocalInvoice(invoice) {
  if (typeof window === "undefined" || !invoice?.orderId) return;
  try {
    const existing = getLocalInvoices();
    // Prevent duplicate entries
    const filtered = existing.filter((item) => item.orderId !== invoice.orderId);
    const updated = [
      {
        ...invoice,
        createdAt: invoice.createdAt || Math.floor(Date.now() / 1000),
      },
      ...filtered,
    ].slice(0, 50); // Keep latest 50 invoices
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save local invoice:", e);
  }
}

export function updateInvoiceStatus(orderId, status) {
  if (typeof window === "undefined" || !orderId) return;
  try {
    const existing = getLocalInvoices();
    const updated = existing.map((inv) =>
      inv.orderId === orderId ? { ...inv, status, updatedAt: Math.floor(Date.now() / 1000) } : inv
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to update invoice status:", e);
  }
}

export function clearLocalInvoices() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
