# V7 M20 移动端法术卡片修复补丁

本补丁基于 V7 M19，处理移动端法术页剩余的卡片重叠和顶部统计排版问题。

## 覆盖内容

- 法术来源选择器单独占一行。
- 戏法、法术书和准备数量固定为三列统计行。
- 法术卡片改为自然高度，禁止固定高度裁切。
- 标题、状态、分类、摘要和公式使用独立布局行。
- 列表摘要缩为一行，完整说明继续在详情抽屉显示。
- 选择和准备状态不会改变卡片尺寸。
- 法术列表增加底部安全间距。

## 覆盖方式

将补丁包中的文件按原目录覆盖或新增：

```text
index.html
assets/css/m19-mobile-spells.css
assets/css/m20-mobile-spell-cards.css
assets/js/patches/m19-mobile-spells.js
```

`m20-mobile-spell-cards.css` 必须在 `m19-mobile-spells.css` 之后加载。

本补丁不会修改：

```text
assets/spells/*.png
assets/js/data/*
assets/js/store.js
```
