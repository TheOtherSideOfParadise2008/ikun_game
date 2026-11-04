window.Game = window.Game || {};

Game.audio = {
  bgmStarted: false,
  userInteracted: false,
  lastNailongSoundTime: 0,
  lastHurtSoundTime: 0,
  lastPandaSoundTime: 0,
  lastAttackSoundTime: 0,

  init: function() {
    var self = this;
    window.addEventListener('keydown', function () { self.onUserInteract(); });
    window.addEventListener('click', function () { self.onUserInteract(); });
    window.addEventListener('touchstart', function () { self.onUserInteract(); });
  },

  onUserInteract: function() {
    this.userInteracted = true;
    this.tryPlayBgm();
  },

  tryPlayBgm: function() {
    if (this.bgmStarted) return;
    if (!Game.AUDIO.bgm) return;
    this.bgmStarted = true;
    try { Game.AUDIO.bgm.play().catch(function () {}); } catch (e) {}
  },

  pauseBgm: function() {
    if (Game.AUDIO.bgm) {
      Game.AUDIO.bgm.pause();
    }
  },

  resumeBgm: function() {
    if (Game.AUDIO.bgm && this.userInteracted) {
      Game.AUDIO.bgm.play().catch(function(){});
    }
  },

  playSfx: function(key) {
    var a = Game.AUDIO[key];
    if (!a) {
      console.warn("找不到音效或加载失败: " + key);
      return;
    }
    
    var now = Date.now();
    
    // 1. 奶龙音效：5秒冷却
    if (key === 'nailong1') {
      if (now - this.lastNailongSoundTime < 5000) return;
      this.lastNailongSoundTime = now;
    }

    // 2. 马保国受击（不讲武德）：9秒冷却
    if (key === 'mabao_hurt') {
      if (now - this.lastHurtSoundTime < 9000) return;
      this.lastHurtSoundTime = now;
    }
    
    // 3. 马保国攻击（闪电鞭）：4秒冷却
    if (key === 'mabao_attack') {
      if (now - this.lastAttackSoundTime < 4000) return;
      this.lastAttackSoundTime = now;
    }

    // 4. 熊猫烧香：300毫秒冷却
    if (key === 'sfx_panda') {
      if (now - this.lastPandaSoundTime < 300) return;
      this.lastPandaSoundTime = now;
    }

    try {
      if (key.indexOf('mabao_') === 0) {
        a.volume = 1.0; // 马保国声音拉满
      } else {
        a.volume = 0.7;
      }
      a.currentTime = 0;
      var p = a.play();
      if (p && p.catch) p.catch(function () {});
    } catch (e) {}
  }
};