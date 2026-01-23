<template>
  <div class="overlay loading-state">
    <div class="star-loader">
      <div class="star-dust"></div>
      <div class="loading-text">正在汇聚星光...</div>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component LoadingState
 * @description 页面资源加载中的状态展示，包含星光加载动画
 */
</script>

<style scoped>
/* 引入更高级的字体 */
@import "@/assets/fonts/Cinzel/font.css";

.loading-state {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.star-loader {
  position: relative;
  text-align: center;
}

.loading-text {
  margin-top: 20px;
  color: rgba(255, 255, 255, 0.7);
  font-family: "Cinzel", serif;
  font-size: 14px;
  letter-spacing: 6px;
  animation: pulse 2s infinite ease-in-out;
  text-transform: uppercase;
}

.star-dust {
  width: 50px;
  height: 50px;
  margin: 0 auto;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-top-color: #fff;
  animation: spin 2s linear infinite;
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.1);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 0.4;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.1);
  }
  50% {
    opacity: 0.9;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
  }
}
</style>
