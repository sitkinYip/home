<template>
  <div class="magic-letter-container">
    <!-- 背景层（高斯模糊） -->
    <div class="blur-backdrop"></div>

    <!-- 魔法粒子层 -->
    <div class="stardust-layer">
      <div
        v-for="i in 35"
        :key="'star-' + i"
        class="stardust"
        :style="{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 5}s`,
          animationDuration: `${3 + Math.random() * 3}s`,
          '--size': `${2 + Math.random() * 3}px`,
        }"
      ></div>
    </div>

    <!-- ============ 信封 ============ -->
    <div
      class="envelope-scene"
      :class="{
        'envelope-opening': isEnvelopeOpening,
        'envelope-opened': isEnvelopeOpened,
      }"
    >
      <div class="envelope" @click="startOpen">
        <!-- 信封主体 -->
        <div class="envelope-body">
          <!-- 信封背面 -->
          <div class="envelope-back"></div>

          <!-- 信封内侧（信纸从这里飞出） -->
          <div class="envelope-inner"></div>

          <!-- 信封盖子顶部 -->
          <div class="envelope-flap-top">
            <div class="flap-shadow"></div>
          </div>

          <!-- 信封正面底部 -->
          <div class="envelope-front">
            <!-- 收信地址 -->
            <div class="recipient-info">
              <p class="recipient-name">{{ title }}</p>
              <p class="recipient-addr">{{ desc }}</p>
            </div>
          </div>

          <!-- 封蜡印章 -->
          <div class="wax-seal" :class="{ 'seal-pop': isSealPopping }">
            <div class="seal-glow"></div>
            <div class="seal-body">
              <span class="seal-h">H</span>
            </div>
          </div>
        </div>

        <!-- 提示文字 -->
        <p class="tap-hint" v-if="!isEnvelopeOpening">
          <span>{{ hintText }}</span>
        </p>
      </div>
    </div>

    <!-- ============ 飞出的信纸 ============ -->
    <div
      class="letter-scene"
      :class="{
        'letter-flying': isLetterFlying,
        'letter-arrived': isLetterArrived,
      }"
    >
      <div class="letter-parchment">
        <!-- 羊皮纸纹理 -->
        <div class="parchment-texture"></div>

        <!-- 装饰边框 -->
        <div class="parchment-border">
          <div class="corner tl"></div>
          <div class="corner tr"></div>
          <div class="corner bl"></div>
          <div class="corner br"></div>
        </div>

        <!-- 魔法装饰符文 -->
        <div class="rune rune-top">❧</div>
        <div class="rune rune-bottom">❧</div>

        <!-- 背景轮播 -->
        <div class="letter-bg-carousel" v-if="images && images.length > 0">
          <transition-group name="fade">
            <div
              v-for="(img, index) in images"
              :key="img"
              v-show="currentImgIndex === index"
              class="letter-bg-img"
              :style="{ backgroundImage: `url(${img})` }"
            ></div>
          </transition-group>
        </div>

        <!-- 内容滚动区 -->
        <div class="letter-scroll" ref="scrollContainer" @touchstart="onUserTouch">
          <div class="letter-content">
            <!-- 装饰头部 -->
            <div class="content-header">
              <span class="header-deco">✦ ✦ ✦</span>
            </div>

            <!-- 段落 -->
            <div
              v-for="(p, index) in displayedParagraphs"
              :key="index"
              class="para"
              :style="{ textAlign: p.align }"
            >
              <p class="para-text">
                {{ p.currentText }}
                <span class="quill" v-if="isTyping && activeParagraphIndex === index">✒</span>
              </p>
            </div>

            <!-- 底部 -->
            <div class="content-footer"></div>
          </div>
        </div>

        <!-- 边缘做旧效果 -->
        <div class="aged-edges"></div>
      </div>
    </div>

    <!-- 魔法火花（开信时） -->
    <div v-if="showSparks" class="magic-sparks">
      <div v-for="i in 16" :key="'sp-' + i" class="spark-dot"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from "vue";

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
  title?: string;
  desc?: string;
}

const props = withDefaults(defineProps<Props>(), {
  paragraphs: () => [],
  speed: 80,
  images: () => [],
  carouselInterval: 5000,
  hintText: "轻触封蜡开启信件",
  title: "Mr./Ms. Recipient",
  desc: "The Magical World",
});

const emit = defineEmits(["open"]);

