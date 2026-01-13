<template>
  <div class="multiple-choice-options">
    <div
      v-for="item in options"
      :key="item.key"
      class="option-item"
      :class="{
        'is-selected': modelValue === item.key,
        'is-disabled': disabled,
      }"
      @click="handleSelect(item.key)"
    >
      <!-- 选中时的发光特效背景 -->
      <div class="option-glow"></div>

      <!-- 选项内容容器 -->
      <div class="option-content">
        <!-- 序号/Key -->
        <div class="option-key">
          <span class="key-char">{{ item.key }}</span>
          <div class="key-border"></div>
        </div>

        <!-- 文本内容 -->
        <div v-if="item.text" class="option-text">{{ item.text }}</div>

        <!-- 媒体内容: 视频优先，其次图片 -->
        <div
          v-if="item.video || item.img"
          class="option-media-wrap"
          @click.stop="handleMediaClick(item)"
        >
          <!-- 视频 Cover 或 图片 -->
          <el-image :src="item.img" class="option-media" fit="cover" v-if="item.img" />
          <!-- 无封面时的视频占位 -->
          <div v-else class="video-placeholder"></div>

          <!-- 播放按钮 (如果有视频) -->
          <div v-if="item.video" class="media-overlay">
            <el-icon class="play-icon"><VideoPlay /></el-icon>
          </div>
        </div>
      </div>

      <!-- 选中指示图标 -->
      <div class="selection-mark" v-if="modelValue === item.key">
        <div class="magic-circle"></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { OptionItem } from "@/types/qa";
import { showImagePreview } from "vant";
import { VideoPlay } from "@element-plus/icons-vue";
import "vant/es/image-preview/style";

interface Props {
  options: OptionItem[];
  modelValue: string; // 当前选中的 key
  disabled?: boolean;
}

const props = defineProps<Props>();
const emit = defineEmits(["update:modelValue", "change", "play-video"]);

const handleSelect = (key: string) => {
  if (props.disabled) return;
  if (props.modelValue === key) return;

  emit("update:modelValue", key);
  emit("change", key);
};

const handleMediaClick = (item: OptionItem) => {
  if (item.video) {
    emit("play-video", item.video);
  } else if (item.img) {
    showImagePreview({
      images: [item.img],
      closeable: true,
    });
  }
};
</script>

<style lang="scss" scoped>
$magic-gold: #ffd700;
$magic-purple: #8a2be2;
$option-bg: rgba(0, 0, 0, 0.6);
$option-hover-bg: rgba(138, 43, 226, 0.2);

.multiple-choice-options {
  display: flex;
  flex-direction: column;
  gap: 12vpx; // 14 -> 12
  width: 100%;
  margin-top: 20vpx;
  // 增加底部间距
  margin-bottom: 24vpx;
}

.option-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 15vpx; // 16 -> 15
  border-radius: 12vpx;
  background: $option-bg;
  border: 1vpx solid rgba($magic-gold, 0.3);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  user-select: none;

  &:hover:not(.is-disabled) {
    transform: translateY(-2vpx);
    border-color: rgba($magic-gold, 0.8);
    background: $option-hover-bg;
    box-shadow: 0 4vpx 12vpx rgba(0, 0, 0, 0.3);

    .key-char {
      color: #fff;
      text-shadow: 0 0 8vpx $magic-gold;
    }
  }

  &.is-selected {
    border-color: $magic-gold;
    background: rgba($magic-gold, 0.15);
    box-shadow:
      0 0 15vpx rgba($magic-gold, 0.2),
      inset 0 0 10vpx rgba($magic-gold, 0.1);

    .option-key {
      background: $magic-gold;
      border-color: #fff;
    }

    .key-char {
      color: #000;
      font-weight: bold;
    }

    .option-glow {
      opacity: 1;
    }
  }

  &.is-disabled {
    opacity: 0.6;
    cursor: not-allowed;
    filter: grayscale(0.5);
  }
}

.option-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba($magic-gold, 0.2) 0%, transparent 70%);
  opacity: 0;
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.option-content {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  width: 100%;
  gap: 14vpx; // 保持 14 或者 12
}

.option-key {
  position: relative;
  width: 34vpx; // 38 -> 34
  height: 34vpx; // 38 -> 34
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1vpx solid rgba($magic-gold, 0.5);
  border-radius: 50%;
  transition: all 0.3s ease;
  flex-shrink: 0;

  .key-char {
    font-size: 16vpx; // 18 -> 16
    color: $magic-gold;
    transition: all 0.3s ease;
    font-family: "Cinzel", serif;
  }
}

.option-text {
  font-size: 16vpx; // 17 -> 16 to fit more text
  color: #fff;
  font-weight: 500;
  line-height: 1.5; // Improve readability for multi-line
  flex: 1;
  word-break: break-word; // Handle long words/mixed content
  text-align: left;
  padding-right: 4vpx; // Avoid touching image
}

.option-media-wrap {
  position: relative;
  width: 64vpx; // 70 -> 64
  height: 48vpx; // 52 -> 48
  border-radius: 8vpx;
  overflow: hidden;
  border: 1vpx solid rgba(255, 255, 255, 0.2);
  flex-shrink: 0;
  cursor: zoom-in; // 提示可预览

  .option-media {
    width: 100%;
    height: 100%;
    display: block;
  }

  .video-placeholder {
    width: 100%;
    height: 100%;
    background: #000;
  }

  .media-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;

    .play-icon {
      font-size: 18vpx; // 20 -> 18
      color: #fff;
      filter: drop-shadow(0 0 4vpx rgba(0, 0, 0, 0.8));
    }
  }
}

.selection-mark {
  position: absolute;
  right: 12vpx;
  top: 50%;
  transform: translateY(-50%);
  width: 16vpx; // 18 -> 16
  height: 16vpx; // 18 -> 16

  .magic-circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: $magic-gold;
    box-shadow: 0 0 10vpx $magic-gold;
    animation: pulse 1.5s infinite;
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.8);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(0.8);
    opacity: 0.7;
  }
}
</style>
