<template>
  <transition name="float-bounce">
    <div
      v-if="visible"
      class="multi-clue-float"
      :class="{ dragging: isDragging }"
      :style="btnStyle"
      @touchstart.prevent="onDragStart"
      @touchmove.prevent="onDragMove"
      @touchend="onDragEnd"
      @mousedown.prevent="onDragStart"
    >
      <!-- 底部投影光晕 -->
      <div class="bottom-glow"></div>

      <!-- 外围魔法旋转环路 -->
      <div class="magic-ring"></div>

      <!-- 玻璃态遮罩扫光 -->
      <div class="glass-sweep-wrapper">
        <div class="glass-sweep"></div>
      </div>

      <div class="float-inner">
        <el-icon class="clue-icon"><Opportunity /></el-icon>
      </div>

      <!-- 提示高光点 -->
      <div class="float-dot"></div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import { Opportunity } from "@element-plus/icons-vue";

defineProps<{ visible: boolean }>();

const emit = defineEmits(["open"]);

// 按钮尺寸 (从 48 放大至 52 以容纳更丰富的效果)
const BTN_SIZE = 52;
const EDGE_MARGIN = 20;
const BOTTOM_MARGIN = 80;

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
  posY.value = window.innerHeight - BTN_SIZE - BOTTOM_MARGIN;
});

// 动态样式
const btnStyle = computed(() => ({
  left: `${posX.value}px`,
  top: `${posY.value}px`,
  transition: isDragging.value ? "none" : "left 0.3s ease, top 0.3s ease",
  right: "auto",
  bottom: "auto",
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
    emit("open");
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

.multi-clue-float {
  position: fixed;
  z-index: 1000;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52vpx;
  height: 52vpx;
  border-radius: 50%;

  // 底部多层渐变色质感
  background: radial-gradient(
    circle at 30% 30%,
    rgba(30, 45, 75, 0.85) 0%,
    rgba(10, 15, 30, 0.95) 100%
  );
  border: 1vpx solid rgba(255, 255, 255, 0.2);

  // 综合阴影：外部大发光 + 内部辉光 + 顶部玻璃反光
  box-shadow:
    0 8vpx 28vpx rgba(0, 0, 0, 0.7),
    0 0 16vpx rgba($magic-cyan, 0.3),
    inset 0 0 20vpx rgba($magic-cyan, 0.25),
    inset 0 2vpx 3vpx rgba(255, 255, 255, 0.4);

  backdrop-filter: blur(16vpx);
  -webkit-backdrop-filter: blur(16vpx);
  touch-action: none; // 防止拖拽时页面滚动
  user-select: none;

  // 呼吸悬浮动画
  animation: float-idle 4s ease-in-out infinite alternate;

  // 魔法轨迹旋转外环
  .magic-ring {
    position: absolute;
    inset: -3vpx;
    border-radius: 50%;
    background: conic-gradient(
      from 0deg,
      transparent 0deg,
      rgba($magic-cyan, 0.9) 80deg,
      transparent 180deg,
      rgba($magic-purple, 0.9) 260deg,
      transparent 360deg
    );
    z-index: 1;
    mask: radial-gradient(circle, transparent 55%, black 56%);
    -webkit-mask: radial-gradient(circle, transparent 55%, black 56%);
    animation: spin-ring 3s linear infinite;
    pointer-events: none;
    opacity: 0.8;
  }

  // 包装层限制切割
  .glass-sweep-wrapper {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    overflow: hidden;
    z-index: 2;
    pointer-events: none;
    mask: radial-gradient(circle, black 100%, transparent);
    -webkit-mask: radial-gradient(circle, black 100%, transparent);

    // 玻璃态表面周期扫光效果
    .glass-sweep {
      position: absolute;
      inset: -20vpx; //稍微放大一点点供旋转和过渡
      background: linear-gradient(
        105deg,
        transparent 20%,
        rgba(255, 255, 255, 0.6) 50%,
        transparent 80%
      );
      animation: sweep-light 4s cubic-bezier(0.1, 0, 0.9, 1) infinite;
    }
  }

  // 底部常驻微发光
  .bottom-glow {
    position: absolute;
    inset: -15vpx;
    border-radius: 50%;
    background: radial-gradient(circle, rgba($magic-cyan, 0.15) 0%, transparent 60%);
    z-index: 0;
    pointer-events: none;
    animation: pulse-glow 3s infinite alternate;
  }

  &.dragging {
    transform: scale(1.15) !important; // 放大比例
    animation: none; // 取消浮动动画
    box-shadow:
      0 12vpx 40vpx rgba(0, 0, 0, 0.8),
      0 0 30vpx rgba($magic-purple, 0.5),
      inset 0 0 24vpx rgba($magic-purple, 0.5),
      inset 0 2vpx 4vpx rgba(255, 255, 255, 0.5);

    .float-inner {
      animation: none;
      transform: scale(1.1);
    }

    .magic-ring {
      animation-duration: 1.5s; // 旋转加速
      opacity: 1;
    }

    .glass-sweep {
      display: none; // 拖动时不扫光
    }
  }

  &:active:not(.dragging) {
    transform: scale(0.9);
  }

  .float-inner {
    position: relative;
    z-index: 5;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 100%;
    animation: inner-breathe 2.5s ease-in-out infinite alternate;
    transition: transform 0.3s ease;

    .clue-icon {
      font-size: 26vpx;
      color: #fff;
      filter: drop-shadow(0 0 8vpx rgba($magic-cyan, 0.8));
    }
  }

  .float-dot {
    position: absolute;
    top: 5vpx;
    right: 5vpx;
    z-index: 10;
    width: 10vpx;
    height: 10vpx;
    border-radius: 50%;
    background: $magic-gold;
    box-shadow:
      0 0 10vpx $magic-gold,
      0 0 18vpx $magic-gold;
    animation: pulseDot 2s infinite;
  }
}

// --- 动画关键帧 ---

@keyframes spin-ring {
  to {
    transform: rotate(360deg);
  }
}

@keyframes sweep-light {
  0% {
    transform: translateX(-100%) translateY(-100%) rotate(45deg);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  30% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
    opacity: 0;
  }
  100% {
    transform: translateX(100%) translateY(100%) rotate(45deg);
    opacity: 0;
  }
}

@keyframes float-idle {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-7vpx);
  }
}

@keyframes pulse-glow {
  0% {
    transform: scale(0.9);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.15);
    opacity: 1;
  }
}

@keyframes inner-breathe {
  0% {
    transform: scale(0.95);
    opacity: 0.85;
  }
  100% {
    transform: scale(1.05);
    opacity: 1;
  }
}

@keyframes pulseDot {
  0% {
    transform: scale(0.9);
    opacity: 0.8;
    box-shadow: 0 0 6vpx $magic-gold;
  }
  50% {
    transform: scale(1.3);
    opacity: 1;
    box-shadow:
      0 0 12vpx $magic-gold,
      0 0 20vpx rgba($magic-gold, 0.5);
  }
  100% {
    transform: scale(0.9);
    opacity: 0.8;
    box-shadow: 0 0 6vpx $magic-gold;
  }
}

.float-bounce-enter-active {
  animation: bounceIn 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
}
.float-bounce-leave-active {
  animation: bounceIn 0.3s reverse;
}

@keyframes bounceIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  60% {
    transform: scale(1.2);
    opacity: 1;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}
</style>
