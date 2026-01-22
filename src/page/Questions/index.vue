<template>
  <div id="Questions">
    <div class="adventure-container" v-if="questionsStore.qaInfo">
      <!-- 动态背景层 -->
      <div class="magic-bg"></div>
      <div class="overlay"></div>

      <VideoPlayer ref="videoPlayerRef" />

      <div class="quest-wrapper">
        <!-- 英雄状态栏 -->
        <QuestHeader
          :qa-info="questionsStore.qaInfo"
          :current-user-display="questionsStore.currentUserDisplay"
          :current-step="questionsStore.currentStep"
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
                <span class="title_text">{{ questionsStore.qaInfo?.title || "当前谜题" }}</span>
                <span class="ornament"></span>
              </div>
            </template>

            <!-- 问题内容 -->
            <QuestContent :list="questionsStore.qaInfo.question" @play-video="openVideo" />

            <!-- 答题输入区 -->
            <QuestInputRegion
              :qa-info="questionsStore.qaInfo"
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
            :thread="questionsStore.qaInfo.thread"
            @action="handleArtifactAction"
            @preview="previewImage"
          />
        </transition>

        <AdventurePortal
          v-show="!isDebug"
          :start-time="questionsStore.qaInfo.startTime"
          :end-time="questionsStore.qaInfo.endTime"
        />
        <VictoryAura ref="victoryAuraRef" @close="handleVictoryClose" />
      </div>
    </div>
    <!-- 迷失状态展示 -->
    <AdventureLost
      v-else-if="questionsStore.isLost"
      :has-first-step="questionsStore.hasFirstStep"
    />
    <div v-else class="loading-screen">
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
import QuestClues from "./components/QuestClues.vue";

// Composables
import { usePenalty } from "./composables/usePenalty";
import { useAnswerCheck } from "./composables/useAnswerCheck";
import { useArtifacts } from "./composables/useArtifacts";
import { showNotify } from "vant";

const questionsStore = useQuestionsStore();
const router = useRouter();
const isDebug = getQueryParam("debug")?.[0] === "1";

// Refs
const magicScrollRef = ref<any>(null);
const victoryAuraRef = ref<any>(null);
const videoPlayerRef = ref<any>(null);

// Route / Query Params
const qaIndexStr = getQueryParam("qa")?.[0] || "1";
const currentStep = parseInt(qaIndexStr);
const userId = getQueryParam("user")?.[0] || "";

// Composables Init
const {
  wrongCount,
  penaltyEndTime,
  isError,
  loadPenaltyState,
  clearPenalty,
  handleWrongHelper,
  checkPenaltyTime,
} = usePenalty(currentStep, userId, questionsStore);

const {
  userInput,
  isBinGo,
  isQuestionExpanded,
  cacheKey,
  checkPersistentProgress,
  verifyAnswer,
  handleSuccess: execSuccess,
} = useAnswerCheck(currentStep, userId, questionsStore);

const { openVideo, openPage, previewImage, handleArtifactAction } = useArtifacts(
  videoPlayerRef,
  magicScrollRef,
);

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
  const nickName = questionsStore.qaInfo?.userName || "旅行者";
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
  const { path, query = {}, link } = questionsStore.qaInfo?.FinalLevelConfig || {};
  if (path) {
    return router.replace({ path, query });
  }
  if (link) {
    return openPage(link);
  }
};

// Main Logic
const onConfirmAnswer = async () => {
  if (isBinGo.value || !questionsStore.qaInfo) return;
  if (isError.value) return;

  // 检查是否处于惩罚期
  if (checkPenaltyTime()) return;

  if (!isDebug) {
    const { startTime, endTime } = questionsStore.qaInfo || {};
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
  } else {
    handleWrongHelper(ans, reportAction, filterSpecialChars);
  }
};

const initData = async () => {
  await questionsStore.initData(currentStep, userId);

  if (questionsStore.qaInfo) {
    checkPersistentProgress();
    loadPenaltyState();

    nextTick(() => {
      // 动画入场
      gsap.from(".quest-card", { duration: 1, y: "50px", opacity: 0, ease: "power4.out" });
      gsap.from(".header-left", { duration: 0.8, x: "-30px", opacity: 0, delay: 0.2 });
      gsap.from(".header-right", { duration: 0.8, x: "30px", opacity: 0, delay: 0.3 });
    });
  }
};

onMounted(initData);
</script>

<style lang="scss" scoped>
@use "./style.scss";
</style>
