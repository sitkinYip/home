<template>
  <!-- 多题模式 -->
  <div id="Questions" v-if="isMultiMode">
    <!-- 数据加载完成且有关卡数据 -->
    <div v-if="multiLevels.length > 0" class="adventure-container multi-quest-container">
      <!-- 动态背景层 -->
      <div class="magic-bg" :style="mainBgImgStyle"></div>
      <div class="overlay"></div>

      <div class="quest-swiper-wrapper">
        <!-- 进度指示器 -->
        <div class="quest-progress-bar">
          <div class="progress-track">
            <div
              class="progress-fill"
              :style="{ width: `${(completedCount / multiLevels.length) * 100}%` }"
            ></div>
          </div>
          <span class="progress-label">{{ completedCount }} / {{ multiLevels.length }}</span>
        </div>

        <Swiper
          ref="swiperRef"
          :slides-per-view="swiperSlidesPerView"
          :centered-slides="true"
          :space-between="swiperSpaceBetween"
          :grab-cursor="true"
          :allow-touch-move="true"
          :allow-slide-next="canSlideNext"
          @swiper="onSwiperInit"
          @slide-change="onSlideChange"
          class="quest-swiper"
        >
          <SwiperSlide v-for="(level, index) in multiLevels" :key="level.step" class="quest-slide">
            <div
              class="quest-slide-inner"
              :class="{
                'is-active': activeSlideIndex === index,
                'is-completed': completedSteps.has(level.step),
              }"
            >
              <!-- 关卡序号徽章 -->
              <div class="slide-badge">
                <span class="badge-step">{{ index + 1 }}</span>
                <el-icon v-if="completedSteps.has(level.step)" class="badge-check">
                  <Select />
                </el-icon>
              </div>

              <QuestPage
                :compact="true"
                :level-data="level"
                :prop-step="level.step"
                :prop-user-id="userId"
                @bin-go="handleBinGo"
              />
            </div>
          </SwiperSlide>
        </Swiper>

        <!-- 答对后滑动提示 -->
        <SwipeHint :show="showSwipeHint" @dismiss="showSwipeHint = false" />
      </div>

      <!-- 多题通关特效 -->
      <MultiQuestAura ref="multiAuraRef" @close="handleAuraClose" />

      <!-- 多题线索弹窗 -->
      <MultiQuestClueModal ref="multiClueModalRef" @closed="handleClueModalClosed" />

      <!-- 多题线索复用悬浮按钮 -->
      <MultiQuestClueFloat :visible="showMultiClueFloat" @open="openClueModal" />

      <!-- 背景音乐授权提示 -->
      <BgmAuthHint
        :visible="bgm.showAuthHint.value"
        @authorize="bgm.authorize"
        @dismiss="bgm.dismissAuthHint"
      />

      <!-- 背景音乐悬浮控制球 -->
      <BgmFloatButton
        :visible="bgm.hasBgm.value"
        :is-playing="bgm.isPlaying.value"
        @toggle="bgm.toggle"
      />
    </div>

    <!-- 迷失状态（关卡找不到或接口失败） -->
    <AdventureLost
      v-else-if="questionsStore.isLost"
      :has-first-step="questionsStore.hasFirstStep"
    />

    <!-- 加载中 -->
    <div v-else class="loading-screen">
      <div class="loader-spell"></div>
      <p>正在吟唱召唤咒语...</p>
    </div>
  </div>

  <!-- 单题模式：直接渲染 QuestPage，保持原有行为 -->
  <QuestPage v-else />
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, nextTick } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { Select } from "@element-plus/icons-vue";
import { showNotify } from "vant";

import { useQuestionsStore } from "@/store/questions";
import { getQueryParam } from "@/utils/qa/questions";
import { useBgm } from "./composables/useBgm";
import type { ThreadItem } from "@/types/qa";

