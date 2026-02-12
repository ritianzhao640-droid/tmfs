// ==================== 配置 ====================
const CONFIG = window.CONTRACT_CONFIG || {};
const TOKEN_ABI = CONFIG.tokenABI || [];
const GAME_ABI = CONFIG.gameABI || [];
const TOKEN_ADDRESS = CONFIG.tokenAddress;
const GAME_ADDRESS = CONFIG.gameAddress;
const CHAIN_ID = CONFIG.chainId || "0x38";

// ==================== 全局变量 ====================
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
        
        if (TOKEN_ADDRESS) {
            tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
        }
        if (GAME_ADDRESS) {
            gameContract = new ethers.Contract(GAME_ADDRESS, GAME_ABI, signer);
        }
        
        console.log('游戏页面已初始化，用户:', userAddress);
        
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
    
    // 顺子 (5张以上连续)
    if (len >= 5) {
        const isStraight = checkStraight(values);
        if (isStraight) {
            return { type: CardType.STRAIGHT, value: values[0], cards: sorted, length: len };
        }
    }
    
    // 连对 (3对以上连续对子)
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

// 比较牌型大小
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

// ==================== 游戏逻辑 ====================
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
    gameData.aiRightHand = deck.slice(34, 51);
    const landlordCards = deck.slice(51, 54);
    
    gameData.playerHand.sort((a, b) => a.value - b.value);
    gameData.aiLeftHand.sort((a, b) => a.value - b.value);
    gameData.aiRightHand.sort((a, b) => a.value - b.value);
    
    gameData.playerCards = 17;
    gameData.aiLeftCards = 17;
    gameData.aiRightCards = 17;
    gameData.landlordCards = landlordCards;
    
    await animateDealing();
    startCallingLandlord();
}

async function animateDealing() {
    const handArea = document.getElementById('handArea');
    handArea.innerHTML = '';
    
    for (let i = 0; i <= gameData.playerHand.length; i++) {
        setTimeout(() => {
            renderHand();
        }, i * 30);
    }
    
    await new Promise(r => setTimeout(r, 800));
}

function renderHand() {
    const handArea = document.getElementById('handArea');
    handArea.innerHTML = '';
    
    const totalCards = gameData.playerHand.length;
    const cardWidth = 48;
    const overlap = Math.min(32, (window.innerWidth - 60 - cardWidth) / (totalCards - 1));
    const totalWidth = cardWidth + (totalCards - 1) * overlap;
    const startX = (handArea.offsetWidth - totalWidth) / 2;
    
    gameData.playerHand.forEach((card, index) => {
        const cardEl = document.createElement('div');
        cardEl.className = 'hand-card';
        if (card.suit === '♥️' || card.suit === '♦️') {
            cardEl.classList.add('card-red');
        } else {
            cardEl.classList.add('card-black');
        }
        
        if (gameData.selectedCards.includes(index)) {
            cardEl.classList.add('selected');
        }
        
        cardEl.innerHTML = `<div>${card.rank}</div><div style="font-size: 16px;">${card.suit}</div>`;
        cardEl.style.left = Math.max(5, startX + index * overlap) + 'px';
        cardEl.style.zIndex = index;
        cardEl.onclick = () => toggleCardSelection(index);
        
        handArea.appendChild(cardEl);
    });
}

function toggleCardSelection(index) {
    const idx = gameData.selectedCards.indexOf(index);
    if (idx > -1) {
        gameData.selectedCards.splice(idx, 1);
    } else {
        gameData.selectedCards.push(index);
        gameData.selectedCards.sort((a, b) => a - b);
    }
    renderHand();
    updatePlayButton();
}

function startCallingLandlord() {
    currentGameState = GameState.CALLING;
    updateStatus('请选择是否叫地主');
    document.getElementById('landlordCards').classList.add('show');
    
    const controls = document.getElementById('gameControls');
    controls.innerHTML = `
        <button class="game-btn btn-secondary" onclick="passLandlord()">不叫</button>
        <button class="game-btn btn-primary" onclick="callLandlord()">叫地主</button>
    `;
}

