<template>
  <Teleport to="body">
    <transition name="notif-modal">
      <div v-if="visible" class="notif-overlay" @click.self="handleClose">
        <!-- 魔法背景光晕 -->
        <div class="notif-bg-glow"></div>

        <!-- 面板区域 -->
        <div class="notif-panel magic-panel">
          <div class="panel-inner">
            <!-- 四角装饰 -->
            <div class="corner-ornament corner-tl"></div>
            <div class="corner-ornament corner-tr"></div>
            <div class="corner-ornament corner-bl"></div>
            <div class="corner-ornament corner-br"></div>

            <!-- 光爆效果层 -->
            <div class="burst-layer"></div>

            <header class="notif-header">
              <h2 class="magic-title">{{ item?.popupTitle || "✨ 魔法通知 ✨" }}</h2>
              <div class="title-underline"></div>
            </header>

            <main class="notif-content custom-scrollbar">
              <div class="content-text">
                <template v-for="(segment, index) in parsedContent" :key="index">
                  <!-- 普通文本 -->
                  <span v-if="segment.type === 'text'">{{ segment.content }}</span>

                  <!-- 高亮文本 -->
                  <span v-else-if="segment.type === 'highlight'" class="highlight-text">
                    {{ segment.content }}
                  </span>

                  <!-- 链接 -->
                  <span
                    v-else-if="segment.type === 'link'"
                    class="link-text"
                    @click="handleLinkClick(segment.url!)"
                  >
                    {{ segment.content }}
                  </span>

                  <!-- 图片 -->
                  <div v-else-if="segment.type === 'image'" class="image-wrap">
                    <van-image
                      :src="segment.url"
                      width="100%"
                      fit="contain"
                      class="notif-img"
                      @click="handleImageClick(segment.url!)"
                    />
                  </div>

                  <!-- 视频 -->
                  <div
                    v-else-if="segment.type === 'video'"
                    class="video-wrap"
                    @click="openVideoPlayer(segment.url!)"
                  >
                    <div class="video-poster">
                      <van-image
                        v-if="segment.poster"
                        :src="segment.poster"
                        width="100%"
                        fit="cover"
                        class="poster-img"
                      />
                      <div v-else class="video-placeholder">
                        <el-icon :size="toVpx(40)"><VideoPlay /></el-icon>
                      </div>
                      <div class="play-icon-overlay">
                        <el-icon :size="toVpx(48)"><VideoPlay /></el-icon>
                      </div>
                    </div>
                    <div class="video-info">点击播放视频</div>
                  </div>

                  <!-- 换行 -->
                  <br v-else-if="segment.type === 'br'" />
                </template>
              </div>
            </main>

            <footer class="notif-footer">
              <button class="confirm-btn" @click="handleClose">
                <span class="btn-text">{{ item?.buttonText || "✨ 知晓了" }}</span>
                <span class="btn-flare"></span>
              </button>
            </footer>
          </div>
        </div>
      </div>
    </transition>
    <VideoPlayer ref="videoPlayerRef" />
  </Teleport>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { VideoPlay } from "@element-plus/icons-vue";
import { NotificationRecord } from "@/types/qa";
import { useContentParser } from "../composables/useContentParser";
import { toVpx } from "@/utils/toVpx";
import VideoPlayer from "@/components/VideoPlayer.vue";
import { tracker, EventType } from "@/utils/eventTracker";

const visible = ref(false);
const item = ref<NotificationRecord | null>(null);
const rawContent = ref("");

// 使用公共解析 Hook
const { parsedContent, handleLinkClick, handleImageClick } = useContentParser(rawContent);

const videoPlayerRef = ref<any>(null);
const openVideoPlayer = (url: string) => {
  videoPlayerRef.value?.open(url);
};

/**
 * 展示弹窗
 */
const show = (data: NotificationRecord) => {
  item.value = data;
  rawContent.value = data.content;
  visible.value = true;

  // 上报弹窗打开事件
  tracker.track({
    type: EventType.MODAL_OPEN,
    title: data.popupTitle || "魔法通知",
    content: data.title,
    extra: {
      notificationId: data.id,
    },
  });
};

/**
 * 关闭弹窗
 */
const handleClose = () => {
  visible.value = false;
  if (item.value) {
    tracker.track({
      type: EventType.MODAL_CLOSE,
      title: item.value.popupTitle || "魔法通知",
      content: item.value.title,
      extra: {
        notificationId: item.value.id,
      },
    });
  }
};

defineExpose({ show });
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

.notif-overlay {
  position: fixed;
  inset: 0;
  z-index: 101; // 高于 MagicScroll
  background: rgba(10, 5, 20, 0.85);
  backdrop-filter: blur(20vpx);
  -webkit-backdrop-filter: blur(20vpx);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30vpx;
  perspective: 1000vpx;
}

