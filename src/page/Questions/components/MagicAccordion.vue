<template>
  <div
    class="magic-accordion"
    :class="{
      'is-collapsed': !modelValue,
      'is-disabled': disabled,
      'is-animating': isAnimating,
    }"
  >
    <!-- 魔法光晕背景 -->
    <div class="magic-glow" :class="{ active: !modelValue }"></div>

    <!-- 头部区域 (可点击) -->
    <div class="accordion-header" @click="handleToggle">
      <transition name="header-switch" mode="out-in">
        <!-- 展开状态：显示原来的 Header Slot -->
        <div class="header-content expanded" v-if="modelValue" key="expanded">
          <slot name="header"></slot>
          <!-- 展开时的收起图标 (仅在非禁用时显示) -->
          <div class="toggle-icon-wrap expanded-icon" v-if="!disabled">
            <el-icon :size="toVpx(14)" class="arrow-icon"><ArrowDown /></el-icon>
          </div>
        </div>

        <!-- 收起状态：克制的单行回顾标识 -->
        <div class="header-content collapsed" v-else key="collapsed">
          <div class="magic-success-banner">
            <span class="banner-ornament left"></span>
            <span class="banner-text">谜题已解 · 点击回顾</span>
            <span class="banner-ornament right"></span>
          </div>
        </div>
      </transition>
    </div>

    <!-- 内容区域 (折叠动画) -->
    <div class="accordion-body" ref="bodyRef" :style="bodyStyle">
      <!-- 内容容器 - 保持固定宽度避免换行 -->
      <div class="body-inner" ref="innerRef">
        <slot></slot>
      </div>
      <!-- 展开/收起时的魔法边缘光效 -->
      <div class="edge-glow" :class="{ active: isAnimating }"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted, onUnmounted, computed } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";

interface Props {
  modelValue: boolean; // 是否展开
  disabled?: boolean; // 是否禁用折叠 (如未答对时不可收起)
}

const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue"]);

const innerRef = ref<HTMLElement | null>(null);
const bodyRef = ref<HTMLElement | null>(null);
const scrollHeight = ref(1000); // 初始给个足够大的值，之后动态获取
const isAnimating = ref(false);

// 计算 body 样式，使用 opacity 配合 max-height 实现更平滑的过渡
const bodyStyle = computed(() => {
  if (props.modelValue) {
    return {
      maxHeight: scrollHeight.value + "px",
      opacity: "1",
    };
  }
  return {
    maxHeight: "0px",
    opacity: "0",
  };
});

const updateHeight = () => {
  if (innerRef.value) {
    const newHeight = innerRef.value.scrollHeight + 10;
    // 仅当高度变化超过阈值时才更新，避免 ResizeObserver 与 transition 动画循环触发
    if (Math.abs(newHeight - scrollHeight.value) > 5) {
      scrollHeight.value = newHeight;
    }
  }
};

// 监听展开状态变化，触发动画标记
watch(
  () => props.modelValue,
  (val, oldVal) => {
    if (val !== oldVal) {
      isAnimating.value = true;
      // 动画持续时间后移除标记
      setTimeout(() => {
        isAnimating.value = false;
      }, 600);
    }
    if (val) {
      // 展开时立即更新高度
      updateHeight();
    }
  },
);

let resizeObserver: ResizeObserver | null = null;
onMounted(() => {
  if (innerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      // 只在展开状态下更新高度
      if (props.modelValue) {
        updateHeight();
      }
    });
    resizeObserver.observe(innerRef.value);
  }
  updateHeight();
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
  }
});

const handleToggle = () => {
  if (props.disabled) return;
  emit("update:modelValue", !props.modelValue);
};
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

.magic-accordion {
  width: 100%;
  position: relative;
  transition: all 0.3s ease;
}

// 魔法光晕背景（收起态克制暖光）
.magic-glow {
  position: absolute;
  top: -20vpx;
  left: 50%;
  transform: translateX(-50%);
  width: 70%;
  height: 54vpx;
  background: radial-gradient(ellipse at center, rgba($ember, 0) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.6s ease;
  pointer-events: none;
  z-index: 0;

  &.active {
    opacity: 1;
    background: radial-gradient(ellipse at center, rgba($ember, 0.1) 0%, transparent 70%);
  }
}

.magic-accordion.is-disabled {
  .accordion-header {
    cursor: default;
  }
}

.accordion-header {
  cursor: pointer;
  padding: 0;
  user-select: none;
  position: relative;
  min-height: 48vpx;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
}

.header-content {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;

  &.expanded {
    position: relative;
    .expanded-icon {
      position: absolute;
      right: 0;
      top: 50%;
      transform: translateY(-50%) rotate(180deg);
      opacity: 0.55;
      transition: all 0.3s ease;

      .arrow-icon {
        color: rgba($ember, 0.8);
        transition: transform 0.3s ease;
      }
    }

    &:hover .expanded-icon {
      opacity: 0.9;
    }
  }
}

// 收起态：克制的单行标识（去掉粒子/shimmer/双 ornament-glow）
.magic-success-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12vpx;
  width: 100%;
  padding: 14vpx 0;
  position: relative;
  border-top: 1vpx solid rgba($ember, 0.12);
  border-bottom: 1vpx solid rgba($ember, 0.12);

  .banner-text {
    font-family: $font-display;
    font-size: 12vpx;
    color: $ember;
    font-weight: 600;
    letter-spacing: 3vpx;
    text-transform: uppercase;
    position: relative;
    z-index: 1;
  }

  .banner-ornament {
    height: 1vpx;
    flex: 0 0 30vpx;
    background: linear-gradient(90deg, transparent, rgba($ember, 0.45), transparent);

    &.left,
    &.right {
      background: linear-gradient(90deg, transparent, rgba($ember, 0.45), transparent);
    }
  }
}

// Header 切换动画 - 使用更精细的控制避免换行
.header-switch-enter-active,
.header-switch-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  width: 100%;
  left: 0;
}

.header-switch-enter-from {
  opacity: 0;
  transform: translateY(8vpx) scale(0.98);
}

.header-switch-leave-to {
  opacity: 0;
  transform: translateY(-8vpx) scale(0.98);
}

// 内容区域样式
.accordion-body {
  overflow: hidden;
  transition:
    max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1),
    opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: max-height, opacity;
  position: relative;
}

.body-inner {
  box-sizing: border-box;
  transform: translateZ(0);
  backface-visibility: hidden;
}

// 边缘光效（展开瞬间的克制扫光）
.edge-glow {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1vpx;
  background: linear-gradient(90deg, transparent, rgba($ember, 0.4), transparent);
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;

  &.active {
    opacity: 1;
    animation: edgeGlowSweep 0.6s ease-out;
  }
}

@keyframes edgeGlowSweep {
  0% {
    transform: scaleX(0);
    opacity: 1;
  }
  50% {
    transform: scaleX(1);
    opacity: 1;
  }
  100% {
    transform: scaleX(1);
    opacity: 0;
  }
}

// 收起状态的 hover
.magic-accordion.is-collapsed {
  .accordion-header {
    &:hover {
      .magic-success-banner {
        border-top-color: rgba($ember, 0.2);
        border-bottom-color: rgba($ember, 0.2);
      }
    }
  }
}

// 动画进行中的样式
.magic-accordion.is-animating {
  .body-inner {
    pointer-events: none;
  }
}
</style>
