<template>
  <Transition name="scale-fade">
    <div
      v-if="visible"
      ref="btnRef"
      class="bgm-float-btn"
      :class="{ playing: isPlaying, dragging: isDragging }"
      :style="btnStyle"
      @touchstart.prevent="onDragStart"
      @touchmove.prevent="onDragMove"
      @touchend="onDragEnd"
      @mousedown.prevent="onDragStart"
    >
      <!-- 外层发光光环 -->
      <div class="outer-glow"></div>

      <!-- 毛玻璃按钮主体 -->
      <div class="btn-body">
        <!-- 音符图标 -->
        <div class="note-icon">♪</div>

        <!-- 播放时的声波动画 -->
        <div v-if="isPlaying" class="sound-waves">
          <span class="wave"></span>
          <span class="wave"></span>
          <span class="wave"></span>
        </div>
      </div>

      <!-- 呼吸光圈 -->
      <div v-if="isPlaying" class="pulse-ring"></div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  visible: boolean;
  isPlaying: boolean;
}>();

const emit = defineEmits<{
  (e: "toggle"): void;
}>();

const btnRef = ref<HTMLElement | null>(null);

// 按钮尺寸
const BTN_SIZE = 44;
const EDGE_MARGIN = 16;

// 状态
const isDragging = ref(false);
const hasMoved = ref(false);

// 当前位置 (px)
const posX = ref(0);
const posY = ref(0);

// 拖拽起始点
const dragStartX = ref(0);
const dragStartY = ref(0);
const initialPosX = ref(0);
const initialPosY = ref(0);

// 初始化位置（右下角）
onMounted(() => {
  posX.value = window.innerWidth - BTN_SIZE - EDGE_MARGIN;
  posY.value = window.innerHeight - 160;
});

// 动态样式
const btnStyle = computed(() => ({
  left: `${posX.value}px`,
  top: `${posY.value}px`,
  transition: isDragging.value ? "none" : "left 0.3s ease, top 0.3s ease",
}));

// 获取事件坐标
const getEventPos = (e: MouseEvent | TouchEvent) => {
  if ("touches" in e) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }
  return { x: e.clientX, y: e.clientY };
};

// 开始拖拽
const onDragStart = (e: MouseEvent | TouchEvent) => {
  isDragging.value = true;
  hasMoved.value = false;

  const { x, y } = getEventPos(e);
  dragStartX.value = x;
  dragStartY.value = y;
  initialPosX.value = posX.value;
  initialPosY.value = posY.value;

  // 鼠标事件需要添加全局监听
  if (!("touches" in e)) {
    window.addEventListener("mousemove", onDragMove);
    window.addEventListener("mouseup", onDragEnd);
  }
};

// 拖拽移动
const onDragMove = (e: MouseEvent | TouchEvent) => {
  if (!isDragging.value) return;

  const { x, y } = getEventPos(e);
  const deltaX = x - dragStartX.value;
  const deltaY = y - dragStartY.value;

  // 判断是否真的移动了
  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
    hasMoved.value = true;
  }

  // 计算新位置
  let newX = initialPosX.value + deltaX;
  let newY = initialPosY.value + deltaY;

  // 边界限制
  const maxX = window.innerWidth - BTN_SIZE;
  const maxY = window.innerHeight - BTN_SIZE;

  newX = Math.max(0, Math.min(newX, maxX));
  newY = Math.max(0, Math.min(newY, maxY));

  posX.value = newX;
  posY.value = newY;
};

// 结束拖拽 - 自动贴边
const onDragEnd = () => {
  if (!isDragging.value) return;

  // 自动吸附到最近的边
  const centerX = posX.value + BTN_SIZE / 2;
  const screenWidth = window.innerWidth;

  if (centerX < screenWidth / 2) {
    // 吸附到左边
    posX.value = EDGE_MARGIN;
  } else {
    // 吸附到右边
    posX.value = screenWidth - BTN_SIZE - EDGE_MARGIN;
  }

  // Y 轴保持当前位置，确保在边界内
  const maxY = window.innerHeight - BTN_SIZE - EDGE_MARGIN;
  posY.value = Math.max(EDGE_MARGIN, Math.min(posY.value, maxY));

  isDragging.value = false;

  // 清理鼠标事件监听
  window.removeEventListener("mousemove", onDragMove);
  window.removeEventListener("mouseup", onDragEnd);

  // 如果没移动，触发点击
  if (!hasMoved.value) {
    emit("toggle");
  }
};

