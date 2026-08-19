# V7 M25 — 法术学习布局与“本级学习名额”修复

## 修复 1：学习节点再次覆盖法术列表

根因不是 z-index，而是 PC 端 `desktop.css` 仍将 `.spell-layout` 固定成四行 Grid：

1. 工具栏
2. 数量
3. 已准备栏
4. 法术列表

M24 又插入“规则摘要”和“学习节点”，浏览器只能创建隐式 Grid 行，因此再次挤压/覆盖法术卡片。

M25 将 PC 法术工作区改为纵向 Flex：所有摘要和学习节点真实占据自己的高度，只有法术列表使用剩余空间并纵向滚动。

## 修复 2：明确显示当前职业等级新增多少法术

新增独立状态：

```text
本级学习名额
术士7级 · 新增 1 个法术
已选 0/1 · 还剩1个 · 最高4环 · 本级可替换1个
```

这里的“本级”指当前构筑中该职业的**最新职业等级**，与“当前正在补哪个历史学习节点”是两个概念。

例如角色为术士7 / 牧师2：

- 本职业当前等级：术士7级
- 本级新增学习名额：1个
- 如果术士1级历史节点还没补完，节点操作仍会显示“当前处理：术士1级”；
- 两者同时展示，不再让用户从 `0/1` 小字猜测。

## 文件

覆盖/新增：

- `index.html`
- `assets/css/m25-spell-layout.css`
- `assets/js/patches/m25-spell-layout.js`

依赖现有 M24：

- `assets/js/patches/m24-spell-learning.js`
- `assets/css/m24-spell-learning.css`
- `assets/js/data/spell-learning.js`

不修改 `assets/spells/*.png`。
