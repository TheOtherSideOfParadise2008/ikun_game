window.Game = window.Game || {};

Game.player = {
  x: 0, y: 0, w: 60, h: 60,
  hp: 100, maxHp: 100,
  baseSpeed: 320, speedMul: 1,
  level: 0, exp: 0, expNext: 60,
  fireTimer: 0, fireRateMul: 1,
  dmgMul: 1, bulletSizeMul: 1,
  nailongBalls: 0, ballMode: 'normal',
  invuln: 0, hitFlash: 0,
  idleFrame: 0, idleTimer: 0, idleSpeed: 0.12,
  isLizhi: false, lizhiTimer: 0,
  isSixArms: false, sixArmsTimer: 0,

  resetPosition: function() {
    this.x = Game.W / 2 - this.w / 2;
    this.y = Game.H - 150;
    this.x = Game.Utils.clamp(this.x, 0, Math.max(0, Game.W - this.w));
    this.y = Game.Utils.clamp(this.y, 0, Math.max(0, Game.H - this.h));
  },

  update: function(dt) {
    if (this.lizhiTimer > 0) { this.lizhiTimer -= dt; if (this.lizhiTimer <= 0) this.isLizhi = false; }
    if (this.sixArmsTimer > 0) { this.sixArmsTimer -= dt; if (this.sixArmsTimer <= 0) this.isSixArms = false; }

    var dx = 0, dy = 0;
    var keys = Game.keys;
    if (keys['arrowleft'] || keys['a']) dx -= 1;
    if (keys['arrowright'] || keys['d']) dx += 1;
    if (keys['arrowup'] || keys['w']) dy -= 1;
    if (keys['arrowdown'] || keys['s']) dy += 1;

    if (dx !== 0 || dy !== 0) {
      var len = Math.hypot(dx, dy);
      dx /= len; dy /= len;
    }

    var spd = this.baseSpeed * this.speedMul;
    this.x += dx * spd * dt;
    this.y += dy * spd * dt;

    this.x = Game.Utils.clamp(this.x, 0, Math.max(0, Game.W - this.w));
    this.y = Game.Utils.clamp(this.y, 0, Math.max(0, Game.H - this.h));
    if (dx === 0 && dy === 0) {
      this.idleTimer += dt;
      if (this.idleTimer > this.idleSpeed) { this.idleTimer = 0; this.idleFrame = (this.idleFrame + 1) % 6; }
    } else { this.idleFrame = 0; this.idleTimer = 0; }
  },

  updateShooting: function(dt) {
    this.fireTimer -= dt;
    if (this.fireTimer <= 0) {
      this.fireBullets();
      this.fireTimer = (this.isLizhi ? 0.25 : 0.45) / this.fireRateMul;
    }
  },
    fireBullets: function() {
    var isNailong = this.ballMode === 'nailong';
    
    // 👇 核心修复：合并为一处，加上 Math.max(1, ...) 确保 0 级也有保底 1 发子弹
    var count = this.isSixArms ? (8 + (Game.talentLevels['t5'] || 1) * 2) : Math.max(1, Math.min(this.level, 5));
    
    if (isNailong) {
      count = Math.min(count, this.nailongBalls);
      if (count <= 0) { 
        this.ballMode = 'normal'; 
        isNailong = false; 
        count = Math.max(1, Math.min(this.level, 5)); // 奶龙球打空时切回普通球，也要保底 1 发
      }
    }

    var size = 30 * this.bulletSizeMul * (1 + (this.level - 1) * 0.05);
    if (this.isLizhi) size *= 1.5;

    var baseAngle = -Math.PI / 2;
    var spread = 0.22;
    var speed = 720;
    var cx = this.x + this.w / 2;
    var cy = this.y + this.h / 2 - 20;

    var makeBullet = function(cx, cy, angle, spd, sz) {
      return {
        x: cx - sz / 2, y: cy - sz / 2, w: sz, h: sz,
        vx: Math.cos(angle) * spd, vy: Math.sin(angle) * spd,
        dmg: (isNailong ? 15 : 7.5) * Game.player.dmgMul,
        isNailongBall: isNailong, imgKey: isNailong ? 'ball_nailong' : 'basketball'
      };
    };

    if (this.isSixArms) {
      for (var i = 0; i < count; i++) {
        Game.bullets.push(makeBullet(cx, cy, (Math.PI * 2 / count) * i, speed, size));
      }
    } else {
      if (count === 1) {
        Game.bullets.push(makeBullet(cx, cy, baseAngle, speed, size));
      } else {
        for (var i = 0; i < count; i++) {
          Game.bullets.push(makeBullet(cx, cy, baseAngle + (i - (count - 1) / 2) * spread, speed, size));
        }
      }
    }

    if (isNailong) {
      this.nailongBalls -= count;
      if (this.nailongBalls <= 0) { 
        this.nailongBalls = 0; 
        this.ballMode = 'normal'; 
      }
    }
    Game.audio.playSfx('kun_shoot');
  },



  gainExp: function(amount) {
    this.exp += amount;
    Game.waveExp += amount;

    var leveledUp = false;
    while (this.exp >= this.expNext) {
      this.exp -= this.expNext;
      this.level++;
      this.expNext = Math.floor(10 + Math.pow(this.level, 1.5) * 60);
      this.maxHp += 40; 
      this.hp = this.maxHp;
      this.invuln = Math.max(this.invuln, 0.8);
      leveledUp = true;
    }

    if (leveledUp && this.level % 2==0 && (Game.state === 'PLAYING' || Game.state === 'LEVEL2')) {
      Game.state = 'TALENT_SELECT';
      var pool = Game.TalentPool.slice();
      Game.currentTalentChoices = [];
      for (var i = 0; i < 3 && pool.length > 0; i++) {
        var idx = Math.floor(Math.random() * pool.length);
        Game.currentTalentChoices.push(pool.splice(idx, 1)[0]);
      }
    }
  },

  damage: function(amount) {
    if (this.invuln > 0) return;
    this.hp -= amount;
    this.invuln = 0.6;
    this.hitFlash = 0.25;
    Game.audio.playSfx('kun_hurt');
    Game.triggerShake(0.15, 8);

    if (this.hp <= 0) {
      this.hp = 0;
      Game.state = 'GAMEOVER';
      Game.gameOverTime = 0;
      Game.lightnings.length = 0;
      if (Game.boss) { Game.boss.active = false; Game.boss.hp = 0; }
      Game.bullets.length = 0;
      Game.enemies.length = 0;
      Game.chest.active = false;
      Game.portal.active = false;
      Game.triggerShake(0.6, 30);
    }
  }
};