# BG3 构筑规划器 V7 · 里程碑 2

这是 V7 全新架构的第二阶段版本，不依赖 V5/V6 的 HTML 或覆盖样式，可直接部署到 GitHub Pages。

## 本阶段完成

- 子职业与成长节点
- 27 点购、创建加值与属性提升
- 技能来源、技能熟练与专精
- 需要主动选择的职业能力
- 戏法、法术书、已知法术与准备法术
- 最终构筑检查
- 独立完整角色纸
- 独立资料库
- 构筑保存、重置、删除
- JSON 导入与导出
- PC 三栏、平板抽屉、移动端单列与底部详情抽屉

## 法术与戏法图片修复

本版本不会重新用字母或新生成图标替换你项目里已经上传的法术图片。

图片按以下顺序读取：

1. `assets/images/spells/<spellKey>.png`
2. 同目录下的 `.webp`、`.jpg`、`.jpeg`
3. 旧兼容目录 `assets/spells/`
4. 旧兼容目录 `assets/icons/spells/`
5. 之前建立的 VG百科远程图片映射
6. 仅在以上全部失败时使用中性占位图

例如：

```text
assets/images/spells/magicMissile.png
assets/images/spells/fireBolt.png
assets/images/spells/mistyStep.png
```

`assets/images/spells/image-manifest.json` 已列出当前 191 个法术数据键对应的标准路径。

### 上传到已有仓库

将本压缩包内容覆盖上传到仓库根目录即可。请不要删除仓库中原有的：

```text
assets/images/spells/*.png
```

本压缩包在该目录中只包含说明和路径清单，不包含替代图片，因此不会覆盖你已经上传的图片。

## 本地预览

ES Modules 需要通过静态服务器运行：

```bash
python -m http.server 8000
```

然后访问：

```text
http://localhost:8000/
```

也可以直接部署到 GitHub Pages。

## 页面入口

应用使用 Hash Router：

```text
#/home
#/build/<id>/level
#/build/<id>/route
#/build/<id>/progression
#/build/<id>/abilities
#/build/<id>/skills
#/build/<id>/features
#/build/<id>/spells
#/build/<id>/review
#/character/<id>
#/library/spells
```

## 数据说明

- 构筑默认自动保存到浏览器 LocalStorage。
- JSON 导出只包含构筑状态，不包含 UI 展开状态。
- 导入构筑会生成新的构筑 ID，不覆盖现有构筑。
