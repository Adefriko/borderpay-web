const hre = require("hardhat");

async function main() {
  const FRIENDS = [
    "0x958f5e6898df21c63A9064449e35C204C8B3e526",
    "0x5b79F1a941Ca4F0AE2643468CB3095B89F178224",
    "0x7b449e77b9D1Fc328089b4c344a2087024F66230",
  ];

  const MUSD = "0xEF70d487Ee882e97a3F0A1Febd58d9f72e4859dd";
  const MEUR = "0x4f895D138BE52f4926Cba27DDe85Fe9d67AeeCd5";
  const MJPY = "0x1e6128D71cfbbF071FE21391460BE7191e92BDF0";

  const mUSD = await hre.ethers.getContractAt("MockToken", MUSD);
  const mEUR = await hre.ethers.getContractAt("MockToken", MEUR);
  const mJPY = await hre.ethers.getContractAt("MockToken", MJPY);

  for (const addr of FRIENDS) {
    console.log("Mencetak token simulasi ke:", addr);
    await (await mUSD.mint(addr, hre.ethers.parseUnits("10000", 18))).wait();
    await (await mEUR.mint(addr, hre.ethers.parseUnits("10000", 18))).wait();
    await (await mJPY.mint(addr, hre.ethers.parseUnits("1000000", 18))).wait();
  }

  console.log("Selesai! Ketiga temanmu sudah menerima token simulasi di Sepolia.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});