<template>
  <div
    class="ancient-envelope-final"
    :style="containerVars"
    :class="{ 'is-closing': isClosing }"
    @click="handleClose"
  >
    <!-- 音频播放器：用于段落配音，设置 playsinline 以适配移动端 -->
    <audio ref="audioPlayer" playsinline preload="auto"></audio>

    <div class="scene-stage">
      <!-- 1. 信封口袋容器 -->
      <!-- env-fade-out: 信纸居中后，信封执行向下位移并消失的动画 -->
      <div class="envelope-pocket" :class="{ 'env-fade-out': isFullyCentered }">
        <div class="env-part env-back"></div>
        <!-- 信封封面，点击触发 handleOpen -->
        <div class="env-part env-front" @click.stop="handleOpen">
          <div class="red-box-main" :class="{ mini: isOpened }">
            <div class="calligraphy">{{ props.hintText || "亲启" }}</div>
          </div>
        </div>
      </div>

      <!-- 2. 信纸主体 -->
      <!-- is-rising: 信纸升起动画 | is-zoom-center: 信纸全屏放大并居中动画 -->
      <div
        v-if="isOpened"
        class="letter-paper"
        :class="{ 'is-rising': isLetterUp, 'is-zoom-center': isFullyCentered }"
        @click.stop
      >
        <div class="paper-border-outer">
          <!-- 翻页容器 -->
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
              <div class="paper-border-inner">
                <div class="paper-content-area">
                  <div
                    v-for="(p, pIdx) in page.paragraphs"
                    :key="pIdx"
                    class="para-column-group"
                    :style="getParaStyle(p.align)"
                  >
                    <span
                      v-for="(char, cIdx) in p.displayed"
                      :key="cIdx"
                      class="v-char"
                      :class="{ 'ios-fix': isIOSMobile }"
                    >{{ char }}</span>
                    <span
                      v-if="isTyping && pageIdx === currentPage && pIdx === page.paragraphs.length - 1"
                      class="v-cursor"
                    >|</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 隐藏的溢出检测容器（竖排模式检测水平溢出） -->
            <div class="overflow-measure" ref="overflowMeasure">
              <div class="paper-border-inner">
                <div class="paper-content-area">
                  <div
                    v-for="(p, pIdx) in currentPageParagraphs"
                    :key="'m-' + pIdx"
                    class="para-column-group"
                    :style="getParaStyle(p.align)"
                  >
                    <span
                      v-for="(char, cIdx) in p.displayed"
                      :key="'mc-' + cIdx"
                      class="v-char"
                    >{{ char }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 页码指示器 -->
          <div class="page-indicator" v-if="isFullyCentered && pages.length > 1">
            <span class="page-num">{{ currentPage + 1 }} / {{ pages.length }}</span>
          </div>

          <!-- 翻页按钮 -->
          <div class="page-nav" v-if="isFinished && isFullyCentered && pages.length > 1" @click.stop>
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

        <!-- 3. 背景插图轮播层 -->
        <div class="paper-bg-img" v-if="images.length">
          <transition name="bg-slideshow">
            <div
              :key="currentImgIndex"
              class="img-fill"
              :style="{ backgroundImage: `url(${images[currentImgIndex]})` }"
            ></div>
          </transition>
        </div>
      </div>
    </div>

    <!-- 完成后底部收起提示 -->
    <div v-if="isFinished && isFullyCentered && !isClosing" class="dismiss-hint">
      轻触信件外收起
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AncientEnvelope Component - TypeScript Version
 * 核心逻辑：原生竖排文字流 + 动态格线增长 + 自动负坐标滚动追踪
 */
import { ref, reactive, computed, nextTick, onUnmounted } from "vue";
import { usePageFlip } from "@/hooks/usePageFlip";

// --- 类型定义 (Interfaces) ---

interface Paragraph {
  content: string;
  align?: "top" | "center" | "bottom";
  delay?: number;
  audio?: string;
  displayed?: string;
}

interface PageData {
  paragraphs: Paragraph[];
}

interface Props {
  paragraphs?: Paragraph[];
  speed?: number;
  images?: string[];
  hintText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  paragraphs: () => [],
  speed: 100,
  images: () => [],
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

// --- 响应式状态 ---
const isOpened = ref<boolean>(false);
const isLetterUp = ref<boolean>(false);
const isFullyCentered = ref<boolean>(false);
const isTyping = ref<boolean>(false);
const isFinished = ref<boolean>(false);
const isClosing = ref<boolean>(false);
const currentImgIndex = ref<number>(0);

// 分页数据
const pages = reactive<PageData[]>([{ paragraphs: [] }]);

const audioPlayer = ref<HTMLAudioElement | null>(null);
const overflowMeasure = ref<HTMLElement | null>(null);
const pageFlipContainer = ref<HTMLElement | null>(null);

let slideshowTimer: ReturnType<typeof setInterval> | null = null;

/**
 * 检测是否为 iOS 移动端设备
 */
const isIOSMobile = (() => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isMobile = /Mobile|Android/.test(ua) || navigator.maxTouchPoints > 1;
  return isIOS && isMobile;
})();

const containerVars = computed(() => ({
  "--speed": `${props.speed}ms`,
}));

const getParaStyle = (align?: string): Record<string, string> => {
  let ta: "left" | "center" | "right" = "center";
  if (align === "center") ta = "center";
  else if (align === "top") ta = "left";
  else if (align === "bottom") ta = "right";
  return { textAlign: ta };
};

/**
 * 获取当前页的段落数据（用于溢出检测容器渲染）
 */
const currentPageParagraphs = computed(() => {
  if (pages.length === 0) return [];
  return pages[currentPage.value]?.paragraphs || [];
});

/**
 * 检测当前页内容是否溢出（竖排模式检测水平溢出）
 */
const checkOverflow = async (): Promise<boolean> => {
  await nextTick();
  const measure = overflowMeasure.value;
  if (!measure) return false;
  const inner = measure.querySelector(".paper-border-inner") as HTMLElement;
  if (!inner) return false;
  return inner.scrollWidth > inner.clientWidth + 2;
};

/**
 * 手动翻页
 */
const flipToNext = () => {
  if (isFlipping.value || currentPage.value >= pages.length - 1) return;
  flipForward();
};

const flipToPrev = () => {
  if (isFlipping.value || currentPage.value <= 0) return;
  flipBackward();
};

/**
 * 逻辑：点击开启信封
 */
const handleOpen = async (): Promise<void> => {
  if (isOpened.value) return;
  isOpened.value = true;
  emit("open");

  if (audioPlayer.value) {
    const firstAudioUrl =
      props.paragraphs?.find((p) => p.audio)?.audio ||
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    audioPlayer.value.src = firstAudioUrl;
    audioPlayer.value.load();
    audioPlayer.value
      .play()
      .then(() => {
        audioPlayer.value?.pause();
        audioPlayer.value!.currentTime = 0;
      })
      .catch(() => {});
  }

  setTimeout(() => {
    isLetterUp.value = true;
  }, 50);
  setTimeout(() => {
    isFullyCentered.value = true;
  }, 1200);
  // 注册手势（初始禁用，打字完成后启用）
  nextTick(() => {
    if (pageFlipContainer.value) {
      enableSwipe(pageFlipContainer.value);
      setSwipeEnabled(false);
    }
  });

  setTimeout(() => {
    startTypewriting();
    startSlideshow();
  }, 2500);
};

/**
 * 核心：打字机引擎实现（带自动翻页）
 */
const startTypewriting = async (): Promise<void> => {
  isTyping.value = true;

  for (const p of props.paragraphs) {
    if (p.delay) await wait(p.delay);

    // 在当前页添加新段落
    const currentPageData = pages[currentPage.value];
    const currentP: Paragraph = reactive({ ...p, displayed: "" });
    currentPageData.paragraphs.push(currentP);

    // 段落同步配音播放
    if (p.audio && audioPlayer.value) {
      audioPlayer.value.src = p.audio;
      audioPlayer.value.play().catch((e) => console.log("Audio skip:", e));
    }

    const chars: string[] = Array.from(p.content);
    let charSpeed = props.speed;
    if (p.audio && chars.length > 0) {
      const audioDuration = await getAudioDuration(p.audio);
      if (audioDuration > 0) {
        charSpeed = Math.max(20, (audioDuration * 1000 - 200) / chars.length);
      }
    }

    for (const char of chars) {
      const activePage = pages[currentPage.value];
      const activeParaIdx = activePage.paragraphs.length - 1;
      const activePara = activePage.paragraphs[activeParaIdx];

      if (activePara.displayed !== undefined) {
        activePara.displayed += char === " " ? "\u00a0" : char;
      }

      await nextTick();
      forceRepaint();

      // 检测溢出
      const overflowed = await checkOverflow();
      if (overflowed) {
        // 移除当前字符
        if (activePara.displayed !== undefined) {
          activePara.displayed = activePara.displayed.slice(0, -1);
        }

        if (activePara.displayed === "") {
          activePage.paragraphs.pop();
        }

        // 创建新页并翻页
        totalPages.value++;
        pages.push({ paragraphs: [] });
        await flipForward();

        // 在新页添加段落（续接）
        const newPage = pages[currentPage.value];
        const newPara: Paragraph = reactive({ ...p, displayed: char === " " ? "\u00a0" : char });
        newPage.paragraphs.push(newPara);
      }

      await wait(charSpeed);
    }

    if (p.audio && audioPlayer.value) {
      await waitForAudioEnd(audioPlayer.value);
    }
  }
  isTyping.value = false;
  isFinished.value = true;
  setSwipeEnabled(true);
  emit("finish");
};

const startSlideshow = (): void => {
  if (props.images.length > 1) {
    slideshowTimer = setInterval(() => {
      currentImgIndex.value = (currentImgIndex.value + 1) % props.images.length;
    }, 5000);
  }
};

/**
 * iOS Safari 移动端强制重绘修复
 */
const forceRepaint = (): void => {
  if (!isIOSMobile) return;
  const container = overflowMeasure.value;
  if (!container) return;
  void container.offsetHeight;
  document.body.style.zoom = "1.0001";
  requestAnimationFrame(() => {
    document.body.style.zoom = "1";
  });
};

const handleClose = (): void => {
  if (!isFinished.value || isClosing.value) return;
  isClosing.value = true;

  if (slideshowTimer) {
    clearInterval(slideshowTimer);
    slideshowTimer = null;
  }
  if (audioPlayer.value) {
    audioPlayer.value.pause();
  }

  setTimeout(() => {
    isFullyCentered.value = false;
    isLetterUp.value = false;
    isTyping.value = false;
    isFinished.value = false;
    pages.splice(0, pages.length, { paragraphs: [] });
    currentImgIndex.value = 0;
    resetPages();
    setSwipeEnabled(false);

    setTimeout(() => {
      isOpened.value = false;
      isClosing.value = false;
      emit("close");
    }, 300);
  }, 350);
};

/**
 * 工具：基于 Promise 的延迟函数
 */
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * 工具：等待音频元素播放结束
 */
const waitForAudioEnd = (audio: HTMLAudioElement): Promise<void> =>
  new Promise((resolve) => {
    if (audio.paused || audio.ended) {
      resolve();
      return;
    }
    const onEnd = () => {
      audio.removeEventListener("ended", onEnd);
      audio.removeEventListener("error", onEnd);
      resolve();
    };
    audio.addEventListener("ended", onEnd, { once: true });
    audio.addEventListener("error", onEnd, { once: true });
  });

/**
 * 工具：预加载音频并返回其时长（秒）
 */
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

/**
 * 生命周期：资源清理
 */
onUnmounted(() => {
  if (slideshowTimer) clearInterval(slideshowTimer);
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.src = ""; // 释放音频资源
  }
});
</script>

