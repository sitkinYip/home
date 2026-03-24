<template>
  <div
    :class="['letter-container', styleType, { 'is-open': isOpen, 'is-closing': isClosing }]"
    @click="handleClose"
  >
    <div class="envelope-wrapper" @click.stop="openLetter">
      <div class="envelope">
        <!-- 信封盖子 -->
        <div class="flap"></div>
        <!-- 信封口袋 -->
        <div class="pocket"></div>

        <!-- 封面信息与封蜡 -->
        <div class="envelope-front-content" :class="{ 'fade-out': isOpen }">
          <div class="wax-seal">
            <div class="seal-glow"></div>
            <div class="seal-body">
              <span class="seal-text">{{ sealText }}</span>
            </div>
          </div>
          <div class="recipient-info">
            <p class="recipient-name" v-if="title">{{ title }}</p>
            <p class="recipient-addr" v-if="desc">{{ desc }}</p>
          </div>
        </div>

        <div class="letter-paper" @click.stop>
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
              <!-- 背景轮播图移至每页内部 -->
              <div class="bg-carousel" v-if="images && images.length > 0">
                <transition-group name="fade">
                  <div
                    v-for="(img, index) in images"
                    :key="img"
                    v-show="currentImgIndex === index"
                    class="bg-img"
                    :style="{ backgroundImage: `url(${img})` }"
                  ></div>
                </transition-group>
              </div>

              <div class="content-wrapper">
                <div class="text-content">
                  <div
                    v-for="(p, pIdx) in page.paragraphs"
                    :key="pIdx"
                    class="paragraph-row"
                    :style="{ textAlign: p.align }"
                  >
                    <p
                      class="line-text"
                      :style="{ color: (customTextColor || 'var(--text-color)') + ' !important' }"
                    >
                      {{ p.currentText }}
                      <span
                        class="cursor"
                        v-if="isTyping && pageIdx === currentPage && pIdx === page.paragraphs.length - 1"
                        :style="{
                          background: (customTextColor || 'var(--text-color)') + ' !important',
                        }"
                      ></span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <!-- 隐藏的溢出检测容器 -->
            <div class="overflow-measure" ref="overflowMeasure">
              <div class="content-wrapper">
                <div class="text-content">
                  <div
                    v-for="(p, pIdx) in currentPageParagraphs"
                    :key="'m-' + pIdx"
                    class="paragraph-row"
                    :style="{ textAlign: p.align }"
                  >
                    <p class="line-text">{{ p.currentText }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 页码指示器 -->
          <div class="page-indicator" v-if="isOpen && pages.length > 1">
            <span class="page-num">{{ currentPage + 1 }} / {{ pages.length }}</span>
          </div>

          <!-- 翻页按钮 -->
          <div class="page-nav" v-if="isFinished && isOpen && pages.length > 1" @click.stop>
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
      <!-- 开启提示 -->
      <div class="hint" v-if="!isOpen">{{ hintText }}</div>
    </div>

    <!-- 完成后底部收起提示 -->
    <div v-if="isFinished && isOpen && !isClosing" class="dismiss-hint">轻触信件外收起</div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, nextTick, onUnmounted } from "vue";
import { usePageFlip } from "@/hooks/usePageFlip";

/**
 * 段落配置项接口
 */
interface ParagraphConfig {
  /** 段落文本内容 */
  content: string;
  /** 对齐方式：左、中、右 */
  align?: "left" | "center" | "right";
  /** 打字前的延迟时间 (ms) */
  delay?: number;
  /** 关联的音频地址 */
  audio?: string;
}

/**
 * 内部渲染使用的段落状态接口
 */
interface DisplayedParagraph {
  /** 当前已打出的文本 */
  currentText: string;
  /** 对齐方式 */
  align: "left" | "center" | "right";
}

/**
 * 单页数据结构
 */
interface PageData {
  paragraphs: DisplayedParagraph[];
}

/**
 * 组件入参声明
 */
interface Props {
  /** 信件段落列表 */
  paragraphs?: ParagraphConfig[];
  /** 打字速度 (ms/字符) */
  speed?: number;
  /** 样式风格：modern(现代), ancient(古风) 等 */
  styleType?: string;
  /** 背景轮播图数组 */
  images?: string[];
  /** 轮播切换间隔 (ms) */
  carouselInterval?: number;
  /** 自定义文字颜色 */
  customTextColor?: string;
  /** 未开启时的提示文字 */
  hintText?: string;
  /** 收信人称呼 */
  title?: string;
  /** 寄信描述 */
  desc?: string;
  /** 火漆印章文字/符号 */
  sealText?: string;
}

