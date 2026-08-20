# V8.2 装备数据导入管线

## 当前内置数据

V8.2 自带 130 件人工结构化的关键装备，用于正式交互和规则开发。

## 全量数据接入

V8.2 预留 `assets/v8/equipment-generated.js`。

如果获得 BG3 Forge 的 `items.json`：

```bash
node tools/import-bg3forge-items.mjs \
  /path/to/items.json \
  assets/v8/equipment-generated.js
```

导入器会：

1. 尝试识别装备槽位；
2. 识别章节、稀有度、武器/护甲类别；
3. 保留原始说明/被动为条件文本；
4. 对可识别的武器属性建立基础结构；
5. 丢弃明显不是可装备物品的行；
6. 生成 `equipment-generated-report.json`；
7. 与人工 curated catalog 合并，人工条目同 ID 优先。

## 为什么不自动把所有被动换算成数字

游戏装备中大量效果依赖：

- 目标状态；
- 光照；
- 专注；
- 距离；
- 每回合/每休息次数；
- 优势/劣势；
- 伤害类型；
- 特定职业/技能；
- 叠层机制。

因此自动导入阶段只建立“可搜索、可装备、可分章节”的完整资料结构；精确数值计算需要逐类 Rule Mapper，不做无依据的猜算。
