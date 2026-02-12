// abi.js - 合约配置文件
window.CONTRACT_CONFIG = {
    // 代币合约地址 (你的TMFS代币)
    tokenAddress: "0x...",
    
    // 销毁分红合约地址
    dividendAddress: "0x...",
    
    // 游戏合约地址 (部署后填写)
    gameAddress: "0x...",
    
    // 网络配置
    chainId: "0x38", // BSC主网
    chainName: "BSC Mainnet",
    rpcUrl: "https://bsc-dataseed.binance.org/",
    decimals: 18,
    
    // 代币合约ABI (标准ERC20 + 你的自定义函数)
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
    
    // 销毁分红合约ABI (按你的合约函数填写)
    dividendABI: [
        "function burn(uint256 amount)",
        "function claim()",
        "function check(address user) view returns (uint256)",
        "function points(address user) view returns (uint256)",
        "function claimed(address user) view returns (uint256)",
        "function totalBurned() view returns (uint256)",
        "function getTopBurners(uint256 count) view returns (address[] memory, uint256[] memory)",
        "function getUserRank(address user) view returns (uint256)",
        "event Burn(address indexed user, uint256 amount, uint256 points)",
        "event Claim(address indexed user, uint256 amount)"
    ],
    
    // 游戏合约ABI (部署后按实际函数填写)
    gameABI: [
        // 示例函数，按你的游戏合约实际ABI填写
        "function createRoom(uint256 stakeAmount) returns (uint256 roomId)",
        "function joinRoom(uint256 roomId)",
        "function playCards(uint256 roomId, uint8[] cardIndices, bytes signature)",
        "function skipTurn(uint256 roomId)",
        "function getGameInfo(uint256 roomId) view returns (tuple)",
        "function getPlayerHand(uint256 roomId, address player) view returns (uint8[])",
        "event GameStarted(uint256 indexed roomId, address indexed player)",
        "event CardsPlayed(uint256 indexed roomId, address indexed player, uint8[] cards)"
    ]
};
