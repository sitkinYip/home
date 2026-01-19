<template>
  <div class="birthday-container">
    <canvas ref="canvasRef"></canvas>
    <div class="space-overlay"></div>

    <!-- 加载状态 -->
    <Transition name="fade">
      <div v-if="isLoading" class="overlay loading-state">
        <div class="star-loader">
          <div class="star-dust"></div>
          <div class="loading-text">正在汇聚星光...</div>
        </div>
      </div>
    </Transition>

    <!-- 错误状态 -->
    <Transition name="fade">
      <div v-if="isError" class="overlay error-state">
        <div class="error-content">
          <div class="void-star">✦</div>
          <h2>星空沉寂</h2>
          <p>这片星域似乎未被点亮<br />或者信使迷失在了银河中</p>
        </div>
      </div>
    </Transition>

    <!-- 正常开始按钮 -->
    <Transition name="fade">
      <div v-if="!started && !isLoading && !isError" class="overlay">
        <div class="start-btn" @click="startNarrative">
          <span>{{ btnText }}</span>
        </div>
      </div>
    </Transition>

    <!-- 这里可以放播放结束后的额外 UI 元件 -->
    <div v-if="showFinalUI" class="final-content">
      <!-- 例如：出现一封信 -->
      <!-- <p class="final-hint">（星空已为你定格）</p> -->
      <LyricsScrolling :data="mySubtitles" :defaultDuration="2500" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import LyricsScrolling from "../components/LyricsScrolling/LyricsScrolling.vue";
import { fetchPhrase } from "@/server/qa";
import type { IphraseItem } from "@/types/qa";

const route = useRoute();
const isLoading = ref(true);
const isError = ref(false);

const btnText = ref("点此 进入属于你的璀璨星空");
const mySubtitles = ref<IphraseItem[]>([]);
const phraseConfig = ref<IphraseItem[]>([]);

const canvasRef = ref<HTMLCanvasElement | null>(null);
const started = ref(false);
const showFinalUI = ref(false); // 控制结束后显示的额外UI

let ctx: CanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let particles: Particle[] = [];
let animationFrame: number | null = null;
let currentTextLines: string[] = [];
let currentAudio: HTMLAudioElement | null = null;

// 初始化数据
const initData = async () => {
  isLoading.value = true;
  isError.value = false;
  try {
    const fromKey = route.query.from as string;
    if (!fromKey) {
      throw new Error("No identity provided");
    }

    const allItems = await fetchPhrase();
    const matchedItem = allItems.find((item) => item.from === fromKey);

    if (matchedItem) {
      phraseConfig.value = matchedItem.phraseList || [];
      mySubtitles.value = matchedItem.takeABowList || [];
      if (matchedItem.title) {
        btnText.value = matchedItem.title;
      }
    } else {
      throw new Error("No matching record found");
    }
  } catch (e) {
    console.warn("Load phrase failed", e);
    isError.value = true;
  } finally {
    isLoading.value = false;
  }
};

// 自定义结束事件
const onAllFinished = () => {
  console.log("所有文案播放完毕");
  showFinalUI.value = true;
  // 你可以在这里写更多逻辑，比如跳转、弹出对话框等
};

const config = {
  particleCount: 2800,
  colors: ["#FFFFFF", "#E1F5FE", "#B3E5FC", "#81D4FA", "#E0F7FA"],
  fontSize: 0,
  lineHeight: 0,
  startY: 0,
};

const mouse = { x: -1000, y: -1000, active: false };
let mouseTimer: any = null;

class Particle {
  x: number = 0;
  y: number = 0;
  destX: number = 0;
  destY: number = 0;
  vx: number = 0;
  vy: number = 0;
  radius: number = 0;
  color: string = "";
  alpha: number = 0;
  isTargeting: boolean = false;
  ease: number = 0;

