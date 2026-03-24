<template>
  <div class="magic-letter-container" :class="{ 'is-closing': isClosing }" @click="handleClose">
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
          '--size': `${toVpx(2 + Math.random() * 3)}`,
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
              <span class="seal-text">{{ sealText }}</span>
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
      @click.stop
    >
      <div class="letter-parchment">
        <!-- 边缘做旧效果及顶部底部遮罩作为纸张的自身属性移入 page-sheet，如果放外边将不会飞舞 -->
        <!-- 如果某些属性纯静态（或者遮罩需要留在最外边）可以选择保留。这里让整张纸飞舞 -->
        <!-- 翻页内容区 -->
        <div class="page-flip-container" ref="pageFlipContainer">
          <div
            v-for="(page, pageIdx) in pages"
            :key="pageIdx"
            class="page-sheet"
            :class="{
              'page-active': pageIdx === currentPage,
              'page-prev': pageIdx < currentPage,
              'page-next': pageIdx > currentPage,
              'page-flip-forward': isFlipping && flipDirection === 'forward' && pageIdx === currentPage - 1,
              'page-flip-backward': isFlipping && flipDirection === 'backward' && pageIdx === currentPage,
              'page-enter-forward': isFlipping && flipDirection === 'forward' && pageIdx === currentPage,
              'page-enter-backward': isFlipping && flipDirection === 'backward' && pageIdx === currentPage - 1,
            }"
          >
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

            <div class="letter-scroll-page">
              <div class="letter-content">
                <div class="content-header" v-if="pageIdx === 0">
                  <span class="header-deco">✦ ✦ ✦</span>
                </div>
                <div
                  v-for="(p, pIdx) in page.paragraphs"
                  :key="pIdx"
                  class="para"
                  :style="{ textAlign: p.align }"
                >
                  <p class="para-text">
                    {{ p.currentText }}
                    <span class="quill" v-if="isTyping && pageIdx === currentPage && pIdx === page.paragraphs.length - 1">✒</span>
                  </p>
                </div>
              </div>
            </div>
            <!-- 顶部遮罩 -->
            <div class="scroll-fade-top" aria-hidden="true"></div>
            <!-- 底部遮罩 -->
            <div class="scroll-fade-bottom" aria-hidden="true"></div>

            <!-- 边缘做旧效果 -->
            <div class="aged-edges"></div>
          </div>

          <!-- 隐藏的溢出检测容器 -->
          <div class="overflow-measure" ref="overflowMeasure">
            <div class="letter-scroll-page">
              <div class="letter-content">
                <div class="content-header" v-if="currentPage === 0">
                  <span class="header-deco">✦ ✦ ✦</span>
                </div>
                <div
                  v-for="(p, pIdx) in currentPageParagraphs"
                  :key="'m-' + pIdx"
                  class="para"
                  :style="{ textAlign: p.align }"
                >
                  <p class="para-text">{{ p.currentText }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 页码指示器 -->
        <div class="page-indicator" v-if="isLetterArrived && pages.length > 1">
          <span class="page-num">{{ currentPage + 1 }} / {{ pages.length }}</span>
        </div>

        <!-- 翻页按钮 -->
        <div class="page-nav" v-if="isFinished && isLetterArrived && pages.length > 1" @click.stop>
          <button
            class="page-btn page-btn-prev"
            :class="{ 'page-btn-disabled': currentPage === 0 }"
            @click="flipToPrev"
          >‹</button>
          <button
            class="page-btn page-btn-next"
            :class="{ 'page-btn-disabled': currentPage === pages.length - 1 }"
            @click="flipToNext"
          >›</button>
        </div>
      </div>
    </div>

    <!-- 魔法火花（开信时） -->
    <div v-if="showSparks" class="magic-sparks">
      <div v-for="i in 16" :key="'sp-' + i" class="spark-dot"></div>
    </div>

    <!-- 完成后底部收起提示 -->
    <div v-if="isFinished && isLetterArrived && !isClosing" class="dismiss-hint">
      轻触信件外收起
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onUnmounted } from "vue";
import { usePageFlip } from "@/hooks/usePageFlip";
import { toVpx } from "@/utils/toVpx";

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

interface PageData {
  paragraphs: DisplayedParagraph[];
}

interface Props {
  paragraphs?: ParagraphConfig[];
  speed?: number;
  images?: string[];
  carouselInterval?: number;
  hintText?: string;
  title?: string;
  desc?: string;
  sealText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  paragraphs: () => [],
  speed: 80,
  images: () => [],
  carouselInterval: 5000,
  hintText: "轻触封蜡开启信件",
  title: "Mr./Ms. Recipient",
  desc: "The Magical World",
  sealText: "✦",
});

