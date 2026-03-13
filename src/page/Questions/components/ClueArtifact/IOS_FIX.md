# ClueArtifact 组件 iOS 微信浏览器兼容性修复

## 问题描述

在多题目模式下，ClueArtifact 组件全屏时在 iOS 微信浏览器上显示异常（"炸了"），但在 Chrome 桌面浏览器上正常。

## 问题原因

1. **渲染条件判断问题**：`index.vue` 中使用了复杂的 `v-show` 条件判断 `!isExpanded && !(isFullscreen && type === 'img')`，在 iOS 微信浏览器上可能导致渲染时机问题

2. **iOS WebKit 渲染 bug**：iOS 微信浏览器（基于 WebKit）在处理以下 CSS 属性时存在已知的渲染问题：

   - `aspect-ratio` 属性
   - `height: 100%` 在嵌套容器中
   - 复杂的 flexbox 布局
   - `backdrop-filter` 和 `background-clip`
   - CSS mask 相关属性

3. **缺少硬件加速**：某些元素没有启用 GPU 硬件加速，导致渲染性能问题

## 修复方案

### 1. 优化渲染条件判断 (index.vue)

**修改前：**

```vue
<ArtifactCard v-show="!isExpanded && !(isFullscreen && type === 'img')" ... />
```

**修改后：**

```vue
<ArtifactCard
  v-if="!isExpanded && (!isFullscreen || type !== 'img')"
  v-show="!isFullscreen || type === 'img'"
  ...
/>
```

**原因**：使用 `v-if` 和 `v-show` 组合，确保在 iOS 微信浏览器上组件的挂载/卸载更加明确，避免渲染状态混乱。

### 2. 添加硬件加速 (所有子组件)

在所有子组件的关键容器上添加：

```css
-webkit-transform: translateZ(0);
transform: translateZ(0);
```

**修复的文件：**

- `ImageThumbnail.vue` - 缩略图容器
- `VideoMiniPlayer.vue` - 播放器容器和视频元素
- `UrlPreview.vue` - iframe 容器和 iframe 元素
- `TextExpander.vue` - 内容区域和纸张容器
- `ArtifactCard.vue` - 卡片容器

### 3. 添加 iOS 特定的样式前缀

对于 `object-fit` 等属性，添加 `-webkit-` 前缀：

```css
object-fit: cover;
-webkit-object-fit: cover;
```

## 测试建议

1. **在 iOS 微信浏览器上测试所有类型：**

   - text（文本展开）
   - img（图片预览）
   - video（视频播放）
   - url（iframe 预览）
   - letter（信件）
   - topic（主题）

2. **测试多题目模式：**

   - 全屏模式下的显示
   - 展开/收起动画
   - 切换题目时的重渲染

3. **测试交互：**
   - 点击图片预览大图
   - 点击播放视频
   - iframe 页面加载

## 技术说明

### 为什么使用 `translateZ(0)`？

`translateZ(0)` 会触发浏览器创建新的合成层（compositing layer），这会：

1. 启用 GPU 硬件加速
2. 修复某些渲染 bug
3. 提升动画性能
4. 解决 iOS Safari/微信浏览器上的闪烁、显示不全问题

### 为什么同时使用 `v-if` 和 `v-show`？

- `v-if` 控制组件的挂载/卸载，避免不必要的 DOM 渲染
- `v-show` 控制 CSS 的 `display` 属性，用于过渡动画
- 组合使用可以在 iOS 上获得更好的渲染一致性

## 相关文件

- `src/page/Questions/components/ClueArtifact/index.vue` - 主入口组件
- `src/page/Questions/components/ClueArtifact/ArtifactCard.vue` - 卡片组件
- `src/page/Questions/components/ClueArtifact/ImageThumbnail.vue` - 图片缩略图组件
- `src/page/Questions/components/ClueArtifact/TextExpander.vue` - 文本展开组件
- `src/page/Questions/components/ClueArtifact/VideoMiniPlayer.vue` - 视频播放器组件
- `src/page/Questions/components/ClueArtifact/UrlPreview.vue` - URL 预览组件

## 参考资料

- [iOS Safari 渲染问题](https://developer.apple.com/documentation/safari-release-notes/safari-15-release-notes)
- [WebKit 硬件加速](https://webkit.org/blog/11353/behind-the-scenes-of-webkit2/)
- [移动端浏览器兼容性查询](https://caniuse.com/)
