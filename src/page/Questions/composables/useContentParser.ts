import { computed, Ref, unref } from "vue";
import { useRouter } from "vue-router";
import { showImagePreview } from "vant";

/**
 * 内容段落类型定义
 */
export interface ContentSegment {
  type: "text" | "highlight" | "link" | "image" | "video" | "br";
  content?: string;
  url?: string;
  /** 视频封面图（仅 video 类型） */
  poster?: string;
}

/**
 * 解析配置选项
 */
export interface ParseOptions {
  /** 图片是否显示为占位提示（用于预览模式） */
  imagePlaceholder?: boolean;
  /** 图片占位提示文案 */
  imagePlaceholderText?: string;
  /** 视频占位提示文案 */
  videoPlaceholderText?: string;
}

const DEFAULT_IMAGE_PLACEHOLDER = "📜 点击查看隐藏图像";
const DEFAULT_VIDEO_PLACEHOLDER = "🎬 点击查看隐藏视频";

/**
 * 解析内容文本为段落数组
 * 支持:
 * - [[文本]] 高亮
 * - ((文本||url)) 链接/路由
 * - {{url}} 图片
 * - \n 换行
 */
export function parseContent(text: string, options: ParseOptions = {}): ContentSegment[] {
  if (!text) return [];

  const {
    imagePlaceholder = false,
    imagePlaceholderText = DEFAULT_IMAGE_PLACEHOLDER,
    videoPlaceholderText = DEFAULT_VIDEO_PLACEHOLDER,
  } = options;

  const segments: ContentSegment[] = [];
  // 统一处理换行符
  const normalizedText = text.replace(/\r\n/g, "\n");

  // 正则说明：
  // 1. [[...]] 高亮 -> group 1
  // 2. ((...||...)) 链接/路由 -> group 2 (text), group 3 (url)
  // 3. {{...}} 图片 -> group 4 (url)
  // 4. <<...>> 或 <<...||...>> 视频 -> group 5 (url), group 6 (poster, 可选)
  // 5. \n 换行 -> group 7
  const regex = /\[\[(.*?)\]\]|\(\((.*?)\|\|(.*?)\)\)|\{\{(.*?)\}\}|<<(.*?)(?:\|\|(.*?))?>>/g;
  // 合并主正则和换行匹配
  const combinedRegex = new RegExp(`${regex.source}|(\\n)`, "g");

  let lastIndex = 0;
  let match;

  while ((match = combinedRegex.exec(normalizedText)) !== null) {
    // 添加匹配前的普通文本
    if (match.index > lastIndex) {
      segments.push({
        type: "text",
        content: normalizedText.slice(lastIndex, match.index),
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
      if (imagePlaceholder) {
        // 预览模式：显示占位提示
        segments.push({
          type: "link",
          content: imagePlaceholderText,
          url: match[4],
        });
      } else {
        // 完整模式：显示图片
        segments.push({ type: "image", url: match[4] });
      }
    } else if (match[5]) {
      // <<videoUrl>> 或 <<videoUrl||posterUrl>>
      if (imagePlaceholder) {
        // 预览模式：显示占位提示
        segments.push({
          type: "link",
          content: videoPlaceholderText,
          url: match[5],
        });
      } else {
        // 完整模式：显示视频
        segments.push({
          type: "video",
          url: match[5],
          poster: match[6] || undefined,
        });
      }
    } else if (match[7]) {
      // \n
      segments.push({ type: "br" });
    }

    lastIndex = combinedRegex.lastIndex;
  }

  // 添加剩余的文本
  if (lastIndex < normalizedText.length) {
    segments.push({ type: "text", content: normalizedText.slice(lastIndex) });
  }

  return segments;
}

/**
 * 内容解析可组合式 Hook
 * 提供响应式内容解析和交互处理
 */
export function useContentParser(content: Ref<string> | string, options: ParseOptions = {}) {
  const router = useRouter();

  /**
   * 响应式解析后的内容段落
   */
  const parsedContent = computed<ContentSegment[]>(() => {
    const text = unref(content);
    return parseContent(text, options);
  });

  /**
   * 处理链接点击
   * - http(s)开头：新窗口打开
   * - 其他：内部路由跳转
   */
  const handleLinkClick = (url: string) => {
    if (!url) return;
    if (url.startsWith("http")) {
      window.open(url, "_blank");
    } else {
      // 跳转 /letter 路由时，将当前路径作为 returnTo 参数携带
      // 这样 Letter 页面可以展示返回按钮，并导航回来源页
      const isLetterRoute = url.startsWith("/letter");
      if (isLetterRoute) {
        const currentPath = router.currentRoute.value.fullPath;
        const separator = url.includes("?") ? "&" : "?";
        router.replace(`${url}${separator}returnTo=${encodeURIComponent(currentPath)}`);
      } else {
        router.replace(url);
      }
    }
  };

  /**
   * 处理图片点击预览
   */
  const handleImageClick = (url: string) => {
    if (!url) return;
    showImagePreview({
      images: [url],
      closeable: true,
    });
  };

  return {
    parsedContent,
    handleLinkClick,
    handleImageClick,
  };
}
