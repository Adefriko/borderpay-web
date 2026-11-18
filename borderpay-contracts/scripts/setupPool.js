const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Menyiapkan saldo & liquidity pool dengan akun:", deployer.address);

  // Alamat kontrak hasil deploy tadi
  const SWAP_CONTRACT = "0x2b530Fb61e23930439bbAdb69A81DE081109A9C4";
  const MUSD_ADDRESS  = "0xEF70d487Ee882e97a3F0A1Febd58d9f72e4859dd";
  const MEUR_ADDRESS  = "0x4f895D138BE52f4926Cba27DDe85Fe9d67AeeCd5";
  const MJPY_ADDRESS  = "0x1e6128D71cfbbF071FE21391460BE7191e92BDF0";

  // Menghubungkan ke kontrak MockToken
  const mUSD = await hre.ethers.getContractAt("MockToken", MUSD_ADDRESS);
  const mEUR = await hre.ethers.getContractAt("MockToken", MEUR_ADDRESS);
  const mJPY = await hre.ethers.getContractAt("MockToken", MJPY_ADDRESS);

  const jumlahWallet = hre.ethers.parseUnits("10000", 18);  // 10.000 token untuk wallet penguji
  const jumlahPool   = hre.ethers.parseUnits("100000", 18); // 100.000 token untuk cadangan pool swap

  console.log("1. Mencetak token ke wallet penguji...");
  await (await mUSD.mint(deployer.address, jumlahWallet)).wait();
  await (await mEUR.mint(deployer.address, jumlahWallet)).wait();
  await (await mJPY.mint(deployer.address, jumlahWallet)).wait();

  console.log("2. Mengisi likuiditas mock pool di kontrak CoinSwapPayment...");
  await (await mUSD.mint(SWAP_CONTRACT, jumlahPool)).wait();
  await (await mEUR.mint(SWAP_CONTRACT, jumlahPool)).wait();
  await (await mJPY.mint(SWAP_CONTRACT, jumlahPool)).wait();

  console.log("Selesai! Wallet penguji dan Mock Liquidity Pool sudah terisi penuh.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});