<!-- components/ClueArtifact/UrlPreview.vue -->
<!-- URL 预览组件：全屏模式下可点击展开 iframe 预览 -->
<template>
  <div class="url-preview" :class="{ 'preview-active': isPreviewActive }">
    <!-- 切换按钮 -->
    <div class="preview-toggle" @click="togglePreview" v-if="!isPreviewActive">
      <div class="toggle-btn">
        <el-icon :size="toVpx(18)">
          <Position />
        </el-icon>
        <span class="toggle-text">点击预览页面</span>
      </div>
      <div class="toggle-decoration">
        <span class="deco-line"></span>
        <span class="deco-dot"></span>
        <span class="deco-line"></span>
      </div>
    </div>

    <!-- iframe 预览区域 -->
    <transition name="preview-fade">
      <div v-if="isPreviewActive" class="preview-container">
        <!-- 关闭按钮 -->
        <div class="preview-close" @click="closePreview">
          <el-icon :size="toVpx(16)">
            <Close />
          </el-icon>
        </div>

        <!-- iframe 容器 -->
        <div class="iframe-wrapper">
          <iframe
            v-if="shouldRenderIframe"
            ref="iframeRef"
            :src="url"
            class="preview-iframe"
            sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
            loading="lazy"
            @load="handleIframeLoad"
            @error="handleIframeError"
          />

          <!-- 加载状态 -->
          <div v-if="isLoading" class="loading-overlay">
            <el-icon :size="toVpx(24)" class="loading-icon">
              <Loading />
            </el-icon>
            <span class="loading-text">正在加载...</span>
          </div>

          <!-- 加载失败提示 -->
          <div v-if="loadError" class="error-overlay">
            <el-icon :size="toVpx(24)">
              <WarningFilled />
            </el-icon>
            <span class="error-text">页面加载失败</span>
            <span class="error-hint" @click="openInNewTab">在新窗口打开</span>
          </div>
        </div>

        <!-- 底部操作栏 -->
        <div class="preview-actions">
          <span class="action-btn" @click="openInNewTab">
            <el-icon :size="toVpx(14)"><Link /></el-icon>
            新窗口打开
          </span>
        </div>

        <!-- 魔法装饰边框 -->
        <div class="preview-magic-border"></div>
      </div>
    </transition>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, onBeforeUnmount } from "vue";
import { Position, Close, Loading, WarningFilled, Link } from "@element-plus/icons-vue";
import { toVpx } from "@/utils/toVpx";

const props = defineProps<{
  url: string;
}>();

const emit = defineEmits(["expand", "collapse"]);

const isPreviewActive = ref(false);
const shouldRenderIframe = ref(false);
const isLoading = ref(false);
const loadError = ref(false);
const iframeRef = ref<HTMLIFrameElement | null>(null);

// 打开预览时才渲染 iframe
const togglePreview = () => {
  isPreviewActive.value = true;
  isLoading.value = true;
  loadError.value = false;
  emit("expand");
  // 延迟渲染 iframe，让过渡动画先完成
  setTimeout(() => {
    shouldRenderIframe.value = true;
  }, 100);
};

// 关闭预览时销毁 iframe
const closePreview = () => {
  // 先清空 iframe src 停止加载
  if (iframeRef.value) {
    iframeRef.value.src = "about:blank";
  }
  shouldRenderIframe.value = false;
  isPreviewActive.value = false;
  isLoading.value = false;
  loadError.value = false;
  emit("collapse");
};

const handleIframeLoad = () => {
  isLoading.value = false;
};

const handleIframeError = () => {
  isLoading.value = false;
  loadError.value = true;
};

const openInNewTab = () => {
  window.open(props.url, "_blank");
};

// 组件销毁时确保 iframe 被清理
onBeforeUnmount(() => {
  if (iframeRef.value) {
    iframeRef.value.src = "about:blank";
  }
  shouldRenderIframe.value = false;
});

// 监听 url 变化，如果预览中则重新加载
watch(
  () => props.url,
  () => {
    if (isPreviewActive.value) {
      isLoading.value = true;
      loadError.value = false;
    }
  },
);
</script>

