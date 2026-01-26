<template>
  <div class="magic-letter-container" :class="{ 'letter-opened': isOpen }">
    <!-- 魔法粒子层 - 金色星尘 -->
    <div class="stardust-layer">
      <div
        v-for="i in 40"
        :key="'star-' + i"
        class="stardust"
        :style="{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 6}s`,
          animationDuration: `${4 + Math.random() * 4}s`,
          '--size': `${2 + Math.random() * 4}px`,
        }"
      ></div>
    </div>

    <!-- 神秘光晕效果 -->
    <div class="mystic-glow"></div>

    <!-- ============ 信封状态 ============ -->
    <div v-if="!isOpen" class="envelope-stage" @click="openLetter">
      <!-- 漂浮的信封 -->
      <div class="hogwarts-envelope">
        <!-- 信封主体 -->
        <div class="envelope-body">
          <!-- 顶部三角封口 -->
          <div class="envelope-flap"></div>

          <!-- 封蜡印章 -->
          <div class="wax-seal" :class="{ breaking: isSealBreaking }">
            <div class="seal-shine"></div>
            <div class="seal-emblem">
              <span class="emblem-h">H</span>
            </div>
            <!-- 印章碎裂火花 -->
            <div v-if="isSealBreaking" class="seal-sparks">
              <div v-for="i in 12" :key="'spark-' + i" class="spark"></div>
            </div>
          </div>

          <!-- 收信人地址（羽毛笔手写风格） -->
          <div class="recipient-address">
            <p class="address-main">To: The Chosen One</p>
            <p class="address-sub">A Mysterious Place</p>
            <p class="address-sub">Somewhere Magical</p>
          </div>
        </div>

        <!-- 信封悬浮光效 -->
        <div class="envelope-glow"></div>
      </div>

      <!-- 开启提示 -->
      <p class="open-hint">
        <span class="hint-magic">{{ hintText }}</span>
      </p>
    </div>

    <!-- ============ 羊皮纸信件状态（全屏） ============ -->
    <transition name="parchment-reveal">
      <div v-if="isOpen" class="parchment-fullscreen">
        <!-- 羊皮纸边缘装饰 -->
        <div class="parchment-edges">
          <div class="edge-top"></div>
          <div class="edge-bottom"></div>
          <div class="edge-left"></div>
          <div class="edge-right"></div>
        </div>

        <!-- 四角魔法符文 -->
        <div class="corner-rune top-left">✦</div>
        <div class="corner-rune top-right">✦</div>
        <div class="corner-rune bottom-left">✦</div>
        <div class="corner-rune bottom-right">✦</div>

        <!-- 背景轮播图 -->
        <div class="parchment-bg-layer" v-if="images && images.length > 0">
          <transition-group name="fade">
            <div
              v-for="(img, index) in images"
              :key="img"
              v-show="currentImgIndex === index"
              class="parchment-bg-img"
              :style="{ backgroundImage: `url(${img})` }"
            ></div>
          </transition-group>
        </div>

        <!-- 滚动内容区 -->
        <div class="parchment-content" ref="scrollContainer" @touchstart="onUserTouch">
          <div class="content-inner">
            <!-- 信件标题装饰 -->
            <div class="letter-header">
              <div class="header-flourish left">⚜</div>
              <div class="header-flourish right">⚜</div>
            </div>

            <!-- 段落渲染 -->
            <div
              v-for="(p, index) in displayedParagraphs"
              :key="index"
              class="magic-paragraph"
              :style="{ textAlign: p.align }"
            >
              <p class="magic-text">
                {{ p.currentText }}
                <!-- 魔法羽毛笔光标 -->
                <span class="quill-cursor" v-if="isTyping && activeParagraphIndex === index">
                  ✒️
                </span>
              </p>
            </div>

            <!-- 底部留白 -->
            <div class="content-footer"></div>
          </div>
        </div>

        <!-- 羊皮纸边缘烧焦/做旧效果 -->
        <div class="parchment-aged-overlay"></div>
      </div>
    </transition>

    <!-- 开信魔法爆发效果 -->
    <div v-if="showMagicBurst" class="magic-explosion">
      <div class="explosion-ring"></div>
      <div v-for="i in 24" :key="'exp-' + i" class="explosion-spark"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from "vue";

/**
 * 段落配置项接口
 */
interface ParagraphConfig {
  content: string;
  align?: "left" | "center" | "right";
  delay?: number;
  audio?: string;
}

