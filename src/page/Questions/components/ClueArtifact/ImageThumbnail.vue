<!-- components/ClueArtifact/ImageThumbnail.vue -->
<!-- 图片缩略图组件：全屏模式下展示小缩略图，点击预览大图 -->
<template>
  <div class="image-thumbnail" @click="handlePreview">
    <div class="thumbnail-wrapper">
      <van-image :src="url" fit="cover" class="thumbnail-img" :lazy-load="true">
        <template #loading>
          <div class="loading-placeholder">
            <el-icon :size="toVpx(24)" class="loading-icon">
              <Picture />
            </el-icon>
          </div>
        </template>
        <template #error>
          <div class="error-placeholder">
            <el-icon :size="toVpx(24)">
              <Picture />
            </el-icon>
            <span>加载失败</span>
          </div>
        </template>
      </van-image>

      <!-- 悬浮遮罩 -->
      <div class="thumbnail-overlay">
        <el-icon :size="toVpx(20)">
          <ZoomIn />
        </el-icon>
        <span class="overlay-text">点击查看</span>
      </div>

      <!-- 魔法边框光效 -->
      <div class="magic-border"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Picture, ZoomIn } from "@element-plus/icons-vue";
import { showImagePreview } from "vant";
import { toVpx } from "@/utils/toVpx";

const props = defineProps<{
  url: string;
  imgList?: string[];
}>();

const handlePreview = () => {
  const images = props.imgList && props.imgList.length > 0 ? props.imgList : [props.url];
  showImagePreview({
    images,
    closeable: true,
  });
};
</script>

<style lang="scss" scoped>
@use "../../_variables.scss" as *;

.image-thumbnail {
  margin-top: 12vpx;
  width: 100%;
}

.thumbnail-wrapper {
  position: relative;
  width: 100%;
  height: 160vpx;
  border-radius: 12vpx;
  overflow: hidden;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.3);

  .thumbnail-img {
    width: 100%;
    height: 100%;
  }

  .loading-placeholder,
  .error-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8vpx;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12vpx;

    .loading-icon {
      animation: pulse 1.5s ease-in-out infinite;
    }
  }

  .thumbnail-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.4);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8vpx;
    color: #fff;
    opacity: 0;
    transition: opacity 0.3s ease;

    .overlay-text {
      font-size: 13vpx;
      font-weight: 500;
    }
  }

  &:active .thumbnail-overlay {
    opacity: 1;
  }

  // 魔法边框
  .magic-border {
    position: absolute;
    inset: 0;
    border: 2vpx solid transparent;
    border-radius: 12vpx;
    background: linear-gradient(135deg, rgba($magic-green, 0.3), rgba($magic-gold, 0.3)) border-box;
    -webkit-mask:
      linear-gradient(#fff 0 0) padding-box,
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask:
      linear-gradient(#fff 0 0) padding-box,
      linear-gradient(#fff 0 0);
    mask-composite: exclude;
    pointer-events: none;
    animation: border-glow 3s ease-in-out infinite alternate;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.5;
    transform: scale(1);
  }
  50% {
    opacity: 1;
    transform: scale(1.1);
  }
}

@keyframes border-glow {
  from {
    opacity: 0.5;
  }
  to {
    opacity: 1;
  }
}
</style>
