# 博德之门 3 构筑规划器｜轻量化 UI V6

V6 保留现有 `index.html` 中的构筑数据、计算规则和事件逻辑，通过同源 iframe 注入新的视觉与交互层。上传后可以与原版页面并存，不会覆盖当前线上入口。

## 文件结构

```text
仓库根目录/
├── index.html                  # 你仓库中原有的核心页面，继续保留
├── ui-game-v6.html             # V6 新入口
└── assets/
    ├── ui-light-v6.css
    ├── ui-light-v6.js
    └── fantasy-forest-v6.webp
```

## GitHub Pages 部署

1. 解压本压缩包。
2. 将 `ui-game-v6.html` 上传到现有仓库根目录。
3. 将压缩包内 `assets` 目录中的三个文件上传到仓库现有的 `assets` 目录。
4. 不要删除或覆盖现有 `index.html`。
5. 提交后访问：

```text
https://你的域名或用户名.github.io/仓库名/ui-game-v6.html
```

因为 V6 需要读取同目录的 `index.html`，请通过 GitHub Pages、本地 HTTP 服务器或其他静态服务器访问。直接双击 HTML 可能被浏览器的本地文件安全策略阻止。

## 本地预览

在仓库根目录打开命令行：

```bash
python -m http.server 8080
```

然后访问：

```text
http://localhost:8080/ui-game-v6.html
```

Windows 也可使用：

```powershell
py -m http.server 8080
```

## V6 设计变化

- 使用原创生成的幻想森林与古代遗迹背景，不使用游戏官方截图。
- 整个桌面页面锁定在一个视口内，页面本身不需要纵向滚动。
- 左侧仅保留轻量步骤轨迹，不再使用厚重导航卡片。
- 中间区域一次只展示当前决策。
- 移除大部分统计摘要、重复标题和嵌套卡片。
- 右侧只保留等级、职业路线、六项属性和四个关键战斗数值。
- 完整角色纸改为按需打开的覆盖层。
- 技能采用“选项列表 + 固定详情”结构。
- 法术采用“法术书列表 + 固定详情”结构，点击顶部法术时详情立即在旁边更新。
- 移动端技能和法术详情使用底部抽屉，不改变列表滚动位置。
- 底部始终显示上一步、当前步骤状态和确认继续。

## 将 V6 设置为网站首页

建议先使用 `ui-game-v6.html` 独立验收。确认后再执行：

1. 将现有 `index.html` 重命名为 `app-core.html`。
2. 编辑 `ui-game-v6.html`，把：

```html
src="./index.html?ui=light-v6"
```

改成：

```html
src="./app-core.html?ui=light-v6"
```

3. 将 `ui-game-v6.html` 重命名为 `index.html`。

这样网站首页就是 V6，而原有构筑逻辑仍由 `app-core.html` 提供。

## 兼容说明

V6 已针对两种页面结构进行了兼容：

- 当前项目的 8 步工作区结构。
- 较早版本的基础、属性、职业、技能、法术、专长、资料库结构。

当原页面重新渲染技能或法术列表时，V6 会自动重新绑定详情交互。

## 回退

V6 没有修改原有 `index.html`。需要回退时，删除或停止使用以下文件即可：

```text
ui-game-v6.html
assets/ui-light-v6.css
assets/ui-light-v6.js
assets/fantasy-forest-v6.webp
```
