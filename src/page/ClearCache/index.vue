<template>
  <div class="clear-cache-container">
    <!-- 魔法背景 -->
    <div class="magic-bg"></div>
    <div class="overlay"></div>

    <!-- 主要内容区 -->
    <div class="quest-wrapper">
      <div class="magic-panel quest-card">
        <div class="header-line">
          <div class="line"></div>
          <span class="title">记忆净化仪</span>
          <div class="line"></div>
        </div>

        <div class="content-region">
          <p class="narrative-text">
            古老的记忆符文正在此沉降...<br />
            划过残垣断壁，便能将羁绊彻底斩断。
          </p>

          <div class="param-info" v-if="isValidQuery">
            <span class="label">目标类型：</span>
            <span class="value">{{ typeName }}</span>
            <template v-if="step">
              <span class="label">层级印记：</span>
              <span class="value">{{ step }}</span>
            </template>
            <template v-if="user">
              <span class="label">灵魂凭证：</span>
              <span class="value">{{ user }}</span>
            </template>
            <template v-if="rank">
              <span class="label">进阶位面：</span>
              <span class="value">{{ rank }}</span>
            </template>
          </div>

          <!-- 暂无目标 -->
          <div v-else class="empty-state">
            <el-icon class="icon"><Warning /></el-icon>
            <p>并未锚定任何待净化的记忆坐标...</p>
          </div>

          <!-- 缓存展示区：有数据则展示滑动卡片，无数据则展示提示 -->
          <div v-if="isValidQuery && matchedKeys.length > 0" class="cache-list">
            <van-swipe-cell
              v-for="item in matchedKeys"
              :key="item"
              class="cache-item-cell"
              @close="handleClear(item)"
            >
              <div class="cache-card">
                <el-icon class="card-icon"><DocumentDelete /></el-icon>
                <div class="card-content">
                  <div class="card-name">受缚的残存记忆</div>
                  <div class="card-key">{{ item }}</div>
                </div>
                <div class="swipe-hint">
                  <el-icon><ArrowLeft /></el-icon> 左滑净化
                </div>
              </div>
              <template #right>
                <div class="delete-btn-area">
                  <van-button
                    square
                    type="danger"
                    text="净化"
                    class="delete-btn"
                    @click="handleClear(item)"
                  />
                </div>
              </template>
            </van-swipe-cell>
            <!-- 全部净化按钮 -->
            <div class="action-bar">
              <button class="btn-clear-all" @click="handleClearAll">✦ 全部净化 ✦</button>
            </div>
          </div>

          <div v-else-if="isValidQuery" class="empty-state success">
            <el-icon class="icon"><Check /></el-icon>
            <p>该坐标下的记忆已纯洁无瑕，无需净化。</p>
          </div>

          <div class="footer-actions">
            <button class="btn-back" @click="handleBack">返回现实</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { showNotify, showToast } from "vant";
import { DocumentDelete, Warning, Check, ArrowLeft } from "@element-plus/icons-vue";

/** === 路由提取 === */
const route = useRoute();
const router = useRouter();

const typeMap: Record<string, string> = {
  qa: "答题进度遗迹 (qa)",
  penalty: "灵魂惩罚禁锢 (penalty)",
  rankUp: "等级升华印迹 (rankUp)",
};

const rawType = (route.query.type as string) || "";
const step = (route.query.step as string) || "";
const user = (route.query.user as string) || "";
const rank = (route.query.rank as string) || "";

const isValidQuery = computed(() => !!typeMap[rawType]);
const typeName = computed(() => typeMap[rawType] || "未知异物");

/** === 缓存匹配逻辑 === */
const matchedKeys = ref<string[]>([]);

