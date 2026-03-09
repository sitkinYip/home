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
$magic-gold: #ffd700;
$magic-purple: #8a2be2;
$option-bg: rgba(0, 0, 0, 0.6);
$option-hover-bg: rgba(138, 43, 226, 0.2);

.multiple-choice-options {
  display: flex;
  flex-direction: column;
  gap: 8vpx; // 10 -> 8
  width: 100%;
  margin-top: 12vpx; // 16 -> 12
  // 增加底部间距
  margin-bottom: 16vpx; // 20 -> 16
  position: relative; // 为 overlay 定位
}

.option-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 8vpx 12vpx; // 12 -> 8px vertical
  border-radius: 8vpx; // 10 -> 8
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
  gap: 8vpx; // 10 -> 8
}

.option-key {
  position: relative;
  width: 24vpx; // 28 -> 24
  height: 24vpx; // 28 -> 24
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1vpx solid rgba($magic-gold, 0.5);
  border-radius: 50%;
  transition: all 0.3s ease;
  flex-shrink: 0;

  .key-char {
    font-size: 13vpx; // 14 -> 13
    color: $magic-gold;
    transition: all 0.3s ease;
    font-family: "Cinzel", serif;
  }
}

.option-text {
  font-size: 12vpx; // 15 -> 14
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
  width: 56vpx; // 60 -> 56
  height: 42vpx; // 45 -> 42
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
      font-size: 16vpx; // 18 -> 16
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
  width: 14vpx; // 16 -> 14
  height: 14vpx; // 16 -> 14

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

// 惩罚遮罩
.penalty-overlay {
  position: absolute;
  inset: -10vpx; // 稍微扩大一点覆盖边缘
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12vpx;
  border: 1vpx solid rgba(255, 71, 87, 0.3);

  .penalty-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8vpx;
    color: #ff4757;
  }

  .penalty-icon {
    font-size: 32vpx;
    margin-bottom: 4vpx;
    animation: shake 5s ease-in-out infinite;
  }

  .penalty-text {
    text-align: center;

    .timer {
      font-size: 24vpx;
      font-weight: bold;
      font-family: monospace;
      text-shadow: 0 0 10vpx rgba(255, 71, 87, 0.5);
    }

    .tips {
      font-size: 12vpx;
      opacity: 0.8;
      margin-top: 4vpx;
    }

    .forever-lock {
      font-size: 18vpx;
      font-weight: bold;
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
