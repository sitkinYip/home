<!-- components/ClueArtifact/TextExpander.vue -->
<!-- 文本展开面板组件：全屏模式下展开显示富文本内容 -->
<template>
  <div class="text-expander" :class="{ expanded: isExpanded }">
    <!-- 展开/收起按钮 -->
    <div class="expander-toggle" @click="toggleExpand">
      <div class="toggle-btn">
        <el-icon :size="toVpx(16)" :class="{ rotated: isExpanded }">
          <ArrowDown />
        </el-icon>
        <span class="toggle-text">{{ isExpanded ? "收起密卷" : "展开密卷" }}</span>
      </div>
      <div class="toggle-glow"></div>
    </div>

    <!-- 展开的内容区域 -->
    <transition name="expand">
      <div v-if="isExpanded" class="expander-content">
        <div class="content-paper">
          <div class="paper-decoration paper-top-left"></div>
          <div class="paper-decoration paper-top-right"></div>
          <div class="paper-decoration paper-bottom-left"></div>
          <div class="paper-decoration paper-bottom-right"></div>

          <div class="content-text">
            <template v-for="(segment, index) in parsedContent" :key="index">
              <!-- 普通文本 -->
              <span v-if="segment.type === 'text'">{{ segment.content }}</span>

              <!-- 高亮文本 -->
              <span v-else-if="segment.type === 'highlight'" class="scroll-highlight">
                {{ segment.content }}
              </span>

              <!-- 链接/路由 -->
              <span
                v-else-if="segment.type === 'link'"
                class="scroll-link"
                @click="handleLinkClick(segment.url!)"
              >
                {{ segment.content }}
              </span>

              <!-- 图片 -->
              <div v-else-if="segment.type === 'image'" class="scroll-image-wrap">
                <van-image
                  :src="segment.url"
                  width="100%"
                  fit="contain"
                  class="scroll-img"
                  @click="handleImageClick(segment.url!)"
                />
              </div>

              <!-- 视频 -->
              <div
                v-else-if="segment.type === 'video'"
                class="scroll-video-wrap"
                :style="segment.poster ? { backgroundImage: `url(${segment.poster})` } : {}"
                :class="{ 'has-poster': segment.poster }"
                @click="openVideoPlayer(segment.url!)"
              >
                <div class="video-play-btn">
                  <el-icon :size="toVpx(28)"><VideoPlay /></el-icon>
                </div>
              </div>

              <!-- 换行 -->
              <br v-else-if="segment.type === 'br'" />
            </template>
          </div>
        </div>
      </div>
    </transition>
    <VideoPlayer ref="videoPlayerRef" />
  </div>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { ArrowDown, VideoPlay } from "@element-plus/icons-vue";
import { useContentParser } from "../../composables/useContentParser";
import { toVpx } from "@/utils/toVpx";
import VideoPlayer from "@/components/VideoPlayer.vue";

const props = defineProps<{
  content: string;
  title?: string;
}>();

const emit = defineEmits(["expand", "collapse"]);

const isExpanded = ref(false);

const contentRef = computed(() => props.content);
const { parsedContent, handleLinkClick, handleImageClick } = useContentParser(contentRef);

const videoPlayerRef = ref<any>(null);
const openVideoPlayer = (url: string) => {
  videoPlayerRef.value?.open(url);
};

const toggleExpand = () => {
  isExpanded.value = !isExpanded.value;
  emit(isExpanded.value ? "expand" : "collapse");
};
</script>

<style lang="scss" scoped>
@use "../../_variables.scss" as *;

.text-expander {
  margin-top: 12vpx;
  border-radius: 12vpx;
  overflow: hidden;
  background: rgba(0, 0, 0, 0.2);
  border: 1vpx solid rgba($magic-gold, 0.2);
}

.expander-toggle {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12vpx 16vpx;
  cursor: pointer;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 8vpx;
    color: $magic-gold;
    font-size: 13vpx;
    font-weight: 500;
    z-index: 1;

    .el-icon {
      transition: transform 0.3s ease;
      &.rotated {
        transform: rotate(180deg);
      }
    }
  }

  .toggle-glow {
    position: absolute;
    inset: 0;
    background: radial-gradient(ellipse at center, rgba($magic-gold, 0.1) 0%, transparent 70%);
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  &:hover .toggle-glow {
    opacity: 1;
  }
}

.expander-content {
  padding: 0 16vpx 16vpx;
}