<style lang="scss" scoped>
@use "../../_variables.scss" as *;

.url-preview {
  margin-top: 12vpx;
  border-radius: $radius-md;
  overflow: hidden;
  background: rgba(20, 17, 13, 0.4);
  border: 1vpx solid rgba($cyan-deep, 0.3);
  transition: all 0.3s ease;

  &.preview-active {
    background: rgba(20, 17, 13, 0.8);
    border-color: rgba($cyan-deep, 0.5);
  }
}

.preview-toggle {
  padding: 16vpx;
  cursor: pointer;
  transition: all 0.3s ease;

  &:active {
    transform: scale(0.98);
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10vpx;
    color: $cyan-deep;
    font-size: 14vpx;
    font-weight: 500;
    margin-bottom: 10vpx;

    .el-icon {
      animation: pulse-icon 2.4s ease-in-out infinite;
    }
  }

  .toggle-decoration {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8vpx;

    .deco-line {
      width: 40vpx;
      height: 1vpx;
      background: linear-gradient(to right, transparent, rgba($cyan-deep, 0.5), transparent);
    }

    .deco-dot {
      width: 6vpx;
      height: 6vpx;
      border-radius: 50%;
      background: $cyan-deep;
      animation: dot-pulse 1.8s ease-in-out infinite;
    }
  }
}

.preview-container {
  position: relative;
  width: 100%;
  background: $ink-900;

  .preview-close {
    position: absolute;
    top: 8vpx;
    right: 8vpx;
    z-index: 10;
    width: 28vpx;
    height: 28vpx;
    border-radius: 50%;
    background: rgba(20, 17, 13, 0.6);
    border: 1vpx solid rgba(236, 230, 216, 0.2);
    display: flex;
    align-items: center;
    justify-content: center;
    color: $text;
    cursor: pointer;
    transition: all 0.3s ease;

    &:active {
      transform: scale(0.9);
      background: rgba($cyan-deep, 0.6);
    }
  }

  .iframe-wrapper {
    position: relative;
    width: 100%;
    height: 300vpx;
    background: #fff;
    border-radius: 4vpx;
    overflow: hidden;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }

  .preview-iframe {
    width: 100%;
    height: 100%;
    border: none;
    background: #fff;
    -webkit-transform: translateZ(0);
    transform: translateZ(0);
  }

  .loading-overlay,
  .error-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12vpx;
    background: rgba(20, 17, 13, 0.85);
    color: $text;

    .loading-icon {
      animation: spin 1s linear infinite;
    }

    .loading-text,
    .error-text {
      font-size: 14vpx;
    }

    .error-hint {
      font-size: 12vpx;
      color: $cyan-deep;
      text-decoration: underline;
      cursor: pointer;
    }
  }

  .preview-actions {
    display: flex;
    justify-content: center;
    padding: 10vpx;
    background: rgba(20, 17, 13, 0.6);

    .action-btn {
      display: flex;
      align-items: center;
      gap: 6vpx;
      color: $text-mute;
      font-size: 12vpx;
      cursor: pointer;
      transition: color 0.3s ease;

      &:active {
        color: $cyan-deep;
      }
    }
  }

  // 单色 ember 边框
  .preview-magic-border {
    position: absolute;
    inset: 0;
    border: 1.5vpx solid transparent;
    border-radius: 4vpx;
    background: linear-gradient(135deg, rgba($ember, 0.4), rgba($ember, 0.2)) border-box;
    -webkit-mask:
      linear-gradient(#fff 0 0) padding-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) padding-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.7;
  }
}

@keyframes pulse-icon {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.8;
  }
}

@keyframes dot-pulse {
  0%,
  100% {
    opacity: 0.4;
    transform: scale(0.8);
  }
  50% {
    opacity: 1;
    transform: scale(1.2);
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.preview-fade-enter-active {
  animation: preview-in 0.4s ease-out;
}
.preview-fade-leave-active {
  animation: preview-out 0.3s ease-in;
}

@keyframes preview-in {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes preview-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}
</style>
