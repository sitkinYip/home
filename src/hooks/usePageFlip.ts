import { ref, computed, onUnmounted } from "vue";

export type FlipDirection = "forward" | "backward";

/**
 * 通用翻页 composable
 *
 * 提供翻页状态管理、翻页动画控制、触摸手势翻页支持
 */
export function usePageFlip() {
  const currentPage = ref(0);
  const totalPages = ref(1);
  const isFlipping = ref(false);
  const flipDirection = ref<FlipDirection>("forward");
  const flipDuration = 800;

  const canFlipForward = computed(() => currentPage.value < totalPages.value - 1);
  const canFlipBackward = computed(() => currentPage.value > 0);

  const flipForward = (): Promise<void> => {
    return new Promise((resolve) => {
      if (!canFlipForward.value || isFlipping.value) {
        resolve();
        return;
      }
      isFlipping.value = true;
      flipDirection.value = "forward";

      setTimeout(() => {
        currentPage.value++;
        setTimeout(() => {
          isFlipping.value = false;
          resolve();
        }, flipDuration);
      }, 10);
    });
  };

  const flipBackward = (): Promise<void> => {
    return new Promise((resolve) => {
      if (!canFlipBackward.value || isFlipping.value) {
        resolve();
        return;
      }
      isFlipping.value = true;
      flipDirection.value = "backward";

      setTimeout(() => {
        currentPage.value--;
        setTimeout(() => {
          isFlipping.value = false;
          resolve();
        }, flipDuration);
      }, 10);
    });
  };

  const resetPages = () => {
    currentPage.value = 0;
    totalPages.value = 1;
    isFlipping.value = false;
    flipDirection.value = "forward";
  };

  // --- 触摸手势翻页 ---
  let touchStartX = 0;
  let touchStartY = 0;
  let swipeEnabled = false;
  let gestureContainer: HTMLElement | null = null;

  const onTouchStart = (event: TouchEvent) => {
    if (!swipeEnabled || isFlipping.value) return;
    const touch = event.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  };

  const onTouchEnd = (event: TouchEvent) => {
    if (!swipeEnabled || isFlipping.value) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // 最小滑动距离 40px，且水平滑动幅度大于垂直
    if (absDeltaX < 40 || absDeltaX < absDeltaY) return;

    if (deltaX < 0) {
      // 向左滑 → 下一页
      flipForward();
    } else {
      // 向右滑 → 上一页
      flipBackward();
    }
  };

  /**
   * 启用触摸手势翻页
   * @param container 需要监听手势的 DOM 元素
   */
  const enableSwipe = (container: HTMLElement) => {
    swipeEnabled = true;
    gestureContainer = container;
    container.addEventListener("touchstart", onTouchStart, { passive: true });
    container.addEventListener("touchend", onTouchEnd, { passive: true });
  };

  /**
   * 禁用触摸手势翻页
   */
  const disableSwipe = () => {
    swipeEnabled = false;
    if (gestureContainer) {
      gestureContainer.removeEventListener("touchstart", onTouchStart);
      gestureContainer.removeEventListener("touchend", onTouchEnd);
      gestureContainer = null;
    }
  };

  /**
   * 设置是否允许手势翻页（打字完成后开启）
   */
  const setSwipeEnabled = (enabled: boolean) => {
    swipeEnabled = enabled;
  };

  onUnmounted(() => {
    disableSwipe();
  });

  return {
    currentPage,
    totalPages,
    isFlipping,
    flipDirection,
    flipDuration,
    canFlipForward,
    canFlipBackward,
    flipForward,
    flipBackward,
    resetPages,
    enableSwipe,
    disableSwipe,
    setSwipeEnabled,
  };
}
