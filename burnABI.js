<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <meta name="theme-color" content="#ffffff">
    <title>踏马封神斗地主</title>
    
    <script src="https://cdn.jsdelivr.net/npm/ethers@6.9.0/dist/ethers.umd.min.js"></script>
    <script src="abi.js"></script>
    <!-- 游戏逻辑文件 - 由你创建，包含所有斗地主规则 -->
    <script src="doudizhu.js"></script>
    
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif; 
            background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%); 
            min-height: 100vh; 
            color: #1a1a1a; 
            overflow-x: hidden;
            padding-bottom: 90px;
        }
        
        @media (min-width: 768px) {
            body { display: flex; justify-content: center; align-items: flex-start; min-height: 100vh; background: #f0f0f0; }
            .mobile-container { width: 100%; max-width: 480px; background: linear-gradient(180deg, #f8f9fa 0%, #ffffff 100%); min-height: 100vh; position: relative; box-shadow: 0 0 40px rgba(0,0,0,0.1); }
        }
        
        /* 页面容器 */
        #homePage, #burnPage, #claimPage, #gamePage, #rankPage { min-height: 100vh; display: none; position: relative; }
        #homePage { display: block; animation: fadeIn 0.4s ease; }
        
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        
        /* 顶部导航 */
        .top-nav { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; background: rgba(255,255,255,0.95); backdrop-filter: blur(20px); position: sticky; top: 0; z-index: 100; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .brand { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; background: linear-gradient(135deg, #1a1a1a 0%, #4a4a4a 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
        .top-title { font-size: 18px; font-weight: 700; position: absolute; left: 50%; transform: translateX(-50%); }
        .top-action { font-size: 14px; font-weight: 600; color: #666; cursor: pointer; }
        
        .back-btn { width: 36px; height: 36px; border-radius: 50%; background: rgba(0,0,0,0.05); border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 18px; color: #1a1a1a; }
        
        .wallet-btn { width: 40px; height: 40px; border-radius: 50%; background: #1a1a1a; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer; border: none; font-size: 16px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .wallet-btn.connected { background: linear-gradient(135deg, #00d26a 0%, #00a854 100%); }
        
        /* 主内容区 */
        .container { max-width: 480px; margin: 0 auto; padding: 0 16px; }
        
        /* 第一行：余额 + AI池（双卡片布局） */
        .stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin: 16px 0; }
        .stat-card { background: white; border-radius: 20px; padding: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border: 1px solid rgba(0,0,0,0.05); }
        .stat-label { font-size: 12px; color: #999; margin-bottom: 6px; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-value { font-size: 22px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px; }
        .stat-sub { font-size: 11px; color: #00a854; margin-top: 4px; font-weight: 600; }
        
        /* 第二行：今日币价（全宽长条） */
        .price-section-full { margin: 0 0 16px; }
        .price-module-full { 
            background: white; 
            border-radius: 20px; 
            padding: 20px; 
            box-shadow: 0 4px 20px rgba(0,0,0,0.05); 
            border: 1px solid rgba(0,0,0,0.05); 
            display: flex; 
            align-items: center;
            justify-content: space-between;
        }
        .price-left { flex: 1; }
        .price-header-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
        .price-title-text { font-size: 12px; color: #666; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .price-change-full { font-size: 12px; font-weight: 700; color: #00a854; background: rgba(0,168,84,0.1); padding: 4px 8px; border-radius: 12px; }
        .price-change-full.down { color: #dc2626; background: rgba(220,38,38,0.1); }
        .price-value-full { font-size: 28px; font-weight: 800; color: #1a1a1a; letter-spacing: -0.5px; }
        .price-chart-full { width: 100px; height: 40px; }
        .price-chart-full svg { width: 100%; height: 100%; }
        
        /* 第三行：斗地主游戏入口（全宽大模块） */
        .game-section-full { margin-bottom: 20px; }
        .game-module-full { 
            background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); 
            border-radius: 24px; 
            padding: 32px 24px; 
            color: white; 
            box-shadow: 0 10px 30px rgba(0,0,0,0.15); 
            text-align: center; 
            position: relative; 
            overflow: hidden;
            cursor: pointer;
            transition: transform 0.2s;
        }
        .game-module-full:active { transform: scale(0.98); }
        .game-module-full::before { content: '♠️'; position: absolute; top: -10px; right: -10px; font-size: 80px; opacity: 0.05; }
        .game-module-full::after { content: '♥️'; position: absolute; bottom: -20px; left: -20px; font-size: 100px; opacity: 0.03; }
        
        .game-status-full { font-size: 11px; opacity: 0.8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .game-title-full { font-size: 24px; font-weight: 800; margin-bottom: 6px; position: relative; z-index: 1; }
        .game-desc-full { font-size: 13px; opacity: 0.8; margin-bottom: 20px; position: relative; z-index: 1; }
        .play-btn-full { 
            background: white; 
            color: #1a1a1a; 
            border: none; 
            padding: 14px 32px; 
            border-radius: 24px; 
            font-size: 15px; 
            font-weight: 700; 
            cursor: pointer; 
            box-shadow: 0 4px 15px rgba(0,0,0,0.2); 
            position: relative; 
            z-index: 1;
            display: inline-block;
        }
        
        /* 燃烧页面 */
        .page-header-simple { padding: 20px; text-align: center; }
        .page-title-simple { font-size: 28px; font-weight: 800; margin-bottom: 4px; color: #1a1a1a; }
        .page-subtitle-simple { font-size: 14px; color: #666; }
        
        .input-card { background: white; border-radius: 24px; padding: 28px 20px; margin: 0 0 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.05); text-align: center; }
        .input-label { font-size: 13px; color: #999; margin-bottom: 12px; text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }
        .big-input { width: 100%; border: none; font-size: 42px; font-weight: 700; text-align: center; color: #1a1a1a; outline: none; margin-bottom: 16px; font-family: inherit; }
        .big-input::placeholder { color: #ddd; }
        
        .quick-buttons { display: flex; gap: 10px; justify-content: center; margin-bottom: 20px; }
        .quick-btn { background: #f5f5f5; border: 2px solid transparent; color: #1a1a1a; padding: 10px 16px; border-radius: 14px; font-size: 14px; font-weight: 600; cursor: pointer; transition: all 0.2s; user-select: none; }
        .quick-btn:active { transform: scale(0.95); background: #e5e5e5; }
        .quick-btn.active-long { background: #1a1a1a; color: white; border-color: #1a1a1a; }
        
        .action-btn { width: 100%; background: #1a1a1a; color: white; border: none; padding: 16px; border-radius: 16px; font-size: 16px; font-weight: 700; cursor: pointer; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0,0,0,0.15); }
        .action-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .action-btn:active:not(:disabled) { transform: scale(0.98); }
        .action-btn.burn { background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%); }
        .action-btn.claim { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
        
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 16px; }
        .info-card { background: #fafafa; border-radius: 14px; padding: 14px; text-align: center; }
        .info-label { font-size: 11px; color: #999; margin-bottom: 4px; font-weight: 500; }
        .info-value { font-size: 16px; font-weight: 700; color: #1a1a1a; }
        
        /* 领取分红页面 - 紧凑版 */
        .claim-container { padding: 16px; }
        .claim-header { background: linear-gradient(135deg, #fffbeb 0%, #ffffff 100%); border: 1px solid rgba(245,158,11,0.2); border-radius: 20px; padding: 24px; text-align: center; margin-bottom: 16px; box-shadow: 0 4px 20px rgba(245,158,11,0.1); }
        .claim-label { font-size: 12px; color: #92400e; margin-bottom: 8px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; }
        .claim-amount { font-size: 36px; font-weight: 800; color: #b45309; margin-bottom: 4px; letter-spacing: -1px; }
        .claim-unit { font-size: 14px; color: #d97706; font-weight: 600; margin-bottom: 20px; }
        .claim-btn { width: 100%; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: white; border: none; padding: 14px; border-radius: 12px; font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 15px rgba(245,158,11,0.3); }
        .claim-btn:disabled { opacity: 0.5; background: #ccc; box-shadow: none; cursor: not-allowed; }
        
        .claim-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
        .claim-stat-item { background: white; border-radius: 12px; padding: 12px 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .claim-stat-label { font-size: 10px; color: #999; margin-bottom: 4px; }
        .claim-stat-value { font-size: 13px; font-weight: 700; color: #1a1a1a; }
        
        .claim-rule { background: white; border-radius: 16px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); font-size: 12px; color: #666; line-height: 1.6; text-align: center; }
        .claim-rule-title { font-weight: 700; color: #1a1a1a; margin-bottom: 6px; font-size: 13px; }
        
        /* 游戏页面 - 全新布局 */
        .game-container {
            height: 100vh;
            display: flex;
            flex-direction: column;
            background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
            position: relative;
            overflow: hidden;
        }
        
        /* 牌桌背景 */
        .game-container::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
        }
        
        /* 顶部信息栏 */
        .game-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 12px 16px;
            background: rgba(0,0,0,0.2);
            backdrop-filter: blur(10px);
            color: white;
            z-index: 10;
        }
        
        .game-room-info {
            font-size: 14px;
            font-weight: 600;
            opacity: 0.9;
        }
        
        .game-pot-info {
            background: rgba(255,215,0,0.2);
            border: 1px solid rgba(255,215,0,0.4);
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 700;
            color: #FFD700;
        }
        
        /* AI玩家区域 */
        .ai-area {
            display: flex;
            justify-content: space-between;
            padding: 20px 30px;
            position: relative;
            z-index: 5;
        }
        
        .ai-player-box {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 8px;
        }
        
        .ai-avatar-game {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 28px;
            border: 3px solid rgba(255,255,255,0.3);
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            position: relative;
        }
        
        .ai-avatar-game.landlord {
            border-color: #FFD700;
            box-shadow: 0 0 20px rgba(255,215,0,0.5);
        }
        
        .ai-avatar-game.landlord::after {
            content: '地主';
            position: absolute;
            bottom: -5px;
            background: #FFD700;
            color: #1a1a1a;
            font-size: 10px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 10px;
        }
        
        .ai-name-game {
            color: white;
            font-size: 13px;
            font-weight: 600;
            text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        
        .ai-card-count {
            background: rgba(0,0,0,0.5);
            color: white;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: 700;
            display: flex;
            align-items: center;
            gap: 4px;
        }
        
        .ai-status-text {
            font-size: 11px;
            color: #00d26a;
            font-weight: 600;
            height: 16px;
        }
        
        /* 中央牌桌区域 */
        .table-area {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            position: relative;
        }
        
        .last-cards-area {
            min-height: 120px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .cards-display {
            display: flex;
            gap: -15px;
            flex-wrap: wrap;
            justify-content: center;
            padding: 10px;
        }
        
        .game-card {
            width: 50px;
            height: 70px;
            background: white;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 18px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 2px 4px rgba(0,0,0,0.2);
            margin-right: -20px;
            border: 1px solid #e0e0e0;
            position: relative;
            transform-origin: bottom center;
        }
        
        .game-card.red {
            color: #dc2626;
        }
        
        .game-card.black {
            color: #1a1a1a;
        }
        
        .game-card.back {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            border: 2px solid rgba(255,255,255,0.2);
        }
        
        .play-message {
            color: rgba(255,255,255,0.9);
            font-size: 14px;
            font-weight: 600;
            text-align: center;
            background: rgba(0,0,0,0.4);
            padding: 8px 16px;
            border-radius: 20px;
            margin-top: 10px;
        }
        
        /* 倒计时 */
        .timer {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: rgba(255,255,255,0.2);
            border: 2px solid #FFD700;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #FFD700;
            font-weight: 800;
            font-size: 16px;
            margin-bottom: 10px;
        }
        
        /* 玩家底部区域 */
        .player-zone {
            background: linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.8) 100%);
            padding: 20px 16px 100px;
            position: relative;
            z-index: 10;
        }
        
        .player-info-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            color: white;
            padding: 0 10px;
        }
        
        .player-avatar-small {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            border: 2px solid white;
        }
        
        .player-role {
            background: #FFD700;
            color: #1a1a1a;
            font-size: 11px;
            font-weight: 800;
            padding: 2px 8px;
            border-radius: 10px;
        }
        
        .hand-cards-container {
            display: flex;
            justify-content: center;
            gap: -20px;
            margin-bottom: 20px;
            overflow-x: auto;
            padding: 10px 0;
            min-height: 90px;
        }
        
        .hand-card-interactive {
            width: 55px;
            height: 77px;
            background: white;
            border-radius: 8px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 16px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            margin-right: -25px;
            cursor: pointer;
            transition: all 0.2s;
            position: relative;
            border: 2px solid transparent;
            user-select: none;
        }
        
        .hand-card-interactive.selected {
            transform: translateY(-20px);
            border-color: #FFD700;
            box-shadow: 0 8px 20px rgba(255,215,0,0.4);
            z-index: 100;
        }
        
        .hand-card-interactive.red { color: #dc2626; }
        .hand-card-interactive.black { color: #1a1a1a; }
        
        /* 操作按钮区 */
        .game-controls-area {
            display: flex;
            justify-content: center;
            gap: 15px;
            padding: 0 20px;
        }
        
        .game-action-btn {
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 15px;
            font-weight: 700;
            cursor: pointer;
            border: none;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            min-width: 80px;
        }
        
        .game-action-btn:active {
            transform: scale(0.95);
        }
        
        .game-action-btn.primary {
            background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
            color: #1a1a1a;
        }
        
        .game-action-btn.secondary {
            background: rgba(255,255,255,0.2);
            color: white;
            border: 2px solid rgba(255,255,255,0.3);
        }
        
        .game-action-btn.danger {
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            color: white;
        }
        
        .game-action-btn:disabled {
            opacity: 0.4;
            cursor: not-allowed;
        }
        
        /* 游戏状态遮罩 */
        .game-state-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.7);
            backdrop-filter: blur(5px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 100;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s;
        }
        
        .game-state-overlay.show {
            opacity: 1;
            pointer-events: all;
        }
        
        .state-card {
            background: white;
            border-radius: 24px;
            padding: 30px;
            text-align: center;
            max-width: 280px;
            width: 90%;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        }
        
        .state-title {
            font-size: 24px;
            font-weight: 800;
            margin-bottom: 10px;
            color: #1a1a1a;
        }
        
        .state-desc {
            font-size: 14px;
            color: #666;
            margin-bottom: 20px;
        }
        
        .stake-input {
            width: 100%;
            border: 2px solid #e0e0e0;
            border-radius: 12px;
            padding: 12px;
            font-size: 18px;
            text-align: center;
            margin-bottom: 15px;
            font-weight: 700;
        }
        
        /* 排行页面 */
        .rank-header { padding: 60px 20px 20px; text-align: center; background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%); }
        .rank-title { font-size: 28px; font-weight: 800; margin-bottom: 4px; }
        .rank-subtitle { font-size: 14px; color: #666; }
        
        .rank-tabs { display: flex; padding: 0 20px; margin-bottom: 16px; gap: 10px; }
        .rank-tab { flex: 1; padding: 12px; border-radius: 12px; border: none; background: #f5f5f5; font-size: 14px; font-weight: 600; color: #666; cursor: pointer; }
        .rank-tab.active { background: #1a1a1a; color: white; }
        
        .rank-list { padding: 0 16px; }
        .rank-item { display: flex; align-items: center; padding: 12px 16px; background: white; border-radius: 16px; margin-bottom: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .rank-number { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 14px; font-weight: 700; margin-right: 12px; background: #f5f5f5; color: #666; }
        .rank-number.top1 { background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%); color: #8b6914; }
        .rank-number.top2 { background: linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%); color: #666; }
        .rank-number.top3 { background: linear-gradient(135deg, #cd7f32 0%, #daa520 100%); color: white; }
        
        .rank-info { flex: 1; }
        .rank-address { font-size: 14px; font-weight: 600; color: #1a1a1a; margin-bottom: 2px; }
        .rank-amount { font-size: 12px; color: #666; }
        .rank-reward { font-size: 14px; font-weight: 700; color: #00a854; }
        
        .my-rank { position: fixed; bottom: 90px; left: 16px; right: 16px; background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); color: white; padding: 16px 20px; border-radius: 16px; display: flex; align-items: center; box-shadow: 0 8px 20px rgba(0,0,0,0.2); }
        .my-rank-label { font-size: 12px; opacity: 0.8; margin-bottom: 2px; }
        .my-rank-value { font-size: 16px; font-weight: 700; }
        
        /* 底部导航 */
        .bottom-nav { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: rgba(255,255,255,0.98); backdrop-filter: blur(20px); border-radius: 30px; padding: 10px 14px; display: flex; gap: 6px; box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 1px solid rgba(0,0,0,0.05); z-index: 1000; max-width: 95%; }
        @media (min-width: 768px) { .bottom-nav { position: absolute; } }
        
        .nav-item { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; padding: 8px 14px; border-radius: 18px; cursor: pointer; transition: all 0.3s; min-width: 56px; color: #999; font-size: 10px; font-weight: 600; border: none; background: transparent; }
        .nav-item.active { background: #1a1a1a; color: white; box-shadow: 0 4px 12px rgba(0,0,0,0.2); }
        .nav-icon { font-size: 18px; line-height: 1; }
        
        /* 提示 */
        .tx-toast { position: fixed; top: 100px; left: 50%; transform: translateX(-50%); background: rgba(26,26,26,0.95); color: white; padding: 14px 24px; border-radius: 14px; font-size: 14px; font-weight: 500; z-index: 10000; display: none; backdrop-filter: blur(10px); box-shadow: 0 10px 40px rgba(0,0,0,0.3); max-width: 90%; text-align: center; }
        .tx-toast.show { display: block; }
        .tx-toast.error { background: rgba(220,38,38,0.95); }
        
        .loading { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3); border-radius: 50%; border-top-color: white; animation: spin 1s ease-in-out infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        .network-badge { position: fixed; top: 60px; left: 50%; transform: translateX(-50%); background: #1a1a1a; color: white; padding: 10px 20px; border-radius: 20px; font-size: 13px; font-weight: 600; z-index: 9999; display: none; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .network-badge.show { display: block; }
        
        .warning-box { background: #fffbeb; border: 1px solid #f59e0b; border-radius: 14px; padding: 14px; margin: 16px; font-size: 13px; color: #92400e; }
        
        .auth-section { position: fixed; top: 80px; right: 16px; z-index: 100; }
        @media (min-width: 768px) { .auth-section { position: absolute; } }
        .auth-btn { background: #1a1a1a; color: white; border: none; padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
        .auth-btn.authorized { background: #00d26a; }
    </style>
</head>
<body>
    <div class="mobile-container">
        <div id="networkBadge" class="network-badge">请切换网络</div>
        <div id="txToast" class="tx-toast"></div>

        <!-- 首页 -->
        <div id="homePage">
            <div class="top-nav">
                <div class="brand">踏马封神</div>
                <button class="wallet-btn" id="walletBtn" onclick="connectWallet()">💼</button>
            </div>
            
            <div id="authSection" class="auth-section" style="display: none;">
                <button class="auth-btn" id="authBtn" onclick="authorizeToken()">授权</button>
            </div>

            <div class="container">
                <!-- 第一行：余额 + AI池（按手绘图：左余额，右AI池） -->
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-label">我的余额</div>
                        <div class="stat-value" id="balance">0.00</div>
                        <div class="stat-sub" id="tokenSymbolDisplay">TMFS</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-label">AI奖池</div>
                        <div class="stat-value" id="aiPoolAmount">0.00</div>
                        <div class="stat-sub">实时累积</div>
                    </div>
                </div>

                <!-- 第二行：今日币价（全宽长条） -->
                <div class="price-section-full">
                    <div class="price-module-full">
                        <div class="price-left">
                            <div class="price-header-row">
                                <div class="price-title-text">今日币价</div>
                                <div class="price-change-full" id="priceChange">+5.24%</div>
                            </div>
                            <div class="price-value-full" id="tokenPrice">$0.0042</div>
                        </div>
                        <div class="price-chart-full">
                            <svg viewBox="0 0 200 40" preserveAspectRatio="none">
                                <path d="M0,30 Q25,28 50,25 T100,20 T150,15 T200,10" fill="none" stroke="#00a854" stroke-width="2" />
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- 第三行：斗地主游戏入口（全宽大方块） -->
                <div class="game-section-full">
                    <div class="game-module-full" onclick="enterGameLobby()">
                        <div class="game-status-full">🔥 热门对战</div>
                        <div class="game-title-full">开始斗地主</div>
                        <div class="game-desc-full">1v2 AI对战 | 赢取代币奖励</div>
                        <button class="play-btn-full">立即开始</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 游戏页面 - 全新布局 -->
        <div id="gamePage">
            <div class="game-container">
                <!-- 顶部信息 -->
                <div class="game-header">
                    <button class="back-btn" onclick="exitGame()" style="background: rgba(255,255,255,0.2); color: white;">←</button>
                    <div class="game-room-info">房间 #<span id="roomId">001</span></div>
                    <div class="game-pot-info">💰 <span id="potAmount">0</span> TMFS</div>
                </div>

                <!-- AI玩家区域 -->
                <div class="ai-area">
                    <div class="ai-player-box" id="aiLeftBox">
                        <div class="ai-avatar-game" id="aiLeftAvatar">🤖</div>
                        <div class="ai-name-game">AI-李白</div>
                        <div class="ai-card-count">
                            <span>🃏</span>
                            <span id="aiLeftCount">17</span>
                        </div>
                        <div class="ai-status-text" id="aiLeftStatus">准备中</div>
                    </div>
                    
                    <div class="ai-player-box" id="aiRightBox">
                        <div class="ai-avatar-game" id="aiRightAvatar">🤖</div>
                        <div class="ai-name-game">AI-杜甫</div>
                        <div class="ai-card-count">
                            <span>🃏</span>
                            <span id="aiRightCount">17</span>
                        </div>
                        <div class="ai-status-text" id="aiRightStatus">准备中</div>
                    </div>
                </div>

                <!-- 中央牌桌 -->
                <div class="table-area">
                    <div class="timer" id="gameTimer" style="display: none;">15</div>
                    
                    <div class="last-cards-area">
                        <div class="cards-display" id="lastPlayedCards">
                            <div class="play-message">等待游戏开始...</div>
                        </div>
                        <div class="play-message" id="gameMessage">点击"开始游戏"进行质押开局</div>
                    </div>
                </div>

                <!-- 玩家操作区 -->
                <div class="player-zone">
                    <div class="player-info-bar">
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <div class="player-avatar-small">👤</div>
                            <div>
                                <div style="font-size: 14px; font-weight: 700;">我</div>
                                <div style="font-size: 11px; opacity: 0.8;" id="myRole">农民</div>
                            </div>
                        </div>
                        <div class="player-role" id="landlordBadge" style="display: none;">地主</div>
                    </div>

                    <!-- 手牌区域 -->
                    <div class="hand-cards-container" id="playerHand">
                        <!-- 手牌由JS动态生成 -->
                    </div>

                    <!-- 操作按钮 -->
                    <div class="game-controls-area" id="gameControls">
                        <button class="game-action-btn secondary" onclick="gameAction('pass')" id="btnPass">不出</button>
                        <button class="game-action-btn danger" onclick="gameAction('hint')" id="btnHint">提示</button>
                        <button class="game-action-btn primary" onclick="gameAction('play')" id="btnPlay">出牌</button>
                    </div>
                    
                    <div class="game-controls-area" id="startGameControl" style="display: flex;">
                        <button class="game-action-btn primary" onclick="startGame()" style="padding: 15px 40px; font-size: 16px;">
                            开始游戏 (质押100 TMFS)
                        </button>
                    </div>
                </div>

                <!-- 游戏状态遮罩（用于叫分、结算等） -->
                <div class="game-state-overlay" id="gameOverlay">
                    <div class="state-card">
                        <div class="state-title" id="overlayTitle">准备开始</div>
                        <div class="state-desc" id="overlayDesc">准备质押 100 TMFS 开始游戏</div>
                        <input type="number" class="stake-input" id="stakeInput" value="100" style="display: none;">
                        <button class="game-action-btn primary" onclick="confirmGameStart()" id="overlayBtn" style="width: 100%;">确认开始</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- 燃烧页面 -->
        <div id="burnPage">
            <div class="top-nav">
                <button class="back-btn" onclick="showPage('home')">←</button>
                <div class="top-title">燃烧代币</div>
                <div style="width: 40px;"></div>
            </div>

            <div class="container" style="padding-top: 20px;">
                <div class="input-card">
                    <div class="input-label">燃烧数量 (TMFS)</div>
                    <input type="number" class="big-input" id="burnAmountInput" placeholder="0" value="0">
                    
                    <div class="quick-buttons">
                        <button class="quick-btn" ontouchstart="startLongPress(this, 1000)" ontouchend="endLongPress()" onmousedown="startLongPress(this, 1000)" onmouseup="endLongPress()" onmouseleave="endLongPress()">+1k</button>
                        <button class="quick-btn" ontouchstart="startLongPress(this, 10000)" ontouchend="endLongPress()" onmousedown="startLongPress(this, 10000)" onmouseup="endLongPress()" onmouseleave="endLongPress()">+1w</button>
                        <button class="quick-btn" ontouchstart="startLongPress(this, 100000)" ontouchend="endLongPress()" onmousedown="startLongPress(this, 100000)" onmouseup="endLongPress()" onmouseleave="endLongPress()">+10w</button>
                    </div>
                    
                    <button class="action-btn burn" onclick="burnTokens()" id="burnBtn">确认销毁</button>
                </div>

                <div class="info-grid">
                    <div class="info-card">
                        <div class="info-label">我的累计燃烧</div>
                        <div class="info-value" id="myTotalBurned">0</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">全球燃烧总量</div>
                        <div class="info-value" id="globalBurned">0</div>
                    </div>
                </div>

                <div id="dividendWarning" class="warning-box" style="display: none;">
                    <b>⚠️ 需要配置分红合约</b><br>
                    请在 abi.js 中配置 dividendAddress 和 dividendABI
                </div>
            </div>
        </div>

        <!-- 领取分红页面 -->
        <div id="claimPage">
            <div class="top-nav">
                <button class="back-btn" onclick="showPage('home')">←</button>
                <div class="top-title">领取分红</div>
                <div style="width: 40px;"></div>
            </div>

            <div class="claim-container">
                <div class="claim-header">
                    <div class="claim-label">可领取 WBNB</div>
                    <div class="claim-amount" id="pendingWBNB">0.0000</div>
                    <div class="claim-unit">WBNB</div>
                    <button class="claim-btn" id="claimBtn" onclick="claimDividend()" disabled>领取分红</button>
                </div>

                <div class="claim-stats">
                    <div class="claim-stat-item">
                        <div class="claim-stat-label">已领取</div>
                        <div class="claim-stat-value" id="totalClaimedWBNB">0</div>
                    </div>
                    <div class="claim-stat-item">
                        <div class="claim-stat-label">积分</div>
                        <div class="claim-stat-value" id="dividendPoints">0</div>
                    </div>
                    <div class="claim-stat-item">
                        <div class="claim-stat-label">我的燃烧</div>
                        <div class="claim-stat-value" id="myBurnAmount">0</div>
                    </div>
                    <div class="claim-stat-item">
                        <div class="claim-stat-label">全球燃烧</div>
                        <div class="claim-stat-value" id="globalBurnAmount">0</div>
                    </div>
                </div>

                <div class="claim-rule">
                    <div class="claim-rule-title">💡 分红规则</div>
                    销毁 TMFS 获得分红积分，每日按积分占比分配 WBNB，可随时领取
                </div>
            </div>
        </div>

        <!-- 排行页面 -->
        <div id="rankPage">
            <div class="rank-header">
                <div class="rank-title">🏆 燃烧排行</div>
                <div class="rank-subtitle">全球 TMFS 燃烧量排行榜</div>
            </div>

            <div class="rank-tabs">
                <button class="rank-tab active" onclick="switchRankTab('burn')">燃烧排行</button>
                <button class="rank-tab" onclick="switchRankTab('reward')">收益排行</button>
            </div>

            <div class="rank-list" id="rankList">
                <!-- 动态生成 -->
                <div class="rank-item">
                    <div class="rank-number top1">1</div>
                    <div class="rank-info">
                        <div class="rank-address">0x8888...8888</div>
                        <div class="rank-amount">燃烧 1,000,000 TMFS</div>
                    </div>
                    <div class="rank-reward">+5.2 BNB</div>
                </div>
                <div class="rank-item">
                    <div class="rank-number top2">2</div>
                    <div class="rank-info">
                        <div class="rank-address">0x7777...7777</div>
                        <div class="rank-amount">燃烧 800,000 TMFS</div>
                    </div>
                    <div class="rank-reward">+4.1 BNB</div>
                </div>
                <div class="rank-item">
                    <div class="rank-number top3">3</div>
                    <div class="rank-info">
                        <div class="rank-address">0x6666...6666</div>
                        <div class="rank-amount">燃烧 600,000 TMFS</div>
                    </div>
                    <div class="rank-reward">+3.2 BNB</div>
                </div>
            </div>

            <div class="my-rank">
                <div style="flex: 1;">
                    <div class="my-rank-label">我的排名</div>
                    <div class="my-rank-value" id="myRank">第 99+ 名 | 燃烧 0 TMFS</div>
                </div>
                <div style="text-align: right;">
                    <div style="font-size: 12px; opacity: 0.8;">预计收益</div>
                    <div style="font-size: 16px; font-weight: 700;" id="myRankReward">0 BNB</div>
                </div>
            </div>
        </div>

        <!-- 底部导航 -->
        <div class="bottom-nav">
            <button class="nav-item active" onclick="showPage('home')" data-page="home">
                <span class="nav-icon">🏠</span>
                <span>首页</span>
            </button>
            <button class="nav-item" onclick="showPage('burn')" data-page="burn">
                <span class="nav-icon">🔥</span>
                <span>燃烧</span>
            </button>
            <button class="nav-item" onclick="showPage('claim')" data-page="claim">
                <span class="nav-icon">💎</span>
                <span>领分红</span>
            </button>
            <button class="nav-item" onclick="showPage('rank')" data-page="rank">
                <span class="nav-icon">🏆</span>
                <span>排行</span>
            </button>
        </div>
    </div>

    <script>
        // ==================== 配置检查 ====================
        if (!window.CONTRACT_CONFIG) {
            alert('错误：未找到 abi.js 文件！');
            throw new Error('CONTRACT_CONFIG not found');
        }

        const CONFIG = window.CONTRACT_CONFIG;
        const TOKEN_ABI = CONFIG.tokenABI;
        const DIVIDEND_ABI = CONFIG.dividendABI || [];
        const TOKEN_ADDRESS = CONFIG.tokenAddress;
        const DIVIDEND_ADDRESS = CONFIG.dividendAddress;
        const CHAIN_ID = CONFIG.chainId || "0x38";
        const CHAIN_NAME = CONFIG.chainName || "BSC Mainnet";
        const RPC_URL = CONFIG.rpcUrl || "https://bsc-dataseed.binance.org/";
        
        const HAS_DIVIDEND_CONTRACT = DIVIDEND_ADDRESS && DIVIDEND_ABI.length > 0;

        // ==================== 全局变量 ====================
        let provider = null;
        let signer = null;
        let tokenContract = null;
        let dividendContract = null;
        let userAddress = null;
        let tokenDecimals = CONFIG.decimals || 18;
        let tokenSymbol = "TMFS";
        let longPressTimer = null;
        let longPressInterval = null;
        const LONG_PRESS_DELAY = 500;

        // ==================== 游戏全局变量 ====================
        let gameInstance = null; // 游戏逻辑实例（由 doudizhu.js 创建）
        let selectedCards = []; // 当前选中的手牌索引
        let currentGameState = 'idle'; // idle, playing, paused, ended

        // ==================== 工具函数 ====================
        function showToast(message, isError = false) {
            const toast = document.getElementById('txToast');
            toast.textContent = message;
            toast.className = 'tx-toast ' + (isError ? 'error' : '') + ' show';
            setTimeout(() => toast.classList.remove('show'), 3000);
        }

        function formatAddress(address) {
            if (!address || address === '0x0000000000000000000000000000000000000000') return '无';
            return address.slice(0, 6) + '...' + address.slice(-4);
        }

        function formatAmount(amount, decimals = 2) {
            if (!amount || amount === '0') return '0.'.padEnd(decimals + 2, '0');
            return parseFloat(amount).toFixed(decimals);
        }

        // ==================== 价格查询 ====================
        async function fetchTokenPrice() {
            try {
                const mockPrice = 0.0042;
                const mockChange = 5.24;
                
                document.getElementById('tokenPrice').textContent = '$' + mockPrice.toFixed(4);
                const changeEl = document.getElementById('priceChange');
                changeEl.textContent = (mockChange > 0 ? '+' : '') + mockChange + '%';
                changeEl.className = 'price-change-full ' + (mockChange < 0 ? 'down' : '');
                
            } catch (error) {
                console.error('获取价格失败:', error);
            }
        }

        // ==================== 长按功能 ====================
        function startLongPress(btn, amount) {
            btn.classList.add('active-long');
            addToBurnInput(amount);
            
            longPressTimer = setTimeout(() => {
                longPressInterval = setInterval(() => {
                    addToBurnInput(amount);
                }, 100);
            }, LONG_PRESS_DELAY);
        }

        function endLongPress() {
            if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
            if (longPressInterval) { clearInterval(longPressInterval); longPressInterval = null; }
            document.querySelectorAll('.quick-btn').forEach(btn => btn.classList.remove('active-long'));
        }

        function addToBurnInput(amount) {
            const input = document.getElementById('burnAmountInput');
            const current = parseFloat(input.value) || 0;
            input.value = current + amount;
        }

        // ==================== 钱包连接 ====================
        async function connectWallet() {
            if (!window.ethereum) { alert('请安装 MetaMask！'); return; }
            
            const btn = document.getElementById('walletBtn');
            btn.innerHTML = '<span class="loading"></span>';
            
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
                
                tokenContract = new ethers.Contract(TOKEN_ADDRESS, TOKEN_ABI, signer);
                if (HAS_DIVIDEND_CONTRACT) {
                    dividendContract = new ethers.Contract(DIVIDEND_ADDRESS, DIVIDEND_ABI, signer);
                }
                
                btn.classList.add('connected');
                btn.innerHTML = '✓';
                document.getElementById('authSection').style.display = 'block';
                
                await loadAllData();
                showToast(`已连接: ${tokenSymbol}`);
                
            } catch (error) {
                console.error('连接失败:', error);
                btn.innerHTML = '💼';
                showToast('连接失败: ' + error.message, true);
            }
        }

        // ==================== 数据加载 ====================
        async function loadAllData() {
            if (!tokenContract || !userAddress) return;
            
            try {
                const balance = await tokenContract.balanceOf(userAddress);
                document.getElementById('balance').textContent = formatAmount(ethers.formatUnits(balance, tokenDecimals));
                
                const totalSupply = await tokenContract.totalSupply();
                document.getElementById('aiPoolAmount').textContent = formatAmount(ethers.formatUnits(totalSupply, tokenDecimals) * 0.01);
                
                await checkAllowance();
                
                if (HAS_DIVIDEND_CONTRACT) {
                    await loadDividendData();
                }
                
                await fetchTokenPrice();
                
            } catch (error) {
                console.error('加载数据失败:', error);
            }
        }

        async function checkAllowance() {
            if (!tokenContract || !userAddress) return;
            try {
                const spender = HAS_DIVIDEND_CONTRACT ? DIVIDEND_ADDRESS : TOKEN_ADDRESS;
                const allowance = await tokenContract.allowance(userAddress, spender);
                const btn = document.getElementById('authBtn');
                if (allowance > 0) { btn.textContent = '已授权'; btn.classList.add('authorized'); }
            } catch (error) { console.error('检查授权失败:', error); }
        }

        async function authorizeToken() {
            if (!tokenContract || !userAddress) { alert('请先连接钱包'); return; }
            const btn = document.getElementById('authBtn');
            btn.innerHTML = '<span class="loading"></span>';
            btn.disabled = true;
            try {
                const spender = HAS_DIVIDEND_CONTRACT ? DIVIDEND_ADDRESS : TOKEN_ADDRESS;
                const tx = await tokenContract.approve(spender, ethers.MaxUint256);
                showToast('授权交易已发送...');
                await tx.wait();
                showToast('授权成功！');
                await checkAllowance();
            } catch (error) {
                showToast('授权失败: ' + error.message, true);
            } finally { btn.disabled = false; }
        }

        // ==================== 燃烧功能 ====================
        async function burnTokens() {
            if (!HAS_DIVIDEND_CONTRACT || !dividendContract) { showToast('未配置分红合约', true); return; }
            const amount = document.getElementById('burnAmountInput').value;
            if (!amount || amount <= 0) { showToast('请输入有效数量', true); return; }
            
            const btn = document.getElementById('burnBtn');
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span> 处理中...';
            
            try {
                const amountWei = ethers.parseUnits(amount.toString(), tokenDecimals);
                const balance = await tokenContract.balanceOf(userAddress);
                if (balance < amountWei) throw new Error('余额不足');
                
                const allowance = await tokenContract.allowance(userAddress, DIVIDEND_ADDRESS);
                if (allowance < amountWei) {
                    showToast('正在授权...');
                    const approveTx = await tokenContract.approve(DIVIDEND_ADDRESS, ethers.MaxUint256);
                    await approveTx.wait();
                }
                
                const tx = await dividendContract.burn(amountWei);
                showToast('销毁交易已发送...');
                await tx.wait();
                
                await loadAllData();
                document.getElementById('burnAmountInput').value = '0';
                showToast(`成功销毁 ${amount} ${tokenSymbol}！`);
                
            } catch (error) {
                showToast('销毁失败: ' + error.message, true);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '确认销毁';
            }
        }

        // ==================== 分红功能 ====================
        async function loadDividendData() {
            if (!HAS_DIVIDEND_CONTRACT || !dividendContract || !userAddress) return;
            try {
                const pending = await dividendContract.check(userAddress).catch(() => 0);
                const points = await dividendContract.points(userAddress).catch(() => 0);
                const claimed = await dividendContract.claimed(userAddress).catch(() => 0);
                const totalBurned = await dividendContract.totalBurned().catch(() => 0);
                
                const pendingWBNB = ethers.formatEther(pending);
                const pointsFormatted = ethers.formatUnits(points, tokenDecimals);
                
                document.getElementById('pendingWBNB').textContent = formatAmount(pendingWBNB, 4);
                document.getElementById('totalClaimedWBNB').textContent = formatAmount(ethers.formatEther(claimed), 4);
                document.getElementById('dividendPoints').textContent = formatAmount(pointsFormatted);
                document.getElementById('myBurnAmount').textContent = formatAmount(pointsFormatted);
                document.getElementById('globalBurnAmount').textContent = formatAmount(ethers.formatUnits(totalBurned, tokenDecimals));
                document.getElementById('myTotalBurned').textContent = formatAmount(pointsFormatted);
                document.getElementById('globalBurned').textContent = formatAmount(ethers.formatUnits(totalBurned, tokenDecimals));
                
                document.getElementById('claimBtn').disabled = pending <= 0;
                
            } catch (error) { console.error('加载分红数据失败:', error); }
        }

        async function claimDividend() {
            if (!HAS_DIVIDEND_CONTRACT || !dividendContract) { showToast('未配置分红合约', true); return; }
            const btn = document.getElementById('claimBtn');
            btn.disabled = true;
            btn.innerHTML = '<span class="loading"></span>';
            try {
                const tx = await dividendContract.claim();
                showToast('领取交易已发送...');
                await tx.wait();
                await loadDividendData();
                showToast('WBNB分红领取成功！');
            } catch (error) {
                showToast('领取失败: ' + error.message, true);
            } finally {
                btn.disabled = false;
                btn.innerHTML = '领取分红';
            }
        }

        // ==================== 游戏功能（与 doudizhu.js 对接） ====================
        
        // 进入游戏大厅（从首页点击）
        function enterGameLobby() {
            if (!userAddress) {
                showToast('请先连接钱包', true);
                return;
            }
            showPage('game');
            initGameTable();
        }

        // 初始化游戏桌面
        function initGameTable() {
            // 重置游戏状态显示
            document.getElementById('gameMessage').textContent = '点击"开始游戏"进行质押开局';
            document.getElementById('lastPlayedCards').innerHTML = '<div class="play-message">等待游戏开始...</div>';
            document.getElementById('playerHand').innerHTML = '';
            document.getElementById('startGameControl').style.display = 'flex';
            document.getElementById('gameControls').style.display = 'none';
            document.getElementById('landlordBadge').style.display = 'none';
            document.getElementById('myRole').textContent = '准备中';
            
            // 重置AI显示
            document.getElementById('aiLeftCount').textContent = '17';
            document.getElementById('aiRightCount').textContent = '17';
            document.getElementById('aiLeftStatus').textContent = '准备中';
            document.getElementById('aiRightStatus').textContent = '准备中';
            document.getElementById('aiLeftAvatar').classList.remove('landlord');
            document.getElementById('aiRightAvatar').classList.remove('landlord');
            
            selectedCards = [];
            currentGameState = 'idle';
        }

        // 开始游戏（点击开始按钮）
        async function startGame() {
            if (!userAddress) {
                showToast('请先连接钱包', true);
                return;
            }
            
            // 检查并初始化游戏逻辑引擎（来自 doudizhu.js）
            if (typeof window.DouDiZhu === 'undefined') {
                showToast('游戏引擎加载中，请稍候...', true);
                console.error('错误：未找到 doudizhu.js 文件');
                return;
            }
            
            // 创建游戏实例（这里调用 doudizhu.js 中的类）
            gameInstance = new window.DouDiZhu({
                onStateChange: handleGameStateChange,
                onCardPlay: handleCardPlay,
                onTurnChange: handleTurnChange,
                onGameEnd: handleGameEnd,
                aiPlayers: ['AI-李白', 'AI-杜甫']
            });
            
            // 切换到游戏状态UI
            document.getElementById('startGameControl').style.display = 'none';
            document.getElementById('gameControls').style.display = 'flex';
            document.getElementById('gameMessage').textContent = '游戏开始！正在抢地主...';
            
            // 模拟发牌动画
            setTimeout(() => {
                dealCardsAnimation();
            }, 500);
            
            showToast('游戏开始！对战AI-李白和AI-杜甫');
            
            // TODO: Contract Call - 这里调用智能合约创建游戏房间
            // const tx = await gameContract.createRoom(ethers.parseUnits('100', tokenDecimals));
            // await tx.wait();
        }

        // 发牌动画
        function dealCardsAnimation() {
            // 这里应该由 doudizhu.js 提供手牌数据
            // 模拟生成手牌
            const mockCards = [
                { suit: 'spade', value: '3', display: '3', color: 'black' },
                { suit: 'heart', value: '4', display: '4', color: 'red' },
                { suit: 'club', value: '5', display: '5', color: 'black' },
                { suit: 'diamond', value: '6', display: '6', color: 'red' },
                { suit: 'spade', value: '7', display: '7', color: 'black' },
                { suit: 'heart', value: '8', display: '8', color: 'red' },
                { suit: 'club', value: '9', display: '9', color: 'black' },
                { suit: 'diamond', value: '10', display: '10', color: 'red' },
                { suit: 'spade', value: 'J', display: 'J', color: 'black' },
                { suit: 'heart', value: 'Q', display: 'Q', color: 'red' },
                { suit: 'club', value: 'K', display: 'K', color: 'black' },
                { suit: 'diamond', value: 'A', display: 'A', color: 'red' },
                { suit: 'spade', value: '2', display: '2', color: 'black' },
                { suit: 'joker', value: 'small', display: '🃏', color: 'black' },
                { suit: 'joker', value: 'big', display: '🃏', color: 'red' },
                { suit: 'heart', value: '3', display: '3', color: 'red' },
                { suit: 'club', value: '4', display: '4', color: 'black' }
            ];
            
            renderPlayerHand(mockCards);
            currentGameState = 'playing';
        }

        // 渲染玩家手牌（供 doudizhu.js 调用）
        function renderPlayerHand(cards) {
            const container = document.getElementById('playerHand');
            container.innerHTML = cards.map((card, index) => `
                <div class="hand-card-interactive ${card.color}" 
                     onclick="toggleCardSelection(${index})" 
                     data-index="${index}"
                     data-value="${card.value}"
                     data-suit="${card.suit}">
                    ${card.display}
                    <span style="font-size: 10px; margin-top: 2px;">${card.suit === 'joker' ? '' : (card.suit === 'spade' ? '♠' : card.suit === 'heart' ? '♥' : card.suit === 'club' ? '♣' : '♦')}</span>
                </div>
            `).join('');
        }

        // 选择/取消选择手牌
        function toggleCardSelection(index) {
            const cardEl = document.querySelector(`[data-index="${index}"]`);
            const cardIdx = selectedCards.indexOf(index);
            
            if (cardIdx > -1) {
                selectedCards.splice(cardIdx, 1);
                cardEl.classList.remove('selected');
            } else {
                selectedCards.push(index);
                cardEl.classList.add('selected');
            }
            
            // 通知游戏逻辑引擎选择变化（可选）
            if (gameInstance && gameInstance.onCardSelect) {
                gameInstance.onCardSelect(selectedCards);
            }
        }

        // 游戏操作按钮（出牌、不出、提示）
        function gameAction(action) {
            if (!gameInstance) return;
            
            switch(action) {
                case 'play':
                    if (selectedCards.length === 0) {
                        showToast('请先选择要出的牌', true);
                        return;
                    }
                    // 获取选中的牌数据
                    const selectedCardData = selectedCards.map(idx => {
                        const el = document.querySelector(`[data-index="${idx}"]`);
                        return {
                            value: el.dataset.value,
                            suit: el.dataset.suit,
                            index: idx
                        };
                    });
                    
                    // 调用游戏逻辑验证并出牌
                    // 返回值: { valid: boolean, type: string, cards: array }
                    const result = gameInstance.playCards(selectedCardData);
                    if (result.valid) {
                        // 播放出牌动画
                        animatePlayCards(selectedCardData);
                        // 清除选中
                        selectedCards = [];
                        showToast(`出牌: ${result.type}`);
                    } else {
                        showToast('无效的牌型', true);
                    }
                    break;
                    
                case 'pass':
                    gameInstance.passTurn();
                    showToast('跳过回合');
                    break;
                    
                case 'hint':
                    const hint = gameInstance.getHint();
                    if (hint && hint.indices) {
                        // 自动选择提示的牌
                        hint.indices.forEach(idx => {
                            if (!selectedCards.includes(idx)) {
                                toggleCardSelection(idx);
                            }
                        });
                    }
                    break;
            }
        }

        // 出牌动画
        function animatePlayCards(cards) {
            const playArea = document.getElementById('lastPlayedCards');
            playArea.innerHTML = cards.map(card => `
                <div class="game-card ${card.suit === 'heart' || card.suit === 'diamond' ? 'red' : 'black'}">
                    ${card.display}
                </div>
            `).join('');
        }

        // 游戏状态回调（由 doudizhu.js 调用）
        function handleGameStateChange(state) {
            // state: 'dealing', 'calling', 'playing', 'settling'
            currentGameState = state;
        }

        function handleCardPlay(player, cards, type) {
            // 更新AI手牌数量显示
            if (player === 'AI-李白') {
                const current = parseInt(document.getElementById('aiLeftCount').textContent);
                document.getElementById('aiLeftCount').textContent = Math.max(0, current - cards.length);
                document.getElementById('aiLeftStatus').textContent = `出了${type}`;
            } else if (player === 'AI-杜甫') {
                const current = parseInt(document.getElementById('aiRightCount').textContent);
                document.getElementById('aiRightCount').textContent = Math.max(0, current - cards.length);
                document.getElementById('aiRightStatus').textContent = `出了${type}`;
            }
            
            // 显示出的牌
            animatePlayCards(cards);
        }

        function handleTurnChange(player) {
            if (player === 'player') {
                document.getElementById('gameMessage').textContent = '轮到你了，请选择手牌';
                document.getElementById('btnPlay').disabled = false;
                document.getElementById('btnPass').disabled = false;
            } else {
                document.getElementById('gameMessage').textContent = `等待${player}出牌...`;
                document.getElementById('btnPlay').disabled = true;
                document.getElementById('btnPass').disabled = true;
                
                // 清除选中
                selectedCards = [];
                document.querySelectorAll('.hand-card-interactive').forEach(el => el.classList.remove('selected'));
            }
        }

        function handleGameEnd(result) {
            currentGameState = 'ended';
            const message = result.winner === 'player' 
                ? `🎉 你赢了！获得 ${result.reward} TMFS` 
                : `😢 你输了，${result.winner}获胜`;
            showToast(message);
            document.getElementById('gameMessage').textContent = message;
        }

        // 退出游戏
        function exitGame() {
            if (currentGameState === 'playing') {
                if (!confirm('游戏中退出将判定为认输，确定退出吗？')) {
                    return;
                }
                // TODO: Contract Call - 调用合约认输/退出
            }
            
            showPage('home');
            if (gameInstance) {
                gameInstance.destroy();
                gameInstance = null;
            }
            selectedCards = [];
            currentGameState = 'idle';
        }

        // ==================== 排行功能 ====================
        async function loadRankData() {
            try {
                // 模拟数据
            } catch (error) {
                console.error('加载排行失败:', error);
            }
        }

        function switchRankTab(tab) {
            document.querySelectorAll('.rank-tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
        }

        // ==================== 页面切换 ====================
        function showPage(page) {
            ['homePage', 'gamePage', 'burnPage', 'claimPage', 'rankPage'].forEach(id => {
                document.getElementById(id).style.display = 'none';
            });
            
            const pageMap = { 'home': 'homePage', 'game': 'gamePage', 'burn': 'burnPage', 'claim': 'claimPage', 'rank': 'rankPage' };
            if (pageMap[page]) {
                document.getElementById(pageMap[page]).style.display = 'block';
            }
            
            document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
            document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');
            
            if (page === 'claim' || page === 'burn') {
                if (tokenContract) { loadAllData(); loadDividendData(); }
            } else if (page === 'rank') {
                loadRankData();
            }
        }

        // ==================== 初始化 ====================
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', () => location.reload());
            window.ethereum.on('chainChanged', () => location.reload());
        }

        window.addEventListener('load', () => {
            console.log('✅ DApp 已加载');
            setInterval(fetchTokenPrice, 30000);
        });
    </script>
</body>
</html>