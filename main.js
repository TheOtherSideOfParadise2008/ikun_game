window.Game = window.Game || {};

Game.state = 'loading'; Game.toastText = ''; Game.toastTimer = 0;
Game.wave = 1; Game.time = 0; Game.waveExp = 0; Game.bossSpawned = false; Game.bossMode = false;
Game.shakeTime = 0; Game.shakeMag = 0; Game.gameOverTime = 0; Game.spawnTimer = 0;

Game.canvas = document.getElementById('game'); Game.ctx = Game.canvas.getContext('2d');
Game.W = 0; Game.H = 0; Game.IMG = {}; Game.AUDIO = {};
Game.bullets = []; Game.enemies = []; Game.lightnings = []; Game.upgradeCards = []; Game.particles = [];
Game.keys = Object.create(null);

Game.chest = { active: false, opened: false, x: 0, y: 0, w: 100, h: 100, grace: 0, waitTime: 0 };
Game.portal = { active: false, x: 0, y: 0, r: 140, angle: 0, t: 0, grace: 0 };

Game.Utils = {
  clamp: function(v, a, b) { return v < a ? a : (v > b ? b : v); },
  rand: function(a, b) { return a + Math.random() * (b - a); },
  aabb: function(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; },
  pointSegDist: function(px, py, ax, ay, bx, by) {
    var dx = bx - ax, dy = by - ay, l2 = dx * dx + dy * dy;
    if (l2 === 0) return Math.hypot(px - ax, py - ay);
    var t = ((px - ax) * dx + (py - ay) * dy) / l2; t = Game.Utils.clamp(t, 0, 1);
    return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
  }
};

Game.triggerShake = function(t, m) {
  if (t > Game.shakeTime) Game.shakeTime = t;
  if (m > Game.shakeMag) Game.shakeMag = m;
};

function resizeCanvas() {
  Game.W = Game.canvas.width = window.innerWidth;
  Game.H = Game.canvas.height = window.innerHeight;
  Game.ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', function () {
  resizeCanvas();
  if (Game.player) {
    Game.player.x = Game.Utils.clamp(Game.player.x, 0, Math.max(0, Game.W - Game.player.w));
    Game.player.y = Game.Utils.clamp(Game.player.y, 0, Math.max(0, Game.H - Game.player.h));
  }
});
resizeCanvas();

var loadedCount = 0;
var totalAssets = Object.keys(Game.DATA.ASSETS).length + Object.keys(Game.DATA.AUDIO_SRCS).length;

function makePlaceholder(w, h, color) {
  var c = document.createElement('canvas'); c.width = w; c.height = h;
  var g = c.getContext('2d'); g.fillStyle = color; g.fillRect(0, 0, w, h);
  return c;
}

function tryDecLoad() {
  loadedCount++;
  if (loadedCount >= totalAssets) { Game.state = 'MENU'; lastTime = 0; }
}

function loadAll() {
  Object.keys(Game.DATA.ASSETS).forEach(function (key) {
    var def = Game.DATA.ASSETS[key]; var img = new Image();
    img.onload = function () { Game.IMG[key] = img; tryDecLoad(); };
    img.onerror = function () { Game.IMG[key] = makePlaceholder(def.w, def.h, def.color); tryDecLoad(); };
    img.src = def.src;
  });
  Object.keys(Game.DATA.AUDIO_SRCS).forEach(function (key) {
    var a = new Audio(); var finished = false;
    function finish() {
      if (finished) return; finished = true;
      if (key === 'bgm') { a.loop = true; a.volume = 0.3; }
      Game.AUDIO[key] = a; tryDecLoad();
    }
    a.addEventListener('canplaythrough', finish, { once: true });
    a.addEventListener('error', finish, { once: true });
    a.src = Game.DATA.AUDIO_SRCS[key]; setTimeout(finish, 3000);
  });
}