function passLandlord() {
    updateStatus('AI正在决定是否叫地主...');
    document.getElementById('gameControls').innerHTML = '';
    
    setTimeout(() => {
        const aiLeftStrength = calculateHandStrength(gameData.aiLeftHand);
        const aiRightStrength = calculateHandStrength(gameData.aiRightHand);
        
        if (aiLeftStrength > 35) {
            gameData.landlord = 'aiLeft';
            aiBecomeLandlord('aiLeft');
        } else if (aiRightStrength > 35) {
            gameData.landlord = 'aiRight';
            aiBecomeLandlord('aiRight');
        } else {
            gameData.landlord = 'player';
            becomeLandlord();
        }
    }, 1500);
}

function callLandlord() {
    gameData.landlord = 'player';
    becomeLandlord();
}

function calculateHandStrength(hand) {
    let strength = 0;
    const counts = {};
    
    for (let card of hand) {
        counts[card.value] = (counts[card.value] || 0) + 1;
        if (card.value >= 15) strength += 5;
        else if (card.value >= 10) strength += 2;
        else strength += 1;
    }
    
    for (let count of Object.values(counts)) {
        if (count === 4) strength += 10;
    }
    
    return strength;
}

function becomeLandlord() {
    updateStatus('你是地主！获得3张底牌');
    document.getElementById('landlordCards').classList.remove('show');
    
    gameData.playerHand.push(...gameData.landlordCards);
    gameData.playerHand.sort((a, b) => a.value - b.value);
    gameData.playerCards = 20;
    
    renderHand();
    
    const landlordArea = document.getElementById('landlordCards');
    landlordArea.innerHTML = gameData.landlordCards.map(c => 
        `<div class="landlord-card">${c.rank}${c.suit}</div>`
    ).join('');
    landlordArea.classList.add('show');
    
    setTimeout(() => startPlaying('player'), 1500);
}

function aiBecomeLandlord(ai) {
    const aiName = ai === 'aiLeft' ? 'AI-李白' : 'AI-杜甫';
    updateStatus(`${aiName} 成为地主`);
    
    document.getElementById(ai === 'aiLeft' ? 'aiLeftAvatar' : 'aiRightAvatar').classList.add('landlord');
    
    if (ai === 'aiLeft') {
        gameData.aiLeftHand.push(...gameData.landlordCards);
        gameData.aiLeftHand.sort((a, b) => a.value - b.value);
        gameData.aiLeftCards = 20;
    } else {
        gameData.aiRightHand.push(...gameData.landlordCards);
        gameData.aiRightHand.sort((a, b) => a.value - b.value);
        gameData.aiRightCards = 20;
    }
    
    document.getElementById(ai === 'aiLeft' ? 'aiLeftCount' : 'aiRightCount').textContent = '20张';
    
    const landlordArea = document.getElementById('landlordCards');
    landlordArea.innerHTML = '<div class="landlord-card">?</div><div class="landlord-card">?</div><div class="landlord-card">?</div>';
    landlordArea.classList.add('show');
    
    setTimeout(() => startPlaying(ai), 1500);
}

function startPlaying(firstPlayer) {
    currentGameState = GameState.PLAYING;
    gameData.currentTurn = firstPlayer;
    gameData.lastPlayedCards = [];
    gameData.lastPlayedBy = null;
    gameData.canSkip = false;
    gameData.consecutivePasses = 0;
    gameData.lastCardType = null;
    
    updateTurn();
}

function updateTurn() {
    clearInterval(countdownTimer);
    
    document.getElementById('aiLeftAvatar').classList.remove('active');
    document.getElementById('aiRightAvatar').classList.remove('active');
    document.getElementById('aiLeftStatus').textContent = '';
    document.getElementById('aiRightStatus').textContent = '';
    document.getElementById('hintBtn').style.display = 'none';
    
    document.getElementById('aiLeftPlayed').classList.remove('show');
    document.getElementById('aiRightPlayed').classList.remove('show');
    
    if (gameData.currentTurn === 'player') {
        startPlayerTurn();
    } else if (gameData.currentTurn === 'aiLeft') {
        startAITurn('aiLeft');
    } else {
        startAITurn('aiRight');
    }
}

