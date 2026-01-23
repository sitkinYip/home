<!-- components/MagicScroll.vue -->
<template>
  <transition name="letter-unfold">
    <div v-if="visible" class="scroll-overlay" @click.self="handleClose">
      <div class="scroll-body">
        <!-- 移除卷轴杆，改为纯信纸 -->
        <div class="scroll-paper">
          <div class="scroll-content-wrap">
            <div class="scroll-title">{{ title || "神谕密卷" }}</div>
            <!-- 核心：渲染解析后的富文本 -->
            <div class="scroll-text">
              <template v-for="(segment, index) in parsedContent" :key="index">
                <!-- 普通文本 -->
                <span v-if="segment.type === 'text'">{{ segment.content }}</span>

                <!-- 高亮文本 -->
                <span v-else-if="segment.type === 'highlight'" class="scroll-highlight">
                  {{ segment.content }}
                </span>

                <!-- 链接/路由 -->
                <span
                  v-else-if="segment.type === 'link'"
                  class="scroll-link"
                  @click="handleLinkClick(segment.url!)"
                >
                  {{ segment.content }}
                </span>

                <!-- 图片 -->
                <div v-else-if="segment.type === 'image'" class="scroll-image-wrap">
                  <van-image
                    :src="segment.url"
                    width="100%"
                    fit="contain"
                    class="scroll-img"
                    @click="handleImageClick(segment.url!)"
                  />
                </div>

                <!-- 换行 -->
                <br v-else-if="segment.type === 'br'" />
              </template>
            </div>
          </div>
          <div class="scroll-footer">
            <div class="wax-seal-btn" @click="handleClose">
              <span class="seal-text">封</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script lang="ts" setup>
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { showImagePreview } from "vant";

const router = useRouter();
const visible = ref(false);
const rawText = ref("");
const title = ref("");

// 增加定义内容段落的接口
interface ContentSegment {
  type: "text" | "highlight" | "link" | "image" | "br";
  content?: string;
  url?: string;
}

// 核心解析逻辑
const parsedContent = computed<ContentSegment[]>(() => {
  if (!rawText.value) return [];

  const segments: ContentSegment[] = [];
  // 统一处理换行符，便于正则分割
  const text = rawText.value.replace(/\r\n/g, "\n");

  // 正则说明：
  // 1. [[...]] 高亮
  // 2. ((...||...)) 链接/路由 -> group 2 (text), group 3 (url)
  // 3. {{...}} 图片 -> group 4 (url)
  // 4. \n 换行 -> group 5
  // 注意：split 会保留捕获组
  const regex = /\[\[(.*?)\]\]|\(\((.*?)\|\|(.*?)\)\)|\{\{(.*?)\}\}|(\n)/g;

  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // 添加匹配前的普通文本
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: text.slice(lastIndex, match.index),
      });
    }

    if (match[1]) {
      // [[highlight]]
      segments.push({ type: "highlight", content: match[1] });
    } else if (match[2] && match[3]) {
      // ((text||url))
      segments.push({ type: "link", content: match[2], url: match[3] });
    } else if (match[4]) {
      // {{imgUrl}}
      segments.push({ type: "image", url: match[4] });
    } else if (match[5]) {
      // \n
      segments.push({ type: "br" });
    }

    lastIndex = regex.lastIndex;
  }

  // 添加剩余的文本
  if (lastIndex < text.length) {
    segments.push({ type: "text", content: text.slice(lastIndex) });
  }

  return segments;
});

const show = (data: { title: string; content: string }) => {
  rawText.value = data.content;
  title.value = data.title;
  visible.value = true;
};

const handleClose = () => {
  visible.value = false;
};

const handleLinkClick = (url: string) => {
  if (!url) return;
  if (url.startsWith("http")) {
    window.open(url, "_blank");
  } else {
    router.push(url);
    handleClose(); // 跳转后关闭卷轴
  }
};