import QuestPage from "./QuestPage.vue";
import AdventureLost from "./components/AdventureLost.vue";
import BgmAuthHint from "./components/BgmAuthHint.vue";
import BgmFloatButton from "./components/BgmFloatButton.vue";
import SwipeHint from "./components/SwipeHint.vue";
import MultiQuestAura from "./components/MultiQuestAura.vue";
import MultiQuestClueModal from "./components/MultiQuestClueModal.vue";
import MultiQuestClueFloat from "./components/MultiQuestClueFloat.vue";

const questionsStore = useQuestionsStore();

const multiAuraRef = ref<InstanceType<typeof MultiQuestAura> | null>(null);
const multiClueModalRef = ref<InstanceType<typeof MultiQuestClueModal> | null>(null);
const showMultiClueFloat = ref(false);

// 解析 query 参数：qas 优先于 qa
const qasParam = getQueryParam("qas")?.[0] || "";
const userId = getQueryParam("user")?.[0] || "";

// 判断是否为多题模式
const multiSteps = qasParam
  ? qasParam
      .split(",")
      .map((s) => parseInt(s.trim()))
      .filter((n) => !isNaN(n))
  : [];
const isMultiMode = multiSteps.length > 1;

// 多题模式数据
const multiLevels = computed(() => questionsStore.multiLevels);
const completedSteps = ref<Set<number>>(new Set());
const activeSlideIndex = ref(0);

// Swiper 实例
let swiperInstance: SwiperType | null = null;

// Swiper 配置
const swiperSlidesPerView = 1;
const swiperSpaceBetween = 0;

// 完成计数
const completedCount = computed(() => completedSteps.value.size);

// 滑动提示状态
const showSwipeHint = ref(false);

// 背景图样式（多题模式下使用第一个关卡的背景图）
const mainBgImgStyle = computed(() => {
  const firstLevel = multiLevels.value[0];
  const bgImg = firstLevel?.mainBgImg;
  if (bgImg) {
    return { backgroundImage: `url(${bgImg})` };
  }
  return {};
});

// 背景音乐
const bgm = useBgm();

/**
 * 响应式计算：当前题目是否允许向后滑动
 * 通过 computed 驱动模板上的 :allow-slide-next 绑定，确保初始渲染即生效
 */
const canSlideNext = computed(() => {
  const index = activeSlideIndex.value;
  const currentLevel = multiLevels.value[index];
  return currentLevel ? completedSteps.value.has(currentLevel.step) : false;
});

/**
 * 命令式更新 Swiper 实例的 allowSlideNext（用于实例已存在时的即时同步）
 */
const updateSlidePermission = () => {
  if (!swiperInstance) return;
  swiperInstance.allowSlideNext = canSlideNext.value;
};

/**
 * Swiper 初始化回调
 */
const onSwiperInit = (swiper: SwiperType) => {
  swiperInstance = swiper;
  updateSlidePermission();
};

/**
 * Slide 切换回调
 */
const onSlideChange = (swiper: SwiperType) => {
  activeSlideIndex.value = swiper.activeIndex;
  // 用户已主动滑动，关闭提示
  showSwipeHint.value = false;
  // 切换后重新检查当前题目是否允许继续向后滑动
  updateSlidePermission();
};

/**
 * 处理单题答对事件
 * @param step 答对的关卡步骤
 * @param thread 该关卡的线索列表
 */
const handleBinGo = (step: number, thread: ThreadItem[]) => {
  completedSteps.value.add(step);

  // 答对后解锁当前题目的向后滑动限制
  updateSlidePermission();

  // 检查是否有 NextQuestion 指令
  const hasNextQuestion = thread.some((item) => item.state === "NextQuestion");

  if (hasNextQuestion && swiperInstance) {
    const currentIndex = swiperInstance.activeIndex;
    const nextIndex = currentIndex + 1;

    if (nextIndex < multiLevels.value.length) {
      // 延迟跳转，让用户看到答对效果
      setTimeout(() => {
        swiperInstance?.slideTo(nextIndex, 600);
      }, 1500);
    }
  }

  // 非全部完成且当前不是最后一题时，显示滑动提示
  const isLastSlide = swiperInstance && swiperInstance.activeIndex >= multiLevels.value.length - 1;

  nextTick(() => {
    if (completedSteps.value.size === multiLevels.value.length) {
      handleAllComplete();
    } else if (!hasNextQuestion && !isLastSlide) {
      // 没有自动跳转指令时，延迟显示滑动提示
      setTimeout(() => {
        showSwipeHint.value = true;
      }, 1200);
    }
  });
};

