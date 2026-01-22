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
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid $glass-border;
  border-radius: 20px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
  margin-bottom: 24px;
  padding: 24px;
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
  padding: 20px;
  margin-bottom: 12px;
  border: 1px solid rgba($magic-green, 0.4);

  .clue-header {
    text-align: center;
    color: $magic-green;
    font-weight: bold;
    margin-bottom: 12px;
    font-size: 14px;

    // Header ornament styles if not global (implied from template usage but not in specific scss block provided for clue-card, maybe general?)
    // Checking original vue file: <span class="header-ornament"></span>
    // I don't see .header-ornament in style.scss provided earlier. Wait, let me check style.scss again later.
    // If it's missing, I might need to infer or it's global.
    // Ah, it might be in .q_title_row .ornament but here is .header-ornament
    // Let's assume it was styling from scoped style.scss that I missed or it was implicit.
    // Actually, looking at index.vue line 144: <span class="header-ornament"></span>
    // Looking at style.scss line 451: .clue-card { ... }
    // It seems .header-ornament is NOT defined in the provided style.scss!
    // Wait, let's look at `index.vue` again.
    // Line 76: <span class="ornament"></span> in .q_title_row
    // Line 144: <span class="header-ornament"></span> in .clue-header
    // In style.scss, .clue-header is defined (line 456), but not .header-ornament.
    // Maybe it relies on global CSS or I missed something.
    // Or maybe it's just empty span?
    // Let's look closer at style.scss.
    // It's possible the user didn't paste everything or I missed it.
    // But I have the full file content.
    // No .header-ornament in style.scss.
    // I shall omit specific styles for it unless I see them, or maybe copy .ornament style.
  }

  .clue-text {
    display: block;
    text-align: center;
    color: #ddd;
    font-style: italic;
    margin-bottom: 12px;
  }

  .clue-btn {
    width: 100%;
    height: 48px;
    margin: 8px 0;
    font-size: 15px;
  }
}

.as_content {
  // container for items
}
.as_item_wrapper {
  // wrapper
}
.direct-img-view {
  margin-top: 10px;
  .clue-img {
    width: 100%;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.1);
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
