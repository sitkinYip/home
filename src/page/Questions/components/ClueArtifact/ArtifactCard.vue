<!-- components/ClueArtifact/ArtifactCard.vue -->
<!-- 卡片式展示组件：图标 + 标签 + 两行内容预览 + 箭头 -->
<template>
  <div
    class="magic-artifact"
    @click="handleClick"
    :class="[type, { 'is-important': type === 'letter' || type === 'topic' }]"
  >
    <!-- letter 专属：更梦幻的彩虹流动边框 -->
    <div v-if="type === 'letter' || type === 'topic'" class="divine-border"></div>

    <div class="artifact-inner">
      <div
        class="artifact-icon-wrap"
        :class="{ 'seal-icon': type === 'letter', 'portal-icon': type === 'topic' }"
      >
        <!-- 装饰背景：星海情笺拥有的温暖光晕 -->
        <div v-if="type === 'letter'" class="sacred-halo"></div>

        <el-icon :size="toVpx(20)">
          <Position v-if="type === 'url'" />
          <Picture v-else-if="type === 'img'" />
          <VideoPlay v-else-if="type === 'video'" />
          <!-- 浪漫化改动：使用 Stamp 但赋予它心跳动效 -->
          <Stamp v-else-if="type === 'letter'" class="heartbeat-icon" />
          <Promotion v-else-if="type === 'topic'" />
          <Document v-else />
        </el-icon>
      </div>

      <div class="artifact-info">
        <div
          class="artifact-label"
          :class="{ 'letter-label': type === 'letter', 'topic-label': type === 'topic' }"
        >
          {{ typeLabel }}
        </div>
        <!-- 渲染内容：支持富文本解析 -->
        <div class="artifact-content">
          <template v-for="(segment, index) in previewContent" :key="index">
            <span v-if="segment.type === 'text'">{{ segment.content }}</span>
            <span v-else-if="segment.type === 'highlight'" class="magic-highlight">
              {{ segment.content }}
            </span>
            <span v-else-if="segment.type === 'link'" class="magic-link">
              {{ segment.content }}
            </span>
            <br v-else-if="segment.type === 'br'" />
          </template>
        </div>
      </div>

      <!-- 保留箭头判断逻辑 -->
      <div class="artifact-arrow" v-if="type !== 'text' || isLongContent">
        <el-icon><ArrowRight /></el-icon>
      </div>
    </div>
    <div class="artifact-flare"></div>
  </div>
</template>

<script lang="ts" setup>
import { computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  Position,
  Picture,
  VideoPlay,
  Document,
  ArrowRight,
  Stamp,
  Promotion,
} from "@element-plus/icons-vue";
import gsap from "gsap";
import { parseContent } from "../../composables/useContentParser";
import { toVpx } from "@/utils/toVpx";

const props = defineProps<{
  type: "url" | "img" | "video" | "text" | "letter" | "topic";
  content: string;
  path?: string;
  query?: any;
  nextIndex?: string | number;
  title?: string;
}>();

const emit = defineEmits(["action"]);
const router = useRouter();
const route = useRoute();

// 预览模式解析：图片/视频显示为占位提示
const previewContent = computed(() => {
  if (!props.content) return [];
  return parseContent(props.content, {
    imagePlaceholder: true,
    imagePlaceholderText: "📜 点击查看隐藏图像",
    videoPlaceholderText: "🎬 点击查看隐藏视频",
  });
});

const isLongContent = computed(() => {
  if (props.type === "letter" || props.type === "topic") return true;
  if (props.type !== "text") return true;
  return props.content.includes("\n") || props.content.length > 30;
});

const typeLabel = computed(() => {
  const map = {
    url: "位面传送",
    img: "神谕影像",
    video: "时空回溯",
    text: "古老密卷",
    letter: "星海情笺",
    topic: "时空跃迁",
  };
  return props.title || map[props.type] || "未知遗物";
});

