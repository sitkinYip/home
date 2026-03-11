/**
 * 事件追踪系统 - Event Tracker
 * 用于统一管理和上报用户行为事件
 */

import { getQueryParam } from "./qa/questions";

export enum UserName {
  TRAVELER = "旅行者",
  TR = "旅行者",
  tr = "旅行者",
  CXY = "陈晓滢",
  cxy = "陈晓滢",
  XX = "夏夏",
  xx = "夏夏",
  XY = "晓滢",
  xy = "晓滢",
}

const getUserName = () => {
  const queryUser = getQueryParam("user")?.[0] as keyof typeof UserName | null;
  return queryUser ? UserName[queryUser] : queryUser || null;
};

// 事件类型定义
export enum EventType {
  // 页面访问
  PAGE_VISIT = "page_visit",
  // 题目访问
  QUESTION_VISIT = "question_visit",
  // 多题模式访问
  MULTI_QUESTION_VISIT = "multi_question_visit",
  // 单题模式访问
  SINGLE_QUESTION_VISIT = "single_question_visit",

  // 弹窗/组件打开
  MODAL_OPEN = "modal_open",
  MAGIC_SCROLL_OPEN = "magic_scroll_open",
  CLUE_MODAL_OPEN = "clue_modal_open",

  // 弹窗/组件关闭
  MODAL_CLOSE = "modal_close",
  MAGIC_SCROLL_CLOSE = "magic_scroll_close",
  CLUE_MODAL_CLOSE = "clue_modal_close",

  // 跳转事件
  LINK_CLICK = "link_click",
  ROUTE_NAVIGATE = "route_navigate",

  // 答题事件
  ANSWER_SUBMIT = "answer_submit",
  ANSWER_CORRECT = "answer_correct",
  ANSWER_WRONG = "answer_wrong",

  // 媒体播放
  MEDIA_PLAY = "media_play",
  VIDEO_PLAY = "video_play",
  IMAGE_PREVIEW = "image_preview",

  // 其他
  CUSTOM_ACTION = "custom_action",
}

// 事件数据接口
export interface EventData {
  // 事件类型
  type: EventType;
  // 事件标题/名称
  title?: string;
  // 详细内容
  content?: string;
  // 额外参数
  extra?: Record<string, any>;
  // 用户名（可选，会自动补充）
  userName?: string;
}

// 上报配置
interface TrackerConfig {
  // API 地址
  apiUrl: string;
  // 是否开启调试模式
  debug: boolean;
}

class EventTracker {
  private config: TrackerConfig;
  private defaultUserName: string = "旅行者";
  // 用于记录已上报的弹窗事件（当前页面会话内去重）
  private reportedModalEvents: Set<string> = new Set();

  constructor(config?: Partial<TrackerConfig>) {
    this.config = {
      apiUrl: config?.apiUrl || "https://api.chuckfang.com/4acc3779/",
      debug: config?.debug || false,
    };
  }

  /**
   * 设置默认用户名
   */
  setDefaultUserName(name: string) {
    this.defaultUserName = name || "旅行者";
  }

  /**
   * 构建上报消息
   */
  private buildMessage(data: EventData, userName: string): string {
    const parts: string[] = [];

    // 添加标题
    if (data.title) {
      parts.push(data.title);
    }

    // 添加内容
    if (data.content) {
      parts.push(data.content);
    }

    // 添加额外参数
    if (data.extra && Object.keys(data.extra).length > 0) {
      const extraStr = Object.entries(data.extra)
        .map(([key, value]) => `${key}=${value}`)
        .join("&");
      parts.push(extraStr);
    }

    // 组合消息
    const message = parts.join(" | ");
    return `${message} -- 来自sitkin.top/${userName}`;
  }

  /**
   * 发送事件
   */
  private sendEvent(message: string): void {
    // 每天都动态检测 URL 参数，确保调试模式生效
    const isDebug = getQueryParam("debug")?.[0] === "1";

    if (isDebug) {
      this.printDebugMessage(message);
      return;
    }

    // 使用 sendBeacon 优先（不会因页面关闭而中断）
    if (navigator.sendBeacon) {
      try {
        navigator.sendBeacon(this.config.apiUrl, message);
      } catch (e) {
        console.error("[EventTracker] sendBeacon failed", e);
        // fallback 到 fetch
        this.sendViaFetch(message);
      }
    } else {
      this.sendViaFetch(message);
    }
  }