function startPlayerTurn() {
    let timeLeft = 30;
    updateStatus(gameData.canSkip ? '请出牌（可选择跳过）' : '请出牌', timeLeft);
    document.getElementById('hintBtn').style.display = 'inline-block';
    
    const controls = document.getElementById('gameControls');
    
    if (gameData.canSkip) {
        controls.innerHTML = `
            <button class="game-btn btn-secondary" onclick="playerPass()">跳过</button>
            <button class="game-btn btn-primary" id="playBtn" onclick="playerPlayCards()" disabled>出牌</button>
        `;
    } else {
        controls.innerHTML = `
            <button class="game-btn btn-primary" id="playBtn" onclick="playerPlayCards()" disabled>出牌</button>
        `;
    }
    
    updatePlayButton();
    
    countdownTimer = setInterval(() => {
        timeLeft--;
        updateStatus(gameData.canSkip ? '请出牌（可选择跳过）' : '请出牌', timeLeft);
        
        if (timeLeft <= 0) {
            clearInterval(countdownTimer);
            if (gameData.canSkip) {
                playerPass();
            } else {
                autoPlaySmallest();
            }
        }
    }, 1000);
}

function autoPlaySmallest() {
    gameData.selectedCards = [0];
    renderHand();
    playerPlayCards();
}

function startAITurn(ai) {
    document.getElementById(ai === 'aiLeft' ? 'aiLeftAvatar' : 'aiRightAvatar').classList.add('active');
    document.getElementById(ai === 'aiLeft' ? 'aiLeftStatus' : 'aiRightStatus').textContent = '思考中...';
    
    setTimeout(() => aiDecideAndPlay(ai), 1500);
}

function aiDecideAndPlay(ai) {
    const hand = ai === 'aiLeft' ? gameData.aiLeftHand : gameData.aiRightHand;
    
    let playCards = null;
    
    if (!gameData.lastCardType || gameData.consecutivePasses >= 2) {
        playCards = findSmallestPlay(hand);
    } else {
        playCards = findCardsToBeat(hand, gameData.lastCardType);
    }
    
    if (playCards) {
        const cardIds = playCards.map(c => c.id);
        
        if (ai === 'aiLeft') {
            gameData.aiLeftHand = gameData.aiLeftHand.filter(c => !cardIds.includes(c.id));
            gameData.aiLeftCards = gameData.aiLeftHand.length;
            document.getElementById('aiLeftCount').textContent = gameData.aiLeftCards + '张';
        } else {
            gameData.aiRightHand = gameData.aiRightHand.filter(c => !cardIds.includes(c.id));
            gameData.aiRightCards = gameData.aiRightHand.length;
            document.getElementById('aiRightCount').textContent = gameData.aiRightCards + '张';
        }
        
        showAIPlayedCards(ai, playCards);
        
        const cardType = identifyCardType(playCards);
        
        if (cardType.type === CardType.BOMB || cardType.type === CardType.ROCKET) {
            gameData.multiplier *= 2;
            document.getElementById('gameMultiplier').textContent = gameData.multiplier;
            showToast('炸弹！倍数翻倍');
        }
        
        if ((ai === 'aiLeft' ? gameData.aiLeftCards : gameData.aiRightCards) === 0) {
            endGame(ai);
            return;
        }
        
        nextTurn(ai, playCards, cardType);
    } else {
        document.getElementById(ai === 'aiLeft' ? 'aiLeftStatus' : 'aiRightStatus').textContent = '要不起';
        setTimeout(() => nextTurn(ai, null, null), 1000);
    }
}

function findSmallestPlay(hand) {
    return [hand[0]];
}

function findCardsToBeat(hand, lastType) {
    if (lastType.type !== CardType.BOMB && lastType.type !== CardType.ROCKET) {
        const bomb = findBomb(hand);
        if (bomb) return bomb;
    }
    
    switch (lastType.type) {
        case CardType.SINGLE:
            return findSingle(hand, lastType.value);
        case CardType.PAIR:
            return findPair(hand, lastType.value);
        case CardType.TRIPLE:
            return findTriple(hand, lastType.value);
        case CardType.BOMB:
            return findBomb(hand, lastType.value);
        default:
            return null;
    }
}

function findSingle(hand, minValue) {
    for (let card of hand) {
        if (card.value > minValue) return [card];
    }
    return null;
}

function findPair(hand, minValue) {
    const counts = {};
    for (let card of hand) {
        counts[card.value] = (counts[card.value] || 0) + 1;
    }
    for (let value in counts) {
        if (counts[value] >= 2 && parseInt(value) > minValue) {
            return hand.filter(c => c.value == value).slice(0, 2);
        }
    }
    return null;
}

function findTriple(hand, minValue) {
    const counts = {};
    for (let card of hand) {
        counts[card.value] = (counts[card.value] || 0) + 1;
    }
    for (let value in counts) {
        if (counts[value] >= 3 && parseInt(value) > minValue) {
            return hand.filter(c => c.value == value).slice(0, 3);
        }
    }
    return null;
}

