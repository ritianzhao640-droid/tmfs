// abi.js - 合约配置文件
window.CONTRACT_CONFIG = {
    // 代币合约地址 (TMFS)
    tokenAddress: "0x377e22651Ae3623aAC2724B0AA70E928FeAC7777",
    
    // 销毁分红合约地址 (TAMABurnPool)
    dividendAddress: "0xf61E6CCE31Ec6cfF95932a45837AB026ba61e4aB",
    
    // 游戏合约地址 (部署后填写)
    gameAddress: "",
    
    // 网络配置 (BSC主网)
    chainId: "0x38",
    chainName: "BSC Mainnet",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    decimals: 18,
    
    // 代币合约ABI (标准ERC20)
    tokenABI: [
        "function balanceOf(address) view returns (uint256)",
        "function approve(address,uint256) returns (bool)",
        "function allowance(address,address) view returns (uint256)",
        "function totalSupply() view returns (uint256)",
        "function transferFrom(address,address,uint256) returns (bool)",
        "function transfer(address,uint256) returns (bool)",
        "function decimals() view returns (uint8)",
        "function symbol() view returns (string)",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)"
    ],
    
    // 销毁分红合约ABI (TAMABurnPool)
    dividendABI: [
        // 读函数
        "function tamaToken() view returns (address)",
        "function wbnb() view returns (address)",
        "function totalBurned() view returns (uint256)",
        "function totalDividend() view returns (uint256)",
        "function totalClaimed() view returns (uint256)",
        "function dividendPerShare() view returns (uint256)",
        "function lastFundTime() view returns (uint256)",
        "function userBurned(address) view returns (uint256)",
        "function userClaimed(address) view returns (uint256)",
        "function userBurnHistory(address,uint256) view returns (uint256 amount, uint256 timestamp, uint256 dividendPerShareAtBurn)",
        "function claimable(address user) view returns (uint256)",
        "function getUserBurnCount(address user) view returns (uint256)",
        "function getUserInfo(address user) view returns (uint256 burned, uint256 claimed, uint256 claimableAmount, uint256 burnCount, uint256 lastBurnTime)",
        "function getPoolInfo() view returns (uint256 _totalBurned, uint256 _totalDividend, uint256 _totalClaimed, uint256 _remaining, uint256 _dividendPerShare)",
        "function remainingPool() view returns (uint256)",
        "function BURN_ADDRESS() view returns (address)",
        "function MIN_BURN_AMOUNT() view returns (uint256)",
        "function MIN_FUND_AMOUNT() view returns (uint256)",
        "function FUND_LOCK_PERIOD() view returns (uint256)",
        "function MAX_BURN_RECORDS() view returns (uint256)",
        
        // 写函数
        "function fundPool(uint256 amount)",
        "function recordBurn(uint256 amount)",
        "function claim()",
        
        // 事件
        "event BurnRecorded(address indexed user, uint256 amount, uint256 totalBurned, uint256 timestamp)",
        "event DividendClaimed(address indexed user, uint256 wbnbAmount)",
        "event PoolFunded(address indexed sender, uint256 amount, uint256 newDividendPerShare)"
    ],
    
    // 游戏合约ABI (部署后填写)
    gameABI: []
};