  /**
   * 检查弹窗事件是否已上报（用于去重）
   * @param eventType 事件类型
   * @param title 标题
   * @param content 内容
   * @returns 如果已上报返回 true，否则返回 false 并记录
   */
  private shouldReportModalEvent(eventType: EventType, title: string, content?: string): boolean {
    // 生成唯一 key：类型 + 标题 + 内容
    const key = `${eventType}:${title}:${content || ""}`;

    if (this.reportedModalEvents.has(key)) {
      return false; // 已上报，跳过
    }

    this.reportedModalEvents.add(key); // 记录为已上报
    return true; // 需要上报
  }

  /**
   * 重置弹窗事件记录（页面刷新时自动重置）
   */
  resetModalEvents(): void {
    this.reportedModalEvents.clear();
  }

  /**
   * 打印调试信息（美化控制台输出）
   */
  private printDebugMessage(message: string): void {
    const timestamp = new Date().toLocaleTimeString("zh-CN", { hour12: false });

    // 解析消息内容
    const parts = message.split(" -- 来自");
    const content = parts[0] || "";
    const source = parts[1] ? `来自${parts[1]}` : "";

    // 分割内容中的标题、详情和参数
    const segments = content.split(" | ");
    const title = segments[0] || "事件";
    const detail = segments[1] || "";
    const params = segments[2] || "";

    // 样式定义
    const styles = {
      badge:
        "background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;",
      timestamp: "color: #888; font-size: 11px;",
      title: "color: #667eea; font-weight: bold; font-size: 13px;",
      detail: "color: #4a5568; font-size: 12px;",
      params: "color: #718096; font-size: 11px; font-style: italic;",
      source: "color: #a0aec0; font-size: 10px;",
      separator: "color: #cbd5e0;",
    };

    // 分组输出
    console.groupCollapsed(
      `%c ⚡ EVENT %c ${timestamp} %c ${title}`,
      styles.badge,
      styles.timestamp,
      styles.title,
    );

    // 输出详细信息
    if (detail) {
      console.log(`%c  ${detail}`, styles.detail);
    }

    if (params) {
      console.log(`%c  📋 ${params}`, styles.params);
    }

    if (source) {
      console.log(`%c  └─ ${source}`, styles.source);
    }

    console.groupEnd();
  }

  /**
   * 通过 fetch 发送（兜底方案）
   * 调试模式下不发送实际请求，仅打印控制台日志
   */
  private sendViaFetch(message: string): void {
    const isDebug = getQueryParam("debug")?.[0] === "1";
    if (isDebug) {
      return; // 调试模式仅打印，不发送请求
    }

    fetch(this.config.apiUrl + encodeURIComponent(message)).catch((e) =>
      console.error("[EventTracker] fetch failed", e),
    );
  }

  /**
   * 追踪事件 - 核心方法
   * @param data 事件数据
   * @param userName 可选的用户名，不传则使用默认值
   */
  track(data: EventData, userName?: string): void {
    // 优先从 URL query 中获取 user 字段
    const queryUser = getUserName();

    // 优先级: URL query -> 显式传入的 userName -> data.userName -> 默认值
    const name = queryUser || userName || data.userName || this.defaultUserName;

    const message = this.buildMessage(data, name);
    this.sendEvent(message);
  }

  /**
   * 快捷方法：页面访问
   */
  trackPageVisit(pageName: string, extra?: Record<string, any>, userName?: string): void {
    this.track(
      {
        type: EventType.PAGE_VISIT,
        title: pageName,
        extra,
      },
      userName,
    );
  }

  /**
   * 快捷方法：题目访问
   */
  trackQuestionVisit(
    step: number,
    questionTitle: string,
    isMultiMode: boolean = false,
    userName?: string,
  ): void {
    this.track(
      {
        type: isMultiMode ? EventType.MULTI_QUESTION_VISIT : EventType.SINGLE_QUESTION_VISIT,
        title: `第${step}题`,
        content: questionTitle,
        extra: { step, isMultiMode },
      },
      userName,
    );
  }

