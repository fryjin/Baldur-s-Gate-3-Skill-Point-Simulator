# V8.2.5 — Full Build Acceptance + Local HD Asset Fast Path

## A. 12级完整人物验收

主验收构筑：

- 等级：12
- 路线：圣武士 6 / 术士 6
- 起始职业：圣武士
- 子职业：复仇之誓 / 风暴术法
- 27 点购：STR15 DEX10 CON14 INT8 WIS8 CHA15
- 创建加值：CHA +2 / STR +1
- 两个职业各达到 4 级，因此**恰好 2 个专长/ASI 槽**，用于验证“专长解锁看单职业等级，不看总等级”
- ASI 后基础属性：STR18 DEX10 CON14 INT8 WIS8 CHA19
- 战斗风格：防御
- 超魔：瞬发、孪生
- 技能与法术由测试脚本补齐到 validationIssues=0

基础预期：
- HP 88
- AC 18
- 先攻 0
- 当前施法来源：术士
- 法术 DC 16
- 法术攻击 +8
- 多职业共享施法者等级 9：1环4 / 2环3 / 3环3 / 4环3 / 5环1
- 圣疗 4、誓言引导 1、术法点 6

### ACT 1
11 槽，核心数值装备：
- 精金板条甲
- 敏捷手套
- 防护戒指
- 精金盾牌
- 法拉·阿鲁维
- 泰坦弦弓

预期：
- DEX 18
- HP 88
- AC 22
- 先攻 +4
- 法术 DC 16
- 主手命中 +9
- 远程命中 +9

### ACT 2
继承 ACT1，仅保存差异：
- 防护斗篷
- 矮人板条甲
- 凯瑟里克之盾
- 绝不失手
- 地狱火手弩

预期：
- 12/12 槽
- ACT2 delta 恰好 5 个槽
- CON 16
- HP 100
- AC 24
- 先攻 +4
- 法术 DC 17
- 法术攻击 +9

### ACT 3
从 ACT2 继续替换：
- 天赋权利
- 织法斗篷
- 狱火暮光甲
- 大师遗产
- 强健护符
- 维康妮亚行走堡垒
- 致命一击

同时验证：
- 长弓替换双手弩组合时自动清除 rangedOff
- ACT3 delta 用 null 持久化移除
- 条件型腐蚀戒指伤害不错误加入基础 weaponDamageBonus

预期最终：
- STR18 DEX10 CON23 INT8 WIS8 CHA21
- HP 136
- AC 26
- 先攻 0
- 法术 DC 18
- 法术攻击 +10
- 主手命中 +10
- 主手 1d8+6
- 远程命中 +6
- 重击阈值 19
- 装备结构 errors=0 / warnings=0
- CHA 豁免 +10 / CON +7 / WIS +4

附加规则：
- 双手近战武器会自动清除盾牌
- 术士起始后兼职圣武士**不会获得起始职业重甲熟练**
- 未熟练重甲会阻止施法

执行：
```bash
node tools/validate-v825-full-build.mjs
```

成功会生成：
`V825_FULL_BUILD_ACCEPTANCE.json`

---

## B. 图片加载效率：为什么当前仍有优化空间

目前资源覆盖已是 319/319，但旧 loader 每张图仍然：

1. 先显示 placeholder；
2. 等 IntersectionObserver；
3. 猜 `.webp`；
4. 猜 `.png`；
5. 猜 `.jpg`；
6. 才继续 wiki / legacy fallback。

装备当前 130 个唯一 key 大量是 PNG，因此即使图片已经在本地，仍可能先产生一个本地 `.webp` 404。

法术最终页还被旧逻辑强制 eager，最多 18 张核心法术会不管是否在视口都立刻进入自定义加载流程。

### V8.2.5 Fast Path

生成：
`assets/js/data/hd-asset-manifest.js`

它直接记录**每个 key 真正存在的文件路径及扩展名**。

319 个已覆盖资源的成功路径变成：

```text
<img src="./assets/hd/.../real-file.png" loading="lazy">
```

结果：
- 不再猜扩展名；
- 本地成功时 JS fallback 根本不参与；
- 交给浏览器原生 lazy loading；
- 只有本地文件真的失败时才启动 wiki/legacy fallback；
- 最终页法术不再强制 eager；
- 图片增加 width/height，减少布局抖动；
- 自定义 IO 只服务理论上的“本地 manifest 缺失项”。

生成过程还会输出：
`IMAGE_FAST_PATH_REPORT.json`

里面会根据当前真实文件扩展名计算：
- PNG/WebP 分布
- 当前原始 HD 总字节
- 选中 primary 的总字节
- 多格式重复占用字节
- 旧版完整浏览目录时可避免的本地探测请求估算

### 为什么暂时不直接生成缩略图

380×380 HD 用在 34–70px UI 上确实还有字节优化空间，但先做 manifest fast path 有两个优势：
1. 完全不损失清晰度；
2. 不新增 319 个衍生资源文件。

如果 Fast Path 后真实 Network waterfall 仍明显偏重，下一步再生成约 192px WebP thumbnail + `srcset`，而不是现在就盲目扩大仓库。

---

## 安装与执行顺序

把包解压到当前仓库根目录：

```bash
python tools/apply-v825-image-fast-path.py

node tools/validate-v825-image-fast-path.mjs
node tools/validate-v825-full-build.mjs
```

同时建议继续跑已有规则回归：

```bash
node tools/validate-v82-equipment-rules.mjs
```

检查：
```bash
git status -sb
```

本轮正常会新增/修改：
- `assets/js/data/hd-asset-manifest.js`
- `assets/js/data/spell-assets.js`
- `assets/v8/equipment-images.js`
- `IMAGE_FAST_PATH_REPORT.json`
- `V825_FULL_BUILD_ACCEPTANCE.json`
- `assets/v8/v82.js`
- `v8.html`
- 本包内 4 个 tools

## 预览

访问：
`/v8?v=825`

重点看：
- 装备列表快速滚动时图片是否更快出现；
- 不再出现明显的“placeholder → 404等待 → 图片”延迟；
- 最终页核心法术图片按视口加载；
- 图像失败时仍保留 fallback 能力。

## 提交建议

全部 PASS 后：

```bash
git add assets/js/data/hd-asset-manifest.js
git add assets/js/data/spell-assets.js
git add assets/v8/equipment-images.js
git add IMAGE_FAST_PATH_REPORT.json
git add V825_FULL_BUILD_ACCEPTANCE.json
git add assets/v8/v82.js v8.html
git add tools/generate-hd-asset-manifest.py
git add tools/apply-v825-image-fast-path.py
git add tools/validate-v825-image-fast-path.mjs
git add tools/validate-v825-full-build.mjs

git commit -m "Validate V8.2.5 full build and optimize image loading"
git push origin main
```

不要使用 `git add .`。
