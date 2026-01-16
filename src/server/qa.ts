import { LevelRecord, ApiResponse, TLetterecord, PhraseListRecord } from "@/types/qa";
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
