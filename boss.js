window.Game = window.Game || {};

// ================= 第一关 Boss：马保国 =================
Game.boss = {
  active: false, x: 0, y: 0, w: 300, h: 300,
  hp: 2000, maxHp: 2000, lives: 2, phase: 1, speed: 90,
  skillDamage: 20, timer: 3, state: 'idle', telegraph: 1.5,
  invuln: false, hitFlash: 0, _lastAttackSound: 0,

  spawn: function() {
    Game.bossSpawned = true; Game.bossMode = true; this.active = true;
    this.w = 300; this.h = 300; this.x = Game.W / 2 - this.w / 2; this.y = 160;
    this.maxHp = 2000 * Math.pow(2, Game.wave - 1); this.hp = this.maxHp;
    this.lives = 2; this.phase = 1; this.skillDamage = 20 * Math.pow(2, Game.wave - 1);
    this.speed = 90 + Game.wave * 10; this.timer = 3; this.state = 'idle';
    this.telegraph = 1.5; this.invuln = false; this.hitFlash = 0;
    Game.enemies.length = 0; Game.spawnTimer = 0; Game.audio.playSfx('mabao_intro');
  },
  reset: function() {
    this.active = false; this.hp = 0; this.lives = 2; this.phase = 1;
    this.state = 'idle'; this.timer = 3; this.telegraph = 1.5; this.invuln = false;
  },
  update: function(dt) {
    if (this.hitFlash > 0) this.hitFlash -= dt;
    
    if (isNaN(this.x) || isNaN(this.y)) {
      this.x = Game.W / 2 - this.w / 2; this.y = 160;
    }

    var targetX = Game.player.x + Game.player.w / 2 - this.w / 2;
    var diff = targetX - this.x, step = this.speed * dt;
    if (Math.abs(diff) <= step) this.x = targetX;
    else this.x += (diff > 0 ? 1 : -1) * step;
    this.x = Game.Utils.clamp(this.x, 0, Math.max(0, Game.W - this.w));
    this.y = 160 + Math.sin(Game.time * 1.5) * 12;
    
    if (this.state === 'idle') {
      this.timer -= dt;
      if (this.timer <= 0) {
        this.timer = 0; this.state = 'telegraph'; this.telegraph = 1.5; this.invuln = true;
        var now = Date.now();
        if (!this._lastAttackSound || now - this._lastAttackSound > 5000) {
          this._lastAttackSound = now; Game.audio.playSfx('mabao_attack');
        }
      }
    } else if (this.state === 'telegraph') {
      this.telegraph -= dt; Game.triggerShake(0.1, 25);
      if (this.telegraph <= 0) {
        this.telegraph = 0; this.castLightning(); this.state = 'idle'; this.timer = 7; this.invuln = false;
      }
    }
  },
  
  takeDamage: function(dmg) {
    if (!this.active || this.invuln) return;
    this.hp -= dmg; this.hitFlash = 0.1;
    
    if (this.hp <= 0) {
      if (this.lives > 1) {
        this.lives--; 
        this.hp = this.maxHp; 
        this.phase = 2; 
        this.speed *= 1.6;
        Game.triggerShake(0.5, 20); 
        this.state = 'idle'; 
        this.timer = 3;
        this.telegraph = 1.5; 
        this.invuln = false;
        
        this.x = Game.W / 2 - this.w / 2; 
        this.y = 160; 
        Game.audio.playSfx('mabao_phase2');
      } else {
        this.lives = 0; 
        this.active = false; 
        this.onDefeated();
      }
    }
  },

  onDefeated: function() {
    this.active = false; Game.lightnings.length = 0; Game.triggerShake(0.6, 25);
    Game.audio.playSfx('mabao_die'); this.spawnChest();
  },
  spawnChest: function() {
    Game.chest.active = true; Game.chest.opened = false;
    Game.chest.w = 100; Game.chest.h = 100;
    Game.chest.x = Game.W / 2 - Game.chest.w / 2; Game.chest.y = Game.H / 2 - Game.chest.h / 2;
    Game.chest.grace = 0.4;
  },
  updateChest: function(dt) {
    if (!Game.chest.active) return;
    if (Game.chest.grace > 0) { Game.chest.grace -= dt; return; }
    if (!Game.chest.opened) {
      if (Game.Utils.aabb(Game.player, Game.chest)) {
        Game.chest.opened = true; Game.chest.waitTime = 0.8;
      }
    } else {
      Game.chest.waitTime -= dt;
      if (Game.chest.waitTime <= 0) {
        Game.chest.active = false;
        if (Game.SkillData && Game.SkillData.learnLightning) {
          Game.currentSkill = { learn: Game.SkillData.learnLightning, effect: Game.SkillData.effectLightning };
          Game.state = 'BOOK_PREVIEW'; 
        } else {
          Game.state = 'PLAYING';
        }
      }
    }
  },
  spawnPortal: function() {
    Game.portal.active = true; Game.portal.x = Game.W / 2; Game.portal.y = Game.H / 2;
    Game.portal.r = 140; Game.portal.angle = 0; Game.portal.t = 0; Game.portal.grace = 0.5;
  },
  updatePortal: function(dt) {
    if (!Game.portal.active) return;
    Game.portal.angle += dt * 2; Game.portal.t += dt;
    if (Game.portal.grace > 0) { Game.portal.grace -= dt; return; }
    var pcx = Game.player.x + Game.player.w / 2, pcy = Game.player.y + Game.player.h / 2;
    var d = Math.hypot(pcx - Game.portal.x, pcy - Game.portal.y);
    if (d < Game.portal.r / 2 + 20) {
      Game.portal.active = false; Game.level2.init(); Game.state = 'LEVEL2';
    }
  },
  lineLightning: function(x1, y1, x2, y2) {
    var pts = [], segments = 16, dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1;
    var nx = -dy / len, ny = dx / len;
    for (var i = 0; i <= segments; i++) {
      var t = i / segments, offset = (i > 0 && i < segments) ? (Math.random() * 2 - 1) * 25 : 0;
      pts.push({ x: x1 + dx * t + nx * offset, y: y1 + dy * t + ny * offset });
    }
    return pts;
  },
  waveLightning: function(x1, y1, angle, length, amp, cycles) {
    var pts = [], steps = 90, ux = Math.cos(angle), uy = Math.sin(angle), nx = -uy, ny = ux;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, dist = t * length, wave = Math.sin(t * Math.PI * 2 * cycles) * amp * t;
      pts.push({ x: x1 + ux * dist + nx * wave, y: y1 + uy * dist + ny * wave });
    }
    return pts;
  },
  spiralLightning: function(x1, y1, angle, length, turns, radius) {
    var pts = [], steps = 140, ux = Math.cos(angle), uy = Math.sin(angle), nx = -uy, ny = ux;
    for (var i = 0; i <= steps; i++) {
      var t = i / steps, dist = t * length, spin = Math.sin(t * Math.PI * 2 * turns) * radius * t;
      pts.push({ x: x1 + ux * dist + nx * spin, y: y1 + uy * dist + ny * spin });
    }
    return pts;
  },
  makeLightning: function(points, damage, driftVy) {
    return { points: points, offsetX: 0, offsetY: 0, driftVx: 0, driftVy: driftVy || 55, life: 2.0, age: 0, damage: damage, hasHit: false };
  },
  pickDistinctForms: function(pool, n) {
    var copy = pool.slice(), out = [];
    for (var i = 0; i < n && copy.length > 0; i++) {
      var idx = Math.floor(Math.random() * copy.length); out.push(copy.splice(idx, 1)[0]);
    }
    return out;
  },
  spawnLightningForm: function(form, bx, by, px, py, dmg, playerDist, baseAngle) {
    if (form === 1) {
      Game.lightnings.push(this.makeLightning(this.lineLightning(bx, by, px, py), dmg, 60));
    } else if (form === 2) {
      var len2 = playerDist + 250;
      for (var i = -1; i <= 1; i++) {
        var a = baseAngle + i * 0.35, ex = bx + Math.cos(a) * len2, ey = by + Math.sin(a) * len2;
        Game.lightnings.push(this.makeLightning(this.lineLightning(bx, by, ex, ey), dmg, 50));
      }
    } else if (form === 3) {
      Game.lightnings.push(this.makeLightning(this.waveLightning(bx, by, baseAngle, playerDist + 400, 90, 2), dmg, 55));
    } else if (form === 4) {
      Game.lightnings.push(this.makeLightning(this.spiralLightning(bx, by, baseAngle, playerDist + 400, 4, 90), dmg, 55));
    }
  },
  castLightning: function() {
    if (!this.active) return;
    var bx = this.x + this.w / 2, by = this.y + this.h / 2;
    var px = Game.player.x + Game.player.w / 2, py = Game.player.y + Game.player.h / 2;
    var dmg = this.skillDamage, baseAngle = Math.atan2(py - by, px - bx), playerDist = Math.hypot(px - bx, py - by);
    if (this.phase === 1) {
      var forms1 = this.pickDistinctForms([1, 2], Math.random() < 0.5 ? 1 : 2);
      for (var i = 0; i < forms1.length; i++) this.spawnLightningForm(forms1[i], bx, by, px, py, dmg, playerDist, baseAngle);
    } else {
      var forms2 = this.pickDistinctForms([1, 2, 3, 4], 3 + Math.floor(Math.random() * 2));
      for (var j = 0; j < forms2.length; j++) this.spawnLightningForm(forms2[j], bx, by, px, py, dmg, playerDist, baseAngle);
    }
  },
  updateLightnings: function(dt) {
    for (var i = Game.lightnings.length - 1; i >= 0; i--) {
      var ln = Game.lightnings[i];
      ln.age += dt; ln.offsetX += ln.driftVx * dt; ln.offsetY += ln.driftVy * dt;
      if (ln.age >= ln.life) { Game.lightnings.splice(i, 1); continue; }
      if (!ln.hasHit && Game.player.invuln <= 0) {
        var pcx = Game.player.x + Game.player.w / 2, pcy = Game.player.y + Game.player.h / 2;
        for (var j = 0; j < ln.points.length - 1; j++) {
          var a = ln.points[j], b = ln.points[j + 1];
          if (Game.Utils.pointSegDist(pcx, pcy, a.x + ln.offsetX, a.y + ln.offsetY, b.x + ln.offsetX, b.y + ln.offsetY) < 44) {
            Game.player.damage(ln.damage); ln.hasHit = true; break;
          }
        }
      }
    }
  }
};

