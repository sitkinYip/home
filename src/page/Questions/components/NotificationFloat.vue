<template>
  <div
    v-if="visible && notifications.length > 0"
    class="notif-float-container"
    :class="{ 'is-right': isRightSide, dragging: isDragging }"
    :style="containerStyle"
  >
    <!-- 消息列表面板 -->
    <transition name="list-pop">
      <div v-if="showList" class="notif-list-panel magic-panel">
        <div class="list-header">
          <span class="header-text">远方来的讯息</span>
        </div>
        <div class="list-items custom-scrollbar">
          <div
            v-for="item in notifications.slice(0, 5)"
            :key="item.id"
            class="list-item"
            @click="handleItemClick(item)"
          >
            <div class="item-bullet">✦</div>
            <div class="item-title">{{ item.title }}</div>
            <div class="item-arrow">›</div>
          </div>
        </div>
      </div>
    </transition>

    <!-- 悬浮球 -->
    <div
      class="float-ball"
      :class="{ 'has-unread': hasUnseen }"
      @touchstart.prevent="onDragStart"
      @touchmove.prevent="onDragMove"
      @touchend="onDragEnd"
      @mousedown.prevent="onDragStart"
    >
      <div class="ball-inner">
        <el-icon :size="toVpx(22)"><Bell /></el-icon>
        <!-- 数量红点/角标 -->
        <div v-if="notifications.length > 0 && !isBadgeHidden" class="notif-badge">
          {{ notifications.length > 9 ? "9+" : notifications.length }}
        </div>
      </div>
      <!-- 环绕光环 -->
      <div class="ball-halo"></div>
      <div class="ball-waves">
        <span class="wave wave-1"></span>
        <span class="wave wave-2"></span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { Bell } from "@element-plus/icons-vue";
import { NotificationRecord } from "@/types/qa";
import { toVpx } from "@/utils/toVpx";

const props = defineProps<{
  notifications: NotificationRecord[];
  visible: boolean;
  hasUnseen?: boolean;
}>();

const emit = defineEmits<{
  (e: "open-message", item: NotificationRecord): void;
}>();

// 常量配置
const BALL_SIZE = 44;
const EDGE_MARGIN = 20;
const BOTTOM_MARGIN = 80;

// 状态
const showList = ref(false);
const isDragging = ref(false);
const hasMoved = ref(false);
const isBadgeHidden = ref(false);

watch(
  () => props.notifications.length,
  (newLen, oldLen) => {
    if (newLen > (oldLen || 0)) {
      isBadgeHidden.value = false;
    }
  },
);

// 当前位置 (px)
const posX = ref(0);
const posY = ref(0);

// 拖拽起始点
const dragStartX = ref(0);
const dragStartY = ref(0);
const initialPosX = ref(0);
const initialPosY = ref(0);

// 初始化位置（左下角）
onMounted(() => {
  posX.value = EDGE_MARGIN;
  posY.value = window.innerHeight - BALL_SIZE - BOTTOM_MARGIN;
});

// 判断是否在右侧
const isRightSide = computed(() => {
  return posX.value + BALL_SIZE / 2 > window.innerWidth / 2;
});