/**
 * 所有题目完成的回调钩子
 */
const handleAllComplete = () => {
  setTimeout(() => {
    if (multiAuraRef.value) {
      multiAuraRef.value.startEffect();
    } else {
      // 备用通知
      showNotify({
        type: "success",
        message: "🎉 此关卡所有谜题已破解！伟大的冒险者！",
        duration: 3000,
      });
      checkMultiClue();
    }
  }, 1000);
};

const handleAuraClose = () => {
  checkMultiClue();
};

const checkMultiClue = () => {
  if (questionsStore.multiQuestClue && questionsStore.multiQuestClue.content) {
    if (multiClueModalRef.value) {
      multiClueModalRef.value.show();
    }
  }
};

const handleClueModalClosed = () => {
  // 弹窗关闭后，如果确实存在线索，则把悬浮球放出来
  if (questionsStore.multiQuestClue && questionsStore.multiQuestClue.content) {
    showMultiClueFloat.value = true;
  }
};

const openClueModal = () => {
  // 通过悬浮球重新打开弹窗
  if (multiClueModalRef.value) {
    multiClueModalRef.value.show();
    showMultiClueFloat.value = false; // 打开弹窗时可选将悬浮球隐藏
  }
};

/**
 * 从 localStorage 恢复各题的完成状态
 * cacheKey 格式与 useAnswerCheck 保持一致：`qaIndex${step}${userId}${updated}`
 */
const restoreCompletedSteps = () => {
  for (const level of multiLevels.value) {
    const key = `qaIndex${level.step}${userId}${level.updated || ""}`;
    try {
      const cached = JSON.parse(localStorage.getItem(key) || "{}");
      if (cached?.type === "bingo") {
        completedSteps.value.add(level.step);
      }
    } catch {
      // 解析失败忽略
    }
  }
};

/**
 * 初始化多题数据
 */
const initMultiMode = async () => {
  if (!isMultiMode) return;

  await questionsStore.initMultiData(multiSteps);

  // 恢复已完成的题目状态
  restoreCompletedSteps();

  // 等待 Vue 将 DOM 和 Swiper 渲染完成
  await nextTick();

  // 根据恢复的完成状态，找到第一个未完成的题目
  let targetIndex = multiLevels.value.findIndex((level) => !completedSteps.value.has(level.step));
  // 如果全部完成了，停留在最后一题
  if (targetIndex === -1 && multiLevels.value.length > 0) {
    targetIndex = multiLevels.value.length - 1;
  }

  activeSlideIndex.value = Math.max(0, targetIndex);

  if (swiperInstance) {
    // 瞬间移动到目标题面
    swiperInstance.slideTo(activeSlideIndex.value, 0);
    // 更新滑动权限
    updateSlidePermission();
  } else {
    // 作为后备，如果不凑巧 swiperInstance 慢了点
    setTimeout(() => {
      if (swiperInstance) {
        swiperInstance.slideTo(activeSlideIndex.value, 0);
        updateSlidePermission();
      }
    }, 100);
  }

  // 如果通过缓存恢复时已经全部答完，并且存在多题线索，则直接把线索悬浮球唤起
  if (completedSteps.value.size === multiLevels.value.length && multiLevels.value.length > 0) {
    if (questionsStore.multiQuestClue && questionsStore.multiQuestClue.content) {
      showMultiClueFloat.value = true;
    }
  }

  // 初始化背景音乐（使用第一个关卡的音乐）
  const firstLevel = multiLevels.value[0];
  if (firstLevel?.mainAudio) {
    bgm.initBgm(firstLevel.mainAudio);
  }
};

