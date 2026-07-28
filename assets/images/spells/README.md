# 法术与戏法图片目录

V7 里程碑 3 只请求一次项目本地 PNG，不再逐个尝试 WebP、JPG 和远程地址。

标准路径：

```text
assets/images/spells/<spellKey>.png
```

例如：

- `fireBolt.png`
- `magicMissile.png`
- `mistyStep.png`

请保留仓库中已经上传的同名图片。缺失图片会直接显示本地中性占位图，不会反复发起网络请求。
