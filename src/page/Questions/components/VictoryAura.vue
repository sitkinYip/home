<template>
  <transition name="fade">
    <div v-if="visible" class="victory-aura-overlay">
      <!-- 极光背景 -->
      <div class="divine-light"></div>

      <!-- 复合魔法阵 -->
      <div class="magic-circle-container">
        <!-- 外环：符文环 -->
        <div class="circle-layer outer"></div>
        <!-- 中环：星象环 -->
        <div class="circle-layer middle"></div>
        <!-- 内环：核心几何 -->
        <div class="circle-layer inner"></div>
        <!-- 核心光流 -->
        <div class="hero-glow"></div>
      </div>

      <!-- 胜利文字 -->
      <div class="victory-text-wrap">
        <h1 class="victory-title" data-text="MISSION COMPLETE">MISSION COMPLETE</h1>
        <p class="victory-subtitle">英雄归来 · 揭开了最后的真相</p>
        <div class="action-hint">点击任意处返回冒险</div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref, nextTick } from "vue";
import gsap from "gsap";
import confetti from "canvas-confetti";

const visible = ref(false);

const startEffect = () => {
  visible.value = true;

  // 触发物理反馈
  if (window.navigator?.vibrate) {
    window.navigator.vibrate([100, 50, 200]);
  }

  nextTick(() => {
    const tl = gsap.timeline();

    // 魔法阵展开
    tl.fromTo(
      ".magic-circle-container",
      { scale: 0, opacity: 0, rotate: -180 },
      { scale: 1, opacity: 1, rotate: 0, duration: 1.2, ease: "back.out(1.5)" },
    );

    // 文字升起
    tl.fromTo(
      ".victory-text-wrap",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      "-=0.4",
    );

    // 持续抛洒黄金粒子
    triggerConfetti();
  });
};

const triggerConfetti = () => {
  const end = Date.now() + 10 * 1000;
  const colors = ["#ffd700", "#ffffff", "#8a2be2"];

  (function frame() {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
};

// 暴露给父组件调用
defineExpose({ startEffect });
</script>

<style lang="scss" scoped>
$magic-gold: #ffd700;

// 复杂的魔法阵 Base64 SVG (金色透明)
$magic-svg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cg fill='none' stroke='%23FFD700' stroke-width='2'%3E%3Ccircle cx='256' cy='256' r='250' stroke-opacity='0.2'/%3E%3Ccircle cx='256' cy='256' r='230' stroke-width='4' stroke-dasharray='20 10'/%3E%3Cpath d='M256 20 L460 380 L52 380 Z' stroke-opacity='0.6'/%3E%3Cpath d='M256 492 L52 132 L460 132 Z' stroke-opacity='0.6'/%3E%3Ccircle cx='256' cy='256' r='120' stroke-width='2'/%3E%3Ccircle cx='256' cy='256' r='100' stroke-dasharray='5 5'/%3E%3Cpath d='M256 20 V492 M20 256 H492' stroke-opacity='0.3'/%3E%3Ccircle cx='256' cy='256' r='160' stroke-width='1' stroke-dasharray='2 4'/%3E%3C/g%3E%3Cpath d='M256 256 m-240 0 a240 240 0 1 0 480 0 a240 240 0 1 0 -480 0' fill='none' stroke='%23FFD700' stroke-width='8' stroke-dasharray='1 30' stroke-linecap='round'/%3E%3C/svg%3E";

.victory-aura-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: radial-gradient(circle at center, rgba(20, 10, 40, 0.95) 0%, rgba(0, 0, 0, 1) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  backdrop-filter: blur(15vpx);
}

.divine-light {
  position: absolute;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba(255, 215, 0, 0.05) 90deg,
    transparent 180deg,
    rgba(138, 43, 226, 0.05) 270deg,
    transparent 360deg
  );
  animation: rotateLight 15s linear infinite;
}

.magic-circle-container {
  position: relative;
  width: 320vpx;
  height: 320vpx;
  display: flex;
  align-items: center;
  justify-content: center;

  .circle-layer {
    position: absolute;
    background-image: url($magic-svg);
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    filter: drop-shadow(0 0 12vpx rgba(255, 215, 0, 0.4));

    &.outer {
      width: 100%;
      height: 100%;
      animation: rotateCW 25s linear infinite;
      opacity: 0.8;
    }
    &.middle {
      width: 85%;
      height: 85%;
      animation: rotateCCW 18s linear infinite;
      opacity: 0.6;
      transform: rotate(45deg);
    }
    &.inner {
      width: 60%;
      height: 60%;
      animation: rotateCW 12s linear infinite;
      filter: drop-shadow(0 0 20vpx rgba(255, 215, 0, 0.8));
    }
  }

  .hero-glow {
    width: 30%;
    height: 30%;
    background: radial-gradient(circle, #fff 0%, $magic-gold 50%, transparent 100%);
    filter: blur(25vpx);
    border-radius: 50%;
    animation: pulse 2s infinite;
  }
}

.victory-text-wrap {
  position: relative;
  z-index: 10;
  text-align: center;
  margin-top: 40vpx;

  .victory-title {
    font-size: 36vpx;
    font-weight: 900;
    color: #fff;
    background: linear-gradient(to bottom, #fff 30%, $magic-gold 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 15vpx rgba(255, 215, 0, 0.6));
    letter-spacing: 2vpx;
    margin: 0;
  }

  .victory-subtitle {
    font-size: 15vpx;
    color: rgba(255, 255, 255, 0.8);
    letter-spacing: 5vpx;
    margin-top: 12vpx;
  }

  .action-hint {
    margin-top: 30vpx;
    font-size: 12vpx;
    color: rgba(255, 255, 255, 0.4);
    animation: breathe 2s infinite;
  }
}

// 动画
@keyframes rotateCW {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes rotateCCW {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}
@keyframes rotateLight {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes breathe {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.7;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
