// abi.js - 合约配置文件
window.CONTRACT_CONFIG = {
    // 代币合约地址 (TMFS)
    tokenAddress: "0x100a15501984B3Cf02F0403E4A187Db7b5bd7777",
    
    // 销毁分红合约地址 (TAMABurnPool)
    dividendAddress: "0x173aFcE472C4C8FF5aB16feFA9d80C4FFE617A20",
    
    // 游戏合约地址 (部署后填写)
    gameAddress: "",
    
    // 网络配置 (BSC主网)
    chainId: "0x38",
    chainName: "BSC Mainnet",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    decimals: 18,
    symbol: "TMFS",
    
    // 代币合约ABI (标准ERC20 + 你的代币功能)
    tokenABI: [
        "function balanceOf(address account) view returns (uint256)",
        "function decimals() view returns (uint8)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
        "function transfer(address recipient, uint256 amount) returns (bool)",
        "function symbol() view returns (string)",
        "function name() view returns (string)",
        "function totalSupply() view returns (uint256)",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)"
    ],

    // 销毁分红合约ABI (TAMABurnPool - 你部署的这个)
    dividendABI: [
        "function burn(uint256 amount) external",
        "function claim() external",
        "function processAndDistribute() external",
        "function pendingDividends(address user) view returns (uint256)",
        "function shares(address) view returns (uint256)",
        "function totalShares() view returns (uint256)",
        "function totalBurned() view returns (uint256)",
        "function totalDividendsDistributed() view returns (uint256)",
        "function dividendsPerShare() view returns (uint256)",
        "function payouts(address) view returns (int256)",
        "function token() view returns (address)",
        "function tokenSet() view returns (bool)",
        "function marketingWallet() view returns (address)",
        "function pendingBNB() view returns (uint256)",
        "event Burn(address indexed user, uint256 amount, uint256 totalShares)",
        "event Claim(address indexed user, uint256 bnbAmount)",
        "event TaxProcessed(uint256 marketingBNB, uint256 dividendBNB, uint256 totalBNBReceived)",
        "event DividendsDistributed(uint256 bnbAmount, uint256 shares)"
    ],

    // 游戏合约ABI (部署后填写)
    gameABI: []
};
