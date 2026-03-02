<template>
  <header class="hero-header">
    <div class="header-left">
      <!-- 用户英雄头像 -->
      <div class="user-avatar-wrap" @click="$emit('avatarClick')">
        <div class="avatar-frame"></div>
        <el-image :src="qaInfo?.avatar || '默认头像地址'" class="user-avatar" fit="cover">
          <template #error>
            <div class="avatar-placeholder">
              {{ currentUserDisplay?.at?.(-1) ?? "旅" }}
            </div>
          </template>
        </el-image>
      </div>

      <!-- 英雄信息 -->
      <div class="hero-info">
        <h2 class="hero-name">{{ currentUserDisplay }}</h2>
        <div class="level-badge">
          RANK: {{ qaInfo?.rank ?? "未知" }} ·
          {{ qaInfo?.rankName || "探索者" }}
        </div>
      </div>
    </div>

    <!-- 右侧：解谜状态指示器 -->
    <div class="header-right" @click="$emit('headerClick')">
      <div class="status-indicator-wrap" :class="{ 'is-error-shake': isError }">
        <!-- 动态光晕类：增加 is-error-glow -->
        <div
          class="avatar-glow"
          :class="{
            'is-bingo-glow': isBinGo,
            'is-error-glow': isError,
          }"
        ></div>

        <!-- 内部容器：增加 is-error-border -->
        <div class="status-inner" :class="{ 'is-error-border': isError }">
          <el-icon :size="24">
            <!-- 三态图标逻辑 -->
            <CircleClose v-if="isError" color="#ff4757" />
            <template v-else>
              <Lock v-if="!isBinGo" color="#ffd700" />
              <MagicStick v-else color="#2ecc71" />
            </template>
          </el-icon>
        </div>
      </div>
    </div>
  </header>
</template>

<script lang="ts" setup>
import { Lock, MagicStick, CircleClose } from "@element-plus/icons-vue";

defineProps<{
  qaInfo: any;
  currentUserDisplay: string;
  currentStep: number;
  isError: boolean;
  isBinGo: boolean;
}>();

defineEmits(["avatarClick", "headerClick"]);
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

// 英雄头部样式
.hero-header {
  display: flex;
  align-items: center;
  justify-content: space-between; // 两端对齐
  margin-bottom: 32vpx;
  width: 100%;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12vpx; // 头像与文字的间距
  }

  // 左侧：用户头像组件
  .user-avatar-wrap {
    position: relative;
    width: 54vpx;
    height: 54vpx;
    flex-shrink: 0;

    .avatar-frame {
      position: absolute;
      inset: -4vpx;
      border: 2vpx solid rgba($magic-gold, 0.5);
      border-radius: 50%;
      &::before {
        content: "";
        position: absolute;
        inset: -8vpx;
        border: 1vpx dashed rgba($magic-gold, 0.3);
        border-radius: 50%;
        animation: rotateCW 10s linear infinite;
      }
      &::after {
        content: "";
        position: absolute;
        inset: -4vpx;
        border: 2vpx solid transparent;
        border-top-color: rgba($magic-gold, 0.6);
        border-bottom-color: rgba($magic-gold, 0.6);
        border-radius: 50%;
        animation: rotateCCW 3s ease-in-out infinite;
      }
    }

    .user-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2vpx solid #0a0e14;
      display: block;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: #2c3e50;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $magic-gold;
      font-size: 20vpx;
    }
  }

  .hero-info {
    display: flex;
    flex-direction: column;
    justify-content: center;

    .hero-name {
      font-size: 18vpx; // 稍微调小一点，保证一行显示
      font-weight: 800;
      margin: 0;
      color: #fff;
      text-shadow: 0 2vpx 8vpx rgba(0, 0, 0, 0.8);
      max-width: 180vpx; // 防止名字过长遮挡
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .level-badge {
      font-size: 10vpx;
      color: $magic-gold;
      letter-spacing: 1vpx;
      background: rgba(255, 215, 0, 0.1);
      padding: 2vpx 8vpx;
      border-radius: 4vpx;
      margin-top: 4vpx;
      border: 0.5vpx solid rgba($magic-gold, 0.3);
    }
  }

  // 右侧：状态指示器
  .status-indicator-wrap {
    position: relative;
    width: 46vpx; // 比头像略小，主次分明
    height: 46vpx;
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    .avatar-glow {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: $magic-gold;
      border-radius: 50%;
      filter: blur(10vpx);
      opacity: 0.3;
      animation: pulse 2s infinite;
      transition:
        background 0.3s,
        filter 0.3s,
        opacity 0.3s;
      &.is-error-glow {
        background: $magic-red !important;
        opacity: 0.7 !important;
        filter: blur(15vpx) !important; // 错误时光晕更扩散，更有反噬感
      }
      &.is-bingo-glow {
        background: $magic-green;
        opacity: 0.5;
      }
    }

    .status-inner {
      position: relative;
      width: 100%;
      height: 100%;
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(5vpx);
      border: 1vpx solid rgba($magic-gold, 0.4);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 0 10vpx rgba($magic-gold, 0.1);
    }
  }
}

@keyframes rotateCW {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
@keyframes rotateCCW {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.4;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.6;
  }
  100% {
    transform: scale(1);
    opacity: 0.4;
  }
}
</style>
