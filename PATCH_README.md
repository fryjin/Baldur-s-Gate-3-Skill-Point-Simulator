# V7 M21 补丁

## 修复内容

1. 角色纸“总览 / 技能 / 成长 / 职业能力 / 法术”由锚点链接改为 `type="button"` 的页内导航。
2. 点击章节按钮只在当前角色纸内滚动，不再触发应用路由或返回首页。
3. 当前可见章节会自动高亮。
4. 伤害、治疗和武器效果图标改为统一徽章式图标，并按类型显示中文识别符。

## 覆盖文件

```text
index.html
assets/css/m21-icons-and-sheet.css
assets/js/views/character-view.js
```

补丁基于 GitHub 当前 V7 M20 版本生成，不修改 `assets/spells/*.png`。
