<!-- components/MagicScroll.vue -->
<template>
  <Teleport to="body">
    <transition name="magic-scroll">
      <div v-if="visible" class="scroll-overlay" @click.self="handleClose">
        <!-- 魔法粒子背景 -->
        <div class="magic-particles">
          <span v-for="n in 20" :key="n" class="particle" :style="getParticleStyle()"></span>
        </div>

        <!-- 光芒效果 -->
        <div class="magic-glow"></div>

        <div class="scroll-body">
          <!-- 外部关闭按钮 - 魔法水晶风格 -->
          <div class="magic-close-btn" @click="handleClose">
            <div class="close-crystal">
              <div class="crystal-inner">
                <span class="close-rune">✕</span>
              </div>
              <div class="crystal-glow"></div>
            </div>
            <div class="close-orbits">
              <span class="orbit orbit-1"></span>
              <span class="orbit orbit-2"></span>
            </div>
          </div>

          <!-- 信纸主体 -->
          <div class="scroll-paper">
            <div class="paper-corner paper-corner-tl"></div>
            <div class="paper-corner paper-corner-tr"></div>
            <div class="paper-corner paper-corner-bl"></div>
            <div class="paper-corner paper-corner-br"></div>

            <div class="scroll-view custom-scrollbar">
              <div class="scroll-content-wrap">
                <div class="scroll-title">{{ title || "神谕密卷" }}</div>
                <!-- 核心：渲染解析后的富文本 -->
                <div class="scroll-text">
                  <template v-for="(segment, index) in parsedContent" :key="index">
                    <!-- 普通文本 -->
                    <span v-if="segment.type === 'text'">{{ segment.content }}</span>

                    <!-- 高亮文本 -->
                    <span v-else-if="segment.type === 'highlight'" class="scroll-highlight">
                      {{ segment.content }}
                    </span>

                    <!-- 链接/路由 -->
                    <span
                      v-else-if="segment.type === 'link'"
                      class="scroll-link"
                      @click="handleLinkClick(segment.url!)"
                    >
                      {{ segment.content }}
                    </span>

                    <!-- 图片 -->
                    <div v-else-if="segment.type === 'image'" class="scroll-image-wrap">
                      <van-image
                        :src="segment.url"
                        width="100%"
                        fit="contain"
                        class="scroll-img"
                        @click="handleImageClick(segment.url!)"
                      />
                    </div>

                    <!-- 视频 -->
                    <div
                      v-else-if="segment.type === 'video'"
                      class="scroll-video-wrap"
                      :style="segment.poster ? { backgroundImage: `url(${segment.poster})` } : {}"
                      :class="{ 'has-poster': segment.poster }"
                      @click="openVideoPlayer(segment.url!)"
                    >
                      <div class="video-play-btn">
                        <el-icon :size="toVpx(28)"><VideoPlay /></el-icon>
                      </div>
                    </div>

                    <!-- 换行 -->
                    <br v-else-if="segment.type === 'br'" />
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </transition>
    <VideoPlayer ref="videoPlayerRef" />
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { VideoPlay } from "@element-plus/icons-vue";
import { useContentParser } from "../composables/useContentParser";
import { toVpx } from "@/utils/toVpx";
import VideoPlayer from "@/components/VideoPlayer.vue";

const visible = ref(false);
const rawText = ref("");
const title = ref("");

// 使用公共解析 Hook
const { parsedContent, handleLinkClick: onLinkClick, handleImageClick } = useContentParser(rawText);

// 包装链接点击，跳转后关闭卷轴
const handleLinkClick = (url: string) => {
  onLinkClick(url);
  if (!url.startsWith("http")) {
    handleClose();
  }
};

const videoPlayerRef = ref<any>(null);
const openVideoPlayer = (url: string) => {
  videoPlayerRef.value?.open(url);
};

// 字体是否已加载的标记，避免重复加载
let fontsLoaded = false;

/**
 * 生成粒子随机样式
 */
