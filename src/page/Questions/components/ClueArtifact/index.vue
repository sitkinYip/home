<!-- components/ClueArtifact/index.vue -->
<!-- ClueArtifact 主入口组件：根据模式和类型渲染不同子组件 -->
<template>
  <div class="clue-artifact-wrapper" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- 卡片式展示（仅在 text/video 展开时隐藏） -->
    <transition name="card-fade">
      <ArtifactCard
        v-if="!isExpanded"
        :type="type"
        :content="content"
        :path="path"
        :query="query"
        :nextIndex="nextIndex"
        :title="title"
        @action="handleAction"
      />
    </transition>

    <!-- 全屏模式下的扩展功能 -->
    <template v-if="isFullscreen">
      <!-- text 类型：展开面板 -->
      <TextExpander
        v-if="type === 'text'"
        :content="content"
        :title="title"
        @expand="isExpanded = true"
        @collapse="isExpanded = false"
      />

      <!-- img 类型：缩略图展示（直接预览，不需要展开状态） -->
      <ImageThumbnail v-else-if="type === 'img'" :url="url || ''" :imgList="imgList" />

      <!-- video 类型：迷你播放器 -->
      <VideoMiniPlayer
        v-else-if="type === 'video'"
        :url="url || ''"
        @expand="isExpanded = true"
        @collapse="isExpanded = false"
      />

      <!-- url 类型：iframe 预览 -->
      <UrlPreview
        v-else-if="type === 'url'"
        :url="url || ''"
        @expand="isExpanded = true"
        @collapse="isExpanded = false"
      />
    </template>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch } from "vue";
import ArtifactCard from "./ArtifactCard.vue";
import TextExpander from "./TextExpander.vue";
import ImageThumbnail from "./ImageThumbnail.vue";
import VideoMiniPlayer from "./VideoMiniPlayer.vue";
import UrlPreview from "./UrlPreview.vue";

const props = defineProps<{
  type: "url" | "img" | "video" | "text" | "letter" | "topic";
  content: string;
  path?: string;
  query?: any;
  nextIndex?: string | number;
  title?: string;
  url?: string;
  imgList?: string[];
  isFullscreen?: boolean;
}>();

const emit = defineEmits(["action"]);

// 子组件展开状态
const isExpanded = ref(false);

// 退出全屏时重置展开状态
watch(
  () => props.isFullscreen,
  (newVal) => {
    if (!newVal) {
      isExpanded.value = false;
    }
  },
);

const handleAction = () => {
  emit("action");
};
</script>

<style lang="scss" scoped>
.clue-artifact-wrapper {
  width: 100%;
  // iOS 微信浏览器兼容：强制开启硬件加速
  -webkit-transform: translateZ(0);
  transform: translateZ(0);
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;

  &.is-fullscreen {
    // 全屏模式下增加更多间距
    margin-bottom: 20vpx;
    // 确保全屏模式下的布局正确
    position: relative;
    z-index: 1;
  }
}

// 卡片隐藏/显示动画
.card-fade-enter-active {
  animation: card-show 0.3s ease-out;
}
.card-fade-leave-active {
  animation: card-hide 0.25s ease-in;
}

@keyframes card-show {
  from {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes card-hide {
  from {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  to {
    opacity: 0;
    transform: translateY(-10px) scale(0.95);
  }
}
</style>
