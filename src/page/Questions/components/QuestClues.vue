<template>
  <div ref="clueCardRef" class="magic-panel clue-card" :class="{ 'fullscreen-mode': isFullscreen }">
    <!-- 全屏遮罩层（仅在全屏时渲染） -->
    <transition name="fullscreen-backdrop">
      <div v-if="isFullscreen" class="fullscreen-backdrop" @click="exitFullscreen"></div>
    </transition>

    <!-- 魔法粒子效果 -->
    <transition name="particles-fade">
      <div v-if="isFullscreen" class="magic-particles">
        <span v-for="n in 25" :key="n" class="particle" :style="getParticleStyle(n)"></span>
      </div>
    </transition>

    <div class="clue-header">
      <span class="header-ornament"></span>
      {{ title || "获得线索" }}
      <span class="header-ornament"></span>

      <!-- 全屏切换按钮 -->
      <div v-if="isLongThread" class="fullscreen-toggle" @click="toggleFullscreen">
        <div class="toggle-crystal">
          <div class="crystal-inner">
            <span class="toggle-rune">{{ isFullscreen ? "✕" : "⛶" }}</span>
          </div>
          <div class="crystal-glow"></div>
        </div>
        <div class="toggle-orbits">
          <span class="orbit orbit-1"></span>
          <span class="orbit orbit-2"></span>
        </div>
      </div>
    </div>

    <div class="as_content">
      <div v-for="(item, index) in thread" :key="index" class="as_item_wrapper">
        <!-- 使用新组件 ClueArtifact -->
        <ClueArtifact
          :type="item.type"
          :content="item.content"
          :url="item.url"
          :imgList="item.imgList"
          :isFullscreen="isFullscreen"
          @action="$emit('action', item)"
          :path="item.path"
          :query="item.query"
          :nextIndex="item.nextIndex"
          :title="item.title"
        />

        <!-- 如果是图片类型且不需要点击文字预览，直接显示图片预览 -->
        <div class="direct-img-view" v-if="item.type === 'img' && !item.content">
          <el-image
            :src="item.url"
            class="clue-img"
            @click="$emit('preview', item.imgList || [item.url!])"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import ClueArtifact from "./ClueArtifact/index.vue";
import { ThreadItemList } from "@/types/qa";

const props = defineProps<{
  thread: ThreadItemList;
  title?: string;
}>();

defineEmits(["action", "preview"]);

const isFullscreen = ref(false);
const clueCardRef = ref<HTMLElement | null>(null);
const isLongThread = computed(() => props.thread?.length > 2);
let visibilityObserver: IntersectionObserver | null = null;
let visibilityDebounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 全局注册表：跟踪所有处于全屏模式的 QuestClues 实例的可视状态
 * key = 组件实例 uid，value = 当前是否可见
 * 多个 slide 各自有独立的 QuestClues 实例，需要全局协调徽章显隐
 */
const FULLSCREEN_VISIBLE_REGISTRY: Map<number, boolean> =
  (window as any).__clueFullscreenRegistry ||
  ((window as any).__clueFullscreenRegistry = new Map<number, boolean>());

const instanceId = Math.random();

/**
 * 设置所有关卡序号徽章的显示/隐藏
 */
const setSlideBadgeVisibility = (hidden: boolean) => {
  document.querySelectorAll<HTMLElement>(".slide-badge").forEach((badge) => {
    badge.style.display = hidden ? "none" : "";
  });
};

/**
 * 根据全局注册表判断是否需要隐藏徽章：
 * 只要有任意一个全屏实例当前可见，就隐藏徽章
 */
const syncBadgeVisibility = () => {
  let shouldHide = false;
  for (const visible of FULLSCREEN_VISIBLE_REGISTRY.values()) {
    if (visible) {
      shouldHide = true;
      break;
    }
  }
  setSlideBadgeVisibility(shouldHide);
};

/**
 * 更新当前实例在全局注册表中的状态，并同步徽章显隐
 */
const updateRegistryAndSync = (isVisible: boolean) => {
  if (isFullscreen.value) {
    FULLSCREEN_VISIBLE_REGISTRY.set(instanceId, isVisible);
  } else {
    FULLSCREEN_VISIBLE_REGISTRY.delete(instanceId);
  }
  syncBadgeVisibility();
};

