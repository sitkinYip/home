import { ref, computed } from "vue";
import { ThreadItem } from "@/types/qa";
import { useQuestionsStore } from "@/store/questions";
import { checkAnswer } from "@/utils/qa/questions";
import { showNotify } from "vant";
import confetti from "canvas-confetti";
import { useFeedback } from "./useFeedback";

/**
 * 答案校验 Hook
 * @param currentStep 当前关卡步骤
 * @param userId 用户ID
 * @param questionsStore store实例
 */
export function useAnswerCheck(
  currentStep: number,
  userId: string,
  questionsStore: ReturnType<typeof useQuestionsStore>,
) {
  const userInput = ref("");
  const isBinGo = ref(false);
  const isQuestionExpanded = ref(true);

  // 反馈效果
  const { triggerSuccessFeedback } = useFeedback();

  // 缓存 key
  const cacheKey = computed(() => questionsStore.getCacheKey(currentStep, userId));

  /**
   * 检查本地是否已有通关记录
   */
  const checkPersistentProgress = () => {
    const preData = questionsStore.getCachedProgress(currentStep, userId);
    if (preData?.type === "bingo") {
      isBinGo.value = true;
      userInput.value = preData.input || "";
      isQuestionExpanded.value = false; // 如果已答对，进场时自动折叠
    }
  };

  /**
   * 校验答案核心逻辑
   * @param ans 输入的答案
   * @returns 是否正确
   */
  const verifyAnswer = (ans: string): boolean => {
    if (!questionsStore.qaInfo) return false;

    const { answer, answerList } = questionsStore.qaInfo;

    // 1. 检查主答案
    let isCorrect = ans === answer || checkAnswer(ans, answer);

    // 2. 如果主答案不对，检查备选答案列表
    if (!isCorrect) {
      isCorrect = !!answerList?.find((item: string) => ans === item || checkAnswer(ans, item));
    }
    return isCorrect;
  };

  /**
   * 处理答对后的逻辑
   * @param talk 喊话回调
   * @param victoryAuraRef 胜利特效组件引用
   * @param reportAction 上报回调
   * @param openVideo 播放视频回调
   * @param videoPlayerRef 视频组件引用
   */
  const handleSuccess = async (
    talk: (msg: string, dur?: number) => Promise<void>,
    victoryAuraRef: any,
    reportAction: (content: string, title: string) => void,
    openVideo: (url: string) => void,
    videoPlayerRef: any,
  ) => {
    if (!questionsStore.qaInfo) return;

    // 1. 撒花特效 + 成功音效
    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#ffd700", "#ffffff", "#8a2be2"],
    });
    triggerSuccessFeedback();

    // 2. 保存通关记录
    localStorage.setItem(
      cacheKey.value,
      JSON.stringify({
        type: "bingo",
        date: Date.now(),
        input: userInput.value,
      }),
    );

    // 3. 更新状态
    isBinGo.value = true;

    // 4. 自动播放视频（如果有配置）
    const autoPlayVideo = questionsStore.qaInfo.thread.find(
      (t: ThreadItem) => t.type === "video" && t.state === "ckickplay",
    );
    if (autoPlayVideo && videoPlayerRef.value) {
      openVideo(autoPlayVideo.url!);
    }

    // 5. 上报
    reportAction(`答对了第${currentStep}题，答案是${userInput.value}`, "成功通知");

    // 6. 喊话与特效
    if (questionsStore.qaInfo?.isFinalLevel) {
      await talk(`伟大的英雄，你已破除所有迷雾！`, 1000);
      isQuestionExpanded.value = false; // 成功后折叠
      victoryAuraRef.value?.startEffect(); // 启动终极特效
    } else {
      await talk("契约达成！真理已现。", 1000);
      isQuestionExpanded.value = false; // 成功后折叠
    }
  };

  return {
    userInput,
    isBinGo,
    isQuestionExpanded,
    cacheKey,
    checkPersistentProgress,
    verifyAnswer,
    handleSuccess,
  };
}
