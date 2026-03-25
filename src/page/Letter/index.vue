<template>
  <div class="letter">
    <!-- 预加载 Loading 遮罩 -->
    <transition name="preload-fade">
      <div v-if="isPreloading && !isError" class="preload-overlay">
        <div class="preload-spinner">
          <div class="preload-ring"></div>
          <p class="preload-text">正在准备信件...</p>
        </div>
      </div>
    </transition>

    <!-- 背景层：模糊处理 -->
    <div class="letter-bg" v-if="currentBg" :style="{ backgroundImage: `url(${currentBg})` }"></div>
    <!-- 遮罩层：降低亮度，增加质感 -->
    <div class="letter-overlay" v-if="currentBg"></div>

    <!-- 错误/迷失状态 -->
    <div v-if="isError" class="lost-container">
      <div class="lost-content">
        <div class="broken-compass">
          <div class="compass-ring"></div>
          <el-icon class="lost-icon"><Compass /></el-icon>
        </div>
        <h1 class="lost-title">信件已遗失</h1>
        <p class="lost-desc">
          寄信人似乎填错了地址，或者这封信早已消散在风中。<br />
          请检查你的来信凭证 (from参数) 是否正确。
        </p>
      </div>
      <div class="void-dust"></div>
    </div>

    <!-- 正常信件展示（预加载完成后才渲染） -->
    <component
      v-else-if="currentLetter && !isPreloading"
      :is="currentComponent"
      v-bind="componentProps"
      class="letter-content-layer"
      @open="handleOpenLetter"
      @close="handleCloseLetter"
    />

    <!-- BGM 浮动控制按钮 -->
    <div
      v-if="!isError && currentLetter?.mainAudio"
      class="bgm-fab"
      :class="{ 'bgm-playing': bgmPlaying }"
      @click="toggleBgm"
      title="背景音乐"
    >
      <div class="bgm-wave" v-if="bgmPlaying"><span></span><span></span><span></span></div>
      <div class="bgm-icon" v-else>♪</div>
    </div>

    <!-- 返回按钮 -->
    <div v-if="returnPath && !isLetterOpened" class="back-fab" @click="goBack" title="返回">
      <span class="back-arrow">&#8249;</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, defineAsyncComponent, provide } from "vue";
import { useRoute, useRouter } from "vue-router";
import { Compass } from "@element-plus/icons-vue";
import { fetchLetter } from "@/server/qa";
import type { TLetterecord } from "@/types/qa";

let bgmAudio: HTMLAudioElement | null = null;
const bgmPlaying = ref(false); // BGM 是否正在播放
const isPreloading = ref(true); // 资源预加载状态

/**
 * 组件动态导入函数（保留引用以便预加载时直接调用）
 */
const importAncientEnvelope = () => import("../../components/AncientEnvelope/AncientEnvelope.vue");
const importLetterComponent = () => import("../../components/LetterComponent/LetterComponent.vue");
const importMagicLetter = () => import("../../components/MagicLetter/MagicLetter.vue");

const AncientEnvelope = defineAsyncComponent(importAncientEnvelope);
const LetterComponent = defineAsyncComponent(importLetterComponent);
const MagicLetter = defineAsyncComponent(importMagicLetter);

const route = useRoute();
const router = useRouter();

const isLetterOpened = ref(false); // 跟踪信件是否展开，用于控制返回按钮显示

/**
 * 来源路由：优先读 returnTo 参数，fallback 到 history.state.back
 * 只有存在来源时才显示返回按钮
 */
const returnPath = computed<string | null>(() => {
  const fromQuery = route.query.returnTo as string | undefined;
  if (fromQuery) return decodeURIComponent(fromQuery);
  const stateBack = window.history.state?.back as string | undefined;
  return stateBack || null;
});

/**
 * 返回来源页
 */
const goBack = () => {
  if (returnPath.value) {
    router.replace(returnPath.value);
  }
};

const isError = ref(false);
const allLetters = ref<TLetterecord[]>([]);
const CACHE_KEY = "letter_records_cache";

/**
 * 获取当前匹配的信件数据
 */
const currentLetter = computed(() => {
  const fromKey = route.query.from as string;
  if (!fromKey) return null;
  return allLetters.value.find((item) => item.from === fromKey) || null;
});

