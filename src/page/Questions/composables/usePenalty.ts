import { ref, computed } from "vue";
import { showNotify, showToast } from "vant";
import { useQuestionsStore } from "@/store/questions";
import { useFeedback } from "./useFeedback";

// 定义惩罚配置类型
type PenaltyConfig = number[];

/**
 * 惩罚机制 Hook
 * @param currentStep 当前关卡步骤
 * @param userId 用户ID
 * @param questionsStore store实例
 */
export function usePenalty(
  currentStep: number,
  userId: string,
  questionsStore: ReturnType<typeof useQuestionsStore>,
) {
  // 错误次数
  const wrongCount = ref(0);
  // 惩罚结束时间戳
  const penaltyEndTime = ref(0);
  // 错误视觉状态（用于控制震动/发光）
  const isError = ref(false);

  // 反馈效果
  const { triggerErrorFeedback, triggerFreezeFeedback } = useFeedback();

  // 默认惩罚配置: [第一次错误等待时间(ms), 第二次错误等待时间(ms), ...]
  // -1 代表永久锁定
  const defaultPenaltyConfig = [3 * 60 * 1000, -1];

  // 计算当前生效的惩罚配置
  const currentPenaltyConfig = computed(() => {
    return questionsStore.qaInfo?.penaltyConfig || defaultPenaltyConfig;
  });

  // 惩罚状态存储的Key
  const penaltyKey = computed(
    () => `qa_penalty_${currentStep}_${userId}_${questionsStore.qaInfo?.updated || ""}`,
  );

  /**
   * 加载本地存储的惩罚状态
   */
  const loadPenaltyState = () => {
    try {
      const raw = localStorage.getItem(penaltyKey.value);
      if (raw) {
        const data = JSON.parse(raw);
        wrongCount.value = data.wrongCount || 0;
        penaltyEndTime.value = data.penaltyEndTime || 0;
      }
    } catch (e) {
      console.error("Failed to load penalty state", e);
    }
  };

  /**
   * 保存惩罚状态到本地存储
   */
  const savePenaltyState = () => {
    try {
      localStorage.setItem(
        penaltyKey.value,
        JSON.stringify({
          wrongCount: wrongCount.value,
          penaltyEndTime: penaltyEndTime.value,
        }),
      );
    } catch (e) {
      console.error("Failed to save penalty state", e);
    }
  };

  /**
   * 清除惩罚（后门/彩蛋用）
   */
  const clearPenalty = () => {
    const data = localStorage.getItem(penaltyKey.value);
    if (!data && wrongCount.value < 1 && penaltyEndTime.value < 1) return;
    localStorage.removeItem(penaltyKey.value);
    wrongCount.value = 0;
    penaltyEndTime.value = 0;
    showToast("神力显现，惩罚已清除！");
  };

  /**
   * 触发错误时的视觉特效
   */
  const triggerErrorEffect = () => {
    isError.value = false; // 先重置，确保能重复触发动画
    // 触发振动反馈
    triggerErrorFeedback();
    setTimeout(() => {
      isError.value = true;
      setTimeout(() => {
        isError.value = false;
      }, 1500); // 状态保持时长
    }, 20);
  };

  /**
   * 处理填空题答错逻辑（不累计惩罚，仅触发视觉效果和通知）
   * @param ans 用户输入的答案
   * @param reportAction 上报行为的回调函数
   * @param filterSpecialChars 过滤特殊字符的工具函数
   */
  const handleWrongWithoutPenalty = (
    ans: string,
    reportAction: (content: string, title: string) => void,
    filterSpecialChars: (str: string) => string,
  ) => {
    triggerErrorEffect();

    const filteredInput = filterSpecialChars(ans);
    if (ans) {
      reportAction(`答错了第${currentStep}题，回答的是${filteredInput}`, "错误通知");
    }

    showNotify({
      type: "danger",
      position: "bottom",
      message: "咒语无效，请再次思索...",
    });
  };

  /**
   * 处理选择题答错逻辑（累计惩罚）
   * @param ans 用户输入的答案
   * @param reportAction 上报行为的回调函数
   * @param filterSpecialChars 过滤特殊字符的工具函数
   */
  const handleWrongHelper = (
    ans: string,
    reportAction: (content: string, title: string) => void,
    filterSpecialChars: (str: string) => string,
  ) => {
    triggerErrorEffect();

    // 增加错误次数
    wrongCount.value++;

    // 计算惩罚时间
    // count从1开始，config索引从0开始，所以索引是 count - 1
    const configIndex = Math.min(wrongCount.value - 1, currentPenaltyConfig.value.length - 1);
    const duration = currentPenaltyConfig.value[configIndex];

    if (duration === -1) {
      penaltyEndTime.value = -1; // 永久锁定
    } else {
      penaltyEndTime.value = Date.now() + duration;
    }

    savePenaltyState();

    const filteredInput = filterSpecialChars(ans);
    if (ans) {
      reportAction(`答错了第${currentStep}题，回答的是${filteredInput}`, "错误通知");
    }

    let msg = "咒语无效，请再次思索...";
    if (penaltyEndTime.value === -1) {
      msg = "咒语反噬，灵魂已被永久封印！";
    } else {
      msg = `咒语反噬！需等待恢复魔力...`;
    }

    showNotify({
      type: "danger",
      position: "bottom",
      message: msg,
    });
  };

  /**
   * 检查是否处于惩罚期（不显示提示，仅状态判断）
   */
  const isPenalized = (): boolean => {
    // 永久锁定
    if (penaltyEndTime.value === -1) return true;
    // 临时锁定且未过期
    if (penaltyEndTime.value > 0 && Date.now() < penaltyEndTime.value) return true;
    // 时间已过，重置
    if (penaltyEndTime.value > 0) {
      penaltyEndTime.value = 0;
      savePenaltyState();
    }
    return false;
  };

  /**
   * 检查是否处于惩罚期，如果是则返回 true 并提示
   */
  const checkPenaltyTime = (): boolean => {
    if (isPenalized()) {
      // 触发冻结振动反馈
      triggerFreezeFeedback();
      const msg =
        penaltyEndTime.value === -1 ? "灵魂已被永久封印，无法施法..." : "灵魂虚弱，暂时无法施法...";
      showNotify({
        type: "warning",
        message: msg,
      });
      return true;
    }
    return false;
  };

  return {
    wrongCount,
    penaltyEndTime,
    isError,
    loadPenaltyState,
    savePenaltyState,
    clearPenalty,
    triggerErrorEffect,
    handleWrongHelper,
    handleWrongWithoutPenalty,
    isPenalized,
    checkPenaltyTime,
  };
}
