# 只因大冒险

这是一个使用纯原生 HTML5 Canvas + JavaScript 手搓的动作网页游戏。

## 🎮 在线试玩
👉 **[点击这里进入游戏](https://theothersideofparadise2008.github.io/ikun_game/)**

## ✨ 核心亮点
 **纯原生开发**：零游戏引擎依赖，手写 `requestAnimationFrame` 游戏循环、AABB 碰撞检测、以及状态机系统。


## 🕹️ 操作说明
- **移动**：方向键 / `WASD`
- **第一关**：自动发射篮球，击杀 Boss 后按 `R` 参悟。
- **第二关**：空格键发射篮球，方向键控制移动，靠近摊位触发剧情。
- **天赋/大招**：数字键 `1-5`（局内升级后解锁）。

## 🛠️ 技术栈
- HTML5 Canvas
- 原生 JavaScript (ES6+)
- CSS3
- LocalStorage (本地数据持久化)

## 📂 目录结构
- `index.html` - 主页面与 UI 结构
- `main.js` - 游戏主循环与状态机调度
- `player.js` / `boss.js` / `enemy.js` - 实体逻辑
- `ui.js` - Canvas UI 与菜单渲染
- `level2.js` - 第二关横版跑酷逻辑
- `skills/` - 局内天赋与技能配置
- `assets/` - 图像与音频素材
