<template>
  <transition name="modal-scale">
    <div v-if="visible" class="multi-clue-modal-overlay">
      <!-- 模态框主体 -->
      <div class="clue-modal-panel magic-panel">
        <div class="modal-header">
          <div class="modal-title">
            <el-icon class="title-icon"><Opportunity /></el-icon>
            <span class="title-text">{{ store.multiQuestClue?.title || '隐藏的线索' }}</span>
          </div>
          <div class="close-btn" @click="handleClose">
            <el-icon><Close /></el-icon>
          </div>
        </div>

        <div class="modal-content custom-scrollbar">
          <!-- 这里利用 useContentParser 提供的方法渲染富文本 -->
          <div class="parsed-content">
            <template v-for="(segment, index) in parsedContent" :key="index">
              <span v-if="segment.type === 'text'" class="normal-text">{{ segment.content }}</span>
              <span v-else-if="segment.type === 'highlight'" class="highlight-text">{{
                segment.content
              }}</span>
              <a
                v-else-if="segment.type === 'link'"
                class="clue-link"
                @click.prevent="handleLinkClick(segment.url!)"
              >
                {{ segment.content }}
              </a>
              <div v-else-if="segment.type === 'image'" class="clue-img-wrapper">
                <el-image
                  :src="segment.url"
                  fit="cover"
                  class="clue-img"
                  @click="handleImageClick(segment.url!)"
                />
              </div>
              <div v-else-if="segment.type === 'video'" class="clue-video-wrapper">
                <div class="video-placeholder" @click="handleVideoClick(segment.url!)">
                  <el-icon class="play-icon"><VideoPlay /></el-icon>
                  <span>点击查看视频影像</span>
                </div>
              </div>
              <br v-else-if="segment.type === 'br'" />
            </template>
          </div>
        </div>

        <div class="modal-footer">
          <div class="hint-text">这个窗口已被收录在界面的右下角浮标中</div>
          <button class="confirm-btn" @click="handleClose">我知道了</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { Opportunity, Close, VideoPlay } from "@element-plus/icons-vue";
import { useQuestionsStore } from "@/store/questions";
import { useContentParser } from "../composables/useContentParser";

const store = useQuestionsStore();

const visible = ref(false);

const emit = defineEmits(["closed"]);

const clueData = computed(() => store.multiQuestClue?.content || "");

// 利用现有的 composable 解析 content
const { parsedContent, handleLinkClick, handleImageClick, handleVideoClick } =
  useContentParser(clueData);

const show = () => {
  if (clueData.value) {
    visible.value = true;
  }
};

const handleClose = () => {
  visible.value = false;
  emit("closed");
};

defineExpose({ show });
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;
@use "../style.scss";

.multi-clue-modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 10005; // 与 MagicScroll 平级
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(8vpx);
  padding: 24vpx;
}

.clue-modal-panel {
  width: 100%;
  max-width: 480px; // 兼容桌面端
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  padding: 0; // 覆盖默认 .magic-panel 的 padding
  background: rgba(20, 25, 40, 0.85);
  border: 1vpx solid rgba($magic-cyan, 0.4);
  box-shadow:
    0 10vpx 40vpx rgba(0, 0, 0, 0.5),
    inset 0 0 20vpx rgba($magic-cyan, 0.1);
  overflow: hidden;
  position: relative;

  &::before {
    // 覆盖默认的光效
    background: linear-gradient(
      135deg,
      transparent 20%,
      rgba($magic-cyan, 0.1) 40%,
      rgba($magic-cyan, 0.4) 50%,
      transparent 60%
    );
  }
}

.modal-header {
  padding: 20vpx 24vpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1vpx solid rgba(255, 255, 255, 0.1);
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.05), transparent);

  .modal-title {
    display: flex;
    align-items: center;
    gap: 8vpx;
    font-size: 18vpx;
    font-weight: bold;
    color: $magic-cyan;
    text-shadow: 0 0 10vpx rgba($magic-cyan, 0.5);

    .title-icon {
      font-size: 22vpx;
    }
  }

  .close-btn {
    width: 30vpx;
    height: 30vpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20vpx;
    color: rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    transition: all 0.3s ease;
    cursor: pointer;

    &:active {
      transform: scale(0.9);
      background: rgba(255, 255, 255, 0.1);
    }
  }
}

.modal-content {
  flex: 1;
  padding: 24vpx;
  overflow-y: auto;
  font-size: 16vpx;
  line-height: 1.8;
  color: rgba(255, 255, 255, 0.9);

  .parsed-content {
    white-space: pre-wrap;
    word-break: break-all;
  }

  .highlight-text {
    color: $magic-gold;
    font-weight: bold;
    text-shadow: 0 0 5vpx rgba($magic-gold, 0.4);
    background: linear-gradient(180deg, transparent 70%, rgba($magic-gold, 0.2) 70%);
  }

  .clue-link {
    color: $magic-cyan;
    text-decoration: underline;
    cursor: pointer;
  }

  .clue-img-wrapper {
    margin: 16vpx 0;
    border-radius: 12vpx;
    overflow: hidden;
    border: 1vpx solid rgba(255, 255, 255, 0.1);

    .clue-img {
      width: 100%;
      max-height: 300vpx;
      display: block;
      cursor: zoom-in;
    }
  }

  .clue-video-wrapper {
    margin: 16vpx 0;
    .video-placeholder {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30vpx;
      background: rgba(0, 0, 0, 0.4);
      border: 1vpx dashed rgba($magic-purple, 0.5);
      border-radius: 12vpx;
      gap: 12vpx;
      color: rgba(255, 255, 255, 0.8);
      cursor: pointer;

      &:active {
        background: rgba($magic-purple, 0.2);
      }

      .play-icon {
        font-size: 36vpx;
        color: $magic-purple;
      }
    }
  }
}

.modal-footer {
  padding: 20vpx 24vpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16vpx;
  background: linear-gradient(to top, rgba(255, 255, 255, 0.05), transparent);
  border-top: 1vpx solid rgba(255, 255, 255, 0.05);

  .hint-text {
    font-size: 12vpx;
    color: rgba(255, 255, 255, 0.4);
  }

  .confirm-btn {
    width: 100%;
    padding: 12vpx 0;
    border-radius: 20vpx;
    background: linear-gradient(90deg, rgba($magic-cyan, 0.8), rgba($magic-purple, 0.8));
    color: #fff;
    font-size: 16vpx;
    font-weight: bold;
    border: none;
    outline: none;
    cursor: pointer;
    box-shadow: 0 4vpx 15vpx rgba($magic-cyan, 0.3);

    &:active {
      transform: scale(0.98);
      box-shadow: 0 2vpx 8vpx rgba($magic-cyan, 0.2);
    }
  }
}

// 过渡动画
.modal-scale-enter-active,
.modal-scale-leave-active {
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-scale-enter-from,
.modal-scale-leave-to {
  opacity: 0;
  transform: scale(0.85) translateY(20vpx);
}
</style>