const isMatch = (key: string) => {
  if (rawType === "qa") {
    const prefix = `qaIndex${step}`;
    if (!key.startsWith(prefix)) return false;

    // 如果 query 中传递了 user，就必须匹配起首是该字母的记录
    if (user) {
      const rest = key.slice(prefix.length);
      return rest.startsWith(user);
    }
    // 如果没有传递 user，那么直接匹配这个 prefix 即可（即包含了所有用户的）
    return true;
  } else if (rawType === "penalty") {
    const parts = key.split("_");
    if (parts[0] !== "qa" || parts[1] !== "penalty") return false;

    const keyStep = parts[2] || "";
    const keyUser = parts[3] || "";

    if (step && keyStep !== String(step)) return false;
    // user 参数有值时，精准匹配；没值时忽略，匹配所有 user
    if (user && keyUser !== user) return false;

    return true;
  } else if (rawType === "rankUp") {
    const parts = key.split("_");
    if (parts[0] !== "rankUpShown") return false;

    const keyUser = parts[1] || "";
    const keyRank = parts[2] || "";

    // user 参数有值时，精准匹配；没值时忽略，匹配所有 user
    if (user && keyUser !== user) return false;
    if (rank && keyRank !== String(rank)) return false;

    return true;
  }
  return false;
};

const refreshMatchedKeys = () => {
  matchedKeys.value = [];
  const totalKeys = Object.keys(localStorage);
  matchedKeys.value = totalKeys.filter(isMatch);
};

onMounted(() => {
  if (isValidQuery.value) {
    refreshMatchedKeys();
  } else {
    showNotify({ type: "danger", message: "星轨坐标有误，无法执行净化协议" });
  }
});

/** === 交互事件 === */
const handleClear = (key: string) => {
  try {
    localStorage.removeItem(key);
    refreshMatchedKeys();
    showToast({
      message: "记忆已破碎...",
      icon: "success",
    });
  } catch (e) {
    showNotify({ type: "danger", message: "净化遭到反噬！" });
  }
};

const handleClearAll = () => {
  try {
    matchedKeys.value.forEach((key) => {
      localStorage.removeItem(key);
    });
    refreshMatchedKeys();
    showNotify({
      type: "success",
      message: "✨ 光芒拂过，所有残存记忆均已净化 ✨",
      background: "rgba(46, 204, 113, 0.9)",
    });
  } catch (e) {
    showNotify({ type: "danger", message: "部分净化遭到反噬！" });
  }
};

const handleBack = () => {
  router.back();
};
</script>

<style lang="scss" scoped>
@use "../Questions/_variables" as *;

.clear-cache-container {
  position: relative;
  min-height: 100vh;
  width: 100%;
  overflow-x: hidden;
  background-color: #000;
  display: flex;
  flex-direction: column;
}

.magic-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url("https://images.unsplash.com/photo-1534447677768-be436bb09401") center/cover
    no-repeat;
  filter: brightness(0.3) saturate(1.2);
  z-index: 0;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
  pointer-events: none;
  z-index: 1;
}

::after {
  content: "";
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  background: radial-gradient(circle at 30% 30%, rgba($magic-gold, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 70% 60%, rgba($magic-purple, 0.15) 0%, transparent 50%);
  mix-blend-mode: screen;
  animation: env-glow 15s ease-in-out infinite alternate;
  z-index: 2;
}

@keyframes env-glow {
  0% {
    transform: scale(1) translate(0, 0);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.1) translate(-2%, 2%);
    opacity: 0.8;
  }
}

.quest-wrapper {
  position: relative;
  z-index: 4;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24vpx 16vpx;
}

.magic-panel {
  width: 100%;
  max-width: 390vpx;
  background: $glass-bg;
  backdrop-filter: blur(20vpx);
  -webkit-backdrop-filter: blur(20vpx);
  border: 1vpx solid $glass-border;
  border-radius: 20vpx;
  box-shadow: 0 8vpx 32vpx rgba(0, 0, 0, 0.3);
  padding: 30vpx 24vpx;
  position: relative;
  overflow: hidden;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 200%;
    height: 100%;
    background: linear-gradient(
      45deg,
      transparent 20%,
      rgba(255, 255, 255, 0.1) 50%,
      transparent 80%
    );
    z-index: 10;
    pointer-events: none;
    animation: sweep-light 6s linear infinite;
  }
}

@keyframes sweep-light {
  0% {
    transform: translateX(-50%);
  }
  100% {
    transform: translateX(50%);
  }
}

.header-line {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24vpx;
  gap: 12vpx;

  .line {
    flex: 1;
    height: 1vpx;
    background: linear-gradient(90deg, transparent, $magic-gold, transparent);
    opacity: 0.5;
  }

  .title {
    font-size: 20vpx;
    color: $magic-gold;
    font-weight: bold;
    letter-spacing: 2vpx;
    text-shadow: 0 0 10vpx rgba($magic-gold, 0.4);
  }
}

