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
$magic-gold: #ffd700;

.quest-item-block {
  margin-bottom: 12vpx;
  animation: slide-up 0.6s ease-out;
}

.media-container {
  position: relative;
  border-radius: 12vpx;
  overflow: hidden;
  border: 1vpx solid rgba($magic-gold, 0.3);
  background: #000;
  margin-bottom: 16vpx;
  cursor: pointer; // 增加点击手型感

  .media-element {
    width: 100%;
    display: block;
    max-height: 220vpx;
    // 确保 Element 的 Image 组件不会拦截点击
    pointer-events: auto;
  }
}

// 视频无封面占位：魔法阵
.video-placeholder {
  width: 100%;
  height: 180vpx;
  background: radial-gradient(circle at center, #1a0f2e 0%, #000 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  .ritual-circle {
    position: absolute;
    width: 100vpx;
    height: 100vpx;
    border: 1vpx dashed rgba($magic-gold, 0.2);
    border-radius: 50%;
    animation: rotateCW 12s linear infinite;
  }
  .ritual-icon {
    font-size: 28vpx;
    color: rgba($magic-gold, 0.3);
  }
}

.video-play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.4);
  z-index: 5;
  .play-icon {
    font-size: 44vpx;
    color: $magic-gold;
    filter: drop-shadow(0 0 10vpx $magic-gold);
  }
  .play-text {
    color: $magic-gold;
    font-size: 12vpx;
    margin-top: 10vpx;
    letter-spacing: 2vpx;
    font-weight: bold;
  }
  .play-icon-ripple {
    position: absolute;
    width: 64vpx;
    height: 64vpx;
    border: 2vpx solid $magic-gold;
    border-radius: 50%;
    animation: ripple 2s infinite;
  }
}

.narrative-text {
  font-size: 17vpx;
  line-height: 1.6;
  color: #fff;
  &.is-caption {
    font-size: 14vpx;
    color: rgba(255, 255, 255, 0.7);
    text-align: center;
    font-style: italic;
    padding: 0 10vpx;
    border-left: 2vpx solid $magic-gold;
    margin-top: 12vpx;
  }
}

.magic-hint-trigger {
  margin-top: 16vpx;
  display: flex;
  justify-content: center;

  .rune-stone {
    position: relative;
    display: flex;
    align-items: center;
    gap: 8vpx;
    padding: 8vpx 20vpx;
    background: rgba($magic-gold, 0.1);
    border: 1vpx solid rgba($magic-gold, 0.4);
    border-radius: 24vpx;
    color: $magic-gold;
    cursor: pointer;
    transition: all 0.3s;

    &:active {
      transform: scale(0.95);
    }

    .rune-glow {
      position: absolute;
      inset: 0;
      border-radius: 24vpx;
      box-shadow: inset 0 0 12vpx rgba($magic-gold, 0.4);
      animation: breathe 2s infinite;
    }
    .rune-tag {
      font-size: 13vpx;
      font-weight: bold;
      letter-spacing: 1vpx;
    }
  }
}

/* 动画部分保持不变 */
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
    opacity: 0.8;
  }
  100% {
    transform: scale(1.8);
    opacity: 0;
  }
}
@keyframes breathe {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.02);
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