const handleImageClick = (url: string) => {
  if (!url) return;
  showImagePreview({
    images: [url],
    closeable: true,
  });
};

defineExpose({ show });
</script>

<style lang="scss" scoped>
// 引入字体：Cinzel (标题) 和 Crimson Text (正文)
@import "@/assets/fonts/Cinzel/font.css";
@import "@/assets/fonts/CrimsonText/font.css";

.scroll-overlay {
  position: fixed;
  inset: 0;
  z-index: 10005;
  background: rgba(10, 10, 15, 0.85); // 更深邃的背景
  backdrop-filter: blur(8vpx);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40vpx;
  transition: opacity 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  perspective: 1500vpx; // 为3D展开做准备
}

.scroll-body {
  position: relative;
  width: 100%;
  max-width: 340vpx;
  display: flex;
  flex-direction: column;
  align-items: center;
}

// 羊皮纸信纸主体
.scroll-paper {
  width: 90%;
  position: relative;
  /****************************************
   * 信纸质感：
   * 1. 基础色 #f4e4bc
   * 2. 噪点滤镜
   * 3. 模拟折痕 (三折页效果)
   ****************************************/
  background-color: #f4e4bc;
  background-image: 
    // 噪点纹理
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E"),
    // 折痕效果：两条隐约的横线
    linear-gradient(
        to bottom,
        transparent 33%,
        rgba(139, 69, 19, 0.08) 33.5%,
        transparent 34%,
        transparent 66%,
        rgba(139, 69, 19, 0.08) 66.5%,
        transparent 67%
      ),
    // 整体陈旧感渐变
    radial-gradient(ellipse at center, rgba(255, 255, 255, 0.4) 0%, rgba(160, 120, 60, 0.1) 80%);

  box-shadow:
    0 10vpx 30vpx rgba(0, 0, 0, 0.5),
    0 1vpx 3vpx rgba(0, 0, 0, 0.2); // 纸张立体感

  padding: 40vpx 30vpx;
  // 最小高度稍微高一点，体现信纸的修长
  min-height: 400vpx;
  max-height: 70vh;
  overflow-y: auto;

  // 边缘整齐，稍微有点做旧的边框线
  border: 1vpx solid rgba(139, 90, 43, 0.2);
  // 可选：加个双线边框装饰
  outline: 4vpx double rgba(139, 90, 43, 0.15);
  outline-offset: -12vpx;

  z-index: 1;

  &::-webkit-scrollbar {
    width: 4vpx;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(93, 64, 55, 0.3);
    border-radius: 2vpx;
  }

  .scroll-content-wrap {
    position: relative;
    // 添加一个装饰性边框（内嵌）
    &::before {
      content: "";
      position: absolute;
      inset: -10vpx -6vpx;
      border: 2vpx solid transparent;
      border-image: linear-gradient(
          to bottom,
          transparent,
          rgba(139, 69, 19, 0.2) 20%,
          rgba(139, 69, 19, 0.2) 80%,
          transparent
        )
        1;
      pointer-events: none;
    }
  }

  .scroll-title {
    font-family: "Cinzel", "Georgia", serif;
    font-size: 22vpx; // 稍微改小一点点，为了信纸排版
    color: #4e342e;
    font-weight: 700;
    text-align: center;
    margin-bottom: 32vpx; // 增加间距
    letter-spacing: 2vpx;
    text-shadow: 0 1vpx 2vpx rgba(255, 255, 255, 0.5);

    display: flex;
    align-items: center;
    justify-content: center;
    &::before,
    &::after {
      content: "~"; // 用波浪号代替星星
      color: #8d6e63;
      font-size: 16vpx;
      margin: 0 12vpx;
      opacity: 0.6;
      font-weight: normal;
    }
  }

  .scroll-text {
    font-family: "Crimson Text", "Georgia", serif;
    font-size: 17vpx;
    line-height: 2; // 行高加大，可以在线之间写字的感觉
    color: #3e2723;
    text-align: justify;
    letter-spacing: 0.5vpx;

    // 模拟信纸横线 (可选，这里还是保持干净吧，太多横线影响阅读)
    // background-image: repeating-linear-gradient(transparent, transparent 31vpx, rgba(0,0,0,0.05) 32vpx);
    // background-attachment: local;

    // 解析后的高亮样式：魔法红墨水
    :deep(.scroll-highlight) {
      color: #9a0007;
      font-weight: 700;
      background: transparent;
      padding: 0 2vpx;
      // 模拟羽毛笔加粗书写的效果
      text-shadow: 0 0 1vpx rgba(154, 0, 7, 0.1);
      border-bottom: 1.5vpx solid rgba(154, 0, 7, 0.3);
    }

    // 链接/路由样式
    :deep(.scroll-link) {
      color: #0d47a1; // 皇家蓝
      font-weight: 700;
      cursor: pointer;
      text-decoration: none;
      border-bottom: 1vpx dashed #0d47a1;
      padding: 0 2vpx;
      transition: all 0.2s ease;

      &:active {
        background: rgba(13, 71, 161, 0.1);
        color: #1565c0;
      }
    }

    // 图片容器样式
    :deep(.scroll-image-wrap) {
      margin: 16vpx 0;
      width: 100%;
      display: flex;
      justify-content: center;

      .scroll-img {
        // 让图片看起来像贴在羊皮纸上的老照片
        box-shadow: 2vpx 2vpx 5vpx rgba(0, 0, 0, 0.3);
        border: 4vpx solid #fff;
        transform: rotate(-1deg); // 稍微歪一点
        filter: sepia(0.3) contrast(1.1); // 复古滤镜
        max-width: 90%;
        transition: transform 0.3s ease;

        &:active {
          transform: scale(1.02) rotate(0deg);
        }
      }
    }
  }
}

