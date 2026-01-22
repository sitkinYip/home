<template>
  <div class="magic-panel clue-card">
    <div class="clue-header">
      <span class="header-ornament"></span>
      获取的神谕线索
      <span class="header-ornament"></span>
    </div>

    <div class="as_content">
      <div v-for="(item, index) in thread" :key="index" class="as_item_wrapper">
        <!-- 使用新组件 ClueArtifact -->
        <ClueArtifact
          :type="item.type"
          :content="item.content"
          @action="$emit('action', item)"
          :path="item.path"
          :query="item.query"
          :nextIndex="item.nextIndex"
          :title="item.title"
        />

        <!-- 如果是图片类型且不需要点击文字预览，直接显示图片预览 -->
        <div class="direct-img-view" v-if="item.type === 'img' && !item.content">
          <el-image
            :src="item.url"
            class="clue-img"
            @click="$emit('preview', item.imgList || [item.url!])"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import ClueArtifact from "./ClueArtifact.vue";

defineProps<{
  thread: any[];
}>();

defineEmits(["action", "preview"]);
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

// 基础毛玻璃面板 (from style.scss, scoped here to ensure self-contained if magic-panel is missing or for override)
.magic-panel {
  position: relative;
  overflow: hidden;
  background: $glass-bg;
  backdrop-filter: blur(20vpx);
  -webkit-backdrop-filter: blur(20vpx);
  border: 1vpx solid $glass-border;
  border-radius: 20vpx;
  box-shadow: 0 8vpx 32vpx 0 rgba(0, 0, 0, 0.3);
  margin-bottom: 24vpx;
  padding: 24vpx;
  transition:
    border-color 0.4s,
    box-shadow 0.4s;
  &::before {
    content: "";
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 45%,
      rgba(255, 255, 255, 0.05) 50%,
      transparent 55%
    );
    transform: rotate(-45deg);
    animation: sweep-light 6s infinite;
    pointer-events: none;
  }
}

// 线索卡片
.clue-card {
  padding: 20vpx;
  margin-bottom: 12vpx;
  border: 1vpx solid rgba($magic-green, 0.4);

  .clue-header {
    text-align: center;
    color: $magic-green;
    font-weight: bold;
    margin-bottom: 12vpx;
    font-size: 14vpx;
  }

  .clue-text {
    display: block;
    text-align: center;
    color: #ddd;
    font-style: italic;
    margin-bottom: 12vpx;
  }

  .clue-btn {
    width: 100%;
    height: 48vpx;
    margin: 8vpx 0;
    font-size: 15vpx;
  }
}

.as_content {
  // container for items
}
.as_item_wrapper {
  // wrapper
}
.direct-img-view {
  margin-top: 10vpx;
  .clue-img {
    width: 100%;
    border-radius: 8vpx;
    border: 1vpx solid rgba(255, 255, 255, 0.1);
  }
}

@keyframes sweep-light {
  0% {
    transform: translateX(-100%) rotate(-45deg);
  }
  20%,
  100% {
    transform: translateX(100%) rotate(-45deg);
  }
}
</style>