const emit = defineEmits(["open", "finish", "close"]);

// --- 翻页状态 ---
const {
  currentPage,
  totalPages,
  isFlipping,
  flipDirection,
  flipForward,
  flipBackward,
  resetPages,
  enableSwipe,
  setSwipeEnabled,
} = usePageFlip();

// 动画阶段状态
const isEnvelopeOpening = ref(false);
const isEnvelopeOpened = ref(false);
const isSealPopping = ref(false);
const isLetterFlying = ref(false);
const isLetterArrived = ref(false);
const showSparks = ref(false);

const isFinished = ref(false);
const isClosing = ref(false);

// 分页数据
const pages = reactive<PageData[]>([{ paragraphs: [] }]);
const isTyping = ref(false);
const currentImgIndex = ref(0);
const overflowMeasure = ref<HTMLDivElement | null>(null);
const pageFlipContainer = ref<HTMLDivElement | null>(null);

let carouselTimer: ReturnType<typeof setInterval> | null = null;

const audioPlayer = new Audio();

const playAudioSync = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    audioPlayer.onended = () => resolve();
    audioPlayer.onerror = () => resolve();
    audioPlayer.src = url;
    audioPlayer.load();
    audioPlayer.play().catch(() => resolve());
  });
};

const getAudioDuration = (url: string): Promise<number> =>
  new Promise((resolve) => {
    const tmp = new Audio();
    tmp.preload = "metadata";
    let settled = false;
    const settle = (value: number) => {
      if (settled) return;
      settled = true;
      tmp.onloadedmetadata = null;
      tmp.onerror = null;
      resolve(value);
    };
    const timer = setTimeout(() => settle(0), 3000);
    tmp.onloadedmetadata = () => {
      clearTimeout(timer);
      settle(tmp.duration || 0);
    };
    tmp.onerror = () => {
      clearTimeout(timer);
      settle(0);
    };
    tmp.src = url;
  });

const currentPageParagraphs = computed(() => {
  if (pages.length === 0) return [];
  return pages[currentPage.value]?.paragraphs || [];
});

const checkOverflow = async (): Promise<boolean> => {
  await nextTick();
  const measure = overflowMeasure.value;
  if (!measure) return false;
  const scrollPage = measure.querySelector(".letter-scroll-page") as HTMLElement;
  if (!scrollPage) return false;
  return scrollPage.scrollHeight > scrollPage.clientHeight + 2;
};

const lockBodyScroll = () => {
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
};

const unlockBodyScroll = () => {
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
};

const flipToNext = () => {
  if (isFlipping.value || currentPage.value >= pages.length - 1) return;
  flipForward();
};

const flipToPrev = () => {
  if (isFlipping.value || currentPage.value <= 0) return;
  flipBackward();
};