function findBomb(hand, minValue = 0) {
    const counts = {};
    for (let card of hand) {
        counts[card.value] = (counts[card.value] || 0) + 1;
    }
    for (let value in counts) {
        if (counts[value] === 4 && parseInt(value) > minValue) {
            return hand.filter(c => c.value == value);
        }
    }
    return null;
}

function showAIPlayedCards(ai, cards) {
    const container = document.getElementById(ai === 'aiLeft' ? 'aiLeftPlayed' : 'aiRightPlayed');
    container.innerHTML = cards.map(card => {
        const isRed = card.suit === '♥️' || card.suit === '♦️';
        return `<div class="ai-card-mini ${isRed ? 'card-red' : 'card-black'}">${card.rank}</div>`;
    }).join('');
    container.classList.add('show');
}

function updatePlayButton() {
    const playBtn = document.getElementById('playBtn');
    if (!playBtn) return;
    
    const selectedCards = gameData.selectedCards.map(i => gameData.playerHand[i]);
    const cardType = identifyCardType(selectedCards);
    
    let canPlay = false;
    if (cardType) {
        canPlay = canBeat(cardType, gameData.lastCardType);
    }
    
    playBtn.disabled = !canPlay;
}

function playerPlayCards() {
    clearInterval(countdownTimer);
    
    const indices = gameData.selectedCards.sort((a, b) => b - a);
    const playedCards = indices.map(i => gameData.playerHand[i]);
    
    for (let idx of indices) {
        gameData.playerHand.splice(idx, 1);
    }
    
    gameData.playerCards = gameData.playerHand.length;
    gameData.selectedCards = [];
    
    showPlayedCards(playedCards, '你');
    renderHand();
    
    const cardType = identifyCardType(playedCards);
    
    if (cardType.type === CardType.BOMB || cardType.type === CardType.ROCKET) {
        gameData.multiplier *= 2;
        document.getElementById('gameMultiplier').textContent = gameData.multiplier;
        showToast('炸弹！倍数翻倍');
    }
    
    if (gameData.playerCards === 0) {
        endGame('player');
        return;
    }
    
    nextTurn('player', playedCards, cardType);
}

function playerPass() {
    clearInterval(countdownTimer);
    
    if (!gameData.canSkip) {
        showToast('上家出牌后必须管上，不能跳过', true);
        return;
    }
    
    showToast('你选择了跳过', false);
    gameData.selectedCards = [];
    renderHand();
    nextTurn('player', null, null);
}

function showHint() {
    const hand = gameData.playerHand;
    let hintCards = null;
    
    if (!gameData.lastCardType) {
        hintCards = [0];
    } else {
        for (let i = 0; i < hand.length; i++) {
            for (let j = i; j < hand.length; j++) {
                const testCards = [];
                for (let k = i; k <= j; k++) testCards.push(hand[k]);
                
                const cardType = identifyCardType(testCards);
                if (cardType && canBeat(cardType, gameData.lastCardType)) {
                    hintCards = [];
                    for (let k = i; k <= j; k++) hintCards.push(k);
                    break;
                }
            }
            if (hintCards) break;
        }
    }
    
    if (hintCards) {
        gameData.selectedCards = hintCards;
        renderHand();
        updatePlayButton();
    } else {
        showToast('没有能管上的牌，建议跳过', true);
    }
}