window.addEventListener('keydown', function (e) {
  var k = e.key.toLowerCase();
  
  if (['1','2','3','4','5'].includes(k) && Game.state !== 'MENU' && Game.state !== 'RANK' && Game.state !== 'TALENT_SELECT') {
    if (Game.unlockedTalents && Game.unlockedTalents.length > 0) {
      var talent = Game.unlockedTalents.find(function(t) { return t.key === k; });
      if (talent && (!Game.talentCD[talent.id] || Game.talentCD[talent.id] <= 0)) {
        var lv = Game.talentLevels[talent.id] || 1;
                if (talent && (!Game.talentCD[talent.id] || Game.talentCD[talent.id] <= 0)) {
          var lv = Game.talentLevels[talent.id] || 1;
          
          // 👇 核心修改：根据技能 ID 分配基础冷却时间
          var baseCD = 15; 
          if (talent.id === 't1') baseCD = 20;      // 遭到抱婴（全屏清怪，CD最长）
          else if (talent.id === 't2') baseCD = 10; // 人参公鸡（短无敌，CD短一点）
          else if (talent.id === 't3') baseCD = 14; // ikun开团（持续输出）
          else if (talent.id === 't4') baseCD = 10; // 怎么荔枝（极强Buff）
          else if (talent.id === 't5') baseCD = 8; // 千手鲲音（极强Buff）

          // 荔枝状态下冷却减半
          var cdTime = (Game.player.isLizhi ? baseCD / 2 : baseCD); 
          Game.talentCD[talent.id] = cdTime; 
                }
        
        if (talent.id === 't1') {
          var count = Game.enemies.length;
          Game.enemies = [];
          for (var i = 0; i < count; i++) {
            Game.player.gainExp(Game.DATA.ENEMY_EXP_REWARD* lv);
            Game.player.nailongBalls += 1;
          }
          Game.toastText = "你会遭到抱婴的！"; 
          Game.toastTimer = 2.0;
        } 
        else if (talent.id === 't2') { 
          Game.player.invuln = 2 + lv; 
          if (Game.player.isLizhi) invincibleTime *= 2; 
          
          Game.player.invuln = invincibleTime; 
          Game.toastText = invincibleTime + "秒无敌！"; 
          Game.toastTimer = 2.0; 
        }
        else if (talent.id === 't3') {
          Game.chickens = [];
          var chickenCount = 10 + lv * 20;
          var spawnRadius = 120; 
          for (var i = 0; i < chickenCount; i++) {
            var angle = (Math.PI * 2 / chickenCount) * i;
            Game.chickens.push({
              x: Game.player.x + Math.cos(angle) * spawnRadius,
              y: Game.player.y + Math.sin(angle) * spawnRadius,
              target: null,
              size: 40 + (lv - 1) * 15,
              damage: 50 + (lv - 1) * 20
            });
          }
          Game.toastText = "ikun开团！ " ; 
          Game.toastTimer = 2.0;
        }
        else if (talent.id === 't4') { 
          Game.player.isLizhi = true; 
          Game.player.lizhiTimer = 4 + lv * 2; 
          Game.toastText = "你叫我怎么荔枝！"; 
          Game.toastTimer = 2.0; 
        }
        else if (talent.id === 't5') { 
          var armsTime = 4 + lv * 2;
          if (Game.player.isLizhi) armsTime *= 2;
          Game.player.isSixArms = true; 
          Game.player.sixArmsTimer = 4 + lv * 2; 
          Game.toastText = "千手鲲音！"; 
          Game.toastTimer = 2.0; 
        }
        return; 
      }
    }
  }

  if (Game.state === 'TALENT_SELECT') return; 
  if (Game.state === 'MENU') {
    if (k === '1') startGame();
    else if (k === '2') Game.state = 'RANK';
    return; 
  }
  if (Game.state === 'RANK') {
    if (k === 'escape' || k === '2') Game.state = 'MENU';
    return;
  }
  if (Game.state === 'DIALOGUE') {
    if (k === '1') {
      if (Game.player.nailongBalls >= 1300) {
        Game.player.nailongBalls -= 1300; Game.toastText = "交易成功！"; Game.toastTimer = 3.0; 
        Game.state = 'LEVEL2'; Game.level2.bossTriggered = true; Game.level2.showDialogueHint = false; Game.level2.stallX = -9999;
      } else {
        Game.state = 'LEVEL2'; Game.level2.bossTriggered = true; Game.level2.bossActive = true; Game.level2.triggerBossFight(); 
      }
    } else if (k === '2') {
      Game.state = 'LEVEL2'; Game.level2.bossTriggered = true; Game.level2.bossActive = true; Game.level2.showDialogueHint = false; Game.level2.triggerBossFight(); 
    }
    return;
  }

  // 记录按键，注意空格要保证记录到
  Game.keys[k] = true;
  
  if (k === 'l') {
    if (Game.state === 'PLAYING' || Game.state === 'LEVEL2') {
      if (Game.AUDIO.bgm) Game.AUDIO.bgm.pause(); 
      Game.level2.init(); Game.state = 'LEVEL2'; Game.audio.playSfx('kun_shoot');
    }
    return; 
  }

  if (Game.state === 'BOOK_PREVIEW' || Game.state === 'MEDITATING') {
    if (Game.currentSkill && Game.currentSkill.learn) Game.currentSkill.learn.handleKeyDown(e, k);
    return; 
  }

  if (Game.state === 'PLAYING' || Game.state === 'LEVEL2') {
    if (k === 'x' && Game.state === 'PLAYING') {
      if (Game.player.nailongBalls > 0) Game.player.ballMode = Game.player.ballMode === 'normal' ? 'nailong' : 'normal';
    }
    if (k === 'q') {
      if (Game.currentSkill && Game.currentSkill.effect) Game.currentSkill.effect.cast();
    }
    // 为空格按键记录开火意图，哪怕下一帧就松开了也不会漏掉输入
    if (k === ' ') {
      if (Game.player) Game.player.wantsToShoot = true;
      e.preventDefault();
    }
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
  }

  if (k === 'r' && Game.state === 'GAMEOVER') restartGame();
});

