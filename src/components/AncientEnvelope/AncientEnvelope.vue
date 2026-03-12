<template>
  <div class="ancient-envelope-final" :style="containerVars">
    <!-- 音频播放器：用于段落配音，设置 playsinline 以适配移动端 -->
    <audio ref="audioPlayer" playsinline preload="auto"></audio>

    <div class="scene-stage">
      <!-- 1. 信封口袋容器 -->
      <!-- env-fade-out: 信纸居中后，信封执行向下位移并消失的动画 -->
      <div class="envelope-pocket" :class="{ 'env-fade-out': isFullyCentered }">
        <div class="env-part env-back"></div>
        <!-- 信封封面，点击触发 handleOpen -->
        <div class="env-part env-front" @click="handleOpen">
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
      >
        <div class="paper-border-outer">
          <!-- 核心滚动容器：paper-border-inner -->
          <div class="paper-border-inner" ref="scrollContainer" @touchstart="handleTouchStart">
            <!-- paper-content-area: 承载竖排文字流和动态生成的背景格线 -->
            <div class="paper-content-area">
              <!-- 遍历渲染每一段内容 -->
              <div
                v-for="(p, index) in renderedParagraphs"
                :key="index"
                class="para-column-group"
                :style="getParaStyle(p.align)"
              >
                <!-- 遍历渲染已打出的字，v-char 负责垂直堆叠 -->
                <!-- iOS 移动端需要额外的 ios-fix 类来应用强制重绘动画 -->
                <span
                  v-for="(char, cIdx) in p.displayed"
                  :key="cIdx"
                  class="v-char"
                  :class="{ 'ios-fix': isIOSMobile }"
                  >{{ char }}</span
                >
                <!-- 打字机光标：仅在当前正在录入的段落末尾闪烁 -->
                <span v-if="isTyping && index === renderedParagraphs.length - 1" class="v-cursor"
                  >|</span
                >
              </div>
            </div>
          </div>
        </div>

        <!-- 3. 背景插图轮播层 -->
        <div class="paper-bg-img" v-if="images.length">
          <transition name="bg-slideshow">
            <!-- 使用 :key 绑定索引，实现图片切换时的淡入淡出 -->
            <div
              :key="currentImgIndex"
              class="img-fill"
              :style="{ backgroundImage: `url(${images[currentImgIndex]})` }"
            ></div>
          </transition>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * AncientEnvelope Component - TypeScript Version
 * 核心逻辑：原生竖排文字流 + 动态格线增长 + 自动负坐标滚动追踪
 */
import { ref, reactive, computed, nextTick, onUnmounted } from "vue";

// --- 类型定义 (Interfaces) ---

/**
 * 段落数据结构
 */
interface Paragraph {
  content: string; // 文本内容
  align?: "top" | "center" | "bottom"; // 对齐方向
  delay?: number; // 该段落开始前的停顿延迟 (ms)
  audio?: string; // 该段落对应的配音 URL
  displayed?: string; // [内部字段] 已经打出来的文字
}

/**
 * 组件 Props 定义
 */
interface Props {
  paragraphs?: Paragraph[]; // 信件段落数组
  speed?: number; // 打字速度 (ms/字)
  images?: string[]; // 背景插图数组
  /** 未开启时的提示文字 */
  hintText?: string;
}

// 应用默认值
const props = withDefaults(defineProps<Props>(), {
  paragraphs: () => [],
  speed: 100,
  images: () => [],
});

const emit = defineEmits(["open"]);

// --- 响应式状态 (State) ---

const isOpened = ref<boolean>(false); // 是否触发开启信封
const isLetterUp = ref<boolean>(false); // 信纸是否开始升起
const isFullyCentered = ref<boolean>(false); // 信纸是否完成居中放大
const isTyping = ref<boolean>(false); // 打字机是否正在工作中
const currentImgIndex = ref<number>(0); // 当前显示的图片轮播索引
const renderedParagraphs = reactive<Paragraph[]>([]); // 实际在页面渲染的段落数组

// 模版引用类型标注
const audioPlayer = ref<HTMLAudioElement | null>(null);
const scrollContainer = ref<HTMLElement | null>(null);

// 定时器与交互状态
let slideshowTimer: ReturnType<typeof setInterval> | null = null;
let isUserInteracting: boolean = false; // 用户是否正在手动滑动（此时禁用自动滚动定位）

/**
 * 检测是否为 iOS 移动端设备
 * 用于针对性地应用 iOS Safari 渲染 bug 的修复措施
 */
const isIOSMobile = (() => {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // 检测 iOS 设备（iPhone, iPad, iPod）且非桌面模式
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1); // iPad with iPadOS
  // 排除桌面 Safari（桌面 Safari 没有这个问题）
  const isMobile = /Mobile|Android/.test(ua) || navigator.maxTouchPoints > 1;
  return isIOS && isMobile;
})();

/**
 * 计算属性：将速度转换为 CSS 变量，供样式动画参考
 */
const containerVars = computed(() => ({
  "--speed": `${props.speed}ms`,
}));

/**
 * 处理垂直对齐的映射逻辑
 * 原理：在 writing-mode: vertical-rl 模式下，文字流向反转
 * 我们通过反转 textAlign 的物理属性（left/right）来符合用户 top/bottom 的直觉
 */
const getParaStyle = (align?: string): Record<string, string> => {
  let ta: "left" | "center" | "right" = "center";
  if (align === "center") ta = "center";
  else if (align === "top")
    ta = "left"; // 映射为物理顶部
  else if (align === "bottom") ta = "right"; // 映射为物理底部
  return { textAlign: ta };
};

/**
 * 逻辑：点击开启信封
 */
