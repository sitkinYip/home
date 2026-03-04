import { ref, computed, Ref } from "vue";
import { LevelRecord, ThreadItem } from "@/types/qa";
import { useQuestionsStore } from "@/store/questions";
import { checkAnswer } from "@/utils/qa/questions";
import { showNotify, showImagePreview } from "vant";
import confetti from "canvas-confetti";
import { useFeedback } from "./useFeedback";

/** 自动播放结果类型，用于通知外层（多题模式）决定跳转延迟策略 */
export type AutoPlayResult = "video" | "image" | null;

/**
 * 答案校验 Hook
 * @param currentStep 当前关卡步骤
 * @param userId 用户ID
 * @param questionsStore store实例
 * @param qaInfoOverride 可选，覆盖 store 中的 qaInfo（用于 compact/多题模式）
 */
export function useAnswerCheck(
  currentStep: number,
  userId: string,
  questionsStore: ReturnType<typeof useQuestionsStore>,
  qaInfoOverride?: Ref<LevelRecord | null>,
) {
  /** 获取当前生效的关卡数据 */
  const resolvedQaInfo = computed(() => qaInfoOverride?.value ?? questionsStore.qaInfo);
  const userInput = ref("");
  const isBinGo = ref(false);
  const isQuestionExpanded = ref(true);

  // 反馈效果
  const { triggerSuccessFeedback } = useFeedback();

  // 缓存 key：使用 resolvedQaInfo 的 updated 字段，避免多题模式下共享 store 导致 key 错误
  const cacheKey = computed(() => {
    const updated = resolvedQaInfo.value?.updated || "";
    return `qaIndex${currentStep}${userId}${updated}`;
  });

  /**
   * 检查本地是否已有通关记录
   */
  const checkPersistentProgress = () => {
    const key = cacheKey.value;
    const preData = JSON.parse(localStorage.getItem(key) || "{}");
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
    if (!resolvedQaInfo.value) return false;

    const { answer, answerList } = resolvedQaInfo.value;

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
   * @returns 自动播放的媒体类型（"video" | "image" | null），供多题模式决定跳转延迟
   */
  const handleSuccess = async (
    talk: (msg: string, dur?: number) => Promise<void>,
    victoryAuraRef: any,
    reportAction: (content: string, title: string) => void,
    openVideo: (url: string) => void,
    videoPlayerRef: any,
  ): Promise<AutoPlayResult> => {
    if (!resolvedQaInfo.value) return null;

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

    // 4. 检测是否有需要自动播放的媒体（延迟到过渡动画完成后执行）
    let autoPlayType: AutoPlayResult = null;

    const autoPlayItem = resolvedQaInfo.value.thread.find(
      (t: ThreadItem) => t.state === "AutoPlay" && (t.type === "video" || t.type === "img"),
    );

    // 5. 上报
    reportAction(`答对了第${currentStep}题，答案是${userInput.value}`, "成功通知");

    // 6. 喊话与特效（等待过渡动画完成：按钮变绿、面板收起等）
    if (resolvedQaInfo.value.isFinalLevel) {
      await talk(`伟大的英雄，你已破除所有迷雾！`, 1000);
      isQuestionExpanded.value = false; // 成功后折叠
      victoryAuraRef.value?.startEffect(); // 启动终极特效
    } else {
      await talk("契约达成！真理已现。", 1000);
      isQuestionExpanded.value = false; // 成功后折叠
    }

    // 7. 过渡动画完成后，执行自动播放媒体
    if (autoPlayItem) {
      if (autoPlayItem.type === "video" && autoPlayItem.url && videoPlayerRef.value) {
        openVideo(autoPlayItem.url);
        autoPlayType = "video";
      } else if (autoPlayItem.type === "img") {
        const images = autoPlayItem.imgList?.length
          ? autoPlayItem.imgList
          : autoPlayItem.url
            ? [autoPlayItem.url]
            : autoPlayItem.content
              ? [autoPlayItem.content]
              : [];
        if (images.length > 0) {
          showImagePreview({ images, closeable: true });
          autoPlayType = "image";
        }
      }
    }

    return autoPlayType;
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