// 定义 props 并设置默认值
const props = withDefaults(defineProps<Props>(), {
  paragraphs: () => [],
  speed: 80,
  styleType: "modern",
  images: () => [],
  carouselInterval: 5000,
  customTextColor: "",
  hintText: "点击开启信件",
  title: "",
  desc: "",
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

// --- 响应式状态 ---
const isOpen = ref<boolean>(false);
const isTyping = ref<boolean>(false);
const currentImgIndex = ref<number>(0);
const isFinished = ref<boolean>(false);
const isClosing = ref<boolean>(false);
const overflowMeasure = ref<HTMLDivElement | null>(null);
const pageFlipContainer = ref<HTMLDivElement | null>(null);

// 分页数据：每页包含若干段落
const pages = reactive<PageData[]>([{ paragraphs: [] }]);

// --- 内部变量 ---
let carouselTimer: ReturnType<typeof setInterval> | null = null;

// --- 音频处理 ---
const audioPlayer: HTMLAudioElement = new Audio();

const playAudioSync = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    audioPlayer.onended = () => resolve();
    audioPlayer.onerror = () => {
      console.error("音频加载错误");
      resolve();
    };
    audioPlayer.src = url;
    audioPlayer.load();
    audioPlayer.play().catch((err) => {
      console.warn("音频播放失败，可能是浏览器限制:", err);
      resolve();
    });
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

/**
 * 获取当前页的段落数据（用于溢出检测容器渲染）
 */
const currentPageParagraphs = computed(() => {
  if (pages.length === 0) return [];
  return pages[currentPage.value]?.paragraphs || [];
});

/**
 * 检测当前页内容是否溢出
 */
const checkOverflow = async (): Promise<boolean> => {
  await nextTick();
  const measure = overflowMeasure.value;
  if (!measure) return false;
  const wrapper = measure.querySelector(".content-wrapper") as HTMLElement;
  const contentEl = measure.querySelector(".text-content") as HTMLElement;
  if (!wrapper || !contentEl) return false;
  // 预留半行安全区间，防止最后一行刚好被页码区裁掉
  const lineHeight = parseFloat(getComputedStyle(wrapper).lineHeight) || 36;
  const safeBottom = lineHeight * 0.5;
  return contentEl.scrollHeight > wrapper.clientHeight - safeBottom;
};

/** 锁定背景滚动 */
const lockBodyScroll = (): void => {
  document.body.style.overflow = "hidden";
  document.body.style.touchAction = "none";
};

/** 解锁背景滚动 */
const unlockBodyScroll = (): void => {
  document.body.style.overflow = "";
  document.body.style.touchAction = "";
};

/**
 * 手动翻页（打字完成后）
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
 * 核心逻辑：打字机效果（带自动翻页）
 */
const typeText = async (): Promise<void> => {
  isTyping.value = true;

  for (let i = 0; i < (props.paragraphs?.length || 0); i++) {
    const config = props.paragraphs![i];

    // 在当前页添加新段落
    const currentPageData = pages[currentPage.value];
    const newParagraph: DisplayedParagraph = {
      currentText: "",
      align: config.align || "left",
    };
    currentPageData.paragraphs.push(newParagraph);

    // 段前延迟
    if (config.delay) {
      await new Promise((resolve) => setTimeout(resolve, config.delay));
    }

    const text = config.content || "";

    // 计算实际打字速度
    let charSpeed = props.speed;
    if (config.audio && text.length > 0) {
      const audioDuration = await getAudioDuration(config.audio);
      if (audioDuration > 0) {
        charSpeed = Math.max(20, (audioDuration * 1000 - 200) / text.length);
      }
    }

    // 播放音频（不阻塞打字）
    let audioPromise: Promise<void> | null = null;
    if (config.audio) {
      audioPromise = playAudioSync(config.audio);
    }

    // 逐字打字（带溢出检测和自动翻页）
    for (const char of text) {
      const activePage = pages[currentPage.value];
      const activeParaIdx = activePage.paragraphs.length - 1;
      const activePara = activePage.paragraphs[activeParaIdx];

      activePara.currentText += char;

      // 检测溢出
      const overflowed = await checkOverflow();
      if (overflowed) {
        // 将当前字符从当前页移除
        activePara.currentText = activePara.currentText.slice(0, -1);

        if (activePara.currentText === "") {
          // 整个段落移到新页
          activePage.paragraphs.pop();
        }

        // 创建新页并翻页
        totalPages.value++;
        pages.push({ paragraphs: [] });
        await flipForward();

        // 在新页添加段落（续接）
        const newPage = pages[currentPage.value];
        newPage.paragraphs.push({
          currentText: char,
          align: config.align || "left",
        });
      }

      await new Promise((resolve) => setTimeout(resolve, charSpeed));
    }

    // 等待音频播放完成
    if (audioPromise) {
      await audioPromise;
    }

    // 段落间停顿
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  isTyping.value = false;
  isFinished.value = true;
  setSwipeEnabled(true);
  emit("finish");
};

/**
 * 开启信件
 */
const openLetter = (): void => {
  if (isOpen.value) return;

  emit("open");

  // 解锁移动端音频自动播放权限（必须由用户交互触发）
  // 直接用 audioPlayer 本身解锁，确保后续段落 play() 被授权
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

  isOpen.value = true;
  lockBodyScroll();

  // 注册手势（初始禁用，打字完成后启用）
  nextTick(() => {
    if (pageFlipContainer.value) {
      enableSwipe(pageFlipContainer.value);
      setSwipeEnabled(false);
    }
  });

  // 动画延时后开始执行逻辑
  setTimeout(() => {
    typeText();
    // 开启背景轮播
    if (props.images && props.images.length > 1) {
      carouselTimer = setInterval(() => {
        currentImgIndex.value = (currentImgIndex.value + 1) % props.images!.length;
      }, props.carouselInterval);
    }
  }, 1000);
};

/**
 * 点击外部收起信件
 */
const handleClose = (): void => {
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

    setTimeout(() => {
      isOpen.value = false;
      isClosing.value = false;
      emit("close");
    }, 300);
  }, 350);
};

/**
 * 销毁生命周期处理
 */
onUnmounted(() => {
  if (carouselTimer) clearInterval(carouselTimer);
  unlockBodyScroll();
  // 停止音频播放
  audioPlayer.pause();
  audioPlayer.src = "";
});
</script>

<style scoped>
/* 样式部分保持不变，已包含在组件内 */
.letter-container {
  --paper-bg: #fdf5e6;
  --line-color: rgba(0, 0, 0, 0.08);
  --text-color: #222;
  --envelope-color: #c0392b;
  --flap-color: #a5281b;
  --letter-line-height: 36vpx;

  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  overflow: hidden;
}

.modern {
  --paper-bg: #ffffff;
  --line-color: #eef2f6;
  --text-color: #2c3e50;
  --envelope-color: #353b48;
  --flap-color: #2f3640;
  font-family: "Helvetica Neue", Helvetica, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei",
    Arial, sans-serif;
}

.ancient {
  --paper-bg: #f4ecd8;
  --line-color: rgba(139, 69, 19, 0.12);
  --text-color: #3d2b1f;
  --envelope-color: #8b0000;
  --flap-color: #6e0000;
  font-family: "Palatino Linotype", "Book Antiqua", Palatino, "STKaiti", "华文楷体", "KaiTi", "楷体",
    Georgia, serif;
}

.envelope-wrapper {
  position: relative;
  width: 340vpx;
  height: 215vpx;
}

.envelope {
  position: relative;
  width: 100%;
  height: 100%;
  background-color: var(--envelope-color);
}

.flap {
  position: absolute;
  top: 0;
  width: 0;
  height: 0;
  border-left: 170vpx solid transparent;
  border-right: 170vpx solid transparent;
  border-top: 108vpx solid var(--flap-color);
  z-index: 3;
  transform-origin: top;
  transition: transform 0.6s ease-in-out;
}

.pocket {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: 100%;
  background-color: var(--envelope-color);
  border-left: 170vpx solid transparent;
  border-right: 170vpx solid transparent;
  border-bottom: 120vpx solid var(--flap-color);
  z-index: 2;
}

.letter-paper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 94%;
  bottom: 10vpx;
  height: 80%;
  background-color: transparent;
  z-index: 1;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: visible;
}

