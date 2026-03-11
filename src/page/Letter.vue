<template>
  <div class="letter">
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

    <!-- 正常信件展示 -->
    <component
      v-else-if="currentLetter"
      :is="currentComponent"
      v-bind="componentProps"
      class="letter-content-layer"
      @open="handleOpenLetter"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, defineAsyncComponent } from "vue";
import { useRoute } from "vue-router";
import { Compass } from "@element-plus/icons-vue";
import { fetchLetter } from "@/server/qa";
import type { TLetterecord } from "@/types/qa";

let bgmAudio: HTMLAudioElement | null = null;

const AncientEnvelope = defineAsyncComponent(
  () => import("../components/AncientEnvelope/AncientEnvelope.vue"),
);
const LetterComponent = defineAsyncComponent(
  () => import("../components/LetterComponent/LetterComponent.vue"),
);
const MagicLetter = defineAsyncComponent(() => import("../components/MagicLetter/MagicLetter.vue"));

const route = useRoute();
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
    // Modern 组件特有
    styleType: letter.type === "modern" ? "modern" : undefined,
  };
});

/**
 * 初始化数据：缓存优先策略
 */
const initData = async () => {
  // 1. 尝试读取缓存
  try {
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      allLetters.value = JSON.parse(cachedData);
      checkErrorState(); // 有缓存先展示
    }
  } catch (e) {
    console.error("读取缓存失败", e);
  }

  // 2. 网络请求更新
  try {
    const remoteItems = await fetchLetter();
    if (remoteItems && remoteItems.length > 0) {
      // 简单的深比较或直接覆盖，这里选择直接覆盖并更新缓存，只要有数据
      // 实际生产中如果数据量大可以做 diff，但这里量小
      const isChanged = JSON.stringify(remoteItems) !== JSON.stringify(allLetters.value);

      if (isChanged) {
        allLetters.value = remoteItems;
        localStorage.setItem(CACHE_KEY, JSON.stringify(remoteItems));
        checkErrorState(); // 数据更新后再次检查状态
      }
    } else {
      // 如果接口挂了或者返回空，且本地也没有数据，那才算真正的 Error
      if (allLetters.value.length === 0) {
        isError.value = true;
      }
    }
  } catch (err) {
    console.error("Fetch letter failed", err);
    // 网络错误时，如果本地无缓存，显示错误页
    if (allLetters.value.length === 0) {
      isError.value = true;
    }
  }
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
  const letter = currentLetter.value;
  if (!letter || !letter.mainAudio) return;

  if (bgmAudio) {
    bgmAudio.pause();
    bgmAudio = null;
  }

  bgmAudio = new Audio(letter.mainAudio);
  bgmAudio.loop = true;
  bgmAudio.volume = 0.3; // BGM 音量降低
  bgmAudio.play().catch((e) => console.warn("BGM播放被拦截:", e));
};

onMounted(() => {
  initData();
});

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
</style>