// 动画阶段状态
const isEnvelopeOpening = ref(false); // 信封正在打开
const isEnvelopeOpened = ref(false); // 信封已完全打开并消失
const isSealPopping = ref(false); // 封蜡弹开
const isLetterFlying = ref(false); // 信纸正在飞出
const isLetterArrived = ref(false); // 信纸到达最终位置
const showSparks = ref(false); // 显示魔法火花

// 内容状态
const displayedParagraphs = ref<DisplayedParagraph[]>([]);
const isTyping = ref(false);
const activeParagraphIndex = ref(0);
const currentImgIndex = ref(0);
const scrollContainer = ref<HTMLDivElement | null>(null);

let carouselTimer: ReturnType<typeof setInterval> | null = null;
let isUserInteracting = false;

declare global {
  interface Window {
    scrollResetTimer?: ReturnType<typeof setTimeout>;
  }
}

const audioPlayer = new Audio();

const playAudioSync = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    // 先注册事件，再触发播放，防止短音频在注册前就结束
    audioPlayer.onended = () => resolve();
    audioPlayer.onerror = () => resolve();
    audioPlayer.src = url;
    audioPlayer.load();
    audioPlayer.play().catch(() => resolve());
  });
};

watch(
  displayedParagraphs,
  () => {
    if (!isTyping.value || isUserInteracting) return;
    nextTick(() => {
      const el = scrollContainer.value;
      if (el) {
        const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 80;
        if (atBottom) {
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
        }
      }
    });
  },
  { deep: true },
);

const onUserTouch = () => {
  if (isTyping.value) {
    isUserInteracting = true;
    if (window?.scrollResetTimer) clearTimeout(window.scrollResetTimer);
    window.scrollResetTimer = setTimeout(() => {
      isUserInteracting = false;
    }, 3000);
  }
};

const lockBodyScroll = () => {
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
};

const unlockBodyScroll = () => {
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
};

const typeText = async () => {
  isTyping.value = true;

  for (let i = 0; i < (props.paragraphs?.length || 0); i++) {
    activeParagraphIndex.value = i;
    const config = props.paragraphs![i];

    displayedParagraphs.value.push({
      currentText: "",
      align: config.align || "left",
    });

    if (config.delay) {
      await new Promise((r) => setTimeout(r, config.delay));
    }

    const text = config.content || "";
    let audioPromise: Promise<void> | null = null;
    if (config.audio) {
      audioPromise = playAudioSync(config.audio);
    }

    for (const char of text) {
      // 将普通空格替换为不间断空格，防止 HTML 折叠连续空格
      displayedParagraphs.value[i].currentText += char === " " ? "\u00a0" : char;
      await new Promise((r) => setTimeout(r, props.speed));
    }

    if (audioPromise) await audioPromise;
    await new Promise((r) => setTimeout(r, 250));
  }

  isTyping.value = false;
};

/**
 * 开启信件的完整动画序列
 */
const startOpen = () => {
  if (isEnvelopeOpening.value) return;

  emit("open");
  // 解锁移动端音频限制：用第一个有 audio 的段落 URL（或静默 blob）正确解锁
  // 空 src 的 play() 会直接抛错，导致该 Audio 实例永远无法自动播放
  const firstAudioUrl =
    props.paragraphs?.find((p) => p.audio)?.audio ||
    "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
  audioPlayer.src = firstAudioUrl;
  audioPlayer.load();
  audioPlayer
    .play()
    .then(() => {
      audioPlayer.pause();
      audioPlayer.currentTime = 0;
    })
    .catch(() => {});
  lockBodyScroll();

  // 阶段1：封蜡弹开 + 魔法火花
  isSealPopping.value = true;
  showSparks.value = true;

  // 阶段2：信封盖子打开
  setTimeout(() => {
    isEnvelopeOpening.value = true;
  }, 300);

  // 阶段3：信纸开始飞出
  setTimeout(() => {
    isLetterFlying.value = true;
    showSparks.value = false;
  }, 800);

  // 阶段4：信封消失，信纸到达
  setTimeout(() => {
    isEnvelopeOpened.value = true;
    isLetterArrived.value = true;
  }, 1400);

  // 阶段5：开始打字
  setTimeout(() => {
    typeText();
    if (props.images && props.images.length > 1) {
      carouselTimer = setInterval(() => {
        currentImgIndex.value = (currentImgIndex.value + 1) % props.images!.length;
      }, props.carouselInterval);
    }
  }, 1800);
};