interface DisplayedParagraph {
  currentText: string;
  align: "left" | "center" | "right";
}

interface Props {
  paragraphs?: ParagraphConfig[];
  speed?: number;
  images?: string[];
  carouselInterval?: number;
  hintText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  paragraphs: () => [],
  speed: 80,
  images: () => [],
  carouselInterval: 5000,
  hintText: "轻触封蜡，开启魔法信件",
});

const emit = defineEmits(["open"]);

// --- 响应式状态 ---
const isOpen = ref<boolean>(false);
const isSealBreaking = ref<boolean>(false);
const showMagicBurst = ref<boolean>(false);
const displayedParagraphs = ref<DisplayedParagraph[]>([]);
const isTyping = ref<boolean>(false);
const activeParagraphIndex = ref<number>(0);
const currentImgIndex = ref<number>(0);
const scrollContainer = ref<HTMLDivElement | null>(null);

let carouselTimer: ReturnType<typeof setInterval> | null = null;
let isUserInteracting = false;

declare global {
  interface Window {
    scrollResetTimer?: ReturnType<typeof setTimeout>;
  }
}

const audioPlayer: HTMLAudioElement = new Audio();

const playAudioSync = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    audioPlayer.src = url;
    audioPlayer.play().catch((err) => {
      console.warn("音频播放失败:", err);
      resolve();
    });
    audioPlayer.onended = () => resolve();
    audioPlayer.onerror = () => resolve();
  });
};

watch(
  displayedParagraphs,
  () => {
    if (!isTyping.value || isUserInteracting) return;
    nextTick(() => {
      const el = scrollContainer.value;
      if (el) {
        const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 100;
        if (atBottom) {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }
      }
    });
  },
  { deep: true },
);

const onUserTouch = (): void => {
  if (isTyping.value) {
    isUserInteracting = true;
    if (window?.scrollResetTimer) clearTimeout(window.scrollResetTimer);
    window.scrollResetTimer = setTimeout(() => {
      isUserInteracting = false;
    }, 3000);
  }
};

const lockBodyScroll = (): void => {
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
};

const unlockBodyScroll = (): void => {
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
};

const typeText = async (): Promise<void> => {
  isTyping.value = true;

  for (let i = 0; i < (props.paragraphs?.length || 0); i++) {
    activeParagraphIndex.value = i;
    const config = props.paragraphs![i];

    displayedParagraphs.value.push({
      currentText: "",
      align: config.align || "left",
    });

    if (config.delay) {
      await new Promise((resolve) => setTimeout(resolve, config.delay));
    }

    const text = config.content || "";
    let audioPromise: Promise<void> | null = null;
    if (config.audio) {
      audioPromise = playAudioSync(config.audio);
    }

    for (const char of text) {
      displayedParagraphs.value[i].currentText += char;
      await new Promise((resolve) => setTimeout(resolve, props.speed));
    }

    if (audioPromise) await audioPromise;
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  isTyping.value = false;
};

const openLetter = (): void => {
  if (isOpen.value) return;

  emit("open");

  audioPlayer
    .play()
    .then(() => audioPlayer.pause())
    .catch(() => {});

  // 封蜡碎裂
  isSealBreaking.value = true;

  // 魔法爆发
  setTimeout(() => {
    showMagicBurst.value = true;
  }, 400);

  // 信封消失，羊皮纸出现
  setTimeout(() => {
    isOpen.value = true;
    lockBodyScroll();
    showMagicBurst.value = false;
  }, 1000);

  // 开始打字
  setTimeout(() => {
    typeText();
    if (props.images && props.images.length > 1) {
      carouselTimer = setInterval(() => {
        currentImgIndex.value = (currentImgIndex.value + 1) % props.images!.length;
      }, props.carouselInterval);
    }
  }, 1500);
};

onUnmounted(() => {
  if (carouselTimer) clearInterval(carouselTimer);
  unlockBodyScroll();
  audioPlayer.pause();
  audioPlayer.src = "";
});
</script>

<style scoped>
/* ========================================
   哈利波特魔法信件 - 极致魔法世界风格
   ======================================== */

@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Dancing+Script:wght@400;700&display=swap");

.magic-letter-container {
  --parchment-light: #f5e6c8;
  --parchment-mid: #e8d4a8;
  --parchment-dark: #c9a86c;
  --parchment-edge: #8b6914;
  --ink-color: #1a0a00;
  --seal-red: #8b0000;
  --seal-dark: #4a0000;
  --gold: #ffd700;
  --gold-dim: #b8860b;
  --magic-purple: #4a0080;
  --night-blue: #0a0020;

  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  overflow: hidden;

  /* 神秘夜空背景 */
  background: radial-gradient(ellipse 80% 50% at 50% 0%, rgba(74, 0, 128, 0.3) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 20% 80%, rgba(139, 0, 0, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse 60% 40% at 80% 80%, rgba(0, 50, 100, 0.15) 0%, transparent 50%),
    linear-gradient(180deg, #0d0221 0%, #0a0015 50%, #05000a 100%);
}

/* ========================================
   星尘粒子效果
   ======================================== */
.stardust-layer {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
}

.stardust {
  position: absolute;
  width: var(--size);
  height: var(--size);
  background: var(--gold);
  border-radius: 50%;
  box-shadow:
    0 0 calc(var(--size) * 2) var(--gold),
    0 0 calc(var(--size) * 4) rgba(255, 215, 0, 0.5);
  animation: stardust-float var(--duration, 5s) ease-in-out infinite;
  opacity: 0;
}

@keyframes stardust-float {
  0%,
  100% {
    opacity: 0;
    transform: translateY(0) scale(0.5);
  }
  20% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
    transform: translateY(-40px) scale(1);
  }
  80% {
    opacity: 1;
  }
}

/* 神秘光晕 */
.mystic-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 300px;
  height: 300px;
  transform: translate(-50%, -50%);
  background: radial-gradient(circle, rgba(255, 215, 0, 0.1) 0%, transparent 70%);
  animation: glow-pulse 4s ease-in-out infinite;
  pointer-events: none;
  z-index: 1;
}

@keyframes glow-pulse {
  0%,
  100% {
    transform: translate(-50%, -50%) scale(1);
    opacity: 0.5;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.3);
    opacity: 0.8;
  }
}

