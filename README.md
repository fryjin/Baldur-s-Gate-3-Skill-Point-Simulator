# BG3 Planner V8.2 — bg3.wiki 图片补丁 v1

## 解决的问题

1. 修复 V8.2 没有执行 `bindImageFallbacks()`，导致仓库里**已有法术图片也停留在占位图**的问题。
2. 法术图片改为：**已有本地 PNG → 本地 vendored WEBP → bg3.wiki Controller Icon → 公共 bg3.wiki 镜像兜底**。
3. 装备候选列表、装备槽位、装备详情、最终配装开始展示真实装备图片。
4. 装备图片改为：**本地 vendored WEBP/PNG → bg3.wiki Item Icon 多候选自动探测**。
5. 提供一次性本地下载工具，将网页图片真正落盘后再上传 GitHub，避免长期热链及限流问题。

## 直接上传即可生效

前提：项目已经升级至 **V8.2**。

将本补丁包内容直接覆盖到仓库根目录。关键文件：

```text
assets/js/data/spell-assets.js
assets/v8/v82.js
assets/v8/v82.css
assets/v8/equipment-images.js
tools/vendor-bg3-wiki-assets.py
EQUIPMENT_IMAGE_SOURCES.csv
```

覆盖后 `/v8.html` 会立即使用本地图片，并在本地缺图时自动尝试 bg3.wiki。

## 推荐：正式发布前把所有图片落盘

在完整仓库根目录执行：

```bash
python tools/vendor-bg3-wiki-assets.py
```

脚本会读取：

```text
assets/js/data/spells.js
assets/v8/equipment-catalog.js
```

并按项目 key/id 下载到：

```text
assets/spells/<spellKey>.webp|png
assets/equipment/<equipmentId>.webp|png
```

最后生成：

```text
BG3_WIKI_ASSET_REPORT.json
```

之后把新增图片一起提交/上传即可。脚本可重复执行，已有图片会跳过。

## 为什么没有强制只写一个图片地址

bg3.wiki 的法术 ControllerUI 图标通常为 `<Spell Name> Icon.webp`；物品列表图标更常见的是 `Unfaded Icon.png`，但部分物品使用 `Item Icon.png` / WEBP 或特殊文件名。因此装备解析器按多个候选依次尝试，失败后才保留文字占位，不会出现破图。

## 缓存说明

补丁使用新的失败缓存 key：

```text
bg3-v8-wiki-image-failures-v1
bg3-v8-equipment-image-failures-v1
```

如果 bg3.wiki 某次被限流导致图片失败，关闭当前标签页重新打开即可清空 `sessionStorage` 失败记录。

## 来源与版权提醒

图片来源目标为 `bg3.wiki`。bg3.wiki 的相关文件页面会区分 Wiki 页面许可与 Larian Studios 游戏素材；游戏图标本身属于 Larian Studios 内容。此补丁仅做项目资源映射与本地化工具，不改变原素材权利状态。公开发布前请按 Larian Fan Content Policy / BG3 Fan Content Terms 及 bg3.wiki 页面说明使用。
