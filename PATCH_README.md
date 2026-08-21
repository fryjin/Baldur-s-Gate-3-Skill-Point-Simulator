# V8.2.6 — Character Rule Guardrails

## 处理的问题

### 1. 属性点购可以超过 27
旧版只是事后报错，Store 本身没有硬限制。

V8.2.6：
- 新增 `assets/js/data/point-buy.js` 作为点购规则单一来源。
- `setAbilityScore()` 写入前校验总预算。
- UI `+` 根据下一档成本与剩余预算自动 disabled。
- 旧的超预算数据仍允许用 `-` 修复，但不能继续加。

### 2. 法术学习的交互与限制不清晰
正确规则不是“每环固定 X 个”。

#### 已知法术 / 升级法术书
按职业等级产生学习节点：

以术士 8 为例：
- 戏法总额：5
- 1级：2 个法术，最高1环
- 2级：+1，最高1环
- 3级：+1，最高2环
- 4级：+1，最高2环
- 5级：+1，最高3环
- 6级：+1，最高3环
- 7级：+1，最高4环
- 8级：+1，最高4环
- 已知法术总数：9

V8.2.6 会显示：
- 当前职业等级
- 戏法已选/上限
- 戏法获得节点
- 已知/准备总额
- 当前学习节点
- 本级新增名额
- 剩余名额
- 当前节点最高环阶

高于当前节点最高环阶的法术仍可查看，但选择按钮锁定。

#### 准备施法职业
牧师 / 德鲁伊 / 圣武士没有“每环准备配额”：
- 在当前最高可施放环阶内任意组合
- 只限制总准备数量
- 法术位数量不是准备数量

## 更重要的硬限制

- 逐级学习不能跳级。
- `assignToNode()` 本身拒绝在早期节点未完成时写入未来节点。
- migration 不再自动伪造 `migrated:true` 替换记录来合法化旧高环选择。
- 非法旧数据会保留并在人物校验里显示 Error。
- 戏法与准备法术达到总上限后，UI 和 Store 都阻止继续添加。

## 执行

```bash
python tools/apply-v826-character-guardrails.py

node tools/validate-v826-character-guardrails.mjs
node tools/validate-v825-full-build.mjs
node tools/validate-v82-equipment-rules.mjs
```

专项验证成功：

```text
V8.2.6 character guardrail validation: PASS
point buy: hard cap 27
sorcerer 8: cantrips 5; known spells 9
```

原 12 级人物/装备验收也必须继续 PASS。

## 页面验收

访问：

```text
/v8?v=826
```

### 点购
测试：
```text
STR15 DEX15 CON15 INT8 WIS8 CHA8 = 27/27
```
此时 INT/WIS/CHA 的 `+` 必须 disabled。

### 术士8
如果当前节点是术士3级：
```text
本级新增 1
剩余 1
最高 2环
```
此时：
- 1/2环可选
- 3/4环可查看但不能选择
- 完成后自动推进到下一职业等级节点
- 必须到术士7级学习节点才解锁4环学习

## 提交

全部 PASS 后：

```bash
git add assets/js/data/point-buy.js
git add assets/js/selectors.js
git add assets/js/store.js
git add assets/js/data/spell-progression.js
git add assets/js/data/spell-learning.js
git add assets/v8/character-editor.js
git add assets/v8/v826.css
git add assets/v8/v82.js v8.html
git add tools/apply-v826-character-guardrails.py
git add tools/validate-v826-character-guardrails.mjs

git commit -m "Enforce V8.2.6 character rule guardrails"
git push origin main
```

不要使用 `git add .`。
