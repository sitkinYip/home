<template>
  <div :class="['letter-container', styleType, { 'is-open': isOpen }]">
    <div class="envelope-wrapper" @click="openLetter">
      <div class="envelope">
        <!-- 信封盖子 -->
        <div class="flap"></div>
        <!-- 信封口袋 -->
        <div class="pocket"></div>

        <div class="letter-paper" @click.stop>
          <!-- 背景轮播图 -->
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

          <!-- 滚动内容区 -->
          <div class="content-wrapper" ref="scrollContainer" @touchstart="onUserTouch">
            <div class="text-content">
              <!-- 段落渲染 -->
              <div
                v-for="(p, index) in displayedParagraphs"
                :key="index"
                class="paragraph-row"
                :style="{ textAlign: p.align }"
              >
                <p
                  class="line-text"
                  :style="{ color: (customTextColor || 'var(--text-color)') + ' !important' }"
                >
                  {{ p.currentText }}
                  <!-- 打字机光标 -->
                  <span
                    class="cursor"
                    v-if="isTyping && activeParagraphIndex === index"
                    :style="{
                      background: (customTextColor || 'var(--text-color)') + ' !important',
                    }"
                  ></span>
                </p>
              </div>
              <!-- 底部留白 -->
              <div class="extra-space"></div>
            </div>
          </div>
        </div>
      </div>
      <!-- 开启提示 -->
      <div class="hint" v-if="!isOpen">{{ hintText }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onUnmounted } from "vue";

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
});

const emit = defineEmits(["open"]);

// --- 响应式状态 ---
const isOpen = ref<boolean>(false); // 信件是否已开启
const displayedParagraphs = ref<DisplayedParagraph[]>([]); // 实际渲染的段落数据
const isTyping = ref<boolean>(false); // 是否正在打字中
const activeParagraphIndex = ref<number>(0); // 当前正在打字的段落索引
const currentImgIndex = ref<number>(0); // 当前背景图索引
const scrollContainer = ref<HTMLDivElement | null>(null); // 滚动容器引用

// --- 内部变量 ---
let carouselTimer: ReturnType<typeof setInterval> | null = null; // 轮播定时器
let isUserInteracting = false; // 用户是否正在手动滚动/操作

/** 扩展 Window 接口以支持全局定时器（兼容原逻辑） */
declare global {
  interface Window {
    scrollResetTimer?: ReturnType<typeof setTimeout>;
  }
}

// --- 音频处理 ---
const audioPlayer: HTMLAudioElement = new Audio();

/**
 * 封装音频播放的 Promise
 * @param url 音频资源地址
 */
const playAudioSync = (url: string): Promise<void> => {
  return new Promise((resolve) => {
    // 先注册事件，再触发播放
    audioPlayer.onended = () => resolve();
    audioPlayer.onerror = () => {
      console.error("音频加载错误");
      resolve();
    };

    audioPlayer.src = url;
    audioPlayer.load();
    audioPlayer.play().catch((err) => {
      console.warn("音频播放失败，可能是浏览器限制:", err);
      resolve(); // 播放失败也继续，防止打字机逻辑阻塞
    });
  });
};

/**
 * 监听内容变化，实现自动滚动到底部
 */
watch(
  displayedParagraphs,
  () => {
    if (!isTyping.value || isUserInteracting) return;
    nextTick(() => {
      const el = scrollContainer.value;
      if (el) {
        // 判断是否在底部附近，如果是则执行滚动
        const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 120;
        if (atBottom) {
          el.scrollTo({ top: el.scrollHeight, behavior: "auto" });
        }
      }
    });
  },
  { deep: true },
);

/**
 * 处理用户触摸，暂时停止自动滚动
 */