// ================= 第二关 Boss：华强 =================
Game.huaqiangBoss = {
  active: false, x: 0, y: 0, w: 153, h: 248, hp: 1000, maxHp: 1000, lives: 2,
  speed: 450, direction: -1, dashFrame: 0, dashTimer: 0,
  screenX: 0, 

  spawn: function() {
    this.active = true; 
    this.maxHp = 1000 * Math.pow(2, Game.wave - 1); 
    this.hp = this.maxHp;
    this.lives = 2; 
    
    this.direction = -1; 
    this.speed = 450 + (Game.wave - 1) * 100; 
    this.dashFrame = 0;
    this.dashTimer = 0;
    
    this.screenX = Game.W - this.w - 50;
    this.x = Game.level2.cameraX + this.screenX;
    this.y = Game.H - 100 - 248;
  },
  
  update: function(dt) {
    if (!this.active) return;
    this.y = Game.H - 100 - 248; 

    this.dashTimer += dt;
    if (this.dashTimer >= 0.08) { this.dashTimer = 0; this.dashFrame = (this.dashFrame + 1) % 3; }
    
    this.screenX += this.direction * this.speed * dt;

    var p = Game.player;
    
    if (p.invuln <= 0 && Game.Utils.aabb(this, p)) {
      p.damage(30); 
      p.vx = this.direction * 400; 
      p.vy = -500; 
      Game.triggerShake(0.4, 20);
      this.direction *= -1;  
    }

    if (this.screenX <= 20) {
      this.screenX = 20; 
      this.direction = 1; 
    } 
    else if (this.screenX + this.w >= Game.W - 20) {
      this.screenX = Game.W - 20 - this.w; 
      this.direction = -1; 
    }

    this.x = Game.level2.cameraX + this.screenX;
  },
  
  takeDamage: function(dmg) {
    if (!this.active) return;
    this.hp -= dmg; Game.triggerShake(0.05, 5);
    
    if (this.hp <= 0) {
      if (this.lives > 1) {
        this.lives--; 
        this.hp = this.maxHp;
        this.speed *= 1.5; 
        
        Game.watermelonBoss.isPhase2 = true; 
        Game.triggerShake(0.5, 20);
        Game.toastTimer = 2.5;
        Game.audio.playSfx('mabao_phase2');
      } else {
        this.lives = 0; 
        this.active = false; 
        Game.state = 'GAMEOVER'; 
      }
    }
  },
  
  render: function(ctx) {
    if (!this.active) return;
    var img = Game.IMG.huaqiang_dash;
    if (!img) { ctx.fillStyle = '#0000ff'; ctx.fillRect(this.x, this.y, this.w, this.h); return; }
    ctx.save();
    if (this.direction === 1) {
      ctx.translate(this.x + this.w / 2, this.y + this.h / 2); ctx.scale(-1, 1);
      ctx.translate(-(this.x + this.w / 2), -(this.y + this.h / 2));
    }
    ctx.drawImage(img, this.dashFrame * 153, 0, 153, 248, this.x, this.y, this.w, this.h);
    ctx.restore();
  }
};

