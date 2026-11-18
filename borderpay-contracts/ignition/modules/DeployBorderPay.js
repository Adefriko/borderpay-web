const { buildModule } = require("@nomicfoundation/hardhat-ignition/modules");

module.exports = buildModule("BorderPayModule", (m) => {
  // 1. Deploy 3 Mock Tokens[cite: 1]
  const mockUSD = m.contract("MockToken", ["MockUSD", "mUSD"], { id: "mUSD" });
  const mockEUR = m.contract("MockToken", ["MockEUR", "mEUR"], { id: "mEUR" });
  const mockJPY = m.contract("MockToken", ["MockJPY", "mJPY"], { id: "mJPY" });

  // 2. Deploy kontrak pembayaran utama[cite: 1]
  const coinSwapPayment = m.contract("CoinSwapPayment");

  return { mockUSD, mockEUR, mockJPY, coinSwapPayment };
});