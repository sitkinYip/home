<template>
  <div class="birthday-container">
    <canvas ref="canvasRef"></canvas>

    <!-- 空间暗角遮罩，增加氛围感 -->
    <div class="space-overlay"></div>

    <!-- 状态 1: 加载中 -->
    <Transition name="fade">
      <LoadingState v-if="isLoading" />
    </Transition>

    <!-- 状态 2: 错误 -->
    <Transition name="fade">
      <ErrorState v-if="isError" />
    </Transition>

    <!-- 状态 3: 开始按钮 -->
    <Transition name="fade">
      <StartButton
        v-if="!started && !isLoading && !isError"
        :text="btnText"
        @start="startNarrative"
      />
    </Transition>

    <!-- 状态 4: 播放结束后的额外 UI -->
    <div v-if="showFinalUI" class="final-content">
      <LyricsScrolling :data="mySubtitles" :defaultDuration="2500" />
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @file index.vue
 * @description Bless 页面主入口，负责编排动画流程、初始化数据和管理 Canvas 渲染循环
 */

import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { useRoute } from "vue-router";
import LyricsScrolling from "../../components/LyricsScrolling/LyricsScrolling.vue"; // 相对路径引用上一级 components
import { fetchPhrase } from "@/server/qa";
import type { IphraseItem } from "@/types/qa";

// 引入模块化后的逻辑
import { PARTICLE_CONFIG } from "./constants";
import { Particle } from "./classes/Particle";
import { BgStar, ShootingStar } from "./classes/Star";
import { getPixelPoints } from "./utils/canvasUtils";
import { MouseState } from "./types";

// 引入组件
import LoadingState from "./components/LoadingState.vue";
import ErrorState from "./components/ErrorState.vue";
import StartButton from "./components/StartButton.vue";

const route = useRoute();

// --- 状态管理 ---
const isLoading = ref(true);
const isError = ref(false);
const started = ref(false);
const showFinalUI = ref(false);

const btnText = ref("点此 进入属于你的璀璨星空");
const mySubtitles = ref<IphraseItem[]>([]);
const phraseConfig = ref<IphraseItem[]>([]);

// --- Canvas 相关 ---
const canvasRef = ref<HTMLCanvasElement | null>(null);
let ctx: CanvasRenderingContext2D | null = null;
let width = 0;
let height = 0;
let animationFrame: number | null = null;

// --- 实体对象 ---
let particles: Particle[] = [];
let bgStars: BgStar[] = [];
let shootingStars: ShootingStar[] = [];
let currentTextLines: string[] = [];
let currentAudio: HTMLAudioElement | null = null;

// 交互状态
const mouse: MouseState = { x: -1000, y: -1000, active: false };
let mouseTimer: any = null;

/**
 * 初始化数据逻辑
 * 从 URL 获取 ID 并拉取数据
 */
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

/**
 * 所有叙事结束后的回调
 */
const onAllFinished = () => {
  console.log("所有文案播放完毕");
  showFinalUI.value = true;
};

/**
 * 绘制底层的文字残影（Glowing Effect）
 */
