window.Game = window.Game || {};
Game.SkillData = Game.SkillData || {};

Game.SkillData.learnLightning = {
  // 基础数据
  name: '秘传·闪电五连鞭',
  desc: [
          '混元形意太极门掌门马保国的著名功法，又名“松果弹抖闪电鞭',
          '是只有在全身放松的状态下才能施展的绝世武学',
          '据说大成的修炼者可以连续释放出可怖的闪电鞭',
          '但是领悟失败也有着走火入魔的风险'
        ],
  
  // 渲染状态数据
  errorPopups: [],
  pandaSpawnTimer: 0,
  meditationTime: 0,
  pandaWaitTime: 0,

  // 1. 按键拦截（由 main.js 转发）
  handleKeyDown: function(e, k) {
    if (Game.state === 'MEDITATING') {
      // 心魔阶段按任何键判定失败
      Game.state = 'GAMEOVER';
      Game.gameOverTime = 0;
      this.errorPopups = [];
      Game.bullets = [];
      Game.enemies = [];
      if (Game.boss) Game.boss.active = false;
      Game.audio.playSfx('kun_hurt');
      return;
    }

    if (Game.state === 'BOOK_PREVIEW') {
      if (k === 'r') {

        // 进入心魔
        Game.audio.pauseBgm(); 
        Game.state = 'MEDITATING';
        this.meditationTime = 15;
        this.errorPopups = [];
        this.pandaSpawnTimer = 0;
        // 👇 新增：设置 2 秒的静默期（熊猫出场时间）
        this.pandaWaitTime = 4.0; 
        
        // 👇 新增：关闭 BGM
        Game.audio.pauseBgm();
      } else if (k === 'escape') {
        // 放弃
        Game.state = 'PLAYING';
        Game.boss.spawnPortal();
        Game.audio.resumeBgm(); 
      }
    }
  },

  // 2. 秘籍预览更新逻辑
  updatePreview: function(dt) {
    // 预览阶段世界暂停，无需每帧更新逻辑
  },

  // 3. 心魔试炼更新逻辑
    updateMeditation: function(dt) {
    this.meditationTime -= dt;
    this.pandaSpawnTimer -= dt;
    if (this.pandaWaitTime > 0) {
      this.pandaWaitTime -= dt;
      return; // 直接返回，跳过下面的弹窗生成
    }
    if (this.pandaSpawnTimer <= 0) {
    // 1. 计算当前进度（假设总共 15 秒。如果总时间不同，请把 15 改成你的总时间）
    var progress = 1 - (this.meditationTime / 15.0);
    if (progress < 0) progress = 0;
    if (progress > 1) progress = 1;

    // 2. 动态计算下一次间隔（从 0.6 秒起步，越来越快，最快逼近 0.05 秒）
    this.pandaSpawnTimer = 0.6 - (progress * 0.55);
    if (this.pandaSpawnTimer < 0.05) this.pandaSpawnTimer = 0.05;

    // 3. 生成弹窗
    this.errorPopups.push({
        x: Math.random() * (Game.W - 200),
        y: Math.random() * (Game.H - 100),
        w: 200 + Math.random() * 150,
        h: 100 + Math.random() * 100
    });

    // 4. 播放音效
    Game.audio.playSfx('sfx_panda');
}
    if (this.meditationTime <= 0) {
      // 👇 成功时，确保状态切换干净
      Game.state = 'PLAYING';
      this.errorPopups = [];
      this.meditationTime = 0;
      if (Game.currentSkill && Game.currentSkill.effect) {
        Game.currentSkill.effect.unlock();
      }
      Game.boss.spawnPortal();
      Game.audio.resumeBgm();
    }
  },

  render: function() {
    var ctx = Game.ctx;
    if (Game.state === 'BOOK_PREVIEW') {
      ctx.fillStyle = 'rgba(0,0,0,0.85)'; ctx.fillRect(0, 0, Game.W, Game.H);
      var pulse = 30 + Math.sin(Date.now() * 0.005) * 20;
      ctx.shadowColor = '#ffd700'; ctx.shadowBlur = pulse;
      ctx.drawImage(Game.IMG.book_closed, Game.W * 0.2 - 100, Game.H/2 - 140, 200, 280);
      ctx.shadowBlur = 0;
      
      ctx.fillStyle = '#fff'; ctx.font = 'bold 32px monospace'; ctx.textAlign = 'left';
      ctx.fillText(this.name, Game.W * 0.45, Game.H/2 - 100);
      ctx.font = '18px monospace'; ctx.fillStyle = '#ccc';
      ctx.fillText(this.desc, Game.W * 0.45, Game.H/2 - 40);
      ctx.fillStyle = '#ffd700'; ctx.textAlign = 'center'; ctx.font = 'bold 24px monospace';
      ctx.fillText('按 R 领悟 / 按 ESC 放弃', Game.W / 2, Game.H - 100);
      
        } else if (Game.state === 'MEDITATING') {
      ctx.fillStyle = '#111'; ctx.fillRect(0, 0, Game.W, Game.H);
      
      if (Game.IMG.book_ui && Game.IMG.book_ui.src.indexOf('data:image') === -1) {
        ctx.drawImage(Game.IMG.book_ui, Game.W/2 - 400, Game.H - 500, 800, 600);
      }
      
      if (Game.IMG.panda_virus && Game.IMG.panda_virus.src.indexOf('data:image') === -1) {
        ctx.drawImage(Game.IMG.panda_virus, Game.W/2 - 150, Game.H/2 - 50, 300, 300);
      }
      
      for(var i = 0; i < this.errorPopups.length; i++) {
        var p = this.errorPopups[i];
        if (Game.IMG.error_popup) ctx.drawImage(Game.IMG.error_popup, p.x, p.y, p.w, p.h);
      }
      
      // ================== 倒计时框 ==================
      ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(Game.W/2 - 100, 30, 200, 60);
      ctx.strokeStyle = '#ff0000'; ctx.lineWidth = 4; ctx.strokeRect(Game.W/2 - 100, 30, 200, 60);
      ctx.fillStyle = '#ff0000'; ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('倒计时: ' + Math.ceil(this.meditationTime) + 's', Game.W/2, 60);

      // ================== 👇 新增：进度条与压迫感提示 ==================
      
      var barW = Game.W * 0.5;
      var barH = 20;
      var barX = (Game.W - barW) / 2;
      var barY = 100; // 在倒计时黑框下方

      // 1. 背景槽
      ctx.fillStyle = 'rgba(50, 50, 50, 0.8)';
      ctx.fillRect(barX, barY, barW, barH);

      // 2. 填充条 (剩余时间比例)
      var ratio = this.meditationTime / 15;
      if (ratio < 0) ratio = 0;
      if (ratio > 1) ratio = 1;
      
      ctx.fillStyle = '#ff0000'; // 血红色
      ctx.fillRect(barX, barY, barW * ratio, barH);

      // 3. 纯白边框
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.strokeRect(barX, barY, barW, barH);

      // 4. 闪烁文字提示
      ctx.font = 'bold 28px "Microsoft YaHei", sans-serif'; // 使用黑体
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // 闪烁特效：利用 Math.sin 和时间戳
      if (Math.sin(Date.now() / 150) > 0) {
        ctx.fillStyle = '#ff0000'; // 红色高亮
        ctx.globalAlpha = 1.0;
      } else {
        ctx.fillStyle = '#ffff00'; // 黄色变暗
        ctx.globalAlpha = 0.6;
      }
      
      ctx.fillText('【保持静默！切勿触碰任何按键！】', Game.W / 2, barY + barH + 15);
      ctx.globalAlpha = 1.0; // 恢复透明度，防止影响后续渲染
      // =================================================================
    }
  }
}