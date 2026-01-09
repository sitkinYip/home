<!-- components/MagicScroll.vue -->
<template>
  <transition name="scroll-unfold">
    <div v-if="visible" class="scroll-overlay" @click.self="handleClose">
      <div class="scroll-body">
        <div class="scroll-rod top"></div>

        <div class="scroll-paper">
          <div class="scroll-content-wrap">
            <div class="scroll-title">神谕密卷</div>
            <!-- 核心：渲染解析后的富文本 -->
            <div class="scroll-text" v-html="parsedText"></div>
          </div>
          <div class="scroll-footer" @click="handleClose">合上卷轴</div>
        </div>

        <div class="scroll-rod bottom"></div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";

const visible = ref(false);
const rawText = ref("");

// 解析文字：支持 [[文本]] 高亮和 \n 换行
const parsedText = computed(() => {
  if (!rawText.value) return "";
  return rawText.value
    .replace(/\n/g, "<br>")
    .replace(/\[\[(.*?)\]\]/g, '<span class="scroll-highlight">$1</span>');
});

const show = (content: string) => {
  rawText.value = content;
  visible.value = true;
};

const handleClose = () => {
  visible.value = false;
};

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
  transform-origin: center;
  z-index: 1;

  .scroll-text {
    font-size: 16vpx;
    line-height: 1.8;
    color: #3e2723;
    font-family: serif;

    // 解析后的高亮样式：红墨水手书
    :deep(.scroll-highlight) {
      color: #b71c1c; // 深红
      font-weight: 900;
      padding: 0 4vpx;
      margin: 0 2vpx;
      border-bottom: 2vpx wavy #d32f2f; // 手绘波浪线
      background: rgba(211, 47, 47, 0.05);
      border-radius: 4vpx;
    }
  }
}

.scroll-rod {
  width: 104%;
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
  text-decoration: underline;
  cursor: pointer;
}

/* 动画逻辑 */
.scroll-unfold-enter-active,
.scroll-unfold-leave-active {
  transition: opacity 0.5s ease;
  .scroll-paper,
  .scroll-rod {
    transition: transform 0.6s cubic-bezier(0.165, 0.84, 0.44, 1);
  }
}
.scroll-unfold-enter-from,
.scroll-unfold-leave-to {
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
