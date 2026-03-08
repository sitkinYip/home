<template>
  <!-- 多题模式 -->
  <div id="Questions" v-if="isMultiMode">
    <!-- 数据加载完成且有关卡数据 -->
    <div v-if="multiLevels.length > 0" class="adventure-container multi-quest-container">
      <!-- 动态背景层 -->
      <div class="magic-bg" :style="mainBgImgStyle"></div>
      <div class="overlay"></div>

      <div class="quest-swiper-wrapper">
        <!-- 多题模式统一头部（Swiper 外，最顶部） -->
        <MultiQuestHeader
          :active-level="activeLevel"
          :rank-info="multiRankInfo"
          :is-bin-go="activeSlideIsBinGo"
          :is-error="activeSlideIsError"
        />

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
                :ref="(el: any) => setQuestPageRef(el, index)"
                :compact="true"
                :hide-header="true"
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

      <!-- 等级升级动画 -->
      <RankUpAura
        ref="rankUpAuraRef"
        :rank-info="rankUp.currentRankInfo.value"
        @close="rankUp.dismissRankUp"
      />

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
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { Swiper, SwiperSlide } from "swiper/vue";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";
import { Select } from "@element-plus/icons-vue";
import { showNotify } from "vant";

import { useQuestionsStore } from "@/store/questions";
import { getQueryParam } from "@/utils/qa/questions";
import { videoEventBus } from "@/utils/videoEventBus";
import { useBgm } from "./composables/useBgm";
import { useRankUp, extractHighestRank } from "./composables/useRankUp";
import type { ThreadItem } from "@/types/qa";
import type { RankInfo } from "./composables/useRankUp";
import type { AutoPlayResult } from "./composables/useAnswerCheck";

import QuestPage from "./QuestPage.vue";
import AdventureLost from "./components/AdventureLost.vue";
import BgmAuthHint from "./components/BgmAuthHint.vue";
import BgmFloatButton from "./components/BgmFloatButton.vue";
import SwipeHint from "./components/SwipeHint.vue";
import MultiQuestAura from "./components/MultiQuestAura.vue";
import MultiQuestClueModal from "./components/MultiQuestClueModal.vue";
import MultiQuestClueFloat from "./components/MultiQuestClueFloat.vue";
import RankUpAura from "./components/RankUpAura.vue";
import MultiQuestHeader from "./components/MultiQuestHeader.vue";

const questionsStore = useQuestionsStore();

const multiAuraRef = ref<InstanceType<typeof MultiQuestAura> | null>(null);
const multiClueModalRef = ref<InstanceType<typeof MultiQuestClueModal> | null>(null);
const rankUpAuraRef = ref<InstanceType<typeof RankUpAura> | null>(null);
const showMultiClueFloat = ref(false);

// QuestPage 实例 ref 数组（用于获取各 slide 的 isBinGo/isError 状态）
const questPageRefs = ref<InstanceType<typeof QuestPage>[]>([]);
const setQuestPageRef = (el: any, index: number) => {
  if (el) {
    questPageRefs.value[index] = el;
  }
};

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

// 多题模式统一头部：最高等级信息
const multiRankInfo = computed<RankInfo | null>(() => {
  if (multiLevels.value.length === 0) return null;
  return extractHighestRank(multiLevels.value);
});

// 当前活跃 slide 对应的关卡数据
const activeLevel = computed(() => multiLevels.value[activeSlideIndex.value] || null);

// 当前活跃 slide 的答题状态（从 QuestPage 实例获取）
const activeSlideIsBinGo = computed(() => {
  const questPage = questPageRefs.value[activeSlideIndex.value];
  return questPage?.isBinGo ?? false;
});

const activeSlideIsError = computed(() => {
  const questPage = questPageRefs.value[activeSlideIndex.value];
  return questPage?.isError ?? false;
});

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

// 监听视频播放事件，控制 BGM 暂停/继续（多题模式）
const handleVideoStarted = () => {
  if (bgm.isPlaying.value) {
    bgm.pause();
  }
};

const handleVideoEnded = () => {
  if (bgm.hasBgm.value && !bgm.isPlaying.value) {
    bgm.play();
  }
};

onMounted(() => {
  // 视频开始播放时暂停 BGM
  videoEventBus.on('video-started', handleVideoStarted);
  
  // 视频播放结束时恢复 BGM
  videoEventBus.on('video-ended', handleVideoEnded);
});

