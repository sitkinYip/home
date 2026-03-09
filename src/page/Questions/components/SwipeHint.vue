<template>
  <Teleport to="body">
    <transition name="swipe-hint">
      <div v-if="visible" class="swipe-hint" @click="handleClick">
        <div class="swipe-hint-inner">
          <span class="hint-text">{{ hintText }}</span>
          <div class="hint-arrows">
            <span
              class="arrow-icon"
              v-for="index in 3"
              :key="index"
              :style="{ animationDelay: `${(index - 1) * 0.15}s` }"
            >
              ‹
            </span>
          </div>
        </div>
        <div class="hint-glow"></div>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, watch, onBeforeUnmount } from "vue";

const props = defineProps<{
  /** 是否应该展示提示（外部控制触发时机） */
  show: boolean;
}>();

const emit = defineEmits<{
  (event: "dismiss"): void;
}>();

const visible = ref(false);
const hintText = ref("左滑查看下一题");
let dismissTimer: ReturnType<typeof setTimeout> | null = null;

const clearTimer = () => {
  if (dismissTimer) {
    clearTimeout(dismissTimer);
    dismissTimer = null;
  }
};

const dismiss = () => {
  visible.value = false;
  emit("dismiss");
};

const handleClick = () => {
  clearTimer();
  dismiss();
};

watch(
  () => props.show,
  (shouldShow) => {
    clearTimer();
    if (shouldShow) {
      // 检查是否有弹窗正在展示
      const isMagicScrollShow = document.documentElement.hasAttribute("data-magicscrollshow");
      hintText.value = isMagicScrollShow ? "关闭弹窗后 左滑查看下一题" : "左滑查看下一题";

      visible.value = true;
      // 4 秒后自动消失
      dismissTimer = setTimeout(dismiss, 4000);
    } else {
      visible.value = false;
    }
  },
);

onBeforeUnmount(() => {
  clearTimer();
});
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

.swipe-hint {
  position: absolute;
  bottom: 60vpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10010;
  pointer-events: auto;
  cursor: pointer;
}

.swipe-hint-inner {
  display: flex;
  align-items: center;
  gap: 8vpx;
  padding: 10vpx 20vpx;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(16vpx);
  -webkit-backdrop-filter: blur(16vpx);
  border: 1vpx solid rgba($magic-gold, 0.3);
  border-radius: 24vpx;
  box-shadow:
    0 4vpx 20vpx rgba(0, 0, 0, 0.4),
    0 0 12vpx rgba($magic-gold, 0.1);
  white-space: nowrap;
}

.hint-text {
  font-size: 13vpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.85);
  letter-spacing: 0.5vpx;
}

.hint-arrows {
  display: flex;
  align-items: center;
  gap: 1vpx;
}

.arrow-icon {
  display: inline-block;
  font-size: 16vpx;
  font-weight: bold;
  color: $magic-gold;
  opacity: 0.3;
  animation: arrow-pulse 1.2s ease-in-out infinite;

  &:nth-child(1) {
    animation-delay: 0.3s;
  }
  &:nth-child(2) {
    animation-delay: 0.15s;
  }
  &:nth-child(3) {
    animation-delay: 0s;
  }
}

.hint-glow {
  position: absolute;
  inset: -2vpx;
  border-radius: 26vpx;
  background: linear-gradient(90deg, transparent, rgba($magic-gold, 0.15), transparent);
  animation: glow-sweep 3s ease-in-out infinite;
  pointer-events: none;
  z-index: -1;
}

// 箭头依次闪烁动画
@keyframes arrow-pulse {
  0%,
  100% {
    opacity: 0.2;
    transform: translateX(0);
  }
  50% {
    opacity: 1;
    transform: translateX(-3vpx);
  }
}

// 光晕扫过动画
@keyframes glow-sweep {
  0% {
    opacity: 0;
    transform: translateX(30%);
  }
  50% {
    opacity: 1;
    transform: translateX(-30%);
  }
  100% {
    opacity: 0;
    transform: translateX(30%);
  }
}

// Vue 过渡动画
.swipe-hint-enter-active {
  transition:
    opacity 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275),
    transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.swipe-hint-leave-active {
  transition:
    opacity 0.4s ease-out,
    transform 0.4s ease-out;
}

.swipe-hint-enter-from {
  opacity: 0;
  transform: translateX(-50%) translateY(16vpx) scale(0.9);
}

.swipe-hint-enter-to {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

.swipe-hint-leave-from {
  opacity: 1;
  transform: translateX(-50%) translateY(0) scale(1);
}

.swipe-hint-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(-10vpx) scale(0.95);
}
</style>
