# V8.2.3 UI Acceptance

本轮只处理 V8.2.2 实际页面验收暴露出的 UI/信息密度问题，不修改装备规则引擎。

## 当前截图确认

V8.2.2 已经成功：
- 装备候选卡显示真实数值变化。
- 右侧显示生命 / AC / 先攻 / 豁免 / 施法 / 武器结果。
- 最终页存在最终属性、豁免、武器、施法来源、章节数值演进。
- 森林背景已恢复。

## 本轮修复

### 装备页
- 候选卡右侧结果区 120px → 168px。
- 搜索框 PC 约 220px。
- 实际变化文本自然换行。
- 实时规则栏 300px → 320px。
- 右侧武器结果改成上下排版，避免挤压。

### 最终页
旧结构是一个双列 Grid，同一行两张卡共享行高，所以短卡会被长卡撑出大量空白。

新结构：
- 最终装备：全宽
- 左列独立堆叠：最终属性 → 武器面板 → 职业资源 → 技能熟练
- 右列独立堆叠：最终豁免 → 施法来源 → 职业能力 → 核心法术
- 章节路线：全宽
- 精确/条件/错误模块：全宽

这样左右列互不撑高。

## 安装

解压到仓库根目录后：

```bash
python tools/apply-v823-ui-acceptance.py
node --check assets/v8/v82.js
git status -sb
```

预览确认后再提交：

```bash
git add assets/v8/v823.css assets/v8/v82.js v8.html tools/apply-v823-ui-acceptance.py
git commit -m "Refine V8.2.3 equipment and final UI"
git push origin main
```
