<template>
  <div class="multiple-choice-options">
    <div
      v-for="item in options"
      :key="item.key"
      class="option-item"
      :class="{
        'is-selected': modelValue === item.key,
        'is-disabled': disabled || isPenalized,
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

    <!-- 惩罚遮罩层 -->
    <transition name="fade">
      <div class="penalty-overlay" v-if="isPenalized">
        <div class="penalty-content">
          <div class="penalty-icon">
            <el-icon><Lock /></el-icon>
          </div>
          <div class="penalty-text">
            <template v-if="remainingTime > 0">
              <div class="timer">{{ formattedTime }}</div>
              <div class="tips">灵魂冷却中...</div>
            </template>
            <template v-else>
              <div class="forever-lock">灵魂已被封印</div>
              <div class="tips">无法再进行尝试</div>
            </template>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { OptionItem } from "@/types/qa";
import { showImagePreview } from "vant";
import { VideoPlay, Lock } from "@element-plus/icons-vue";
import "vant/es/image-preview/style";
import { computed, onMounted, onUnmounted, ref, watch } from "vue";

interface Props {
  options: OptionItem[];
  modelValue: string; // 当前选中的 key
  disabled?: boolean;
  penaltyEndTime?: number; // 惩罚结束时间戳，0表示无惩罚，-1表示永久
  wrongCount?: number;
}

const props = withDefaults(defineProps<Props>(), {
  penaltyEndTime: 0,
  wrongCount: 0,
});
const emit = defineEmits(["update:modelValue", "change", "play-video"]);

const now = ref(Date.now());
let timer: any = null;
// 标记 penaltyEndTime 是否已经从 localStorage 恢复完成（首次收到有效值）
let penaltyInitialized = false;

const isPenalized = computed(() => {
  if (props.penaltyEndTime === -1) return true;
  return props.penaltyEndTime > now.value;
});

const remainingTime = computed(() => {
  if (props.penaltyEndTime === -1) return -1;
  return Math.max(0, props.penaltyEndTime - now.value);
});

const formattedTime = computed(() => {
  const ms = remainingTime.value;
  if (ms <= 0) return "00:00";
  const totalSeconds = Math.ceil(ms / 1000);
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
});

watch(
  () => props.penaltyEndTime,
  (val) => {
    // 当 penaltyEndTime 首次从 0 变为有效值时（即从 localStorage 恢复完成），
    // 立即同步 now 为当前时间，避免 timer 提前运行导致的时间差"跳变"
    if ((val > 0 || val === -1) && !penaltyInitialized) {
      penaltyInitialized = true;
      now.value = Date.now();
    }
    if (val > 0 && !timer) {
      startTimer();
    }
  },
  { immediate: true },
);

function startTimer() {
  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    now.value = Date.now();
    if (!isPenalized.value && remainingTime.value <= 0 && props.penaltyEndTime !== -1) {
      clearInterval(timer);
      timer = null;
    }
  }, 1000);
}

onMounted(() => {
  // 仅在已有有效惩罚时间时才立即启动 timer，
  // 否则等待 watch 在 penaltyEndTime 变化时启动
  if (props.penaltyEndTime > 0 || props.penaltyEndTime === -1) {
    startTimer();
  }
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

const handleSelect = (key: string) => {
  if (props.disabled || isPenalized.value) return;
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
      teleport: "body",
    });
  }
};
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

$option-bg: rgba(20, 17, 13, 0.6);
$option-hover-bg: rgba(217, 164, 65, 0.12);

.multiple-choice-options {
  display: flex;
  flex-direction: column;
  gap: 8vpx;
  width: 100%;
  margin-top: 12vpx;
  margin-bottom: 16vpx;
  position: relative;
}

