<template>
  <transition name="rank-up-fade">
    <div
      v-if="visible"
      class="rank-up-overlay"
      @click="handleClose"
      :class="{ 'can-close': isInteractive }"
    >
      <!-- 极光背景 -->
      <div class="rank-divine-light"></div>

      <!-- 升级粒子 -->
      <div class="rank-particles">
        <span
          v-for="index in 25"
          :key="index"
          class="particle"
          :style="particleStyle(index)"
        ></span>
      </div>

      <!-- 核心魔法阵 -->
      <div class="rank-circle-container">
        <!-- 外环：符文旋转环 -->
        <div class="rank-ring outer-ring"></div>
        <!-- 中环：虚线逆旋环 -->
        <div class="rank-ring middle-ring"></div>
        <!-- 内环：等级数值展示 -->
        <div class="rank-core">
          <div class="rank-core-glow"></div>
          <span class="rank-value">{{ displayRank }}</span>
        </div>
      </div>

      <!-- 文字区域 -->
      <div class="rank-text-wrap">
        <p class="rank-label">— 等级提升 —</p>
        <h1 class="rank-name">{{ displayRankName }}</h1>
        <div class="rank-divider">
          <span class="divider-line"></span>
          <span class="divider-gem">◆</span>
          <span class="divider-line"></span>
        </div>
        <p class="rank-desc">冒险者的力量得到了升华</p>

        <transition name="hint-fade">
          <div v-if="isInteractive" class="action-hint">点击任意处继续冒险</div>
        </transition>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref, computed, nextTick } from "vue";
import gsap from "gsap";
import confetti from "canvas-confetti";
import type { RankInfo } from "../composables/useRankUp";

const props = defineProps<{
  rankInfo: RankInfo | null;
}>();

const emit = defineEmits<{
  (event: "close"): void;
}>();

const visible = ref(false);
const isInteractive = ref(false);

const displayRank = computed(() => props.rankInfo?.rank || "");
const displayRankName = computed(() => props.rankInfo?.rankName || "");

/**
 * 为每个粒子生成随机样式
 */
const particleStyle = (_index: number) => {
  const left = Math.random() * 100;
  const size = 2 + Math.random() * 3;
  const delay = Math.random() * 6;
  const duration = 4 + Math.random() * 5;
  const hue = 32 + Math.random() * 18; // 收窄到琥珀色温
  return {
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    animationDuration: `${duration}s`,
    backgroundColor: `hsl(${hue}, 62%, 56%)`,
  };
};