/**
 * 动态组件决定渲染哪种信封
 */
const currentComponent = computed(() => {
  if (!currentLetter.value) return null;
  switch (currentLetter.value.type) {
    case "classical":
      return AncientEnvelope;
    case "magic":
      return MagicLetter;
    default:
      return LetterComponent;
  }
});

/**
 * 页面大背景图
 */
const currentBg = computed(() => {
  return currentLetter.value?.bgImg || "";
});

/**
 * 传递给组件的 Props
 */
const componentProps = computed<any>(() => {
  const letter = currentLetter.value;
  if (!letter) return {};

  return {
    paragraphs: letter.paragraphConfigList,
    images: letter.bgImages || [], // 信纸背景轮播
    speed: letter.speed || 100,
    hintText: letter.hintText || (letter.type === "classical" ? "亲启" : "点击开启"),
    title: letter.title,
    desc: letter.desc,
    sealText: (letter.title && letter.title[0]) || (letter.hintText && letter.hintText[0]) || "✦",
    // Modern 组件特有
    styleType: letter.type === "modern" ? "modern" : undefined,
  };
});

/**
 * 预加载单张图片，返回 Promise
 * 加载失败时静默 resolve，不阻塞整体流程
 */
const preloadImage = (url: string): Promise<void> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => resolve();
    img.src = url;
  });

/**
 * 预加载单个音频的 metadata，返回 Promise
 * 带 5 秒超时保护（iOS Safari 可能不触发 loadedmetadata）
 */
const preloadAudioMetadata = (url: string): Promise<void> =>
  new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = "metadata";
    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      audio.onloadedmetadata = null;
      audio.onerror = null;
      resolve();
    };
    const timer = setTimeout(settle, 5000);
    audio.onloadedmetadata = () => {
      clearTimeout(timer);
      settle();
    };
    audio.onerror = () => {
      clearTimeout(timer);
      settle();
    };
    audio.src = url;
  });

/**
 * 预加载当前信件所需的所有资源：
 * 阶段 1：先并行预加载所有媒体资源（图片 + 音频 metadata），让浏览器缓存就绪
 * 阶段 2：再加载对应的异步组件 JS chunk
 * 这样组件渲染时内部的 getAudioDuration / Image 都能直接命中缓存，
 * 大幅减少 iOS Safari 因资源未就绪导致打字机卡住的概率
 */
const preloadLetterAssets = async (letter: TLetterecord): Promise<void> => {
  // ── 阶段 1：并行预加载所有媒体资源 ──
  const mediaTasks: Promise<unknown>[] = [];

  // 收集所有图片 URL（去重）
  const imageUrls = new Set<string>();
  if (letter.bgImg) imageUrls.add(letter.bgImg);
  if (letter.bgImages) {
    letter.bgImages.forEach((url) => imageUrls.add(url));
  }
  imageUrls.forEach((url) => mediaTasks.push(preloadImage(url)));

  // 收集所有音频 URL（去重）
  const audioUrls = new Set<string>();
  if (letter.mainAudio) audioUrls.add(letter.mainAudio);
  if (letter.paragraphConfigList) {
    letter.paragraphConfigList.forEach((p) => {
      if (p.audio) audioUrls.add(p.audio);
    });
  }
  audioUrls.forEach((url) => mediaTasks.push(preloadAudioMetadata(url)));

  // 等待所有媒体资源加载完毕（allSettled 确保单个失败不阻塞）
  await Promise.allSettled(mediaTasks);

  // ── 阶段 2：媒体就绪后再加载异步组件 chunk ──
  switch (letter.type) {
    case "classical":
      await importAncientEnvelope();
      break;
    case "magic":
      await importMagicLetter();
      break;
    default:
      await importLetterComponent();
      break;
  }
};

/**
 * 初始化数据：缓存优先策略 + 资源预加载
 */