const handleClick = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement;
  gsap.to(target, { scale: 0.96, duration: 0.1, yoyo: true, repeat: 1 });

  if (props.type === "letter" && props.path) {
    router.replace({
      path: props.path,
      query: {
        ...(props.query || {}),
        // 记录来源路由，让 Letter 页面可以展示返回按钮
        returnTo: route.fullPath,
      },
    });
    return;
  }

  if (props.type === "topic" && props.nextIndex) {
    router.replace({
      path: "/questions",
      query: { ...route.query, qa: props.nextIndex },
    });
    setTimeout(() => window.location.reload(), 100);
    return;
  }

  emit("action");
};
</script>

<style lang="scss" scoped>
$magic-gold: #ffd700;
$magic-rose: #ff9a9e;
$magic-lavender: #fad0c4;
$magic-cyan: #00f2ff;

.magic-artifact {
  position: relative;
  width: 100%;
  margin-bottom: 10vpx;
  background: rgba(255, 255, 255, 0.05);
  border: 1vpx solid rgba(255, 255, 255, 0.1);
  border-radius: 12vpx;
  overflow: hidden;
  backdrop-filter: blur(10vpx);
  -webkit-backdrop-filter: blur(10vpx);

  .artifact-inner {
    display: flex;
    align-items: center;
    padding: 12vpx;
    gap: 10vpx;
    position: relative;
    z-index: 2;
  }

  .artifact-icon-wrap {
    position: relative;
    width: 36vpx;
    height: 36vpx;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8vpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.seal-icon {
      background: linear-gradient(135deg, $magic-rose 0%, $magic-lavender 100%);
      border: 1.5vpx solid #fff;
      color: #fff;
      border-radius: 50%;
      box-shadow: 0 0 15vpx rgba($magic-rose, 0.5);
      .heartbeat-icon {
        animation: heartbeat 2s infinite;
      }
    }

    &.portal-icon {
      background: radial-gradient(circle, $magic-cyan 0%, #003366 100%);
      border: 1vpx solid $magic-cyan;
      color: #fff;
      animation: portal-breathe 2s infinite;
    }
  }

  .sacred-halo {
    position: absolute;
    inset: -8vpx;
    background: radial-gradient(circle, rgba($magic-rose, 0.3) 0%, transparent 70%);
    border-radius: 50%;
    animation: halo-pulse 3s infinite ease-in-out;
    z-index: -1;
  }

  .artifact-info {
    flex: 1;
    overflow: hidden;

    .letter-label {
      color: #ffb1b1;
      font-weight: bold;
      text-shadow: 0 0 5vpx rgba($magic-rose, 0.5);
    }
    .topic-label {
      color: $magic-cyan;
      font-weight: bold;
    }

    .artifact-label {
      font-size: 11vpx;
      color: rgba(255, 255, 255, 0.6);
      margin-bottom: 2vpx;
    }

    .artifact-content {
      font-size: 13vpx;
      color: #eeeeee;
      line-height: 1.6;
      white-space: pre-wrap;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;

      .magic-highlight {
        color: $magic-gold;
        font-weight: bold;
        text-shadow: 0 0 8vpx rgba(255, 215, 0, 0.8);
      }

      .magic-link {
        color: #7dd3fc;
        text-decoration: underline;
        text-decoration-style: dashed;
      }
    }
  }

  .artifact-arrow {
    color: rgba(255, 255, 255, 0.2);
  }

  &.letter,
  &.topic {
    .artifact-arrow {
      animation: arrow-bounce 1s infinite alternate;
    }
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
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.15), transparent);
        animation: move-border 4s linear infinite;
      }
    }
  }

  &.letter {
    background: rgba($magic-rose, 0.05);
    .artifact-arrow {
      color: $magic-rose;
    }
  }

  &.topic {
    background: rgba($magic-cyan, 0.08);
    border-left: 3vpx solid $magic-cyan;
  }

  // 基础边框
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

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  10% {
    transform: scale(1.15);
  }
  20% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.15);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes halo-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.3;
  }
  50% {
    transform: scale(1.2);
    opacity: 0.5;
  }
}

@keyframes portal-breathe {
  0%,
  100% {
    box-shadow: 0 0 5vpx $magic-cyan;
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 15vpx $magic-cyan;
    transform: scale(1.05);
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
