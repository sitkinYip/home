<template>
  <div id="Questions" :class="{ 'is-compact': compact }">
    <div class="adventure-container" v-if="activeQaInfo">
      <!-- 动态背景层（compact 模式下不渲染） -->
      <template v-if="!compact">
        <div class="magic-bg" :style="mainBgImgStyle"></div>
        <div class="overlay"></div>
      </template>

      <VideoPlayer ref="videoPlayerRef" />

      <div class="quest-wrapper">
        <!-- 英雄状态栏 -->
        <QuestHeader
          :qa-info="activeQaInfo"
          :current-user-display="activeUserDisplay"
          :current-step="activeQaInfo.step"
          :is-error="isError"
          :is-bin-go="isBinGo"
          @avatar-click="handleAvatarClick"
          @header-click="handleHeaderClick"
        />

        <!-- 魔法交互面板 -->
        <main
          class="magic-panel quest-card"
          :class="{ 'shake-animation': isError }"
          ref="questCard"
        >
          <MagicAccordion v-model="isQuestionExpanded" :disabled="!isBinGo">
            <template #header>
              <div class="q_title_row">
                <span class="ornament"></span>
                <span class="title_text">{{ activeQaInfo?.title || "当前谜题" }}</span>
                <span class="ornament"></span>
              </div>
            </template>

            <!-- 问题内容 -->
            <QuestContent :list="activeQaInfo.question" @play-video="openVideo" />

            <!-- 答题输入区 -->
            <QuestInputRegion
              :qa-info="activeQaInfo"
              v-model="userInput"
              :is-bin-go="isBinGo"
              :is-error="isError"
              :penalty-end-time="penaltyEndTime"
              :wrong-count="wrongCount"
              @submit="onConfirmAnswer"
              @play-video="openVideo"
            />
          </MagicAccordion>
        </main>

        <MagicScroll ref="magicScrollRef" />

        <!-- 线索展示（答对后呈现） -->
        <transition name="scroll-reveal">
          <QuestClues
            v-if="isBinGo"
            :thread="activeQaInfo.thread"
            :title="activeQaInfo.answerTitle"
            @action="handleArtifactAction"
            @preview="previewImage"
          />
        </transition>

        <AdventurePortal
          v-show="!isDebug"
          :start-time="activeQaInfo.startTime"
          :end-time="activeQaInfo.endTime"
        />
        <VictoryAura ref="victoryAuraRef" @close="handleVictoryClose" />

        <!-- 等级升级动画（compact 模式下不渲染，由外层统一管理） -->
        <RankUpAura
          v-if="!compact"
          ref="rankUpAuraRef"
          :rank-info="rankUp.currentRankInfo.value"
          @close="rankUp.dismissRankUp"
        />
      </div>

      <!-- 背景音乐（compact 模式下不渲染，由外层统一管理） -->
      <template v-if="!compact">
        <BgmAuthHint
          :visible="bgm.showAuthHint.value"
          @authorize="bgm.authorize"
          @dismiss="bgm.dismissAuthHint"
        />
        <BgmFloatButton
          :visible="bgm.hasBgm.value"
          :is-playing="bgm.isPlaying.value"
          @toggle="bgm.toggle"
        />
      </template>
    </div>
    <!-- 迷失状态展示（compact 模式下不渲染） -->
    <AdventureLost
      v-else-if="!compact && questionsStore.isLost"
      :has-first-step="questionsStore.hasFirstStep"
    />
    <div v-else-if="!compact" class="loading-screen">
      <div class="loader-spell"></div>
      <p>正在吟唱召唤咒语...</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, nextTick } from "vue";
import gsap from "gsap";
import { useRouter } from "vue-router";
import { useQuestionsStore } from "@/store/questions";
import { useBgm } from "./composables/useBgm";
import { useRankUp } from "./composables/useRankUp";
import type { LevelRecord, ThreadItem } from "@/types/qa";

import {
  getQueryParam,
  isTimeReached,
  filterSpecialChars,
  HeaderClickCounter,
  clickCounter,
} from "@/utils/qa/questions";

