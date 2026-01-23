<template>
  <div class="overlay">
    <div class="start-btn-wrapper">
      <!-- 旋转的流光边框层 -->
      <div class="border-glow"></div>

      <div class="start-btn" @click="$emit('start')">
        <span class="icon-l">✦</span>
        <span class="text">{{ text }}</span>
        <span class="icon-r">✦</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component StartButton
 * @description 开始按钮组件 - 升级为流光星际风格
 */

defineProps<{
  text: string;
}>();

defineEmits(["start"]);
</script>

<style scoped>
@import "@/assets/fonts/Cinzel/font.css";

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(3px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  transition: opacity 1s ease;
}

/* 包装器，用于定位和层级控制 */
.start-btn-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4px; /* 留出空间给流光边框 */
  border-radius: 999px;
  /* 呼吸光晕动画 */
  animation: breathe 3s infinite ease-in-out;
}

@keyframes breathe {
  0%,
  100% {
    box-shadow:
      0 0 20px rgba(225, 175, 255, 0.2),
      0 0 50px rgba(180, 228, 255, 0.1);
    transform: scale(1);
  }
  50% {
    box-shadow:
      0 0 40px rgba(225, 175, 255, 0.4),
      0 0 80px rgba(180, 228, 255, 0.2);
    transform: scale(1.02);
  }
}

/* 汇聚光环动画 */
.border-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  border: 1px solid rgba(225, 175, 255, 0.3);
  box-shadow: 0 0 10px rgba(180, 228, 255, 0.2);
  opacity: 0;
  z-index: 1;
  animation: inward-ripple 3s infinite cubic-bezier(0.4, 0, 0.2, 1);
}

/* 增加第二个光环，错开时间，形成循环感 */
.border-glow::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 999px;
  border: 1px solid rgba(180, 228, 255, 0.3);
  animation: inward-ripple 3s infinite cubic-bezier(0.4, 0, 0.2, 1);
  animation-delay: 1.5s;
}

@keyframes inward-ripple {
  0% {
    transform: scale(1.5);
    opacity: 0;
    box-shadow: 0 0 0 rgba(225, 175, 255, 0);
  }
  20% {
    opacity: 0.6;
    border-color: rgba(225, 175, 255, 0.5);
  }
  100% {
    transform: scale(1);
    opacity: 0;
    border-color: rgba(180, 228, 255, 0.8);
    box-shadow: 0 0 20px rgba(180, 228, 255, 0.6);
  }
}

.start-btn {
  position: relative;
  z-index: 2;
  padding: 16px 50px;
  border-radius: 999px;
  background: rgba(20, 20, 30, 0.7); /* 深色半透明底，衬托文字 */
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);

  /* 内部边框，增加精致感 */
  border: 1px solid rgba(255, 255, 255, 0.1);

  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;

  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.19, 1, 0.22, 1);
  overflow: hidden;
}

/* 文字样式 */
.text {
  font-family: "Cinzel", "Songti SC", serif;
  font-size: 1.3rem;
  font-weight: 600;
  letter-spacing: 6px;
  color: #fff;
  /* 文字渐变 */
  background: linear-gradient(120deg, #fff 0%, #e0b0ff 50%, #b4e4ff 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 2px 10px rgba(224, 176, 255, 0.3);
}

/* 装饰图标 */
.icon-l,
.icon-r {
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  animation: twinkle 2s infinite ease-in-out;
}
.icon-r {
  animation-delay: 1s;
}

@keyframes twinkle {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

/* 扫光效果 */
.start-btn::after {
  content: "";
  position: absolute;
  top: 0;
  left: -150%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
  transform: skewX(-20deg);
  transition: 0.5s;
}

/* Hover 交互 */
.start-btn-wrapper:hover .start-btn {
  background: rgba(40, 30, 50, 0.8);
  transform: scale(0.98); /* 稍微按下 */
}

.start-btn-wrapper:hover .start-btn::after {
  left: 150%;
  transition: 0.6s ease-in-out;
}

.start-btn-wrapper:hover .border-glow {
  opacity: 1;
  animation-duration: 2s; /* 加速旋转 */
}

/* 移动端适配 */
@media (max-width: 768px) {
  .start-btn {
    padding: 14px 24px;
    gap: 8px;
  }

  .text {
    font-size: 16px;
    letter-spacing: 2px;
  }

  .icon-l,
  .icon-r {
    font-size: 12px;
  }
}
</style>
