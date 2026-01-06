import { LevelRecord, ApiResponse } from '@/types/qa';

const API_BASE = 'https://api.sitkin.top/api/collections/levels/records';

/**
 * 从服务端获取所有关卡信息
 * @returns 返回关卡数组
 */
export const fetchLevels = async (): Promise<LevelRecord[]> => {
    try {
        const response = await fetch(API_BASE);
        if (!response.ok) throw new Error('网络请求失败');
        const data: ApiResponse<LevelRecord> = await response.json();
        return data.items;
    } catch (error) {
        console.error('获取关卡数据失败:', error);
        return [];
    }
};
