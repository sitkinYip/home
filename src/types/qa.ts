/**
 * 选项
 */
export interface OptionItem {
  text?: string;
  img?: string;
  key: string; // A/B/C/D.....选项编号 也有可能是 1/2/3/4之类的 随意设置
  video?: string;
}
type OptionItemList = OptionItem[];
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
  title?: string;
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
export interface TLetterecord {
  paragraphConfigList: ParagraphConfigList;
  bgImages?: string[];
  from: string;
  type: "modern" | "classical";
  title?: string;
  desc?: string;
  bgImg?: string;
  /* 页面主音频 一般用于当前页面播放背景音乐之类的场景 */
  mainAudio?: string;
}
/**
 * 关卡数据结构 (对应服务端 API 返回的单个 item)
 */
export interface LevelRecord {
  type?: "FillInTheBlank" | "MultipleChoice"; // 填空题或选择题 不填默认为填空题
  options?: OptionItemList;
  title?: string;
  id: string;
  step: number; // 对应原来的 qaIndex
  question: QuestionItemList;
  answer: string;
  answerList?: string[];
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
  penaltyConfig?: number[];
}

export interface IphraseItem {
  text: string;
  audio?: string;
  duration?: number;
}

export type PhraseListRecord = {
  phraseList: IphraseItem[];
  takeABowList: IphraseItem[];
  from: string;
  title?: string;
  /* 页面主音频 一般用于当前页面播放背景音乐之类的场景 */
  mainAudio?: string;
};
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