// Components
import VideoPlayer from "@/components/VideoPlayer.vue";
import VictoryAura from "./components/VictoryAura.vue";
import AdventurePortal from "./components/AdventurePortal.vue";
import MagicScroll from "./components/MagicScroll.vue";
import QuestContent from "./components/QuestContent.vue";
import AdventureLost from "./components/AdventureLost.vue";
import MagicAccordion from "./components/MagicAccordion.vue";

// New Components
import QuestHeader from "./components/QuestHeader.vue";
import QuestInputRegion from "./components/QuestInputRegion.vue";
import BgmAuthHint from "./components/BgmAuthHint.vue";
import BgmFloatButton from "./components/BgmFloatButton.vue";
import QuestClues from "./components/QuestClues.vue";
import RankUpAura from "./components/RankUpAura.vue";

// Composables
import { usePenalty } from "./composables/usePenalty";
import { useAnswerCheck } from "./composables/useAnswerCheck";
import { useArtifacts } from "./composables/useArtifacts";
import { showNotify } from "vant";

/**
 * Props 定义：
 * - compact 模式下由外层传入 levelData，不渲染背景/BGM/Lost 等全局元素
 * - 非 compact 模式（默认）保持原有 query 参数行为
 */
const props = withDefaults(
  defineProps<{
    compact?: boolean;
    levelData?: LevelRecord | null;
    propStep?: number;
    propUserId?: string;
  }>(),
  {
    compact: false,
    levelData: null,
    propStep: 0,
    propUserId: "",
  },
);

const emit = defineEmits<{
  (event: "binGo", step: number, thread: ThreadItem[]): void;
}>();

const questionsStore = useQuestionsStore();
const router = useRouter();
const isDebug = getQueryParam("debug")?.[0] === "1";

// Refs
const magicScrollRef = ref<any>(null);
const victoryAuraRef = ref<any>(null);
const videoPlayerRef = ref<any>(null);
const rankUpAuraRef = ref<InstanceType<typeof RankUpAura> | null>(null);

// 解析当前关卡步骤和用户 ID：props 优先，fallback 到 query 参数
const currentStep = props.propStep || parseInt(getQueryParam("qa")?.[0] || "1");
const userId = props.propUserId || getQueryParam("user")?.[0] || "";

// compact 模式下使用 props 传入的 levelData，否则使用 store
const activeQaInfo = computed<LevelRecord | null>(() => {
  if (props.compact && props.levelData) {
    return props.levelData;
  }
  return questionsStore.qaInfo;
});

const activeUserDisplay = computed(() => {
  if (props.compact && props.levelData) {
    return props.levelData.userName || "旅行者";
  }
  return questionsStore.currentUserDisplay;
});

// Composables Init（传入 activeQaInfo 以支持 compact/多题模式）
const {
  wrongCount,
  penaltyEndTime,
  isError,
  loadPenaltyState,
  clearPenalty,
  handleWrongHelper,
  handleWrongWithoutPenalty,
  checkPenaltyTime,
} = usePenalty(currentStep, userId, questionsStore, activeQaInfo);

const {
  userInput,
  isBinGo,
  isQuestionExpanded,
  cacheKey,
  checkPersistentProgress,
  verifyAnswer,
  handleSuccess: execSuccess,
} = useAnswerCheck(currentStep, userId, questionsStore, activeQaInfo);

const { openVideo, openPage, previewImage, handleArtifactAction } = useArtifacts(
  videoPlayerRef,
  magicScrollRef,
);

// 背景音乐 Composable（compact 模式下不使用）
const bgm = useBgm();

// 等级升级动画 Composable（compact 模式下不使用，由外层统一管理）
const rankUp = useRankUp(userId);

// 背景图样式计算
const mainBgImgStyle = computed(() => {
  const bgImg = activeQaInfo.value?.mainBgImg;
  if (bgImg) {
    return {
      backgroundImage: `url(${bgImg})`,
    };
  }
  return {};
});

// Helper Functions
const talk = (msg: string, dur: number = 0): Promise<void> => {
  return new Promise((resolve) => {
    showNotify({
      type: "success",
      message: msg,
      duration: dur,
    });
    setTimeout(resolve, dur + 200);
  });
};