onUnmounted(() => {
  if (carouselTimer) clearInterval(carouselTimer);
  unlockBodyScroll();
  audioPlayer.pause();
  audioPlayer.src = "";
});
</script>

<style scoped>
/* =============================================
   哈利波特魔法信件 - 连贯开信动画版
   ============================================= */

@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600&family=Dancing+Script:wght@500;700&display=swap");

.magic-letter-container {
  --parchment: #f3e5c3;
  --parchment-dark: #d4b896;
  --ink: #1a0800;
  --seal-red: #8b0000;
  --gold: #ffd700;
  --gold-dim: #c9a227;

  position: fixed;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  overflow: hidden;
  background: linear-gradient(135deg, #0d0221 0%, #1a0a2e 40%, #0a0015 100%);
}

/* 高斯模糊背景层 */
.blur-backdrop {
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 30% 20%, rgba(138, 43, 226, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 70% 70%, rgba(139, 0, 0, 0.1) 0%, transparent 40%);
  backdrop-filter: blur(2px);
  z-index: 0;
}

/* 星尘粒子 */
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
    0 0 6px var(--gold),
    0 0 12px rgba(255, 215, 0, 0.6);
  animation: dust-float 4s ease-in-out infinite;
  opacity: 0;
}

@keyframes dust-float {
  0%,
  100% {
    opacity: 0;
    transform: translateY(0) scale(0.5);
  }
  30% {
    opacity: 0.9;
  }
  50% {
    opacity: 0.7;
    transform: translateY(-30px) scale(1);
  }
  70% {
    opacity: 0.9;
  }
}

/* =============================================
   信封场景
   ============================================= */
.envelope-scene {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  z-index: 10;
  transition: all 0.6s ease;
}

.envelope-scene.envelope-opened {
  opacity: 0;
  transform: scale(0.8) translateY(50px);
  pointer-events: none;
}

.envelope {
  position: relative;
  cursor: pointer;
}

.envelope-body {
  position: relative;
  width: min(300px, 80vw);
  height: min(190px, 50vw);
  animation: envelope-float 3.5s ease-in-out infinite;
}

.envelope-scene.envelope-opening .envelope-body {
  animation: none;
}

@keyframes envelope-float {
  0%,
  100% {
    transform: translateY(0) rotate(-0.5deg);
  }
  50% {
    transform: translateY(-8px) rotate(0.5deg);
  }
}

/* 信封背面 */
.envelope-back {
  position: absolute;
  inset: 0;
  background: linear-gradient(150deg, #c9a86c 0%, #a8895c 60%, #8b7355 100%);
  border-radius: 4px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.4);
}

.envelope-back::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E");
  border-radius: 4px;
}

/* 信封内侧 */
.envelope-inner {
  position: absolute;
  top: 10%;
  left: 5%;
  right: 5%;
  height: 50%;
  background: #b89a6a;
  z-index: 1;
}

/* 信封盖子（三角形） */
.envelope-flap-top {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 55%;
  transform-origin: top center;
  transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;
}

.envelope-flap-top::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  border-left: calc(min(300px, 80vw) / 2) solid transparent;
  border-right: calc(min(300px, 80vw) / 2) solid transparent;
  border-top: calc(min(190px, 50vw) * 0.5) solid #b8956f;
}

.flap-shadow {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  border-left: calc(min(300px, 80vw) / 2) solid transparent;
  border-right: calc(min(300px, 80vw) / 2) solid transparent;
  border-top: calc(min(190px, 50vw) * 0.5) solid rgba(0, 0, 0, 0.1);
}

.envelope-scene.envelope-opening .envelope-flap-top {
  transform: rotateX(-170deg);
}

/* 信封正面 */
.envelope-front {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 55%;
  background: linear-gradient(180deg, #d4ad6a 0%, #c49a52 100%);
  border-radius: 0 0 4px 4px;
  z-index: 4;
  display: flex;
  justify-content: center;
  align-items: center;
}

.recipient-info {
  text-align: center;
  font-family: "Dancing Script", cursive;
  color: var(--ink);
  margin-top: 10px;
}

.recipient-name {
  font-size: 16px;
  font-weight: 700;
  margin: 0 0 4px;
}

.recipient-addr {
  font-size: 12px;
  margin: 0;
  opacity: 0.7;
}

/* 封蜡印章 */
.wax-seal {
  position: absolute;
  top: calc(min(190px, 50vw) * 0.5 - 24px);
  left: 50%;
  transform: translateX(-50%);
  width: 48px;
  height: 48px;
  z-index: 10;
  transition: transform 0.3s ease;
}

.wax-seal:hover {
  transform: translateX(-50%) scale(1.08);
}

.seal-glow {
  position: absolute;
  inset: -10px;
  background: radial-gradient(circle, rgba(255, 215, 0, 0.35) 0%, transparent 60%);
  border-radius: 50%;
  animation: glow-pulse 2s ease-in-out infinite;
}

@keyframes glow-pulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.15);
  }
}