const typeText = async () => {
  isTyping.value = true;

  for (let i = 0; i < (props.paragraphs?.length || 0); i++) {
    const config = props.paragraphs![i];

    const currentPageData = pages[currentPage.value];
    const newParagraph: DisplayedParagraph = {
      currentText: "",
      align: config.align || "left",
    };
    currentPageData.paragraphs.push(newParagraph);

    if (config.delay) {
      await new Promise((r) => setTimeout(r, config.delay));
    }

    const text = config.content || "";

    let charSpeed = props.speed;
    if (config.audio && text.length > 0) {
      const audioDuration = await getAudioDuration(config.audio);
      if (audioDuration > 0) {
        charSpeed = Math.max(20, (audioDuration * 1000 - 200) / text.length);
      }
    }

    let audioPromise: Promise<void> | null = null;
    if (config.audio) {
      audioPromise = playAudioSync(config.audio);
    }

    for (const char of text) {
      const activePage = pages[currentPage.value];
      const activeParaIdx = activePage.paragraphs.length - 1;
      const activePara = activePage.paragraphs[activeParaIdx];

      activePara.currentText += char === " " ? "\u00a0" : char;

      const overflowed = await checkOverflow();
      if (overflowed) {
        activePara.currentText = activePara.currentText.slice(0, -1);

        if (activePara.currentText === "") {
          activePage.paragraphs.pop();
        }

        totalPages.value++;
        pages.push({ paragraphs: [] });
        await flipForward();

        const newPage = pages[currentPage.value];
        newPage.paragraphs.push({
          currentText: char === " " ? "\u00a0" : char,
          align: config.align || "left",
        });
      }

      await new Promise((r) => setTimeout(r, charSpeed));
    }

    if (audioPromise) await audioPromise;
    await new Promise((r) => setTimeout(r, 250));
  }

  isTyping.value = false;
  isFinished.value = true;
  setSwipeEnabled(true);
  emit("finish");
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

  // 注册手势（初始禁用，打字完成后启用）
  nextTick(() => {
    if (pageFlipContainer.value) {
      enableSwipe(pageFlipContainer.value);
      setSwipeEnabled(false);
    }
  });

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

/**
 * 点击外部收起信件
 */
const handleClose = () => {
  if (!isFinished.value || isClosing.value) return;
  isClosing.value = true;

  if (carouselTimer) {
    clearInterval(carouselTimer);
    carouselTimer = null;
  }
  audioPlayer.pause();
  unlockBodyScroll();

  setTimeout(() => {
    isTyping.value = false;
    isFinished.value = false;
    pages.splice(0, pages.length, { paragraphs: [] });
    currentImgIndex.value = 0;
    resetPages();
    setSwipeEnabled(false);

    // 重置所有动画阶段状态
    isEnvelopeOpening.value = false;
    isEnvelopeOpened.value = false;
    isSealPopping.value = false;
    isLetterFlying.value = false;
    isLetterArrived.value = false;
    showSparks.value = false;

    setTimeout(() => {
      isClosing.value = false;
      emit("close");
    }, 300);
  }, 400);
};

onUnmounted(() => {
  if (carouselTimer) clearInterval(carouselTimer);
  unlockBodyScroll();
  audioPlayer.pause();
  audioPlayer.src = "";
});
</script>

<style scoped>
@import "@/assets/fonts/LongCang/font.css";
/* =============================================
   哈利波特魔法信件 - 连贯开信动画版
   ============================================= */

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
  backdrop-filter: blur(2vpx);
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
    0 0 6vpx var(--gold),
    0 0 12vpx rgba(255, 215, 0, 0.6);
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
    transform: translateY(-30vpx) scale(1);
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
  transform: scale(0.8) translateY(50vpx);
  pointer-events: none;
}

.envelope {
  position: relative;
  cursor: pointer;
}

.envelope-body {
  position: relative;
  width: 300vpx;
  height: 190vpx;
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
    transform: translateY(-8vpx) rotate(0.5deg);
  }
}

/* 信封背面 */
.envelope-back {
  position: absolute;
  inset: 0;
  background: linear-gradient(150deg, #c9a86c 0%, #a8895c 60%, #8b7355 100%);
  border-radius: 4vpx;
  box-shadow: 0 8vpx 30vpx rgba(0, 0, 0, 0.4);
}

.envelope-back::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.05'/%3E%3C/svg%3E");
  border-radius: 4vpx;
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
  border-left: 150vpx solid transparent;
  border-right: 150vpx solid transparent;
  border-top: 95vpx solid #b8956f;
}

.flap-shadow {
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 0;
  border-left: 150vpx solid transparent;
  border-right: 150vpx solid transparent;
  border-top: 95vpx solid rgba(0, 0, 0, 0.1);
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
  border-radius: 0 0 4vpx 4vpx;
  z-index: 4;
  display: flex;
  justify-content: center;
  align-items: center;
}

.recipient-info {
  text-align: center;
  font-family: "Long Cang", "cursive", "Palatino Linotype", "Book Antiqua", Palatino, "STKaiti",
    "华文楷体", "KaiTi", "楷体", Georgia, serif;
  color: var(--ink);
  margin-top: 10vpx;
}

.recipient-name {
  font-size: 16vpx;
  font-weight: 700;
  margin: 0 0 4vpx;
}

.recipient-addr {
  font-size: 12vpx;
  margin: 0;
  opacity: 0.7;
}

/* 封蜡印章 */
.wax-seal {
  position: absolute;
  top: 71vpx;
  left: 50%;
  transform: translateX(-50%);
  width: 48vpx;
  height: 48vpx;
  z-index: 10;
  transition: transform 0.3s ease;
}

.wax-seal:hover {
  transform: translateX(-50%) scale(1.08);
}

.seal-glow {
  position: absolute;
  inset: -10vpx;
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
    0 3vpx 10vpx rgba(0, 0, 0, 0.5),
    inset 0 2vpx 4vpx rgba(255, 180, 120, 0.2),
    inset 0 -2vpx 5vpx rgba(0, 0, 0, 0.4);
  border: 2vpx solid #500000;
}