const reportAction = (content: string, title: string) => {
  const nickName = activeQaInfo.value?.userName || "旅行者";
  if (isDebug) return console.log(`报告：${title} -- 来自sitkin.top/${nickName}${content}`);
  fetch(
    `https://api.chuckfang.com/4acc3779/${title} -- 来自sitkin.top/${nickName}${content}`,
  ).catch((e) => console.error("Report failed", e));
};

const handleAvatarClick = clickCounter(clearPenalty, 10);

const handleHeaderClick = () => {
  HeaderClickCounter(cacheKey.value);
};

const handleVictoryClose = () => {
  console.log("英雄回到了主世界");
  const { path, query = {}, link } = activeQaInfo.value?.FinalLevelConfig || {};
  if (path) {
    return router.replace({ path, query });
  }
  if (link) {
    return openPage(link);
  }
};

// Main Logic
const onConfirmAnswer = async () => {
  const qaInfo = activeQaInfo.value;
  if (isBinGo.value || !qaInfo) return;
  if (isError.value) return;
  const isMultipleChoice = qaInfo.type === "MultipleChoice";

  // 检查是否处于惩罚期
  if (checkPenaltyTime() && isMultipleChoice) return;

  if (!isDebug) {
    const { startTime, endTime } = qaInfo;
    if (startTime && !isTimeReached(startTime)) {
      showNotify({
        type: "danger",
        position: "bottom",
        message: "冒险还未开始 请耐心等待~",
        duration: 2000,
      });
      return;
    }
    if (endTime && isTimeReached(endTime)) {
      showNotify({
        type: "danger",
        position: "bottom",
        message: "冒险已结束 请留意下一次探险公告~",
        duration: 2000,
      });
      return;
    }
  }

  const ans = userInput.value.trim();
  if (!ans) {
    showNotify({ type: "warning", position: "bottom", message: "请输入咒语" });
    return;
  }

  const isCorrect = verifyAnswer(ans);

  if (isCorrect) {
    await execSuccess(talk, victoryAuraRef, reportAction, openVideo, videoPlayerRef);
    // 答对后通知外层（用于多题模式的自动跳转和完成检测）
    emit("binGo", currentStep, qaInfo.thread);
  } else {
    // 选择题使用惩罚机制，填空题不使用惩罚机制
    console.log("isMultipleChoice", isMultipleChoice);
    if (isMultipleChoice) {
      handleWrongHelper(ans, reportAction, filterSpecialChars);
    } else {
      handleWrongWithoutPenalty(ans, reportAction, filterSpecialChars);
    }
  }
};

const initData = async () => {
  // compact 模式下数据由 props 传入，只需恢复本地进度和惩罚状态
  if (props.compact && props.levelData) {
    checkPersistentProgress();
    loadPenaltyState();
    return;
  }

  // 非 compact 模式：走原有 store 初始化流程
  await questionsStore.initData(currentStep, userId);

  if (questionsStore.qaInfo) {
    checkPersistentProgress();
    loadPenaltyState();

    // 初始化背景音乐
    if (questionsStore.qaInfo.mainAudio) {
      bgm.initBgm(questionsStore.qaInfo.mainAudio);
    }

    nextTick(() => {
      // 动画入场
      gsap.from(".quest-card", { duration: 1, y: "50px", opacity: 0, ease: "power4.out" });
      gsap.from(".header-left", { duration: 0.8, x: "-30px", opacity: 0, delay: 0.2 });
      gsap.from(".header-right", { duration: 0.8, x: "30px", opacity: 0, delay: 0.3 });

      // 检查是否需要展示等级升级动画（非 compact 模式）
      if (!props.compact && questionsStore.qaInfo) {
        const shouldShow = rankUp.checkSingleLevel(questionsStore.qaInfo);
        if (shouldShow) {
          setTimeout(() => {
            rankUp.showRankUp();
            rankUpAuraRef.value?.startEffect();
          }, 1500);
        }
      }
    });
  }
};

onMounted(initData);
</script>

<style lang="scss" scoped>
@use "./style.scss";
</style>
