<template>
  <!-- 模板部分保持不变 -->
  <el-dialog
    v-model="dialogVisible"
    :show-close="false"
    width="90%"
    :close-on-click-modal="true"
    class="video-dialog"
    @close="handleClose"
  >
    <div class="video-container">
      <video
        ref="videoPlayer"
        :src="videoUrl"
        controls
        class="video-element"
        playsinline
        webkit-playsinline
      ></video>
      <el-icon class="close-btn" @click="dialogVisible = false">
        <Close />
      </el-icon>
    </div>
  </el-dialog>
</template>

<script>
import { ref, watch, nextTick } from 'vue'
import { ElDialog, ElIcon } from 'element-plus'
import { Close } from '@element-plus/icons-vue'

export default {
  components: { ElDialog, ElIcon, Close },
  setup() {
    const dialogVisible = ref(false)
    const videoUrl = ref('')
    const videoPlayer = ref(null)

    // 新增处理视频结束的函数
    const handleVideoEnded = () => {
      dialogVisible.value = false
    }

    const open = (url) => {
      videoUrl.value = url
      dialogVisible.value = true
    }

    const handleClose = () => {
      if (videoPlayer.value) {
        videoPlayer.value.pause()
        videoPlayer.value.currentTime = 0
      }
    }

    watch(dialogVisible, async (val) => {
      if (val) {
        await nextTick()
        if (videoPlayer.value) {
          // 先移除旧的监听器避免重复
          videoPlayer.value.removeEventListener('ended', handleVideoEnded)
          // 添加新的结束事件监听
          videoPlayer.value.addEventListener('ended', handleVideoEnded)
          
          // 处理自动播放
          videoPlayer.value.play().catch(() => {
            // 自动播放失败处理（保持不变）
          })
        }
      }
    })

    return {
      dialogVisible,
      videoUrl,
      videoPlayer,
      open,
      handleClose
    }
  }
}
</script>

<!-- 样式部分保持不变 -->

<style lang="scss">
.video-dialog {
  &.el-dialog {
    padding: 0;
    background-color: transparent;
  }
  display: flex;
  align-items: center;
  justify-content: center;
}

.video-container {
  position: relative;
  width: 100%;
  max-width: 100vw;
  max-height: 80vh;
}

.video-element {
  width: 100%;
  height: auto;
  max-height: 80vh;
  border-radius: 8px;
  overflow: hidden;
}
/* 隐藏原生控件 */
.video-element::-webkit-media-controls-overlay-play-button,
.video-element::-webkit-media-controls-seek-back-button,
.video-element::-webkit-media-controls-seek-forward-button {
  display: none !important;
}

.close-btn {
  position: absolute;
  top: -40px;
  right: -10px;
  font-size: 24px;
  color: #fff;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.5);
  border-radius: 50%;
  padding: 4px;
}

@media (orientation: portrait) {
  /* 竖屏样式 */
  .video-container {
    width: 90vw;
    height: calc(90vw * 9 / 16);
  }
}

@media (orientation: landscape) {
  /* 横屏样式 */
  .video-container {
    width: calc(90vh * 16 / 9);
    height: 90vh;
  }
}
</style>