// 控制滚动条显示 & 隐藏可能遮挡全屏关闭按钮的外部元素
const setScrollLock = (lock: boolean) => {
  document.body.style.overflow = lock ? "hidden" : "";
  // 同时处理 .adventure-container 滚动容器
  const container = document.querySelector(".adventure-container") as HTMLElement;
  if (container) {
    container.style.overflow = lock ? "hidden" : "";
  }
  // 通过全局注册表同步徽章显隐
  updateRegistryAndSync(lock);
};

const toggleFullscreen = () => {
  isFullscreen.value = !isFullscreen.value;
  setScrollLock(isFullscreen.value);
};

const exitFullscreen = () => {
  isFullscreen.value = false;
  setScrollLock(false);
};

/**
 * 处理组件可视状态变化（Swiper 滑动导致的显隐）
 * 带防抖，避免频繁触发
 */
const handleVisibilityChange = (isVisible: boolean) => {
  if (visibilityDebounceTimer) {
    clearTimeout(visibilityDebounceTimer);
  }
  visibilityDebounceTimer = setTimeout(() => {
    if (!isFullscreen.value) return;
    updateRegistryAndSync(isVisible);
  }, 100);
};

/**
 * 初始化 IntersectionObserver 监听组件自身可视状态
 */
const initVisibilityObserver = () => {
  if (!clueCardRef.value) return;

  visibilityObserver = new IntersectionObserver(
    (entries) => {
      const entry = entries[0];
      if (entry) {
        handleVisibilityChange(entry.isIntersecting);
      }
    },
    { threshold: 0.1 },
  );
  visibilityObserver.observe(clueCardRef.value);
};

const cleanupVisibilityObserver = () => {
  if (visibilityDebounceTimer) {
    clearTimeout(visibilityDebounceTimer);
    visibilityDebounceTimer = null;
  }
  if (visibilityObserver) {
    visibilityObserver.disconnect();
    visibilityObserver = null;
  }
  // 组件卸载时从注册表移除并同步
  FULLSCREEN_VISIBLE_REGISTRY.delete(instanceId);
  syncBadgeVisibility();
};

onMounted(() => {
  initVisibilityObserver();
});

onBeforeUnmount(() => {
  cleanupVisibilityObserver();
});

/**
 * 生成粒子随机样式
 */
const getParticleStyle = (_index: number) => {
  const size = 2 + Math.random() * 4;
  const left = Math.random() * 100;
  const delay = Math.random() * 3;
  const duration = 4 + Math.random() * 4;
  const hue = 30 + Math.random() * 40; // 金色到橙色

  return {
    width: `${size}px`,
    height: `${size}px`,
    left: `${left}%`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    backgroundColor: `hsl(${hue}, 85%, 55%)`,
  };
};
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

// 基础毛玻璃面板 (from style.scss, scoped here to ensure self-contained if magic-panel is missing or for override)
.magic-panel {
  position: relative;
  overflow: hidden;
  background: $glass-bg;
  backdrop-filter: blur(20vpx);
  -webkit-backdrop-filter: blur(20vpx);
  border: 1vpx solid $glass-border;
  border-radius: 20vpx;
  box-shadow: 0 8vpx 32vpx 0 rgba(0, 0, 0, 0.3);
  margin-bottom: 24vpx;
  padding: 24vpx;
  transition:
    border-color 0.4s,
    box-shadow 0.4s,
    all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 45%,
      rgba(255, 255, 255, 0.05) 50%,
      transparent 55%
    );
    transform: rotate(-45deg);
    animation: sweep-light 6s infinite;
    pointer-events: none;
  }
}

// 线索卡片
.clue-card {
  padding: 20vpx;
  margin-bottom: 12vpx;
  border: 1vpx solid rgba($magic-green, 0.4);

  .clue-header {
    position: relative;
    text-align: center;
    color: $magic-green;
    font-weight: bold;
    margin-bottom: 12vpx;
    font-size: 14vpx;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8vpx;
  }

  .header-ornament {
    flex: 1;
    height: 1vpx;
    background: linear-gradient(to right, transparent, rgba($magic-green, 0.4), transparent);
  }

  .clue-text {
    display: block;
    text-align: center;
    color: #ddd;
    font-style: italic;
    margin-bottom: 12vpx;
  }

  .clue-btn {
    width: 100%;
    height: 48vpx;
    margin: 8vpx 0;
    font-size: 15vpx;
  }
}

