window.Game = window.Game || {};

Game.TalentPool = [
  { id: 't1', name: '遭到抱婴', desc: '诅咒全屏敌人消失，转化为经验', icon: 't1_baoying', key: '1' },
  { id: 't2', name: '人参公鸡', desc: '短时间内免疫所有伤害', icon: 't2_renshen', key: '2' },
  { id: 't3', name: 'ikun开团', desc: '召唤小鸡环绕并自动追踪撞击敌人', icon: 't3_kaitong', key: '3' },
  { id: 't4', name: '怎么荔枝', desc: '强化篮球大小与发射频率', icon: 't4_lizhi', key: '4' },
  { id: 't5', name: '千手鲲音', desc: '化身千手形态全方位发射篮球', icon: 't5_qianshou_ui', key: '5' }
];

Game.unlockedTalents = [];
Game.talentLevels = {}; 
Game.talentCD = {};
Game.chickens = [];
Game.currentTalentChoices = [];
Game.talentCards = [];

Game.DATA = {
  ASSETS: {
    kun:          { src: 'assets/kun.png',          w: 60,  h: 60,  color: '#3aa0ff' },
    kun_idle:     { src: 'assets/kun_idle.png',     w: 64,  h: 64,  color: '#3aa0ff' },
    nailong:      { src: 'assets/nailong.png',      w: 60,  h: 60,  color: '#ffcc00' },
    basketball:   { src: 'assets/basketball.png',   w: 30,  h: 30,  color: '#ff7a1a' },
    ball_nailong: { src: 'assets/ball_nailong.png', w: 30,  h: 30,  color: '#ff00ff' },
    mabao:        { src: 'assets/mabao.png',        w: 120, h: 120, color: '#a050a0' },
    mabao_skill:  { src: 'assets/mabao_skill.png',  w: 400, h: 300, color: '#ff3030' },
    bg2:          { src: 'assets/bg2.png',          w: 64,  h: 64,  color: '#16233c' },
    bg:           { src: 'assets/bg.png',           w: 64,  h: 64,  color: '#3c1616' },
    chest_closed: { src: 'assets/chest_closed.png', w: 100, h: 100, color: '#8b6b23' },
    chest_open:   { src: 'assets/chest_open.png',   w: 100, h: 100, color: '#d4a017' },
    portal:       { src: 'assets/portal.png',       w: 140, h: 140, color: '#00ffff' },
    death:        { src: 'assets/death.png',        w: 400, h: 200, color: '#660000' },
    book_closed:  { src: 'assets/book_closed.png',  w: 200, h: 280, color: '#ff0000' },
    book_ui:      { src: 'assets/book_ui.png',      w: 800, h: 600, color: '#dddddd' },
    panda_virus:  { src: 'assets/panda_virus.png',  w: 300, h: 300, color: '#ffffff' },
    error_popup:  { src: 'assets/error_popup.png',  w: 200, h: 150, color: '#eeeeee' },
    huaqiang_dash:{ src: 'assets/huaqiang_dash.png', w: 153, h: 248, color: '#0000ff' },
    stall:        { src: 'assets/stall.png',            w: 120, h: 100, color: '#ff0000' },
    watermelon:   { src: 'assets/watermelon.png',       w: 40,  h: 40,  color: '#00ff00' },
    watermelon_broken:{ src: 'assets/watermelon_broken.png',w: 40,  h: 40,  color: '#880000' },
    
    // 天赋图
    t1_baoying:       { src: 'assets/t1_baoying.png', w: 80, h: 80, color: '#ff4444' },
    t2_renshen:       { src: 'assets/t2_renshen.png', w: 80, h: 80, color: '#44ff44' },
    t3_kaitong:       { src: 'assets/t3_kaitong.png', w: 80, h: 80, color: '#ffff44' },
    t4_lizhi:         { src: 'assets/t4_lizhi.png',   w: 80, h: 80, color: '#ff44ff' },
    t5_qianshou_ui:   { src: 'assets/t5_qianshou_ui.png', w: 80, h: 80, color: '#44ffff' },
    t6_qianshou_model:{ src: 'assets/t6_qianshou_model.png', w: 60, h: 60, color: '#ffffff' },
    
    // 新技能3的实体图
    chicken_summon:   { src: 'assets/chicken_summon.png', w: 40, h: 40, color: '#ffff00' }
  },

  AUDIO_SRCS: {
    bgm:          'assets/bgm.mp3',
    kun_shoot:    'assets/kun_shoot.mp3',
    kun_hurt:     'assets/kun_hurt.mp3',
    nailong1:     'assets/nailong1.mp3',
    mabao_intro:  'assets/mabao_intro.mp3',
    mabao_phase2: 'assets/mabao_phase2.mp3',
    mabao_hurt:   'assets/mabao_hurt.mp3',
    mabao_attack: 'assets/mabao_attack.mp3',
    mabao_die:    'assets/mabao_die.mp3',
    sfx_panda:    'assets/sfx_panda.mp3'
  },

  UPGRADE_POOL: [
    { name: '攻击强化', desc: '篮球伤害 +10%', apply: function () { Game.player.dmgMul *= 1.1; } },
    { name: '疾风步',   desc: '移动速度 +15%', apply: function () { Game.player.speedMul *= 1.15; } },
    { name: '回满血',   desc: '立即恢复全部生命', apply: function () { Game.player.hp = Game.player.maxHp; } },
    { name: '射速提升', desc: '攻击频率 +15%', apply: function () { Game.player.fireRateMul *= 1.15; } },
    { name: '巨型篮球', desc: '篮球体积 +25%', apply: function () { Game.player.bulletSizeMul *= 1.25; } },
    { name: '生命上限', desc: '最大生命 +20 并回满', apply: function () { Game.player.maxHp += 20; Game.player.hp = Game.player.maxHp; } }
  ],

  MAX_ENEMIES: 150,
  ENEMY_SPAWN_INTERVAL: 0.15,
  ENEMY_EXP_REWARD: 2,
  ENEMY_HP: 4,
};