const startEffect = () => {
  visible.value = true;
  isInteractive.value = false;

  if (window.navigator?.vibrate) {
    window.navigator.vibrate([100, 50, 200]);
  }

  nextTick(() => {
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(() => {
          isInteractive.value = true;
        }, 800);
      },
    });

    // 魔法阵入场：缩放 + 旋转
    tl.fromTo(
      ".rank-circle-container",
      { scale: 0, opacity: 0, rotate: -120 },
      { scale: 1, opacity: 1, rotate: 0, duration: 1.2, ease: "back.out(1.7)" },
    );

    // 等级数值弹出
    tl.fromTo(
      ".rank-value",
      { scale: 0, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" },
      "-=0.4",
    );

    // 文字区域上浮入场
    tl.fromTo(
      ".rank-text-wrap",
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out" },
      "-=0.3",
    );

    // 等级名称强调
    tl.fromTo(
      ".rank-name",
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.5, ease: "back.out(2)" },
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
  const end = Date.now() + 4000;
  const colors = ["#d9a441", "#ece6d8", "#5fae7f"];

  (function frame() {
    if (!visible.value) return;

    confetti({
      particleCount: 4,
      angle: 60,
      spread: 65,
      origin: { x: 0, y: 0.6 },
      colors,
    });
    confetti({
      particleCount: 4,
      angle: 120,
      spread: 65,
      origin: { x: 1, y: 0.6 },
      colors,
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

.rank-up-overlay {
  position: fixed;
  inset: 0;
  z-index: $z-top;
  background: radial-gradient(
    ellipse at center,
    rgba(28, 24, 19, 0.96) 0%,
    $ink-900 100%
  );
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  backdrop-filter: blur(15vpx);
  -webkit-backdrop-filter: blur(15vpx);

  &.can-close {
    cursor: pointer;
  }
}

// 极光背景（收掉紫，单一暖调）
.rank-divine-light {
  position: absolute;
  width: 200%;
  height: 200%;
  background: conic-gradient(
    from 0deg at 50% 50%,
    transparent 0deg,
    rgba(217, 164, 65, 0.06) 60deg,
    transparent 120deg,
    rgba(217, 164, 65, 0.04) 200deg,
    transparent 280deg,
    rgba(217, 164, 65, 0.05) 340deg,
    transparent 360deg
  );
  animation: rankRotateLight 18s linear infinite;
  mix-blend-mode: screen;
  -webkit-mix-blend-mode: screen;
}

// 上浮粒子
.rank-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: hidden;

  .particle {
    position: absolute;
    bottom: -10%;
    border-radius: 50%;
    opacity: 0;
    animation: rankFloatUp linear infinite;
    box-shadow: 0 0 5px 1px currentColor;
  }
}

// 核心魔法阵（双圈精简）
.rank-circle-container {
  position: relative;
  width: 200vpx;
  height: 200vpx;
  display: flex;
  align-items: center;
  justify-content: center;

  .rank-ring {
    position: absolute;
    border-radius: 50%;

    &.outer-ring {
      width: 100%;
      height: 100%;
      border: 1.5vpx solid rgba(217, 164, 65, 0.45);
      box-shadow:
        0 0 20vpx rgba(217, 164, 65, 0.16),
        inset 0 0 20vpx rgba(217, 164, 65, 0.08);
      animation: rankRotateCW 25s linear infinite;

      // 单层符文刻度（去掉双圈）
      &::before {
        content: "";
        position: absolute;
        inset: -5vpx;
        border-radius: 50%;
        border: 2vpx dashed rgba(217, 164, 65, 0.2);
        animation: rankRotateCCW 16s linear infinite;
      }
    }

    &.middle-ring {
      width: 75%;
      height: 75%;
      border: 1vpx solid rgba(236, 230, 216, 0.14);
      box-shadow: inset 0 0 15vpx rgba(217, 164, 65, 0.08);
      animation: rankRotateCCW 18s linear infinite;
    }
  }

  .rank-core {
    position: relative;
    width: 45%;
    height: 45%;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2;

    .rank-core-glow {
      position: absolute;
      width: 120%;
      height: 120%;
      background: radial-gradient(circle, rgba(217, 164, 65, 0.55) 0%, transparent 70%);
      filter: blur(15vpx);
      border-radius: 50%;
      animation: rankPulse 2.2s ease-in-out infinite;
    }

    .rank-value {
      position: relative;
      z-index: 3;
      font-family: $font-display;
      font-size: 36vpx;
      font-weight: 700;
      color: $text;
      text-shadow:
        0 0 20vpx rgba(217, 164, 65, 0.7),
        0 0 40vpx rgba(217, 164, 65, 0.35);
      letter-spacing: 2vpx;
    }
  }
}

// 文字区域
.rank-text-wrap {
  position: relative;
  z-index: 10;
  text-align: center;
  margin-top: 36vpx;
  padding: 0 24vpx;

  .rank-label {
    font-family: $font-display;
    font-size: 12vpx;
    color: $text-faint;
    letter-spacing: 4vpx;
    text-transform: uppercase;
    margin: 0 0 12vpx;
  }

  // 实色 + 单层 drop-shadow，去掉 gradient-clip shimmer
  .rank-name {
    font-family: $font-display;
    font-size: 32vpx;
    font-weight: 700;
    margin: 0;
    color: $text;
    letter-spacing: 3vpx;
    filter: drop-shadow(0 2vpx 12vpx rgba(217, 164, 65, 0.45));
  }

  .rank-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8vpx;
    margin: 16vpx 0;

    .divider-line {
      width: 40vpx;
      height: 1vpx;
      background: linear-gradient(to right, transparent, rgba(217, 164, 65, 0.4), transparent);
    }

    .divider-gem {
      font-size: 10vpx;
      color: $ember;
      animation: rankPulse 2.2s ease-in-out infinite;
    }
  }

  .rank-desc {
    font-size: 14vpx;
    color: $text-mute;
    letter-spacing: 2vpx;
    margin: 0;
  }

  .action-hint {
    margin-top: 36vpx;
    font-family: $font-display;
    font-size: 12vpx;
    color: $ember;
    opacity: 0.5;
    animation: rankBreathe 2.4s infinite;
    text-transform: uppercase;
    letter-spacing: 2vpx;
  }
}

// ─── 动画 Keyframes ───

@keyframes rankRotateCW {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes rankRotateCCW {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

@keyframes rankRotateLight {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes rankPulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.5;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.9;
  }
}

@keyframes rankBreathe {
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

@keyframes rankFloatUp {
  0% {
    transform: translateY(0) scale(0);
    opacity: 0;
  }
  10% {
    opacity: 0.8;
    transform: translateY(0) scale(1);
  }
  90% {
    opacity: 0.3;
  }
  100% {
    transform: translateY(-110vh) scale(0.5);
    opacity: 0;
  }
}

// ─── 过渡动画 ───

.rank-up-fade-enter-active,
.rank-up-fade-leave-active {
  transition: opacity 0.8s;
}
.rank-up-fade-enter-from,
.rank-up-fade-leave-to {
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
