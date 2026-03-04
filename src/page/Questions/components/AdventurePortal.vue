<template>
  <Teleport to="body">
    <transition name="portal-fade">
      <!-- 仅在非活跃状态显示 -->
      <div
        v-if="portalState !== 'ACTIVE'"
        class="portal-overlay"
        :class="portalState.toLowerCase()"
      >
        <div class="portal-content">
          <!-- 核心魔法阵：根据状态改变颜色 -->
          <div class="magic-gate">
            <div class="gate-layer outer"></div>
            <div class="gate-layer middle"></div>
            <div class="gate-layer inner"></div>

            <!-- 中心图标 -->
            <div class="gate-center">
              <el-icon :size="toVpx(60)">
                <Lock v-if="portalState === 'PRE_START'" />
                <CircleClose v-else />
              </el-icon>
            </div>
          </div>

          <!-- 状态文本区 -->
          <div class="status-info">
            <h1 class="status-title">{{ statusTitle }}</h1>
            <p class="status-desc">{{ statusDesc }}</p>

            <!-- 倒计时展示（仅在未开始时） -->
            <div v-if="portalState === 'PRE_START' && countdownText" class="countdown-box">
              <span class="label">封印解除倒计时</span>
              <span class="time">{{ countdownText }}</span>
            </div>
          </div>
        </div>

        <!-- 底部背景装饰 -->
        <div class="bg-decoration"></div>
      </div>
    </transition>
  </Teleport>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import { Lock, CircleClose } from "@element-plus/icons-vue";
import dayjs from "dayjs"; // 引入 dayjs

const props = defineProps<{
  startTime?: string;
  endTime?: string;
}>();

const now = ref(dayjs()); // 初始化为当前的 dayjs 对象
let timer: any = null;

/**
 * 核心状态计算 - 使用 dayjs 语义化判断
 */
const portalState = computed(() => {
  if (!props.startTime && !props.endTime) return "ACTIVE";

  // 使用 isBefore 和 isAfter 替代 getTime() 比较
  if (props.startTime && now.value.isBefore(dayjs(props.startTime))) {
    return "PRE_START"; // 未开始
  }
  if (props.endTime && now.value.isAfter(dayjs(props.endTime))) {
    return "POST_END"; // 已结束
  }

  return "ACTIVE";
});

// 状态文案配置
const statusTitle = computed(() =>
  portalState.value === "PRE_START" ? "冒险封印中" : "冒险已终结",
);
const statusDesc = computed(() =>
  portalState.value === "PRE_START"
    ? "古老的传送门尚未凝聚足够的魔法能量..."
    : "时空缝隙已经闭合，请期待下一次星相汇聚。",
);

/**
 * 倒计时逻辑 - 使用 dayjs 的 diff 功能
 */
const countdownText = ref("");
const updateCountdown = () => {
  now.value = dayjs(); // 更新当前时间

  if (portalState.value === "PRE_START" && props.startTime) {
    const start = dayjs(props.startTime);
    const diffMs = start.diff(now.value); // 计算毫秒差

    if (diffMs <= 0) {
      countdownText.value = "";
      return;
    }

    // 格式化输出 (手动计算或使用 duration 插件)
    // 这里采用标准计算，确保不依赖额外的 duration 插件
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

    // 补零处理：使用 padStart
    const h = String(hours).padStart(2, "0");
    const m = String(mins).padStart(2, "0");
    const s = String(secs).padStart(2, "0");

    countdownText.value = `${h}:${m}:${s}`;
  }
};

onMounted(() => {
  updateCountdown();
  timer = setInterval(updateCountdown, 1000);
});

onBeforeUnmount(() => {
  if (timer) clearInterval(timer);
});
</script>

<style lang="scss" scoped>
$magic-gold: #ffd700;
$gold: #ffd700;
$gray: #7f8c8d;
$magic-svg: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='2'%3E%3Ccircle cx='256' cy='256' r='250' stroke-opacity='0.2'/%3E%3Ccircle cx='256' cy='256' r='200' stroke-dasharray='10 5'/%3E%3Cpath d='M256 40 L440 350 L72 350 Z' stroke-opacity='0.4'/%3E%3Ccircle cx='256' cy='256' r='100'/%3E%3C/g%3E%3C/svg%3E";

.portal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(20vpx);
  background: rgba(0, 0, 0, 0.85);
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    box-shadow: inset 0 0 100vpx rgba($magic-gold, 0.1);
    animation: portal-pulse 4s ease-in-out infinite;
  }

  @keyframes portal-pulse {
    0%,
    100% {
      opacity: 0.2;
    }
    50% {
      opacity: 0.5;
    }
  }

  // 未开始状态：金光闪烁
  &.pre_start {
    .gate-layer {
      filter: drop-shadow(0 0 10vpx $gold);
      stroke: $gold;
    }
    .status-title {
      color: $gold;
    }
    .gate-center {
      color: $gold;
      animation: breathe 2s infinite;
    }
  }

  // 已结束状态：灰暗沉寂
  &.post_end {
    background: rgba(0, 0, 0, 0.95);
    .gate-layer {
      filter: grayscale(1) opacity(0.3);
      animation-play-state: paused !important;
    }
    .status-title {
      color: $gray;
    }
    .gate-center {
      color: $gray;
    }
    .magic-gate {
      transform: scale(0.9);
    }
  }
}

.magic-gate {
  position: relative;
  width: 280vpx;
  height: 280vpx;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 1s ease;

  .gate-layer {
    position: absolute;
    inset: 0;
    background-image: url($magic-svg);
    background-size: contain;
    &.outer {
      animation: rotateCW 30s linear infinite;
    }
    &.middle {
      inset: 15%;
      animation: rotateCCW 20s linear infinite;
      opacity: 0.7;
    }
    &.inner {
      inset: 30%;
      animation: rotateCW 10s linear infinite;
      opacity: 0.5;
    }
  }
}

.gate-center {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.status-info {
  text-align: center;
  margin-top: 40vpx;
  padding: 0 30vpx;

  .status-title {
    font-size: 28vpx;
    font-weight: 900;
    letter-spacing: 4vpx;
    margin-bottom: 12vpx;
  }

  .status-desc {
    font-size: 14vpx;
    color: rgba(255, 255, 255, 0.5);
    line-height: 1.6;
  }
}

.countdown-box {
  margin-top: 30vpx;
  background: rgba(255, 215, 0, 0.05);
  border: 1vpx solid rgba(255, 215, 0, 0.2);
  border-radius: 12vpx;
  padding: 15vpx 25vpx;
  display: flex;
  flex-direction: column;
  gap: 5vpx;

  .label {
    font-size: 11vpx;
    color: rgba(255, 215, 0, 0.6);
  }
  .time {
    font-size: 20vpx;
    color: $gold;
    font-family: "Courier New", Courier, monospace; // 使用等宽字体
    font-variant-numeric: tabular-nums; // 确保数字宽度一致，防止倒计时跳动
    font-weight: bold;
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
@keyframes rotateCCW {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}
@keyframes breathe {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.8;
  }
  50% {
    transform: scale(1.1);
    opacity: 1;
  }
}

.portal-fade-enter-active,
.portal-fade-leave-active {
  transition: all 1s ease;
}
.portal-fade-enter-from,
.portal-fade-leave-to {
  opacity: 0;
  transform: scale(1.1);
}
</style>