onUnmounted(() => {
  videoEventBus.off('video-started', handleVideoStarted);
  videoEventBus.off('video-ended', handleVideoEnded);
});

// 等级升级动画
const rankUp = useRankUp(userId);

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
  // 用户手动滑动时，取消所有待执行的自动跳转
  cancelPendingAutoNext();
  // 切换后重新检查当前题目是否允许继续向后滑动
  updateSlidePermission();
};

/**
 * 待执行的自动跳转定时器 ID，用于在用户手动滑动时取消
 */
let pendingAutoNextTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 当前等待视频结束的 QuestPage 引用（用于取消 onEnded 回调）
 */
let pendingVideoQuestPage: InstanceType<typeof QuestPage> | null = null;

/**
 * 取消所有待执行的自动跳转（定时器 + 视频结束回调）
 * @param showHint 取消后是否显示滑动提示（用户手动关闭视频时为 true，手动滑动时为 false）
 */
const cancelPendingAutoNext = (showHint = false) => {
  let hadPending = false;

  if (pendingAutoNextTimer !== null) {
    clearTimeout(pendingAutoNextTimer);
    pendingAutoNextTimer = null;
    hadPending = true;
  }
  if (pendingVideoQuestPage?.videoPlayerRef) {
    pendingVideoQuestPage.videoPlayerRef.clearOnEnded();
    pendingVideoQuestPage = null;
    hadPending = true;
  }

  // 确实取消了待执行跳转，且不是最后一题时，显示滑动提示
  if (showHint && hadPending) {
    const isLastSlide =
      swiperInstance && swiperInstance.activeIndex >= multiLevels.value.length - 1;
    if (!isLastSlide) {
      showSwipeHint.value = true;
    }
  }
};

/**
 * 执行自动跳转到下一题（跳转前清理待执行状态）
 */
const slideToNext = () => {
  pendingAutoNextTimer = null;
  pendingVideoQuestPage = null;
  if (!swiperInstance) return;
  const currentIndex = swiperInstance.activeIndex;
  const nextIndex = currentIndex + 1;
  if (nextIndex < multiLevels.value.length) {
    swiperInstance.slideTo(nextIndex, 600);
  }
};

/**
 * 记录是否有 isFinalLevel 的题目已完成（用于 handleAllComplete 判断是否跳过 MultiQuestAura）
 */
let hasFinalLevelCompleted = false;

/**
 * 记录最后一个完成题目的 autoPlayType 和 step（用于 handleAllComplete 判断是否需要等视频结束）
 */
let lastCompletedAutoPlayType: AutoPlayResult = null;
let lastCompletedStep: number = 0;

/**
 * 处理单题答对事件
 * @param step 答对的关卡步骤
 * @param _thread 该关卡的线索列表
 * @param autoPlayType 自动播放的媒体类型（视频/图片/文本/无）
 * @param isFinalLevel 当前题目是否为最终关（isFinalLevel 时 VictoryAura 已在 QuestPage 内部触发）
 */