.is-open .letter-paper {
  z-index: 4;
  height: calc(50vh + 130vpx - 70vpx);
  max-height: 600vpx;
  bottom: 30vpx;
  box-shadow: 0 -10vpx 30vpx rgba(0, 0, 0, 0.2);
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
  transform-origin: center center;
  background-color: var(--paper-bg);
  border-radius: 2vpx;
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
/* 底部预留页码指示器 + 导航按钮占用的空间，防止最后一行被遮挡 */
.overflow-measure {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  /* 减去底部页码区域高度（约 42vpx），确保翻页在内容被遮挡前发生 */
  /* 预留底部页码区域高度（约 30vpx），防止最后一行被遮挡 */
  height: calc(100% - 30vpx);
  visibility: hidden;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.content-wrapper {
  width: 100%;
  height: 100%;
  padding: 0px 25vpx;
  box-sizing: border-box;
  overflow: hidden;
  line-height: var(--letter-line-height);
  background-image: repeating-linear-gradient(
    transparent,
    transparent calc(var(--letter-line-height) - 1vpx),
    var(--line-color) calc(var(--letter-line-height) - 1vpx),
    var(--line-color) var(--letter-line-height)
  );
  background-attachment: local;
  background-position: 0 0vpx;
}

.content-wrapper::-webkit-scrollbar {
  display: none;
}

.text-content {
  position: relative;
  z-index: 5;
  padding-top: 4vpx;
}

.paragraph-row {
  width: 100%;
}

.line-text {
  margin: 0 !important;
  padding: 0 !important;
  font-size: 18vpx;
  font-weight: 500;
  line-height: var(--letter-line-height) !important;
  width: 100%;
  white-space: pre-wrap;
  word-break: break-all;
}

.bg-carousel {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  opacity: 0.3;
  pointer-events: none;
}

.bg-img {
  position: absolute;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
}

.cursor {
  display: inline-block;
  width: 2vpx;
  height: 20vpx;
  vertical-align: middle;
  margin-left: 2vpx;
  margin-top: -4vpx;
  animation: blink 0.8s infinite;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}

.is-open .flap {
  transform: rotateX(180deg);
  z-index: 0;
}

.hint {
  position: absolute;
  bottom: -50vpx;
  width: 100%;
  text-align: center;
  color: #666;
  font-size: 14vpx;
}

/* 封面信息与封蜡 */
.envelope-front-content {
  position: absolute;
  inset: 0;
  z-index: 4;
  pointer-events: none;
  transition:
    opacity 0.4s ease,
    visibility 0.4s ease;
}

.envelope-front-content.fade-out {
  opacity: 0;
  visibility: hidden;
}

.recipient-info {
  position: absolute;
  top: 140vpx;
  left: 0;
  width: 100%;
  text-align: center;
  font-family: "Palatino Linotype", "Book Antiqua", Palatino, "STKaiti", "华文楷体", "KaiTi", "楷体",
    Georgia, serif;
  color: #f3e5c3;
  text-shadow: 0 1vpx 3vpx rgba(0, 0, 0, 0.4);
}

.recipient-name {
  font-size: 16vpx;
  font-weight: 700;
  margin: 0 0 4vpx;
}

.recipient-addr {
  font-size: 12vpx;
  margin: 0;
  opacity: 0.85;
}

/* 封蜡印章 */
.wax-seal {
  position: absolute;
  top: 108vpx;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 46vpx;
  height: 46vpx;
  z-index: 10;
  pointer-events: auto;
}

.seal-glow {
  position: absolute;
  inset: -8vpx;
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
  background: radial-gradient(circle at 35% 30%, #c41e3a 0%, #8b0000 50%, #4a0000 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow:
    0 3vpx 8vpx rgba(0, 0, 0, 0.5),
    inset 0 2vpx 4vpx rgba(255, 180, 120, 0.2),
    inset 0 -2vpx 5vpx rgba(0, 0, 0, 0.4);
  border: 1.5vpx solid #500000;
}

.seal-text {
  font-family: "Palatino Linotype", "Book Antiqua", Palatino, Georgia, serif;
  font-size: 20vpx;
  font-weight: 600;
  color: rgba(255, 215, 0, 0.9);
  text-shadow:
    0 0 6vpx rgba(255, 215, 0, 0.8),
    1vpx 1vpx 2vpx rgba(0, 0, 0, 0.6);
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
  color: rgba(0, 0, 0, 0.3);
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
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-color);
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
.letter-container.is-closing {
  opacity: 0;
  transition: opacity 0.35s ease;
}
</style>
