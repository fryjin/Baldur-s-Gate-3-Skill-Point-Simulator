# HD Asset Finalize V2 — spells.js parser hotfix

## 为什么上一版失败

当前 `assets/js/data/spells.js` 不是单纯的：

```js
export const spellData=[...];
```

数组后面还有其他 JavaScript 内容。

上一版脚本把 `spellData=` 后面的**整份文件剩余内容**传给 `json.loads()`，所以在数组结束后遇到后续 JS 时出现：

```text
JSONDecodeError: Extra data
```

更重要的是，旧的重写逻辑如果被强行绕过，还可能把数组后面的 JS 删除。

## V2 修复

改为 `json.JSONDecoder().raw_decode()`：

1. 精确定位 `export const spellData=`
2. 只解析紧随其后的 JSON 数组
3. 记录数组结束位置
4. 只替换数组本身
5. 数组之前、之后的所有 JavaScript 原样保留

validator 也使用相同方式读取。

## 你刚才的仓库状态

上一轮 `finalize-hd-assets.py` 在写入 `spells.js` 之前就异常退出，因此：

- `spells.js` 没有被上一版破坏
- HD report 也没有被 Finalize 改写
- `audit-hd-assets.py` 运行过，因此 `BG3_WIKI_HD_ASSET_AUDIT.json` 目前只是一个“Finalize 前”的临时审计结果

直接覆盖 V2 脚本后重新执行即可。

## 执行

上传/覆盖这个包后：

```bash
python tools/finalize-hd-assets.py
node --check assets/js/data/spells.js
python tools/audit-hd-assets.py
python tools/validate-hd-finalization.py
```

预期：

```text
spell_rows_before: 191
spell_rows_after: 189
report_items_after: 319
report_unresolved_after: 0
spell_module_suffix_preserved: true
```

Audit：

```text
missing_target_keys: 0
stale_report_unresolved_rows: 0
```

Validator：

```text
HD asset finalization validation: PASS
spell keys: 189
equipment keys: 130
target keys: 319
```

## 提交

验证 PASS 后：

```bash
git status -sb

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
