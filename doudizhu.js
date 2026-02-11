/**
 * 踏马封神斗地主 - 完整游戏逻辑引擎
 * 包含：严格牌型判断、AI算法、出牌验证、记牌器
 */

(function() {
    'use strict';

    // ==================== 常量定义 ====================
    const CARD_VALUES = {
        '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
        'J': 11, 'Q': 12, 'K': 13, 'A': 14, '2': 15,
        '小王': 16, '大王': 17
    };

    const CARD_TYPE = {
        INVALID: 0,           // 无效
        SINGLE: 1,            // 单张
        PAIR: 2,              // 对子
        TRIPLE: 3,            // 三张
        TRIPLE_SINGLE: 4,     // 三带一
        TRIPLE_PAIR: 5,       // 三带二
        STRAIGHT: 6,          // 顺子（5张及以上）
        STRAIGHT_PAIR: 7,     // 连对（3对及以上）
        PLANE: 8,             // 飞机（连续三张）
        PLANE_SINGLE: 9,      // 飞机带单
        PLANE_PAIR: 10,       // 飞机带对
        FOUR_SINGLE: 11,      // 四带二单
        FOUR_PAIR: 12,        // 四带二对
        BOMB: 13,             // 炸弹
        ROCKET: 14            // 王炸
    };

    const TYPE_NAMES = {
        [CARD_TYPE.SINGLE]: '单张',
        [CARD_TYPE.PAIR]: '对子',
        [CARD_TYPE.TRIPLE]: '三张',
        [CARD_TYPE.TRIPLE_SINGLE]: '三带一',
        [CARD_TYPE.TRIPLE_PAIR]: '三带二',
        [CARD_TYPE.STRAIGHT]: '顺子',
        [CARD_TYPE.STRAIGHT_PAIR]: '连对',
        [CARD_TYPE.PLANE]: '飞机',
        [CARD_TYPE.PLANE_SINGLE]: '飞机带单',
        [CARD_TYPE.PLANE_PAIR]: '飞机带对',
        [CARD_TYPE.FOUR_SINGLE]: '四带二',
        [CARD_TYPE.FOUR_PAIR]: '四带二对',
        [CARD_TYPE.BOMB]: '炸弹',
        [CARD_TYPE.ROCKET]: '王炸'
    };

    // ==================== 工具函数 ====================
    function sortCards(cards) {
        return cards.sort((a, b) => CARD_VALUES[b.value] - CARD_VALUES[a.value]);
    }

    function getCardValue(card) {
        return CARD_VALUES[card.value] || 0;
    }

    function isContinuous(values) {
        if (values.length < 2) return true;
        for (let i = 1; i < values.length; i++) {
            if (values[i-1] - values[i] !== 1) return false;
        }
        return true;
    }

    // ==================== 牌组分析类 ====================
    class CardGroup {
        constructor(cards) {
            this.cards = sortCards([...cards]);
            this.type = CARD_TYPE.INVALID;
            this.mainValue = 0;      // 主牌值（用于比较大小）
            this.subValues = [];     // 副牌值（如带的牌）
            this.analyze();
        }

        analyze() {
            const len = this.cards.length;
            if (len === 0) return;

            // 王炸判断
            if (len === 2 && 
                this.cards[0].value === '大王' && 
                this.cards[1].value === '小王') {
                this.type = CARD_TYPE.ROCKET;
                this.mainValue = 17;
                return;
            }

            // 统计牌面出现次数
            const countMap = new Map();
            this.cards.forEach(card => {
                const val = getCardValue(card);
                countMap.set(val, (countMap.get(val) || 0) + 1);
            });

            const counts = Array.from(countMap.entries()).sort((a, b) => b[0] - a[0]);
            const countValues = counts.map(c => c[1]).sort((a, b) => b - a);
            const uniqueValues = counts.map(c => c[0]).sort((a, b) => b - a);

            // 单张
            if (len === 1) {
                this.type = CARD_TYPE.SINGLE;
                this.mainValue = uniqueValues[0];
                return;
            }

            // 对子
            if (len === 2 && countValues[0] === 2) {
                this.type = CARD_TYPE.PAIR;
                this.mainValue = uniqueValues[0];
                return;
            }

            // 三张
            if (len === 3 && countValues[0] === 3) {
                this.type = CARD_TYPE.TRIPLE;
                this.mainValue = uniqueValues[0];
                return;
            }

            // 三带一
            if (len === 4 && countValues[0] === 3 && countValues[1] === 1) {
                this.type = CARD_TYPE.TRIPLE_SINGLE;
                this.mainValue = counts.find(c => c[1] === 3)[0];
                return;
            }

            // 三带二
            if (len === 5 && countValues[0] === 3 && countValues[1] === 2) {
                this.type = CARD_TYPE.TRIPLE_PAIR;
                this.mainValue = counts.find(c => c[1] === 3)[0];
                return;
            }

            // 炸弹
            if (len === 4 && countValues[0] === 4) {
                this.type = CARD_TYPE.BOMB;
                this.mainValue = uniqueValues[0];
                return;
            }

            // 顺子（5张及以上，不能有2、王）
            if (len >= 5 && countValues.every(c => c === 1) && 
                uniqueValues[0] <= 14 && uniqueValues[uniqueValues.length - 1] >= 3) {
                if (isContinuous(uniqueValues)) {
                    this.type = CARD_TYPE.STRAIGHT;
                    this.mainValue = uniqueValues[0]; // 最大牌
                    return;
                }
            }

            // 连对（3对及以上，不能有2、王）
            if (len >= 6 && len % 2 === 0 && countValues.every(c => c === 2)) {
                const pairValues = uniqueValues.filter(v => v <= 14);
                if (pairValues.length >= 3 && isContinuous(pairValues)) {
                    this.type = CARD_TYPE.STRAIGHT_PAIR;
                    this.mainValue = pairValues[0];
                    return;
                }
            }

            // 飞机（连续三张，至少2连）
            const triples = counts.filter(c => c[1] === 3).map(c => c[0]).sort((a, b) => b - a);
            if (triples.length >= 2 && triples[0] <= 14) {
                // 检查连续性
                let maxSeq = 1;
                let currSeq = 1;
                let maxSeqStart = triples[0];
                
                for (let i = 1; i < triples.length; i++) {
                    if (triples[i-1] - triples[i] === 1) {
                        currSeq++;
                        if (currSeq > maxSeq) {
                            maxSeq = currSeq;
                            maxSeqStart = triples[i - maxSeq + 1];
                        }
                    } else {
                        currSeq = 1;
                    }
                }

                if (maxSeq >= 2) {
                    const mainCards = triples.slice(triples.indexOf(maxSeqStart), triples.indexOf(maxSeqStart) + maxSeq);
                    const otherCards = counts.filter(c => !mainCards.includes(c[0]));
                    const otherCount = otherCards.reduce((sum, c) => sum + c[1], 0);
                    const wingCount = maxSeq * (len - maxSeq * 3);

                    // 纯飞机
                    if (len === maxSeq * 3) {
                        this.type = CARD_TYPE.PLANE;
                        this.mainValue = maxSeqStart;
                        return;
                    }

                    // 飞机带单
                    if (len === maxSeq * 4 && otherCount === maxSeq && otherCards.every(c => c[1] === 1)) {
                        this.type = CARD_TYPE.PLANE_SINGLE;
                        this.mainValue = maxSeqStart;
                        return;
                    }

                    // 飞机带对
                    if (len === maxSeq * 5 && otherCount === maxSeq * 2 && otherCards.every(c => c[1] === 2)) {
                        this.type = CARD_TYPE.PLANE_PAIR;
                        this.mainValue = maxSeqStart;
                        return;
                    }
                }
            }

            // 四带二
            if (len === 6 && countValues[0] === 4 && countValues.slice(1).every(c => c === 1)) {
                this.type = CARD_TYPE.FOUR_SINGLE;
                this.mainValue = counts.find(c => c[1] === 4)[0];
                return;
            }

            if (len === 8 && countValues[0] === 4 && countValues.slice(1).every(c => c === 2)) {
                this.type = CARD_TYPE.FOUR_PAIR;
                this.mainValue = counts.find(c => c[1] === 4)[0];
                return;
            }
        }

        // 比较大小
        canBeat(other) {
            if (this.type === CARD_TYPE.INVALID) return false;
            if (other.type === CARD_TYPE.ROCKET) return false;
            if (this.type === CARD_TYPE.ROCKET) return true;
            if (this.type === CARD_TYPE.BOMB && other.type !== CARD_TYPE.BOMB) return true;
            if (other.type === CARD_TYPE.BOMB && this.type !== CARD_TYPE.BOMB) return false;
            
            // 同类型比较
            if (this.type === other.type && this.cards.length === other.cards.length) {
                return this.mainValue > other.mainValue;
            }
            
            return false;
        }

        getTypeName() {
            return TYPE_NAMES[this.type] || '无效';
        }
    }

    // ==================== AI 算法类 ====================
    class DouDiZhuAI {
        constructor(name, isLandlord) {
            this.name = name;
            this.isLandlord = isLandlord;
            this.handCards = [];
            this.memory = new Set(); // 记牌器（记录已出的牌）
            this.riskLevel = 0.5; // 风险偏好 0-1
        }

        setHandCards(cards) {
            this.handCards = sortCards(cards);
        }

        // 更新记牌器
        updateMemory(playedCards) {
            playedCards.forEach(card => {
                this.memory.add(`${card.suit}-${card.value}`);
            });
        }

        // 评估手牌价值（越低越好）
        evaluateHand() {
            let score = this.handCards.length * 10;
            
            // 有炸弹加分（好事）
            const groups = this.groupByValue();
            groups.forEach((cards, val) => {
                if (cards.length === 4) score -= 50;
                if (cards.length === 2 && val >= 15) score -= 20; // 对2
            });

            // 有王炸
            if (this.hasRocket()) score -= 100;

            return score;
        }

        groupByValue() {
            const map = new Map();
            this.handCards.forEach(card => {
                const val = getCardValue(card);
                if (!map.has(val)) map.set(val, []);
                map.get(val).push(card);
            });
            return map;
        }

        hasRocket() {
            return this.handCards.some(c => c.value === '小王') && 
                   this.handCards.some(c => c.value === '大王');
        }

        // 找出所有可能的出牌组合
        findAllValidGroups() {
            const groups = [];
            const valueMap = this.groupByValue();

            // 单张
            this.handCards.forEach((card, idx) => {
                groups.push({
                    type: CARD_TYPE.SINGLE,
                    cards: [card],
                    indices: [idx],
                    value: getCardValue(card)
                });
            });

            // 对子、三张、炸弹
            valueMap.forEach((cards, val) => {
                const indices = cards.map(c => this.handCards.indexOf(c));
                
                if (cards.length >= 2) {
                    groups.push({ type: CARD_TYPE.PAIR, cards: cards.slice(0,2), indices: indices.slice(0,2), value: val });
                }
                if (cards.length >= 3) {
                    groups.push({ type: CARD_TYPE.TRIPLE, cards: cards.slice(0,3), indices: indices.slice(0,3), value: val });
                }
                if (cards.length === 4) {
                    groups.push({ type: CARD_TYPE.BOMB, cards: cards, indices: indices, value: val });
                }
            });

            // 王炸
            if (this.hasRocket()) {
                const rocket = this.handCards.filter(c => c.value === '小王' || c.value === '大王');
                groups.push({ type: CARD_TYPE.ROCKET, cards: rocket, indices: [0,1], value: 17 });
            }

            // 顺子（简化版：只找5-12张的顺子）
            const singleValues = Array.from(valueMap.keys()).filter(v => v <= 14).sort((a,b) => b-a);
            for (let len = 5; len <= 12; len++) {
                for (let i = 0; i <= singleValues.length - len; i++) {
                    const seq = singleValues.slice(i, i + len);
                    if (isContinuous(seq)) {
                        const cards = seq.flatMap(v => valueMap.get(v).slice(0,1));
                        const indices = cards.map(c => this.handCards.indexOf(c));
                        groups.push({ type: CARD_TYPE.STRAIGHT, cards, indices, value: seq[0] });
                    }
                }
            }

            return groups;
        }

        // AI决策：主动出牌
        playInitiative() {
            // 如果手牌很少，尽量出完
            if (this.handCards.length <= 2) {
                const group = this.findAllValidGroups()[0];
                return group || null;
            }

            const groups = this.findAllValidGroups();
            
            // 优先出非炸弹的牌
            const nonBomb = groups.filter(g => g.type !== CARD_TYPE.BOMB && g.type !== CARD_TYPE.ROCKET);
            if (nonBomb.length > 0) {
                // 优先出顺子、连对等大牌型
                const bigTypes = nonBomb.filter(g => 
                    g.type === CARD_TYPE.STRAIGHT || 
                    g.type === CARD_TYPE.STRAIGHT_PAIR ||
                    g.type === CARD_TYPE.PLANE
                );
                if (bigTypes.length > 0) return bigTypes[0];
                
                // 其次出小牌
                return nonBomb[nonBomb.length - 1];
            }

            // 不得已出炸弹
            const bombs = groups.filter(g => g.type === CARD_TYPE.BOMB || g.type === CARD_TYPE.ROCKET);
            return bombs[0] || null;
        }

        // AI决策：跟牌
        playFollow(lastGroup) {
            if (!lastGroup || lastGroup.type === CARD_TYPE.INVALID) return null;

            const groups = this.findAllValidGroups();
            
            // 找能大过的牌
            const candidates = groups.filter(g => {
                const tempGroup = new CardGroup(g.cards);
                return tempGroup.canBeat(lastGroup);
            });

            if (candidates.length === 0) return null;

            // 策略选择
            if (this.handCards.length <= 3) {
                // 快赢了，随便出
                return candidates[0];
            }

            // 避开炸弹，除非必要
            const nonBomb = candidates.filter(g => g.type !== CARD_TYPE.BOMB && g.type !== CARD_TYPE.ROCKET);
            if (nonBomb.length > 0) {
                // 选择刚好能大过的最小牌
                return nonBomb[nonBomb.length - 1];
            }

            // 必须使用炸弹时，评估风险
            if (lastGroup.type === CARD_TYPE.BOMB || this.riskLevel > 0.7) {
                return candidates[0];
            }

            return null; // 选择不出
        }

        // 叫地主决策（简单版）
        shouldCallLandlord() {
            const score = this.evaluateHand();
            return score < 50; // 手牌好就叫
        }

        // 移除出的牌
        removeCards(indices) {
            // 从大到小排序索引，避免删除后索引错乱
            const sortedIndices = [...indices].sort((a, b) => b - a);
            sortedIndices.forEach(idx => {
                this.handCards.splice(idx, 1);
            });
        }
    }

    // ==================== 主游戏类 ====================
    class DouDiZhu {
        constructor(config) {
            this.config = config || {};
            this.state = 'idle'; // idle, dealing, calling, playing, ended
            this.players = {
                player: { hand: [], isLandlord: false },
                ai1: new DouDiZhuAI(config.aiPlayers ? config.aiPlayers[0] : 'AI-1', false),
                ai2: new DouDiZhuAI(config.aiPlayers ? config.aiPlayers[1] : 'AI-2', false)
            };
            this.landlord = null;
            this.currentTurn = null;
            this.lastPlayed = null; // 上次出的牌组
            this.lastPlayer = null; // 上次出牌的人
            this.deck = [];
            this.callbacks = {
                onStateChange: config.onStateChange || (() => {}),
                onCardPlay: config.onCardPlay || (() => {}),
                onTurnChange: config.onTurnChange || (() => {}),
                onGameEnd: config.onGameEnd || (() => {})
            };
            
            this.initDeck();
        }

        initDeck() {
            const suits = ['spade', 'heart', 'club', 'diamond'];
            const values = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
            
            this.deck = [];
            // 生成52张牌
            for (let suit of suits) {
                for (let value of values) {
                    this.deck.push({
                        suit,
                        value,
                        display: value,
                        color: (suit === 'heart' || suit === 'diamond') ? 'red' : 'black'
                    });
                }
            }
            // 大小王
            this.deck.push({ suit: 'joker', value: '小王', display: '🃏', color: 'black' });
            this.deck.push({ suit: 'joker', value: '大王', display: '🃏', color: 'red' });
            
            // 洗牌
            for (let i = this.deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
            }
        }

        // 开始游戏（发牌、叫地主）
        start() {
            this.state = 'dealing';
            this.callbacks.onStateChange('dealing');
            
            // 发牌：玩家17张，AI1 17张，AI2 17张，底牌3张
            this.players.player.hand = this.deck.slice(0, 17);
            this.players.ai1.setHandCards(this.deck.slice(17, 34));
            this.players.ai2.setHandCards(this.deck.slice(34, 51));
            this.bottomCards = this.deck.slice(51, 54);
            
            // 排序
            this.players.player.hand = sortCards(this.players.player.hand);
            
            // 简单叫地主（第一个叫的成为地主，实际应该轮转叫分）
            this.callLandlord();
        }

        callLandlord() {
            // 简化：玩家总是地主（为了测试），或者随机
            const ai1Want = this.players.ai1.shouldCallLandlord();
            const ai2Want = this.players.ai2.shouldCallLandlord();
            
            // 实际游戏中这里需要交互，简化处理：玩家是地主
            this.setLandlord('player');
        }

        setLandlord(who) {
            this.landlord = who;
            this.players.player.isLandlord = (who === 'player');
            this.players.ai1.isLandlord = (who === 'ai1');
            this.players.ai2.isLandlord = (who === 'ai2');
            
            // 地主拿底牌
            if (who === 'player') {
                this.players.player.hand.push(...this.bottomCards);
                this.players.player.hand = sortCards(this.players.player.hand);
            } else if (who === 'ai1') {
                this.players.ai1.handCards.push(...this.bottomCards);
                this.players.ai1.handCards = sortCards(this.players.ai1.handCards);
            } else {
                this.players.ai2.handCards.push(...this.bottomCards);
                this.players.ai2.handCards = sortCards(this.players.ai2.handCards);
            }
            
            this.state = 'playing';
            this.currentTurn = who; // 地主先出
            this.callbacks.onStateChange('playing');
            this.callbacks.onTurnChange(this.getCurrentPlayerName());
            
            // 如果AI是地主，自动出牌
            if (who !== 'player') {
                setTimeout(() => this.aiPlay(), 1000);
            }
        }

        getCurrentPlayerName() {
            if (this.currentTurn === 'player') return 'player';
            if (this.currentTurn === 'ai1') return this.players.ai1.name;
            return this.players.ai2.name;
        }

        // 玩家出牌（供前端调用）
        playCards(cardIndices) {
            if (this.currentTurn !== 'player') return { valid: false, reason: '不是你的回合' };
            
            const cards = cardIndices.map(idx => this.players.player.hand[idx]);
            const group = new CardGroup(cards);
            
            if (group.type === CARD_TYPE.INVALID) {
                return { valid: false, reason: '无效的牌型' };
            }
            
            // 检查是否能大过上家
            if (this.lastPlayed && this.lastPlayer !== 'player') {
                if (!group.canBeat(this.lastPlayed)) {
                    return { valid: false, reason: '必须大过上家的牌' };
                }
            }
            
            // 执行出牌
            this.executePlay('player', cards, cardIndices, group);
            return { valid: true, type: group.getTypeName(), cards: cards };
        }

        // 玩家跳过
        passTurn() {
            if (this.currentTurn !== 'player') return false;
            if (!this.lastPlayed || this.lastPlayer === 'player') {
                return false; // 必须出牌
            }
            
            this.nextTurn();
            return true;
        }

        // 执行出牌逻辑
        executePlay(who, cards, indices, group) {
            // 移除手牌
            if (who === 'player') {
                // 从大到小删避免索引错乱
                const sortedIdx = [...indices].sort((a,b) => b-a);
                sortedIdx.forEach(idx => this.players.player.hand.splice(idx, 1));
            } else if (who === 'ai1') {
                this.players.ai1.removeCards(indices);
            } else {
                this.players.ai2.removeCards(indices);
            }
            
            // 更新记牌器
            this.players.ai1.updateMemory(cards);
            this.players.ai2.updateMemory(cards);
            
            // 记录
            this.lastPlayed = group;
            this.lastPlayer = who;
            
            // 回调
            const playerName = who === 'player' ? '我' : 
                              (who === 'ai1' ? this.players.ai1.name : this.players.ai2.name);
            this.callbacks.onCardPlay(playerName, cards, group.getTypeName());
            
            // 检查胜利
            const remaining = who === 'player' ? this.players.player.hand.length :
                            (who === 'ai1' ? this.players.ai1.handCards.length : this.players.ai2.handCards.length);
            
            if (remaining === 0) {
                this.endGame(who);
                return;
            }
            
            // 下一回合
            this.nextTurn();
        }

        nextTurn() {
            const order = ['player', 'ai1', 'ai2'];
            const currIdx = order.indexOf(this.currentTurn);
            this.currentTurn = order[(currIdx + 1) % 3];
            
            // 如果一圈没人要，新一轮由上次出牌者继续
            if (this.lastPlayer === this.currentTurn) {
                this.lastPlayed = null;
            }
            
            this.callbacks.onTurnChange(this.getCurrentPlayerName());
            
            // AI回合
            if (this.currentTurn !== 'player') {
                setTimeout(() => this.aiPlay(), 1500);
            }
        }

        // AI自动出牌
        aiPlay() {
            const ai = this.currentTurn === 'ai1' ? this.players.ai1 : this.players.ai2;
            
            let play = null;
            
            if (!this.lastPlayed || this.lastPlayer === this.currentTurn) {
                // 主动出牌
                play = ai.playInitiative();
            } else {
                // 跟牌
                play = ai.playFollow(this.lastPlayed);
            }
            
            if (play && play.indices) {
                this.executePlay(this.currentTurn, play.cards, play.indices, new CardGroup(play.cards));
            } else {
                // 不出
                this.callbacks.onCardPlay(ai.name, [], '不出');
                this.nextTurn();
            }
        }

        // 提示功能（供前端调用）
        getHint() {
            if (this.currentTurn !== 'player') return null;
            
            const ai = new DouDiZhuAI('temp', false);
            ai.setHandCards(this.players.player.hand);
            
            let hint = null;
            if (!this.lastPlayed || this.lastPlayer === 'player') {
                hint = ai.playInitiative();
            } else {
                hint = ai.playFollow(this.lastPlayed);
            }
            
            if (hint) {
                return { indices: hint.indices, type: hint.type };
            }
            return null;
        }

        endGame(winner) {
            this.state = 'ended';
            const isPlayerWin = (winner === 'player');
            const reward = 100; // 假设奖池
            
            this.callbacks.onGameEnd({
                winner: winner === 'player' ? 'player' : (winner === 'ai1' ? this.players.ai1.name : this.players.ai2.name),
                isPlayerWin,
                reward: isPlayerWin ? reward : 0
            });
        }

        destroy() {
            this.state = 'idle';
        }
    }

    // 暴露到全局
    window.DouDiZhu = DouDiZhu;
    window.CARD_TYPE = CARD_TYPE;
    window.CardGroup = CardGroup;
})();