// 组件卸载时清理
onUnmounted(() => {
  window.removeEventListener("mousemove", onDragMove);
  window.removeEventListener("mouseup", onDragEnd);
});
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

.bgm-float-btn {
  position: fixed;
  z-index: 999;
  width: 44vpx;
  height: 44vpx;
  cursor: pointer;
  touch-action: none;
  user-select: none;

  &.dragging {
    .btn-body {
      transform: scale(1.08);
      box-shadow:
        0 8vpx 24vpx rgba(0, 0, 0, 0.3),
        inset 0 1vpx 0 rgba(236, 230, 216, 0.15);
    }
  }

  // 外层发光（常态微弱）
  .outer-glow {
    position: absolute;
    inset: -4vpx;
    border-radius: 50%;
    background: radial-gradient(circle, rgba($ember, 0.1) 0%, transparent 70%);
    opacity: 0.45;
    transition: opacity 0.3s ease;
  }

  // 毛玻璃按钮主体
  .btn-body {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: $glass-bg;
    backdrop-filter: blur(12vpx);
    -webkit-backdrop-filter: blur(12vpx);
    border: 1vpx solid $glass-border;
    box-shadow:
      0 4vpx 16vpx rgba(0, 0, 0, 0.2),
      inset 0 1vpx 0 rgba(236, 230, 216, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  // 音符图标
  .note-icon {
    font-size: 18vpx;
    color: rgba($ember, 0.65);
    text-shadow: 0 0 8vpx rgba($ember, 0.3);
    transition: all 0.3s ease;
    z-index: 2;
  }

  // 声波动画容器
  .sound-waves {
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 2vpx;

    .wave {
      width: 2vpx;
      height: 8vpx;
      background: rgba($ember, 0.45);
      border-radius: 2vpx;
      animation: wave-anim 0.8s ease-in-out infinite;

      &:nth-child(1) {
        animation-delay: 0s;
        height: 6vpx;
      }
      &:nth-child(2) {
        animation-delay: 0.15s;
        height: 10vpx;
      }
      &:nth-child(3) {
        animation-delay: 0.3s;
        height: 6vpx;
      }
    }
  }

  // 呼吸光圈
  .pulse-ring {
    position: absolute;
    inset: -6vpx;
    border-radius: 50%;
    border: 1vpx solid rgba($ember, 0.3);
    animation: pulse-glow 2.8s ease-in-out infinite;
    pointer-events: none;
  }

  // 播放状态
  &.playing {
    .outer-glow {
      opacity: 1;
      background: radial-gradient(circle, rgba($ember, 0.2) 0%, transparent 70%);
    }

    .btn-body {
      background: $glass-bg-strong;
      border-color: rgba($ember, 0.25);
    }

    .note-icon {
      color: rgba($ember, 0.9);
      text-shadow: 0 0 12vpx rgba($ember, 0.5);
      opacity: 0;
    }
  }

  &:not(.playing) {
    .note-icon {
      animation: subtle-pulse 3s ease-in-out infinite;
    }
  }

  &:active:not(.dragging) {
    .btn-body {
      transform: scale(0.95);
    }
  }
}

// 进入/离开动画
.scale-fade-enter-active,
.scale-fade-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.scale-fade-enter-from,
.scale-fade-leave-to {
  transform: scale(0.5);
  opacity: 0;
}

@keyframes wave-anim {
  0%,
  100% {
    transform: scaleY(0.5);
    opacity: 0.4;
  }
  50% {
    transform: scaleY(1);
    opacity: 0.8;
  }
}

@keyframes pulse-glow {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.7;
  }
}

@keyframes subtle-pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 0.9;
  }
}
</style>
