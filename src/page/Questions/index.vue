<template>
  <div id="Questions">
    <div class="adventure-container" v-if="questionsStore.qaInfo">
      <!-- 动态背景层 -->
      <div class="magic-bg"></div>
      <div class="overlay"></div>

      <VideoPlayer ref="videoPlayerRef" />

      <div class="quest-wrapper">
        <!-- 英雄状态栏 -->
        <header class="hero-header">
          <div class="header-left">
            <!-- 新增：用户英雄头像 -->
            <div class="user-avatar-wrap">
              <div class="avatar-frame"></div>
              <el-image
                :src="questionsStore.qaInfo.avatar || '默认头像地址'"
                class="user-avatar"
                fit="cover"
              >
                <template #error>
                  <div class="avatar-placeholder">
                    {{ `${questionsStore.currentUserDisplay?.at?.(-1) ?? "旅"}` }}
                  </div>
                </template>
              </el-image>
            </div>

            <!-- 英雄信息 -->
            <div class="hero-info">
              <h2 class="hero-name">{{ questionsStore.currentUserDisplay }}</h2>
              <div class="level-badge">
                RANK: {{ questionsStore.currentStep }} ·
                {{ questionsStore.qaInfo?.rankName || "探索者" }}
              </div>
            </div>
          </div>

          <!-- 右侧：解谜状态指示器 -->
          <div class="header-right" @click="handleHeaderClick">
            <div class="status-indicator-wrap" :class="{ 'is-error-shake': isError }">
              <!-- 动态光晕类：增加 is-error-glow -->
              <div
                class="avatar-glow"
                :class="{
                  'is-bingo-glow': isBinGo,
                  'is-error-glow': isError,
                }"
              ></div>

              <!-- 内部容器：增加 is-error-border -->
              <div class="status-inner" :class="{ 'is-error-border': isError }">
                <el-icon :size="toVpx(24)">
                  <!-- 三态图标逻辑 -->
                  <CircleClose v-if="isError" color="#ff4757" />
                  <template v-else>
                    <Lock v-if="!isBinGo" color="#ffd700" />
                    <MagicStick v-else color="#2ecc71" />
                  </template>
                </el-icon>
              </div>
            </div>
          </div>
        </header>

        <!-- 魔法交互面板 -->
        <main
          class="magic-panel quest-card"
          :class="{ 'shake-animation': isError }"
          ref="questCard"
        >
          <div class="q_title_row">
            <span class="ornament"></span>
            <span class="title_text">{{ questionsStore.qaInfo?.title ?? "当前谜题" }}</span>
            <span class="ornament"></span>
          </div>

          <!-- 问题内容 -->
          <QuestContent :list="questionsStore.qaInfo.question" @play-video="openVideo" />

          <!-- 答题输入区 -->
          <div class="interaction-zone">
            <div
              class="input-wrapper"
              :class="{ 'is-focus': isInputFocus, 'is-error': isError }"
              :style="{ '--power': `${inputMagicPower}px` }"
            >
              <input
                v-model="userInput"
                class="magic-input"
                :placeholder="questionsStore.qaInfo.placeholder || '在此刻下你的答案...'"
                @focus="isInputFocus = true"
                @blur="isInputFocus = false"
                @keyup.enter="onConfirmAnswer"
              />
              <!-- 增加一个魔力进度条，非常细微，在输入框底部 -->
              <div class="magic-progress" :style="{ width: `${inputMagicPower}%` }"></div>
            </div>
            <button
              @click="onConfirmAnswer"
              class="magic-btn"
              :class="{
                'btn-success': isBinGo,
                'btn-error': isError,
              }"
            >
              <span class="btn-content">
                {{ isBinGo ? "挑战成功" : isError ? "咒语错误" : "确认答案" }}
              </span>
              <div class="btn-flare"></div>
            </button>
          </div>
        </main>
        <MagicScroll ref="magicScrollRef" />
        <!-- 线索展示（答对后呈现） -->
        <transition name="scroll-reveal">
          <div class="magic-panel clue-card" v-show="isBinGo">
            <div class="clue-header">
              <span class="header-ornament"></span>
              获取的神谕线索
              <span class="header-ornament"></span>
            </div>

            <div class="as_content">
              <div
                v-for="(item, index) in questionsStore.qaInfo.thread"
                :key="index"
                class="as_item_wrapper"
              >
                <!-- 使用新组件 ClueArtifact -->
                <ClueArtifact
                  :type="item.type"
                  :content="item.content"
                  @action="handleArtifactAction(item)"
                  :path="item.path"
                  :query="item.query"
                  :nextIndex="item.nextIndex"
                />

                <!-- 如果是图片类型且不需要点击文字预览，直接显示图片预览 -->
                <div class="direct-img-view" v-if="item.type === 'img' && !item.content">
                  <el-image
                    :src="item.url"
                    class="clue-img"
                    @click="previewImage(item.imgList || [item.url!])"
                  />
                </div>
              </div>
            </div>
          </div>
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
import { Lock, MagicStick, CircleClose } from "@element-plus/icons-vue";
import gsap from "gsap";
import confetti from "canvas-confetti";
import { useRouter } from "vue-router";
import { useQuestionsStore } from "@/store/questions";

