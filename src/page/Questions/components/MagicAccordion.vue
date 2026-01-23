<template>
  <div class="magic-accordion" :class="{ 'is-collapsed': !modelValue, 'is-disabled': disabled }">
    <!-- 头部区域 (可点击) -->
    <div class="accordion-header" @click="handleToggle">
      <transition name="fade" mode="out-in">
        <!-- 展开状态：显示原来的 Header Slot -->
        <div class="header-content expanded" v-if="modelValue">
          <slot name="header"></slot>
          <!-- 展开时的收起图标 (仅在非禁用时显示) -->
          <div class="toggle-icon-wrap expanded-icon" v-if="!disabled">
            <el-icon :size="toVpx(14)" class="arrow-icon"><ArrowDown /></el-icon>
          </div>
        </div>

        <!-- 收起状态：显示华丽的文案 -->
        <div class="header-content collapsed" v-else>
          <div class="magic-success-banner">
            <span class="banner-ornament left"></span>
            <span class="banner-text">✨ 谜题已解 · 点击回顾 ✨</span>
            <span class="banner-ornament right"></span>
          </div>
        </div>
      </transition>
    </div>

    <!-- 内容区域 (折叠动画) -->
    <div
      class="accordion-body"
      ref="bodyRef"
      :style="{ maxHeight: modelValue ? scrollHeight + 'px' : '0' }"
    >
      <div class="body-inner" ref="innerRef">
        <slot></slot>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onMounted } from "vue";
import { ArrowDown } from "@element-plus/icons-vue";

interface Props {
  modelValue: boolean; // 是否展开
  disabled?: boolean; // 是否禁用折叠 (如未答对时不可收起)
}

const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue"]);

const innerRef = ref<HTMLElement | null>(null);
const scrollHeight = ref(1000); // 初始给个足够大的值，之后动态获取

const updateHeight = () => {
  if (innerRef.value) {
    scrollHeight.value = innerRef.value.scrollHeight;
  }
};

watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      updateHeight();
    }
  },
);

let resizeObserver: ResizeObserver | null = null;
onMounted(() => {
  if (innerRef.value) {
    resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    resizeObserver.observe(innerRef.value);
  }
  updateHeight();
});

const handleToggle = () => {
  if (props.disabled) return;
  emit("update:modelValue", !props.modelValue);
};
</script>

<style lang="scss" scoped>
$magic-gold: #ffd700;

.magic-accordion {
  width: 100%;
  transition: all 0.3s ease;
}

.magic-accordion.is-disabled {
  .accordion-header {
    cursor: default;
  }
}

.accordion-header {
  cursor: pointer;
  padding: 0; // Padding handled by internal elements
  user-select: none;
  position: relative;
  min-height: 48vpx; // Ensure consistent height
  display: flex;
  align-items: center;
  justify-content: center;
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
      opacity: 0.6;
      transition: opacity 0.3s;

      .arrow-icon {
        color: rgba($magic-gold, 0.8);
      }
    }
  }
}

.magic-success-banner {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12vpx;
  width: 100%;
  padding: 16vpx 0;
  background: radial-gradient(circle at center, rgba($magic-gold, 0.15) 0%, transparent 80%);
  border-top: 1vpx solid rgba($magic-gold, 0.1);
  border-bottom: 1vpx solid rgba($magic-gold, 0.1);
  animation: bannerFadeIn 0.5s ease-out;

  .banner-text {
    font-size: 14vpx;
    color: $magic-gold;
    font-weight: bold;
    letter-spacing: 2vpx;
    text-shadow: 0 0 8vpx rgba($magic-gold, 0.6);
  }

  .banner-ornament {
    width: 20vpx;
    height: 1vpx;
    background: linear-gradient(90deg, transparent, $magic-gold, transparent);

    &.left {
      transform: rotate(180deg);
    }
  }
}

@keyframes bannerFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

// Fade transition logic
.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(2vpx);
}

.accordion-body {
  overflow: hidden;
  transition: max-height 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: max-height;
}

.body-inner {
  // 确保 padding 不会影响高度计算
  overflow: hidden;
}
</style>