<style scoped>
@import "@/assets/fonts/LongCang/font.css";
/* 容器：锁定全屏，背景保持深色 */
.ancient-envelope-final {
  position: relative;
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  /* 优先使用苹果/安卓/Windows自带的古风字体（行楷、魏碑、隶书、楷体等） */
  font-family: "Long Cang", "cursive", "STXingkai", "华文行楷", "Xingkai SC", "Weibei SC", "魏碑",
    "LiSu", "隶书", "STKaiti", "华文楷体", "KaiTi", "楷体", "FangSong", "仿宋", serif;
}

/* 舞台：控制信封和初始动画范围 */
.scene-stage {
  position: relative;
  width: 320vpx;
  height: 500vpx;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* --- 信封相关样式 --- */
.envelope-pocket {
  position: absolute;
  width: 210vpx;
  height: 380vpx;
  z-index: 10;
  transition:
    opacity 1s ease,
    transform 1s ease;
}

.env-fade-out {
  opacity: 0;
  transform: translateY(80vpx);
  pointer-events: none;
}

.env-part {
  position: absolute;
  inset: 0;
  border-radius: 2vpx;
}

.env-back {
  background-color: #b89a6b;
  z-index: 1;
}

.env-front {
  background-color: #d2b48c;
  z-index: 11;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 -5vpx 20vpx rgba(0, 0, 0, 0.3);
  cursor: pointer;
}

.red-box-main {
  width: 70vpx;
  height: 240vpx;
  border: 3vpx solid #a32e2e;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.red-box-main::after {
  content: "";
  position: absolute;
  inset: 4vpx;
  border: 1vpx solid #a32e2e;
}

.calligraphy {
  writing-mode: vertical-rl;
  font-size: 32vpx;
  color: #1a1a1a;
  font-weight: bold;
  letter-spacing: 12vpx;
}

/* --- 信纸相关样式 --- */
.letter-paper {
  position: absolute;
  width: 190vpx;
  height: 360vpx;
  background-color: #fdf5e6;
  z-index: 5;
  padding: 15vpx;
  box-sizing: border-box;
  opacity: 0;
  transform: translateY(30vpx);
  transition: all 1s cubic-bezier(0.34, 1, 0.64, 1);
}

.is-rising {
  opacity: 1;
  transform: translateY(-180vpx);
}

/* 最终居中形态：采用 fixed 定位确保不被父容器裁切 */
.is-zoom-center {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 350vpx;
  height: 82vh;
  max-width: 420vpx;
  transform: translate(-50%, -50%);
  z-index: 100;
}

.paper-border-outer {
  height: 100%;
  border: 2vpx solid #a32e2e;
  padding: 2vpx;
}

/* ========== 翻页容器（整张纸翻页） ========== */
.page-flip-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: visible;
  perspective: 1800px;
  perspective-origin: center center;
}