.notif-bg-glow {
  position: absolute;
  width: 500vpx;
  height: 500vpx;
  background: radial-gradient(circle, rgba($magic-purple, 0.25) 0%, transparent 70%);
  animation: glow-pulse 4s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes glow-pulse {
  from {
    transform: scale(0.8);
    opacity: 0.4;
  }
  to {
    transform: scale(1.2);
    opacity: 0.8;
  }
}

.notif-panel {
  width: 100%;
  max-width: 320vpx;
  min-height: 200vpx;
  background: rgba(25, 15, 45, 0.7) !important;
  border: 1vpx solid rgba($magic-gold, 0.4) !important;
  box-shadow:
    0 0 40vpx rgba(0, 0, 0, 0.6),
    inset 0 0 20vpx rgba($magic-purple, 0.3) !important;
  position: relative;
  overflow: visible;

  .panel-inner {
    padding: 30vpx 24vpx;
    display: flex;
    flex-direction: column;
    height: 100%;
    position: relative;
    z-index: 2;
  }
}

// 四角装饰
.corner-ornament {
  position: absolute;
  width: 30vpx;
  height: 30vpx;
  border: 2vpx solid transparent;
  pointer-events: none;
  z-index: 3;

  &::before {
    content: "";
    position: absolute;
    width: 6vpx;
    height: 6vpx;
    background: $magic-gold;
    border-radius: 50%;
    box-shadow: 0 0 10vpx $magic-gold;
  }

  &.corner-tl {
    top: -5vpx;
    left: -5vpx;
    border-top-color: $magic-gold;
    border-left-color: $magic-gold;
    &::before {
      top: -3vpx;
      left: -3vpx;
    }
  }
  &.corner-tr {
    top: -5vpx;
    right: -5vpx;
    border-top-color: $magic-gold;
    border-right-color: $magic-gold;
    &::before {
      top: -3vpx;
      right: -3vpx;
    }
  }
  &.corner-bl {
    bottom: -5vpx;
    left: -5vpx;
    border-bottom-color: $magic-gold;
    border-left-color: $magic-gold;
    &::before {
      bottom: -3vpx;
      left: -3vpx;
    }
  }
  &.corner-br {
    bottom: -5vpx;
    right: -5vpx;
    border-bottom-color: $magic-gold;
    border-right-color: $magic-gold;
    &::before {
      bottom: -3vpx;
      right: -3vpx;
    }
  }
}

.magic-title {
  margin: 0;
  font-size: 20vpx;
  text-align: center;
  color: #fff;
  text-shadow: 0 0 10vpx rgba($magic-gold, 0.8);
  font-family: serif;
  letter-spacing: 2vpx;
  background: linear-gradient(90deg, #fff, $magic-gold, #fff);
  background-size: 200% auto;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  animation: shine 3s linear infinite;
}

@keyframes shine {
  to {
    background-position: 200% center;
  }
}

.title-underline {
  height: 2vpx;
  margin: 12vpx auto 20vpx;
  width: 60%;
  background: linear-gradient(90deg, transparent, $magic-gold, transparent);
}

.notif-content {
  max-height: 50vh;
  overflow-y: auto;
  margin-bottom: 30vpx;
  color: rgba(255, 255, 255, 0.9);
  line-height: 1.8;
  font-size: 15vpx;

  /* 彻底隐藏滚动条 */
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  &::-webkit-scrollbar {
    display: none; /* Chrome/Safari */
  }

  .content-text {
    white-space: pre-wrap;
    word-break: break-all;
  }

  .highlight-text {
    color: $magic-gold;
    font-weight: bold;
    text-shadow: 0 0 5vpx rgba($magic-gold, 0.5);
  }

  .link-text {
    color: #4facfe;
    text-decoration: underline;
    cursor: pointer;
    font-weight: 500;
  }

  .image-wrap {
    margin: 10vpx 0;
    border-radius: 8vpx;
    overflow: hidden;
    border: 1vpx solid rgba(255, 255, 255, 0.2);
  }

  .video-wrap {
    margin: 15vpx 0;
    border-radius: 12vpx;
    overflow: hidden;
    border: 1vpx solid rgba($magic-gold, 0.3);
    background: rgba(0, 0, 0, 0.4);
    cursor: pointer;
    transition: all 0.3s;

    &:active {
      transform: scale(0.98);
    }

    .video-poster {
      position: relative;
      width: 100%;
      height: 160vpx;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;

      .poster-img {
        opacity: 0.7;
      }

      .video-placeholder {
        color: rgba(255, 255, 255, 0.3);
      }

      .play-icon-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $magic-gold;
        text-shadow: 0 0 20vpx rgba(0, 0, 0, 0.8);
        background: rgba(0, 0, 0, 0.2);
      }
    }

    .video-info {
      padding: 8vpx;
      text-align: center;
      font-size: 12vpx;
      color: $magic-gold;
      background: rgba($magic-gold, 0.1);
      border-top: 1vpx solid rgba($magic-gold, 0.2);
    }
  }
}

.confirm-btn {
  width: 100%;
  height: 48vpx;
  border-radius: 24vpx;
  border: none;
  background: linear-gradient(135deg, $magic-purple 0%, #4834d4 100%);
  color: #fff;
  font-size: 16vpx;
  font-weight: bold;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4vpx 15vpx rgba(0, 0, 0, 0.3);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.96);
  }

  .btn-text {
    position: relative;
    z-index: 2;
  }

  .btn-flare {
    position: absolute;
    top: 0;
    left: -150%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent);
    transform: skewX(-20deg);
    animation: flare 4s infinite;
  }
}

@keyframes flare {
  0% {
    left: -150%;
  }
  30% {
    left: 150%;
  }
  100% {
    left: 150%;
  }
}

/* 进场动画 */
.notif-modal-enter-active {
  transition: opacity 0.4s;
  .notif-panel {
    animation: modal-burst 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  }
  .burst-layer {
    animation: burst-flash 0.5s ease-out;
  }
}

.notif-modal-leave-active {
  transition: opacity 0.3s;
  .notif-panel {
    transition:
      transform 0.3s,
      opacity 0.3s;
    transform: scale(0.9);
    opacity: 0;
  }
}

@keyframes modal-burst {
  0% {
    transform: scale(0.4) rotate(-5deg);
    opacity: 0;
    filter: brightness(3);
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
    filter: brightness(1);
  }
}

@keyframes burst-flash {
  0% {
    inset: 0;
    background: #fff;
    border-radius: 50%;
    opacity: 1;
    transform: scale(0);
  }
  100% {
    inset: -100vpx;
    background: $magic-gold;
    border-radius: 50%;
    opacity: 0;
    transform: scale(3);
  }
}
</style>
