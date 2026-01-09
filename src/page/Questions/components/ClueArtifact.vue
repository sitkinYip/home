<template>
  <div
    class="magic-artifact"
    @click="handleClick"
    :class="[type, { 'is-important': type === 'letter' }]"
  >
    <!-- letter 类型专属流光 -->
    <div v-if="type === 'letter'" class="divine-border"></div>

    <div class="artifact-inner">
      <div class="artifact-icon-wrap" :class="{ 'seal-icon': type === 'letter' }">
        <el-icon :size="'24vpx'">
          <Position v-if="type === 'url'" />
          <Picture v-else-if="type === 'img'" />
          <VideoPlay v-else-if="type === 'video'" />
          <Stamp v-else-if="type === 'letter'" />
          <Document v-else />
        </el-icon>
      </div>

      <div class="artifact-info">
        <div class="artifact-label" :class="{ 'letter-label': type === 'letter' }">
          {{ typeLabel }}
        </div>
        <!-- 核心：解析高亮与换行 -->
        <div class="artifact-content" v-html="parsedContent"></div>
      </div>

      <div class="artifact-arrow" v-if="type !== 'text' || isLongContent">
        <el-icon><ArrowRight /></el-icon>
      </div>
    </div>
    <div class="artifact-flare"></div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { Position, Picture, VideoPlay, Document, ArrowRight, Stamp } from "@element-plus/icons-vue";
import gsap from "gsap";

const props = defineProps<{
  type: "url" | "img" | "video" | "text" | "letter";
  content: string;
  path?: string;
  query?: any;
}>();

const emit = defineEmits(["action"]);
const router = useRouter();

// 解析文字：处理 [[文本]] 高亮和 \n 换行
const parsedContent = computed(() => {
  if (!props.content) return "";
  return props.content
    .replace(/\[\[(.*?)\]\]/g, '<span class="magic-highlight">$1</span>')
    .replace(/\n/g, "<br>");
});

const isLongContent = computed(() => {
  if (props.type === "letter") return true;
  if (props.type !== "text") return true;
  return props.content.includes("\n") || props.content.length > 30;
});

const typeLabel = computed(() => {
  const map = {
    url: "位面传送",
    img: "神谕影像",
    video: "时空回溯",
    text: "古老密卷",
    letter: "绝密函件",
  };
  return map[props.type] || "未知遗物";
});

const handleClick = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement;
  gsap.to(target, { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1 });

  if (props.type === "letter" && props.path) {
    router.push({ path: props.path, query: props.query || {} });
    return;
  }
  emit("action");
};
</script>

<style lang="scss" scoped>
$magic-gold: #ffd700;
$magic-red: #ff4757;

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
      border-radius: 50%;
      animation: seal-pulse 2s infinite;
    }
  }

  .artifact-info {
    flex: 1;
    overflow: hidden;
    .artifact-content {
      font-size: 15vpx;
      color: #eeeeee;
      line-height: 1.5;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;

      // 解析后的高亮样式：奥术发光
      :deep(.magic-highlight) {
        color: $magic-gold;
        font-weight: bold;
        text-shadow: 0 0 8vpx rgba(255, 215, 0, 0.8);
        animation: text-pulse 1.5s infinite alternate;
      }
    }
  }

  .artifact-arrow {
    color: rgba(255, 255, 255, 0.2);
  }

  &.letter {
    background: rgba($magic-red, 0.08);
    .letter-label {
      color: $magic-gold;
      font-weight: bold;
    }
    .artifact-arrow {
      color: $magic-gold;
      animation: arrow-bounce 1s infinite alternate;
    }
  }

  &.url {
    border-left: 3vpx solid #00d2ff;
  }
  &.img {
    border-left: 3vpx solid #2ecc71;
  }
  &.video {
    border-left: 3vpx solid #8a2be2;
  }
  &.text {
    border-left: 3vpx solid #e67e22;
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

@keyframes text-pulse {
  from {
    opacity: 0.8;
    filter: brightness(1);
  }
  to {
    opacity: 1;
    filter: brightness(1.4);
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
</style>
