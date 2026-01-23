<template>
  <div class="interaction-zone">
    <!-- 选择题模式 -->
    <template v-if="qaInfo.type === 'MultipleChoice' && qaInfo.options?.length">
      <MultipleChoiceOptions
        :options="qaInfo.options"
        :model-value="modelValue"
        @update:model-value="$emit('update:modelValue', $event)"
        :disabled="isBinGo"
        :penaltyEndTime="penaltyEndTime"
        :wrongCount="wrongCount"
        @play-video="$emit('playVideo', $event)"
      />
    </template>

    <!-- 填空题模式 (默认) -->
    <div
      v-else
      class="input-wrapper"
      :class="{ 'is-focus': isInputFocus, 'is-error': isError }"
      :style="{ '--power': `${inputMagicPower}px` }"
    >
      <input
        :value="modelValue"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
        class="magic-input"
        :placeholder="qaInfo.placeholder || '在此刻下你的答案...'"
        @focus="handleFocus(true)"
        @blur="handleFocus(false)"
        @keyup.enter="$emit('submit')"
      />
      <!-- 增加一个魔力进度条，非常细微，在输入框底部 -->
      <div class="magic-progress" :style="{ width: `${inputMagicPower}%` }"></div>
    </div>

    <!-- 按钮：选择题需选中后才显示，填空题始终显示 -->
    <button
      v-if="shouldShowButton"
      @click="$emit('submit')"
      class="magic-btn"
      :class="btnClass"
      :disabled="isPenalized"
    >
      <span class="btn-content">
        {{ btnText }}
      </span>
      <div class="btn-flare" v-if="!isPenalized"></div>
    </button>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from "vue";
import MultipleChoiceOptions from "./MultipleChoiceOptions.vue";

const props = defineProps<{
  qaInfo: any;
  modelValue: string;
  isBinGo: boolean;
  isError: boolean;
  penaltyEndTime: number;
  wrongCount: number;
}>();

const emit = defineEmits(["update:modelValue", "submit", "playVideo", "focusChange"]);

const isInputFocus = ref(false);
const now = ref(Date.now());
let timer: any = null;

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now();
  }, 1000);
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});

// 是否为选择题
const isMultipleChoice = computed(() => props.qaInfo?.type === "MultipleChoice");

// 是否处于惩罚期
const isPenalized = computed(() => {
  // 仅选择题才有惩罚机制
  if (!isMultipleChoice.value) return false;
  if (props.penaltyEndTime === -1) return true;
  return props.penaltyEndTime > 0 && now.value < props.penaltyEndTime;
});

// 是否显示按钮
const shouldShowButton = computed(() => {
  // 填空题始终显示按钮
  if (!isMultipleChoice.value) return true;
  // 选择题：需要已选择、或已答对、或处于惩罚状态时才显示
  return !!props.modelValue || props.isBinGo || isPenalized.value;
});

// 按钮样式类
const btnClass = computed(() => {
  if (props.isBinGo) return "btn-success";
  if (isPenalized.value) return "btn-sealed";
  if (props.isError) return "btn-error";
  return "";
});

// 按钮文字
const btnText = computed(() => {
  if (props.isBinGo) return "挑战成功";
  if (isPenalized.value) {
    return props.penaltyEndTime === -1 ? "灵魂已被封印" : "灵魂恢复中...";
  }
  if (props.isError) return "咒语错误";
  return "确认答案";
});

const inputMagicPower = computed(() => {
  const length = props.modelValue?.length || 0;
  return Math.min(length * 5, 100); // 最大 100%
});

const handleFocus = (val: boolean) => {
  isInputFocus.value = val;
  emit("focusChange", val);
};
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

// 交互区域：输入框与按钮
.interaction-zone {
  position: relative;
  .input-wrapper {
    position: relative;
    background: rgba(0, 0, 0, 0.4);
    border: 1vpx solid $glass-border;
    border-radius: 12vpx;
    transition: all 0.3s ease;
    margin-bottom: 16vpx;
    .magic-progress {
      position: absolute;
      bottom: -1vpx;
      left: 0;
      height: 2vpx;
      background: linear-gradient(to right, transparent, $magic-gold, transparent);
      transition: width 0.3s ease;
      opacity: 0.6;
    }

    &.is-focus {
      background: rgba(0, 0, 0, 0.6);
      box-shadow: 0 0 15vpx rgba($magic-gold, 0.2);
    }
    &.is-error {
      border-color: $magic-red !important;
      box-shadow: 0 0 15vpx rgba($magic-red, 0.3);
    }

    .magic-input {
      width: 100%;
      background: transparent;
      border: none;
      padding: 16vpx;
      color: #fff;
      font-size: 16vpx;
      outline: none;
      box-sizing: border-box;
      &::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }
    }
  }

  .magic-btn {
    width: 100%;
    padding: 16vpx;
    border-radius: 12vpx;
    border: none;
    background: linear-gradient(135deg, $magic-purple 0%, #4834d4 100%);
    color: #fff;
    font-weight: bold;
    font-size: 18vpx;
    position: relative;
    overflow: hidden;
    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    &:active {
      transform: scale(0.96);
    }

    &.btn-success {
      background: linear-gradient(135deg, $magic-green 0%, #27ae60 100%) !important;
    }

    &.btn-error {
      background: linear-gradient(135deg, $magic-red 0%, #c0392b 100%) !important;
      box-shadow: 0 0 20vpx rgba($magic-red, 0.4);
      transform: scale(0.98);
    }

    &.btn-sealed {
      background: linear-gradient(135deg, #3d3d3d 0%, #1a1a1a 100%) !important;
      color: rgba(255, 255, 255, 0.6);
      cursor: not-allowed;
      opacity: 0.8;
      box-shadow: inset 0 0 20vpx rgba(0, 0, 0, 0.4);
      border: 1vpx solid rgba(255, 255, 255, 0.1);

      &:active {
        transform: none;
      }
    }

    .btn-flare {
      position: absolute;
      top: 0;
      left: -100%;
      width: 40%;
      height: 100%;
      background: linear-gradient(to right, transparent, rgba(255, 255, 255, 0.3), transparent);
      transform: skewX(-25deg);
      animation: flare 4s infinite;
    }
  }
}

@keyframes flare {
  0% {
    left: -100%;
  }
  20% {
    left: 150%;
  }
  100% {
    left: 150%;
  }
}
</style>