.content-paper {
  position: relative;
  background-color: #f4e4bc;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E"),
    radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, rgba(160, 120, 60, 0.1) 80%);
  border-radius: 8vpx;
  padding: 20vpx;
  box-shadow:
    0 4vpx 16vpx rgba(0, 0, 0, 0.3),
    inset 0 1vpx 0 rgba(255, 255, 255, 0.3);

  .paper-decoration {
    position: absolute;
    width: 16vpx;
    height: 16vpx;
    pointer-events: none;

    &::before,
    &::after {
      content: "";
      position: absolute;
      background: linear-gradient(45deg, rgba(139, 90, 43, 0.4) 0%, rgba(218, 165, 32, 0.3) 100%);
    }

    &.paper-top-left {
      top: 6vpx;
      left: 6vpx;
      &::before {
        width: 100%;
        height: 2vpx;
        top: 0;
        left: 0;
      }
      &::after {
        width: 2vpx;
        height: 100%;
        top: 0;
        left: 0;
      }
    }

    &.paper-top-right {
      top: 6vpx;
      right: 6vpx;
      &::before {
        width: 100%;
        height: 2vpx;
        top: 0;
        right: 0;
      }
      &::after {
        width: 2vpx;
        height: 100%;
        top: 0;
        right: 0;
      }
    }

    &.paper-bottom-left {
      bottom: 6vpx;
      left: 6vpx;
      &::before {
        width: 100%;
        height: 2vpx;
        bottom: 0;
        left: 0;
      }
      &::after {
        width: 2vpx;
        height: 100%;
        bottom: 0;
        left: 0;
      }
    }

    &.paper-bottom-right {
      bottom: 6vpx;
      right: 6vpx;
      &::before {
        width: 100%;
        height: 2vpx;
        bottom: 0;
        right: 0;
      }
      &::after {
        width: 2vpx;
        height: 100%;
        bottom: 0;
        right: 0;
      }
    }
  }
}

.content-text {
  font-family: "Crimson Text", "Georgia", serif;
  font-size: 15vpx;
  line-height: 1.8;
  color: #3e2723;
  text-align: justify;
  white-space: pre-wrap;
  word-break: break-all;

  .scroll-highlight {
    color: #9a0007;
    font-weight: 700;
    padding: 0 2vpx;
    border-bottom: 1.5vpx solid rgba(154, 0, 7, 0.3);
  }

  .scroll-link {
    color: #0d47a1;
    font-weight: 600;
    cursor: pointer;
    text-decoration: none;
    border-bottom: 1vpx dashed #0d47a1;
    padding: 0 2vpx;
    transition: all 0.2s ease;

    &:active {
      background: rgba(13, 71, 161, 0.1);
      color: #1565c0;
    }
  }

  .scroll-image-wrap {
    margin: 0 0;
    width: 100%;
    display: flex;
    justify-content: center;

    .scroll-img {
      box-shadow: 2vpx 2vpx 5vpx rgba(0, 0, 0, 0.3);
      border: 3vpx solid #fff;
      border-radius: 4vpx;
      max-width: 100%;
      transition: transform 0.3s ease;

      &:active {
        transform: scale(1.02);
      }
    }
  }

  .scroll-video-wrap {
    margin: 0 0;
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: 4vpx;
    border: 3vpx solid #fff;
    box-shadow: 2vpx 2vpx 5vpx rgba(0, 0, 0, 0.3);
    background: #1a1a2e;
    background-size: cover;
    background-position: center;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    position: relative;
    overflow: hidden;
    transition: transform 0.3s ease;

    &.has-poster {
      background-color: #000;
    }

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background: rgba(0, 0, 0, 0.25);
      transition: background 0.3s ease;
    }

    &:active {
      transform: scale(0.98);

      &::before {
        background: rgba(0, 0, 0, 0.4);
      }
    }

    .video-play-btn {
      position: relative;
      z-index: 1;
      width: 48vpx;
      height: 48vpx;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #3e2723;
      box-shadow: 0 2vpx 8vpx rgba(0, 0, 0, 0.3);
      transition: transform 0.3s ease;
    }
  }
}

// 展开动画
.expand-enter-active {
  animation: expand-in 0.4s ease-out;
}
.expand-leave-active {
  animation: expand-out 0.3s ease-in;
}

@keyframes expand-in {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10vpx);
  }
  to {
    opacity: 1;
    max-height: 500vpx;
    transform: translateY(0);
  }
}

@keyframes expand-out {
  from {
    opacity: 1;
    max-height: 500vpx;
  }
  to {
    opacity: 0;
    max-height: 0;
  }
}
</style>
