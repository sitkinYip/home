<template>
  <Teleport to="body">
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

        <!-- 局部的礼花画布 -->
        <canvas ref="confettiCanvasRef" class="confetti-canvas"></canvas>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, nextTick } from "vue";
import gsap from "gsap";
import confetti from "canvas-confetti";

const visible = ref(false);
const isInteractive = ref(false);
const confettiCanvasRef = ref<HTMLCanvasElement | null>(null);
let myConfetti: confetti.CreateTypes | null = null;

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

    if (confettiCanvasRef.value && !myConfetti) {
      myConfetti = confetti.create(confettiCanvasRef.value, { resize: true });
    }
    triggerConfetti();
  });
};

const handleClose = () => {
  if (!isInteractive.value) return;
  visible.value = false;
  if (myConfetti) {
    myConfetti.reset();
    myConfetti = null;
  }
  emit("close");
};

const triggerConfetti = () => {
  if (!myConfetti) return;
  const end = Date.now() + 5 * 1000;
  const colors = ["#d9a441", "#ece6d8", "#5fae7f"];

  (function frame() {
    if (!visible.value || !myConfetti) return;

    myConfetti({
      particleCount: 5,
      angle: 60,
      spread: 70,
      origin: { x: 0 },
      colors: colors,
    });
    myConfetti({
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
  z-index: $z-top; // 高于 VideoPlayer(10010) 和 Vant ImagePreview，确保全屏特效不被媒体层遮挡
  background: radial-gradient(circle at center, rgba(28, 24, 19, 0.95) 0%, $ink-900 100%);
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
    rgba(217, 164, 65, 0.1) 120deg,
    transparent 180deg,
    rgba(217, 164, 65, 0.08) 300deg,
    transparent 360deg
  );
  animation: rotateLight 22s linear infinite;
  mix-blend-mode: screen;
}

.geom-container {
  position: relative;
  width: 240vpx;
  height: 240vpx;
  display: flex;
  align-items: center;
  justify-content: center;
  perspective: 1000px;
  margin: 0 40vpx;

  .geom-layer {
    position: absolute;
    width: 100%;
    height: 100%;
    border: 2vpx solid rgba(217, 164, 65, 0.5);
    box-shadow:
      inset 0 0 20vpx rgba(217, 164, 65, 0.18),
      0 0 20vpx rgba(217, 164, 65, 0.22);

    &.outer-diamond {
      transform: rotateZ(45deg);
      animation: pulseSize 4s ease-in-out infinite alternate;
    }

    &.middle-star {
      width: 70%;
      height: 70%;
      border-radius: 50%;
      border: 2vpx dashed rgba(236, 230, 216, 0.28);
      animation: rotateCW 15s linear infinite;
    }
  }

  .core-glow {
    width: 30%;
    height: 30%;
    background: radial-gradient(circle, $ember-bright 0%, $ember 50%, transparent 100%);
    filter: blur(15vpx);
    border-radius: 50%;
    animation: breathe 1.6s infinite;
  }
}

.victory-text-wrap {
  position: relative;
  z-index: 10;
  text-align: center;
  margin-top: 40vpx;
  padding: 0 20vpx;
  width: 100%;
  box-sizing: border-box;

  .victory-title {
    font-family: $font-display;
    font-size: 26vpx;
    font-weight: 700;
    color: $text;
    letter-spacing: 2vpx;
    margin: 0;
    filter: drop-shadow(0 2vpx 10vpx rgba(217, 164, 65, 0.4));
  }

  .victory-subtitle {
    font-size: 13vpx;
    color: $text-mute;
    letter-spacing: 2vpx;
    margin-top: 12vpx;
  }

  .action-hint {
    margin-top: 40vpx;
    font-family: $font-display;
    font-size: 12vpx;
    color: $ember;
    opacity: 0.55;
    animation: breathe 2.4s infinite;
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

.confetti-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 50;
}

.hint-fade-enter-active {
  transition: all 1s ease 0.5s;
}
.hint-fade-enter-from {
  opacity: 0;
  transform: translateY(10vpx);
}
</style>