const getParticleStyle = () => {
  const size = 2 + Math.random() * 4;
  const left = Math.random() * 100;
  const delay = Math.random() * 3;
  const duration = 3 + Math.random() * 4;
  const hue = 30 + Math.random() * 30; // 金色到橙色

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    backgroundColor: `hsl(${hue}, 80%, 60%)`,
  };
};

/**
 * 动态加载字体 CSS
 * 只在组件首次展示时加载，不阻塞首屏渲染
 */
const loadFonts = () => {
  if (fontsLoaded) return;
  fontsLoaded = true;

  const fontUrls = [
    new URL("@/assets/fonts/Cinzel/font.css", import.meta.url).href,
    new URL("@/assets/fonts/CrimsonText/font.css", import.meta.url).href,
  ];

  fontUrls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = url;
    document.head.appendChild(link);
  });
};

/**
 * 组件挂载后，在页面空闲时预加载字体
 * 这样既不阻塞首屏渲染，又能在用户打开弹窗前准备好字体
 */
onMounted(() => {
  // 使用 requestIdleCallback 在浏览器空闲时加载
  // 如果浏览器不支持，则退化为 setTimeout
  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => loadFonts(), { timeout: 3000 });
  } else {
    // 延迟 1 秒后加载，确保首屏资源优先
    setTimeout(loadFonts, 1000);
  }
});

const show = (data: { title: string; content: string }) => {
  // 展示时才加载字体，不阻塞首屏
  loadFonts();
  rawText.value = data.content;
  title.value = data.title;
  visible.value = true;
};

const handleClose = () => {
  visible.value = false;
};

// 监听可见性，同步全局标记
watch(visible, (val) => {
  if (val) {
    document.documentElement.setAttribute("data-magicscrollshow", "true");
  } else {
    document.documentElement.removeAttribute("data-magicscrollshow");
  }
});

onBeforeUnmount(() => {
  document.documentElement.removeAttribute("data-magicscrollshow");
});

defineExpose({ show });
</script>

<style lang="scss" scoped>
// 字体通过 JS 动态加载，参见 loadFonts() 方法

.scroll-overlay {
  position: fixed;
  inset: 0;
  z-index: 99;
  // 透明背景，带有轻微的魔法紫色调
  background: rgba(20, 15, 35, 0.65);
  backdrop-filter: blur(16vpx) saturate(1.2);
  -webkit-backdrop-filter: blur(16vpx) saturate(1.2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40vpx;
  perspective: 1500vpx;
  overflow: hidden;
}

// 魔法粒子
.magic-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  .particle {
    position: absolute;
    bottom: -10%;
    border-radius: 50%;
    box-shadow:
      0 0 6px currentColor,
      0 0 12px currentColor;
    animation: float-up 6s ease-in-out infinite;
    opacity: 0;
  }
}

@keyframes float-up {
  0% {
    transform: translateY(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  90% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-110vh) scale(1);
    opacity: 0;
  }
}

// 中央光芒
.magic-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 600vpx;
  height: 600vpx;
  transform: translate(-50%, -50%);
  background: radial-gradient(
    ellipse at center,
    rgba(218, 165, 32, 0.15) 0%,
    rgba(139, 90, 43, 0.08) 30%,
    transparent 70%
  );
  pointer-events: none;
  animation: glow-pulse 4s ease-in-out infinite alternate;
}

@keyframes glow-pulse {
  from {
    opacity: 0.6;
    transform: translate(-50%, -50%) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1.1);
  }
}