// ===== 全屏切换按钮 =====
.fullscreen-toggle {
  position: absolute;
  top: 50%;
  right: -4vpx;
  transform: translateY(-50%);
  width: 32vpx;
  height: 32vpx;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;

  .toggle-crystal {
    position: relative;
    width: 26vpx;
    height: 26vpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .crystal-inner {
      width: 100%;
      height: 100%;
      background: linear-gradient(
        135deg,
        rgba($magic-green, 0.8) 0%,
        rgba(darken($magic-green, 15%), 0.9) 50%,
        rgba(darken($magic-green, 25%), 0.85) 100%
      );
      border-radius: 50%;
      border: 1.5vpx solid rgba($magic-green, 0.6);
      box-shadow:
        0 0 12vpx rgba($magic-green, 0.4),
        0 0 24vpx rgba($magic-green, 0.2),
        inset 0 1vpx 3vpx rgba(255, 255, 255, 0.3),
        inset 0 -1vpx 3vpx rgba(0, 0, 0, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;

      .toggle-rune {
        color: rgba(255, 255, 255, 0.95);
        font-size: 12vpx;
        font-weight: 300;
        text-shadow:
          0 0 6px rgba(255, 255, 255, 0.8),
          0 0 12px rgba($magic-green, 0.6);
      }
    }

    .crystal-glow {
      position: absolute;
      inset: -6vpx;
      background: radial-gradient(circle, rgba($magic-green, 0.25) 0%, transparent 70%);
      border-radius: 50%;
      animation: crystal-pulse 2s ease-in-out infinite alternate;
    }
  }

  .toggle-orbits {
    position: absolute;
    inset: -4vpx;
    pointer-events: none;

    .orbit {
      position: absolute;
      inset: 0;
      border: 1vpx solid transparent;
      border-top-color: rgba($magic-green, 0.4);
      border-radius: 50%;
      animation: orbit-rotate 3s linear infinite;

      &.orbit-1 {
        animation-duration: 2.5s;
      }

      &.orbit-2 {
        inset: -3vpx;
        border-top-color: rgba($magic-green, 0.25);
        animation-duration: 3.5s;
        animation-direction: reverse;
      }
    }
  }

  &:active {
    .toggle-crystal .crystal-inner {
      transform: scale(0.9);
      box-shadow:
        0 0 18vpx rgba($magic-green, 0.6),
        0 0 36vpx rgba($magic-green, 0.3),
        inset 0 1vpx 3vpx rgba(255, 255, 255, 0.3),
        inset 0 -1vpx 3vpx rgba(0, 0, 0, 0.2);
    }
  }
}

// ===== 全屏模式样式 =====
.fullscreen-mode {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  margin: 0 !important;
  // 顶部 padding 加上安全区域（刘海屏/灵动岛）
  padding: calc(60vpx + env(safe-area-inset-top, 0px)) 24vpx 24vpx !important;
  border-radius: 0 !important;
  z-index: 9000 !important;
  overflow: hidden !important; // 外层不滚动
  background: rgba(10, 14, 20, 0.98) !important;
  border: none !important;
  display: flex !important;
  flex-direction: column !important;
  box-sizing: border-box !important;

  // 自定义滚动条 - 更细且半透明
  &::-webkit-scrollbar {
    width: 4vpx;
  }
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba($magic-green, 0.3);
    border-radius: 2vpx;
    &:hover {
      background: rgba($magic-green, 0.5);
    }
  }

  // 增强的毛玻璃效果
  backdrop-filter: blur(30vpx) saturate(1.3) !important;
  -webkit-backdrop-filter: blur(30vpx) saturate(1.3) !important;

  // 魔法边框光效
  box-shadow:
    inset 0 0 100vpx rgba($magic-green, 0.08),
    inset 0 0 200vpx rgba($magic-gold, 0.05) !important;

  .clue-header {
    position: fixed;
    // 顶部偏移加上安全区域
    top: env(safe-area-inset-top, 0px);
    left: 0;
    right: 0;
    padding: 16vpx 24vpx;
    background: rgba(10, 14, 20, 0.95);
    backdrop-filter: blur(20vpx);
    -webkit-backdrop-filter: blur(20vpx);
    z-index: 10;
    border-bottom: 1vpx solid rgba($magic-green, 0.3);
    margin-bottom: 0;
  }

  .fullscreen-toggle {
    right: 16vpx;

    .toggle-crystal .crystal-inner {
      background: linear-gradient(
        135deg,
        rgba(180, 130, 70, 0.9) 0%,
        rgba(139, 90, 43, 0.95) 50%,
        rgba(100, 60, 20, 0.9) 100%
      );
      border-color: rgba($magic-gold, 0.6);
      box-shadow:
        0 0 12vpx rgba($magic-gold, 0.4),
        0 0 24vpx rgba($magic-gold, 0.2),
        inset 0 1vpx 3vpx rgba(255, 255, 255, 0.3),
        inset 0 -1vpx 3vpx rgba(0, 0, 0, 0.2);
    }

    .crystal-glow {
      background: radial-gradient(circle, rgba($magic-gold, 0.3) 0%, transparent 70%);
    }

    .orbit {
      border-top-color: rgba($magic-gold, 0.4) !important;
    }
  }

  .as_content {
    flex: 1;
    padding-top: 8vpx;
    overflow-y: auto; // 内容区域滚动
    overflow-x: hidden;

    // 自定义滚动条 - 更细且半透明
    &::-webkit-scrollbar {
      width: 4vpx;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba($magic-green, 0.3);
      border-radius: 2vpx;
      &:hover {
        background: rgba($magic-green, 0.5);
      }
    }
  }
}