const handleBinGo = (
  step: number,
  _thread: ThreadItem[],
  autoPlayType: AutoPlayResult,
  isFinalLevel: boolean,
) => {
  completedSteps.value.add(step);

  // 记录最终关完成状态
  if (isFinalLevel) {
    hasFinalLevelCompleted = true;
  }

  // 记录最后完成题目的 autoPlay 信息（用于 handleAllComplete 判断是否等视频结束）
  lastCompletedAutoPlayType = autoPlayType;
  lastCompletedStep = step;

  // 答对后解锁当前题目的向后滑动限制
  updateSlidePermission();

  // 先取消之前可能残留的待执行跳转
  cancelPendingAutoNext();

  // isFinalLevel 时：VictoryAura 正在展示中，不执行 autoNext 跳转逻辑
  // AutoPlay 也由 QuestPage 在 VictoryAura 关闭后自行处理
  if (!isFinalLevel) {
    // 通过 step 找到当前关卡，判断是否需要自动跳转下一题
    const currentLevel = multiLevels.value.find((level) => level.step === step);
    const shouldAutoNext = currentLevel?.autoNext === true;

    if (shouldAutoNext && swiperInstance) {
      const hasNextSlide = swiperInstance.activeIndex + 1 < multiLevels.value.length;

      if (hasNextSlide) {
        if (autoPlayType === "video") {
          // 视频自动播放：等视频播放结束后再跳转
          const slideIndex = multiLevels.value.findIndex((l) => l.step === step);
          const questPage = questPageRefs.value[slideIndex];
          if (questPage?.videoPlayerRef) {
            pendingVideoQuestPage = questPage;
            questPage.videoPlayerRef.onEnded(() => {
              slideToNext();
            });
            // 用户手动关闭视频时，取消跳转并显示滑动提示
            questPage.videoPlayerRef.onClosed(() => {
              cancelPendingAutoNext(true);
            });
          } else {
            // 兜底：如果拿不到 videoPlayerRef，延迟跳转
            pendingAutoNextTimer = setTimeout(slideToNext, 3000);
          }
        } else if (autoPlayType === "image" || autoPlayType === "text") {
          // 图片或文本弹窗自动播放：等 5 秒后跳转
          pendingAutoNextTimer = setTimeout(slideToNext, 5000);
        } else {
          // 无自动播放媒体：延迟 1.5 秒让用户看到答对效果后跳转
          pendingAutoNextTimer = setTimeout(slideToNext, 1500);
        }
      }
    }

    // 非全部完成且当前不是最后一题时，显示滑动提示
    const isLastSlide =
      swiperInstance && swiperInstance.activeIndex >= multiLevels.value.length - 1;

    nextTick(() => {
      if (completedSteps.value.size === multiLevels.value.length) {
        handleAllComplete();
      } else if (!shouldAutoNext && !isLastSlide) {
        // 没有自动跳转时，延迟显示滑动提示
        setTimeout(() => {
          showSwipeHint.value = true;
        }, 1200);
      }
    });
  } else {
    // isFinalLevel：仅检查是否全部完成（跳过 autoNext 和滑动提示）
    nextTick(() => {
      if (completedSteps.value.size === multiLevels.value.length) {
        handleAllComplete();
      }
    });
  }
};

/**
 * 触发 MultiQuestAura 特效（抽取为独立方法，供延迟调用）
 */
const triggerMultiAura = () => {
  if (multiAuraRef.value) {
    multiAuraRef.value.startEffect();
  } else {
    showNotify({
      type: "success",
      message: "🎉 此关卡所有谜题已破解！伟大的冒险者！",
      duration: 3000,
    });
    checkMultiClue();
  }
};

/**
 * 所有题目完成的回调钩子
 * - isFinalLevel 已完成 → VictoryAura 优先级更高，跳过 MultiQuestAura
 * - 最后完成的题目有视频 AutoPlay → 等视频播完/关闭后再触发 MultiQuestAura
 * - 图片/文本 AutoPlay → 直接触发 MultiQuestAura（层级更高会覆盖，关闭后仍可查看）
 */
const handleAllComplete = () => {
  if (hasFinalLevelCompleted) {
    // VictoryAura 已在 QuestPage 内部触发，跳过 MultiQuestAura，直接检查多题线索
    checkMultiClue();
    return;
  }

  // 最后完成的题目有视频 AutoPlay：等视频播完或关闭后再触发 MultiQuestAura
  if (lastCompletedAutoPlayType === "video") {
    const slideIndex = multiLevels.value.findIndex((l) => l.step === lastCompletedStep);
    const questPage = questPageRefs.value[slideIndex];
    if (questPage?.videoPlayerRef) {
      questPage.videoPlayerRef.onEnded(() => {
        triggerMultiAura();
      });
      questPage.videoPlayerRef.onClosed(() => {
        triggerMultiAura();
      });
      return;
    }
  }

  // 无视频 AutoPlay 或图片/文本：延迟 1 秒后直接触发
  setTimeout(triggerMultiAura, 1000);
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

  // 检查是否需要展示等级升级动画（多题模式取最高等级）
  const shouldShowRankUp = rankUp.checkMultiLevels(multiLevels.value);
  if (shouldShowRankUp) {
    setTimeout(() => {
      rankUp.showRankUp();
      rankUpAuraRef.value?.startEffect();
    }, 1500);
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
  padding-top: 24vpx;
  box-sizing: border-box;
}

// 进度指示器
.quest-progress-bar {
  display: flex;
  align-items: center;
  gap: 12vpx;
  padding: 0 24vpx;
  margin-bottom: 8vpx;
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
    background: transparent;

    .adventure-container {
      height: auto;
      min-height: 100%;
      overflow-y: visible;
      background: transparent;
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