import {
  getQueryParam,
  isTimeReached,
  checkAnswer,
  filterSpecialChars,
  HeaderClickCounter,
} from "@/utils/qa/questions";
// import { fetchLevels } from "@/server/qa"; // 移入 store
// import { LevelRecord } from "@/types/qa"; // 移入 store
import VideoPlayer from "@/components/VideoPlayer.vue";
import VictoryAura from "./components/VictoryAura.vue";
import AdventurePortal from "./components/AdventurePortal.vue";
import ClueArtifact from "./components/ClueArtifact.vue";
import { showImagePreview } from "vant";
import MagicScroll from "./components/MagicScroll.vue";
import { showNotify } from "vant";
import QuestContent from "./components/QuestContent.vue";
import AdventureLost from "./components/AdventureLost.vue";

const questionsStore = useQuestionsStore();
const magicScrollRef = ref<any>(null);
const isDebug = getQueryParam("debug")?.[0] === "1";
const victoryAuraRef = ref<any>(null);
const videoPlayerRef = ref<any>(null);
const userInput = ref("");
const isBinGo = ref(false);
const isInputFocus = ref(false);
const isError = ref(false); // 错误视觉状态
// const allLevels = ref<LevelRecord[]>([]); // 移入 store
// const qaInfo = ref<LevelRecord | null>(null); // 移入 store
const router = useRouter();

const qaIndexStr = getQueryParam("qa")?.[0] || "1";
const currentStep = parseInt(qaIndexStr);
const userId = getQueryParam("user")?.[0] || "";
// const userName = ref("旅行者"); // 移入 store
// const isLost = ref(false); // 移入 store
// const hasFirstStep = ref(false); // 移入 store

// const currentUserDisplay = computed(() => `${userName.value}`); // 移入 store getter
const cacheKey = computed(() => questionsStore.getCacheKey(currentStep, userId));

const initData = async () => {
  // 调用 store 的 initData
  await questionsStore.initData(currentStep, userId);

  if (questionsStore.qaInfo) {
    checkPersistentProgress();

    // 进场动画...
    nextTick(() => {
      // 任务面板滑入
      gsap.from(".quest-card", { duration: 1, y: "50px", opacity: 0, ease: "power4.out" });
      // 左侧英雄信息从左侧滑入
      gsap.from(".header-left", { duration: 0.8, x: "-30px", opacity: 0, delay: 0.2 });
      // 右侧状态指示器从右侧滑入
      gsap.from(".header-right", { duration: 0.8, x: "30px", opacity: 0, delay: 0.3 });
    });
  }
};

/**
 * 统一处理遗物点击动作
 */