const initData = async () => {
  isPreloading.value = true;

  // 1. 尝试读取缓存
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      allLetters.value = JSON.parse(cachedData);
      checkErrorState();
    }
  } catch (e) {
    console.error("读取缓存失败", e);
  }

  // 2. 网络请求更新
  try {
    const remoteItems = await fetchLetter();
    if (remoteItems && remoteItems.length > 0) {
      const isChanged = JSON.stringify(remoteItems) !== JSON.stringify(allLetters.value);

      if (isChanged) {
        allLetters.value = remoteItems;
        localStorage.setItem(CACHE_KEY, JSON.stringify(remoteItems));
        checkErrorState();
      }
    } else {
      if (allLetters.value.length === 0) {
        isError.value = true;
      }
    }
  } catch (err) {
    console.error("Fetch letter failed", err);
    if (allLetters.value.length === 0) {
      isError.value = true;
    }
  }

  // 3. 预加载当前信件的所有资源
  if (currentLetter.value && !isError.value) {
    await preloadLetterAssets(currentLetter.value);
  }

  // 4. 预加载完成，关闭 loading
  isPreloading.value = false;
};

/**
 * 检查是否需要显示错误页
 */
const checkErrorState = () => {
  // 如果没有 from 参数，直接错误
  if (!route.query.from) {
    isError.value = true;
    return;
  }
  // 如果有数据但找不到对应的信，显示错误
  if (allLetters.value.length > 0 && !currentLetter.value) {
    isError.value = true;
    return;
  }
  // 如果找到了，确保错误状态关闭
  if (currentLetter.value) {
    isError.value = false;
  }
};

/**
 * 处理开信事件：播放 BGM (解锁移动端音频限制)
 */
const handleOpenLetter = () => {
  isLetterOpened.value = true;

  const letter = currentLetter.value;
  if (!letter || !letter.mainAudio) return;

  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio = null;
  }

  bgmAudio = new Audio(letter.mainAudio);
  bgmAudio.loop = true;
  bgmAudio.volume = 0.15; // BGM 正常音量（段落音频播放时会被动态压制）
  bgmAudio.play().catch((e) => console.warn("BGM播放被拦截:", e));
  bgmPlaying.value = true;
};

/**
 * 处理收起信件事件：重置状态并停止 BGM
 */
const handleCloseLetter = () => {
  isLetterOpened.value = false;
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio = null;
    bgmPlaying.value = false;
  }
};

onMounted(() => {
  initData();
});

/**
 * 切换 BGM 播放/暂停
 */
const toggleBgm = () => {
  if (!bgmAudio) return;
  if (bgmPlaying.value) {
    bgmAudio.pause();
    bgmPlaying.value = false;
  } else {
    bgmAudio.play().catch((e) => console.warn("BGM播放被拦截:", e));
    bgmPlaying.value = true;
  }
};

/**
 * 向子组件提供 BGM 动态压制 / 恢复接口
 * 段落音频开始时调用 suppressBgm()，结束后调用 restoreBgm()
 * 用于解决 iOS / 微信双音轨人声互相掩盖的问题
 */
const BGM_DUCK_VOLUME = 0.02; // 压制时的音量（几乎静音）
const BGM_NORMAL_VOLUME = 0.5; // 正常音量

const suppressBgm = () => {
  if (bgmAudio && bgmPlaying.value) {
    bgmAudio.volume = BGM_DUCK_VOLUME;
  }
};
const restoreBgm = () => {
  if (bgmAudio) {
    bgmAudio.volume = BGM_NORMAL_VOLUME;
  }
};

provide("suppressBgm", suppressBgm);
provide("restoreBgm", restoreBgm);

onUnmounted(() => {
  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio = null;
  }
});
</script>

<style lang="scss" scoped>
.letter {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  font-size: 14px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: Roboto, "RiiTegakiFude", sans-serif;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  /* 默认背景色，以此防背景图加载前的白屏 */
  background-color: #f0f2f5;
}

.letter-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(8px) brightness(0.9);
  transform: scale(1.1); /* 放大一点避免边缘白边 */
  z-index: 1;
}

.letter-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.2); /* 轻微暗色遮罩 */
  backdrop-filter: blur(2px); /* 额外的毛玻璃质感 */
  z-index: 2;
}

.letter-content-layer {
  position: relative;
  z-index: 3;
}

/* 复用 AdventureLost 的样式风格 */
$magic-gold: #ffd700;

.lost-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 10;
  position: relative;
  width: 100%;
  height: 100%;
  /* 既然父级已经可能有背景图，这里可以用半透明遮罩叠加，或者直接不设背景只居中 */
  background: rgba(26, 15, 46, 0.85);
  backdrop-filter: blur(10px);
}