.seal-body {
  position: relative;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 35% 30%, #c41e3a 0%, var(--seal-red) 50%, #4a0000 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 3px 10px rgba(0, 0, 0, 0.5),
    inset 0 2px 4px rgba(255, 180, 120, 0.2),
    inset 0 -2px 5px rgba(0, 0, 0, 0.4);
  border: 2px solid #500000;
}

.seal-h {
  font-family: "Cinzel", serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--gold);
  text-shadow:
    0 0 8px var(--gold),
    1px 1px 2px rgba(0, 0, 0, 0.6);
}

/* 封蜡弹开 */
.wax-seal.seal-pop {
  animation: seal-pop 0.4s ease-out forwards;
}

@keyframes seal-pop {
  0% {
    transform: translateX(-50%) scale(1);
  }
  40% {
    transform: translateX(-50%) scale(1.3);
  }
  100% {
    transform: translateX(-50%) scale(0) rotate(180deg);
    opacity: 0;
  }
}

/* 提示文字 */
.tap-hint {
  margin-top: 30px;
  font-family: "Dancing Script", cursive;
  font-size: 15px;
  color: var(--gold);
  text-shadow: 0 0 12px var(--gold);
  animation: hint-glow 2s ease-in-out infinite;
  text-align: center;
}

@keyframes hint-glow {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

/* =============================================
   信纸场景
   ============================================= */
.letter-scene {
  position: absolute;
  z-index: 5;
  opacity: 0;
  transform: translateY(100px) scale(0.5) rotateX(30deg);
  transition: none;
  pointer-events: none;
}

.letter-scene.letter-flying {
  opacity: 1;
  transform: translateY(-20px) scale(0.9) rotateX(5deg);
  transition: all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.letter-scene.letter-arrived {
  opacity: 1;
  transform: translateY(0) scale(1) rotateX(0);
  transition: all 0.5s ease-out;
  pointer-events: auto;
}

.letter-parchment {
  position: relative;
  width: min(360px, 88vw);
  height: min(520px, 75vh);
  border-radius: 6px;
  overflow: hidden;
  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(255, 215, 0, 0.1);
}

/* 羊皮纸纹理 */
.parchment-texture {
  position: absolute;
  inset: 0;
  background: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.7' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.07'/%3E%3C/svg%3E"),
    radial-gradient(ellipse at 25% 15%, #faf3e0 0%, transparent 40%),
    radial-gradient(ellipse at 75% 85%, #e8d8b8 0%, transparent 40%),
    linear-gradient(180deg, #f5e8d0 0%, #ecdfc0 40%, #e0d0a8 100%);
  z-index: 0;
}

/* 装饰边框 */
.parchment-border {
  position: absolute;
  inset: 12px;
  border: 1px solid rgba(139, 105, 20, 0.25);
  pointer-events: none;
  z-index: 3;
}

.corner {
  position: absolute;
  width: 16px;
  height: 16px;
  border: 2px solid var(--gold-dim);
  opacity: 0.5;
}

.corner.tl {
  top: -2px;
  left: -2px;
  border-right: none;
  border-bottom: none;
}
.corner.tr {
  top: -2px;
  right: -2px;
  border-left: none;
  border-bottom: none;
}
.corner.bl {
  bottom: -2px;
  left: -2px;
  border-right: none;
  border-top: none;
}
.corner.br {
  bottom: -2px;
  right: -2px;
  border-left: none;
  border-top: none;
}

/* 符文装饰 */
.rune {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  color: var(--gold-dim);
  opacity: 0.5;
  z-index: 3;
}

.rune-top {
  top: 18px;
}
.rune-bottom {
  bottom: 18px;
  transform: translateX(-50%) rotate(180deg);
}

/* 背景轮播 */
.letter-bg-carousel {
  position: absolute;
  inset: 0;
  z-index: 1;
  opacity: 0.12;
  pointer-events: none;
}

.letter-bg-img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 1.5s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 内容滚动区 */
.letter-scroll {
  position: relative;
  width: 100%;
  height: 100%;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  z-index: 2;
  padding: 50px 24px 60px;
  box-sizing: border-box;
  /* 顶部和底部渐变遮罩，防止文字滚动时超出"装订线"边界 */
  mask-image: linear-gradient(
    to bottom,
    transparent 0px,
    black 48px,
    black calc(100% - 48px),
    transparent 100%
  );
  -webkit-mask-image: linear-gradient(
    to bottom,
    transparent 0px,
    black 48px,
    black calc(100% - 48px),
    transparent 100%
  );
}

.letter-scroll::-webkit-scrollbar {
  width: 4px;
}

.letter-scroll::-webkit-scrollbar-thumb {
  background: rgba(139, 105, 20, 0.25);
  border-radius: 2px;
}

.letter-content {
  max-width: 100%;
}

.content-header {
  text-align: center;
  margin-bottom: 24px;
  font-size: 14px;
  color: var(--gold-dim);
  opacity: 0.6;
  letter-spacing: 8px;
}

.para {
  margin-bottom: 6px;
}

.para-text {
  font-family: "Dancing Script", cursive;
  font-size: 19px;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.75;
  margin: 0;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.3);
}

.quill {
  display: inline-block;
  margin-left: 3px;
  animation: write 0.35s ease-in-out infinite;
}

@keyframes write {
  0%,
  100% {
    transform: rotate(-6deg);
  }
  50% {
    transform: rotate(6deg) translateY(-2px);
  }
}

.content-footer {
  height: 50px;
}

/* 边缘做旧 */
.aged-edges {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
  box-shadow:
    inset 0 0 60px rgba(139, 105, 20, 0.15),
    inset 0 0 20px rgba(101, 67, 33, 0.1);
  border-radius: 6px;
}

/* =============================================
   魔法火花
   ============================================= */
.magic-sparks {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -60%);
  pointer-events: none;
  z-index: 20;
}

.spark-dot {
  position: absolute;
  width: 5px;
  height: 5px;
  background: var(--gold);
  border-radius: 50%;
  box-shadow:
    0 0 8px var(--gold),
    0 0 16px rgba(255, 215, 0, 0.7);
  animation: spark-burst 0.7s ease-out forwards;
}

.spark-dot:nth-child(1) {
  --a: 0deg;
}
.spark-dot:nth-child(2) {
  --a: 22.5deg;
}
.spark-dot:nth-child(3) {
  --a: 45deg;
}
.spark-dot:nth-child(4) {
  --a: 67.5deg;
}
.spark-dot:nth-child(5) {
  --a: 90deg;
}
.spark-dot:nth-child(6) {
  --a: 112.5deg;
}
.spark-dot:nth-child(7) {
  --a: 135deg;
}
.spark-dot:nth-child(8) {
  --a: 157.5deg;
}
.spark-dot:nth-child(9) {
  --a: 180deg;
}
.spark-dot:nth-child(10) {
  --a: 202.5deg;
}
.spark-dot:nth-child(11) {
  --a: 225deg;
}
.spark-dot:nth-child(12) {
  --a: 247.5deg;
}
.spark-dot:nth-child(13) {
  --a: 270deg;
}
.spark-dot:nth-child(14) {
  --a: 292.5deg;
}
.spark-dot:nth-child(15) {
  --a: 315deg;
}
.spark-dot:nth-child(16) {
  --a: 337.5deg;
}

@keyframes spark-burst {
  0% {
    transform: rotate(var(--a)) translateY(0);
    opacity: 1;
  }
  100% {
    transform: rotate(var(--a)) translateY(80px);
    opacity: 0;
  }
}

/* =============================================
   移动端适配
   ============================================= */
@media (max-width: 480px) {
  .envelope-body {
    width: 85vw;
    height: 54vw;
  }

  .wax-seal {
    width: 42px;
    height: 42px;
    top: calc(54vw * 0.5 - 21px);
  }

  .seal-h {
    font-size: 18px;
  }

  .recipient-name {
    font-size: 14px;
  }

  .letter-parchment {
    width: 92vw;
    height: 72vh;
  }

  .para-text {
    font-size: 17px;
  }

  .letter-scroll {
    padding: 40px 18px 50px;
  }
}

@media (max-width: 360px) {
  .para-text {
    font-size: 15px;
  }
}

/* iOS 安全区 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .letter-scroll {
    padding-bottom: calc(60px + env(safe-area-inset-bottom));
  }
}
</style>