window.addEventListener('keyup', function (e) { Game.keys[e.key.toLowerCase()] = false; });

window.addEventListener('mousedown', function (e) {
  var rect = Game.canvas.getBoundingClientRect();
  var mx = (e.clientX - rect.left) * (Game.W / rect.width);
  var my = (e.clientY - rect.top) * (Game.H / rect.height);

  if (Game.state === 'TALENT_SELECT') {
    if (Game.talentCards) {
      for (var i = 0; i < Game.talentCards.length; i++) {
        var c = Game.talentCards[i];
        if (mx >= c.x && mx <= c.x + c.w && my >= c.y && my <= c.y + c.h) {
          var existing = Game.unlockedTalents.find(function(t) { return t.id === c.talent.id; });
          if (existing) {
            Game.talentLevels[existing.id] = (Game.talentLevels[existing.id] || 1) + 1;
          } else {
            Game.unlockedTalents.push(c.talent);
            Game.talentLevels[c.talent.id] = 1;
          }
          Game.state = 'PLAYING'; Game.talentCards = null; return;
        }
      }
    }
    return;
  }
  if (Game.state === 'MENU') {
    if (Game.btnStart && mx >= Game.btnStart.x && mx <= Game.btnStart.x + Game.btnStart.w && my >= Game.btnStart.y && my <= Game.btnStart.y + Game.btnStart.h) startGame();
    else if (Game.btnRank && mx >= Game.btnRank.x && mx <= Game.btnRank.x + Game.btnRank.w && my >= Game.btnRank.y && my <= Game.btnRank.y + Game.btnRank.h) Game.state = 'RANK';
    return;
  }
  if (Game.state === 'RANK') {
    if (Game.btnBack && mx >= Game.btnBack.x && mx <= Game.btnBack.x + Game.btnBack.w && my >= Game.btnBack.y && my <= Game.btnBack.y + Game.btnBack.h) Game.state = 'MENU';
    return;
  }
  if (Game.state === 'MEDITATING') {
    if (Game.currentSkill && Game.currentSkill.learn) Game.currentSkill.learn.handleKeyDown(e, 'mouse'); 
    return;
  }
});

function updateBullets(dt) {
  for (var i = Game.bullets.length - 1; i >= 0; i--) {
    var b = Game.bullets[i]; b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < -150 || b.x > Game.W + 150 || b.y < -150 || b.y > Game.H + 150) Game.bullets.splice(i, 1);
  }
}