.seal-text {
  font-family: "Long Cang", "cursive", "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif;
  font-size: 22vpx;
  font-weight: 600;
  color: rgba(255, 215, 0, 0.9);
  text-shadow:
    0 0 8vpx rgba(255, 215, 0, 0.8),
    1vpx 1vpx 2vpx rgba(0, 0, 0, 0.6);
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
  margin-top: 30vpx;
  font-family: "Palatino Linotype", "Book Antiqua", Palatino, "STKaiti", "华文楷体", "KaiTi", "楷体",
    Georgia, serif;
  font-size: 15vpx;
  color: var(--gold);
  text-shadow: 0 0 12vpx var(--gold);
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
  transform: translateY(100vpx) scale(0.5) rotateX(30deg);
  transition: none;
  pointer-events: none;
}

.letter-scene.letter-flying {
  opacity: 1;
  transform: translateY(-20vpx) scale(0.9) rotateX(5deg);
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
  width: 360vpx;
  height: 520vpx;
  border-radius: 6vpx;
  overflow: visible; /* 改为 visible，使得内层的纸张能够飞出 */
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
  inset: 12vpx;
  border: 1vpx solid rgba(139, 105, 20, 0.25);
  pointer-events: none;
  z-index: 3;
}

.corner {
  position: absolute;
  width: 16vpx;
  height: 16vpx;
  border: 2vpx solid var(--gold-dim);
  opacity: 0.5;
}

.corner.tl {
  top: -2vpx;
  left: -2vpx;
  border-right: none;
  border-bottom: none;
}
.corner.tr {
  top: -2vpx;
  right: -2vpx;
  border-left: none;
  border-bottom: none;
}
.corner.bl {
  bottom: -2vpx;
  left: -2vpx;
  border-right: none;
  border-top: none;
}
.corner.br {
  bottom: -2vpx;
  right: -2vpx;
  border-left: none;
  border-top: none;
}

/* 符文装饰 */
.rune {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18vpx;
  color: var(--gold-dim);
  opacity: 0.5;
  z-index: 3;
}

.rune-top {
  top: 18vpx;
}
.rune-bottom {
  bottom: 18vpx;
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

/* ========== 翻页容器（整张纸翻页） ========== */
.page-flip-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
  perspective: 1800px;
  perspective-origin: center center;
  z-index: 2;
}

.page-sheet {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform-origin: center center;
  background: transparent;
  border-radius: 6vpx;
  box-shadow: 2vpx 2vpx 8vpx rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
  will-change: transform, opacity;
  overflow: hidden;
}

.page-active {
  transform: translate3d(0, 0, 0) scale(1) rotateZ(0deg);
  z-index: 10;
  opacity: 1;
}

.page-prev {
  transform: translate3d(0, -60vpx, 0) scale(0.9);
  opacity: 0;
  z-index: 1;
  pointer-events: none;
}

.page-next {
  transform: translate3d(0, 60vpx, 0) scale(0.9);
  opacity: 0;
  z-index: 1;
  pointer-events: none;
}

.page-flip-forward {
  animation: paper-draw-out 0.8s cubic-bezier(0.7, 0, 0.2, 1) forwards;
  z-index: 15;
}

.page-enter-forward {
  animation: paper-reveal 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  z-index: 10;
  opacity: 1;
}

.page-flip-backward {
  animation: paper-sink 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
  z-index: 5;
}

.page-enter-backward {
  animation: paper-stack-in 0.8s cubic-bezier(0.3, 1.2, 0.3, 1) forwards;
  z-index: 15;
  opacity: 1;
}

@keyframes paper-draw-out {
  0% {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
    opacity: 1;
    box-shadow: 2vpx 2vpx 8vpx rgba(0, 0, 0, 0.08);
  }
  30% {
    transform: translate3d(-15vpx, -30vpx, 50px) rotate(-4deg) scale(1.03);
    opacity: 1;
    box-shadow: 15vpx 20vpx 30vpx rgba(0, 0, 0, 0.25);
  }
  100% {
    transform: translate3d(120vpx, -200vpx, 100px) rotate(20deg) scale(0.85);
    opacity: 0;
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  }
}

@keyframes paper-reveal {
  0% {
    transform: translate3d(0, 40vpx, -50px) scale(0.95);
    opacity: 0;
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  }
  40% {
    opacity: 1;
  }
  100% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 1;
    box-shadow: 2vpx 2vpx 8vpx rgba(0, 0, 0, 0.08);
  }
}

