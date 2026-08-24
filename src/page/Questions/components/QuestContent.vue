<!-- components/QuestContent.vue -->
<template>
  <div class="quest-content-root">
    <div v-for="(item, index) in list" :key="index" class="quest-item-block">
      <!-- 媒体层：图片或视频 -->
      <div v-if="item.img || item.video" class="media-container">
        <!-- 视频逻辑 -->
        <div v-if="item.video" class="video-poster-wrap" @click="handlePlayVideo(item.video)">
          <!-- 视频封面图（点击只触发播放，不触发大图预览） -->
          <el-image v-if="item.img" :src="item.img" fit="cover" class="media-element" />
          <div v-else class="video-placeholder">
            <div class="ritual-circle"></div>
            <el-icon class="ritual-icon"><MagicStick /></el-icon>
          </div>

          <div class="video-play-overlay">
            <div class="play-icon-ripple"></div>
            <el-icon class="play-icon"><VideoPlay /></el-icon>
            <span class="play-text">点击预览影像</span>
          </div>
        </div>

        <!-- 纯图片逻辑：改用 Vant 的预览器 -->
        <el-image
          v-else-if="item.img"
          :src="item.img"
          fit="cover"
          class="media-element"
          @click="onPreviewImage(item.img, item.imgList)"
        />
      </div>

      <!-- 文字与提示层 -->
      <div class="text-and-tips">
        <div
          v-if="item.text"
          class="narrative-text"
          :class="{ 'is-caption': item.img || item.video }"
          v-html="parseText(item.text)"
        ></div>

        <!-- 魔法提示 -->
        <div v-if="item.tips" class="magic-hint-trigger">
          <div class="rune-stone" @click="showHint(item.tips)">
            <div class="rune-glow"></div>
            <el-icon><MagicStick /></el-icon>
            <span class="rune-tag">提示</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 挂载梦幻提示组件 -->
    <MagicTip ref="magicTipRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from "vue";
import { VideoPlay, MagicStick } from "@element-plus/icons-vue";
import { showImagePreview } from "vant"; // 引入 Vant 预览组件
import "vant/es/image-preview/style"; // 确保样式引入
import MagicTip from "./MagicTip.vue";
import { QuestionItemList } from "@/types/qa";

defineProps<{
  list: QuestionItemList;
}>();

const emit = defineEmits(["play-video"]);
const magicTipRef = ref<any>(null);

// 支持 \n 换行渲染
const parseText = (text: string) => (text ? text.replace(/\n/g, "<br>") : "");

const handlePlayVideo = (url: string) => {
  emit("play-video", url);
};

/**
 * 核心修改：使用 Vant 处理图片预览
 * @param currentUrl 当前点击的图片
 * @param imgList 可选的图片列表（适配你之前 JSON 里的多图模式）
 */
const onPreviewImage = (currentUrl: string, imgList?: string[]) => {
  // 如果 JSON 里配置了 imgList，则预览整个列表，否则只预览当前单张图
  const images = imgList && imgList.length > 0 ? imgList : [currentUrl];

  showImagePreview({
    images: images,
    startPosition: images.indexOf(currentUrl),
    closeable: true,
  });
};

const showHint = (tips: string) => {
  magicTipRef.value?.show(tips);
};
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

.quest-item-block {
  margin-bottom: 12vpx;
  animation: slide-up 0.6s ease-out;
}

.media-container {
  position: relative;
  border-radius: $radius-md;
  overflow: hidden;
  border: 1vpx solid rgba($ember, 0.25);
  background: $ink-900;
  margin-bottom: 16vpx;
  cursor: pointer;

  .media-element {
    width: 100%;
    display: block;
    max-height: 220vpx;
    pointer-events: auto;
  }
}

// 视频无封面占位：魔法阵（去饱和）
.video-placeholder {
  width: 100%;
  height: 180vpx;
  background: radial-gradient(circle at center, $ink-700 0%, $ink-900 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  .ritual-circle {
    position: absolute;
    width: 100vpx;
    height: 100vpx;
    border: 1vpx dashed rgba($ember, 0.18);
    border-radius: 50%;
    animation: rotateCW 12s linear infinite;
  }
  .ritual-icon {
    font-size: 28vpx;
    color: rgba($ember, 0.3);
  }
}

.video-play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(20, 17, 13, 0.45);
  z-index: 5;
  .play-icon {
    font-size: 44vpx;
    color: $ember;
    filter: drop-shadow(0 0 10vpx rgba($ember, 0.6));
  }
  .play-text {
    font-family: $font-display;
    color: $ember;
    font-size: 11vpx;
    margin-top: 10vpx;
    letter-spacing: 2vpx;
    font-weight: 600;
  }
  .play-icon-ripple {
    position: absolute;
    width: 64vpx;
    height: 64vpx;
    border: 1vpx solid rgba($ember, 0.5);
    border-radius: 50%;
    animation: ripple 2.4s infinite;
  }
}

.text-and-tips {
  width: 100%;
}

.narrative-text {
  display: flex;
  justify-content: center;
  width: 100%;
  font-size: 17vpx;
  line-height: 1.6;
  color: $text;
  text-align: left;

  &.is-caption {
    font-size: 14vpx;
    color: $text-mute;
    font-style: italic;
    padding: 0 10vpx;
    border-left: 2vpx solid $ember;
    margin-top: 12vpx;
    justify-content: center;
  }
}

// 提示按钮：暖玻璃细描边（去掉金色 pill + breathe 内阴影）
.magic-hint-trigger {
  margin-top: 12vpx;
  display: flex;
  justify-content: center;

  .rune-stone {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8vpx;
    padding: 7vpx 18vpx;
    background: $glass-bg;
    backdrop-filter: blur(8vpx);
    -webkit-backdrop-filter: blur(8vpx);
    border: 1vpx solid rgba($ember, 0.32);
    border-radius: $radius-pill;
    color: $ember;
    cursor: pointer;
    transition: all 0.3s;

    &:active {
      transform: scale(0.96);
      background: $ember-soft;
    }

    .rune-tag {
      font-size: 13vpx;
      font-weight: 600;
      letter-spacing: 1vpx;
    }
  }
}

@keyframes rotateCW {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes ripple {
  0% {
    transform: scale(1);
    opacity: 0.6;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}
@keyframes slide-up {
  from {
    opacity: 0;
    transform: translateY(20vpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