function checkBulletCollisions() {
  for (var i = Game.bullets.length - 1; i >= 0; i--) {
    var b = Game.bullets[i], hit = false;
    for (var j = Game.enemies.length - 1; j >= 0; j--) {
      if (Game.Utils.aabb(b, Game.enemies[j])) {
        var e = Game.enemies[j]; e.hp -= b.dmg;
        if (b.isNailongBall) {
          var aoeRadius = 120; 
          for(var p=0; p<20; p++) {
            var angle = Math.random() * Math.PI * 2, spd = 50 + Math.random() * 150;
            Game.particles.push({
              x: b.x + b.w/2, y: b.y + b.h/2, vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
              size: 3 + Math.random() * 5, life: 0.3 + Math.random() * 0.3, maxLife: 0.6, color: '#ffdd00' 
            });
          }
          for (var k = Game.enemies.length - 1; k >= 0; k--) {
            if (k === j) continue;
            var target = Game.enemies[k];
            var dist = Math.hypot(target.x + target.w/2 - (b.x + b.w/2), target.y + target.h/2 - (b.y + b.h/2));
            if (dist <= aoeRadius) {
              target.hp -= b.dmg * 0.5; 
              if (target.hp <= 0) { Game.enemies.splice(k, 1); Game.player.gainExp(Game.DATA.ENEMY_EXP_REWARD); Game.player.nailongBalls += 1; }
            }
          }
        }
        if (e.hp <= 0) {
          Game.enemies.splice(j, 1); Game.player.gainExp(Game.DATA.ENEMY_EXP_REWARD); Game.player.nailongBalls += 1; Game.audio.playSfx('nailong1');
        }
        hit = true; break;
      }
    }
    if (!hit && Game.boss.active && Game.Utils.aabb(b, Game.boss)) { Game.boss.takeDamage(b.dmg); hit = true; }
    if (hit) Game.bullets.splice(i, 1);
  }
}

