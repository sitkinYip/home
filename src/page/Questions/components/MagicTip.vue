<!-- components/MagicTip.vue -->
<template>
  <teleport to="body">
    <!-- 使用统一的过渡名称 magic-tip -->
    <transition name="magic-tip">
      <div v-if="visible" class="magic-tip-overlay" @click="hide">
        <div class="magic-tip-card" @click.stop>
          <!-- 顶部装饰 -->
          <div class="tip-header">
            <el-icon class="magic-icon"><MagicStick /></el-icon>
            <span class="tip-title">魔法提示</span>
          </div>

          <!-- 内容区域：块居中，行左对齐 -->
          <div class="tip-body">
            <div class="text-wrapper">
              <p class="tip-text" v-html="formattedContent"></p>
            </div>
          </div>

          <!-- 底部按钮 -->
          <div class="tip-footer">
            <button class="close-btn" @click="hide">知晓了</button>
          </div>

          <div class="card-glow"></div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { MagicStick } from "@element-plus/icons-vue";

const visible = ref(false);
const content = ref("");

const formattedContent = computed(() => {
  return content.value ? content.value.replace(/\n/g, "<br>") : "";
});

const show = (msg: string) => {
  content.value = msg;
  visible.value = true;
};

const hide = () => {
  visible.value = false;
};

defineExpose({ show, hide });
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

/* 1. 基础遮罩层样式 */
.magic-tip-overlay {
  position: fixed;
  inset: 0;
  z-index: 10005;
  background: rgba(20, 17, 13, 0.85);
  backdrop-filter: blur(10vpx);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40vpx;
  perspective: 1200px;
}

/* 2. 卡片样式（暖系底，替换紫调） */
.magic-tip-card {
  position: relative;
  width: 85%;
  max-width: 320vpx;
  background: radial-gradient(circle at top, $ink-700 0%, $ink-900 100%);
  border: 1.5vpx solid $glass-border-strong;
  border-radius: $radius-lg;
  padding: 24vpx;
  box-shadow: 0 0 40vpx rgba($ember, 0.14), $glass-inner;
  overflow: hidden;
  z-index: 10;
}

/* 3. 动画逻辑：背景与卡片分离 */
.magic-tip-enter-active,
.magic-tip-leave-active {
  transition: opacity 0.5s ease;
}

.magic-tip-enter-active .magic-tip-card {
  transition: all 0.5s cubic-bezier(0.15, 1.15, 0.6, 1);
}

.magic-tip-leave-active .magic-tip-card {
  transition: all 0.3s ease-in;
}

.magic-tip-enter-from {
  opacity: 0;

  .magic-tip-card {
    opacity: 0;
    transform: scale(0.4) rotateX(-40deg) translateY(60vpx);
    filter: blur(10vpx) brightness(2);
  }
}

.magic-tip-leave-to {
  opacity: 0;

  .magic-tip-card {
    opacity: 0;
    transform: scale(1.1) translateY(-30vpx);
    filter: blur(10vpx) brightness(3);
  }
}

/* 4. 布局逻辑 */
.tip-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10vpx;
  margin-bottom: 20vpx;
  color: $ember;
  .magic-icon {
    font-size: 22vpx;
  }
  .tip-title {
    font-family: $font-display;
    font-size: 16vpx;
    font-weight: 700;
    letter-spacing: 2vpx;
  }
}

.tip-body {
  margin-bottom: 24vpx;
  text-align: center;
  width: 100%;

  .text-wrapper {
    display: inline-block;
    text-align: left;
    max-width: 100%;
  }

  .tip-text {
    font-size: 15vpx;
    line-height: 1.8;
    color: $text;
    margin: 0;
  }
}

.tip-footer {
  display: flex;
  justify-content: center;
  width: 100%;

  .close-btn {
    background: transparent;
    border: 1.2vpx solid $ember;
    color: $ember;
    padding: 10vpx 36vpx;
    border-radius: $radius-pill;
    font-size: 14vpx;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    &:active {
      background: $ember-soft;
      transform: scale(0.95);
    }
  }
}

.card-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle at center, rgba($ember, 0.04) 0%, transparent 70%);
  pointer-events: none;
}
</style>