  /**
   * 快捷方法：MagicScroll 打开
   */
  trackMagicScrollOpen(title: string, content?: string, userName?: string): void {
    // 去重检查：相同内容的弹窗只上报一次
    /* if (!this.shouldReportModalEvent(EventType.MAGIC_SCROLL_OPEN, "神谕密卷", title)) {
      return; // 已上报，跳过
    } */

    this.track(
      {
        type: EventType.MAGIC_SCROLL_OPEN,
        title: "打开线索富文本弹窗",
        content: title,
        extra: { hasContent: !!content },
      },
      userName,
    );
  }

  /**
   * 快捷方法：MagicScroll 关闭
   */
  trackMagicScrollClose(title: string, content?: string, userName?: string): void {
    this.track(
      {
        type: EventType.MAGIC_SCROLL_CLOSE,
        title: "关闭线索富文本弹窗",
        content: title,
        extra: { hasContent: !!content },
      },
      userName,
    );
  }

  /**
   * 快捷方法：线索弹窗打开
   */
  trackClueModalOpen(title: string, contentId?: string, userName?: string): void {
    // 去重检查：相同内容的弹窗只上报一次
    /* if (!this.shouldReportModalEvent(EventType.CLUE_MODAL_OPEN, "隐藏的线索", title)) {
      return; // 已上报，跳过
    } */

    this.track(
      {
        type: EventType.CLUE_MODAL_OPEN,
        title: "隐藏的线索",
        content: title,
        extra: { contentId },
      },
      userName,
    );
  }

  /**
   * 快捷方法：线索弹窗关闭
   */
  trackClueModalClose(title: string, contentId?: string, userName?: string): void {
    this.track(
      {
        type: EventType.CLUE_MODAL_CLOSE,
        title: "关闭隐藏的线索",
        content: title,
        extra: { contentId },
      },
      userName,
    );
  }

  /**
   * 快捷方法：链接点击
   */
  trackLinkClick(url: string, linkText?: string, userName?: string): void {
    this.track(
      {
        type: EventType.LINK_CLICK,
        title: "链接跳转",
        content: linkText || url,
        extra: { url },
      },
      userName,
    );
  }

  /**
   * 快捷方法：路由跳转
   */
  trackRouteNavigate(
    path: string,
    query?: Record<string, any>,
    from?: string,
    userName?: string,
  ): void {
    this.track(
      {
        type: EventType.ROUTE_NAVIGATE,
        title: "路由跳转",
        content: path,
        extra: {
          path,
          query: JSON.stringify(query),
          from,
        },
      },
      userName,
    );
  }

  /**
   * 快捷方法：答案提交
   */
  trackAnswerSubmit(step: number, answer: string, isCorrect: boolean, userName?: string): void {
    this.track(
      {
        type: isCorrect ? EventType.ANSWER_CORRECT : EventType.ANSWER_WRONG,
        title: isCorrect ? "回答正确" : "回答错误",
        content: answer,
        extra: { step, isCorrect },
      },
      userName,
    );
  }

  /**
   * 快捷方法：媒体播放
   */
  trackMediaPlay(
    mediaType: "video" | "image" | "audio",
    mediaUrl: string,
    title?: string,
    userName?: string,
  ): void {
    this.track(
      {
        type: EventType.MEDIA_PLAY,
        title: `播放${mediaType === "video" ? "视频" : mediaType === "image" ? "图片" : "音频"}`,
        content: title || mediaUrl,
        extra: { mediaType, url: mediaUrl },
      },
      userName,
    );
  }

  /**
   * 快捷方法：自定义事件
   */
  trackCustomAction(
    actionName: string,
    description?: string,
    extra?: Record<string, any>,
    userName?: string,
  ): void {
    this.track(
      {
        type: EventType.CUSTOM_ACTION,
        title: actionName,
        content: description,
        extra,
      },
      userName,
    );
  }
}

// 导出单例
export const tracker = new EventTracker();

// 工具函数：从 URL 参数中获取 debug 标志
export function getDebugFromQuery(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("debug") === "1";
}

// 工具函数：初始化追踪器（可在应用启动时调用）
export function initTracker(config?: { apiUrl?: string; userName?: string }): EventTracker {
  const debug = getDebugFromQuery();

  const instance = new EventTracker({
    apiUrl: config?.apiUrl,
    debug,
  });

  if (config?.userName) {
    instance.setDefaultUserName(config.userName);
  }

  return instance;
}
