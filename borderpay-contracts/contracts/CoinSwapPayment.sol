// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract CoinSwapPayment is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant RATE_PRECISION = 10000; // 10000 = 1.0000x

    // Menyimpan status orderId agar tidak terjadi replay / double spending
    mapping(bytes32 => bool) public isOrderProcessed;

    // Menyimpan rasio simulasi: mockRates[tokenIn][tokenOut] (dalam basis 10000)
    mapping(address => mapping(address => uint256)) public mockRates;

    event RateUpdated(address indexed tokenIn, address indexed tokenOut, uint256 newRate);
    event PaymentProcessed(
        bytes32 indexed orderId,
        address indexed sender,
        address indexed receiver,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    );

    constructor() Ownable(msg.sender) {}

    // Fungsi admin untuk mengatur rasio simulasi antar-koin
    function setMockRate(address tokenIn, address tokenOut, uint256 rate) external onlyOwner {
        require(tokenIn != address(0) && tokenOut != address(0), "Invalid token");
        require(rate > 0, "Rate must be > 0");
        mockRates[tokenIn][tokenOut] = rate;
        emit RateUpdated(tokenIn, tokenOut, rate);
    }

    // Fungsi admin untuk menambah likuiditas mock pool
    function addMockLiquidity(address token, uint256 amount) external onlyOwner {
        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    // Menghitung berapa tokenOut yang didapat dari sejumlah tokenIn
    function quoteSwap(address tokenIn, address tokenOut, uint256 amountIn) public view returns (uint256) {
        if (tokenIn == tokenOut) return amountIn;
        uint256 rate = mockRates[tokenIn][tokenOut];
        require(rate > 0, "Swap pair rate not configured");
        return (amountIn * rate) / RATE_PRECISION;
    }

    // Menghitung berapa tokenIn yang dibutuhkan pengirim agar penerima mendapat amountOut tepat
    function quoteRequiredIn(address tokenIn, address tokenOut, uint256 amountOut) public view returns (uint256) {
        if (tokenIn == tokenOut) return amountOut;
        uint256 rate = mockRates[tokenIn][tokenOut];
        require(rate > 0, "Swap pair rate not configured");
        // Pembulatan ke atas agar output tidak kurang dari tagihan
        return ((amountOut * RATE_PRECISION) + rate - 1) / rate;
    }

    function payOrSwap(
        bytes32 orderId,
        address tokenIn,
        address tokenOut,
        address receiver,
        uint256 amountIn,
        uint256 minAmountOut,
        uint256 deadline
    ) external whenNotPaused nonReentrant {
        require(block.timestamp <= deadline, "Order expired");
        require(!isOrderProcessed[orderId], "Order already processed");
        require(receiver != address(0), "Invalid receiver");

        isOrderProcessed[orderId] = true;

        // Tarik token input dari pengirim ke kontrak
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        uint256 amountOut;
        if (tokenIn == tokenOut) {
            amountOut = amountIn;
            IERC20(tokenOut).safeTransfer(receiver, amountOut);
        } else {
            amountOut = quoteSwap(tokenIn, tokenOut, amountIn);
            require(amountOut >= minAmountOut, "Slippage: output below minimum");
            require(IERC20(tokenOut).balanceOf(address(this)) >= amountOut, "Insufficient mock pool liquidity");
            IERC20(tokenOut).safeTransfer(receiver, amountOut);
        }

        emit PaymentProcessed(orderId, msg.sender, receiver, tokenIn, tokenOut, amountIn, amountOut);
    }
}