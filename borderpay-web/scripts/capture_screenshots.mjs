import puppeteer from "puppeteer";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotsDir = path.resolve(__dirname, "../../docs/screenshots");

if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

async function waitForServer(url, timeoutMs = 25000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.status < 500) return true;
    } catch (e) {
      // wait and retry
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  throw new Error(`Server failed to start within ${timeoutMs}ms`);
}

async function run() {
  console.log("Starting Next.js server on port 3005...");
  const server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", "3005", "-H", "127.0.0.1"], {
    cwd: path.resolve(__dirname, ".."),
    stdio: "inherit",
  });

  try {
    await waitForServer("http://127.0.0.1:3005");
    console.log("Next.js server is ready. Launching Puppeteer...");

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-gpu"],
    });

    const page = await browser.newPage();

    // 1. Desktop Dashboard / Terminal
    console.log("Capturing 01_dashboard_desktop.png...");
    await page.setViewport({ width: 1440, height: 950, deviceScaleFactor: 2 });
    await page.goto("http://127.0.0.1:3005", { waitUntil: "networkidle0" });
    await page.screenshot({ path: path.join(screenshotsDir, "01_dashboard_desktop.png") });

    // 2. Click Generate QR to get live QR view
    console.log("Capturing 02_create_invoice_qr.png...");
    const genBtn = await page.$('button[type="submit"]');
    if (genBtn) {
      await genBtn.click();
      await new Promise((r) => setTimeout(r, 1200));
      await page.screenshot({ path: path.join(screenshotsDir, "02_create_invoice_qr.png") });
    }

    // 3. Ledger Tab
    console.log("Capturing 03_onchain_ledger.png...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("nav button"));
      const ledgerBtn = btns.find((b) => b.textContent.includes("Ledger"));
      if (ledgerBtn) ledgerBtn.click();
    });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(screenshotsDir, "03_onchain_ledger.png") });

    // 4. Rates & Calculator Tab
    console.log("Capturing 04_rates_calculator.png...");
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("nav button"));
      const ratesBtn = btns.find((b) => b.textContent.includes("Kurs") || b.textContent.includes("Kalkulator"));
      if (ratesBtn) ratesBtn.click();
    });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotsDir, "04_rates_calculator.png") });

    // 5. Checkout Page (Desktop) with Verified Checksum
    console.log("Capturing 05_checkout_desktop.png...");
    const samplePayUrl =
      "http://127.0.0.1:3005/pay?orderId=0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890&receiver=0x70997970C51812dc3A010C7d01b50e0d17dc79C8&tokenOut=0xEF70d487Ee882e97a3F0A1Febd58d9f72e4859dd&amount=25.0&deadline=1893456000&memo=Pembayaran%20Kopi%20Latte&merchant=Kopi%20Senja";
    await page.goto(samplePayUrl, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 1200));
    await page.screenshot({ path: path.join(screenshotsDir, "05_checkout_desktop.png") });

    // 6. Mobile Dashboard (390x844)
    console.log("Capturing 06_dashboard_mobile.png...");
    await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true });
    await page.goto("http://127.0.0.1:3005", { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(screenshotsDir, "06_dashboard_mobile.png") });

    // 7. Mobile Checkout
    console.log("Capturing 07_checkout_mobile.png...");
    await page.goto(samplePayUrl, { waitUntil: "networkidle0" });
    await new Promise((r) => setTimeout(r, 800));
    await page.screenshot({ path: path.join(screenshotsDir, "07_checkout_mobile.png") });

    await browser.close();
    console.log("All screenshots captured successfully in docs/screenshots/!");
  } finally {
    try {
      server.kill();
      spawn("taskkill", ["/F", "/T", "/PID", String(server.pid)]);
    } catch {}
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