const onUserTouch = (): void => {
  if (isTyping.value) {
    isUserInteracting = true;
    if (window?.scrollResetTimer) {
      clearTimeout(window.scrollResetTimer);
    }
    window.scrollResetTimer = setTimeout(() => {
      isUserInteracting = false;
    }, 3000);
  }
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
 * 核心逻辑：打字机效果
 */
const typeText = async (): Promise<void> => {
  isTyping.value = true;

  for (let i = 0; i < (props.paragraphs?.length || 0); i++) {
    activeParagraphIndex.value = i;
    const config = props.paragraphs![i];

    // 初始化当前行
    displayedParagraphs.value.push({
      currentText: "",
      align: config.align || "left",
    });

    // 段前延迟
    if (config.delay) {
      await new Promise((resolve) => setTimeout(resolve, config.delay));
    }

    const text = config.content || "";

    // 1. 播放音频（不阻塞打字）
    let audioPromise: Promise<void> | null = null;
    if (config.audio) {
      audioPromise = playAudioSync(config.audio);
    }

    // 2. 执行打字效果
    for (const char of text) {
      displayedParagraphs.value[i].currentText += char;
      await new Promise((resolve) => setTimeout(resolve, props.speed));
    }

    // 3. 等待音频播放完成（如果音频长于打字时长）
    if (audioPromise) {
      await audioPromise;
    }

    // 段落间停顿
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  isTyping.value = false;
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
  --letter-line-height: 36px;

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
  font-family: "Helvetica Neue", Arial, sans-serif;
}

.ancient {
  --paper-bg: #f4ecd8;
  --line-color: rgba(139, 69, 19, 0.12);
  --text-color: #3d2b1f;
  --envelope-color: #8b0000;
  --flap-color: #6e0000;
  font-family: "STKaiti", "KaiTi", serif;
}

.envelope-wrapper {
  position: relative;
  width: min(400px, 85vw);
  height: min(260px, 55vw);
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
  border-left: calc(min(400px, 85vw) / 2) solid transparent;
  border-right: calc(min(400px, 85vw) / 2) solid transparent;
  border-top: calc(min(260px, 55vw) / 2) solid var(--flap-color);
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
  border-left: calc(min(400px, 85vw) / 2) solid transparent;
  border-right: calc(min(400px, 85vw) / 2) solid transparent;
  border-bottom: calc(min(260px, 55vw) / 1.8) solid var(--flap-color);
  z-index: 2;
}

.letter-paper {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 94%;
  bottom: 10px;
  height: 80%;
  background-color: var(--paper-bg);
  z-index: 1;
  transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.is-open .letter-paper {
  z-index: 4;
  height: calc(50vh + 130px - 70px);
  max-height: 600px;
  bottom: 30px;
  box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.2);
}

.content-wrapper {
  width: 100%;
  height: 100%;
  padding: 0px 25px;
  box-sizing: border-box;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  line-height: var(--letter-line-height);
  background-image: repeating-linear-gradient(
    transparent,
    transparent calc(var(--letter-line-height) - 1px),
    var(--line-color) calc(var(--letter-line-height) - 1px),
    var(--line-color) var(--letter-line-height)
  );
  background-attachment: local;
  background-position: 0 0px;
}

.content-wrapper::-webkit-scrollbar {
  display: none;
}

.text-content {
  position: relative;
  z-index: 5;
  padding-top: 4px;
}

.paragraph-row {
  width: 100%;
}

.line-text {
  margin: 0 !important;
  padding: 0 !important;
  font-size: 18px;
  font-weight: 500;
  line-height: var(--letter-line-height) !important;
  width: 100%;
  white-space: pre-wrap;
  word-break: break-all;
}

.extra-space {
  height: 100px;
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
  width: 2px;
  height: 20px;
  vertical-align: middle;
  margin-left: 2px;
  margin-top: -4px;
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
  bottom: -50px;
  width: 100%;
  text-align: center;
  color: #666;
  font-size: 14px;
}

@media (max-width: 480px) {
  .line-text {
    font-size: 16px;
  }
}
</style>
