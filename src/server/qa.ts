import {
  LevelRecord,
  ApiResponse,
  TLetterecord,
  PhraseListRecord,
  MultiQuestClueRecord,
  NotificationRecord,
} from "@/types/qa";
import { request } from "@/fetch";
// const API_BASE = "https://api.sitkin.top/api/collections/levels/records";

/**
 * 从服务端获取所有关卡信息
 * @returns 返回关卡数组
 */
export const fetchLevels = async (): Promise<LevelRecord[]> => {
  const path = "/levels/records";
  try {
    const data = await request<ApiResponse<LevelRecord>>(path, {
      retries: 3, // 失败重试 3 次
      timeout: 10000, // 10s 超时
    });
    return data.items;
  } catch {
    // 错误已经由 request 统一处理了 (ElMessage)，这里只需要返回空数组保证前端不崩
    return [];
  }
};

export const fetchLetter = async (): Promise<TLetterecord[]> => {
  const path = "/letter/records";
  try {
    const data = await request<ApiResponse<TLetterecord>>(path, {
      retries: 3, // 失败重试 3 次
      timeout: 10000, // 10s 超时
    });
    return data.items;
  } catch {
    // 错误已经由 request 统一处理了 (ElMessage)，这里只需要返回空数组保证前端不崩
    return [];
  }
};

export const fetchPhrase = async (): Promise<PhraseListRecord[]> => {
  const path = "/phrase/records";
  try {
    const data = await request<ApiResponse<PhraseListRecord>>(path, {
      retries: 3, // 失败重试 3 次
      timeout: 10000, // 10s 超时
    });
    return data.items;
  } catch {
    // 错误已经由 request 统一处理了 (ElMessage)，这里只需要返回空数组保证前端不崩
    return [];
  }
};

/**
 * 根据 qas 参数获取多题目线索
 * @param qas 例如 "1,2,3"
 */
export const fetchMultiQuestClue = async (qas: string): Promise<MultiQuestClueRecord | null> => {
  const path = `/multi_quest_clues/records?filter=(qas='${qas}')`;
  try {
    const data = await request<ApiResponse<MultiQuestClueRecord>>(path, {
      retries: 3,
      timeout: 10000,
    });
    return data.items.length > 0 ? data.items[0] : null;
  } catch {
    return null;
  }
};

/**
 * 获取实时通知列表
 */
export const fetchNotifications = async (user?: string): Promise<NotificationRecord[]> => {
  const filterParams = ["(enabled=true)"];
  if (user) {
    filterParams.push(`(user='${user}')`);
  }
  const filterStr = encodeURIComponent(filterParams.join("&&"));
  const path = `/notifications/records?filter=${filterStr}&sort=-created`;
  try {
    const data = await request<ApiResponse<NotificationRecord>>(path, {
      timeout: 5000,
    });
    return data.items;
  } catch {
    return [];
  }
};
