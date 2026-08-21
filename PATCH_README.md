# V8.2.4 Readability & Density Pass

## 本轮目标

V8.2.3 已解决主要结构问题，但 1920px 桌面截图仍暴露两个明显问题：

1. 大量正文仍是 7–10px，正常坐姿阅读困难。
2. `.v82-gear-search input` 同时命中了 checkbox，导致“只看本章新增”复选框被拉成巨大蓝色方块。

V8.2.4 不修改规则引擎，只处理 Typography / Density / Empty State。

## 字号策略

不是全局统一 16px，而是建立层级：

- 页面标题：维持 29–31px
- 一级导航/装备名：14–17px
- 正文说明：12–13px
- 辅助说明/英文名/来源：10–11px
- 最低可读字号：桌面原则上不再使用 7–8px 作为普通信息正文

重点提高：
- 左侧导航辅助文字
- 装备槽名称
- 装备英文名、来源、效果说明、标签
- 实际数值变化
- 右侧实时规则结果
- 最终属性 / 豁免 / 武器 / 法术 / 章节路线
- 人物编辑器中的 7–9px 辅助信息

## Checkbox 修复

V8.2.3：

```css
.v82-equipment-stage .v82-gear-search input {
  width:220px!important;
}
```

会同时拉伸文本框和 checkbox。

V8.2.4 改为：
- `input[data-search]` 单独控制搜索框宽度
- `input[type=checkbox]` 固定 16×16

## 空状态压缩

当前 1 级测试角色没有：
- 职业资源
- 职业能力
- 核心法术等部分内容

V8.2.4 使用 `:has()` 对只有“暂无/无”的最终页卡片做紧凑处理，不让空卡占据和完整模块相同的视觉高度。

## 背景与对比

保留森林场景，不重新盖成纯黑。
只给最终结果卡片增加轻微局部暗底，提升小字号放大后的阅读稳定性。

## 安装

把 ZIP 解压到完整仓库根目录：

```bash
python tools/apply-v824-readability.py
node --check assets/v8/v82.js

grep -n "v824.css" v8.html
grep -n "V8.2.4" assets/v8/v82.js | head
```

成功输出：

```text
Applied V8.2.4 Readability & Density Pass.
Changed: assets/v8/v82.js, v8.html
Added/updated: assets/v8/v824.css
```

## 预览验收

访问：

```text
/v8?v=824
```

检查：

1. 左侧导航无需凑近看。
2. “只看本章新增”恢复正常 16px checkbox。
3. 装备名/英文名/说明/标签层级清楚。
4. 右侧实时数值可快速扫读。
5. 最终页属性/豁免/武器/章节数据不再出现 7–8px 信息文字。
6. 空模块明显压缩。
7. 无新增横向滚动。

## 提交建议

确认预览无异常：

```bash
git add assets/v8/v824.css assets/v8/v82.js v8.html tools/apply-v824-readability.py
git commit -m "Improve V8.2.4 readability and density"
git push origin main
```

不要使用 `git add .`。
