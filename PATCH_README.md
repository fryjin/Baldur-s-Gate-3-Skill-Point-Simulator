# V8.2.1 HD Vendor Fix

Baseline: GitHub `main` commit `d3bcd549b6b579e5cc42dfc37ae6344e1ce03ccd` (`Add HD assets`).

## 本轮修复

1. **修复法术解析器**
   - 当前 `spells.js` 是带引号键名的 JSON 对象：`{"key":...,"name":...,"en":...}`。
   - 旧脚本只匹配历史 `key:...` 写法，因此会静默得到 0 条法术。
   - 新版优先解析实际 JSON 数组，并保留历史格式 fallback。

2. **增加数量硬校验**
   - 下载前打印 `spells=... / equipment=...`。
   - 解析数量与源文件 marker 不一致时直接退出，不再允许整类资源被静默跳过。

3. **增加 MediaWiki API 图片发现**
   - 除 HTML 和文件名猜测外，直接读取页面实际引用的图片文件。
   - 用于解决文件名与装备展示名不一致时的 unresolved。

4. **支持 `--keys` 定点重试**
   - 不需要重新请求 130 件装备。

5. **修复 partial run 报告覆盖**
   - `--kind spell` 只更新 spell 条目，不再抹掉已有 equipment 报告。

6. **新增重复图片 SHA 审计**
   - `tools/audit-hd-assets.py` 生成 `BG3_WIKI_HD_ASSET_AUDIT.json`。
   - 相同 SHA 只标记为“需人工复核”，不会自动删图或替换，因为 BG3 本身可能复用素材。

## 上传/替换文件

- 替换 `tools/vendor-bg3-wiki-assets-hd.py`
- 替换 `tools/bg3-wiki-hd-overrides.json`
- 新增 `tools/audit-hd-assets.py`

## Codespaces 执行顺序

先只验证法术解析和单个资源，不批量下载：

```bash
python tools/vendor-bg3-wiki-assets-hd.py --kind spell --dry-run --keys acidSplash
```

第一行应看到接近：

```text
parsed rows: spells=191 (markers=191), equipment=130 (markers=130)
```

确认无误后下载全部法术 HD：

```bash
python tools/vendor-bg3-wiki-assets-hd.py --kind spell
```

只重试之前 3 个 unresolved 装备：

```bash
python tools/vendor-bg3-wiki-assets-hd.py --kind equipment --keys spellcrux,render-mind-body,staff-spellpower
```

然后执行本地审计：

```bash
python tools/audit-hd-assets.py
```

重点查看：

- `BG3_WIKI_HD_ASSET_REPORT.json`
- `BG3_WIKI_HD_ASSET_AUDIT.json`
- `assets/hd/spells/`
- `assets/hd/equipment/`

最后：

```bash
git status
```

确认后再 commit / 同步。默认不会覆盖已经存在且最短边 >= 380px 的 HD 文件。