function update(dt) {
  if (isNaN(dt) || dt <= 0) return;
  if (Game.state === 'TALENT_SELECT' || Game.state === 'MENU' || Game.state === 'RANK') return;
  if (Game.toastTimer > 0) Game.toastTimer -= dt;

  for (var key in Game.talentCD) { if (Game.talentCD[key] > 0) Game.talentCD[key] -= dt; }

  // 小鸡更新
  if (Game.chickens && Game.chickens.length > 0) {
    for (var i = Game.chickens.length - 1; i >= 0; i--) {
      var chick = Game.chickens[i];
      var chickSize = Game.player.isLizhi ? 80 : (chick.size || 40);
      var chickDamage = Game.player.isLizhi ? 100 : (chick.damage || 50);

      var closestDist = Infinity, closestTarget = null;
      for (var j = 0; j < Game.enemies.length; j++) {
        var e = Game.enemies[j];
        var d = Math.hypot((e.x + e.w/2) - chick.x, (e.y + e.h/2) - chick.y);
        if (d < closestDist) { closestDist = d; closestTarget = e; }
      }
      if (Game.boss.active) {
        var d = Math.hypot((Game.boss.x + Game.boss.w/2) - chick.x, (Game.boss.y + Game.boss.h/2) - chick.y);
        if (d < closestDist) { closestDist = d; closestTarget = Game.boss; }
      }
      if (Game.huaqiangBoss && Game.huaqiangBoss.active) {
        var d = Math.hypot((Game.huaqiangBoss.x + Game.huaqiangBoss.w/2) - chick.x, (Game.huaqiangBoss.y + Game.huaqiangBoss.h/2) - chick.y);
        if (d < closestDist) { closestDist = d; closestTarget = Game.huaqiangBoss; }
      }
      if (Game.watermelonBoss && Game.watermelonBoss.active) {
        var d = Math.hypot((Game.watermelonBoss.x + Game.watermelonBoss.w/2) - chick.x, (Game.watermelonBoss.y + Game.watermelonBoss.h/2) - chick.y);
        if (d < closestDist) { closestDist = d; closestTarget = Game.watermelonBoss; }
      }
      
      chick.target = closestTarget;

      if (chick.target) {
        var dx = (chick.target.x + chick.target.w/2) - chick.x;
        var dy = (chick.target.y + chick.target.h/2) - chick.y;
        var dist = Math.hypot(dx, dy);
        if (dist > 0) {
          chick.x += (dx / dist) * 200 * dt; 
          chick.y += (dy / dist) * 200 * dt;
        }
      } else {
        chick.y -= 100 * dt; 
        if (chick.y < -100) Game.chickens.splice(i, 1);
      }

      var chickRect = { x: chick.x - chickSize/2, y: chick.y - chickSize/2, w: chickSize, h: chickSize };
      var hit = false;

      for (var j = Game.enemies.length - 1; j >= 0; j--) {
        if (Game.Utils.aabb(chickRect, Game.enemies[j])) {
          Game.enemies[j].hp -= chickDamage;
          if (Game.enemies[j].hp <= 0) {
            Game.enemies.splice(j, 1);
            Game.player.gainExp(Game.DATA.ENEMY_EXP_REWARD);
            Game.player.nailongBalls += 1;
          }
          hit = true; break;
        }
      }

      if (!hit && Game.boss.active && Game.Utils.aabb(chickRect, Game.boss)) {
        Game.boss.takeDamage(chickDamage); hit = true;
      }
      if (!hit && Game.huaqiangBoss && Game.huaqiangBoss.active && Game.Utils.aabb(chickRect, Game.huaqiangBoss)) {
        Game.huaqiangBoss.takeDamage(chickDamage); hit = true;
      }
      if (!hit && Game.watermelonBoss && Game.watermelonBoss.active && Game.Utils.aabb(chickRect, Game.watermelonBoss)) {
        Game.watermelonBoss.takeDamage(chickDamage); hit = true;
      }

      if (hit) Game.chickens.splice(i, 1);
    }
  }

  if (Game.state === 'DIALOGUE') return;
  if (Game.state === 'LEVEL2') {
    Game.level2.update(dt);
    if (Game.currentSkill && Game.currentSkill.effect) Game.currentSkill.effect.update(dt);
    return;
  }

      if (Game.state === 'GAMEOVER') {
      Game.gameOverTime += dt;
      if (!Game._scoreSaved) {
        Game._scoreSaved = true; 
        
        var finalScore = Game.player.level * 10 + Game.wave * 10 + Game.player.nailongBalls * 100;
        
        // 👇 核心修复：先判断 nameBox 存不存在
        var nameBox = document.getElementById('nameBox');
        var submitBtn = document.getElementById('submitNameBtn');
        
        if (nameBox && submitBtn) {
          nameBox.style.display = 'block';
          submitBtn.onclick = function() {
            var inputVal = document.getElementById('playerNameInput').value;
            var playerName = inputVal ? inputVal.trim() : "无名氏";
            if (!playerName) playerName = "无名氏";

            var now = new Date();
            var timeStr = (now.getMonth() + 1) + '-' + now.getDate() + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');

            try {
              var rankData = JSON.parse(localStorage.getItem('game_rank') || '[]');
              rankData.push({ name: playerName, score: finalScore, time: timeStr });
              rankData.sort(function(a, b) { return b.score - a.score; }); 
              if (rankData.length > 50) rankData.length = 50; 
              localStorage.setItem('game_rank', JSON.stringify(rankData));
            } catch (e) {
              console.error("存储失败：", e);
            }
            
            nameBox.style.display = 'none'; 
          };
        } else {
          // 如果 HTML 元素不存在，自动降级使用 prompt
          var playerName = prompt('游戏结束！请输入你的大名：', '无名氏');
          if (!playerName) playerName = "无名氏";
          var now = new Date();
          var timeStr = (now.getMonth() + 1) + '-' + now.getDate() + ' ' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
          var rankData = JSON.parse(localStorage.getItem('game_rank') || '[]');
          rankData.push({ name: playerName, score: finalScore, time: timeStr });
          rankData.sort(function(a, b) { return b.score - a.score; }); 
          if (rankData.length > 50) rankData.length = 50; 
          localStorage.setItem('game_rank', JSON.stringify(rankData));
        }
      }
      return;
    }




  if (Game.state === 'BOOK_PREVIEW') { if (Game.currentSkill && Game.currentSkill.learn) Game.currentSkill.learn.updatePreview(dt); return; }
  if (Game.state === 'MEDITATING') { if (Game.currentSkill && Game.currentSkill.learn) Game.currentSkill.learn.updateMeditation(dt); return; }
  if (Game.state !== 'PLAYING') return;

  Game.time += dt;
  if (!Game.bossSpawned && (Game.player.level >= 7)) Game.boss.spawn(); 

  if (Game.shakeTime > 0) Game.shakeTime -= dt;
  if (Game.player.invuln > 0) Game.player.invuln -= dt;
  if (Game.player.hitFlash > 0) Game.player.hitFlash -= dt;

  Game.player.update(dt);
  Game.player.updateShooting(dt);
  updateBullets(dt);
  
  for (var i = Game.particles.length - 1; i >= 0; i--) {
    var p = Game.particles[i]; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.95; p.vy *= 0.95; p.life -= dt;
    if (p.life <= 0) Game.particles.splice(i, 1);
  }

  Game.enemy.updateSpawner(dt);
  Game.enemy.update(dt);

  if (Game.boss.active) Game.boss.update(dt);
  if (Game.chest.active) Game.boss.updateChest(dt);
  if (Game.portal.active) Game.boss.updatePortal(dt);

  Game.boss.updateLightnings(dt);
  checkBulletCollisions();

  if (Game.currentSkill && Game.currentSkill.effect) Game.currentSkill.effect.update(dt);
}

