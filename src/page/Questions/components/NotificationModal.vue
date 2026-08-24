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
  background: rgba(20, 17, 13, 0.85);
  backdrop-filter: blur(20vpx);
  -webkit-backdrop-filter: blur(20vpx);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30vpx;
  perspective: 1000vpx;
}

// 单一暖光晕（去掉紫色）
.notif-bg-glow {
  position: absolute;
  width: 500vpx;
  height: 500vpx;
  background: radial-gradient(circle, rgba($ember, 0.16) 0%, transparent 70%);
  animation: glow-pulse 5s ease-in-out infinite alternate;
  pointer-events: none;
}

@keyframes glow-pulse {
  from {
    transform: scale(0.8);
    opacity: 0.35;
  }
  to {
    transform: scale(1.2);
    opacity: 0.65;
  }
}

.notif-panel {
  width: 100%;
  max-width: 320vpx;
  min-height: 200vpx;
  background: rgba(39, 31, 23, 0.72) !important;
  border: 1vpx solid $glass-border-strong !important;
  box-shadow:
    0 0 40vpx rgba(0, 0, 0, 0.6),
    inset 0 0 20vpx rgba($ember, 0.08) !important;
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

// 四角装饰：收敛为单色细角（去掉金色发光圆点）
.corner-ornament {
  position: absolute;
  width: 28vpx;
  height: 28vpx;
  border: 1.5vpx solid transparent;
  pointer-events: none;
  z-index: 3;

  &.corner-tl {
    top: -5vpx;
    left: -5vpx;
    border-top-color: $ember;
    border-left-color: $ember;
  }
  &.corner-tr {
    top: -5vpx;
    right: -5vpx;
    border-top-color: $ember;
    border-right-color: $ember;
  }
  &.corner-bl {
    bottom: -5vpx;
    left: -5vpx;
    border-bottom-color: $ember;
    border-left-color: $ember;
  }
  &.corner-br {
    bottom: -5vpx;
    right: -5vpx;
    border-bottom-color: $ember;
    border-right-color: $ember;
  }
}

// 实色标题 + 单层 drop-shadow（去掉 gradient-clip + shimmer）
.magic-title {
  margin: 0;
  font-family: $font-display;
  font-size: 20vpx;
  text-align: center;
  color: $text;
  font-weight: 700;
  letter-spacing: 2vpx;
  filter: drop-shadow(0 2vpx 10vpx rgba($ember, 0.4));
}

.title-underline {
  height: 1vpx;
  margin: 12vpx auto 20vpx;
  width: 60%;
  background: linear-gradient(90deg, transparent, rgba($ember, 0.5), transparent);
}

.notif-content {
  max-height: 50vh;
  overflow-y: auto;
  margin-bottom: 30vpx;
  color: $text;
  line-height: 1.8;
  font-size: 15vpx;

  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }

  .content-text {
    white-space: pre-wrap;
    word-break: break-all;
  }

  .highlight-text {
    color: $ember;
    font-weight: 700;
    text-shadow: 0 0 5vpx rgba($ember, 0.4);
  }

  .link-text {
    color: $cyan-deep;
    text-decoration: underline;
    cursor: pointer;
    font-weight: 500;
  }

  .image-wrap {
    margin: 10vpx 0;
    border-radius: $radius-sm;
    overflow: hidden;
    border: 1vpx solid rgba(236, 230, 216, 0.2);
  }

  .video-wrap {
    margin: 15vpx 0;
    border-radius: $radius-md;
    overflow: hidden;
    border: 1vpx solid rgba($ember, 0.3);
    background: rgba(20, 17, 13, 0.4);
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
      background: $ink-900;

      .poster-img {
        opacity: 0.7;
      }

      .video-placeholder {
        color: $text-faint;
      }

      .play-icon-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: $ember;
        text-shadow: 0 0 20vpx rgba(20, 17, 13, 0.8);
        background: rgba(20, 17, 13, 0.2);
      }
    }

    .video-info {
      padding: 8vpx;
      text-align: center;
      font-size: 12vpx;
      color: $ember;
      background: $ember-faint;
      border-top: 1vpx solid rgba($ember, 0.2);
    }
  }
}

// 单色 ember 按钮（去掉紫渐变 + 永续 flare）
.confirm-btn {
  width: 100%;
  height: 48vpx;
  border-radius: $radius-pill;
  border: none;
  background: $ember;
  color: $ink-900;
  font-size: 16vpx;
  font-weight: 700;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4vpx 15vpx rgba($ember, 0.25);
  transition:
    transform 0.2s,
    background 0.2s;

  &:active {
    transform: scale(0.96);
    background: $ember-bright;
  }

  .btn-text {
    position: relative;
    z-index: 2;
  }

  // btn-flare 节点保留，仅按压时一次
  .btn-flare {
    position: absolute;
    top: 0;
    left: -150%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.18), transparent);
    transform: skewX(-20deg);
    pointer-events: none;
    opacity: 0;
  }

  &:active .btn-flare {
    animation: flare-once 0.6s ease-out;
  }
}

@keyframes flare-once {
  0% {
    left: -150%;
    opacity: 0;
  }
  30% {
    opacity: 1;
  }
  100% {
    left: 150%;
    opacity: 0;
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
    filter: brightness(2.2);
  }
  100% {
    transform: scale(1) rotate(0);
    opacity: 1;
    filter: brightness(1);
  }
}

// 光爆：收敛到 ember
@keyframes burst-flash {
  0% {
    inset: 0;
    background: $text;
    border-radius: 50%;
    opacity: 0.8;
    transform: scale(0);
  }
  100% {
    inset: -100vpx;
    background: $ember;
    border-radius: 50%;
    opacity: 0;
    transform: scale(3);
  }
}
</style>
