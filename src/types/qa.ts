/**
 * 问题条目类型：可以是纯字符串，也可以是包含文字、图片或提示的对象
 */
export interface QuestionItem {
  text?: string;
  tips?: string;
  img?: string;
  video?: string;
  imgList?: string[];
}
/**
 * 线索条目类型
 */
export interface ThreadItem {
  type: "text" | "url" | "img" | "video" | "letter";
  content: string;
  url?: string;
  imgList?: string[];
  state?: "ckickplay" | string; // 比如 'ckickplay' 表示点击播放
  path?: string;
  query?: Record<string, string>;
  nextIndex?: number;
}

export type QuestionItemList = QuestionItem[];
export type ThreadItemList = ThreadItem[];

export interface ParagraphConfig {
  /** 段落文本内容 */
  content: string;
  /** 对齐方式：左、中、右  上 下*/
  align?: "left" | "center" | "right" | "top" | "bottom";
  /** 打字前的延迟时间 (ms) */
  delay?: number;
  /** 关联的音频地址 */
  audio?: string;
}

export type ParagraphConfigList = ParagraphConfig[];

/**
 * 关卡数据结构 (对应服务端 API 返回的单个 item)
 */
export interface LevelRecord {
  title?: string;
  id: string;
  step: number; // 对应原来的 qaIndex
  question: QuestionItemList;
  answer: string;
  placeholder: string;
  thread: ThreadItemList;
  userName: string;
  collectionId: string;
  collectionName: string;
  created: string;
  updated: string;
  startTime?: string;
  endTime?: string;
  avatar?: string;
  rankName?: string;
  isFinalLevel?: boolean;
  FinalLevelConfig?: {
    path?: string;
    link?: string;
    query?: Record<string, string>;
  };
}

/**
 * API 返回的包装结构
 */
export interface ApiResponse<T> {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
}
