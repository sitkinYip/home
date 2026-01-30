import { ref } from "vue";
import successSound from "@/assets/success.mp3";

/**
 * 反馈效果 Hook
 * 处理成功音效播放和错误/冻结时的振动反馈
 */
export function useFeedback() {
  // 音频元素引用
  const audioRef = ref<HTMLAudioElement | null>(null);

  /**
   * 初始化音频
   */
  const initAudio = () => {
    if (!audioRef.value) {
      audioRef.value = new Audio(successSound);
      audioRef.value.preload = "auto";
    }
  };

  /**
   * 播放成功音效
   */
  const playSuccessSound = () => {
    try {
      initAudio();
      if (audioRef.value) {
        audioRef.value.currentTime = 0;
        audioRef.value.play().catch((e) => {
          console.warn("播放成功音效失败:", e);
        });
      }
    } catch (e) {
      console.warn("播放成功音效异常:", e);
    }
  };

  /**
   * 触发设备振动
   * 兼容原生 Vibration API 和微信 JSSDK
   * @param pattern 振动模式，单个数字或数组（振动-暂停-振动模式）
   */
  const vibrate = (pattern: number | number[] = 200) => {
    // 尝试原生 Vibration API
    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
        return;
      }
    } catch (e) {
      console.warn("原生振动 API 调用失败:", e);
    }

    // 尝试微信 JSSDK 振动
    try {
      // 短振动（约15ms）
      if (typeof wx !== "undefined" && wx.vibrateShort) {
        wx.vibrateShort({
          type: "heavy",
          success: () => {},
          fail: () => {},
        });
        return;
      }
    } catch (e) {
      console.warn("微信短振动调用失败:", e);
    }

    // 尝试微信长振动（约400ms）
    try {
      if (typeof wx !== "undefined" && wx.vibrateLong) {
        wx.vibrateLong({
          success: () => {},
          fail: () => {},
        });
        return;
      }
    } catch (e) {
      console.warn("微信长振动调用失败:", e);
    }
  };

  /**
   * 错误反馈 - 振动
   */
  const triggerErrorFeedback = () => {
    vibrate([100, 50, 100]); // 短振动模式
  };

  /**
   * 冻结反馈 - 振动
   */
  const triggerFreezeFeedback = () => {
    vibrate(300); // 长振动
  };

  /**
   * 成功反馈 - 播放音效
   */
  const triggerSuccessFeedback = () => {
    playSuccessSound();
  };

  return {
    playSuccessSound,
    vibrate,
    triggerErrorFeedback,
    triggerFreezeFeedback,
    triggerSuccessFeedback,
  };
}

// 微信 JSSDK 类型声明
declare const wx: {
  vibrateShort?: (options: { type?: string; success?: () => void; fail?: () => void }) => void;
  vibrateLong?: (options: { success?: () => void; fail?: () => void }) => void;
};
