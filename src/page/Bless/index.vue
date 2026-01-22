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
    <div v-if="showFinalUI" class="final-content" ref="finalUiRef">
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
import LyricsScrolling from "../../components/LyricsScrolling/LyricsScrolling.vue";
import { fetchPhrase } from "@/server/qa";
import type { IphraseItem } from "@/types/qa";
import gsap from "gsap"; // 引入 GSAP

// 引入模块化后的逻辑
import { PARTICLE_CONFIG } from "./constants";
import { Particle } from "./classes/Particle";
import { BgStar, ShootingStar, Planet, Nebula } from "./classes/Star";
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
const finalUiRef = ref<HTMLElement | null>(null);

const btnText = ref("点此 进入属于你的璀璨星空");
const mySubtitles = ref<IphraseItem[]>([]);
const phraseConfig = ref<IphraseItem[]>([]);
const mainAudioUrl = ref("");

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
let planets: Planet[] = [];
let nebulas: Nebula[] = [];
let currentTextLines: string[] = [];
let currentAudio: HTMLAudioElement | null = null;
let bgmAudio: HTMLAudioElement | null = null;

// 交互状态
const mouse: MouseState = { x: -1000, y: -1000, active: false };
const parallax = { x: 0, y: 0 }; // 视差偏移量
let mouseTimer: any = null;

/**
 * 初始化数据逻辑
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
      if (matchedItem.mainAudio) {
        mainAudioUrl.value = matchedItem.mainAudio;
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
  // 使用 GSAP 优雅入场
  nextTick(() => {
    if (finalUiRef.value) {
      gsap.fromTo(
        finalUiRef.value,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 2, ease: "power2.out" },
      );
    }
  });
};

/**
 * 绘制底层的文字残影（Glowing Effect）
 */