const drawTextGhost = () => {
  if (!started.value || currentTextLines.length === 0 || !ctx) return;
  ctx.save();
  // 使用更优雅的衬线体
  ctx.font = `bold ${PARTICLE_CONFIG.fontSize}px "Songti SC", "SimSun", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "rgba(129, 212, 250, 0.3)";
  ctx.strokeStyle = "rgba(129, 212, 250, 0.08)";
  ctx.lineWidth = 1;
  currentTextLines.forEach((line, index) => {
    ctx!.strokeText(line, width / 2, PARTICLE_CONFIG.startY + index * PARTICLE_CONFIG.lineHeight);
  });
  ctx.restore();
};

/**
 * 核心动画循环
 */
const animate = () => {
  if (!ctx) return;
  // 清空画布 (保持透明以显示 CSS 背景)
  ctx.clearRect(0, 0, width, height);

  // 1. 绘制背景星星
  bgStars.forEach((star) => {
    star.update();
    star.draw(ctx);
  });

  // 2. 绘制流星
  if (Math.random() < 0.015) {
    // 约 1.5% 概率每帧生成流星
    shootingStars.push(new ShootingStar(width, height));
  }
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    shootingStars[i].update();
    shootingStars[i].draw(ctx);
    if (shootingStars[i].dead) {
      shootingStars.splice(i, 1);
    }
  }

  // 3. 绘制文字残影
  drawTextGhost();

  // 4. 绘制粒子
  particles.forEach((p) => {
    p.update(mouse);
    p.draw(ctx);
  });

  animationFrame = requestAnimationFrame(animate);
};

/**
 * 播放音频辅助函数
 */
const playVoice = (path?: string) => {
  if (!path) return;
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  currentAudio = new Audio(path);
  currentAudio.play().catch((e) => console.warn("音频播放被拦截:", e));
};

/**
 * 开始叙事流程
 * 核心逻辑：按顺序播放每一句 -> 音频 -> 粒子汇聚 -> 等待 -> 粒子散开
 */
const startNarrative = async () => {
  if (phraseConfig.value.length === 0) return;

  started.value = true;

  for (let i = 0; i < phraseConfig.value.length; i++) {
    const item = phraseConfig.value[i];

    // 1. 播放音频
    playVoice(item.audio);

    // 2. 计算文字点集并设置粒子目标
    const result = getPixelPoints(item.text, width, height, PARTICLE_CONFIG);
    const targetPoints = result.points;
    currentTextLines = result.lines; // 用于 Ghost 绘制

    // 随机打乱目标点，让汇聚过程更自然错落
    const shuffledPoints = targetPoints.sort(() => 0.5 - Math.random());

    particles.forEach((p, idx) => {
      if (idx < shuffledPoints.length) {
        p.destX = shuffledPoints[idx].x;
        p.destY = shuffledPoints[idx].y;
        p.isTargeting = true;
        // 每次重新汇聚都重置缓动系数，产生错落感
        p.ease = 0.05 + Math.random() * 0.05;
      } else {
        // 多余的粒子让它在背景里漂浮
        p.isTargeting = false;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vy = (Math.random() - 0.5) * 0.5;
      }
    });

    // 3. 等待展示时长
    await new Promise((r) => setTimeout(r, item.duration || 5000));

    // 4. 判断是否是最后一句且需要保留
    if (i === phraseConfig.value.length - 1) {
      onAllFinished();
      return;
    }

    // 5. 散开逻辑
    particles.forEach((p) => {
      p.isTargeting = false;
      // 散开时稍微轻柔一点
      p.vx = (Math.random() - 0.5) * 4;
      p.vy = (Math.random() - 0.5) * 4;
    });
    // 稍微等待粒子散开后再进行下一句
    await new Promise((r) => setTimeout(r, 1200));
    currentTextLines = [];
  }
};

/**
 * 鼠标/触摸交互处理
 */
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

/**
 * 窗口大小调整处理
 */
const resize = () => {
  width = window.innerWidth;
  height = window.innerHeight;
  if (canvasRef.value) {
    canvasRef.value.width = width;
    canvasRef.value.height = height;
  }
  // 重新初始化背景星星以覆盖新区域
  bgStars = [];
  for (let i = 0; i < 300; i++) {
    bgStars.push(new BgStar(width, height));
  }
};

onMounted(() => {
  initData();

  nextTick(() => {
    if (canvasRef.value) {
      ctx = canvasRef.value.getContext("2d");
      resize();

      // 初始化粒子池
      for (let i = 0; i < PARTICLE_CONFIG.particleCount; i++) {
        particles.push(new Particle(width, height));
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
  window.removeEventListener("resize", resize);
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500&family=Playfair+Display:ital@1&display=swap");

.birthday-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  /* Deep Space Gradient: 深邃宇宙背景 */
  background: radial-gradient(ellipse at bottom, #1b2735 0%, #090a0f 100%);
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
  /* Vignette Effect: 四周暗角 */
  background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
  z-index: 1;
}

.final-content {
  position: absolute;
  bottom: 8%;
  width: 100%;
  text-align: center;
  z-index: 10;
  animation: fadeIn 3s ease forwards;
}

.fade-leave-active {
  transition: opacity 1.5s cubic-bezier(0.22, 1, 0.36, 1);
}

.fade-leave-to {
  opacity: 0;
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
</style>