.letter-opened .mystic-glow {
  display: none;
}

/* ========================================
   信封阶段
   ======================================== */
.envelope-stage {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
  z-index: 10;
  cursor: pointer;
}

.hogwarts-envelope {
  position: relative;
  width: min(320px, 85vw);
  height: min(200px, 52vw);
  animation: envelope-hover 3s ease-in-out infinite;
}

@keyframes envelope-hover {
  0%,
  100% {
    transform: translateY(0) rotate(-0.5deg);
  }
  50% {
    transform: translateY(-12px) rotate(0.5deg);
  }
}

.envelope-body {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(160deg, #d4b896 0%, #c4a67a 40%, #a8895c 100%);
  border-radius: 3px;
  box-shadow:
    0 10px 40px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(139, 105, 20, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.2);
  overflow: hidden;
}

/* 纸张纹理 */
.envelope-body::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.06'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* 信封三角封口 */
.envelope-flap {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  border-left: calc(min(320px, 85vw) / 2) solid transparent;
  border-right: calc(min(320px, 85vw) / 2) solid transparent;
  border-top: calc(min(200px, 52vw) * 0.45) solid #b89a6a;
  z-index: 2;
}

.envelope-flap::after {
  content: "";
  position: absolute;
  top: calc(-1 * min(200px, 52vw) * 0.45);
  left: calc(-1 * min(320px, 85vw) / 2);
  width: 0;
  height: 0;
  border-left: calc(min(320px, 85vw) / 2) solid transparent;
  border-right: calc(min(320px, 85vw) / 2) solid transparent;
  border-top: calc(min(200px, 52vw) * 0.45) solid rgba(0, 0, 0, 0.1);
}

/* 封蜡印章 */
.wax-seal {
  position: absolute;
  top: calc(min(200px, 52vw) * 0.45 - 28px);
  left: 50%;
  transform: translateX(-50%);
  width: 56px;
  height: 56px;
  z-index: 5;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.wax-seal:hover {
  transform: translateX(-50%) scale(1.1);
}

.seal-shine {
  position: absolute;
  inset: -8px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.4) 0%, transparent 60%);
  border-radius: 50%;
  animation: shine-pulse 2s ease-in-out infinite;
}

@keyframes shine-pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.9;
    transform: scale(1.15);
  }
}

