window.Game = window.Game || {};
Game.SkillData = Game.SkillData || {};

Game.SkillData.effectLightning = {
  relax: 0,
  maxRelax: 100,
  relaxSpeed: 15,     // 每秒恢复量
  _lastHp: 100,       // 用来判断玩家是否受伤
  _isUnlocked: false,
  castTimer: 0,       // 特效持续时间

  unlock: function() {
    this._isUnlocked = true;
    this.relax = 0;
    this._lastHp = Game.player.hp;
    console.log("恭喜你已领悟：闪电五连鞭");
  },

 update: function(dt) {
    if (!this._isUnlocked || !Game.player) return;

    // 只要不是暂停或死亡，就可以充能
    if (Game.state !== 'PLAYING' && Game.state !== 'LEVEL2') return;

    if (this.castTimer > 0) {
        this.castTimer -= dt;
    }

    // 👇 核心：判断是否受伤（血量降低则清空）
    if (Game.player.hp < this._lastHp) {
        this.relax = 0; // 挨打就清零，你的原设定保留！
    }
    
    // 👇 必须加这一句！同步血量，不然每帧都在判定受伤
    this._lastHp = Game.player.hp; 

    // 没受伤时充能
    if (this.relax < this.maxRelax && Game.player.hp > 0) {
        this.relax += this.relaxSpeed * dt;
        if (this.relax > this.maxRelax) this.relax = this.maxRelax;
    }
},
  cast: function() {
    if (!this._isUnlocked || this.relax < this.maxRelax) return;

    this.relax = 0;
    this.castTimer = 0.5; 
    Game.audio.playSfx('mabao_attack'); 
    Game.triggerShake(0.4, 25);

    if (Game.state === 'PLAYING') {
      // 第一关：清空奶龙，打马保国
      if (Game.enemies.length > 0) {
        Game.enemies.length = 0; 
        Game.player.gainExp(Game.DATA.ENEMY_EXP_REWARD * 10); 
      }
      if (Game.boss.active) {
        Game.boss.takeDamage(1000 * Game.player.dmgMul); 
      }
    } else if (Game.state === 'LEVEL2') {
      // 第二关：打华强
      if (Game.huaqiangBoss && Game.huaqiangBoss.active) {
        Game.huaqiangBoss.hp -= 300 * Game.player.dmgMul;
      }
    }
  },

  // 渲染释放时的全屏闪电特效
  renderSkillEffect: function() {
    if (this.castTimer <= 0 || (Game.state !== 'PLAYING' && Game.state !== 'LEVEL2')) return;

    var ctx = Game.ctx;
    var px = Game.player.x + Game.player.w / 2;
    var py = Game.player.y + Game.player.h / 2;
    if (Game.state === 'LEVEL2') {
      px -= Game.level2.cameraX;
    }

    ctx.save();
    
    // 1. 全屏白光闪烁
    var flashAlpha = Math.min(0.6, this.castTimer * 2);
    ctx.fillStyle = 'rgba(150, 220, 255, ' + flashAlpha + ')';
    ctx.fillRect(0, 0, Game.W, Game.H);

    // 2. 放射状闪电
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 30;
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#ffffff';

    for (var i = 0; i < 6; i++) {
      var angle = Math.random() * Math.PI * 2;
      var len = 1000;
      var ex = px + Math.cos(angle) * len;
      var ey = py + Math.sin(angle) * len;
      
      var pts = Game.boss.lineLightning(px, py, ex, ey);
      
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for(var j=1; j<pts.length; j++) {
        ctx.lineTo(pts[j].x, pts[j].y);
      }
      ctx.stroke();
    }
    ctx.restore();
  },

  // 👇 名字改回了 renderUI，并允许第二关渲染
  renderUI: function() {
    if (!this._isUnlocked || (Game.state !== 'PLAYING' && Game.state !== 'LEVEL2')) return;

    var ctx = Game.ctx;
    
    // 尺寸和位置（嵌在左上角面板中）
    var w = 195;  
    var h = 6;    
    var x = 80;   
    var y = 115;   

    // 1. 槽的底色（半透明白，更显眼）
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(x, y, w, h);
    
    // 2. 槽的边框
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // 3. 充能条
    var ratio = this.relax / this.maxRelax;
    ctx.fillStyle = ratio >= 1 ? '#00ffff' : '#00d4ff';
    ctx.fillRect(x, y, w * ratio, h);

    // 4. 状态文字提示
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'right'; 
    ctx.textBaseline = 'bottom'; 
    
    if (ratio >= 1) {
      ctx.fillStyle = Math.floor(Date.now() / 200) % 2 === 0 ? '#00ffff' : '#fff';
      ctx.fillText('按 Q 释放五连鞭！', x + w, y - 2);
    } else {
      ctx.fillStyle = '#00d4ff';
      ctx.fillText('充能: ' + Math.floor(ratio * 100) + '%', x + w, y + 12);
    }
  }
};