.scroll-body {
  position: relative;
  width: 100%;
  max-width: 340vpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

// 魔法水晶关闭按钮
.magic-close-btn {
  position: absolute;
  top: -20vpx;
  right: -10vpx;
  width: 48vpx;
  height: 48vpx;
  z-index: 10;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;

  .close-crystal {
    position: relative;
    width: 36vpx;
    height: 36vpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .crystal-inner {
      width: 100%;
      height: 100%;
      background: linear-gradient(
        135deg,
        rgba(180, 130, 70, 0.9) 0%,
        rgba(139, 90, 43, 0.95) 50%,
        rgba(100, 60, 20, 0.9) 100%
      );
      border-radius: 50%;
      border: 2vpx solid rgba(218, 165, 32, 0.6);
      box-shadow:
        0 0 15vpx rgba(218, 165, 32, 0.4),
        0 0 30vpx rgba(218, 165, 32, 0.2),
        inset 0 2vpx 4vpx rgba(255, 255, 255, 0.3),
        inset 0 -2vpx 4vpx rgba(0, 0, 0, 0.3);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      .close-rune {
        color: rgba(255, 245, 220, 0.9);
        font-size: 16vpx;
        font-weight: 300;
        text-shadow:
          0 0 8px rgba(255, 215, 0, 0.8),
          0 0 16px rgba(255, 215, 0, 0.4);
      }
    }

    .crystal-glow {
      position: absolute;
      inset: -8vpx;
      background: radial-gradient(circle, rgba(218, 165, 32, 0.3) 0%, transparent 70%);
      border-radius: 50%;
      animation: crystal-pulse 2s ease-in-out infinite alternate;
    }
  }

  // 环绕轨道效果
  .close-orbits {
    position: absolute;
    inset: -6vpx;
    pointer-events: none;

    .orbit {
      position: absolute;
      inset: 0;
      border: 1vpx solid transparent;
      border-top-color: rgba(218, 165, 32, 0.5);
      border-radius: 50%;
      animation: orbit-rotate 3s linear infinite;

      &.orbit-1 {
        animation-duration: 3s;
      }

      &.orbit-2 {
        inset: -4vpx;
        border-top-color: rgba(218, 165, 32, 0.3);
        animation-duration: 4s;
        animation-direction: reverse;
      }
    }
  }

  &:active {
    .close-crystal .crystal-inner {
      transform: scale(0.9);
      box-shadow:
        0 0 20vpx rgba(218, 165, 32, 0.6),
        0 0 40vpx rgba(218, 165, 32, 0.3),
        inset 0 2vpx 4vpx rgba(255, 255, 255, 0.3),
        inset 0 -2vpx 4vpx rgba(0, 0, 0, 0.3);
    }
  }
}

@keyframes crystal-pulse {
  from {
    opacity: 0.5;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1.05);
  }
}