.seal-emblem {
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 30% 25%, #c41e3a 0%, transparent 40%),
    radial-gradient(circle at 70% 75%, #3a0000 0%, transparent 40%),
    linear-gradient(145deg, #a00020 0%, #6b0000 50%, #3a0000 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 4px 12px rgba(0, 0, 0, 0.6),
    inset 0 2px 4px rgba(255, 150, 100, 0.2),
    inset 0 -3px 6px rgba(0, 0, 0, 0.5),
    0 0 20px rgba(139, 0, 0, 0.4);
  border: 2px solid #500000;
}

.emblem-h {
  font-family: "Cinzel", serif;
  font-size: 26px;
  font-weight: 700;
  color: var(--gold);
  text-shadow:
    0 0 10px var(--gold),
    0 0 20px rgba(255, 215, 0, 0.5),
    1px 1px 2px rgba(0, 0, 0, 0.8);
}

/* 封蜡碎裂 */
.wax-seal.breaking .seal-emblem {
  animation: seal-shatter 0.6s ease-out forwards;
}

@keyframes seal-shatter {
  0% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

.seal-sparks {
  position: absolute;
  inset: 0;
  z-index: 10;
}

.spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 4px;
  height: 4px;
  background: var(--gold);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--gold);
  animation: spark-fly 0.8s ease-out forwards;
}

.spark:nth-child(1) {
  --spark-angle: 0deg;
}
.spark:nth-child(2) {
  --spark-angle: 30deg;
}
.spark:nth-child(3) {
  --spark-angle: 60deg;
}
.spark:nth-child(4) {
  --spark-angle: 90deg;
}
.spark:nth-child(5) {
  --spark-angle: 120deg;
}
.spark:nth-child(6) {
  --spark-angle: 150deg;
}
.spark:nth-child(7) {
  --spark-angle: 180deg;
}
.spark:nth-child(8) {
  --spark-angle: 210deg;
}
.spark:nth-child(9) {
  --spark-angle: 240deg;
}
.spark:nth-child(10) {
  --spark-angle: 270deg;
}
.spark:nth-child(11) {
  --spark-angle: 300deg;
}
.spark:nth-child(12) {
  --spark-angle: 330deg;
}

@keyframes spark-fly {
  0% {
    transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--spark-angle)) translateY(70px);
    opacity: 0;
  }
}

/* 收信人地址 */
.recipient-address {
  position: absolute;
  bottom: 20%;
  left: 50%;
  transform: translateX(-50%);
  text-align: center;
  font-family: "Dancing Script", cursive;
  color: var(--ink-color);
  z-index: 1;
}

.address-main {
  font-size: 18px;
  font-weight: 700;
  margin-bottom: 4px;
}

.address-sub {
  font-size: 13px;
  opacity: 0.7;
  margin: 2px 0;
}

/* 信封光效 */
.envelope-glow {
  position: absolute;
  inset: -20px;
  background: radial-gradient(ellipse at center, rgba(255, 215, 0, 0.15) 0%, transparent 60%);
  pointer-events: none;
  animation: envelope-glow-pulse 3s ease-in-out infinite;
}

@keyframes envelope-glow-pulse {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
  }
}

/* 开启提示 */
.open-hint {
  font-family: "Dancing Script", cursive;
  font-size: 16px;
  margin: 0;
}

.hint-magic {
  color: var(--gold);
  text-shadow:
    0 0 15px var(--gold),
    0 0 30px rgba(255, 215, 0, 0.5);
  animation: hint-shimmer 2s ease-in-out infinite;
}