// 底部火漆印章按钮
.scroll-footer {
  margin-top: 50vpx;
  margin-bottom: 20vpx;
  display: flex;
  justify-content: center;
  position: relative;
  width: 100%;
}

.wax-seal-btn {
  // 保持之前的火漆印章样式，非常符合信纸
  position: relative;
  width: 56vpx;
  height: 56vpx;
  background: radial-gradient(circle at 30% 30%, #d32f2f, #b71c1c, #5d0000);
  border-radius: 50%;
  box-shadow:
    0 4vpx 12vpx rgba(0, 0, 0, 0.4),
    inset 2vpx 2vpx 5vpx rgba(255, 255, 255, 0.2),
    inset -2vpx -2vpx 5vpx rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;

  &::before {
    content: "";
    position: absolute;
    inset: -3vpx;
    background: inherit;
    border-radius: 43% 57% 41% 59% / 54% 42% 58% 46%;
    z-index: -1;
    filter: blur(0.6vpx);
  }

  // 印章内部图案 (文字)
  .seal-text {
    color: rgba(60, 0, 0, 0.6);
    font-size: 14vpx;
    font-weight: 900;
    font-family: serif;
    letter-spacing: 1vpx;
    text-shadow: 0 1vpx 1vpx rgba(255, 255, 255, 0.1);
    border: 2vpx solid rgba(60, 0, 0, 0.3);
    border-radius: 50%;
    width: 40vpx;
    height: 40vpx;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: rotate(-10deg);
    box-shadow: inset 0 1vpx 2vpx rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: scale(0.95);
  }
}

/* 信纸展开动画 */
.letter-unfold-enter-active,
.letter-unfold-leave-active {
  transition: opacity 0.5s ease;
  .scroll-body {
    transition: transform 0.6s cubic-bezier(0.25, 1, 0.5, 1);
  }
}

.letter-unfold-enter-from,
.letter-unfold-leave-to {
  opacity: 0;
  .scroll-body {
    // 3D 翻转展开效果
    transform: translateY(-20vpx) rotateX(-15deg) scale(0.95);
  }
}
</style>
