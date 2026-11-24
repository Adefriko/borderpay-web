const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("BorderPay — CoinSwapPayment Protocol Smart Contract Suite", function () {
  let coinSwapPayment;
  let mockUSD, mockEUR, mockJPY;
  let owner, merchant, payer, attacker;

  const INITIAL_SUPPLY = ethers.parseUnits("1000000", 18);
  const POOL_LIQUIDITY = ethers.parseUnits("100000", 18);

  beforeEach(async function () {
    [owner, merchant, payer, attacker] = await ethers.getSigners();

    // 1. Deploy Mock Tokens
    const MockTokenFactory = await ethers.getContractFactory("MockToken");
    mockUSD = await MockTokenFactory.deploy("Mock USD", "mUSD");
    mockEUR = await MockTokenFactory.deploy("Mock EUR", "mEUR");
    mockJPY = await MockTokenFactory.deploy("Mock JPY", "mJPY");

    await mockUSD.waitForDeployment();
    await mockEUR.waitForDeployment();
    await mockJPY.waitForDeployment();

    // 2. Deploy CoinSwapPayment
    const CoinSwapPaymentFactory = await ethers.getContractFactory("CoinSwapPayment");
    coinSwapPayment = await CoinSwapPaymentFactory.deploy();
    await coinSwapPayment.waitForDeployment();

    const paymentAddress = await coinSwapPayment.getAddress();

    // 3. Mint tokens to Owner and Payer
    await mockUSD.mint(owner.address, INITIAL_SUPPLY);
    await mockEUR.mint(owner.address, INITIAL_SUPPLY);
    await mockJPY.mint(owner.address, INITIAL_SUPPLY);

    await mockUSD.mint(payer.address, ethers.parseUnits("10000", 18));
    await mockEUR.mint(payer.address, ethers.parseUnits("10000", 18));
    await mockJPY.mint(payer.address, ethers.parseUnits("1000000", 18));

    // 4. Configure Mock Conversion Rates (Basis points: 10000 = 1.0000x)
    // USD <-> EUR: 1 USD = 0.9200 EUR (9200) | 1 EUR = 1.0870 USD (10870)
    // USD <-> JPY: 1 USD = 155.0000 JPY (1550000) | 1 JPY = 0.0064 USD (64)
    // EUR <-> JPY: 1 EUR = 168.0000 JPY (1680000) | 1 JPY = 0.0059 EUR (59)
    const usdAddr = await mockUSD.getAddress();
    const eurAddr = await mockEUR.getAddress();
    const jpyAddr = await mockJPY.getAddress();

    await coinSwapPayment.setMockRate(usdAddr, eurAddr, 9200);
    await coinSwapPayment.setMockRate(eurAddr, usdAddr, 10870);
    await coinSwapPayment.setMockRate(usdAddr, jpyAddr, 1550000);
    await coinSwapPayment.setMockRate(jpyAddr, usdAddr, 64);
    await coinSwapPayment.setMockRate(eurAddr, jpyAddr, 1680000);
    await coinSwapPayment.setMockRate(jpyAddr, eurAddr, 59);

    // 5. Fund Contract Pool Liquidity for Swaps
    await mockUSD.approve(paymentAddress, POOL_LIQUIDITY);
    await mockEUR.approve(paymentAddress, POOL_LIQUIDITY);
    await mockJPY.approve(paymentAddress, POOL_LIQUIDITY);

    await coinSwapPayment.addMockLiquidity(usdAddr, POOL_LIQUIDITY);
    await coinSwapPayment.addMockLiquidity(eurAddr, POOL_LIQUIDITY);
    await coinSwapPayment.addMockLiquidity(jpyAddr, POOL_LIQUIDITY);
  });

  describe("1. Deployment & Initialization", function () {
    it("Should set the correct deployer as contract owner", async function () {
      expect(await coinSwapPayment.owner()).to.equal(owner.address);
    });

    it("Should have correct rate precision constant (10000)", async function () {
      expect(await coinSwapPayment.RATE_PRECISION()).to.equal(10000n);
    });

    it("Should hold allocated mock liquidity", async function () {
      const paymentAddress = await coinSwapPayment.getAddress();
      expect(await mockUSD.balanceOf(paymentAddress)).to.equal(POOL_LIQUIDITY);
      expect(await mockEUR.balanceOf(paymentAddress)).to.equal(POOL_LIQUIDITY);
      expect(await mockJPY.balanceOf(paymentAddress)).to.equal(POOL_LIQUIDITY);
    });
  });

  describe("2. Quote Calculation Logic", function () {
    it("Should return identical amount when tokenIn == tokenOut", async function () {
      const amount = ethers.parseUnits("100", 18);
      const usdAddr = await mockUSD.getAddress();
      const quoteOut = await coinSwapPayment.quoteSwap(usdAddr, usdAddr, amount);
      const quoteIn = await coinSwapPayment.quoteRequiredIn(usdAddr, usdAddr, amount);
      expect(quoteOut).to.equal(amount);
      expect(quoteIn).to.equal(amount);
    });

    it("Should accurately calculate quoteSwap across token pairs", async function () {
      const usdAddr = await mockUSD.getAddress();
      const eurAddr = await mockEUR.getAddress();
      const amountIn = ethers.parseUnits("100", 18); // 100 USD

      // 100 * 9200 / 10000 = 92 EUR
      const expectedOut = ethers.parseUnits("92", 18);
      const actualOut = await coinSwapPayment.quoteSwap(usdAddr, eurAddr, amountIn);
      expect(actualOut).to.equal(expectedOut);
    });

    it("Should accurately calculate quoteRequiredIn with ceiling rounding", async function () {
      const usdAddr = await mockUSD.getAddress();
      const eurAddr = await mockEUR.getAddress();
      const amountOut = ethers.parseUnits("92", 18); // Want 92 EUR

      const reqIn = await coinSwapPayment.quoteRequiredIn(usdAddr, eurAddr, amountOut);
      expect(reqIn).to.equal(ethers.parseUnits("100", 18));
    });

    it("Should revert quote if swap pair rate is unconfigured", async function () {
      const MockTokenFactory = await ethers.getContractFactory("MockToken");
      const unlisted = await MockTokenFactory.deploy("Unlisted", "UNL");
      await unlisted.waitForDeployment();
      const unlistedAddr = await unlisted.getAddress();
      const usdAddr = await mockUSD.getAddress();

      await expect(
        coinSwapPayment.quoteSwap(usdAddr, unlistedAddr, ethers.parseUnits("10", 18))
      ).to.be.revertedWith("Swap pair rate not configured");
    });
  });

  describe("3. Same-Token Direct Payment", function () {
    it("Should execute direct transfer without fee when tokenIn == tokenOut", async function () {
      const paymentAddress = await coinSwapPayment.getAddress();
      const usdAddr = await mockUSD.getAddress();
      const amount = ethers.parseUnits("50", 18);
      const orderId = ethers.keccak256(ethers.toUtf8Bytes("ORDER-SAME-TOKEN-01"));
      const deadline = (await time.latest()) + 3600;

      // Payer approves payment contract
      await mockUSD.connect(payer).approve(paymentAddress, amount);

      const merchantBalBefore = await mockUSD.balanceOf(merchant.address);
      const payerBalBefore = await mockUSD.balanceOf(payer.address);

      // Execute payment
      await expect(
        coinSwapPayment
          .connect(payer)
          .payOrSwap(orderId, usdAddr, usdAddr, merchant.address, amount, amount, deadline)
      )
        .to.emit(coinSwapPayment, "PaymentProcessed")
        .withArgs(orderId, payer.address, merchant.address, usdAddr, usdAddr, amount, amount);

      expect(await mockUSD.balanceOf(merchant.address)).to.equal(merchantBalBefore + amount);
      expect(await mockUSD.balanceOf(payer.address)).to.equal(payerBalBefore - amount);
      expect(await coinSwapPayment.isOrderProcessed(orderId)).to.be.true;
    });
  });

  describe("4. Multi-Currency Cross-Token Swaps (All 6 Pairs)", function () {
    const testCases = [
      { name: "mUSD -> mEUR", inSymbol: "mUSD", outSymbol: "mEUR", inAmt: "100", outAmt: "92" },
      { name: "mEUR -> mUSD", inSymbol: "mEUR", outSymbol: "mUSD", inAmt: "100", outAmt: "108.7" },
      { name: "mUSD -> mJPY", inSymbol: "mUSD", outSymbol: "mJPY", inAmt: "10", outAmt: "1550" },
      { name: "mJPY -> mUSD", inSymbol: "mJPY", outSymbol: "mUSD", inAmt: "10000", outAmt: "64" },
      { name: "mEUR -> mJPY", inSymbol: "mEUR", outSymbol: "mJPY", inAmt: "10", outAmt: "1680" },
      { name: "mJPY -> mEUR", inSymbol: "mJPY", outSymbol: "mEUR", inAmt: "10000", outAmt: "59" },
    ];

    testCases.forEach((tc, idx) => {
      it(`Should execute swap payment for pair: ${tc.name}`, async function () {
        const tokenMap = { mUSD: mockUSD, mEUR: mockEUR, mJPY: mockJPY };
        const tokenInContract = tokenMap[tc.inSymbol];
        const tokenOutContract = tokenMap[tc.outSymbol];

        const tokenInAddr = await tokenInContract.getAddress();
        const tokenOutAddr = await tokenOutContract.getAddress();
        const paymentAddress = await coinSwapPayment.getAddress();

        const amountIn = ethers.parseUnits(tc.inAmt, 18);
        const expectedOut = ethers.parseUnits(tc.outAmt, 18);
        const orderId = ethers.keccak256(ethers.toUtf8Bytes(`ORDER-PAIR-${idx}`));
        const deadline = (await time.latest()) + 3600;

        await tokenInContract.connect(payer).approve(paymentAddress, amountIn);

        const merchantBefore = await tokenOutContract.balanceOf(merchant.address);

        await coinSwapPayment
          .connect(payer)
          .payOrSwap(orderId, tokenInAddr, tokenOutAddr, merchant.address, amountIn, expectedOut, deadline);

        const merchantAfter = await tokenOutContract.balanceOf(merchant.address);
        expect(merchantAfter - merchantBefore).to.equal(expectedOut);
        expect(await coinSwapPayment.isOrderProcessed(orderId)).to.be.true;
      });
    });
  });

  describe("5. Replay Attack & Anti-Double Spending Protection", function () {
    it("Should reject reusing an already processed orderId", async function () {
      const paymentAddress = await coinSwapPayment.getAddress();
      const usdAddr = await mockUSD.getAddress();
      const amount = ethers.parseUnits("25", 18);
      const orderId = ethers.keccak256(ethers.toUtf8Bytes("ORDER-REPLAY-TEST"));
      const deadline = (await time.latest()) + 3600;

      await mockUSD.connect(payer).approve(paymentAddress, amount * 2n);

      // First execution succeeds
      await coinSwapPayment
        .connect(payer)
        .payOrSwap(orderId, usdAddr, usdAddr, merchant.address, amount, amount, deadline);

      // Second execution with identical orderId MUST revert
      await expect(
        coinSwapPayment
          .connect(payer)
          .payOrSwap(orderId, usdAddr, usdAddr, merchant.address, amount, amount, deadline)
      ).to.be.revertedWith("Order already processed");
    });
  });

  describe("6. Deadline & Expiration Enforcement", function () {
    it("Should reject payment after deadline has passed", async function () {
      const paymentAddress = await coinSwapPayment.getAddress();
      const usdAddr = await mockUSD.getAddress();
      const amount = ethers.parseUnits("10", 18);
      const orderId = ethers.keccak256(ethers.toUtf8Bytes("ORDER-EXPIRED"));

      const pastDeadline = (await time.latest()) - 10; // Already in past

      await mockUSD.connect(payer).approve(paymentAddress, amount);

      await expect(
        coinSwapPayment
          .connect(payer)
          .payOrSwap(orderId, usdAddr, usdAddr, merchant.address, amount, amount, pastDeadline)
      ).to.be.revertedWith("Order expired");
    });
  });

  describe("7. Slippage & Minimum Output Protection", function () {
    it("Should revert if amountOut is less than minAmountOut", async function () {
      const paymentAddress = await coinSwapPayment.getAddress();
      const usdAddr = await mockUSD.getAddress();
      const eurAddr = await mockEUR.getAddress();
      const amountIn = ethers.parseUnits("100", 18); // Gives 92 EUR
      const excessiveMinOut = ethers.parseUnits("95", 18); // Demands 95 EUR
      const orderId = ethers.keccak256(ethers.toUtf8Bytes("ORDER-SLIPPAGE"));
      const deadline = (await time.latest()) + 3600;

      await mockUSD.connect(payer).approve(paymentAddress, amountIn);

      await expect(
        coinSwapPayment
          .connect(payer)
          .payOrSwap(orderId, usdAddr, eurAddr, merchant.address, amountIn, excessiveMinOut, deadline)
      ).to.be.revertedWith("Slippage: output below minimum");
    });
  });

  describe("8. Liquidity Pool Boundary Verification", function () {
    it("Should revert if contract mock pool has insufficient liquidity for swap", async function () {
      const paymentAddress = await coinSwapPayment.getAddress();
      const usdAddr = await mockUSD.getAddress();
      const eurAddr = await mockEUR.getAddress();

      // Huge input amount that exceeds POOL_LIQUIDITY (100,000 EUR)
      const massiveAmountIn = ethers.parseUnits("150000", 18);
      await mockUSD.mint(payer.address, massiveAmountIn);
      await mockUSD.connect(payer).approve(paymentAddress, massiveAmountIn);

      const orderId = ethers.keccak256(ethers.toUtf8Bytes("ORDER-LIQUIDITY"));
      const deadline = (await time.latest()) + 3600;

      await expect(
        coinSwapPayment
          .connect(payer)
          .payOrSwap(orderId, usdAddr, eurAddr, merchant.address, massiveAmountIn, 1, deadline)
      ).to.be.revertedWith("Insufficient mock pool liquidity");
    });
  });

  describe("9. Security & Access Control (Ownable & Pausable)", function () {
    it("Should allow owner to pause and unpause contract", async function () {
      await coinSwapPayment.pause();
      expect(await coinSwapPayment.paused()).to.be.true;

      const paymentAddress = await coinSwapPayment.getAddress();
      const usdAddr = await mockUSD.getAddress();
      const orderId = ethers.keccak256(ethers.toUtf8Bytes("ORDER-PAUSED"));
      const deadline = (await time.latest()) + 3600;

      await expect(
        coinSwapPayment
          .connect(payer)
          .payOrSwap(orderId, usdAddr, usdAddr, merchant.address, 100, 100, deadline)
      ).to.be.revertedWithCustomError(coinSwapPayment, "EnforcedPause");

      await coinSwapPayment.unpause();
      expect(await coinSwapPayment.paused()).to.be.false;
    });

    it("Should prevent non-owner from setting mock rates or pausing", async function () {
      const usdAddr = await mockUSD.getAddress();
      const eurAddr = await mockEUR.getAddress();

      await expect(
        coinSwapPayment.connect(attacker).setMockRate(usdAddr, eurAddr, 9999)
      ).to.be.revertedWithCustomError(coinSwapPayment, "OwnableUnauthorizedAccount");

      await expect(
        coinSwapPayment.connect(attacker).pause()
      ).to.be.revertedWithCustomError(coinSwapPayment, "OwnableUnauthorizedAccount");
    });

    it("Should reject payment if receiver is address(0)", async function () {
      const paymentAddress = await coinSwapPayment.getAddress();
      const usdAddr = await mockUSD.getAddress();
      const orderId = ethers.keccak256(ethers.toUtf8Bytes("ORDER-ZERO-RECEIVER"));
      const deadline = (await time.latest()) + 3600;

      await mockUSD.connect(payer).approve(paymentAddress, 100);

      await expect(
        coinSwapPayment
          .connect(payer)
          .payOrSwap(orderId, usdAddr, usdAddr, ethers.ZeroAddress, 100, 100, deadline)
      ).to.be.revertedWith("Invalid receiver");
    });
  });
});
