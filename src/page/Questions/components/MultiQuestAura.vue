<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="multi-aura-overlay"
      @click="handleClose"
      :class="{ 'can-close': isInteractive }"
    >
      <!-- 背景光幕 -->
      <div class="divine-light"></div>

      <!-- 核心几何体 -->
      <div class="geom-container">
        <!-- 外层菱形框 -->
        <div class="geom-layer outer-diamond"></div>
        <!-- 中层六芒星 -->
        <div class="geom-layer middle-star"></div>
        <!-- 核心光球 -->
        <div class="core-glow"></div>
      </div>

      <div class="victory-text-wrap">
        <h1 class="victory-title" data-text="MASTER OF MYSTERIES">MASTER OF MYSTERIES</h1>
        <p class="victory-subtitle">恭喜！解开了本场冒险的所有谜题</p>

        <transition name="hint-fade">
          <div v-if="isInteractive" class="action-hint">点击任意处继续</div>
        </transition>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref, nextTick } from "vue";
import gsap from "gsap";
import confetti from "canvas-confetti";

const visible = ref(false);
const isInteractive = ref(false);

const emit = defineEmits(["close"]);

const startEffect = () => {
  visible.value = true;
  isInteractive.value = false;

  if (window.navigator?.vibrate) {
    window.navigator.vibrate([100, 50, 100, 50, 200]);
  }

  nextTick(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          isInteractive.value = true;
        }, 1200);
      },
    });

    tl.fromTo(
      ".geom-container",
      { scale: 0, opacity: 0, rotationY: 90 },
      { scale: 1, opacity: 1, rotationY: 0, duration: 1.5, ease: "bounce.out" },
    );

    tl.fromTo(
      ".victory-text-wrap",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      "-=0.5",
    );

    triggerConfetti();
  });
};

const handleClose = () => {
  if (!isInteractive.value) return;
  visible.value = false;
  emit("close");
};

const triggerConfetti = () => {
  const end = Date.now() + 5 * 1000;
  const colors = ["#ffd700", "#00d2ff", "#8a2be2"];

  (function frame() {
    if (!visible.value) return;

    confetti({
      particleCount: 5,
      angle: 60,
      spread: 70,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 5,
      angle: 120,
      spread: 70,
      origin: { x: 1 },
      colors: colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
};

defineExpose({ startEffect });
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

.multi-aura-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: radial-gradient(circle at center, rgba(15, 20, 35, 0.95) 0%, rgba(0, 0, 0, 1) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  backdrop-filter: blur(20vpx);
  -webkit-backdrop-filter: blur(20vpx);

  &.can-close {
    cursor: pointer;
  }
}

.divine-light {
  position: absolute;
  width: 150%;
  height: 150%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba($magic-purple, 0.15) 120deg,
    transparent 180deg,
    rgba($magic-gold, 0.15) 300deg,
    transparent 360deg
  );
  animation: rotateLight 20s linear infinite;
  mix-blend-mode: screen;
}

.geom-container {
  position: relative;
  width: 240vpx; // 缩小尺寸 300 -> 240
  height: 240vpx;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
  margin: 0 40vpx; // 增加两侧留白

  .geom-layer {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 2vpx solid transparent;
    border-image: linear-gradient(45deg, $magic-gold, $magic-purple) 1;
    box-shadow:
      inset 0 0 20vpx rgba($magic-purple, 0.3),
      0 0 20vpx rgba($magic-gold, 0.3);

    &.outer-diamond {
      transform: rotateZ(45deg);
      animation: pulseSize 4s ease-in-out infinite alternate;
    }

    &.middle-star {
      width: 70%;
      height: 70%;
      border-radius: 50%;
      border: 2vpx dashed $magic-cyan;
      animation: rotateCW 15s linear infinite;
    }
  }

  .core-glow {
    width: 30%;
    height: 30%;
    background: radial-gradient(circle, #fff 0%, $magic-purple 50%, transparent 100%);
    filter: blur(15vpx);
    border-radius: 50%;
    animation: breathe 1.5s infinite;
  }
}

.victory-text-wrap {
  position: relative;
  z-index: 10;
  text-align: center;
  margin-top: 40vpx; // 减小上边距
  padding: 0 20vpx; // 增加文字区域两侧留白
  width: 100%;
  box-sizing: border-box;

  .victory-title {
    font-size: 26vpx; // 缩小主标题字体大小 32 -> 26
    font-weight: 900;
    color: #fff;
    background: linear-gradient(90deg, #fff, $magic-cyan, $magic-purple);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    filter: drop-shadow(0 0 10vpx rgba($magic-cyan, 0.8));
    letter-spacing: 1vpx;
    margin: 0;
  }

  .victory-subtitle {
    font-size: 13vpx; // 缩小副标题字体大小 14 -> 13
    color: rgba(255, 255, 255, 0.85);
    letter-spacing: 2vpx; // 减小字间距
    margin-top: 12vpx;
  }

  .action-hint {
    margin-top: 40vpx;
    font-size: 13vpx;
    color: $magic-gold;
    opacity: 0.6;
    animation: breathe 2s infinite;
    text-transform: uppercase;
    letter-spacing: 2vpx;
  }
}

// 动画定义
@keyframes rotateCW {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
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
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.9;
  }
}

@keyframes pulseSize {
  0% {
    transform: rotateZ(45deg) scale(0.95);
    opacity: 0.8;
  }
  100% {
    transform: rotateZ(45deg) scale(1.05);
    opacity: 1;
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

.hint-fade-enter-active {
  transition: all 1s ease 0.5s;
}
.hint-fade-enter-from {
  opacity: 0;
  transform: translateY(10vpx);
}
</style>
