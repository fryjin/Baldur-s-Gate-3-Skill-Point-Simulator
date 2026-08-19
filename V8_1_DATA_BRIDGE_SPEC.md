# V8.1 数据与规则接轨规格

## 1. 架构原则

### 人物规则单一来源

V8 不维护第二套人物规则表。所有人物结果由 V7 模块计算后展示。

```text
V7 Store
   ↓
V7 Selectors / Resource Model
   ↓
V8.1 Character Adapter
   ↓
装备章节 Layer
   ↓
V8 Final Build
```

### 装备非侵入

装备路线使用独立 LocalStorage，不向 V7 Build Object 写入 `equipment` 字段。

这样在 V8.1 仍处于验证期时，可以随时回退 V7。

---

## 2. V7 → V8 字段

### 人物身份

- `build.name`
- `build.targetLevel`
- `build.identity.race`
- `build.identity.background`
- `characterSummary(build).route`

### 战斗结果

- `characterSummary.hp`
- `characterSummary.ac`
- `characterSummary.initiative`
- `characterSummary.casting.dc`
- `characterSummary.casting.attack`

### 属性

使用 `finalScores(build)`，不重新计算点购、创建加值或 ASI。

### 技能

使用：

- `proficientSkills(build)`
- `expertiseSkills(build)`

### 职业能力

使用 `activeFeatureGroups(build)` 的实际 selected 项。

### 法术

按 `spellSources(build)` 拆职业来源，再读取 `spellChoice(build, source.key)`。

准备状态与已知/法术书状态不在 V8 重新推导。

### 职业资源

直接使用 `buildResourceModel(build)`。

---

## 3. 装备章节模型

保存结构：

```js
{
  act: 2,
  slot: "armor",
  chapters: {
    1: { armor: "graceful-cloth" },
    2: { armor: "potent-robe", cloak: "cloak-protection" },
    3: { armor: "armour-agility" }
  }
}
```

每章保存的是**相对上一章的槽位变更**，不是完整快照。

有效装备通过顺序应用：

```text
第一章 changes
  + 第二章 changes
  + 第三章 changes
  = 最终装备
```

如果后续章节记录 `slot: null`，代表明确移除前章装备。

---

## 4. 装备影响 V8.1 Beta

当前接入：

- AC flat bonus；
- Dex floor 对 AC/先攻的影响；
- Con floor 对 HP 的影响；
- 主施法属性变化对 DC/攻击的影响；
- 法术 DC flat bonus；
- 法术攻击 flat bonus；
- 先攻；
- 额外伤害摘要；
- 重击阈值。

当前未接入：

- 装备自身 Armor Class 替换；
- 武器基础骰；
- 武器附魔命中；
- 双手/双持占槽；
- 装备熟练限制；
- 条件触发的精确伤害模拟；
- 充能与休息恢复；
- 套装/装备互斥。

这些应在 V8.2 Equipment Rules 中实现。

---

## 5. 兼容

V8.1 支持：

- 直接读取同源 V7 Store；
- 导入 V7 单构筑 JSON；
- 导入 V8.1 导出 JSON；
- 导出人物 + 装备一体化 JSON；
- 一键返回 V7 编辑当前人物；
- 一键打开当前 V7 角色纸。