@keyframes paper-sink {
  0% {
    transform: translate3d(0, 0, 0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translate3d(0, 40vpx, -50px) scale(0.95);
    opacity: 0;
  }
}

@keyframes paper-stack-in {
  0% {
    transform: translate3d(-40vpx, -150vpx, 100px) rotate(-12deg) scale(1.1);
    opacity: 0;
    box-shadow: 20vpx 30vpx 40vpx rgba(0, 0, 0, 0.3);
  }
  40% {
    opacity: 1;
  }
  100% {
    transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
    opacity: 1;
    box-shadow: 2vpx 2vpx 8vpx rgba(0, 0, 0, 0.08);
  }
}

/* 隐藏的溢出检测容器 */
.overflow-measure {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  visibility: hidden;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

/* 每页内容区 */
.letter-scroll-page {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 50vpx 24vpx 60vpx;
  box-sizing: border-box;
}

/* 顶部/底部渐变遮罩 div，用羊皮纸背景色遮挡滚动文字，不依赖 mask-image */
.scroll-fade-top,
.scroll-fade-bottom {
  position: absolute;
  left: 0;
  right: 0;
  height: 50vpx;
  pointer-events: none;
  z-index: 3;
}

.scroll-fade-top {
  top: 0;
  background: linear-gradient(to bottom, #f0e4c8 0%, rgba(240, 228, 200, 0) 100%);
}

.scroll-fade-bottom {
  bottom: 0;
  background: linear-gradient(to top, #ddd0a8 0%, rgba(221, 208, 168, 0) 100%);
}


.letter-content {
  max-width: 100%;
}

.content-header {
  text-align: center;
  margin-bottom: 4vpx;
  font-size: 14vpx;
  color: var(--gold-dim);
  opacity: 0.6;
  letter-spacing: 8vpx;
}

.para {
  margin-bottom: 6vpx;
}

.para-text {
  font-family: "Palatino Linotype", "Book Antiqua", Palatino, "STKaiti", "华文楷体", "KaiTi", "楷体",
    Georgia, serif;
  font-size: 19vpx;
  font-weight: 500;
  color: var(--ink);
  line-height: 1.75;
  margin: 0;
  text-shadow: 0 1vpx 0 rgba(255, 255, 255, 0.3);
}

.quill {
  display: inline-block;
  margin-left: 3vpx;
  animation: write 0.35s ease-in-out infinite;
}

@keyframes write {
  0%,
  100% {
    transform: rotate(-6deg);
  }
  50% {
    transform: rotate(6deg) translateY(-2vpx);
  }
}

.content-footer {
  height: 50vpx;
}

/* 边缘做旧 */
.aged-edges {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 4;
  box-shadow:
    inset 0 0 60vpx rgba(139, 105, 20, 0.15),
    inset 0 0 20vpx rgba(101, 67, 33, 0.1);
  border-radius: 6vpx;
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
  width: 5vpx;
  height: 5vpx;
  background: var(--gold);
  border-radius: 50%;
  box-shadow:
    0 0 8vpx var(--gold),
    0 0 16vpx rgba(255, 215, 0, 0.7);
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
    transform: rotate(var(--a)) translateY(80vpx);
    opacity: 0;
  }
}

/* iOS 安全区 */
@supports (padding-bottom: env(safe-area-inset-bottom)) {
  .letter-scroll-page {
    padding-bottom: calc(60vpx + env(safe-area-inset-bottom));
  }
}

/* 页码指示器 */
.page-indicator {
  position: absolute;
  bottom: 6vpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

.page-num {
  font-size: 11vpx;
  color: rgba(255, 215, 0, 0.35);
  letter-spacing: 2vpx;
  font-weight: 400;
}

/* 翻页按钮 */
.page-nav {
  position: absolute;
  bottom: 4vpx;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  padding: 0 8vpx;
  pointer-events: none;
}

.page-btn {
  width: 28vpx;
  height: 28vpx;
  border-radius: 50%;
  border: none;
  background: rgba(255, 215, 0, 0.1);
  color: var(--gold-dim);
  font-size: 18vpx;
  line-height: 1;
  cursor: pointer;
  pointer-events: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, transform 0.15s ease;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.page-btn:active {
  transform: scale(0.9);
}

.page-btn-disabled {
  opacity: 0.2;
  pointer-events: none;
}

/* 完成提示：底部轻量提示 */
.dismiss-hint {
  position: fixed;
  bottom: 28vpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 200;
  font-size: 12vpx;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 2vpx;
  pointer-events: none;
  animation: hint-fade-in 1s ease forwards;
}

@keyframes hint-fade-in {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(8vpx);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

/* 收起动画：整个容器淡出 */
.magic-letter-container.is-closing {
  opacity: 0;
  transition: opacity 0.4s ease;
}
</style>
