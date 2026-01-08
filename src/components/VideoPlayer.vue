<template>
  <transition name="video-fade">
    <div v-if="dialogVisible" class="magic-video-overlay" @click.self="dialogVisible = false">
      <div class="video-portal">
        <!-- 魔法边框装饰 -->
        <div class="video-frame-border"></div>

        <div class="video-wrapper">
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
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from "vue";
import { Close } from "@element-plus/icons-vue";

const dialogVisible = ref(false);
const videoUrl = ref("");
const videoPlayer = ref<HTMLVideoElement | null>(null);

const handleVideoEnded = () => {
  dialogVisible.value = false;
};

const open = (url: string) => {
  videoUrl.value = url;
  dialogVisible.value = true;
};

const handleClose = () => {
  if (videoPlayer.value) {
    videoPlayer.value.pause();
    videoPlayer.value.currentTime = 0;
  }
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

// 关键：暴露 open 方法给父组件，保持原有逻辑不坏
defineExpose({ open });
</script>

<style lang="scss" scoped>
.magic-video-overlay {
  position: fixed;
  inset: 0;
  z-index: 10001; // 高于 AdventurePortal 和 VictoryAura
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
</style>
