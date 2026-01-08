<!-- components/ClueArtifact.vue -->
<template>
  <div
    class="magic-artifact"
    @click="handleClick"
    :class="[type, { 'is-long-text': isLongContent, 'is-important': type === 'letter' }]"
  >
    <!-- 特殊：letter 类型专属的流光背景层 -->
    <div v-if="type === 'letter'" class="divine-border"></div>

    <div class="artifact-inner">
      <!-- 左侧：类型图标 -->
      <div class="artifact-icon-wrap" :class="{ 'seal-icon': type === 'letter' }">
        <el-icon :size="'24vpx'">
          <Position v-if="type === 'url'" />
          <Picture v-else-if="type === 'img'" />
          <VideoPlay v-else-if="type === 'video'" />
          <Stamp v-else-if="type === 'letter'" />
          <!-- letter 专用图标 -->
          <Document v-else />
        </el-icon>
      </div>

      <!-- 中间：信息区域 -->
      <div class="artifact-info">
        <div class="artifact-label" :class="{ 'letter-label': type === 'letter' }">
          {{ typeLabel }}
        </div>
        <div class="artifact-content">{{ content }}</div>
      </div>

      <!-- 右侧箭头 -->
      <div class="artifact-arrow">
        <el-icon><ArrowRight /></el-icon>
      </div>
    </div>

    <!-- 扫光装饰层 -->
    <div class="artifact-flare"></div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router"; // 引入路由
import { Position, Picture, VideoPlay, Document, ArrowRight, Stamp } from "@element-plus/icons-vue";
import gsap from "gsap";

const props = defineProps<{
  type: "url" | "img" | "video" | "text" | "letter";
  content: string;
  path?: string; // letter 跳转路径
  query?: any; // letter 路由参数
}>();

const emit = defineEmits(["action"]);
const router = useRouter();

const isLongContent = computed(() => {
  if (props.type === "letter") return false; // 信件标题通常不长
  if (props.type !== "text") return true;
  return props.content.includes("\n") || props.content.length > 30;
});

const typeLabel = computed(() => {
  const map = {
    url: "位面传送",
    img: "神谕影像",
    video: "时空回溯",
    text: "古老密卷",
    letter: "绝密函件", // 更具仪式感的称呼
  };
  return map[props.type] || "未知遗物";
});

const handleClick = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement;

  // 魔法按压反馈
  gsap.to(target, { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1 });
  // 如果是信件，执行路由跳转
  if (props.type === "letter" && props.path) {
    router.push({ path: props.path, query: props.query || {} });
    return;
  }

  emit("action");
};
</script>

<style lang="scss" scoped>
$magic-gold: #ffd700;
$magic-blue: #00d2ff;
$magic-green: #2ecc71;
$magic-purple: #8a2be2;
$magic-orange: #e67e22;
$magic-red: #ff4757; // 信件专用红色

.magic-artifact {
  position: relative;
  width: 100%;
  margin-bottom: 14vpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1vpx solid rgba(255, 255, 255, 0.1);
  border-radius: 12vpx;
  overflow: hidden;
  backdrop-filter: blur(10vpx);
  -webkit-backdrop-filter: blur(10vpx);

  .artifact-inner {
    display: flex;
    align-items: center;
    padding: 16vpx;
    gap: 16vpx;
    position: relative;
    z-index: 2;
  }

  .artifact-icon-wrap {
    width: 44vpx;
    height: 44vpx;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10vpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    border: 1vpx solid rgba(255, 255, 255, 0.1);

    &.seal-icon {
      background: radial-gradient(circle, $magic-red 0%, #800000 100%);
      border: 1vpx solid $magic-gold;
      color: $magic-gold;
      box-shadow: 0 0 15vpx rgba($magic-red, 0.5);
      border-radius: 50%; // 火漆印章效果
      animation: seal-pulse 2s infinite;
    }
  }

  .artifact-info {
    flex: 1;
    .artifact-label {
      font-size: 11vpx;
      color: rgba(255, 255, 255, 0.4);
      &.letter-label {
        color: $magic-gold;
        font-weight: bold;
        text-shadow: 0 0 5vpx rgba($magic-gold, 0.5);
      }
    }
    .artifact-content {
      font-size: 15vpx;
      color: #eeeeee;
      white-space: pre-wrap;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }

  .artifact-arrow {
    color: rgba(255, 255, 255, 0.2);
    font-size: 16vpx;
  }

  // --- Letter 专属极致动效 ---
  &.letter {
    background: rgba($magic-red, 0.08);
    border-color: rgba($magic-gold, 0.3);

    .divine-border {
      position: absolute;
      inset: 0;
      z-index: 1;
      &::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba($magic-gold, 0.2), transparent);
        animation: move-border 3s linear infinite;
      }
    }

    .artifact-arrow {
      color: $magic-gold;
      animation: arrow-bounce 1s infinite alternate;
    }
  }

  // 其他类型颜色保持不变...
  &.url {
    border-left: 3vpx solid $magic-blue;
  }
  &.img {
    border-left: 3vpx solid $magic-green;
  }
  &.video {
    border-left: 3vpx solid $magic-purple;
  }
  &.text {
    border-left: 3vpx solid $magic-orange;
  }
}

@keyframes seal-pulse {
  0%,
  100% {
    transform: scale(1);
    box-shadow: 0 0 10vpx rgba($magic-red, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 20vpx rgba($magic-red, 0.7);
  }
}

@keyframes move-border {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes arrow-bounce {
  from {
    transform: translateX(0);
  }
  to {
    transform: translateX(5vpx);
  }
}

@keyframes sweep {
  0% {
    left: -100%;
  }
  30% {
    left: 150%;
  }
  100% {
    left: 150%;
  }
}

.artifact-flare {
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.06), transparent);
  transform: skewX(-25deg);
  animation: sweep 6s infinite ease-in-out;
}
</style>
