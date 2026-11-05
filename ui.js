window.Game = window.Game || {};

Game.ui = {
  drawMenu: function() {
    var ctx = Game.ctx, W = Game.W, H = Game.H;
    if (Game.IMG.bg2) ctx.drawImage(Game.IMG.bg2, 0, 0, W, H);
    else { ctx.fillStyle = '#16233c'; ctx.fillRect(0, 0, W, H); }

    var floatY = Math.sin(Date.now() / 500) * 5, baseY = H - 200;
    if (Game.IMG.mabao) ctx.drawImage(Game.IMG.mabao, W * 0.2 - 75, baseY + floatY - 75, 150, 150);
    if (Game.IMG.huaqiang_dash) {
      var hqW = 153 * (180 / 248);
      ctx.drawImage(Game.IMG.huaqiang_dash, 0, 0, 153, 248, W * 0.8 - hqW / 2, baseY + floatY - 90, hqW, 180);
    }
    if (Game.IMG.kun_idle) {
      var frame = Math.floor(Date.now() / 150) % 2;
      ctx.drawImage(Game.IMG.kun_idle, frame * 64, 0, 64, 64, W / 2 - 32, baseY + floatY - 32, 64, 64);
    }

    ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = 'bold 64px "Microsoft YaHei", sans-serif';
    ctx.fillStyle = '#ffd700'; ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 20;
    ctx.fillText('只因大冒险', W / 2, H * 0.25); ctx.restore();

    var btnW = 220, btnH = 60;
    Game.btnStart = { x: W / 2 - btnW - 20, y: H - 150, w: btnW, h: btnH };
    Game.btnRank  = { x: W / 2 + 20, y: H - 150, w: btnW, h: btnH };

    ctx.fillStyle = 'rgba(255, 215, 0, 0.8)'; ctx.fillRect(Game.btnStart.x, Game.btnStart.y, btnW, btnH);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.strokeRect(Game.btnStart.x, Game.btnStart.y, btnW, btnH);
    ctx.fillStyle = '#000'; ctx.font = 'bold 28px "Microsoft YaHei"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('开始游戏', Game.btnStart.x + btnW / 2, Game.btnStart.y + btnH / 2);

    ctx.fillStyle = 'rgba(50, 50, 50, 0.8)'; ctx.fillRect(Game.btnRank.x, Game.btnRank.y, btnW, btnH);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(Game.btnRank.x, Game.btnRank.y, btnW, btnH);
    ctx.fillStyle = '#fff'; ctx.fillText('排行榜', Game.btnRank.x + btnW / 2, Game.btnRank.y + btnH / 2);
  },

  drawRank: function() {
    var ctx = Game.ctx, W = Game.W, H = Game.H;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; ctx.fillRect(0, 0, W, H);

    var panelW = 600, panelH = 600, px = W / 2 - panelW / 2, py = H / 2 - panelH / 2;
    ctx.fillStyle = 'rgba(30, 30, 30, 0.9)'; ctx.fillRect(px, py, panelW, panelH);
    ctx.strokeStyle = '#ffd700'; ctx.lineWidth = 4; ctx.strokeRect(px, py, panelW, panelH);

    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 40px "Microsoft YaHei"'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('ikun榜', W / 2, py + 30);

    var rankData = JSON.parse(localStorage.getItem('game_rank') || '[]');
    rankData.sort(function(a, b) { return b.score - a.score; });
    rankData = rankData.slice(0, 10);

    if (rankData.length === 0) {
      ctx.fillStyle = '#aaa'; ctx.font = '24px "Microsoft YaHei"'; ctx.textAlign = 'center';
      ctx.fillText('暂无战绩，快去死一次吧！', W / 2, py + 200);
    } else {
      for (var i = 0; i < rankData.length; i++) {
        var y = py + 120 + i * 40, r = rankData[i];
        if (i === 0) ctx.fillStyle = '#ffd700'; 
        else if (i === 1) ctx.fillStyle = '#c0c0c0'; 
        else if (i === 2) ctx.fillStyle = '#cd7f32'; 
        else ctx.fillStyle = '#fff';

        ctx.textAlign = 'left'; ctx.font = 'bold 22px "Microsoft YaHei"';
        ctx.fillText((i + 1) + '. ' + r.name, px + 50, y);
        
        if (r.time) {
          ctx.fillStyle = '#888'; ctx.font = '16px "Microsoft YaHei"'; ctx.textAlign = 'center';
          ctx.fillText(r.time, px + panelW / 2, y);
          if (i === 0) ctx.fillStyle = '#ffd700'; else if (i === 1) ctx.fillStyle = '#c0c0c0'; else if (i === 2) ctx.fillStyle = '#cd7f32'; else ctx.fillStyle = '#fff';
          ctx.font = 'bold 22px "Microsoft YaHei"';
        }
        ctx.textAlign = 'right'; ctx.fillText(r.score + ' 分', px + panelW - 50, y);
      }
    }

    var btnW = 200, btnH = 50;
    Game.btnBack = { x: W / 2 - btnW / 2, y: py + panelH - 80, w: btnW, h: btnH };
    ctx.fillStyle = 'rgba(255, 255, 255, 0.2)'; ctx.fillRect(Game.btnBack.x, Game.btnBack.y, btnW, btnH);
    ctx.strokeStyle = '#fff'; ctx.strokeRect(Game.btnBack.x, Game.btnBack.y, btnW, btnH);
    ctx.fillStyle = '#fff'; ctx.font = 'bold 24px "Microsoft YaHei"'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('返回主菜单', Game.btnBack.x + btnW / 2, Game.btnBack.y + btnH / 2);
  },

  drawLoadingScreen: function(l, t) {
    var ctx = Game.ctx;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, Game.W, Game.H);
    ctx.fillStyle = '#fff'; ctx.font = '24px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var pct = t > 0 ? Math.round(l / t * 100) : 0;
    ctx.fillText('加载资源 ' + l + '/' + t + ' (' + pct + '%)', Game.W / 2, Game.H / 2);
  },

  drawDialogue: function() {
    if (Game.state !== 'DIALOGUE') return;
    var ctx = Game.ctx; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; ctx.fillRect(0, Game.H - 200, Game.W, 200);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(10, Game.H - 190, Game.W - 20, 180);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 24px "Microsoft YaHei"'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; 
    ctx.fillText('瓜摊老板：', 40, Game.H - 140);
    ctx.fillStyle = '#fff'; ctx.font = '22px "Microsoft YaHei"';
    ctx.fillText('小子，想过去？交1300个奶龙球出来，买西瓜。', 40, Game.H - 100);
    ctx.fillStyle = '#00ff00'; ctx.font = 'bold 20px "Microsoft YaHei"'; ctx.fillText('[1] 交出1300个奶龙球', 40, Game.H - 50);
    ctx.fillStyle = '#ff4444'; ctx.fillText('[2] 我不给，你能怎么着？', 400, Game.H - 50);
    ctx.restore(); 
  },

  drawBackground: function() {
    var ctx = Game.ctx;
    if (Game.bossMode) {
      ctx.drawImage(Game.IMG.bg, 0, 0, Game.W, Game.H);
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(0, 0, Game.W, Game.H);
    } else {
      ctx.drawImage(Game.IMG.bg2, 0, 0, Game.W, Game.H);
    }
  },

  drawEnemies: function() {
    var ctx = Game.ctx;
    for (var i = 0; i < Game.enemies.length; i++) {
      var e = Game.enemies[i];
      var img = Game.IMG[e.imgKey] || Game.IMG.nailong;
      if (img) ctx.drawImage(img, e.x, e.y, e.w, e.h);
    }
  },

  drawBoss: function() {
    if (!Game.boss.active) return;
    var ctx = Game.ctx, b = Game.boss;
    ctx.save();
    if (b.invuln) ctx.globalAlpha = 0.55 + Math.sin(Game.time * 18) * 0.25;
    
    if (Game.IMG.mabao && Game.IMG.mabao.width > 0) {
      ctx.drawImage(Game.IMG.mabao, b.x, b.y, b.w, b.h);
    } else {
      // 兜底：图没加载出来就画一个大红方块，上面写“马保国”
      ctx.fillStyle = '#ff0000'; 
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 30px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('马保国(无图)', b.x + b.w / 2, b.y + b.h / 2);
    }
    ctx.restore();
  },

  drawBullets: function() {
    var ctx = Game.ctx;
    for (var i = 0; i < Game.bullets.length; i++) {
      var b = Game.bullets[i];
      var img = Game.IMG[b.imgKey] || Game.IMG.basketball; 
      if (img) ctx.drawImage(img, b.x, b.y, b.w, b.h);
    }
  },

  drawParticles: function() {
    var ctx = Game.ctx;
    for (var i = 0; i < Game.particles.length; i++) {
      var p = Game.particles[i];
      ctx.save(); ctx.globalAlpha = p.life / p.maxLife; 
      ctx.fillStyle = p.color; ctx.shadowColor = p.color; ctx.shadowBlur = 10; 
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  },

  drawChickens: function() {
    var ctx = Game.ctx;
    if (!Game.chickens) return;
    for (var i = 0; i < Game.chickens.length; i++) {
      var c = Game.chickens[i];
      // 读取小鸡自身的大小
      var chickSize = c.size || 40;
      if (Game.player.isLizhi) chickSize *= 2; // 荔枝状态再翻倍
      
      if (Game.IMG.chicken_summon) {
        ctx.drawImage(Game.IMG.chicken_summon, c.x - chickSize/2, c.y - chickSize/2, chickSize, chickSize);
      } else {
        ctx.fillStyle = Game.player.isLizhi ? '#ff5500' : '#ffff00'; 
        ctx.beginPath(); 
        ctx.arc(c.x, c.y, chickSize/2, 0, Math.PI * 2); 
        ctx.fill();
        ctx.fillStyle = '#ff0000'; 
        ctx.fillRect(c.x - chickSize/6, c.y - chickSize/6, chickSize/3, chickSize/6); 
      }
    }
  },

  drawLightnings: function() {
    var ctx = Game.ctx;
    for (var i = 0; i < Game.lightnings.length; i++) {
      var ln = Game.lightnings[i], pts = ln.points;
      if (pts.length < 2) continue;
      var alpha = (ln.life - ln.age) < 0.6 ? (ln.life - ln.age) / 0.6 : 1;
      ctx.save();
      ctx.shadowColor = '#66ccff'; ctx.shadowBlur = 40; ctx.lineWidth = 16;
      ctx.strokeStyle = 'rgba(150, 220, 255, ' + alpha + ')';
      ctx.beginPath(); ctx.moveTo(pts[0].x + ln.offsetX, pts[0].y + ln.offsetY);
      for (var j = 1; j < pts.length; j++) ctx.lineTo(pts[j].x + ln.offsetX, pts[j].y + ln.offsetY);
      ctx.stroke();
      ctx.shadowBlur = 20; ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(255, 255, 255, ' + alpha + ')';
      ctx.stroke(); ctx.restore();
    }
  },

  drawPlayer: function() {
    var ctx = Game.ctx, p = Game.player;
    ctx.save();
    if (p.invuln > 0 && Math.floor(Game.time * 20) % 2 === 0) ctx.globalAlpha = 0.4;
    if (p.isSixArms) {
      if (Game.IMG.t6_qianshou_model && Game.IMG.t6_qianshou_model.width > 0) {
        ctx.drawImage(Game.IMG.t6_qianshou_model, p.x, p.y, p.w, p.h);
      } else { ctx.fillStyle = '#ffd700'; ctx.fillRect(p.x, p.y, p.w, p.h); }
    } else if (Game.IMG.kun_idle) {
      ctx.drawImage(Game.IMG.kun_idle, p.idleFrame * 64, 0, 64, 64, p.x, p.y, p.w, p.h);
    } else {
      ctx.drawImage(Game.IMG.kun, p.x, p.y, p.w, p.h);
    }
    ctx.restore();
  },

  drawChest: function() {
    if (!Game.chest.active) return;
    var ctx = Game.ctx, c = Game.chest;
    var img = c.opened ? Game.IMG.chest_open : Game.IMG.chest_closed;
    ctx.save(); ctx.shadowColor = '#ffd700'; ctx.shadowBlur = c.opened ? 40 : 20;
    ctx.drawImage(img, c.x, c.y, c.w, c.h); ctx.restore();
  },

  drawPortal: function() {
    if (!Game.portal.active) return;
    var ctx = Game.ctx, p = Game.portal;
    ctx.save(); ctx.translate(p.x, p.y);
    var pulse = 0.9 + Math.sin(p.t * 4) * 0.1;
    ctx.save(); ctx.rotate(p.angle); ctx.shadowColor = '#00ffff'; ctx.shadowBlur = 50;
    ctx.drawImage(Game.IMG.portal, -p.r / 2 * pulse, -p.r / 2 * pulse, p.r * pulse, p.r * pulse);
    ctx.restore(); ctx.restore();
  },

  drawTelegraph: function() {
    if (!Game.boss.active || Game.boss.state !== 'telegraph') return;
    var ctx = Game.ctx;
    ctx.save(); ctx.globalAlpha = 0.4; ctx.drawImage(Game.IMG.mabao_skill, 0, 0, Game.W, Game.H); ctx.restore();
  },

  drawUI: function() {
    var ctx = Game.ctx, p = Game.player;
    if (!p) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(15, 15, 270, 135);

    ctx.fillStyle = '#333'; ctx.fillRect(25, 25, 250, 22);
    ctx.fillStyle = '#e63946'; ctx.fillRect(25, 25, 250 * (p.hp / p.maxHp), 22);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(25, 25, 250, 22);
    ctx.font = 'bold 14px monospace'; ctx.fillStyle = '#fff'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('HP ' + Math.ceil(p.hp) + ' / ' + p.maxHp, 32, 36);

    ctx.fillStyle = '#ffd700'; ctx.fillText('LV ' + p.level, 25, 66);
    ctx.fillStyle = '#333'; ctx.fillRect(80, 58, 195, 14);
    ctx.fillStyle = '#00d4ff'; ctx.fillRect(80, 58, 195 * Math.min(1, p.exp / p.expNext), 14);
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.strokeRect(80, 58, 195, 14);
    ctx.font = '11px monospace'; ctx.fillStyle = '#fff';
    ctx.fillText('EXP ' + p.exp + ' / ' + p.expNext, 82, 88);

    ctx.fillStyle = '#aaa'; ctx.font = '12px monospace';
    if (Game.state === 'LEVEL2') {
      var dist = Math.max(0, 4000 - Game.level2.cameraX);
      ctx.fillText('目标: 华强  距离: ' + Math.floor(dist) + 'm', 25, 105);
    } else {
      ctx.fillText('波次 ' + Game.wave + '   场上奶龙 ' + Game.enemies.length, 25, 105);
    }

    var iconY = 130;
    if (Game.IMG.ball_nailong) ctx.drawImage(Game.IMG.ball_nailong, 25, iconY - 10, 20, 20);
    else { ctx.fillStyle = '#ffdd00'; ctx.beginPath(); ctx.arc(35, iconY, 10, 0, Math.PI*2); ctx.fill(); }
    
    ctx.fillStyle = p.ballMode === 'nailong' ? '#ffd700' : '#ffb347'; 
    if (p.ballMode === 'nailong') { ctx.shadowColor = '#ffd700'; ctx.shadowBlur = 10; }
    ctx.font = 'bold 14px monospace'; ctx.fillText('x ' + p.nailongBalls, 55, iconY); ctx.shadowBlur = 0;
    
    ctx.font = '12px monospace';
    if (p.ballMode === 'nailong') { ctx.fillStyle = '#ffd700'; ctx.fillText('(奶龙球模式)', 100, iconY); }
    else { ctx.fillStyle = '#555'; ctx.fillText('(普通篮球模式)', 100, iconY); }
    ctx.fillStyle = '#aaa'; ctx.font = '10px monospace'; ctx.fillText('[按 X 切换]', 200, iconY);
    
    // 技能栏
    for (var i = 0; i < Game.unlockedTalents.length; i++) {
      var t = Game.unlockedTalents[i];
      var ty = 170 + i * 60;
      var lv = Game.talentLevels[t.id] || 1;
      if (Game.IMG[t.icon]) ctx.drawImage(Game.IMG[t.icon], 25, ty, 40, 40);
      
      ctx.fillStyle = '#fff'; ctx.font = 'bold 16px monospace';
      ctx.fillText('[' + t.key + '] Lv.' + lv, 75, ty + 25);
      
      var cd = Game.talentCD[t.id] || 0;
      if (cd > 0) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(25, ty, 40, 40);
        ctx.fillStyle = '#fff'; ctx.font = '12px monospace';
        ctx.fillText(Math.ceil(cd) + 's', 32, ty + 24);
      }
    }
    ctx.restore();

    if (Game.boss.active) {
      var b = Game.boss, barW = 540, barH = 26;
      var barX = (Game.W - barW) / 2, barY = 100;
      ctx.save();
      ctx.fillStyle = '#555'; ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#e63946'; ctx.fillRect(barX, barY, barW * Math.max(0, b.hp / b.maxHp), barH);
      ctx.strokeStyle = '#fff'; ctx.strokeRect(barX, barY, barW, barH);
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.font = '12px monospace'; 
      ctx.fillText(Math.ceil(b.hp) + ' / ' + b.maxHp, Game.W / 2, barY + 13);
      
      ctx.font = 'bold 14px monospace'; ctx.textBaseline = 'bottom';
      ctx.fillText('马保国 · 阶段 ' + b.phase, Game.W / 2, barY - 6);
      var dotR = 10, dotSpacing = 28;
      var dotsStartX = Game.W / 2 - dotSpacing / 2, dotY = barY + barH + 18;
      for (var i = 0; i < 2; i++) {
        var cx = dotsStartX + i * dotSpacing;
        ctx.beginPath(); ctx.arc(cx, dotY, dotR, 0, Math.PI * 2);
        if (i < b.lives) { ctx.fillStyle = '#ff2222'; ctx.shadowColor = '#ff2222'; ctx.shadowBlur = 10; }
        else { ctx.fillStyle = '#444444'; ctx.shadowBlur = 0; }
        ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
      }
      ctx.restore();
    }
  },

  drawBookPreview: function() {
    if (Game.state !== 'BOOK_PREVIEW') return;
    var ctx = Game.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, Game.W, Game.H);
    var pulse = 30 + Math.sin(Date.now() * 0.005) * 20;
    ctx.shadowColor = '#ffd700'; ctx.shadowBlur = pulse;
    ctx.drawImage(Game.IMG.book_closed, Game.W * 0.2 - 100, Game.H/2 - 140, 200, 280);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#fff'; ctx.font = 'bold 32px monospace'; ctx.textAlign = 'left';
    ctx.fillText(Game.SkillData.learnLightning.name, Game.W * 0.45, Game.H/2 - 100);
    ctx.font = '18px monospace'; ctx.fillStyle = '#ccc';
    var descArray = Game.SkillData.learnLightning.desc;
    if (typeof descArray === 'string') descArray = [descArray];
    for (var i = 0; i < descArray.length; i++) ctx.fillText(descArray[i], Game.W * 0.45, Game.H/2 - 40 + i * 30);
    ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center'; ctx.font = 'bold 24px monospace';
    ctx.fillText('按 R 领悟 / 按 ESC 放弃', Game.W / 2, Game.H - 100);
  },

  drawMeditating: function() {
    if (Game.state !== 'MEDITATING') return;
    var ctx = Game.ctx, learn = Game.SkillData.learnLightning;
    ctx.fillStyle = '#111'; ctx.fillRect(0, 0, Game.W, Game.H);
    if (Game.IMG.book_ui && Game.IMG.book_ui.src.indexOf('data:image') === -1) ctx.drawImage(Game.IMG.book_ui, Game.W/2 - 400, Game.H - 500, 800, 600);
    if (Game.IMG.panda_virus && Game.IMG.panda_virus.src.indexOf('data:image') === -1) ctx.drawImage(Game.IMG.panda_virus, Game.W/2 - 150, Game.H/2 - 50, 300, 300);
    for(var i = 0; i < learn.errorPopups.length; i++) {
      var p = learn.errorPopups[i];
      if (Game.IMG.error_popup) ctx.drawImage(Game.IMG.error_popup, p.x, p.y, p.w, p.h);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(Game.W/2 - 100, 30, 200, 60);
    ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 4; ctx.strokeRect(Game.W/2 - 100, 30, 200, 60);
    ctx.fillStyle = '#ff0000'; ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('倒计时: ' + Math.ceil(learn.meditationTime) + 's', Game.W/2, 60);

    var barW = Game.W * 0.5, barH = 20, barX = (Game.W - barW) / 2, barY = 100;
    var visualRatio = (15 - learn.meditationTime) / 10; 
    if (visualRatio > 1) visualRatio = 1; if (visualRatio < 0) visualRatio = 0;

    ctx.fillStyle = 'rgba(50, 50, 50, 0.8)'; ctx.fillRect(barX, barY, barW, barH);
    ctx.fillStyle = '#ff0000'; ctx.fillRect(barX, barY, barW * visualRatio, barH);
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.strokeRect(barX, barY, barW, barH);

    ctx.font = 'bold 28px "Microsoft YaHei", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    if (Math.sin(Date.now() / 150) > 0) { ctx.fillStyle = '#ff0000'; ctx.globalAlpha = 1.0; }
    else { ctx.fillStyle = '#ffff00'; ctx.globalAlpha = 0.6; }
    if (visualRatio < 1) ctx.fillText('【 领悟中... 】', Game.W / 2, barY + barH + 15);
    else ctx.fillText('【 领悟完成，按任意键退出！】', Game.W / 2, barY + barH + 15);
    ctx.globalAlpha = 1.0; 
  },

  drawGameOver: function() {
    if (Game.state !== 'GAMEOVER') return;
    var ctx = Game.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, Game.W, Game.H);
    var dw = Math.max(Game.W * 0.70, 600), dh = dw / 2;
    var drop = Math.min(1, Game.gameOverTime / 0.35);
    var scale = 0.4 + 0.6 * drop;
    var shakeAmp = Math.max(4, 14 - Game.gameOverTime * 1.2);
    var jx = (Math.random() - 0.5) * shakeAmp, jy = (Math.random() - 0.5) * shakeAmp;
    ctx.save(); ctx.translate(Game.W / 2 + jx, Game.H / 2 - 50 + jy); ctx.scale(scale, scale);
    ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 60; ctx.drawImage(Game.IMG.death, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
    ctx.fillStyle = '#fff'; ctx.font = 'bold 28px monospace'; ctx.textAlign = 'center';
    ctx.fillText('按 R 键重新开始', Game.W / 2, Game.H / 2 + dh / 2 + 10);
  },

  drawTalentSelect: function() {
    if (Game.state !== 'TALENT_SELECT') return;
    var ctx = Game.ctx;
    ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, Game.W, Game.H);
    ctx.fillStyle = '#ffd700'; ctx.font = 'bold 40px monospace'; ctx.textAlign = 'center';
    ctx.fillText('选择天赋', Game.W / 2, 100);

    Game.talentCards = [];
    var cardW = 220, cardH = 300, gap = 40;
    var startX = (Game.W - (cardW * 3 + gap * 2)) / 2;
    var startY = Game.H / 2 - cardH / 2;

    for (var i = 0; i < Game.currentTalentChoices.length; i++) {
      var t = Game.currentTalentChoices[i];
      var cx = startX + i * (cardW + gap);
      var currentLv = Game.talentLevels[t.id] || 0;
      var descText = t.desc + (currentLv > 0 ? " (已升级 -> Lv." + (currentLv+1) + ")" : "");

      Game.talentCards.push({ x: cx, y: startY, w: cardW, h: cardH, talent: t });

      ctx.fillStyle = 'rgba(30, 30, 30, 0.9)';
      ctx.fillRect(cx, startY, cardW, cardH);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.strokeRect(cx, startY, cardW, cardH);

      if (Game.IMG[t.icon]) ctx.drawImage(Game.IMG[t.icon], cx + cardW / 2 - 40, startY + 40, 80, 80);
      
      ctx.fillStyle = '#ffd700'; ctx.font = 'bold 24px "Microsoft YaHei"'; ctx.textAlign = 'center';
      ctx.fillText(t.name, cx + cardW / 2, startY + 160);
      
      ctx.fillStyle = '#ccc'; ctx.font = '16px "Microsoft YaHei"';
      ctx.fillText(descText, cx + cardW / 2, startY + 200);
    }
  },

  renderAll: function() {
    var ctx = Game.ctx;
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, Game.W, Game.H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, Game.W, Game.H);

    if (Game.state === 'MENU') { this.drawMenu(); return; }
    if (Game.state === 'RANK') { this.drawRank(); return; }

    if (Game.state === 'LEVEL2' || Game.state === 'DIALOGUE') {
      Game.level2.render();
      
      // 👇 核心修复：在第二关也渲染出召唤的小鸡！
      this.drawChickens(); 
      
      this.drawUI();
      if (Game.currentSkill && Game.currentSkill.effect) {
        Game.currentSkill.effect.renderUI();
        Game.currentSkill.effect.renderSkillEffect();
      }
      Game.level2.renderUI();
      if (Game.state === 'DIALOGUE') this.drawDialogue(); 
      return;
    }

    this.drawBackground();
    ctx.save();
    if (Game.shakeTime > 0) {
      var mag = Game.shakeMag * Math.min(1, Game.shakeTime / 0.3);
      ctx.translate((Math.random() - 0.5) * mag, (Math.random() - 0.5) * mag);
    }
    this.drawEnemies(); this.drawBoss(); this.drawBullets(); this.drawParticles();
    this.drawLightnings(); this.drawPlayer(); this.drawChest(); this.drawPortal();
    this.drawChickens(); 
    ctx.restore();

    if (Game.state !== 'loading') {
      this.drawUI();
      if (Game.currentSkill && Game.currentSkill.effect) {
        Game.currentSkill.effect.renderUI();
        Game.currentSkill.effect.renderSkillEffect(); 
      }
    }
    this.drawTelegraph(); this.drawBookPreview(); this.drawMeditating(); this.drawGameOver();
  
    if (Game.toastTimer > 0 && Game.toastText) {
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = '#ffd700'; ctx.font = 'bold 24px "Microsoft YaHei"'; ctx.textAlign = 'center';
      ctx.shadowColor = '#000'; ctx.shadowBlur = 8;
      var screenX = Game.W / 2, screenY = Game.H / 2 - 100;
      if (Game.state === 'LEVEL2' && Game.level2) {
        screenX = Game.player.x - Game.level2.cameraX + Game.player.w / 2;
        screenY = Game.player.y - 60;
      }
      ctx.fillText(Game.toastText, screenX, screenY);
      ctx.restore();
    }
    this.drawTalentSelect();
  }
};