<!-- components/ClueArtifact/VideoMiniPlayer.vue -->
<!-- 视频迷你播放器组件：全屏模式下可切换为内嵌视频播放器 -->
<template>
  <div class="video-mini-player" :class="{ 'player-active': isPlayerActive }">
    <!-- 切换按钮 -->
    <div class="player-toggle" @click="togglePlayer" v-if="!isPlayerActive">
      <div class="toggle-btn">
        <el-icon :size="toVpx(18)">
          <VideoPlay />
        </el-icon>
        <span class="toggle-text">点击播放视频</span>
      </div>
      <div class="toggle-decoration">
        <span class="deco-line"></span>
        <span class="deco-dot"></span>
        <span class="deco-line"></span>
      </div>
    </div>

    <!-- 视频播放器区域 -->
    <transition name="player-fade">
      <div v-if="isPlayerActive" class="player-container">
        <!-- 关闭按钮 -->
        <div class="player-close" @click="closePlayer">
          <el-icon :size="toVpx(16)">
            <Close />
          </el-icon>
        </div>

        <!-- 视频播放器 -->
        <video
          ref="videoRef"
          :src="url"
          class="video-element"
          controls
          playsinline
          webkit-playsinline
          x5-video-player-type="h5"
          x5-video-player-fullscreen="true"
          @ended="handleEnded"
        >
          您的浏览器不支持视频播放
        </video>

        <!-- 魔法装饰边框 -->
        <div class="player-magic-border"></div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, nextTick } from "vue";
import { VideoPlay, Close } from "@element-plus/icons-vue";
import { toVpx } from "@/utils/toVpx";

const props = defineProps<{
  url: string;
}>();

const emit = defineEmits(["expand", "collapse"]);

const isPlayerActive = ref(false);
const videoRef = ref<HTMLVideoElement | null>(null);

const togglePlayer = async () => {
  isPlayerActive.value = true;
  emit("expand");
  await nextTick();
  videoRef.value?.play();
};

const closePlayer = () => {
  if (videoRef.value) {
    videoRef.value.pause();
    videoRef.value.currentTime = 0;
  }
  isPlayerActive.value = false;
  emit("collapse");
};

const handleEnded = () => {
  // 播放结束后可选择自动关闭或保持
};
</script>

<style lang="scss" scoped>
@use "../../_variables.scss" as *;

.video-mini-player {
  margin-top: 12vpx;
  border-radius: 12vpx;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.3);
  border: 1vpx solid rgba($magic-purple, 0.3);
  transition: all 0.3s ease;

  &.player-active {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba($magic-purple, 0.5);
  }
}

.player-toggle {
  padding: 16vpx;
  cursor: pointer;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10vpx;
    color: $magic-purple;
    font-size: 14vpx;
    font-weight: 500;
    margin-bottom: 10vpx;

    .el-icon {
      animation: pulse-icon 2s ease-in-out infinite;
    }
  }

  .toggle-decoration {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8vpx;

    .deco-line {
      width: 40vpx;
      height: 1vpx;
      background: linear-gradient(to right, transparent, rgba($magic-purple, 0.5), transparent);
    }

    .deco-dot {
      width: 6vpx;
      height: 6vpx;
      border-radius: 50%;
      background: $magic-purple;
      animation: dot-pulse 1.5s ease-in-out infinite;
    }
  }
}

.player-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: #000;
  -webkit-transform: translateZ(0);
  transform: translateZ(0);

  .player-close {
    position: absolute;
    top: 8vpx;
    right: 8vpx;
    z-index: 10;
    width: 28vpx;
    height: 28vpx;
    border-radius: 50%;
    background: rgba(0, 0, 0, 0.6);
    border: 1vpx solid rgba(255, 255, 255, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    cursor: pointer;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.9);
      background: rgba($magic-purple, 0.6);
    }
  }

  .video-element {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
    // iOS 微信浏览器兼容
    -webkit-object-fit: contain;
  }

  .player-magic-border {
    position: absolute;
    inset: 0;
    border: 2vpx solid transparent;
    background: linear-gradient(135deg, rgba($magic-purple, 0.4), rgba($magic-gold, 0.3)) border-box;
    -webkit-mask:
      linear-gradient(#fff 0 0) padding-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) padding-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
  }
}

// 动画
@keyframes pulse-icon {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.8;
  }
}

@keyframes dot-pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

.player-fade-enter-active {
  animation: player-in 0.4s ease-out;
}
.player-fade-leave-active {
  animation: player-out 0.3s ease-in;
}

@keyframes player-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes player-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}
</style>