// ================= 飞天西瓜摊 =================
Game.watermelons = [];
Game.watermelonDebris = [];

Game.watermelonBoss = {
  active: false, x: 0, y: 50, w: 500, h: 300, speed: 280,
  stallFrame: 0, stallTimer: 0, throwTimer: 0, hp: 800, maxHp: 800, isPhase2: false,

  spawn: function() {
    this.active = true; 
    this.x = Game.level2.cameraX + Game.W / 2 - this.w / 2; 
    this.y = Game.H - 250; 
    this.hp = 800; this.maxHp = 800; 
    this.throwTimer = 1.5; 
    this.isRising = true; 
    this.isPhase2 = false; 
  },
  update: function(dt) {
    if (!this.active) return;
    this.stallTimer += dt;
    if (this.stallTimer >= 0.15) { this.stallTimer = 0; this.stallFrame = (this.stallFrame + 1) % 2; }

    if (this.isRising) {
      this.y -= 80 * dt; 
      if (this.y <= 100) { this.y = 100; this.isRising = false; }
      return; 
    }

    var pX = Game.player.x + Game.player.w / 2;
    var diff = pX - (this.x + this.w / 2);
    if (Math.abs(diff) > 5) this.x += Math.sign(diff) * this.speed * dt;

    this.throwTimer -= dt;
    if (this.throwTimer <= 0) {
      this.throwTimer = this.isPhase2 ? 1.0 : 1.5; 
      Game.watermelons.push({
        x: this.x + this.w / 2 - 20, y: this.y + this.h,
        w: 40, h: 40, vy: 200, gravity: 800,
        isNailong: this.isPhase2, imgKey: this.isPhase2 ? 'ball_nailong' : 'watermelon'
      });
    }
  },
  takeDamage: function(dmg) {
    if (!this.active) return;
    this.hp -= dmg; Game.triggerShake(0.05, 5);
    if (this.hp <= 0) this.active = false;
  },
  render: function(ctx) {
    if (!this.active) return;
    var groundY = Game.H - 100;
    var currentHeight = groundY - this.y;
    if (currentHeight > 0) {
      ctx.save();
      var shadowRatio = Math.max(0, 1 - currentHeight / 500); 
      var shadowW = this.w * shadowRatio, shadowH = 20 * shadowRatio;
      ctx.fillStyle = 'rgba(0, 0, 0, ' + (0.5 * shadowRatio) + ')';
      ctx.beginPath();
      ctx.ellipse(this.x + this.w / 2, groundY, shadowW / 2, shadowH / 2, 0, 0, Math.PI * 2);
      ctx.fill(); ctx.restore();
    }
    var img = Game.IMG.stall;
    if (img && img.width > 0) {
      var frameW = img.width / 2, frameH = img.height;
      ctx.drawImage(img, this.stallFrame * frameW, 0, frameW, frameH, this.x, this.y, this.w, this.h);
    } else {
      ctx.fillStyle = '#ff8800'; ctx.fillRect(this.x, this.y, this.w, this.h);
      ctx.fillStyle = '#fff'; ctx.font = '30px monospace'; ctx.textAlign = 'center';
      ctx.fillText('西瓜摊', this.x + this.w / 2, this.y + this.h / 2);
    }
  }
};