onMounted(() => {
  if (isMultiMode) {
    initMultiMode();
  }
});
</script>

<style lang="scss" scoped>
@use "./_variables.scss" as *;
@use "./style.scss";

.multi-quest-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  color: #fff;
  background: #0a0e14;

  &::after {
    content: "";
    position: fixed;
    inset: 0;
    background-image: radial-gradient(
        circle at 20% 30%,
        rgba(255, 215, 0, 0.15) 0%,
        transparent 15%
      ),
      radial-gradient(circle at 80% 70%, rgba(138, 43, 226, 0.15) 0%, transparent 20%),
      radial-gradient(circle at 50% 50%, rgba(138, 43, 226, 0.1) 0%, transparent 25%);
    pointer-events: none;
    z-index: 2;
    mix-blend-mode: screen;
    -webkit-mix-blend-mode: screen;
    animation: ambient-float 15s ease-in-out infinite;
    filter: blur(2vpx);
  }
}

.quest-swiper-wrapper {
  position: relative;
  z-index: 4;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding-top: 16vpx;
  box-sizing: border-box;
}

// 进度指示器
.quest-progress-bar {
  display: flex;
  align-items: center;
  gap: 12vpx;
  padding: 0 30vpx;
  margin-bottom: 12vpx;
  z-index: 5;

  .progress-track {
    flex: 1;
    height: 4vpx;
    background: rgba(255, 255, 255, 0.15);
    border-radius: 2vpx;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, $magic-gold, $magic-purple);
    border-radius: 2vpx;
    transition: width 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  }

  .progress-label {
    font-size: 12vpx;
    color: rgba(255, 255, 255, 0.6);
    font-weight: 500;
    white-space: nowrap;
  }
}

// Swiper 容器
.quest-swiper {
  flex: 1;
  width: 100%;
  height: 0; // flex 子项需要明确高度以配合内部滚动
}

// 单个 Slide：占满 Swiper 高度
.quest-slide {
  height: auto;
  align-self: stretch;
}

// Slide 内容容器
.quest-slide-inner {
  position: relative;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;

  // 隐藏滚动条
  scrollbar-width: none; // Firefox
  -ms-overflow-style: none; // IE/Edge
  &::-webkit-scrollbar {
    display: none; // Chrome/Safari
  }

  &.is-completed {
    &::after {
      content: "";
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      border-top: 2vpx solid rgba($magic-green, 0.4);
      pointer-events: none;
      z-index: 10;
    }
  }

  // compact 模式下 QuestPage 内部样式覆盖
  :deep(#Questions) {
    min-height: auto;

    .adventure-container {
      height: auto;
      min-height: 100%;
      overflow-y: visible;
    }

    .quest-wrapper {
      padding: 24vpx 24vpx 12vpx;
    }
  }
}

// 关卡序号徽章
.slide-badge {
  position: absolute;
  top: 12vpx;
  right: 12vpx;
  z-index: 20;
  display: flex;
  align-items: center;
  gap: 4vpx;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10vpx);
  -webkit-backdrop-filter: blur(10vpx);
  border: 1vpx solid rgba(255, 255, 255, 0.15);
  border-radius: 12vpx;
  padding: 4vpx 10vpx;

  .badge-step {
    font-size: 11vpx;
    font-weight: bold;
    color: rgba(255, 255, 255, 0.7);
  }

  .badge-check {
    font-size: 12vpx;
    color: $magic-green;
  }
}

// 环境光浮动动画（复用 style.scss 中的定义）
@keyframes ambient-float {
  0%,
  100% {
    transform: translateY(0) scale(1);
    opacity: 0.6;
  }
  50% {
    transform: translateY(-7.69231vw) scale(1.1);
    opacity: 1;
  }
}
</style>