var lastTime = 0;
function gameLoop(timestamp) {
  requestAnimationFrame(gameLoop);
  if (Game.state === 'loading') { lastTime = timestamp; Game.ui.drawLoadingScreen(loadedCount, totalAssets); return; }
  if (!lastTime) { lastTime = timestamp; return; }
  var dt = (timestamp - lastTime) / 1000; lastTime = timestamp;
  if (dt > 0.05) dt = 0.05; if (dt < 0) dt = 0;
  try { update(dt); Game.ui.renderAll(); } catch (err) { console.error("主循环报错: ", err); }
}

function startGame() {
  Game.player.resetPosition(); Game.spawnTimer = 0.5; lastTime = 0; Game.state = 'PLAYING'; 
  if (Game.audio.userInteracted) Game.audio.tryPlayBgm();
}

function restartGame() {
  Game._scoreSaved = false;
  Game.wave = 1; Game.waveExp = 0; Game.bossSpawned = false; Game.bossMode = false;
  Game.time = 0; Game.shakeTime = 0; Game.shakeMag = 0; Game.gameOverTime = 0; 
  Game.bullets.length = 0; Game.enemies.length = 0; Game.lightnings.length = 0; 
  Game.upgradeCards.length = 0; Game.particles.length = 0;
  Game.chest.active = false; Game.portal.active = false; Game.currentSkill = null; 
  if (Game.watermelons) Game.watermelons.length = 0; if (Game.watermelonDebris) Game.watermelonDebris.length = 0;
  if (Game.watermelonBoss) Game.watermelonBoss.active = false; if (Game.huaqiangBoss) Game.huaqiangBoss.active = false;

  Game.unlockedTalents = []; Game.talentCD = {}; Game.chickens = []; Game.talentLevels = {};
  
  Game.player.maxHp = 100; Game.player.hp = 100; Game.player.baseSpeed = 320;
  Game.player.speedMul = 1; Game.player.level = 0; Game.player.exp = 0; Game.player.expNext = 20;
  Game.player.fireTimer = 0; Game.player.fireRateMul = 1; Game.player.dmgMul = 1;
  Game.player.bulletSizeMul = 1; Game.player.ballMode = 'normal'; Game.player.nailongBalls = 0;
  Game.player.invuln = 1.0; Game.player.hitFlash = 0; Game.player.resetPosition();
  Game.player.isLizhi = false; Game.player.lizhiTimer = 0; Game.player.isSixArms = false; Game.player.sixArmsTimer = 0;
  Game.player.wantsToShoot = false;

  Game.boss.reset();
  Game.state = 'MENU';
  var nameBox = document.getElementById('nameBox');
  if (nameBox) nameBox.style.display = 'none';
}

Game.audio.init();
requestAnimationFrame(gameLoop);
loadAll();