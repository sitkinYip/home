<template>
  <Transition name="slide-down">
    <div v-if="visible" class="bgm-auth-hint" @click="$emit('authorize')">
      <div class="hint-glow"></div>
      <div class="hint-content">
        <div class="music-note">♪</div>
        <span class="hint-text">点这里开启背景乐章</span>
      </div>
      <button class="close-btn" @click.stop="$emit('dismiss')">
        <span class="close-icon">×</span>
      </button>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
defineProps<{
  visible: boolean;
}>();

defineEmits<{
  (e: "authorize"): void;
  (e: "dismiss"): void;
}>();
</script>

<style lang="scss" scoped>
@use "../_variables.scss" as *;

.bgm-auth-hint {
  position: fixed;
  top: 12vpx;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;

  // 毛玻璃容器
  padding: 12vpx 24vpx;
  background: $glass-bg;
  backdrop-filter: blur(20vpx);
  -webkit-backdrop-filter: blur(20vpx);
  border: 1vpx solid $glass-border;
  border-radius: $radius-pill;
  box-shadow:
    0 8vpx 32vpx rgba(0, 0, 0, 0.3),
    inset 0 1vpx 0 rgba(236, 230, 216, 0.1);

  cursor: pointer;
  transition: all 0.3s ease;

  &:active {
    transform: translateX(-50%) scale(0.98);
  }

  // 顶部发光效果
  .hint-glow {
    position: absolute;
    top: -1vpx;
    left: 20%;
    right: 20%;
    height: 1vpx;
    background: linear-gradient(90deg, transparent, rgba($ember, 0.6), transparent);
    filter: blur(1vpx);
  }

  .hint-content {
    display: flex;
    align-items: center;
    gap: 10vpx;
    color: $text;
  }

  .music-note {
    font-size: 16vpx;
    color: $ember;
    text-shadow: 0 0 10vpx rgba($ember, 0.5);
    animation: float-note 2.4s ease-in-out infinite;
  }

  .hint-text {
    font-size: 13vpx;
    letter-spacing: 1vpx;
    font-weight: 400;
  }

  .close-btn {
    position: absolute;
    right: -8vpx;
    top: -8vpx;
    width: 20vpx;
    height: 20vpx;
    border-radius: 50%;
    background: rgba(20, 17, 13, 0.5);
    backdrop-filter: blur(4vpx);
    border: 1vpx solid $glass-border;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s ease;

    .close-icon {
      font-size: 12vpx;
      color: $text-mute;
      line-height: 1;
    }

    &:active {
      background: rgba(20, 17, 13, 0.7);
      .close-icon {
        color: $text;
      }
    }
  }
}

// 进入/离开动画
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.slide-down-enter-from {
  transform: translateX(-50%) translateY(-20vpx);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateX(-50%) translateY(-10vpx);
  opacity: 0;
}

@keyframes float-note {
  0%,
  100% {
    transform: translateY(0) rotate(-5deg);
  }
  50% {
    transform: translateY(-2vpx) rotate(5deg);
  }
}
</style>
