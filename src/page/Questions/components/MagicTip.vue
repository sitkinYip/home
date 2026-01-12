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
$magic-gold: #ffd700;

/* 1. 基础遮罩层样式 */
.magic-tip-overlay {
  position: fixed;
  inset: 0;
  z-index: 10005;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(10vpx); // 毛玻璃
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40vpx;
  perspective: 1200px;
}

/* 2. 基础卡片样式 */
.magic-tip-card {
  position: relative;
  width: 85%;
  max-width: 320vpx;
  background: radial-gradient(circle at top, #2a1b4d 0%, #12091d 100%);
  border: 1.5vpx solid $magic-gold;
  border-radius: 16vpx;
  padding: 24vpx;
  box-shadow: 0 0 40vpx rgba($magic-gold, 0.2);
  overflow: hidden;
  z-index: 10;
}

/* -----------------------------------------------------------
   3. 核心动画逻辑：背景与卡片分离
----------------------------------------------------------- */

/* 【背景遮罩层】仅执行淡入淡出 */
.magic-tip-enter-active,
.magic-tip-leave-active {
  transition: opacity 0.5s ease;
}

/* 【卡片主体】执行复杂的 3D 弹出动效 */
.magic-tip-enter-active .magic-tip-card {
  transition: all 0.5s cubic-bezier(0.15, 1.15, 0.6, 1);
}

.magic-tip-leave-active .magic-tip-card {
  transition: all 0.3s ease-in;
}

/* 状态定义 */
.magic-tip-enter-from {
  opacity: 0; // 遮罩层淡出状态

  .magic-tip-card {
    // 只有卡片在放大展开
    opacity: 0;
    transform: scale(0.4) rotateX(-40deg) translateY(60vpx);
    filter: blur(10vpx) brightness(2);
  }
}

.magic-tip-leave-to {
  opacity: 0; // 遮罩层淡出状态

  .magic-tip-card {
    // 卡片执行关闭动画（气化升华）
    opacity: 0;
    transform: scale(1.1) translateY(-30vpx);
    filter: blur(10vpx) brightness(3);
  }
}

/* -----------------------------------------------------------
   4. 布局逻辑
----------------------------------------------------------- */

.tip-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10vpx;
  margin-bottom: 20vpx;
  color: $magic-gold;
  .magic-icon {
    font-size: 22vpx;
  }
  .tip-title {
    font-size: 16vpx;
    font-weight: bold;
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
    color: rgba(255, 255, 255, 0.95);
    margin: 0;
  }
}

.tip-footer {
  display: flex;
  justify-content: center;
  width: 100%;

  .close-btn {
    background: transparent;
    border: 1.2vpx solid $magic-gold;
    color: $magic-gold;
    padding: 10vpx 36vpx;
    border-radius: 24vpx;
    font-size: 14vpx;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.2s;
    &:active {
      background: rgba($magic-gold, 0.1);
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
  background: radial-gradient(circle at center, rgba($magic-gold, 0.05) 0%, transparent 70%);
  pointer-events: none;
}
</style>
