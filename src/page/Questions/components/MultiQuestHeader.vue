<template>
  <header class="multi-hero-header">
    <div class="header-left">
      <!-- 用户英雄头像 -->
      <div class="user-avatar-wrap" @click="$emit('avatarClick')">
        <div class="avatar-frame"></div>
        <el-image :src="avatar" class="user-avatar" fit="cover">
          <template #error>
            <div class="avatar-placeholder">
              {{ userName?.at?.(-1) ?? "旅" }}
            </div>
          </template>
        </el-image>
      </div>

      <!-- 英雄信息 -->
      <div class="hero-info">
        <h2 class="hero-name">{{ userName }}</h2>
        <div class="level-badge">RANK: {{ displayRank }} · {{ displayRankName }}</div>
      </div>
    </div>

    <!-- 右侧：解谜状态指示器 -->
    <div class="header-right" @click="$emit('headerClick')">
      <div class="status-indicator-wrap" :class="{ 'is-error-shake': isError }">
        <div
          class="avatar-glow"
          :class="{
            'is-bingo-glow': isBinGo,
            'is-error-glow': isError,
          }"
        ></div>

        <div class="status-inner" :class="{ 'is-error-border': isError }">
          <el-icon :size="24">
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
import { computed } from "vue";
import { Lock, MagicStick, CircleClose } from "@element-plus/icons-vue";
import type { LevelRecord } from "@/types/qa";
import type { RankInfo } from "../composables/useRankUp";

const props = defineProps<{
  /** 当前活跃 slide 对应的关卡数据（用于取头像、名称） */
  activeLevel: LevelRecord | null;
  /** 最高等级信息（由 useRankUp 的 extractHighestRank 计算） */
  rankInfo: RankInfo | null;
  /** 当前活跃 slide 的答对状态 */
  isBinGo: boolean;
  /** 当前活跃 slide 的答错状态 */
  isError: boolean;
}>();

defineEmits(["avatarClick", "headerClick"]);

const userName = computed(() => props.activeLevel?.userName || "旅行者");
const avatar = computed(() => props.activeLevel?.avatar || "");

const displayRank = computed(() => {
  if (props.rankInfo) return props.rankInfo.rank;
  return props.activeLevel?.rank ?? "未知";
});

const displayRankName = computed(() => {
  if (props.rankInfo) return props.rankInfo.rankName;
  return props.activeLevel?.rankName || "探索者";
});
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

.multi-hero-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12vpx 24vpx;
  margin-bottom: 8vpx;
  width: 100%;
  box-sizing: border-box;

  .header-left {
    display: flex;
    align-items: center;
    gap: 12vpx;
  }

  .user-avatar-wrap {
    position: relative;
    width: 48vpx;
    height: 48vpx;
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
        animation: multiHeaderRotateCW 10s linear infinite;
      }

      &::after {
        content: "";
        position: absolute;
        inset: -4vpx;
        border: 2vpx solid transparent;
        border-top-color: rgba($magic-gold, 0.6);
        border-bottom-color: rgba($magic-gold, 0.6);
        border-radius: 50%;
        animation: multiHeaderRotateCCW 3s ease-in-out infinite;
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
      font-size: 18vpx;
      border-radius: 50%;
    }
  }

  .hero-info {
    display: flex;
    flex-direction: column;
    justify-content: center;

    .hero-name {
      font-size: 16vpx;
      font-weight: 800;
      margin: 0;
      color: #fff;
      text-shadow: 0 2vpx 8vpx rgba(0, 0, 0, 0.8);
      max-width: 160vpx;
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
    width: 42vpx;
    height: 42vpx;
    cursor: pointer;
    transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);

    &.is-error-shake {
      animation: multiHeaderShake 0.5s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
    }

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
      animation: multiHeaderPulse 2s infinite;
      transition:
        background 0.3s,
        filter 0.3s,
        opacity 0.3s;

      &.is-error-glow {
        background: $magic-red !important;
        opacity: 0.7 !important;
        filter: blur(15vpx) !important;
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
      -webkit-backdrop-filter: blur(5vpx);
      border: 1vpx solid rgba($magic-gold, 0.4);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: inset 0 0 10vpx rgba($magic-gold, 0.1);
      transition:
        border-color 0.3s,
        box-shadow 0.3s;

      &.is-error-border {
        border-color: rgba($magic-red, 0.6);
        box-shadow:
          inset 0 0 10vpx rgba($magic-red, 0.2),
          0 0 20vpx rgba($magic-red, 0.3);
      }
    }
  }
}

@keyframes multiHeaderRotateCW {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes multiHeaderRotateCCW {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

@keyframes multiHeaderPulse {
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

@keyframes multiHeaderShake {
  0%,
  100% {
    transform: translateX(0);
  }
  15% {
    transform: translateX(-3vpx);
  }
  30% {
    transform: translateX(3vpx);
  }
  45% {
    transform: translateX(-3vpx);
  }
  60% {
    transform: translateX(3vpx);
  }
  75% {
    transform: translateX(-1vpx);
  }
  90% {
    transform: translateX(1vpx);
  }
}
</style>