const handleArtifactAction = (item: any) => {
  switch (item.type) {
    case "url":
      openPage(item.url);
      break;
    case "img":
      // 使用 Vant 的 ImagePreview，支持双指缩放、左右滑动、手势关闭
      showImagePreview({
        images: item.imgList || [item.url!],
        closeable: true,
      });
      break;
    case "video":
      openVideo(item.url!);
      break;
    case "text":
      // 触发羊皮纸弹窗
      magicScrollRef.value?.show(item.content);
      break;
  }
};

/**
 * 直接点击图片的预览
 */
const previewImage = (images: string[]) => {
  showImagePreview({
    images: images,
    closeable: true,
  });
};

const checkPersistentProgress = () => {
  const preData = questionsStore.getCachedProgress(currentStep, userId);
  if (preData?.type === "bingo") {
    isBinGo.value = true;
    userInput.value = preData.input || "";
  }
};

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

const onConfirmAnswer = async () => {
  if (isBinGo.value || !questionsStore.qaInfo) return;
  if (isError.value) return;
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
  const isCorrect =
    ans === questionsStore.qaInfo.answer || checkAnswer(ans, questionsStore.qaInfo.answer);

  if (isCorrect) {
    handleSuccess();
  } else {
    triggerErrorEffect();
    const filteredInput = filterSpecialChars(userInput.value);
    if (userInput.value.trim()) {
      reportAction(`答错了第${currentStep}题，回答的是${filteredInput}`, "错误通知");
    }
    showNotify({
      type: "danger",
      position: "bottom",
      message: "咒语无效，请再次思索...",
    });
  }
};

const triggerErrorEffect = () => {
  isError.value = false; // 先重置，确保能重复触发 CSS 动画
  // gsap.to(".quest-card", { duration: 0.1, x: 10, repeat: 20, yoyo: true });
  setTimeout(() => {
    isError.value = true;
    setTimeout(() => {
      isError.value = false;
    }, 1500); // 状态保持时长
  }, 20);
};

const inputMagicPower = computed(() => {
  const length = userInput.value.length;
  return Math.min(length * 5, 100); // 最大 100%
});

const handleSuccess = async () => {
  if (!questionsStore.qaInfo) return;

  confetti({
    particleCount: 150,
    spread: 70,
    origin: { y: 0.6 },
    colors: ["#ffd700", "#ffffff", "#8a2be2"],
  });

  localStorage.setItem(
    cacheKey.value,
    JSON.stringify({
      type: "bingo",
      date: Date.now(),
      input: userInput.value,
    }),
  );

  isBinGo.value = true;
  const autoPlayVideo = questionsStore.qaInfo.thread.find(
    (t) => t.type === "video" && t.state === "ckickplay",
  );
  if (autoPlayVideo && videoPlayerRef.value) {
    openVideo(autoPlayVideo.url!);
  }

  reportAction(`答对了第${currentStep}题，答案是${userInput.value}`, "成功通知");

  if (questionsStore.qaInfo?.isFinalLevel) {
    await talk(`伟大的英雄，你已破除所有迷雾！`, 1000);
    victoryAuraRef.value?.startEffect(); // 启动终极特效
  } else {
    await talk("契约达成！真理已现。", 1000);
  }
};

const reportAction = (content: string, title: string) => {
  const nickName = questionsStore.qaInfo?.userName || "旅行者";
  if (isDebug) return console.log(`报告：${title} -- 来自sitkin.top/${nickName}${content}`);
  fetch(
    `https://api.chuckfang.com/4acc3779/${title} -- 来自sitkin.top/${nickName}${content}`,
  ).catch((e) => console.error("Report failed", e));
};

const openVideo = (url: string) => videoPlayerRef.value?.open(url);
const openPage = (url?: string) => url && window.open(url);
const handleHeaderClick = () => {
  HeaderClickCounter(cacheKey.value);
};

onMounted(initData);

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
</script>

<style lang="scss" scoped>
@use "./style.scss";
</style>