.lost-content {
  position: relative;
  z-index: 2;
  animation: fade-in 1s ease-out;
  padding: 0 40px;
}

.broken-compass {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 30px;
  display: flex;
  align-items: center;
  justify-content: center;

  .compass-ring {
    position: absolute;
    inset: 0;
    border: 2px dashed rgba($magic-gold, 0.3);
    border-radius: 50%;
    animation: rotate 15s linear infinite;
  }

  .lost-icon {
    font-size: 60px;
    color: rgba($magic-gold, 0.5);
    filter: drop-shadow(0 0 15px rgba($magic-gold, 0.3));
  }
}

.lost-title {
  color: $magic-gold;
  font-size: 24px;
  letter-spacing: 4px;
  margin-bottom: 20px;
  text-shadow: 0 0 10px rgba($magic-gold, 0.4);
}

.lost-desc {
  color: rgba(255, 255, 255, 0.6);
  font-size: 15px;
  line-height: 1.8;
  margin-bottom: 40px;
}

.void-dust {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(white, transparent 2px);
  background-size: 50px 50px;
  opacity: 0.1;
  animation: dust-move 20s linear infinite;
  pointer-events: none;
}

@keyframes rotate {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes dust-move {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-500px);
  }
}
/* BGM 浮动控制按钮 */
.bgm-fab {
  position: fixed;
  bottom: 24vpx;
  right: 20vpx;
  z-index: 9999;
  width: 36vpx;
  height: 36vpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1vpx solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.3s ease,
    transform 0.2s ease;
  user-select: none;
}

.bgm-fab:hover {
  background: rgba(0, 0, 0, 0.45);
  transform: scale(1.08);
}

.bgm-fab:active {
  transform: scale(0.94);
}

/* 暂停状态图标 */
.bgm-icon {
  font-size: 15vpx;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1;
}

/* 播放中：波形动画 */
.bgm-wave {
  display: flex;
  align-items: flex-end;
  gap: 2vpx;
  height: 14vpx;
}

.bgm-wave span {
  display: inline-block;
  width: 3vpx;
  border-radius: 2vpx;
  background: rgba(255, 255, 255, 0.55);
  animation: bgm-bar 1s ease-in-out infinite;
}

.bgm-wave span:nth-child(1) {
  height: 6vpx;
  animation-delay: 0s;
}
.bgm-wave span:nth-child(2) {
  height: 14vpx;
  animation-delay: 0.2s;
}
.bgm-wave span:nth-child(3) {
  height: 8vpx;
  animation-delay: 0.4s;
}

@keyframes bgm-bar {
  0%,
  100% {
    transform: scaleY(0.5);
    opacity: 0.6;
  }
  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}
/* 返回按钮 */
.back-fab {
  position: fixed;
  top: 20vpx;
  left: 20vpx;
  z-index: 9999;
  width: 36vpx;
  height: 36vpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.28);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1vpx solid rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 0.3s ease,
    transform 0.2s ease;
  user-select: none;
}

.back-fab:hover {
  background: rgba(0, 0, 0, 0.45);
  transform: scale(1.08);
}

.back-fab:active {
  transform: scale(0.94);
}

.back-arrow {
  font-size: 22vpx;
  line-height: 1;
  color: rgba(255, 255, 255, 0.55);
  margin-right: 2vpx;
  font-weight: 300;
}

/* 预加载遮罩 */
.preload-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  display: flex;
  justify-content: center;
  align-items: center;
}

.preload-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24vpx;
}

.preload-ring {
  width: 48vpx;
  height: 48vpx;
  border: 2vpx solid rgba(255, 255, 255, 0.1);
  border-top-color: rgba(255, 255, 255, 0.7);
  border-radius: 50%;
  animation: preload-spin 1s linear infinite;
}

.preload-text {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14vpx;
  letter-spacing: 4vpx;
  margin: 0;
}

@keyframes preload-spin {
  to {
    transform: rotate(360deg);
  }
}

/* 预加载遮罩淡出过渡 */
.preload-fade-leave-active {
  transition: opacity 0.6s ease;
}

.preload-fade-leave-to {
  opacity: 0;
}
</style>
