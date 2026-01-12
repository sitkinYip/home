<!-- components/AdventureLost.vue -->
<template>
  <div class="lost-container">
    <div class="lost-content">
      <!-- 动态装饰：破碎的星盘 -->
      <div class="broken-compass">
        <div class="compass-ring"></div>
        <el-icon class="lost-icon"><Compass /></el-icon>
      </div>

      <h1 class="lost-title">迷失在虚空中</h1>
      <p class="lost-desc">
        旅人，你所追寻的坐标并没有出现在星图之上。<br />
        这片时空尚未开启，或已被迷雾永久封存。
      </p>

      <div class="action-group">
        <button v-if="hasFirstStep" class="magic-btn primary" @click="goHome">
          回归原点 (Level 1)
        </button>
        <button class="magic-btn secondary" @click="contactAdmin">呼唤时空管理者</button>
      </div>
    </div>

    <!-- 背景虚空尘埃动效 -->
    <div class="void-dust"></div>
  </div>
</template>

<script lang="ts" setup>
import { getQueryParam } from "@/utils/qa/questions";
import { Compass } from "@element-plus/icons-vue";
import { showToast } from "vant";

defineProps<{
  hasFirstStep: boolean;
}>();

const goHome = () => {
  // 刷新页面并跳转到第一关
  const url = new URL(window.location.href);
  url.searchParams.set("qa", "1");
  window.location.href = url.toString();
};

const contactAdmin = () => {
  showToast("已向星际发出求救信号，请等待导师回应...");
  const qaIndex = getQueryParam("qa")?.[0];
  fetch(
    `https://api.chuckfang.com/4acc3779/query参数异常通知 -- 来自sitkin.top/有用户访问了不存在的谜题${qaIndex}`,
  ).catch((e) => console.error("Report failed", e));
};
</script>

<style lang="scss" scoped>
$magic-gold: #ffd700;

.lost-container {
  position: fixed;
  inset: 0;
  z-index: 10006;
  background: radial-gradient(circle at center, #1a0f2e 0%, #050208 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40vpx;
  text-align: center;
  overflow: hidden;
}

.lost-content {
  position: relative;
  z-index: 2;
  animation: fade-in 1s ease-out;
}

.broken-compass {
  position: relative;
  width: 120vpx;
  height: 120vpx;
  margin: 0 auto 30vpx;
  display: flex;
  align-items: center;
  justify-content: center;

  .compass-ring {
    position: absolute;
    inset: 0;
    border: 2vpx dashed rgba($magic-gold, 0.3);
    border-radius: 50%;
    animation: rotate 15s linear infinite;
  }

  .lost-icon {
    font-size: 60vpx;
    color: rgba($magic-gold, 0.5);
    filter: drop-shadow(0 0 15vpx rgba($magic-gold, 0.3));
  }
}

.lost-title {
  color: $magic-gold;
  font-size: 24vpx;
  letter-spacing: 4vpx;
  margin-bottom: 20vpx;
  text-shadow: 0 0 10vpx rgba($magic-gold, 0.4);
}

.lost-desc {
  color: rgba(255, 255, 255, 0.6);
  font-size: 15vpx;
  line-height: 1.8;
  margin-bottom: 40vpx;
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 16vpx;
  align-items: center;

  .magic-btn {
    background: transparent;
    padding: 12vpx 40vpx;
    border-radius: 30vpx;
    font-size: 15vpx;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s;
    width: 220vpx;

    &.primary {
      border: 1.5vpx solid $magic-gold;
      color: $magic-gold;
      box-shadow: 0 0 15vpx rgba($magic-gold, 0.2);
      &:active {
        transform: scale(0.95);
        background: rgba($magic-gold, 0.1);
      }
    }

    &.secondary {
      border: 1vpx solid rgba(255, 255, 255, 0.3);
      color: rgba(255, 255, 255, 0.5);
      font-size: 13vpx;
      &:active {
        opacity: 0.7;
      }
    }
  }
}

.void-dust {
  position: absolute;
  inset: 0;
  background-image: radial-gradient(white, transparent 2vpx);
  background-size: 50vpx 50vpx;
  opacity: 0.1;
  animation: dust-move 20s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20vpx);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes dust-move {
  from {
    transform: translateY(0);
  }
  to {
    transform: translateY(-500vpx);
  }
}
</style>