@keyframes orbit-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 羊皮纸信纸主体
.scroll-paper {
  width: 90%;
  position: relative;
  background-color: #f4e4bc;
  background-image:
    // 噪点纹理
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E"),
    // 折痕效果
    linear-gradient(
        to bottom,
        transparent 33%,
        rgba(139, 69, 19, 0.08) 33.5%,
        transparent 34%,
        transparent 66%,
        rgba(139, 69, 19, 0.08) 66.5%,
        transparent 67%
      ),
    radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, rgba(160, 120, 60, 0.1) 80%);

  box-shadow:
    0 10vpx 30vpx rgba(0, 0, 0, 0.5),
    0 1vpx 3vpx rgba(0, 0, 0, 0.2),
    0 0 60vpx rgba(218, 165, 32, 0.15);

  padding: 0; // padding 移至内部
  min-height: 400vpx;
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  overflow: hidden; // 由内部 scroll-view 负责滚动
  padding-bottom: 12vpx;
  padding-top: 12vpx;
  border: 1vpx solid rgba(139, 90, 43, 0.2);
  outline: 4vpx double rgba(139, 90, 43, 0.15);
  outline-offset: -12vpx;

  z-index: 1;

  /* 已改为由 .scroll-view 配合 .custom-scrollbar 控制 */

  // 底部固定装饰线（原 ::before 逻辑移到这里作为固定层）
  &::after {
    content: "";
    position: absolute;
    inset: 30vpx 24vpx;
    border: 2vpx solid transparent;
    border-image: linear-gradient(
        to bottom,
        transparent,
        rgba(139, 69, 19, 0.2) 20%,
        rgba(139, 69, 19, 0.2) 80%,
        transparent
      )
      1;
    pointer-events: none;
    z-index: 2;
  }

  // 角落装饰
  .paper-corner {
    position: absolute;
    width: 24vpx;
    height: 24vpx;
    pointer-events: none;

    &::before,
    &::after {
      content: "";
      position: absolute;
      background: linear-gradient(45deg, rgba(139, 90, 43, 0.4) 0%, rgba(218, 165, 32, 0.3) 100%);
    }

    &.paper-corner-tl {
      top: 8vpx;
      left: 8vpx;
      &::before {
        width: 100%;
        height: 2vpx;
        top: 0;
        left: 0;
      }
      &::after {
        width: 2vpx;
        height: 100%;
        top: 0;
        left: 0;
      }
    }

    &.paper-corner-tr {
      top: 8vpx;
      right: 8vpx;
      &::before {
        width: 100%;
        height: 2vpx;
        top: 0;
        right: 0;
      }
      &::after {
        width: 2vpx;
        height: 100%;
        top: 0;
        right: 0;
      }
    }

    &.paper-corner-bl {
      bottom: 8vpx;
      left: 8vpx;
      &::before {
        width: 100%;
        height: 2vpx;
        bottom: 0;
        left: 0;
      }
      &::after {
        width: 2vpx;
        height: 100%;
        bottom: 0;
        left: 0;
      }
    }

    &.paper-corner-br {
      bottom: 8vpx;
      right: 8vpx;
      &::before {
        width: 100%;
        height: 2vpx;
        bottom: 0;
        right: 0;
      }
      &::after {
        width: 2vpx;
        height: 100%;
        bottom: 0;
        right: 0;
      }
    }
  }

  .scroll-view {
    flex: 1;
    overflow-y: auto;
    padding: 40vpx 30vpx 80vpx; // 底部留出 80px 确保文字不盖到底部条
    position: relative;
    z-index: 1;

    &::-webkit-scrollbar {
      width: 4vpx;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(93, 64, 55, 0.3);
      border-radius: 2vpx;
    }
  }

  .scroll-content-wrap {
    position: relative;
  }

  .scroll-title {
    font-family: "Cinzel", "Georgia", serif;
    font-size: 14vpx;
    color: #4e342e;
    font-weight: 700;
    text-align: center;
    margin-bottom: 20vpx;
    letter-spacing: 2vpx;
    text-shadow: 0 1vpx 2vpx rgba(255, 255, 255, 0.5);

    display: flex;
    align-items: center;
    justify-content: center;
    &::before,
    &::after {
      content: "✦";
      color: #a0795a;
      font-size: 12vpx;
      margin: 0 12vpx;
      opacity: 0.7;
      animation: star-twinkle 2s ease-in-out infinite alternate;
    }
    &::after {
      animation-delay: 1s;
    }
  }

  @keyframes star-twinkle {
    from {
      opacity: 0.4;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  .scroll-text {
    font-family: "Crimson Text", "Georgia", serif;
    font-size: 12vpx;
    line-height: 2;
    color: #3e2723;
    text-align: justify;
    letter-spacing: 0.5vpx;
    white-space: pre-wrap;
    word-break: break-all;

    :deep(.scroll-highlight) {
      color: #9a0007;
      font-weight: 700;
      background: transparent;
      padding: 0 2vpx;
      text-shadow: 0 0 1vpx rgba(154, 0, 7, 0.1);
      border-bottom: 1.5vpx solid rgba(154, 0, 7, 0.3);
    }

    :deep(.scroll-link) {
      color: #0d47a1;
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      border-bottom: 1vpx dashed #0d47a1;
      padding: 0 2vpx;
      transition: all 0.2s ease;

      &:active {
        background: rgba(13, 71, 161, 0.1);
        color: #1565c0;
      }
    }

    :deep(.scroll-image-wrap) {
      width: 100%;
      display: flex;
      justify-content: center;

      .scroll-img {
        box-shadow: 2vpx 2vpx 5vpx rgba(0, 0, 0, 0.3);
        border: 4vpx solid #fff;
        transform: rotate(-1deg);
        filter: sepia(0.3) contrast(1.1);
        max-width: 90%;
        transition: transform 0.3s ease;

        &:active {
          transform: scale(1.02) rotate(0deg);
        }
      }
    }

    :deep(.scroll-video-wrap) {
      margin: 16vpx 0;
      width: 100%;
      aspect-ratio: 16 / 9;
      border-radius: 4vpx;
      border: 4vpx solid #fff;
      box-shadow: 2vpx 2vpx 5vpx rgba(0, 0, 0, 0.3);
      background: #2a1a0a;
      background-size: cover;
      background-position: center;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: transform 0.3s ease;

      &.has-poster {
        background-color: #000;
      }

      &::before {
        content: "";
        position: absolute;
        inset: 0;
        background: rgba(0, 0, 0, 0.25);
        transition: background 0.3s ease;
      }

      &:active {
        transform: scale(0.98);

        &::before {
          background: rgba(0, 0, 0, 0.4);
        }
      }

      .video-play-btn {
        position: relative;
        z-index: 1;
        width: 52vpx;
        height: 52vpx;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        color: #3e2723;
        box-shadow:
          0 2vpx 8vpx rgba(0, 0, 0, 0.3),
          0 0 20vpx rgba(218, 165, 32, 0.2);
        transition: transform 0.3s ease;
      }
    }
  }
}

/* 华丽魔法卷轴动画 */
.magic-scroll-enter-active {
  animation: overlay-fade-in 0.4s ease-out;

  .magic-particles {
    animation: particles-appear 0.6s ease-out;
  }

  .magic-glow {
    animation: glow-expand 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .scroll-body {
    animation: scroll-unfold 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .magic-close-btn {
    animation: close-btn-appear 0.6s ease-out 0.4s both;
  }

  .scroll-paper {
    animation: paper-glow 0.8s ease-out;
  }
}

.magic-scroll-leave-active {
  animation: overlay-fade-out 0.5s ease-in;

  .magic-particles {
    animation: particles-disappear 0.4s ease-in;
  }

  .magic-glow {
    animation: glow-shrink 0.5s ease-in;
  }

  .scroll-body {
    animation: scroll-fold 0.5s cubic-bezier(0.55, 0, 1, 0.45);
  }

  .magic-close-btn {
    animation: close-btn-disappear 0.3s ease-in;
  }
}

@keyframes overlay-fade-in {
  from {
    opacity: 0;
    backdrop-filter: blur(0);
  }
  to {
    opacity: 1;
    backdrop-filter: blur(12vpx);
  }
}

@keyframes overlay-fade-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes particles-appear {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes particles-disappear {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

@keyframes glow-expand {
  from {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
  to {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1);
  }
}

@keyframes glow-shrink {
  from {
    opacity: 0.8;
    transform: translate(-50%, -50%) scale(1);
  }
  to {
    opacity: 0;
    transform: translate(-50%, -50%) scale(0.3);
  }
}

@keyframes scroll-unfold {
  0% {
    opacity: 0;
    transform: translateY(-40vpx) rotateX(-30deg) scale(0.7);
  }
  60% {
    opacity: 1;
    transform: translateY(10vpx) rotateX(5deg) scale(1.02);
  }
  100% {
    opacity: 1;
    transform: translateY(0) rotateX(0) scale(1);
  }
}

@keyframes scroll-fold {
  0% {
    opacity: 1;
    transform: translateY(0) rotateX(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(30vpx) rotateX(20deg) scale(0.8);
  }
}

@keyframes close-btn-appear {
  from {
    opacity: 0;
    transform: scale(0) rotate(-180deg);
  }
  to {
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
}

@keyframes close-btn-disappear {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0) rotate(180deg);
  }
}

@keyframes paper-glow {
  0% {
    box-shadow:
      0 10vpx 30vpx rgba(0, 0, 0, 0.5),
      0 1vpx 3vpx rgba(0, 0, 0, 0.2),
      0 0 0 rgba(218, 165, 32, 0);
  }
  50% {
    box-shadow:
      0 10vpx 30vpx rgba(0, 0, 0, 0.5),
      0 1vpx 3vpx rgba(0, 0, 0, 0.2),
      0 0 100vpx rgba(218, 165, 32, 0.4);
  }
  100% {
    box-shadow:
      0 10vpx 30vpx rgba(0, 0, 0, 0.5),
      0 1vpx 3vpx rgba(0, 0, 0, 0.2),
      0 0 60vpx rgba(218, 165, 32, 0.15);
  }
}
</style>