function showPlayedCards(cards, who) {
    const container = document.getElementById('cardsOnTable');
    const info = document.getElementById('lastPlayInfo');
    
    info.textContent = who + '出了';
    
    const cardType = identifyCardType(cards);
    const typeName = getCardTypeName(cardType);
    
    container.innerHTML = cards.map(card => {
        const isRed = card.suit === '♥️' || card.suit === '♦️';
        return `
            <div class="card-played ${isRed ? 'card-red' : 'card-black'}">
                <div>${card.rank}</div>
                <div style="font-size: 16px;">${card.suit}</div>
            </div>
        `;
    }).join('') + `<div class="card-type-hint">${typeName}</div>`;
    
    gameData.lastPlayedCards = cards;
    gameData.lastPlayedBy = who === '你' ? 'player' : who;
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

function nextTurn(current, playedCards, cardType) {
    const order = ['player', 'aiLeft', 'aiRight'];
    const currentIdx = order.indexOf(current);
    const nextIdx = (currentIdx + 1) % 3;
    const nextPlayer = order[nextIdx];
    
    if (playedCards && playedCards.length > 0) {
        gameData.consecutivePasses = 0;
        gameData.canSkip = false;
        gameData.lastCardType = cardType;
    } else {
        gameData.consecutivePasses++;
        gameData.canSkip = true;
    }
    
    if (gameData.consecutivePasses >= 2) {
        document.getElementById('cardsOnTable').innerHTML = '';
        document.getElementById('lastPlayInfo').textContent = '新一轮开始';
        gameData.lastPlayedCards = [];
        gameData.lastPlayedBy = null;
        gameData.lastCardType = null;
        gameData.consecutivePasses = 0;
        gameData.canSkip = false;
    }
    
    gameData.currentTurn = nextPlayer;
    updateTurn();
}

function updateStatus(text, countdown = null) {
    const statusBar = document.getElementById('gameStatusBar');
    if (countdown !== null) {
        statusBar.innerHTML = `${text}<span class="countdown">${countdown}s</span>`;
    } else {
        statusBar.textContent = text;
    }
}

function endGame(winner) {
    currentGameState = GameState.ENDED;
    clearInterval(countdownTimer);
    
    const modal = document.getElementById('gameResultModal');
    const icon = document.getElementById('resultIcon');
    const title = document.getElementById('resultTitle');
    const detail = document.getElementById('resultDetail');
    const amount = document.getElementById('resultAmount');
    
    const isPlayerLandlord = gameData.landlord === 'player';
    const isPlayerWin = winner === 'player';
    const isSpring = checkSpring(winner);
    
    if (isPlayerWin) {
        icon.textContent = '🏆';
        title.textContent = '你赢了！';
        detail.textContent = (isPlayerLandlord ? '地主' : '农民') + '胜利' + (isSpring ? ' (春天)' : '');
        
        let reward = gameData.potAmount * gameData.multiplier;
        if (isSpring) reward *= 2;
        if (!isPlayerLandlord) reward = Math.floor(reward / 2);
        
        amount.textContent = '+' + reward + ' TMFS';
        amount.className = 'result-amount';
    } else {
        icon.textContent = '💔';
        title.textContent = '你输了';
        detail.textContent = (isPlayerLandlord ? '地主' : '农民') + '失败';
        
        let loss = gameData.potAmount * gameData.multiplier;
        if (!isPlayerLandlord) loss = Math.floor(loss / 2);
        
        amount.textContent = '-' + loss + ' TMFS';
        amount.className = 'result-amount lose';
    }
    
    modal.classList.add('show');
}

function checkSpring(winner) {
    return false;
}

function playAgain() {
    document.getElementById('gameResultModal').classList.remove('show');
    resetGame();
    document.getElementById('gameStartScreen').style.display = 'flex';
}

function resetGame() {
    currentGameState = GameState.IDLE;
    clearInterval(countdownTimer);
    
    gameData = {
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
    
    document.getElementById('handArea').innerHTML = '';
    document.getElementById('cardsOnTable').innerHTML = '';
    document.getElementById('gameControls').innerHTML = '';
    document.getElementById('landlordCards').classList.remove('show');
    document.getElementById('landlordCards').innerHTML = '<div class="landlord-card">?</div><div class="landlord-card">?</div><div class="landlord-card">?</div>';
    document.getElementById('lastPlayInfo').textContent = '等待游戏开始...';
    updateStatus('点击"开始对战"进入游戏');
    document.getElementById('gameRoomId').textContent = '---';
    document.getElementById('gamePotAmount').textContent = '0';
    document.getElementById('gameMultiplier').textContent = '1';
    document.getElementById('hintBtn').style.display = 'none';
    
    document.getElementById('aiLeftAvatar').classList.remove('active', 'landlord');
    document.getElementById('aiRightAvatar').classList.remove('active', 'landlord');
    document.getElementById('aiLeftCount').textContent = '17张';
    document.getElementById('aiRightCount').textContent = '17张';
    document.getElementById('aiLeftStatus').textContent = '';
    document.getElementById('aiRightStatus').textContent = '';
    document.getElementById('aiLeftPlayed').classList.remove('show');
    document.getElementById('aiRightPlayed').classList.remove('show');
    
    document.getElementById('startGameConfirmBtn').disabled = false;
    document.getElementById('startGameConfirmBtn').innerHTML = '开始对战';
}

// 页面加载初始化
window.addEventListener('load', init);
