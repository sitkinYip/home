<!-- components/MagicScroll.vue -->
<template>
  <transition name="scroll-unfold">
    <!-- 点击遮罩层触发 handleClose -->
    <div v-if="visible" class="scroll-overlay" @click.self="handleClose">
      <div class="scroll-body">
        <!-- 卷轴顶杆 -->
        <div class="scroll-rod top"></div>

        <div class="scroll-paper">
          <div class="scroll-content-wrap">
            <div class="scroll-title">神谕密卷</div>
            <div class="scroll-text">{{ text }}</div>
          </div>

          <!-- 底部关闭按钮 -->
          <div class="scroll-footer" @click="handleClose">收起卷轴</div>
        </div>

        <!-- 卷轴底杆 -->
        <div class="scroll-rod bottom"></div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const visible = ref(false);
const text = ref("");

const show = (content: string) => {
  text.value = content;
  visible.value = true;
};

const handleClose = () => {
  // 触发 transition 的 leave 动画
  visible.value = false;
};

// 暴露给父组件调用
defineExpose({ show });
</script>

<style lang="scss" scoped>
.scroll-overlay {
  position: fixed;
  inset: 0;
  z-index: 10005;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(12vpx);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40vpx;
  // 确保整体淡入淡出
  transition: opacity 0.5s ease;
}

.scroll-body {
  position: relative;
  width: 100%;
  max-width: 320vpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.scroll-paper {
  width: 90%;
  background: #f4e4bc;
  background-image:
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.05'/%3E%3C/svg%3E"),
    radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.05) 100%);
  box-shadow: 0 10vpx 30vpx rgba(0, 0, 0, 0.5);
  padding: 30vpx 20vpx;
  position: relative;
  min-height: 150vpx;
  max-height: 65vh;
  overflow-y: auto;
  border-left: 2vpx solid rgba(0, 0, 0, 0.05);
  border-right: 2vpx solid rgba(0, 0, 0, 0.05);
  // 转换中心设为中间，收缩时向中心靠拢
  transform-origin: center;
  z-index: 1;

  .scroll-content-wrap {
    color: #3e2723;
    font-family: serif;

    .scroll-title {
      text-align: center;
      font-weight: bold;
      font-size: 19vpx;
      margin-bottom: 20vpx;
      border-bottom: 1vpx solid rgba(62, 39, 35, 0.2);
      padding-bottom: 12vpx;
      letter-spacing: 2vpx;
    }

    .scroll-text {
      font-size: 16vpx;
      line-height: 1.8;
      white-space: pre-wrap;
    }
  }
}

.scroll-rod {
  width: 104%; // 比纸稍宽一点，视觉更自然
  height: 20vpx;
  background: linear-gradient(to right, #3e2723, #5d4037, #3e2723);
  border-radius: 10vpx;
  box-shadow: 0 4vpx 10vpx rgba(0, 0, 0, 0.6);
  z-index: 2;
  position: relative;
}

.scroll-footer {
  margin-top: 25vpx;
  text-align: center;
  font-size: 13vpx;
  color: #8d6e63;
  text-transform: uppercase;
  letter-spacing: 1vpx;
  cursor: pointer;
  font-weight: bold;
}

/* --- 核心动画逻辑 --- */

// 进入和离开的活跃阶段
.scroll-unfold-enter-active,
.scroll-unfold-leave-active {
  transition: opacity 0.5s ease;

  .scroll-paper {
    transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  }

  .scroll-rod.top,
  .scroll-rod.bottom {
    transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  }
}

// 离开动画阶段的具体表现 (收起)
.scroll-unfold-leave-to {
  opacity: 0;

  .scroll-paper {
    transform: scaleY(0); // 纸张高度向中心缩至0
  }

  .scroll-rod.top {
    transform: translateY(110vpx); // 顶杆向下移
  }

  .scroll-rod.bottom {
    transform: translateY(-110vpx); // 底杆向上移
  }
}

// 进入动画的起始阶段 (拉开前)
.scroll-unfold-enter-from {
  opacity: 0;

  .scroll-paper {
    transform: scaleY(0);
  }

  .scroll-rod.top {
    transform: translateY(110vpx);
  }

  .scroll-rod.bottom {
    transform: translateY(-110vpx);
  }
}
</style>