// 动态样式
const containerStyle = computed(() => ({
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
  return { x: (e as MouseEvent).clientX, y: (e as MouseEvent).clientY };
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

  if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
    hasMoved.value = true;
  }

  let newX = initialPosX.value + deltaX;
  let newY = initialPosY.value + deltaY;

  const maxX = window.innerWidth - BALL_SIZE;
  const maxY = window.innerHeight - BALL_SIZE;

  newX = Math.max(0, Math.min(newX, maxX));
  newY = Math.max(0, Math.min(newY, maxY));

  posX.value = newX;
  posY.value = newY;
};

// 结束拖拽
const onDragEnd = () => {
  if (!isDragging.value) return;

  const screenWidth = window.innerWidth;
  const centerX = posX.value + BALL_SIZE / 2;

  if (centerX < screenWidth / 2) {
    posX.value = EDGE_MARGIN;
  } else {
    posX.value = screenWidth - BALL_SIZE - EDGE_MARGIN;
  }

  const maxY = window.innerHeight - BALL_SIZE - EDGE_MARGIN;
  posY.value = Math.max(EDGE_MARGIN, Math.min(posY.value, maxY));

  isDragging.value = false;

  window.removeEventListener("mousemove", onDragMove);
  window.removeEventListener("mouseup", onDragEnd);

  if (!hasMoved.value) {
    toggleList();
  }
};

const toggleList = () => {
  showList.value = !showList.value;
  if (showList.value) {
    isBadgeHidden.value = true;
  }
};

const handleItemClick = (item: NotificationRecord) => {
  emit("open-message", item);
  showList.value = false;
};

onUnmounted(() => {
  window.removeEventListener("mousemove", onDragMove);
  window.removeEventListener("mouseup", onDragEnd);
});
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

.notif-float-container {
  position: fixed;
  z-index: 999;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  touch-action: none;
  user-select: none;

  &.is-right {
    align-items: flex-end;
    .notif-list-panel {
      left: auto;
      right: 0;
      transform-origin: bottom right;
    }
  }

  &.dragging {
    z-index: 1000;
    .float-ball {
      transform: scale(1.1);
      .ball-inner {
        border-color: rgba($magic-gold, 0.8);
        box-shadow: 0 0 20vpx rgba($magic-gold, 0.4);
      }
    }
  }
}

.float-ball {
  width: 44vpx;
  height: 44vpx;
  position: relative;
  cursor: grab;
  z-index: 10;
  transition: transform 0.2s;

  &:active {
    cursor: grabbing;
  }

  .ball-inner {
    width: 100%;
    height: 100%;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(10vpx);
    -webkit-backdrop-filter: blur(10vpx);
    border: 1vpx solid rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    transition: all 0.3s;
    box-shadow: 0 4vpx 15vpx rgba(0, 0, 0, 0.3);

    &:active {
      transform: scale(0.9);
    }
  }

  &.has-unread {
    .ball-inner {
      border-color: rgba($magic-gold, 0.5);
      box-shadow: 0 0 15vpx rgba($magic-gold, 0.3);
      color: $magic-gold;
    }
  }
}

.notif-badge {
  position: absolute;
  top: -2vpx;
  right: -2vpx;
  min-width: 16vpx;
  height: 16vpx;
  background: $magic-red;
  border-radius: 8vpx;
  font-size: 10vpx;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 4vpx;
  color: #fff;
  border: 1.5vpx solid #1a1a1a;
  box-shadow: 0 2vpx 4vpx rgba(0, 0, 0, 0.5);
}

.ball-halo {
  position: absolute;
  inset: -4vpx;
  border: 1vpx solid rgba($magic-gold, 0.3);
  border-radius: 50%;
  animation: rotateCW 10s linear infinite;
  pointer-events: none;
}

.ball-waves {
  position: absolute;
  inset: 0;
  pointer-events: none;

  .wave {
    position: absolute;
    inset: 0;
    border: 1vpx solid $magic-gold;
    border-radius: 50%;
    opacity: 0;
    animation: ball-ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;

    &.wave-2 {
      animation-delay: 1s;
    }
  }
}

@keyframes ball-ping {
  75%,
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
}

@keyframes rotateCW {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

// 列表面板
.notif-list-panel {
  position: absolute;
  bottom: 60vpx;
  left: 0;
  width: 200vpx;
  padding: 16vpx !important;
  background: rgba(20, 10, 30, 0.9) !important;
  border: 1vpx solid rgba(255, 255, 255, 0.15) !important;
  transform-origin: bottom left;
  z-index: 5;

  .list-header {
    display: flex;
    align-items: center;
    gap: 8vpx;
    margin-bottom: 12vpx;
    border-bottom: 1vpx solid rgba(255, 255, 255, 0.1);
    padding-bottom: 8vpx;

    .header-text {
      font-size: 13vpx;
      font-weight: bold;
      color: $magic-gold;
      letter-spacing: 1vpx;
    }
  }

  .list-items {
    max-height: 240vpx;
    overflow-y: auto;

    /* 彻底隐藏滚动条 */
    scrollbar-width: none;
    -ms-overflow-style: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }

  .list-item {
    display: flex;
    align-items: center;
    gap: 8vpx;
    padding: 10vpx 0;
    cursor: pointer;
    border-bottom: 1vpx dashed rgba(255, 255, 255, 0.05);
    transition: all 0.2s;

    &:last-child {
      border-bottom: none;
    }
    &:active {
      transform: translateX(5vpx);
      opacity: 0.7;
    }

    .item-bullet {
      color: $magic-gold;
      font-size: 10vpx;
      opacity: 0.6;
    }
    .item-title {
      flex: 1;
      font-size: 13vpx;
      color: rgba(255, 255, 255, 0.85);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .item-arrow {
      color: rgba(255, 255, 255, 0.3);
      font-size: 16vpx;
    }
  }
}

/* 列表弹出动画 */
.list-pop-enter-active {
  animation: pop-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.list-pop-leave-active {
  animation: pop-in 0.3s reverse;
}

@keyframes pop-in {
  from {
    transform: scale(0.5) translateY(20vpx) rotate(-5deg);
    opacity: 0;
  }
  to {
    transform: scale(1) translateY(0) rotate(0);
    opacity: 1;
  }
}
</style>
