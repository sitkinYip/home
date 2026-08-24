<template>
  <Teleport to="body">
    <transition name="fade">
      <!-- 增加点击事件 -->
      <div
        v-if="visible"
        class="victory-aura-overlay"
        @click="handleClose"
        :class="{ 'can-close': isInteractive }"
      >
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

        <div class="victory-text-wrap">
          <h1 class="victory-title" data-text="MISSION COMPLETE">MISSION COMPLETE</h1>
          <p class="victory-subtitle">英雄归来 · 揭开了最后的真相</p>

          <!-- 仅在可交互时显示的提示 -->
          <transition name="hint-fade">
            <div v-if="isInteractive" class="action-hint">点击任意处返回冒险</div>
          </transition>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, nextTick } from "vue";
import gsap from "gsap";
import confetti from "canvas-confetti";

const visible = ref(false);
const isInteractive = ref(false); // 控制是否允许点击关闭

// 定义可以传给父组件的事件
const emit = defineEmits(["close"]);

const startEffect = () => {
  visible.value = true;
  isInteractive.value = false; // 初始锁定

  if (window.navigator?.vibrate) {
    window.navigator.vibrate([100, 50, 200]);
  }

  nextTick(() => {
    const tl = gsap.timeline({
      // 动画全部执行完后的回调
      onComplete: () => {
        setTimeout(() => {
          isInteractive.value = true;
        }, 1000);
      },
    });

    tl.fromTo(
      ".magic-circle-container",
      { scale: 0, opacity: 0, rotate: -180 },
      { scale: 1, opacity: 1, rotate: 0, duration: 1.2, ease: "back.out(1.5)" },
    );

    tl.fromTo(
      ".victory-text-wrap",
      { y: 30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      "-=0.4",
    );

    triggerConfetti();
  });
};

const handleClose = () => {
  // 如果动画还没播完，不允许关闭
  if (!isInteractive.value) return;

  visible.value = false;
  // 触发父组件的回调
  emit("close");
};

const triggerConfetti = () => {
  const end = Date.now() + 6 * 1000; // 缩短粒子时间，避免关闭后还在背景喷发
  const colors = ["#d9a441", "#ece6d8", "#5fae7f"];

  (function frame() {
    if (!visible.value) return; // 如果已经关闭，停止喷发

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

defineExpose({ startEffect });
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

$magic-svg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cg fill='none' stroke='%23d9a441' stroke-width='2'%3E%3Ccircle cx='256' cy='256' r='250' stroke-opacity='0.18'/%3E%3Ccircle cx='256' cy='256' r='230' stroke-width='4' stroke-dasharray='20 10'/%3E%3Cpath d='M256 20 L460 380 L52 380 Z' stroke-opacity='0.5'/%3E%3Cpath d='M256 492 L52 132 L460 132 Z' stroke-opacity='0.5'/%3E%3Ccircle cx='256' cy='256' r='120' stroke-width='2'/%3E%3Ccircle cx='256' cy='256' r='100' stroke-dasharray='5 5'/%3E%3Cpath d='M256 20 V492 M20 256 H492' stroke-opacity='0.25'/%3E%3Ccircle cx='256' cy='256' r='160' stroke-width='1' stroke-dasharray='2 4'/%3E%3C/g%3E%3Cpath d='M256 256 m-240 0 a240 240 0 1 0 480 0 a240 240 0 1 0 -480 0' fill='none' stroke='%23d9a441' stroke-width='8' stroke-dasharray='1 30' stroke-linecap='round'/%3E%3C/svg%3E";

.victory-aura-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-top;
  background: radial-gradient(circle at center, rgba(28, 24, 19, 0.98) 0%, $ink-900 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  backdrop-filter: blur(15vpx);

  // 仅在可以关闭时显示手指光标
  &.can-close {
    cursor: pointer;
  }
}

.divine-light {
  position: absolute;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba(217, 164, 65, 0.04) 90deg,
    transparent 180deg,
    rgba(107, 91, 149, 0.03) 270deg,
    transparent 360deg
  );
  animation: rotateLight 18s linear infinite;
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
    filter: drop-shadow(0 0 10vpx rgba(217, 164, 65, 0.35));
    &.outer {
      width: 100%;
      height: 100%;
      animation: rotateCW 25s linear infinite;
      opacity: 0.7;
    }
    &.middle {
      width: 85%;
      height: 85%;
      animation: rotateCCW 18s linear infinite;
      opacity: 0.55;
      transform: rotate(45deg);
    }
    &.inner {
      width: 60%;
      height: 60%;
      animation: rotateCW 12s linear infinite;
      filter: drop-shadow(0 0 18vpx rgba(217, 164, 65, 0.6));
    }
  }

  .hero-glow {
    width: 30%;
    height: 30%;
    background: radial-gradient(circle, $ember-bright 0%, $ember 45%, transparent 100%);
    filter: blur(25vpx);
    border-radius: 50%;
    animation: pulse 2.4s infinite;
  }
}

.victory-text-wrap {
  position: relative;
  z-index: 10;
  text-align: center;
  margin-top: 40vpx;
  .victory-title {
    font-family: $font-display;
    font-size: 34vpx;
    font-weight: 700;
    color: $text;
    letter-spacing: 3vpx;
    margin: 0;
    filter: drop-shadow(0 2vpx 12vpx rgba(217, 164, 65, 0.4));
  }
  .victory-subtitle {
    font-size: 14vpx;
    color: $text-mute;
    letter-spacing: 4vpx;
    margin-top: 12vpx;
  }
  .action-hint {
    margin-top: 30vpx;
    font-family: $font-display;
    font-size: 12vpx;
    color: $ember;
    opacity: 0.55;
    animation: breathe 2.4s infinite;
    text-transform: uppercase;
    letter-spacing: 2vpx;
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
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.05);
    opacity: 0.8;
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
} // 提示文字延迟 0.5s 浮现
.hint-fade-enter-from {
  opacity: 0;
  transform: translateY(10vpx);
}
</style>
