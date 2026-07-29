# V7 M13 移动端实现规格

## 断点

- 移动端：`max-width: 767px`
- 平板/PC：沿用原布局
- iPhone 横屏：宽度 568–950px 且高度不超过 500px

## 页面职责

- 顶部：当前步骤、步骤进度、构筑摘要、更多设置。
- 中间：当前唯一任务及其选择列表。
- 底部：上一步、构筑结果、下一步。
- 详情：Bottom Sheet。
- 构筑结果：独立全屏角色纸。

## iOS 适配

- `viewport-fit=cover`
- `safe-area-inset-top/right/bottom/left`
- `100dvh` 与 `visualViewport`
- 输入框最小 16px，防止 Safari 自动缩放
- 键盘弹出时隐藏底部操作栏
- 不使用 `background-attachment: fixed`
- 降低移动端背景模糊强度

## 测试尺寸

- 375×667
- 390×844
- 393×852
- 430×932
- 844×390
- 360×800
