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
@use "../../_variables.scss" as *;

.magic-artifact {
  position: relative;
  width: 100%;
  margin-bottom: 10vpx;
  background: $glass-bg;
  border: 1vpx solid $glass-border;
  border-radius: $radius-md;
  overflow: hidden;
  backdrop-filter: blur(10vpx);
  -webkit-backdrop-filter: blur(10vpx);
  -webkit-transform: translateZ(0);
  transform: translateZ(0);

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
    background: rgba(20, 17, 13, 0.5);
    border-radius: $radius-sm;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    &.seal-icon {
      background: linear-gradient(135deg, $magic-rose 0%, rgba(201, 138, 141, 0.5) 100%);
      border: 1.5vpx solid rgba(255, 255, 255, 0.5);
      color: #fff;
      border-radius: 50%;
      box-shadow: 0 0 12vpx rgba($magic-rose, 0.35);
      .heartbeat-icon {
        animation: heartbeat 2.4s infinite;
      }
    }

    &.portal-icon {
      background: radial-gradient(circle, $cyan-deep 0%, #1a3a4a 100%);
      border: 1vpx solid rgba($cyan-deep, 0.7);
      color: #fff;
    }
  }

  .sacred-halo {
    position: absolute;
    inset: -8vpx;
    background: radial-gradient(circle, rgba($magic-rose, 0.22) 0%, transparent 70%);
    border-radius: 50%;
    animation: halo-pulse 3.5s infinite ease-in-out;
    z-index: -1;
  }

  .artifact-info {
    flex: 1;
    overflow: hidden;

    .letter-label {
      color: $magic-rose;
      font-weight: 700;
      text-shadow: 0 0 5vpx rgba($magic-rose, 0.4);
    }
    .topic-label {
      color: $cyan-deep;
      font-weight: 700;
    }

    .artifact-label {
      font-family: $font-display;
      font-size: 11vpx;
      color: $text-mute;
      margin-bottom: 2vpx;
      letter-spacing: 1vpx;
    }

    .artifact-content {
      font-size: 13vpx;
      color: $text;
      line-height: 1.6;
      white-space: pre-wrap;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;

      .magic-highlight {
        color: $ember;
        font-weight: 700;
        text-shadow: 0 0 8vpx rgba($ember, 0.5);
      }

      .magic-link {
        color: $cyan-deep;
        text-decoration: underline;
        text-decoration-style: dashed;
      }
    }
  }

  .artifact-arrow {
    color: $text-ghost;
  }

  // letter/topic：保留单一边缘流光（去掉 portal-breathe 永续缩放）
  &.letter,
  &.topic {
    .artifact-arrow {
      animation: arrow-bounce 1.4s infinite alternate;
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
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
        animation: move-border 5s linear infinite;
      }
    }
  }

  &.letter {
    background: rgba($magic-rose, 0.06);
    .artifact-arrow {
      color: $magic-rose;
    }
  }

  &.topic {
    background: rgba($cyan-deep, 0.08);
    border-left: 3vpx solid $cyan-deep;
  }

  // 类型边框（统一到 token 色）
  &.url {
    border-left: 3vpx solid $cyan-deep;
  }
  &.img {
    border-left: 3vpx solid $jade;
  }
  &.video {
    border-left: 3vpx solid $amethyst;
  }
  &.text {
    border-left: 3vpx solid $ember;
  }
}

@keyframes heartbeat {
  0%,
  100% {
    transform: scale(1);
  }
  10% {
    transform: scale(1.12);
  }
  20% {
    transform: scale(1);
  }
  30% {
    transform: scale(1.12);
  }
  40% {
    transform: scale(1);
  }
}

@keyframes halo-pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 0.25;
  }
  50% {
    transform: scale(1.18);
    opacity: 0.45;
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

// 去掉永续扫光（仅 hover 时一次，移动端无 hover 自然不出现）
.artifact-flare {
  position: absolute;
  top: 0;
  left: -100%;
  width: 60%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(236, 230, 216, 0.05), transparent);
  transform: skewX(-25deg);
  pointer-events: none;
  opacity: 0;
}
</style>
