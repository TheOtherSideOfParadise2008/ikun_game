window.Game = window.Game || {};

Game.enemy = {
  spawn: function() {
    Game.enemies.push({
      x: Game.Utils.rand(0, Math.max(1, Game.W - 60)),
      y: -60,
      w: 60,
      h: 60,
      vx: Game.Utils.rand(-40, 40),
      vy: Game.Utils.rand(100, 220) + Game.wave * 15,
      hp: Game.DATA.ENEMY_HP,
      maxHp: Game.DATA.ENEMY_HP
    });
  },

  updateSpawner: function(dt) {
    if (Game.boss.active || Game.chest.active || Game.portal.active) return;

    Game.spawnTimer -= dt;
    if (Game.spawnTimer <= 0) {
      // 👇 动态计算刷怪间隔
      // 假设  秒 (1分钟) 达到最高刷怪速度
      var timeProgress = Math.min(1, Game.time / 80); 
      
      // 初始间隔 0.8 秒，最终间隔 0.05 秒（后期极快）
      var baseInterval = 2 - (2 - 0.05) * timeProgress;
      
      // 每过一个波次，刷怪速度再加快 20%
      var waveMultiplier = 1 + (Game.wave - 1) * 0.;
      
      // 计算最终间隔，保底不低于 0.03 秒（防止卡死）
      Game.spawnTimer = baseInterval / waveMultiplier;
      if (Game.spawnTimer < 0.03) Game.spawnTimer = 0.03;

      // 决定每次刷多少只
      // 前期一次 1 只，后期时间长了或者波次高了，一次刷 2~3 只
      var batch = 40;
      if (Game.time > 30 || Game.wave > 1) {
        batch = 50 + Math.floor(Math.random() * 20); // 2~3只
      }
      
      for (var i = 0; i < batch; i++) {
        if (Game.enemies.length >= Game.DATA.MAX_ENEMIES) break;
        this.spawn();
      }
    }
  },
    update: function(dt) {
    // 👇 核心修复：防御性检查，防止报错中断主循环
    if (!Game.player) return;

    for (var i = Game.enemies.length - 1; i >= 0; i--) {
      var e = Game.enemies[i];
      if (!e) continue; // 👈 如果遇到 undefined，直接跳过

      e.x += e.vx * dt;
      e.y += e.vy * dt;

      if (e.y > Game.H + 80) {
        Game.enemies.splice(i, 1);
        continue;
      }

      if (Game.player.invuln <= 0 && Game.Utils.aabb(e, Game.player)) {
        Game.player.damage(10);
        Game.enemies.splice(i, 1);
      }
    }
  },

};