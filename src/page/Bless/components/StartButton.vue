<template>
  <div class="overlay">
    <div class="start-btn" @click="$emit('start')">
      <span>{{ text }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * @component StartButton
 * @description 开始按钮组件，采用 Glassmorphism 玻璃拟态风格
 */

defineProps<{
  text: string;
}>();

defineEmits(["start"]);
</script>

<style scoped>
/* 引入更高级的字体 */
@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@400;500&display=swap");

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6); /* 稍微淡一点让用户能隐约看到背景星空 */
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  transition: opacity 1s ease;
}

.start-btn {
  padding: 18px 50px;
  color: #fff;
  font-family: "Cinzel", "Songti SC", serif;
  font-size: 1.2rem;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 50px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  letter-spacing: 8px;
  cursor: pointer;
  transition: all 0.6s cubic-bezier(0.19, 1, 0.22, 1);
  box-shadow: 0 0 30px rgba(255, 255, 255, 0.05);
  position: relative;
  overflow: hidden;
}

.start-btn::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.start-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  box-shadow:
    0 0 40px rgba(135, 206, 250, 0.3),
    inset 0 0 20px rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.6);
  transform: translateY(-2px) scale(1.02);
}

.start-btn:hover::before {
  left: 100%;
  transition: 0.5s;
}

@media (max-width: 768px) {
  .start-btn {
    padding: 14px 30px;
    font-size: 16px;
    letter-spacing: 3px;
    width: 70%;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
