export const SEPOLIA_CHAIN_ID = "0xaa36a7";

export const CONTRACT_ADDRESSES = {
  CoinSwapPayment: "0x236D5D12241808ba9AB716c0bB410cCa30eA6923",
  mUSD: "0xEF70d487Ee882e97a3F0A1Febd58d9f72e4859dd",
  mEUR: "0x4f895D138BE52f4926Cba27DDe85Fe9d67AeeCd5",
  mJPY: "0x1e6128D71cfbbF071FE21391460BE7191e92BDF0",
};

export const TOKENS = [
  {
    symbol: "USDC",
    name: "USD Coin (Sepolia Mock)",
    coingeckoId: "usd-coin",
    address: CONTRACT_ADDRESSES.mUSD,
  },
  {
    symbol: "ETH",
    name: "Ethereum (Sepolia Mock)",
    coingeckoId: "ethereum",
    address: CONTRACT_ADDRESSES.mEUR,
  },
  {
    symbol: "LINK",
    name: "Chainlink (Sepolia Mock)",
    coingeckoId: "chainlink",
    address: CONTRACT_ADDRESSES.mJPY,
  },
];

export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function symbol() view returns (string)",
];

export const SWAP_ABI = [
  "function payOrSwap(bytes32 orderId, address tokenIn, address tokenOut, address receiver, uint256 amountIn, uint256 minAmountOut, uint256 deadline) external",
  "function isOrderProcessed(bytes32 orderId) view returns (bool)",
  "function quoteSwap(address tokenIn, address tokenOut, uint256 amountIn) view returns (uint256)",
  "function quoteRequiredIn(address tokenIn, address tokenOut, uint256 amountOut) view returns (uint256)",
  "function mockRates(address tokenIn, address tokenOut) view returns (uint256)",
  "event PaymentProcessed(bytes32 indexed orderId, address indexed sender, address indexed receiver, address tokenIn, address tokenOut, uint256 amountIn, uint256 amountOut)",
];