@keyframes hint-shimmer {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* ========================================
   全屏羊皮纸信件
   ======================================== */
.parchment-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;

  /* 羊皮纸背景 */
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E"),
    radial-gradient(ellipse at 30% 20%, #f8ecd0 0%, transparent 50%),
    radial-gradient(ellipse at 70% 80%, #e8d4a8 0%, transparent 50%),
    linear-gradient(180deg, #f5e6c8 0%, #e8d4a8 30%, #dcc498 70%, #c9a86c 100%);

  box-shadow: inset 0 0 100px rgba(139, 105, 20, 0.2);
}

/* 羊皮纸边缘装饰（焦黄做旧） */
.parchment-edges {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}

.edge-top,
.edge-bottom,
.edge-left,
.edge-right {
  position: absolute;
  background: linear-gradient(to bottom, rgba(139, 105, 20, 0.4) 0%, transparent 100%);
}

.edge-top {
  top: 0;
  left: 0;
  right: 0;
  height: 30px;
  background: linear-gradient(to bottom, rgba(101, 67, 33, 0.5) 0%, transparent 100%);
}

.edge-bottom {
  bottom: 0;
  left: 0;
  right: 0;
  height: 40px;
  background: linear-gradient(to top, rgba(101, 67, 33, 0.6) 0%, transparent 100%);
}

.edge-left {
  top: 0;
  bottom: 0;
  left: 0;
  width: 20px;
  background: linear-gradient(to right, rgba(101, 67, 33, 0.4) 0%, transparent 100%);
}

.edge-right {
  top: 0;
  bottom: 0;
  right: 0;
  width: 20px;
  background: linear-gradient(to left, rgba(101, 67, 33, 0.4) 0%, transparent 100%);
}

/* 四角魔法符文 */
.corner-rune {
  position: absolute;
  font-size: 24px;
  color: var(--gold-dim);
  opacity: 0.6;
  text-shadow: 0 0 10px var(--gold);
  z-index: 5;
  animation: rune-glow 3s ease-in-out infinite;
}

.corner-rune.top-left {
  top: 15px;
  left: 15px;
}
.corner-rune.top-right {
  top: 15px;
  right: 15px;
}
.corner-rune.bottom-left {
  bottom: 15px;
  left: 15px;
}
.corner-rune.bottom-right {
  bottom: 15px;
  right: 15px;
}

@keyframes rune-glow {
  0%,
  100% {
    opacity: 0.4;
    text-shadow: 0 0 5px var(--gold);
  }
  50% {
    opacity: 0.8;
    text-shadow:
      0 0 15px var(--gold),
      0 0 25px rgba(255, 215, 0, 0.5);
  }
}

/* 背景轮播 */
.parchment-bg-layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.15;
  pointer-events: none;
}

.parchment-bg-img {
  position: absolute;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 2s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 滚动内容区 */
.parchment-content {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 50px 25px 80px;
  z-index: 2;
}

.parchment-content::-webkit-scrollbar {
  width: 6px;
}

.parchment-content::-webkit-scrollbar-track {
  background: rgba(139, 105, 20, 0.1);
}

.parchment-content::-webkit-scrollbar-thumb {
  background: rgba(139, 105, 20, 0.3);
  border-radius: 3px;
}

.content-inner {
  max-width: 600px;
  margin: 0 auto;
}

/* 信件标题装饰 */
.letter-header {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin-bottom: 30px;
  font-size: 20px;
  color: var(--gold-dim);
  opacity: 0.7;
}

.header-flourish {
  animation: flourish-shimmer 4s ease-in-out infinite;
}

.header-flourish.right {
  animation-delay: 2s;
}

@keyframes flourish-shimmer {
  0%,
  100% {
    opacity: 0.5;
  }
  50% {
    opacity: 1;
    text-shadow: 0 0 10px var(--gold);
  }
}

/* 魔法段落 */
.magic-paragraph {
  margin-bottom: 8px;
}

.magic-text {
  font-family: "Dancing Script", cursive;
  font-size: 20px;
  font-weight: 500;
  color: var(--ink-color);
  line-height: 1.8;
  margin: 0;
  text-shadow: 0 1px 1px rgba(139, 105, 20, 0.1);
}

/* 羽毛笔光标 */
.quill-cursor {
  display: inline-block;
  font-size: 18px;
  margin-left: 4px;
  animation: quill-write 0.4s ease-in-out infinite;
}

@keyframes quill-write {
  0%,
  100% {
    transform: rotate(-8deg) translateY(0);
  }
  50% {
    transform: rotate(8deg) translateY(-3px);
  }
}

.content-footer {
  height: 60px;
}

/* 羊皮纸做旧覆盖层 */
.parchment-aged-overlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  background: radial-gradient(ellipse at 10% 10%, rgba(139, 105, 20, 0.15) 0%, transparent 30%),
    radial-gradient(ellipse at 90% 90%, rgba(139, 105, 20, 0.15) 0%, transparent 30%),
    radial-gradient(ellipse at 90% 10%, rgba(101, 67, 33, 0.1) 0%, transparent 25%),
    radial-gradient(ellipse at 10% 90%, rgba(101, 67, 33, 0.1) 0%, transparent 25%);
}

/* 过渡动画 */
.parchment-reveal-enter-active {
  animation: parchment-unfold 0.8s ease-out;
}

@keyframes parchment-unfold {
  0% {
    opacity: 0;
    transform: scale(0.3) rotate(5deg);
    filter: brightness(2);
  }
  50% {
    filter: brightness(1.5);
  }
  100% {
    opacity: 1;
    transform: scale(1) rotate(0);
    filter: brightness(1);
  }
}

/* ========================================
   魔法爆发效果
   ======================================== */
.magic-explosion {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
  z-index: 200;
}

.explosion-ring {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 20px;
  height: 20px;
  border: 3px solid var(--gold);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  animation: ring-expand 0.8s ease-out forwards;
}

@keyframes ring-expand {
  0% {
    width: 20px;
    height: 20px;
    opacity: 1;
  }
  100% {
    width: 300px;
    height: 300px;
    opacity: 0;
  }
}

.explosion-spark {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 6px;
  height: 6px;
  background: var(--gold);
  border-radius: 50%;
  box-shadow:
    0 0 10px var(--gold),
    0 0 20px var(--gold);
  animation: explosion-fly 0.8s ease-out forwards;
}

.explosion-spark:nth-child(2) {
  --exp-angle: 0deg;
}
.explosion-spark:nth-child(3) {
  --exp-angle: 15deg;
}
.explosion-spark:nth-child(4) {
  --exp-angle: 30deg;
}
.explosion-spark:nth-child(5) {
  --exp-angle: 45deg;
}
.explosion-spark:nth-child(6) {
  --exp-angle: 60deg;
}
.explosion-spark:nth-child(7) {
  --exp-angle: 75deg;
}
.explosion-spark:nth-child(8) {
  --exp-angle: 90deg;
}
.explosion-spark:nth-child(9) {
  --exp-angle: 105deg;
}
.explosion-spark:nth-child(10) {
  --exp-angle: 120deg;
}
.explosion-spark:nth-child(11) {
  --exp-angle: 135deg;
}
.explosion-spark:nth-child(12) {
  --exp-angle: 150deg;
}
.explosion-spark:nth-child(13) {
  --exp-angle: 165deg;
}
.explosion-spark:nth-child(14) {
  --exp-angle: 180deg;
}
.explosion-spark:nth-child(15) {
  --exp-angle: 195deg;
}
.explosion-spark:nth-child(16) {
  --exp-angle: 210deg;
}
.explosion-spark:nth-child(17) {
  --exp-angle: 225deg;
}
.explosion-spark:nth-child(18) {
  --exp-angle: 240deg;
}
.explosion-spark:nth-child(19) {
  --exp-angle: 255deg;
}
.explosion-spark:nth-child(20) {
  --exp-angle: 270deg;
}
.explosion-spark:nth-child(21) {
  --exp-angle: 285deg;
}
.explosion-spark:nth-child(22) {
  --exp-angle: 300deg;
}
.explosion-spark:nth-child(23) {
  --exp-angle: 315deg;
}
.explosion-spark:nth-child(24) {
  --exp-angle: 330deg;
}
.explosion-spark:nth-child(25) {
  --exp-angle: 345deg;
}

@keyframes explosion-fly {
  0% {
    transform: translate(-50%, -50%) rotate(var(--exp-angle)) translateY(0);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -50%) rotate(var(--exp-angle)) translateY(120px);
    opacity: 0;
  }
}

/* ========================================
   移动端适配
   ======================================== */
@media (max-width: 480px) {
  .hogwarts-envelope {
    width: 88vw;
    height: 55vw;
  }

  .wax-seal {
    width: 48px;
    height: 48px;
    top: calc(55vw * 0.45 - 24px);
  }

  .emblem-h {
    font-size: 22px;
  }

  .address-main {
    font-size: 16px;
  }

  .address-sub {
    font-size: 11px;
  }

  .parchment-content {
    padding: 40px 20px 70px;
  }

  .magic-text {
    font-size: 18px;
    line-height: 1.7;
  }

  .corner-rune {
    font-size: 18px;
  }

  .letter-header {
    margin-bottom: 20px;
  }
}

@media (max-width: 360px) {
  .magic-text {
    font-size: 16px;
  }

  .parchment-content {
    padding: 35px 15px 60px;
  }
}

/* iOS 安全区适配 */
@supports (padding-top: env(safe-area-inset-top)) {
  .parchment-content {
    padding-top: calc(50px + env(safe-area-inset-top));
    padding-bottom: calc(80px + env(safe-area-inset-bottom));
  }
}
</style>
