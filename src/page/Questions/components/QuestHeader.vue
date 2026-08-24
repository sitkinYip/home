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
            <CircleClose v-if="isError" color="#c4564f" />
            <template v-else>
              <Lock v-if="!isBinGo" color="#d9a441" />
              <MagicStick v-else color="#5fae7f" />
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
    gap: 12vpx;
  }

  // 左侧：用户头像组件
  .user-avatar-wrap {
    position: relative;
    width: 54vpx;
    height: 54vpx;
    flex-shrink: 0;

    // 单层细线环 + 慢速单向旋转
    .avatar-frame {
      position: absolute;
      inset: -4vpx;
      border: 1.5vpx solid rgba($ember, 0.45);
      border-radius: 50%;
      &::before {
        content: "";
        position: absolute;
        inset: -6vpx;
        border: 1vpx dashed rgba($ember, 0.22);
        border-radius: 50%;
        animation: rotateCW 14s linear infinite;
      }
    }

    .user-avatar {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      border: 2vpx solid $ink-900;
      display: block;
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      background: $ink-700;
      display: flex;
      align-items: center;
      justify-content: center;
      color: $ember;
      font-family: $font-display;
      font-size: 20vpx;
    }
  }

  .hero-info {
    display: flex;
    flex-direction: column;
    justify-content: center;

    .hero-name {
      font-size: 18vpx;
      font-weight: 700;
      margin: 0;
      color: $text;
      text-shadow: 0 2vpx 8vpx rgba(0, 0, 0, 0.6);
      max-width: 180vpx;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .level-badge {
      font-family: $font-display;
      font-size: 10vpx;
      color: $ember;
      letter-spacing: 1.5vpx;
      background: $ember-faint;
      padding: 2vpx 8vpx;
      border-radius: $radius-sm;
      margin-top: 4vpx;
      border: 0.5vpx solid rgba($ember, 0.28);
      display: inline-block;
      width: fit-content;
    }
  }

  // 右侧：状态指示器
  .status-indicator-wrap {
    position: relative;
    width: 46vpx;
    height: 46vpx;
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    .avatar-glow {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: $ember;
      border-radius: 50%;
      filter: blur(10vpx);
      opacity: 0.22;
      animation: pulse 2.6s infinite;
      transition:
        background 0.3s,
        filter 0.3s,
        opacity 0.3s;
      &.is-error-glow {
        background: $rust !important;
        opacity: 0.5 !important;
        filter: blur(15vpx) !important;
      }
      &.is-bingo-glow {
        background: $jade;
        opacity: 0.35;
      }
    }

    .status-inner {
      position: relative;
      width: 100%;
      height: 100%;
      background: $glass-bg;
      backdrop-filter: blur(5vpx);
      border: 1vpx solid rgba($ember, 0.4);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: $glass-inner;
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
@keyframes pulse {
  0% {
    transform: scale(1);
    opacity: 0.35;
  }
  50% {
    transform: scale(1.12);
    opacity: 0.6;
  }
  100% {
    transform: scale(1);
    opacity: 0.35;
  }
}
</style>