.page-sheet {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transform-origin: left center;
  background: linear-gradient(180deg, #f5efe0 0%, #ede4d0 100%);
  border-radius: 2vpx;
  box-shadow: 2vpx 2vpx 8vpx rgba(0, 0, 0, 0.08);
  transition: box-shadow 0.3s ease;
}

.page-active {
  transform: rotateY(0deg);
  z-index: 10;
}

.page-prev {
  transform: rotateY(-180deg);
  z-index: 1;
  pointer-events: none;
}

.page-next {
  transform: rotateY(0deg);
  z-index: 1;
  pointer-events: none;
  opacity: 0;
}

.page-flip-forward {
  animation: page-turn-out 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
  z-index: 15;
}

.page-enter-forward {
  animation: page-turn-in 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
  z-index: 10;
  opacity: 1;
}

.page-flip-backward {
  animation: page-turn-back-out 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
  z-index: 15;
}

.page-enter-backward {
  animation: page-turn-back-in 0.8s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
  z-index: 10;
  opacity: 1;
}

@keyframes page-turn-out {
  0% {
    transform: rotateY(0deg) scale(1);
    box-shadow: 2vpx 2vpx 8vpx rgba(0, 0, 0, 0.08);
    opacity: 1;
  }
  30% {
    transform: rotateY(-45deg) scale(1.02);
    box-shadow: 15vpx 5vpx 25vpx rgba(0, 0, 0, 0.2);
    opacity: 1;
  }
  60% {
    transform: rotateY(-110deg) scale(1.01);
    box-shadow: 10vpx 3vpx 20vpx rgba(0, 0, 0, 0.15);
    opacity: 0.7;
  }
  100% {
    transform: rotateY(-180deg) scale(1);
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
    opacity: 0;
  }
}

@keyframes page-turn-in {
  0% {
    transform: rotateY(15deg) scale(0.98);
    opacity: 0;
    box-shadow: -5vpx 2vpx 15vpx rgba(0, 0, 0, 0.1);
  }
  40% {
    opacity: 0.6;
  }
  70% {
    transform: rotateY(3deg) scale(1);
    opacity: 0.9;
    box-shadow: 3vpx 2vpx 10vpx rgba(0, 0, 0, 0.1);
  }
  100% {
    transform: rotateY(0deg) scale(1);
    opacity: 1;
    box-shadow: 2vpx 2vpx 8vpx rgba(0, 0, 0, 0.08);
  }
}

@keyframes page-turn-back-out {
  0% {
    transform: rotateY(0deg) scale(1);
    box-shadow: 2vpx 2vpx 8vpx rgba(0, 0, 0, 0.08);
    opacity: 1;
  }
  30% {
    transform: rotateY(30deg) scale(1.01);
    box-shadow: -10vpx 3vpx 20vpx rgba(0, 0, 0, 0.15);
    opacity: 1;
  }
  100% {
    transform: rotateY(15deg) scale(0.98);
    box-shadow: -5vpx 2vpx 15vpx rgba(0, 0, 0, 0.1);
    opacity: 0;
  }
}

@keyframes page-turn-back-in {
  0% {
    transform: rotateY(-180deg) scale(1);
    opacity: 0;
    box-shadow: 0 0 0 rgba(0, 0, 0, 0);
  }
  30% {
    transform: rotateY(-120deg) scale(1.01);
    opacity: 0.5;
    box-shadow: 10vpx 3vpx 20vpx rgba(0, 0, 0, 0.15);
  }
  60% {
    transform: rotateY(-50deg) scale(1.02);
    opacity: 0.85;
    box-shadow: 15vpx 5vpx 25vpx rgba(0, 0, 0, 0.2);
  }
  100% {
    transform: rotateY(0deg) scale(1);
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

.paper-border-inner {
  position: relative;
  height: 100%;
  border: 1vpx solid #a32e2e;
  overflow: hidden;
}

/* 核心排版：原生竖排流实现 */
.paper-content-area {
  writing-mode: vertical-rl;
  text-orientation: upright;
  height: 100%;
  min-width: 100%;
  line-height: 40vpx;
  font-size: 24vpx;
  color: #1a1a1a;
  /* 背景格线 */
  background-image: linear-gradient(to left, rgba(163, 46, 46, 0.2) 1vpx, transparent 1vpx);
  background-size: 40vpx 100%;
  background-position: right top;
  background-repeat: repeat-x;
}

.para-column-group {
  display: block;
  min-height: 100%;
  padding: 0;
  margin: 0;
  word-break: break-all;
}

.v-char {
  display: inline;
  color: #1a1a1a;
  font-weight: 600;
}

/* iOS Safari 移动端专用修复样式 - 仅在检测到 iOS 移动设备时通过 JS 添加此类 */
.v-char.ios-fix {
  /* 使用 inline-block 替代 inline，iOS Safari 对 inline-block 的重绘更可靠 */
  display: inline-block;
  /* iOS Safari 竖排文字颜色渲染修复 */
  -webkit-text-stroke: 0.01vpx #1a1a1a;
  /* 强制 GPU 加速渲染 */
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  /* 强制创建独立绘制层 */
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
  /* 持续微动画强制 iOS 不断重绘每个字符 */
  animation: ios-repaint-fix 0.01s infinite;
}

/* iOS Safari 强制重绘动画 - 几乎不可见的微小变化 */
@keyframes ios-repaint-fix {
  0%,
  100% {
    opacity: 0.9999;
  }
  50% {
    opacity: 1;
  }
}

.v-cursor {
  display: inline-block;
  color: #a32e2e;
  font-weight: bold;
  animation: blink 0.8s infinite;
  transform: translateY(-4vpx);
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

/* --- 背景插图与动画样式 --- */
.paper-bg-img {
  position: absolute;
  inset: 0;
  z-index: 0;
  opacity: 0.15;
  pointer-events: none;
  overflow: hidden;
}

.img-fill {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

/* 轮播图淡入淡出 Transition 效果 */
.bg-slideshow-enter-active,
.bg-slideshow-leave-active {
  transition: opacity 2s ease-in-out;
}

.bg-slideshow-enter-from,
.bg-slideshow-leave-to {
  opacity: 0;
}
/* 页码指示器 */
.page-indicator {
  position: absolute;
  bottom: 4vpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 20;
}

.page-num {
  font-size: 11vpx;
  color: rgba(163, 46, 46, 0.4);
  letter-spacing: 2vpx;
  font-weight: 400;
}

/* 翻页按钮 */
.page-nav {
  position: absolute;
  bottom: 2vpx;
  left: 0;
  right: 0;
  z-index: 20;
  display: flex;
  justify-content: space-between;
  padding: 0 4vpx;
  pointer-events: none;
}

.page-btn {
  width: 24vpx;
  height: 24vpx;
  border-radius: 50%;
  border: none;
  background: rgba(163, 46, 46, 0.08);
  color: #a32e2e;
  font-size: 16vpx;
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
  color: rgba(163, 46, 46, 0.5);
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
.ancient-envelope-final.is-closing {
  opacity: 0;
  transition: opacity 0.35s ease;
}
</style>