Game.updateWatermelons = function(dt) {
  var groundY = Game.H - 100; 
  for (var i = Game.watermelons.length - 1; i >= 0; i--) {
    var wm = Game.watermelons[i];
    wm.vy += wm.gravity * dt; wm.y += wm.vy * dt;
    
    if (Game.player.invuln <= 0 && Game.Utils.aabb(wm, Game.player)) {
      Game.player.damage(15); 
      if (!wm.isNailong) Game.watermelonDebris.push({ x: wm.x, y: wm.y, w: wm.w, h: wm.h, alpha: 1.0 });
      Game.watermelons.splice(i, 1);
      continue;
    }
    if (wm.y + wm.h >= groundY) {
      if (wm.isNailong) {
        Game.enemies.push({
          x: wm.x, y: groundY - 60, w: 60, h: 60,
          vx: (Math.random() > 0.5 ? 1 : -1) * 150, vy: 0, hp: 2, maxHp: 2, imgKey: 'nailong'
        });
        Game.audio.playSfx('nailong1');
      } else {
        Game.watermelonDebris.push({ x: wm.x, y: groundY - wm.h, w: wm.w, h: wm.h, alpha: 1.0 });
        Game.triggerShake(0.2, 10); Game.audio.playSfx('nailong1');
      }
      Game.watermelons.splice(i, 1); 
    }
  }
  for (var j = Game.watermelonDebris.length - 1; j >= 0; j--) {
    var db = Game.watermelonDebris[j];
    db.alpha -= 0.005 * (60 * dt);
    if (db.alpha <= 0) Game.watermelonDebris.splice(j, 1);
  }
};

Game.renderWatermelons = function(ctx) {
  for (var i = 0; i < Game.watermelons.length; i++) {
    var wm = Game.watermelons[i];
    var img = Game.IMG[wm.imgKey] || Game.IMG.watermelon;
    if (img) ctx.drawImage(img, wm.x, wm.y, wm.w, wm.h);
  }
  for (var j = 0; j < Game.watermelonDebris.length; j++) {
    var db = Game.watermelonDebris[j];
    ctx.save(); ctx.globalAlpha = db.alpha;
    if (Game.IMG.watermelon_broken) ctx.drawImage(Game.IMG.watermelon_broken, db.x, db.y, db.w, db.h);
    else { ctx.fillStyle = '#ff0000'; ctx.fillRect(db.x, db.y, db.w, db.h); }
    ctx.restore();
  }
};