// ===== 全屏背景遮罩 =====
.fullscreen-backdrop {
  position: fixed;
  inset: 0;
  z-index: -1;
  background: radial-gradient(
    ellipse at center,
    rgba($magic-green, 0.08) 0%,
    rgba(10, 14, 20, 0.98) 70%
  );

  // 梦幻光晕
  &::before {
    content: "";
    position: absolute;
    top: 20%;
    left: 10%;
    width: 300vpx;
    height: 300vpx;
    background: radial-gradient(circle, rgba($magic-gold, 0.12) 0%, transparent 60%);
    animation: glow-float 8s ease-in-out infinite alternate;
  }

  &::after {
    content: "";
    position: absolute;
    bottom: 20%;
    right: 10%;
    width: 250vpx;
    height: 250vpx;
    background: radial-gradient(circle, rgba($magic-purple, 0.1) 0%, transparent 60%);
    animation: glow-float 10s ease-in-out infinite alternate-reverse;
  }
}

// ===== 魔法粒子 =====
.magic-particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
  z-index: 1;

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

// ===== 动画 =====
@keyframes sweep-light {
  0% {
    transform: translateX(-100%) rotate(-45deg);
  }
  20%,
  100% {
    transform: translateX(100%) rotate(-45deg);
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

@keyframes float-up {
  0% {
    transform: translateY(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
  }
  90% {
    opacity: 0.6;
  }
  100% {
    transform: translateY(-110vh) scale(1);
    opacity: 0;
  }
}

@keyframes glow-float {
  from {
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }
  to {
    transform: translateY(-30vpx) scale(1.1);
    opacity: 1;
  }
}

// ===== 过渡动画 =====
.fullscreen-backdrop-enter-active {
  animation: backdrop-in 0.5s ease-out;
}
.fullscreen-backdrop-leave-active {
  animation: backdrop-out 0.4s ease-in;
}

@keyframes backdrop-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes backdrop-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.particles-fade-enter-active {
  animation: particles-in 0.6s ease-out;
}
.particles-fade-leave-active {
  animation: particles-out 0.3s ease-in;
}

@keyframes particles-in {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes particles-out {
  from {
    opacity: 1;
  }
  to {
    opacity: 0;
  }
}

.as_content {
  // container for items
}
.as_item_wrapper {
  // wrapper
}
.direct-img-view {
  margin-top: 10vpx;
  .clue-img {
    width: 100%;
    border-radius: 8vpx;
    border: 1vpx solid rgba(255, 255, 255, 0.1);
  }
}
</style>