.option-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8vpx 12vpx;
  border-radius: $radius-sm;
  background: $option-bg;
  border: 1vpx solid rgba($ember, 0.25);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  user-select: none;

  &:hover:not(.is-disabled) {
    transform: translateY(-1vpx);
    border-color: rgba($ember, 0.55);
    background: $option-hover-bg;
  }

  &.is-selected {
    border-color: $ember;
    background: $ember-soft;
    box-shadow: 0 0 0 1vpx $ember; // 单层描边，去掉外光+内光+glow 三层

    .option-key {
      background: $ember;
      border-color: $ember;
    }

    .key-char {
      color: $ink-900;
      font-weight: 700;
    }

    .option-glow {
      opacity: 1;
    }
  }

  &.is-disabled {
    opacity: 0.55;
    cursor: not-allowed;
    filter: grayscale(0.4);
  }
}

.option-glow {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 50% 50%, rgba($ember, 0.1) 0%, transparent 70%);
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
  gap: 8vpx;
}

.option-key {
  position: relative;
  width: 24vpx;
  height: 24vpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1vpx solid rgba($ember, 0.5);
  border-radius: 50%;
  transition: all 0.3s ease;
  flex-shrink: 0;
  margin-top: 4vpx;
  margin-bottom: 6vpx;

  .key-char {
    font-family: $font-display;
    font-size: 13vpx;
    color: $ember;
    transition: all 0.3s ease;
  }
}

.option-text {
  display: flex;
  align-items: center;
  font-size: 12vpx;
  color: $text;
  font-weight: 500;
  line-height: 1.5;
  min-height: 36vpx;
  flex: 1;
  word-break: break-word;
  text-align: left;
  padding-right: 4vpx;
}

.option-media-wrap {
  position: relative;
  width: 56vpx;
  height: 42vpx;
  border-radius: $radius-sm;
  overflow: hidden;
  border: 1vpx solid rgba(236, 230, 216, 0.18);
  flex-shrink: 0;
  cursor: zoom-in;

  .option-media {
    width: 100%;
    height: 100%;
    display: block;
  }

  .video-placeholder {
    width: 100%;
    height: 100%;
    background: $ink-900;
  }

  .media-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;

    .play-icon {
      font-size: 16vpx;
      color: $text;
      filter: drop-shadow(0 0 4vpx rgba(0, 0, 0, 0.8));
    }
  }
}

.selection-mark {
  position: absolute;
  right: 12vpx;
  top: 50%;
  transform: translateY(-50%);
  width: 14vpx;
  height: 14vpx;

  .magic-circle {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    background: $ember;
    box-shadow: 0 0 8vpx rgba($ember, 0.6);
    animation: pulse 1.8s infinite;
  }
}

@keyframes pulse {
  0% {
    transform: scale(0.85);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
  100% {
    transform: scale(0.85);
    opacity: 0.7;
  }
}

// 惩罚遮罩（对齐 $rust + 等宽数字）
.penalty-overlay {
  position: absolute;
  inset: -10vpx;
  background: rgba(20, 17, 13, 0.78);
  backdrop-filter: blur(4px);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: $radius-md;
  border: 1vpx solid rgba($rust, 0.3);

  .penalty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8vpx;
    color: $rust;
  }

  .penalty-icon {
    font-size: 32vpx;
    margin-bottom: 4vpx;
    animation: shake 5s ease-in-out infinite;
  }

  .penalty-text {
    text-align: center;

    .timer {
      font-family: $font-num;
      font-variant-numeric: tabular-nums;
      font-size: 24vpx;
      font-weight: 700;
      text-shadow: 0 0 10vpx rgba($rust, 0.45);
    }

    .tips {
      font-size: 12vpx;
      opacity: 0.8;
      margin-top: 4vpx;
    }

    .forever-lock {
      font-size: 18vpx;
      font-weight: 700;
      letter-spacing: 2px;
    }
  }
}

@keyframes shake {
  0%,
  100% {
    transform: rotate(0deg);
  }
  2% {
    transform: rotate(-5deg);
  }
  4% {
    transform: rotate(5deg);
  }
  6% {
    transform: rotate(-5deg);
  }
  8% {
    transform: rotate(0deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
