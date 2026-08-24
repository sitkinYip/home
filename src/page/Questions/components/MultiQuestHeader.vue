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
        animation: multiHeaderRotateCW 14s linear infinite;
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
      font-weight: 700;
      margin: 0;
      color: $text;
      text-shadow: 0 2vpx 8vpx rgba(0, 0, 0, 0.6);
      max-width: 160vpx;
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
      background: $ember;
      border-radius: 50%;
      filter: blur(10vpx);
      opacity: 0.22;
      animation: multiHeaderPulse 2.6s infinite;
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
      -webkit-backdrop-filter: blur(5vpx);
      border: 1vpx solid rgba($ember, 0.4);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: $glass-inner;
      transition:
        border-color 0.3s,
        box-shadow 0.3s;

      &.is-error-border {
        border-color: rgba($rust, 0.6);
        box-shadow:
          inset 0 0 10vpx rgba($rust, 0.2),
          0 0 20vpx rgba($rust, 0.28);
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

@keyframes multiHeaderPulse {
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
