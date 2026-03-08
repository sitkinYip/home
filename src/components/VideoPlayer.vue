<template>
  <Teleport to="body">
    <transition name="video-fade">
      <div v-if="dialogVisible" class="magic-video-overlay" @click.self="dialogVisible = false">
        <div class="video-portal">
          <!-- 魔法边框装饰 -->
          <div class="video-frame-border"></div>

          <div class="video-wrapper">
            <!-- 视频提示文字（配置时显示） -->
            <transition name="tip-slide-down">
              <div v-if="dialogVisible && tipsText" class="video-tips-text">
                {{ tipsText }}
              </div>
            </transition>

            <video
              ref="videoPlayer"
              :src="videoUrl"
              controls
              class="video-element"
              playsinline
              webkit-playsinline
              autoplay
            ></video>

            <!-- 魔法关闭按钮 -->
            <div class="magic-close-btn" @click="dialogVisible = false">
              <el-icon><Close /></el-icon>
            </div>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted, onUnmounted } from "vue";
import { Close } from "@element-plus/icons-vue";

const dialogVisible = ref(false);
const videoUrl = ref("");
const videoPlayer = ref<HTMLVideoElement | null>(null);
const tipsText = ref("");
const tipsDuration = ref(0);

let tipsTimer: ReturnType<typeof setTimeout> | null = null;

const clearTipsTimer = () => {
  if (tipsTimer) {
    clearTimeout(tipsTimer);
    tipsTimer = null;
  }
};

const startTipsTimer = () => {
  clearTipsTimer();
  if (tipsDuration.value > 0 && tipsText.value) {
    tipsTimer = setTimeout(() => {
      tipsText.value = "";
    }, tipsDuration.value);
  }
};
let externalEndedCallback: (() => void) | null = null;

/** 外部注册的视频关闭回调（一次性，用户手动关闭视频时触发） */
let externalClosedCallback: (() => void) | null = null;

const handleVideoEnded = () => {
  dialogVisible.value = false;
  if (externalEndedCallback) {
    externalEndedCallback();
    externalEndedCallback = null;
  }
  // 正常播放结束，清除关闭回调（不需要再触发）
  externalClosedCallback = null;
};

/**
 * 打开视频播放器，可选配置提示文字
 * @param url 视频 URL
 * @param tips 提示文字（可选），会根据长度自动计算显示时长（1 字/秒）
 */
const open = (url: string, tips?: string) => {
  videoUrl.value = url;
  tipsText.value = tips || "";
  // 根据文字长度计算显示时长（1 字 1 秒，最少 3 秒，最多 10 秒）
  if (tips) {
    const charCount = tips.replace(/\s/g, "").length; // 去除空白字符后统计
    tipsDuration.value = Math.min(Math.max(charCount * 1000, 3000), 10000);
  } else {
    tipsDuration.value = 0;
  }
  dialogVisible.value = true;
  // 视频打开后启动提示计时器
  nextTick(() => {
    startTipsTimer();
  });
};

/**
 * 注册一次性的视频播放结束回调
 * 回调在视频播放结束后触发一次并自动清除
 */
const onEnded = (callback: () => void) => {
  externalEndedCallback = callback;
};

/**
 * 注册一次性的视频被手动关闭回调
 * 仅在用户主动关闭视频（非自然播放结束）时触发
 */
const onClosed = (callback: () => void) => {
  externalClosedCallback = callback;
};

/**
 * 清除外部注册的 onEnded 回调（用于外层主动取消等待场景）
 */
const clearOnEnded = () => {
  externalEndedCallback = null;
  externalClosedCallback = null;
};

const handleClose = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause();
    videoPlayer.value.currentTime = 0;
  }
  // 用户手动关闭视频时，清除 onEnded 回调，避免误触发跳转
  externalEndedCallback = null;
  // 触发关闭回调，通知外层视频被手动关闭
  if (externalClosedCallback) {
    externalClosedCallback();
    externalClosedCallback = null;
  }
  // 清除提示计时器
  clearTipsTimer();
};

watch(dialogVisible, async (val) => {
  if (val) {
    await nextTick();
    if (videoPlayer.value) {
      videoPlayer.value.removeEventListener("ended", handleVideoEnded);
      videoPlayer.value.addEventListener("ended", handleVideoEnded);
      videoPlayer.value.play().catch(() => {
        console.log("Autoplay blocked, waiting for user interaction");
      });
    }
  } else {
    handleClose();
  }
});

// 组件卸载时清理计时器
onUnmounted(() => {
  clearTipsTimer();
});

// 暴露 open、onEnded、onClosed、clearOnEnded 方法给父组件
defineExpose({ open, onEnded, onClosed, clearOnEnded });
</script>

<style lang="scss" scoped>
.magic-video-overlay {
  position: fixed;
  inset: 0;
  z-index: 10010; // 高于 MagicScroll(10005)，确保视频播放器在弹窗之上
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(15vpx);
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-portal {
  position: relative;
  width: 90vw;
  max-width: 600vpx;
  animation: portal-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.video-frame-border {
  position: absolute;
  inset: -2vpx;
  border: 1vpx solid rgba(255, 215, 0, 0.5);
  border-radius: 12vpx;
  box-shadow: 0 0 20vpx rgba(255, 215, 0, 0.3);
  pointer-events: none;
  &::before {
    content: "";
    position: absolute;
    inset: -8vpx;
    border: 1vpx dashed rgba(255, 215, 0, 0.2);
    border-radius: 16vpx;
  }
}

.video-wrapper {
  position: relative;
  border-radius: 10vpx;
  overflow: hidden;
  background: #000;

  .video-element {
    width: 100%;
    display: block;
    // 隐藏不必要的控件或美化
    &::-webkit-media-controls-enclosure {
      border-radius: 0;
    }
  }

  // 视频提示文字样式
  .video-tips-text {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 12vpx 20vpx;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.85), transparent);
    color: $magic-gold;
    font-size: 14vpx;
    font-weight: 500;
    text-align: center;
    text-shadow: 0 2vpx 4vpx rgba(0, 0, 0, 0.8), 0 0 8vpx rgba($magic-gold, 0.4);
    z-index: 11;
    pointer-events: none; // 不干扰视频操作
    letter-spacing: 1vpx;
    backdrop-filter: blur(4vpx);
    white-space: pre-wrap; // 支持换行
    line-height: 1.6;
  }
}

.magic-close-btn {
  position: absolute;
  top: 10vpx;
  right: 10vpx;
  width: 32vpx;
  height: 32vpx;
  background: rgba(0, 0, 0, 0.6);
  border: 1vpx solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  cursor: pointer;
  z-index: 10;
}

@keyframes portal-in {
  from {
    opacity: 0;
    transform: scale(0.8) translateY(20vpx);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.video-fade-enter-active,
.video-fade-leave-active {
  transition: all 0.4s;
}
.video-fade-enter-from,
.video-fade-leave-to {
  opacity: 0;
  filter: blur(20vpx);
}

// 提示文字下滑入场动画
.tip-slide-down-enter-active {
  transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.tip-slide-down-enter-from {
  opacity: 0;
  transform: translateY(-20vpx);
}

// 提示文字淡出动画
tip-hide {
  transition: all 0.8s ease;
  opacity: 0;
  filter: blur(8vpx);
  transform: translateY(-10vpx);
}
</style>
