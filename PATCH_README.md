# V8 背景图恢复补丁

V8 背景资源没有丢失；旧版背景 `assets/fantasy-forest-v6.webp` 仍在仓库。
V8 基础 CSS 将 `body / #app` 改成纯深色背景后，旧背景被完全覆盖。

本补丁：
- 新增 `assets/v8/background.css`
- 仅修改 `v8.html`，在 `v82.css` 后加载背景层
- 继续复用 `assets/fantasy-forest-v6.webp`
- 不修改任何 JS、Store、Selectors、Rules、装备数据、法术数据或存储
- PC 使用固定全屏背景
- Mobile 保留同一背景但关闭 fixed attachment，避免滚动抖动

上传后刷新 `v8.html`，确认：
1. PC 可看到森林背景。
2. 导航、顶部栏、人物构筑与装备构筑文字清晰。
3. Mobile 背景正常，没有滚动白屏/闪烁。

如果仍看到旧样式，请强制刷新：
Windows: Ctrl + F5
macOS: Cmd + Shift + R
