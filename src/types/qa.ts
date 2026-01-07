/**
 * 问题条目类型：可以是纯字符串，也可以是包含文字、图片或提示的对象
 */
export interface QuestionItem {
    text?: string;
    tips?: string;
    img?: string;
}

/**
 * 线索条目类型
 */
export interface ThreadItem {
    type: 'text' | 'url' | 'img' | 'video';
    content: string;
    url?: string;
    imgList?: string[];
    state?: string; // 比如 'ckickplay' 表示点击播放
}

/**
 * 关卡数据结构 (对应服务端 API 返回的单个 item)
 */
export interface LevelRecord {
    id: string;
    step: number;               // 对应原来的 qaIndex
    question: (string | QuestionItem)[];
    answer: string;
    placeholder: string;
    thread: ThreadItem[];
    userName: string;
    collectionId: string;
    collectionName: string;
    created: string;
    updated: string;
    startTime?: string;
    endTime?: string;
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