const drawTextGhost = () => {
  if (!started.value || currentTextLines.length === 0 || !ctx) return;
  ctx.save();
  // 视差层级：文字层跟随粒子，设定为 0.05
  ctx.translate(parallax.x * 0.05, parallax.y * 0.05);

  // 使用更优雅的衬线体
  ctx.font = `bold ${PARTICLE_CONFIG.fontSize}px "Cinzel", "Songti SC", "SimSun", serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  // 增强辉光
  ctx.shadowBlur = 30;
  ctx.shadowColor = "rgba(135, 206, 250, 0.4)";
  ctx.strokeStyle = "rgba(135, 206, 250, 0.05)";
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
  // 清空画布
  ctx.clearRect(0, 0, width, height);

  // 0. 绘制背景层 (星球 & 星云) - 视差极小 (0.01)
  ctx.save();
  ctx.translate(parallax.x * 0.01, parallax.y * 0.01);

  // 绘制星云
  nebulas.forEach((n) => {
    n.update();
    n.draw(ctx);
  });

  // 绘制星球
  planets.forEach((p) => {
    p.draw(ctx);
  });
  ctx.restore();

  // 1. 绘制背景星星 (视差系数 0.02 - 极远)
  ctx.save();
  ctx.translate(parallax.x * 0.02, parallax.y * 0.02);
  bgStars.forEach((star) => {
    star.update();
    star.draw(ctx);
  });
  ctx.restore();

  // 2. 绘制流星 (视差系数 0.04 - 较远)
  ctx.save();
  ctx.translate(parallax.x * 0.04, parallax.y * 0.04);
  if (Math.random() < 0.02) {
    // 稍微提高概率
    shootingStars.push(new ShootingStar(width, height));
  }
  for (let i = shootingStars.length - 1; i >= 0; i--) {
    shootingStars[i].update();
    shootingStars[i].draw(ctx);
    if (shootingStars[i].dead) {
      shootingStars.splice(i, 1);
    }
  }
  ctx.restore();

  // 3. 绘制文字残影 (内部有自己的 save/restore)
  drawTextGhost();

  // 4. 绘制粒子 (视差系数 0.05 - 中景)
  ctx.save();
  ctx.translate(parallax.x * 0.05, parallax.y * 0.05);
  particles.forEach((p) => {
    p.update(mouse);
    p.draw(ctx);
  });
  ctx.restore();

  // 缓动更新视差值
  if (mouse.active) {
    const targetParallaxX = (mouse.x - width / 2) * 0.5;
    const targetParallaxY = (mouse.y - height / 2) * 0.5;
    parallax.x += (targetParallaxX - parallax.x) * 0.05;
    parallax.y += (targetParallaxY - parallax.y) * 0.05;
  } else {
    // 鼠标离开时缓慢回正
    parallax.x += (0 - parallax.x) * 0.05;
    parallax.y += (0 - parallax.y) * 0.05;
  }

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
 */
const startNarrative = async () => {
  if (phraseConfig.value.length === 0) return;

  started.value = true;

  // 隐藏按钮后，先等待一小会，让用户沉浸在星空移动中
  await new Promise((r) => setTimeout(r, 800));

  // 0. 尝试播放 BGM (如果存在)
  if (mainAudioUrl.value) {
    if (bgmAudio) {
      bgmAudio.pause();
      bgmAudio = null;
    }
    bgmAudio = new Audio(mainAudioUrl.value);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.3; // BGM 音量降低
    bgmAudio.play().catch((e) => console.warn("BGM播放被拦截:", e));
  }

  for (let i = 0; i < phraseConfig.value.length; i++) {
    const item = phraseConfig.value[i];

    // 1. 播放音频
    playVoice(item.audio);

    // 2. 计算文字点集并设置粒子目标
    const result = getPixelPoints(item.text, width, height, PARTICLE_CONFIG);
    const targetPoints = result.points;
    currentTextLines = result.lines;

    const shuffledPoints = targetPoints.sort(() => 0.5 - Math.random());

    particles.forEach((p, idx) => {
      if (idx < shuffledPoints.length) {
        p.destX = shuffledPoints[idx].x;
        p.destY = shuffledPoints[idx].y;
        p.isTargeting = true;
        p.ease = 0.03 + Math.random() * 0.04; // 稍微调慢一点汇聚速度，更优雅
      } else {
        p.isTargeting = false;
        p.vx = (Math.random() - 0.5) * 0.5;
        p.vy = (Math.random() - 0.5) * 0.5;
      }
    });

    // 3. 等待展示时长
    await new Promise((r) => setTimeout(r, item.duration || 5000));

    // 4. 判断是否是最后一句
    if (i === phraseConfig.value.length - 1) {
      onAllFinished();
      return;
    }

    // 5. 散开逻辑
    particles.forEach((p) => {
      p.isTargeting = false;
      p.vx = (Math.random() - 0.5) * 3;
      p.vy = (Math.random() - 0.5) * 3;
    });

    // 6. 稍微等待粒子散开
    await new Promise((r) => setTimeout(r, 1500));
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
  }, 2000); // 增加空闲判定时间，保持视差
};

const resize = () => {
  width = window.innerWidth;
  height = window.innerHeight;
  if (canvasRef.value) {
    canvasRef.value.width = width;
    canvasRef.value.height = height;
  }
  bgStars = [];
  for (let i = 0; i < 300; i++) {
    bgStars.push(new BgStar(width, height));
  }

  // 初始化星球 (1个)
  planets = [];
  planets.push(new Planet(width, height));

  // 初始化星云 (3-5个)
  nebulas = [];
  for (let i = 0; i < 4; i++) {
    nebulas.push(new Nebula(width, height));
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
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio = null;
  }
  window.removeEventListener("resize", resize);
});
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500;700&family=Playfair+Display:ital@0;1&display=swap");

.birthday-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  /* Deep Space Gradient: 升级后的深邃星云背景 */
  background: radial-gradient(circle at 50% 120%, #0b1026 10%, #000000 70%),
    radial-gradient(ellipse at 80% 20%, rgba(20, 30, 60, 0.4) 0%, transparent 50%),
    radial-gradient(ellipse at 20% 80%, rgba(40, 20, 60, 0.3) 0%, transparent 50%),
    linear-gradient(to bottom, #000000 0%, #090a0f 100%);
  background-blend-mode: screen, screen, normal;
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
  /* Vignette Effect + Subtle Noise Texture: 暗角与噪点 */
  background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.6) 100%),
    url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.04'/%3E%3C/svg%3E");
  z-index: 1;
}

.final-content {
  position: absolute;
  bottom: 8%;
  width: 100%;
  text-align: center;
  z-index: 10;
  opacity: 0; /* 初始隐藏，由 GSAP 控制 */
}

/* 移除旧的 fade 动画，改用 GSAP */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 1s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
