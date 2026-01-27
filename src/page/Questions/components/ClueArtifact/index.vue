<!-- components/ClueArtifact/index.vue -->
<!-- ClueArtifact 主入口组件：根据模式和类型渲染不同子组件 -->
<template>
  <div class="clue-artifact-wrapper" :class="{ 'is-fullscreen': isFullscreen }">
    <!-- 卡片式展示（默认） -->
    <ArtifactCard
      :type="type"
      :content="content"
      :path="path"
      :query="query"
      :nextIndex="nextIndex"
      :title="title"
      @action="handleAction"
    />

    <!-- 全屏模式下的扩展功能 -->
    <template v-if="isFullscreen">
      <!-- text 类型：展开面板 -->
      <TextExpander v-if="type === 'text'" :content="content" :title="title" />

      <!-- img 类型：缩略图展示 -->
      <ImageThumbnail v-else-if="type === 'img'" :url="url || ''" :imgList="imgList" />

      <!-- video 类型：迷你播放器 -->
      <VideoMiniPlayer v-else-if="type === 'video'" :url="url || ''" />
    </template>
  </div>
</template>

<script lang="ts" setup>
import ArtifactCard from "./ArtifactCard.vue";
import TextExpander from "./TextExpander.vue";
import ImageThumbnail from "./ImageThumbnail.vue";
import VideoMiniPlayer from "./VideoMiniPlayer.vue";

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

const handleAction = () => {
  emit("action");
};
</script>

<style lang="scss" scoped>
.clue-artifact-wrapper {
  width: 100%;

  &.is-fullscreen {
    // 全屏模式下增加更多间距
    margin-bottom: 20vpx;
  }
}
</style>
