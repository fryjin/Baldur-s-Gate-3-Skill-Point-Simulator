# 博德之门 3 构筑模拟器｜游戏式 UI 重构 V5

## 包的用途

这是现有项目的 UI 增强层，不替换 `index.html` 中的构筑数据、计算规则、localStorage、导入导出和业务事件。

上传后通过独立入口预览：

`ui-game-restructure.html`

该页面会同源加载仓库根目录的 `index.html`，并注入：

- `assets/ui-game-restructure.css`
- `assets/ui-game-restructure.js`

## 上传方法

将压缩包内文件上传到现有 GitHub 仓库根目录，并保持目录结构：

```text
仓库根目录/
├── index.html                         现有文件，不要删除
├── ui-game-restructure.html           新增
└── assets/
    ├── ui-game-restructure.css        新增
    └── ui-game-restructure.js         新增
```

上传完成后访问：

```text
https://你的域名或GitHub-Pages地址/ui-game-restructure.html
```

## V5 已完成内容

- 游戏式顶部等级与构筑状态栏
- 左侧八步构筑流程和完成／待处理徽章
- 中央单步骤决策模式
- 固定上一步、角色纸、下一步操作栏
- 初始属性焦点面板
- 目标等级 1–12 级轨迹选择
- 逐级职业路线时间轴
- 子职业与专长分段
- 普通专长／属性提升双模式选择
- 技能来源、已选技能、技能详情卡片化
- 职业能力主动选择和自动能力折叠
- 法术已选栏、图标视图、详情检查器
- 本地法术图片、远程图片及失败占位图兼容
- 右侧角色纸总览／能力／技能／法术分层
- 待处理项直接跳转
- 存档和快速预设界面重构
- 移动端简化步骤头和全屏角色纸抽屉
- 键盘导航、焦点样式和减少动画适配

## 快捷操作

- `Ctrl / Cmd + ←`：上一步
- `Ctrl / Cmd + →`：下一步
- 方向键：切换步骤、页签或分段选项
- `Esc`：关闭移动端角色纸

## 图片目录建议

后续本地化图片建议放置为：

```text
assets/images/spells/
assets/images/skills/
assets/images/feats/
assets/images/classes/
```

HTML 或数据映射中使用相对路径，例如：

```text
assets/images/spells/magicMissile.png
```

V5 已对图片缺失和加载失败做降级处理，不会因为单张图片失效破坏布局。