const handleOpen = async (): Promise<void> => {
  if (isOpened.value) return;
  isOpened.value = true;
  emit("open");

  // 解锁移动端音频限制：必须在用户点击的同步线程中调用一次 play()
  // 用第一个有 audio 的段落 URL（或静默 blob）正确解锁，空 src 的 play() 会直接报错
  if (audioPlayer.value) {
    const firstAudioUrl =
      props.paragraphs?.find((p) => p.audio)?.audio ||
      "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    audioPlayer.value.src = firstAudioUrl;
    audioPlayer.value.load();
    audioPlayer.value
      .play()
      .then(() => {
        audioPlayer.value?.pause(); // 解锁后立即暂停，等待打字机触发
        audioPlayer.value!.currentTime = 0; // 重置播放进度
      })
      .catch(() => {});
  }

  // 阶梯式动画执行序列
  setTimeout(() => {
    isLetterUp.value = true;
  }, 50); // 1. 信纸微升
  setTimeout(() => {
    isFullyCentered.value = true;
  }, 1200); // 2. 居中并放大，信封消失
  setTimeout(() => {
    startTypewriting(); // 3. 开启打字机
    startSlideshow(); // 4. 开启插图轮播
  }, 2500);
};

/**
 * 核心：打字机引擎实现
 */
const startTypewriting = async (): Promise<void> => {
  isTyping.value = true;

  for (const p of props.paragraphs) {
    // 阶段性延迟
    if (p.delay) await wait(p.delay);

    // 初始化当前待显示的段落容器
    const currentP: Paragraph = reactive({ ...p, displayed: "" });
    renderedParagraphs.push(currentP);

    // 段落同步配音播放
    if (p.audio && audioPlayer.value) {
      audioPlayer.value.src = p.audio;
      audioPlayer.value.play().catch((e) => console.log("Audio skip:", e));
    }

    // 逐字拆分并累加输出（将普通空格替换为不间断空格，防止 HTML 折叠）
    const chars: string[] = Array.from(p.content);
    for (const char of chars) {
      if (currentP.displayed !== undefined) {
        currentP.displayed += char === " " ? "\u00a0" : char;
      }

      // 关键步骤：等待 Vue 将新字符渲染到 DOM
      await nextTick();
      // iOS Safari 移动端强制重绘修复：解决竖排文字动态追加不显示的问题
      forceRepaint();
      // 渲染后执行滚动定位
      autoScroll();
      // 等待设置的打字速度间隔
      await wait(props.speed);
    }

    // 当前段落打字完毕后，若有配音则等待音频自然播放结束，再继续下一段
    if (p.audio && audioPlayer.value) {
      await waitForAudioEnd(audioPlayer.value);
    }
  }
  isTyping.value = false;
};

/**
 * 逻辑：背景图片自动切换
 */
const startSlideshow = (): void => {
  if (props.images.length > 1) {
    slideshowTimer = setInterval(() => {
      currentImgIndex.value = (currentImgIndex.value + 1) % props.images.length;
    }, 5000); // 默认 5 秒一切换
  }
};

/**
 * 核心：滚动位置动态同步
 * 原理：在竖排模式 (vertical-rl) 下，内容是从右边缘向左增长的。
 * 此时 scrollLeft 的有效值范围是 [-scrollWidth + clientWidth, 0]。
 * 我们将 scrollLeft 设为极大的负值，能确保视口始终粘着在最左侧（即最新文字产生的地方）。
 */
const autoScroll = (): void => {
  if (isUserInteracting || !scrollContainer.value) return;
  scrollContainer.value.scrollLeft = -scrollContainer.value.scrollWidth;
};

/**
 * iOS Safari 移动端强制重绘修复
 * 原理：在竖排模式下动态追加内容时，iOS Safari 可能不会立即触发重绘
 * 通过读取 offsetHeight 强制浏览器执行同步回流(reflow)，从而触发文字渲染
 * 这是一个已知的 WebKit 渲染 bug 的 workaround
 */
const forceRepaint = (): void => {
  // 仅在 iOS 移动端执行强制重绘，其他平台无需此操作
  if (!isIOSMobile || !scrollContainer.value) return;

  const container = scrollContainer.value;
  // 策略1：强制同步回流
  void container.offsetHeight;
  // 策略2：切换 visibility 强制重绘整个层
  container.style.visibility = "hidden";
  void container.offsetHeight; // 再次触发回流
  container.style.visibility = "visible";
  // 策略3：强制整个文档重绘（最后手段）
  document.body.style.zoom = "1.0001";
  requestAnimationFrame(() => {
    document.body.style.zoom = "1";
  });
};

/**
 * 交互：处理用户手动触摸
 * 当用户滑动查看历史文字时，暂停自动滚动 3 秒，避免“抢夺”视口
 */
const handleTouchStart = (): void => {
  isUserInteracting = true;
  setTimeout(() => {
    isUserInteracting = false;
  }, 3000);
};

/**
 * 工具：基于 Promise 的延迟函数
 */
const wait = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * 工具：等待音频元素播放结束
 * 监听 ended / error / emptied 事件，任一触发即 resolve，防止无限阻塞
 */
const waitForAudioEnd = (audio: HTMLAudioElement): Promise<void> =>
  new Promise((resolve) => {
    // 若音频已经结束或根本没在播放，直接放行
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
  font-family: "STXingkai", "华文行楷", "Xingkai SC", "Weibei SC", "魏碑", "LiSu", "隶书", "STKaiti",
    "华文楷体", "KaiTi", "楷体", "FangSong", "仿宋", serif;
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

.paper-border-inner {
  position: relative;
  height: 100%;
  border: 1vpx solid #a32e2e;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}

.paper-border-inner::-webkit-scrollbar {
  display: none;
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
</style>
