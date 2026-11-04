window.Game = window.Game || {};

Game.level2 = {
  triggerBossFight: function() {
    Game.watermelonBoss.spawn(); Game.watermelonBoss.x = Game.player.x; 
    Game.huaqiangBoss.spawn(); Game.huaqiangBoss.x = Game.level2.cameraX + Game.W + 100; 
    Game.shakeTime = 0.3; Game.shakeMag = 20;
    this.bossActive = true;
  },

  init: function() {
    Game.keys = Object.create(null);
    this.gravity = 2000; this.moveSpeed = 350; this.jumpPower = 1500; 
    this.player = Game.player; 
    this.player.x = 100; this.player.y = Game.H - 300; this.player.vx = 0; this.player.vy = 0;
    this.player.hp = this.player.maxHp; this.player.invuln = 0;
    this.player.isGrounded = false; this.player.facing = 1; 
    this.player.wantsToShoot = false;

    Game.bullets = []; Game.enemies = []; Game.watermelons = []; Game.watermelonDebris = [];

    this.stallX = 1500; this.stallY = Game.H - 100 - 150; 
    this.showDialogueHint = false; this.bossTriggered = false;       
    
    if (Game.watermelonBoss) Game.watermelonBoss.active = false;
    if (Game.huaqiangBoss) Game.huaqiangBoss.active = false;

    this.fireTimer = 0; 
    this.levelData = [
      { type: 'ground', x: 0, y: Game.H - 100, w: 800, h: 200 },
      { type: 'gap', x: 800, w: 150 },
      { type: 'ground', x: 950, y: Game.H - 100, w: 600, h: 200 },
      { type: 'trap', x: 1200, y: Game.H - 120, w: 40, h: 20 },
      { type: 'ground', x: 1550, y: Game.H - 100, w: 3000, h: 200 } 
    ];
    this.cameraX = 0; this.targetCamX = 0; this.bossActive = false;
  },

  update: function(dt) {
    var p = this.player;
    if (Game.state === 'DIALOGUE') { p.vx = 0; p.vy = 0; return; }
    
    if (!this.bossTriggered && !this.showDialogueHint) {
      var dist = Math.abs(p.x - this.stallX);
      if (dist < 150) {
        this.showDialogueHint = true; this.bossTriggered = true; Game.state = 'DIALOGUE'; return;
      }
    }
    if (p.invuln > 0) p.invuln -= dt;

    p.vx = 0;
    if (Game.keys['a'] || Game.keys['arrowleft']) { p.vx = -this.moveSpeed; p.facing = -1; }
    if (Game.keys['d'] || Game.keys['arrowright']) { p.vx = this.moveSpeed; p.facing = 1; }

    if ((Game.keys['w'] || Game.keys['arrowup']) && p.isGrounded) { p.vy = -this.jumpPower; p.isGrounded = false; }

    this.fireTimer -= dt;
    if ((Game.keys[' '] || p.wantsToShoot) && this.fireTimer <= 0) {
      this.fireTimer = 0.15; 
      p.wantsToShoot = false;

      var isRight = p.facing !== -1;
      var bulletX = isRight ? p.x + p.w : p.x - 30;
      var bulletVx = isRight ? 800 : -800;
      Game.bullets.push({
        x: bulletX, y: p.y + p.h/2 - 15, w: 30, h: 30, vx: bulletVx, vy: 0, dmg: 15, imgKey: 'basketball'
      });
      Game.audio.playSfx('kun_shoot');
    }

    for (var i = Game.bullets.length - 1; i >= 0; i--) {
      var b = Game.bullets[i]; b.x += b.vx * dt;
      if (b.x > this.cameraX + Game.W + 300 || b.x < this.cameraX - 300) Game.bullets.splice(i, 1);
    }

    p.vy += this.gravity * dt; if (p.vy > 1500) p.vy = 1500; 
    p.x += p.vx * dt; p.y += p.vy * dt;
    if (isNaN(p.x) || isNaN(p.y)) { p.x = 100; p.y = Game.H - 300; p.vx = 0; p.vy = 0; }

    p.isGrounded = false;
    for (var i = 0; i < this.levelData.length; i++) {
      var obj = this.levelData[i];
      if (obj.type === 'ground') {
        if (p.x < obj.x + obj.w && p.x + p.w > obj.x && p.y < obj.y + obj.h && p.y + p.h > obj.y) {
          if (p.vy >= 0 && p.y + p.h - p.vy * dt <= obj.y + 10) {
            p.y = obj.y - p.h; p.vy = 0; p.isGrounded = true;
          }
        }
      } else if (obj.type === 'trap' && p.invuln <= 0) {
        if (p.x < obj.x + obj.w && p.x + p.w > obj.x && p.y < obj.y + obj.h && p.y + p.h > obj.y) {
          p.damage(20); p.vy = -400; p.vx = p.x > obj.x ? 300 : -300; 
        }
      }
    }

    if (p.y > Game.H + 100) {
      p.damage(20); p.x = p.x > 150 ? p.x - 150 : 50; p.y = Game.H - 300; p.vx = 0; p.vy = 0;
    }

    if (p.hp <= 0) { Game.state = 'GAMEOVER'; Game.gameOverTime = 0; return; }

    this.targetCamX = p.x - Game.W / 3;
    if (this.targetCamX < 0) this.targetCamX = 0;
    this.cameraX += (this.targetCamX - this.cameraX) * 10 * dt;

    if (this.bossActive) {
      if (Game.watermelonBoss.active) { Game.watermelonBoss.update(dt); Game.updateWatermelons(dt); }
      if (Game.huaqiangBoss.active) { Game.huaqiangBoss.update(dt); }

      for (var i = Game.enemies.length - 1; i >= 0; i--) {
        var e = Game.enemies[i];
        e.vy += this.gravity * dt; if (e.vy > 1500) e.vy = 1500;
        e.x += e.vx * dt; e.y += e.vy * dt;
        var groundY = Game.H - 100;
        if (e.y + e.h > groundY) { e.y = groundY - e.h; e.vy = 0; }
        if (Math.random() < 0.02) e.vx *= -1;
        if (e.x < this.cameraX - 500 || e.x > this.cameraX + Game.W + 500) e.vx *= -1;

        if (p.invuln <= 0 && Game.Utils.aabb(e, p)) {
          p.damage(10); e.vx *= -1;
        }
      }

      for (var i = Game.bullets.length - 1; i >= 0; i--) {
        var b = Game.bullets[i]; var hit = false;
        if (Game.huaqiangBoss.active && Game.Utils.aabb(b, Game.huaqiangBoss)) {
          Game.huaqiangBoss.takeDamage(b.dmg); hit = true;
        } else if (Game.watermelonBoss.active && Game.Utils.aabb(b, Game.watermelonBoss)) {
          Game.watermelonBoss.takeDamage(b.dmg); hit = true;
        } else {
          for (var j = Game.enemies.length - 1; j >= 0; j--) {
            if (Game.Utils.aabb(b, Game.enemies[j])) {
              Game.enemies[j].hp -= b.dmg;
              if (Game.enemies[j].hp <= 0) { Game.enemies.splice(j, 1); Game.player.nailongBalls += 1; }
              hit = true; break;
            }
          }
        }
        if (hit) Game.bullets.splice(i, 1);
      }
    }
    if (p.vx === 0 && p.isGrounded) {
      p.idleTimer += dt;
      if (p.idleTimer > p.idleSpeed) { p.idleTimer = 0; p.idleFrame = (p.idleFrame + 1) % 6; }
    } else { p.idleFrame = 0; p.idleTimer = 0; }
  },

  render: function() {
    var ctx = Game.ctx;
    if (!Game.W || !Game.H || isNaN(this.cameraX)) return;
    ctx.save();

    ctx.fillStyle = '#87CEEB'; ctx.fillRect(0, 0, Game.W, Game.H);
    var bgOffset1 = -(this.cameraX * 0.2) % Game.W;
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    for (var i=0; i<8; i++) { ctx.beginPath(); ctx.arc(bgOffset1 + i * 400 + 100, 150, 50, 0, Math.PI*2); ctx.fill(); }

    var bgOffset2 = -(this.cameraX * 0.5) % Game.W;
    ctx.fillStyle = '#556B2F';
    for (var i=0; i<6; i++) {
      ctx.beginPath(); ctx.moveTo(bgOffset2 + i * 600, Game.H);
      ctx.lineTo(bgOffset2 + i * 600 + 300, Game.H - 300);
      ctx.lineTo(bgOffset2 + i * 600 + 600, Game.H); ctx.fill();
    }

    ctx.save(); ctx.translate(-this.cameraX, 0); 

    for (var i=0; i<this.levelData.length; i++) {
      var obj = this.levelData[i];
      if (obj.type === 'ground') {
        ctx.fillStyle = '#8B4513'; ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        ctx.fillStyle = '#228B22'; ctx.fillRect(obj.x, obj.y, obj.w, 10);
      } else if (obj.type === 'trap') {
        ctx.fillStyle = '#ff0000'; ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
        ctx.fillStyle = '#fff';
        for(var j=0; j<obj.w; j+=10) {
          ctx.beginPath(); ctx.moveTo(obj.x+j, obj.y); ctx.lineTo(obj.x+j+5, obj.y-15); ctx.lineTo(obj.x+j+10, obj.y); ctx.fill();
        }
      }
    }

    for (var i = 0; i < Game.bullets.length; i++) {
      var b = Game.bullets[i]; var img = Game.IMG[b.imgKey] || Game.IMG.basketball;
      if (img) ctx.drawImage(img, b.x, b.y, b.w, b.h);
    }

    for (var i = 0; i < Game.enemies.length; i++) {
      var e = Game.enemies[i];
      if (Game.IMG.nailong) ctx.drawImage(Game.IMG.nailong, e.x, e.y, e.w, e.h);
      else { ctx.fillStyle = '#ffcc00'; ctx.fillRect(e.x, e.y, e.w, e.h); }
    }

    if (Game.watermelonBoss) Game.watermelonBoss.render(ctx);
    if (Game.renderWatermelons) Game.renderWatermelons(ctx);

    var p = this.player;
    ctx.save();
    if (p.invuln > 0 && Math.floor(Date.now()/100)%2===0) ctx.globalAlpha = 0.5;
    if (p.facing === -1) {
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2); ctx.scale(-1, 1);
      ctx.translate(-(p.x + p.w / 2), -(p.y + p.h / 2));
    }
    
    // 👇 核心修复：支持千手、荔枝形态显示
    if (p.isSixArms) {
      if (Game.IMG.t6_qianshou_model && Game.IMG.t6_qianshou_model.width > 0) {
        ctx.drawImage(Game.IMG.t6_qianshou_model, p.x, p.y, p.w, p.h);
      } else { ctx.fillStyle = '#ffd700'; ctx.fillRect(p.x, p.y, p.w, p.h); }
    } else if (p.isLizhi && Game.IMG.kun_idle) {
      // 荔枝状态：放大1.5倍
      var drawW = p.w * 1.5;
      var drawH = p.h * 1.5;
      ctx.drawImage(Game.IMG.kun_idle, p.idleFrame * 64, 0, 64, 64, p.x + p.w/2 - drawW/2, p.y + p.h - drawH, drawW, drawH);
    } else if (Game.IMG.kun_idle) {
      ctx.drawImage(Game.IMG.kun_idle, p.idleFrame * 64, 0, 64, 64, p.x, p.y, p.w, p.h);
    } else if (Game.IMG.kun) {
      ctx.drawImage(Game.IMG.kun, p.x, p.y, p.w, p.h);
    } else {
      ctx.fillStyle = '#e63946'; ctx.fillRect(p.x, p.y, p.w, p.h);
    }

    // 👇 核心修复：在这里渲染小鸡！(世界坐标)
    if (Game.chickens) {
      for (var i = 0; i < Game.chickens.length; i++) {
        var c = Game.chickens[i];
        var chickSize = c.size || 40;
        if (p.isLizhi) chickSize *= 2;
        if (Game.IMG.chicken_summon) {
          ctx.drawImage(Game.IMG.chicken_summon, c.x - chickSize/2, c.y - chickSize/2, chickSize, chickSize);
        } else {
          ctx.fillStyle = p.isLizhi ? '#ff5500' : '#ffff00'; 
          ctx.beginPath(); ctx.arc(c.x, c.y, chickSize/2, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = '#ff0000'; 
          ctx.fillRect(c.x - chickSize/6, c.y - chickSize/6, chickSize/3, chickSize/6); 
        }
      }
    }

    if (!this.bossTriggered) {
      var img = Game.IMG.stall;
      if (img) {
        var frameW = img.width / 2; 
        ctx.drawImage(img, 0, 0, frameW, img.height, this.stallX, this.stallY, 350, 250);
      } else {
        ctx.fillStyle = '#ff8800'; ctx.fillRect(this.stallX, this.stallY, 350, 250);
      }
    }
    if (this.bossActive && Game.huaqiangBoss) Game.huaqiangBoss.render(ctx);
    ctx.restore(); 
    ctx.restore(); 
  },

  renderUI: function() {
    var ctx = Game.ctx;
    ctx.save();
    var dist = Math.max(0, 4000 - this.player.x);
    ctx.font = 'bold 18px monospace'; ctx.textAlign = 'right'; ctx.fillStyle = '#fff';
    ctx.fillText('距离终点: ' + Math.floor(dist) + 'm', Game.W - 30, 36);
    
    if (this.bossActive) {
      var y = 80;
      ctx.fillStyle = '#333'; ctx.fillRect(Game.W/2 - 150, y, 300, 20);
      ctx.fillStyle = '#ff0000'; ctx.fillRect(Game.W/2 - 150, y, 300 * Math.max(0, Game.huaqiangBoss.hp / Game.huaqiangBoss.maxHp), 20);
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.strokeRect(Game.W/2 - 150, y, 300, 20);
      
      ctx.fillStyle = '#ff0000'; ctx.font = 'bold 24px monospace'; ctx.textAlign = 'center';
      ctx.shadowColor = '#ff0000'; ctx.shadowBlur = 20;
      ctx.fillText('华强买瓜！ · 阶段 ' + (Game.huaqiangBoss.lives === 2 ? '1' : '2'), Game.W/2, y - 10);
      ctx.shadowBlur = 0;

      var dotR = 8, dotSpacing = 24, dotsStartX = Game.W / 2 - dotSpacing / 2, dotY = y + 20 + 15;
      for (var i = 0; i < 2; i++) {
        var cx = dotsStartX + i * dotSpacing;
        ctx.beginPath(); ctx.arc(cx, dotY, dotR, 0, Math.PI * 2);
        if (i < Game.huaqiangBoss.lives) { ctx.fillStyle = '#ff2222'; ctx.shadowColor = '#ff2222'; ctx.shadowBlur = 10; }
        else { ctx.fillStyle = '#444444'; ctx.shadowBlur = 0; }
        ctx.fill(); ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
    ctx.restore();
  }
};