  constructor() {
    this.init();
  }
  init() {
    this.x = Math.random() * window.innerWidth;
    this.y = Math.random() * window.innerHeight;
    this.destX = this.x;
    this.destY = this.y;
    this.vx = (Math.random() - 0.5) * 1.5;
    this.vy = (Math.random() - 0.5) * 1.5;
    this.radius = Math.random() * 1.4 + 0.2;
    this.color = config.colors[Math.floor(Math.random() * config.colors.length)];
    this.alpha = Math.random() * 0.6 + 0.4;
    this.isTargeting = false;
    this.ease = 0.06 + Math.random() * 0.03;
  }
  update() {
    if (this.isTargeting) {
      this.x += (this.destX - this.x) * this.ease;
      this.y += (this.destY - this.y) * this.ease;
    } else {
      this.x += this.vx;
      this.y += this.vy;
      if (this.x < 0 || this.x > width) this.vx *= -1;
      if (this.y < 0 || this.y > height) this.vy *= -1;
    }
    if (mouse.active) {
      const dx = mouse.x - this.x;
      const dy = mouse.y - this.y;
      if (Math.sqrt(dx * dx + dy * dy) < 60) {
        const angle = Math.atan2(dy, dx);
        this.x -= Math.cos(angle) * 5;
        this.y -= Math.sin(angle) * 5;
      }
    }
  }
  draw() {
    if (!ctx) return;
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 获取文字采样点
const getPixelPoints = (text: string) => {
  const tempCanvas = document.createElement("canvas");
  const tCtx = tempCanvas.getContext("2d");
  if (!tCtx) return [];

  tempCanvas.width = width;
  tempCanvas.height = height;
  const isMobile = width < 768;

  // 移动端粒子数量优化
  if (isMobile) {
    config.particleCount = 1800; // 减少粒子数以提升性能
  }

  // 动态字体大小计算
  let fontSize = isMobile ? Math.floor(width / 8) : 75;
  if (isMobile && text.length > 10) {
    fontSize = Math.floor(width / 10);
  }

  config.fontSize = fontSize;
  tCtx.textBaseline = "middle";
  tCtx.textAlign = "center";
  tCtx.font = `bold ${fontSize}px "PingFang SC", "Microsoft YaHei", sans-serif`;

  // 自动换行逻辑
  // 自动换行与手动换行逻辑
  const maxLineWidth = width * 0.9;
  const lines: string[] = [];

  // 1. 先处理显式的换行符
  // 注意：以防传过来的是转义后的 \n 字符串
  const normalizedText = text.replace(/\\n/g, "\n");
  const manualLines = normalizedText.split("\n");

  manualLines.forEach((segment) => {
    // 2. 对每一行手动换行的文本进行长度检测
    const segmentMetrics = tCtx.measureText(segment);

    // 如果是移动端或者该行超过最大宽度，则进行自动折行
    if (isMobile || segmentMetrics.width > maxLineWidth) {
      // 特殊处理空行（例如连续\n）
      if (segment.length === 0) {
        lines.push("");
        return;
      }

      let currentLine = "";
      for (let i = 0; i < segment.length; i++) {
        const char = segment[i];
        const testLine = currentLine + char;
        const metrics = tCtx.measureText(testLine);

        if (metrics.width > maxLineWidth && currentLine.length > 0) {
          lines.push(currentLine);
          currentLine = char;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
    } else {
      // 既没有超过宽度，也不是移动端强制折行，直接添加
      // 如果 segment 是空的（连续换行），也要 push 一个占位或者空行吗？
      // 原逻辑里 lines 如果有空串可能会导致渲染问题 or empty loop
      // 这里如果 segment 为空串，push 空串会导致 drawText loop 依然执行，可能没效果。
      // 为了支持空行，可能需要确保 lines 里有空串，后续 drawText 时处理。
      // 但粒子系统对于空行没有点，所以只会增加 startY offset。这正好就是空行效果。
      lines.push(segment);
    }
  });

  currentTextLines = lines;
  const lineHeight = fontSize * 1.4;
  config.lineHeight = lineHeight;
  const totalH = lines.length * lineHeight;
  const startY = height / 2 - totalH / 2 + lineHeight / 2;
  config.startY = startY;

  lines.forEach((line, index) => {
    tCtx.strokeText(line, width / 2, startY + index * lineHeight);
    tCtx.fillText(line, width / 2, startY + index * lineHeight);
  });

  const imgData = tCtx.getImageData(0, 0, width, height).data;
  const points = [];
  const step = isMobile ? 2 : 3;

  // 优化采样密度
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      // 提高移动端采样的阈值，减少粒子数，让图形更清晰一点但不过于密集
      const threshold = isMobile ? 150 : 110;
      if (imgData[(y * width + x) * 4 + 3] > threshold) {
        points.push({ x, y });
      }
    }
  }
  return points;
};

// 绘制底层描边底影
const drawTextGhost = () => {
  if (!started.value || currentTextLines.length === 0 || !ctx) return;
  ctx.save();
  ctx.font = `bold ${config.fontSize}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = "rgba(129, 212, 250, 0.12)";
  ctx.lineWidth = 1;
  currentTextLines.forEach((line, index) => {
    ctx!.strokeText(line, width / 2, config.startY + index * config.lineHeight);
  });
  ctx.restore();
};

const animate = () => {
  if (!ctx) return;
  ctx.fillStyle = "#020408";
  ctx.fillRect(0, 0, width, height);
  drawTextGhost();
  particles.forEach((p) => {
    p.update();
    p.draw();
  });
  animationFrame = requestAnimationFrame(animate);
};

// 音频播放逻辑
const playVoice = (path?: string) => {
  if (!path) return;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  currentAudio = new Audio(path);
  currentAudio.play().catch((e) => console.warn("音频播放被拦截:", e));
};

// 核心叙事流程
const startNarrative = async () => {
  if (phraseConfig.value.length === 0) return;

  started.value = true;

  for (let i = 0; i < phraseConfig.value.length; i++) {
    const item = phraseConfig.value[i];

    // 1. 播放音频
    playVoice(item.audio);

    // 2. 汇聚粒子
    const targetPoints = getPixelPoints(item.text);
    const shuffledPoints = targetPoints.sort(() => 0.5 - Math.random());
    particles.forEach((p, idx) => {
      if (idx < shuffledPoints.length) {
        p.destX = shuffledPoints[idx].x;
        p.destY = shuffledPoints[idx].y;
        p.isTargeting = true;
      } else {
        p.isTargeting = false;
        p.vx = (Math.random() - 0.5) * 3;
        p.vy = (Math.random() - 0.5) * 3;
      }
    });

    // 3. 等待展示时长
    await new Promise((r) => setTimeout(r, item.duration || 5000));

    // 4. 判断是否是最后一句且需要保留
    // 这里如果 item 没有 keepLast 属性，TypeScript 可能会提示，注意 interface 定义
    if (i === phraseConfig.value.length - 1) {
      // 默认最后一句保留，或者根据数据
      onAllFinished();
      return;
    }

    // 5. 散开逻辑
    particles.forEach((p) => {
      p.isTargeting = false;
      p.vx = (Math.random() - 0.5) * 12;
      p.vy = (Math.random() - 0.5) * 12;
    });
    await new Promise((r) => setTimeout(r, 1500));
    currentTextLines = [];
  }
};

const handleInteraction = (e: any) => {
  mouse.active = true;
  const pos = e.touches ? e.touches[0] : e;
  mouse.x = pos.clientX;
  mouse.y = pos.clientY;
  clearTimeout(mouseTimer);
  mouseTimer = setTimeout(() => {
    mouse.active = false;
  }, 800);
};

const resize = () => {
  width = window.innerWidth;
  height = window.innerHeight;
  if (canvasRef.value) {
    canvasRef.value.width = width;
    canvasRef.value.height = height;
  }
};

onMounted(() => {
  // 先初始化数据
  initData();

  nextTick(() => {
    if (canvasRef.value) {
      ctx = canvasRef.value.getContext("2d");
      resize();
      // 初始化粒子
      for (let i = 0; i < config.particleCount; i++) {
        particles.push(new Particle());
      }
      animate();
      window.addEventListener("resize", resize);
      window.addEventListener("mousemove", handleInteraction);
      window.addEventListener("touchstart", handleInteraction, { passive: false });
      window.addEventListener("touchmove", handleInteraction, { passive: false });
    }
  });
});

onUnmounted(() => {
  if (animationFrame) cancelAnimationFrame(animationFrame);
  if (currentAudio) currentAudio.pause();
});
</script>

<style scoped>
.birthday-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: #020408;
  overflow: hidden;
  touch-action: none;
}

canvas {
  display: block;
}

.space-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: radial-gradient(circle at 50% 50%, rgba(0, 150, 255, 0.08) 0%, transparent 75%);
  z-index: 1;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.start-btn {
  padding: 16px 45px;
  color: #fff;
  font-weight: 200;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 40px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  letter-spacing: 6px;
  cursor: pointer;
  transition: all 0.5s ease;
}

.start-btn:hover {
  background: rgba(255, 255, 255, 0.15);
  box-shadow: 0 0 20px rgba(135, 206, 250, 0.4);
}

@media (max-width: 768px) {
  .start-btn {
    padding: 12px 30px;
    font-size: 14px;
    letter-spacing: 2px;
    width: 65%;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .void-star {
    font-size: 30px;
  }

  .error-content h2 {
    font-size: 16px;
  }

  .error-content p {
    font-size: 12px;
  }
}

/* Loading State */
.loading-state {
  flex-direction: column;
}
.star-loader {
  position: relative;
  text-align: center;
}
.loading-text {
  margin-top: 15px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  letter-spacing: 4px;
  animation: pulse 2s infinite ease-in-out;
}
.star-dust {
  width: 40px;
  height: 40px;
  margin: 0 auto;
  border-radius: 50%;
  border: 2px solid transparent;
  border-top-color: #81d4fa;
  border-bottom-color: #81d4fa;
  animation: spin 1.5s linear infinite;
  box-shadow: 0 0 15px rgba(129, 212, 250, 0.2);
}

/* Error State */
.error-state .error-content {
  text-align: center;
  color: rgba(255, 255, 255, 0.5);
}
.void-star {
  font-size: 40px;
  color: #546e7a;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}
.error-content h2 {
  font-size: 18px;
  letter-spacing: 6px;
  font-weight: 300;
  margin-bottom: 15px;
}
.error-content p {
  font-size: 13px;
  line-height: 1.6;
  font-weight: 200;
}

.final-content {
  position: absolute;
  bottom: 5%;
  width: 100%;
  text-align: center;
  z-index: 10;
  animation: fadeIn 3s ease forwards;
}

.final-hint {
  color: rgba(255, 255, 255, 0.4);
  font-size: 0.8rem;
  letter-spacing: 2px;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes pulse {
  0%,
  100% {
    opacity: 0.3;
  }
  50% {
    opacity: 0.8;
  }
}
@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

.fade-leave-active {
  transition: opacity 1.5s ease; /* 加快一点消失速度 */
}

.fade-leave-to {
  opacity: 0;
}
</style>
