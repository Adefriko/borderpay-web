const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying CoinSwapPayment V2 dengan akun:", deployer.address);

  // Gunakan alamat token simulasi yang sudah ada di Sepolia
  const MUSD = "0xEF70d487Ee882e97a3F0A1Febd58d9f72e4859dd";
  const MEUR = "0x4f895D138BE52f4926Cba27DDe85Fe9d67AeeCd5";
  const MJPY = "0x1e6128D71cfbbF071FE21391460BE7191e92BDF0";

  // 1. Deploy kontrak CoinSwapPayment baru
  const CoinSwap = await hre.ethers.getContractFactory("CoinSwapPayment");
  const swapContract = await CoinSwap.deploy();
  await swapContract.waitForDeployment();
  const swapAddress = await swapContract.getAddress();
  console.log("ALAMAT BARU CoinSwapPayment:", swapAddress);

  // 2. Atur 6 pasangan kurs simulasi (basis 10000)
  console.log("Mengatur 6 pasangan rasio simulasi...");
  await (await swapContract.setMockRate(MUSD, MEUR, 9200)).wait();    // 1 mUSD = 0.92 mEUR
  await (await swapContract.setMockRate(MEUR, MUSD, 10870)).wait();   // 1 mEUR = 1.087 mUSD
  await (await swapContract.setMockRate(MUSD, MJPY, 1500000)).wait(); // 1 mUSD = 150 mJPY
  await (await swapContract.setMockRate(MJPY, MUSD, 67)).wait();      // 1 mJPY = 0.0067 mUSD
  await (await swapContract.setMockRate(MEUR, MJPY, 1630000)).wait(); // 1 mEUR = 163 mJPY
  await (await swapContract.setMockRate(MJPY, MEUR, 61)).wait();      // 1 mJPY = 0.0061 mEUR

  // 3. Isi likuiditas mock pool baru (terutama mJPY butuh banyak karena nilainya kecil)
  console.log("Mengisi likuiditas mock pool baru...");
  const mUSD = await hre.ethers.getContractAt("MockToken", MUSD);
  const mEUR = await hre.ethers.getContractAt("MockToken", MEUR);
  const mJPY = await hre.ethers.getContractAt("MockToken", MJPY);

  await (await mUSD.mint(swapAddress, hre.ethers.parseUnits("100000", 18))).wait();
  await (await mEUR.mint(swapAddress, hre.ethers.parseUnits("100000", 18))).wait();
  await (await mJPY.mint(swapAddress, hre.ethers.parseUnits("15000000", 18))).wait(); // 15 juta mJPY

  console.log("Selesai! Salin ALAMAT BARU CoinSwapPayment di atas untuk dimasukkan ke Frontend.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});