# BG3 Planner V8.2 — bg3.wiki 高清资源补丁 v2

## 本版调整重点

上一版主要使用 **Controller / UI Icon** 作为缺图来源；这些图标通常只有 64px 或 144px，作为列表小图可以使用，但放到详情、装备卡片或高 DPR 屏幕上会明显偏糊。

本版改为优先寻找 bg3.wiki 中的 **原生 Tooltip 图片**：

- 法术：优先 `Spell tooltip` 图，通常为 **380×380**；
- 装备：优先 `Item tooltip / Faded` 图，通常为 **380×380**；
- 只有找不到 Tooltip/Faded 时，才回退到 144px Controller Icon / 64px Item Icon；
- **不做人工放大，不把 64/144/300px 图片插值后冒充高清。**

项目内新增加统一的高清目录：

```text
assets/hd/spells/<spellKey>.webp|png|jpg
assets/hd/equipment/<equipmentId>.webp|png|jpg
```

运行时和正式发布时都优先读取这里。

---

## 你给的 3 个链接会怎样处理

MediaWiki 的 `.../thumb/.../300px-...` 是缩略图地址，不应直接作为最终资源保存。本补丁会自动还原到原图地址。

### Moon Devotion Robe

```text
输入：
https://bg3.wiki/w/images/thumb/a/a5/Moon_Devotion_Robe_Icon.png/300px-Moon_Devotion_Robe_Icon.png.webp

还原原图：
https://bg3.wiki/w/images/a/a5/Moon_Devotion_Robe_Icon.png
```

### Ring D 1 Faded

```text
https://bg3.wiki/w/images/a/a1/Ring_D_1_Faded.png
```

这个已经是原图地址；`Faded` 类型正是装备优先使用的 Tooltip 素材类型。

### Dominate Beast

```text
输入：
https://bg3.wiki/w/images/thumb/4/45/Dominate_Beast.webp/300px-Dominate_Beast.webp

还原原图：
https://bg3.wiki/w/images/4/45/Dominate_Beast.webp
```

bg3.wiki 的 Spell Tooltip 分类中，`Dominate Beast.webp` 标记为 **380×380**。

对应记录也已写入：

```text
HD_SOURCE_EXAMPLES.csv
```

---

# 图片选择优先级

## 法术

```text
1. assets/hd/spells/<key>.*             ← 本地原生高清资源
2. bg3.wiki Spell Tooltip 原图          ← 优先 380×380
3. 历史 assets/spells/<key>.png/webp     ← 保留旧素材，不删除
4. bg3.wiki Controller Icon              ← 通常 144×144，仅兜底
5. 公共镜像 Controller Icon              ← 最后兜底
6. 文字占位图
```

这与 v1 最大的区别是：**当本地还没有 HD 文件时，会先尝试 Wiki 的 Tooltip 高清图，再回退到旧的小图。**

## 装备

```text
1. assets/hd/equipment/<id>.*            ← 本地原生高清资源
2. bg3.wiki Item Tooltip / *_Faded.*     ← 优先 380×380
3. 历史本地装备图片
4. *_Icon / *_Unfaded_Icon               ← 64/144px 兜底
5. 文字占位
```

装备文件名经常不是直接由装备英文名生成，例如戒指、手套、护甲可能共用游戏内部模型名，所以正式下载工具不仅猜文件名，还会：

1. 打开对应 bg3.wiki 装备页面；
2. 收集页面实际引用的图片；
3. 自动把 `300px` / `thumb` 地址还原为原图；
4. 优先评分 `Faded` / `Tooltip` 图片；
5. 下载后读取**实际原生像素尺寸**；
6. 选择分辨率更高的原图保存。

---

# 如何生成真正的本地高清资源包

将本补丁覆盖到 **完整 V8.2 仓库根目录**后执行：

```bash
python tools/vendor-bg3-wiki-assets-hd.py
```

只下载法术：

```bash
python tools/vendor-bg3-wiki-assets-hd.py --kind spell
```

只下载装备：

```bash
python tools/vendor-bg3-wiki-assets-hd.py --kind equipment
```

如果之前已经下载过较低分辨率文件，本版默认会自动重新检查 **小于 380px** 的 HD 目录文件并尝试替换；如需连已经 ≥380px 的文件也重新比较，可执行：

```bash
python tools/vendor-bg3-wiki-assets-hd.py --replace-lower-res
```

下载完成后会生成：

```text
BG3_WIKI_HD_ASSET_REPORT.json
```

每一项会记录：

- 项目 key / id；
- 中文名 / 英文名；
- 最终 Wiki 来源；
- 原生宽高；
- 文件字节数；
- 本地保存路径；
- 尝试过但失败的候选地址；
- `downloaded-hd / existing-hd / unresolved` 等状态。

最终只需要把下面内容一起上传 GitHub：

```text
assets/hd/
BG3_WIKI_HD_ASSET_REPORT.json
```

以及本补丁中的 JS 更新文件。

---

# 本补丁包含

```text
assets/hd/README.md
assets/hd/spells/
assets/hd/equipment/
assets/js/data/spell-assets.js
assets/v8/equipment-images.js
assets/v8/v82.js
assets/v8/v82.css

tools/vendor-bg3-wiki-assets-hd.py
tools/bg3-wiki-hd-overrides.json

HD_SOURCE_EXAMPLES.csv
HD_EQUIPMENT_SOURCE_CANDIDATES.csv
EQUIPMENT_IMAGE_SOURCES.csv
VALIDATION.json
```

其中：

- `HD_EQUIPMENT_SOURCE_CANDIDATES.csv`：当前 130 件装备的 HD 本地路径、Wiki 页面、Faded 候选与旧图兜底；
- `bg3-wiki-hd-overrides.json`：特殊文件名以及人工确认的高质量来源覆盖；
- `vendor-bg3-wiki-assets-hd.py`：真正执行“页面解析 → 原图还原 → 分辨率校验 → 本地落盘”的脚本。

旧版 `tools/vendor-bg3-wiki-assets.py` 仍保留，仅兼容 v1；**新项目请使用 `vendor-bg3-wiki-assets-hd.py`。**

---

# 关于当前 ZIP 中为什么没有直接塞入几百张新图片

当前 ChatGPT 文件运行环境可以访问 bg3.wiki 的网页索引，但对 `bg3.wiki/w/images/...` 原始二进制文件的直连下载被网络解析限制，因此无法可靠地把数百张原图在这里直接落到 `/mnt/data`。

所以本 ZIP 不会伪装成“已经下载完整的高清图片包”。它提供的是：

- 已验证的高清资源选择规则；
- 300px thumbnail → 原图 URL 自动还原；
- 页面级图片发现；
- 380px Tooltip/Faded 优先；
- 原生尺寸检测；
- 本地 `assets/hd` 资源结构；
- V8.2 实际加载逻辑；
- 可在有正常网络访问的完整仓库中一次生成高清图片包的下载工具。

这样比直接保存 300px 缩略图更合理，也不会把低清素材误标为高清。

---

## 缓存说明

本版使用新的失败缓存键，避免上一版失败记录干扰新的 HD 候选：

```text
bg3-v8-wiki-image-failures-v2
bg3-v8-equipment-image-failures-v2
```

---

## 来源与版权

资源定位目标为 `bg3.wiki` 上从《Baldur's Gate 3》游戏 UI / Tooltip 资产整理出的文件。请继续按照 Larian Fan Content Policy / Baldur's Gate 3 Fan Content Terms，以及 bg3.wiki 对相关文件页面的许可说明使用。补丁仅负责资源映射、下载与本地化，不改变素材本身的权利状态。
