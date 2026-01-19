<template>
  <div class="overlay error-state">
    <div class="error-content">
      <div class="void-star">✦</div>
      <h2>星空沉寂</h2>
      <p>这片星域似乎未被点亮<br />或者信使迷失在了银河中</p>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component ErrorState
 * @description 加载失败或数据异常时的错误提示组件
 */
</script>

<style scoped>
.error-state {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.error-state .error-content {
  text-align: center;
  color: rgba(255, 255, 255, 0.6);
}

.void-star {
  font-size: 40px;
  background: linear-gradient(to bottom, #fff, #546e7a);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

.error-content h2 {
  font-size: 18px;
  letter-spacing: 6px;
  font-weight: 300;
  margin-bottom: 15px;
}

.error-content p {
  font-size: 13px;
  line-height: 1.8;
  font-weight: 200;
  opacity: 0.8;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}
</style>
