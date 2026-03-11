/**
 * @file useBgm.ts
 * @description 背景音乐管理 composable，处理播放、暂停、自动播放失效后的用户授权等逻辑
 */

import { ref, onUnmounted } from "vue";
import { onBeforeRouteLeave } from "vue-router";
import { tracker } from "@/utils/eventTracker";

export function useBgm() {
  // 状态
  const isPlaying = ref(false);
  const showAuthHint = ref(false);
  const hasBgm = ref(false);

  // 音频实例
  let bgmAudio: HTMLAudioElement | null = null;
  let authHintTimer: ReturnType<typeof setTimeout> | null = null;
  let hasTrackedFirstPlay = false;

  /**
   * 初始化背景音乐
   * @param url 音频URL
   */
  const initBgm = async (url: string) => {
    if (!url) return;

    hasBgm.value = true;

    // 清理旧实例
    if (bgmAudio) {
      bgmAudio.pause();
      bgmAudio = null;
    }

    bgmAudio = new Audio(url);
    bgmAudio.loop = true;
    bgmAudio.volume = 0.3;

    // 监听播放状态
    bgmAudio.addEventListener("play", () => {
      isPlaying.value = true;
      showAuthHint.value = false;
      clearAuthHintTimer();

      if (!hasTrackedFirstPlay) {
        tracker.trackMediaPlay("audio", url, "背景音乐");
        hasTrackedFirstPlay = true;
      }
    });

    bgmAudio.addEventListener("pause", () => {
      isPlaying.value = false;
    });

    // 尝试自动播放
    try {
      await bgmAudio.play();
    } catch (e) {
      console.warn("BGM 自动播放被拦截，等待用户授权:", e);
      // 显示授权提示
      showAuthHint.value = true;
      // 5秒后自动关闭
      startAuthHintTimer();
    }
  };

  /**
   * 启动授权提示自动关闭计时器
   */
  const startAuthHintTimer = () => {
    clearAuthHintTimer();
    authHintTimer = setTimeout(() => {
      showAuthHint.value = false;
    }, 5000);
  };

  /**
   * 清除授权提示计时器
   */
  const clearAuthHintTimer = () => {
    if (authHintTimer) {
      clearTimeout(authHintTimer);
      authHintTimer = null;
    }
  };

  /**
   * 播放
   */
  const play = () => {
    if (bgmAudio) {
      bgmAudio.play().catch((e) => console.warn("播放失败:", e));
    }
  };

  /**
   * 暂停
   */
  const pause = () => {
    if (bgmAudio) {
      bgmAudio.pause();
    }
  };

  /**
   * 切换播放/暂停
   */
  const toggle = () => {
    if (isPlaying.value) {
      pause();
    } else {
      play();
    }
  };

  /**
   * 用户授权播放（点击授权提示后调用）
   */
  const authorize = () => {
    showAuthHint.value = false;
    clearAuthHintTimer();
    play();
  };

  /**
   * 关闭授权提示（不播放）
   */
  const dismissAuthHint = () => {
    showAuthHint.value = false;
    clearAuthHintTimer();
  };

  /**
   * 停止并清理资源
   */
  const stopAndCleanup = () => {
    if (bgmAudio) {
      bgmAudio.pause();
      bgmAudio = null;
    }
    isPlaying.value = false;
    showAuthHint.value = false;
    hasBgm.value = false;
    clearAuthHintTimer();
  };

  // 路由离开时自动停止
  onBeforeRouteLeave(() => {
    stopAndCleanup();
  });

  // 组件卸载时清理
  onUnmounted(() => {
    stopAndCleanup();
  });

  return {
    // 状态
    isPlaying,
    showAuthHint,
    hasBgm,
    // 方法
    initBgm,
    play,
    pause,
    toggle,
    authorize,
    dismissAuthHint,
    stopAndCleanup,
  };
}
