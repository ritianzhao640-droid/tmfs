// ==================== 斗地主游戏逻辑 ====================

const Game = (function() {
    // 配置
    const CONFIG = window.CONTRACT_CONFIG || {};
    const CHAIN_ID = CONFIG.chainId || "0x38";
    
    // 全局变量
    let provider = null;
    let signer = null;
    let tokenContract = null;
    let gameContract = null;
    let userAddress = null;
    let tokenDecimals = CONFIG.decimals || 18;
    
    // 游戏状态
    const GameState = {
        IDLE: 'idle',
        DEALING: 'dealing',
        CALLING: 'calling',
        PLAYING: 'playing',
        ENDED: 'ended'
    };
    
    let currentGameState = GameState.IDLE;
    let countdownTimer = null;
    
    let gameData = {
        roomId: null,
        playerHand: [],
        selectedCards: [],
        lastPlayedCards: [],
        lastPlayedBy: null,
        currentTurn: null,
        landlord: null,
        aiLeftCards: 17,
        aiRightCards: 17,
        playerCards: 17,
        aiLeftHand: [],
        aiRightHand: [],
        potAmount: 100,
        multiplier: 1,
        canSkip: false,
        consecutivePasses: 0,
        lastCardType: null
    };

    // 牌型定义
    const CardType = {
        SINGLE: 'single',
        PAIR: 'pair',
        TRIPLE: 'triple',
        TRIPLE_WITH_SINGLE: 'triple_single',
        TRIPLE_WITH_PAIR: 'triple_pair',
        STRAIGHT: 'straight',
        DOUBLE_STRAIGHT: 'double_straight',
        TRIPLE_STRAIGHT: 'triple_straight',
        BOMB: 'bomb',
        ROCKET: 'rocket'
    };

    // ==================== 工具函数 ====================
    
    function showToast(message, isError = false) {
        const toast = document.getElementById('txToast');
        toast.textContent = message;
        toast.className = 'tx-toast ' + (isError ? 'error' : '') + ' show';
        setTimeout(() => toast.classList.remove('show'), 3000);
    }

    function updateStatus(text, countdown = null) {
        const statusBar = document.getElementById('gameStatusBar');
        if (countdown !== null) {
            statusBar.innerHTML = `${text}<span class="countdown">${countdown}s</span>`;
        } else {
            statusBar.textContent = text;
        }
    }

    // ==================== 初始化 ====================
    
    async function init() {
        if (!window.ethereum) {
            showToast('请安装 MetaMask！', true);
            return;
        }
        
        try {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            if (chainId !== CHAIN_ID) {
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: CHAIN_ID }]
                });
            }
            
            provider = new ethers.BrowserProvider(window.ethereum);
            await provider.send("eth_requestAccounts", []);
            signer = await provider.getSigner();
            userAddress = await signer.getAddress();
            
            if (CONFIG.tokenAddress) {
                tokenContract = new ethers.Contract(CONFIG.tokenAddress, CONFIG.tokenABI || [], signer);
            }
            if (CONFIG.gameAddress) {
                gameContract = new ethers.Contract(CONFIG.gameAddress, CONFIG.gameABI || [], signer);
            }
            
            console.log('游戏初始化完成，用户:', userAddress);
            
        } catch (error) {
            console.error('初始化失败:', error);
            showToast('连接钱包失败: ' + error.message, true);
        }
    }

    // ==================== 扑克牌系统 ====================
    
    function createDeck() {
        const suits = ['♠️', '♥️', '♣️', '♦️'];
        const ranks = [
            { rank: '3', value: 3 }, { rank: '4', value: 4 }, { rank: '5', value: 5 },
            { rank: '6', value: 6 }, { rank: '7', value: 7 }, { rank: '8', value: 8 },
            { rank: '9', value: 9 }, { rank: '10', value: 10 }, { rank: 'J', value: 11 },
            { rank: 'Q', value: 12 }, { rank: 'K', value: 13 }, { rank: 'A', value: 14 },
            { rank: '2', value: 15 }
        ];
        
        const deck = [];
        for (let suit of suits) {
            for (let r of ranks) {
                deck.push({
                    rank: r.rank,
                    suit: suit,
                    value: r.value,
                    id: r.rank + suit
                });
            }
        }
        
        deck.push({ rank: '小王', suit: '', value: 16, id: 'joker1' });
        deck.push({ rank: '大王', suit: '', value: 17, id: 'joker2' });
        
        return deck;
    }

    function shuffle(deck) {
        const shuffled = [...deck];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    // ==================== 牌型识别 ====================
    
    function identifyCardType(cards) {
        if (!cards || cards.length === 0) return null;
        
        const sorted = [...cards].sort((a, b) => a.value - b.value);
        const values = sorted.map(c => c.value);
        const len = sorted.length;
        
        // 王炸
        if (len === 2 && values.includes(16) && values.includes(17)) {
            return { type: CardType.ROCKET, value: 17, cards: sorted };
        }
        
        // 炸弹
        if (len === 4 && new Set(values).size === 1) {
            return { type: CardType.BOMB, value: values[0], cards: sorted };
        }
        
        // 单张
        if (len === 1) {
            return { type: CardType.SINGLE, value: values[0], cards: sorted };
        }
        
        // 对子
        if (len === 2 && values[0] === values[1]) {
            return { type: CardType.PAIR, value: values[0], cards: sorted };
        }
        
        // 三张
        if (len === 3 && values[0] === values[2]) {
            return { type: CardType.TRIPLE, value: values[0], cards: sorted };
        }
        
        // 三带一
        if (len === 4) {
            const counts = countValues(values);
            const entries = Object.entries(counts);
            if (entries.length === 2 && (entries[0][1] === 3 || entries[1][1] === 3)) {
                const tripleValue = entries.find(e => e[1] === 3)[0];
                return { type: CardType.TRIPLE_WITH_SINGLE, value: parseInt(tripleValue), cards: sorted };
            }
        }
        
        // 三带二
        if (len === 5) {
            const counts = countValues(values);
            const entries = Object.entries(counts);
            if (entries.length === 2 && entries[0][1] === 3 && entries[1][1] === 2) {
                return { type: CardType.TRIPLE_WITH_PAIR, value: parseInt(entries[0][0]), cards: sorted };
            }
            if (entries.length === 2 && entries[0][1] === 2 && entries[1][1] === 3) {
                return { type: CardType.TRIPLE_WITH_PAIR, value: parseInt(entries[1][0]), cards: sorted };
            }
        }
        
        // 顺子
        if (len >= 5) {
            const isStraight = checkStraight(values);
            if (isStraight) {
                return { type: CardType.STRAIGHT, value: values[0], cards: sorted, length: len };
            }
        }
        
        // 连对
        if (len >= 6 && len % 2 === 0) {
            const isDoubleStraight = checkDoubleStraight(values);
            if (isDoubleStraight) {
                return { type: CardType.DOUBLE_STRAIGHT, value: values[0], cards: sorted, length: len / 2 };
            }
        }
        
        return null;
    }

    function countValues(values) {
        const counts = {};
        for (let v of values) {
            counts[v] = (counts[v] || 0) + 1;
        }
        return counts;
    }

    function checkStraight(values) {
        if (values.some(v => v >= 15)) return false;
        for (let i = 1; i < values.length; i++) {
            if (values[i] !== values[i - 1] + 1) return false;
        }
        return true;
    }

    function checkDoubleStraight(values) {
        if (values.some(v => v >= 15)) return false;
        for (let i = 0; i < values.length; i += 2) {
            if (values[i] !== values[i + 1]) return false;
            if (i > 0 && values[i] !== values[i - 1] + 1) return false;
        }
        return true;
    }

    function canBeat(newType, lastType) {
        if (!lastType) return true;
        if (newType.type === CardType.ROCKET) return true;
        if (lastType.type === CardType.ROCKET) return false;
        if (newType.type === CardType.BOMB && lastType.type !== CardType.BOMB) return true;
        if (lastType.type === CardType.BOMB && newType.type !== CardType.BOMB) return false;
        if (newType.type !== lastType.type) return false;
        if (newType.cards.length !== lastType.cards.length) return false;
        return newType.value > lastType.value;
    }

    function getCardTypeName(cardType) {
        if (!cardType) return '';
        const names = {
            [CardType.SINGLE]: '单张',
            [CardType.PAIR]: '对子',
            [CardType.TRIPLE]: '三张',
            [CardType.TRIPLE_WITH_SINGLE]: '三带一',
            [CardType.TRIPLE_WITH_PAIR]: '三带二',
            [CardType.STRAIGHT]: '顺子',
            [CardType.DOUBLE_STRAIGHT]: '连对',
            [CardType.BOMB]: '炸弹',
            [CardType.ROCKET]: '王炸'
        };
        return names[cardType.type] || '';
    }

    // ==================== 游戏流程控制 ====================
    
    async function confirmStartGame() {
        const btn = document.getElementById('startGameConfirmBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading"></span> 准备中...';
        
        try {
            gameData.roomId = '001';
            gameData.potAmount = 100;
            
            document.getElementById('gameStartScreen').style.display = 'none';
            document.getElementById('gameRoomId').textContent = gameData.roomId;
            document.getElementById('gamePotAmount').textContent = gameData.potAmount;
            
            await startDealing();
            
        } catch (error) {
            showToast('开始游戏失败: ' + error.message, true);
            btn.disabled = false;
            btn.innerHTML = '开始对战';
        }
    }

    async function startDealing() {
        currentGameState = GameState.DEALING;
        updateStatus('正在发牌...');
        
        const deck = shuffle(createDeck());
        
        gameData.playerHand = deck.slice(0, 17);
        gameData.aiLeftHand = deck.slice(17, 34);
        game
