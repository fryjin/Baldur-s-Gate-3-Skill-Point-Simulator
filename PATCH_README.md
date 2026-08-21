# BG3 HD Asset Finalize

## 本轮结论

最后两个 unresolved 不再继续找图：

- `greenFlameBlade` / Green-Flame Blade
- `wordOfRadiance` / Word of Radiance

核验后，这两项不是当前 BG3 正式可用法术，应从项目法术数据中清理，而不是补图片。

## 本轮处理内容

### `tools/finalize-hd-assets.py`

执行后会：

1. 将 `spellData` 从 191 条修正为 **189 条**。
2. 删除 `greenFlameBlade`、`wordOfRadiance`。
3. 从 `BG3_WIKI_HD_ASSET_REPORT.json` 移除对应目标。
4. 检查本地已经存在的手工补图，并把旧 unresolved 状态自动改为 resolved：
   - `spellcrux`
   - `render-mind-body`
   - `staff-spellpower`
   - `shield`
5. 重新计算报告：
   - spell = 189
   - equipment = 130
   - total target keys = 319
6. 删除误上传的重复报告：
   - `assets/hd/spells/BG3_WIKI_HD_ASSET_REPORT.json`

### `tools/audit-hd-assets.py` v2

修复两个旧问题：

1. Windows 反斜杠导致所有图片被归到 `other`。
2. 把物理图片文件数量误当成覆盖率。

新 audit 按 **唯一 asset key** 计算覆盖率。

因此同一 spell 同时存在 `.png` 与 `.webp` 时：
- raw files 会 +2；
- coverage 仍只算 1 个 spell key。

## 执行顺序

在完整仓库根目录运行：

```bash
python tools/finalize-hd-assets.py
python tools/audit-hd-assets.py
python tools/validate-hd-finalization.py
```

预期最终：

```text
HD asset finalization validation: PASS
spell keys: 189
equipment keys: 130
target keys: 319
```

audit 核心应为：

```text
missing_target_keys: 0
stale_report_unresolved_rows: 0
```

`raw_image_files` 可能大于 319，这是正常的。

## 提交建议

确认 PASS 后只提交：

```bash
git add assets/js/data/spells.js
git add BG3_WIKI_HD_ASSET_REPORT.json
git add BG3_WIKI_HD_ASSET_AUDIT.json
git add tools/finalize-hd-assets.py
git add tools/audit-hd-assets.py
git add tools/validate-hd-finalization.py
git add -u assets/hd/spells/BG3_WIKI_HD_ASSET_REPORT.json

git commit -m "Finalize HD asset coverage"
git push origin main
```

不要使用 `git add .`。