.content-region {
  display: flex;
  flex-direction: column;
  gap: 20vpx;
}

.narrative-text {
  font-size: 15vpx;
  color: rgba(255, 255, 255, 0.85);
  line-height: 1.6;
  text-align: center;
  font-style: italic;
  margin: 0;
}

.param-info {
  background: rgba(0, 0, 0, 0.3);
  border: 1vpx solid rgba($magic-gold, 0.2);
  border-radius: 12vpx;
  padding: 16vpx;
  display: flex;
  flex-direction: column;
  gap: 8vpx;

  .label {
    font-size: 13vpx;
    color: rgba(255, 255, 255, 0.5);
    display: inline-block;
    width: 70vpx;
  }

  .value {
    font-size: 14vpx;
    color: $magic-gold;
    font-weight: bold;
    word-break: break-all;
  }
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 30vpx 0;
  gap: 12vpx;
  opacity: 0.6;

  .icon {
    font-size: 32vpx;
    color: $magic-red;
  }

  p {
    font-size: 14vpx;
    color: #fff;
    margin: 0;
    text-align: center;
  }

  &.success {
    opacity: 0.9;
    .icon {
      color: $magic-green;
      text-shadow: 0 0 10vpx rgba($magic-green, 0.5);
    }
  }
}

.cache-list {
  display: flex;
  flex-direction: column;
  gap: 12vpx;
}

.cache-item-cell {
  border-radius: 12vpx;
  overflow: hidden;
  background: transparent;
}

.cache-card {
  display: flex;
  align-items: center;
  background: rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 16vpx;
  position: relative;
  transition: all 0.3s;

  .card-icon {
    font-size: 24vpx;
    color: $magic-purple;
    margin-right: 12vpx;
  }

  .card-content {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 4vpx;
  }

  .card-name {
    font-size: 14vpx;
    color: #fff;
    font-weight: bold;
  }

  .card-key {
    font-size: 11vpx;
    color: rgba(255, 255, 255, 0.4);
    word-break: break-all;
    font-family: monospace;
  }

  .swipe-hint {
    font-size: 12vpx;
    color: rgba($magic-gold, 0.6);
    display: flex;
    align-items: center;
    gap: 4vpx;
    animation: hint-pulse 2s infinite alternate;
  }
}

@keyframes hint-pulse {
  0% {
    transform: translateX(0);
    opacity: 0.5;
  }
  100% {
    transform: translateX(-4vpx);
    opacity: 1;
  }
}

.delete-btn-area {
  height: 100%;
  display: flex;
}

.delete-btn {
  height: 100%;
  padding: 0 24vpx;
  font-size: 16vpx;
  font-weight: bold;
  background: linear-gradient(135deg, $magic-red, #c0392b);
  border: none;
  box-shadow: inset 0 0 10vpx rgba(0, 0, 0, 0.3);
}

.action-bar {
  margin-top: 10vpx;
  display: flex;
  justify-content: center;
}

.btn-clear-all {
  background: transparent;
  border: 1px solid rgba($magic-red, 0.6);
  color: $magic-red;
  padding: 10vpx 24vpx;
  border-radius: 20vpx;
  font-size: 14vpx;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;

  &:active {
    transform: scale(0.96);
    background: rgba($magic-red, 0.1);
  }
}

.footer-actions {
  margin-top: 20vpx;
  display: flex;
  justify-content: center;
}

.btn-back {
  background: linear-gradient(135deg, $magic-purple, #4834d4);
  color: #fff;
  border: none;
  padding: 12vpx 40vpx;
  border-radius: 24vpx;
  font-size: 16vpx;
  font-weight: bold;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  box-shadow: 0 4vpx 15vpx rgba(0, 0, 0, 0.2);
  transition: transform 0.2s;

  &:active {
    transform: scale(0.96);
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: -100%;
    width: 50%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transform: skewX(-25deg);
    animation: flare 4s infinite;
  }
}

@keyframes flare {
  0% {
    left: -100%;
  }
  20% {
    left: 200%;
  }
  100% {
    left: 200%;
  }
}
</style>
