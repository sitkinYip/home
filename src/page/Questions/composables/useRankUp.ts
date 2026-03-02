import { ref } from "vue";
import type { LevelRecord } from "@/types/qa";

/**
 * 解析后的等级信息
 */
export interface RankInfo {
  /** 原始 rank 字符串 */
  rank: string;
  /** 等级名称 */
  rankName: string;
  /** 是否为非数字等级（非数字优先级更高） */
  isSpecial: boolean;
  /** 数字等级值（非数字时为 Infinity） */
  numericValue: number;
}

/**
 * 解析单个 rank 字符串为 RankInfo
 */
const parseRank = (rank: string, rankName: string): RankInfo | null => {
  if (!rank || !rankName) return null;

  const trimmed = rank.trim();
  const parsed = Number(trimmed);
  const isNumeric = trimmed !== "" && !isNaN(parsed) && isFinite(parsed);

  if (isNumeric) {
    // 数字字符串：需要大于 1 才有效
    if (parsed <= 1) return null;
    return { rank: trimmed, rankName, isSpecial: false, numericValue: parsed };
  }

  // 非数字字符串：视作大于 1，优先级高于数字
  return { rank: trimmed, rankName, isSpecial: true, numericValue: Infinity };
};

/**
 * 从单个关卡提取等级信息
 */
const extractRankFromLevel = (level: LevelRecord): RankInfo | null => {
  if (!level.rank || !level.rankName) return null;
  return parseRank(level.rank, level.rankName);
};

/**
 * 从多个关卡中提取最高等级
 * 规则：
 * - 非数字字符串优先级高于数字字符串
 * - 多个非数字字符串取最后一个
 * - 多个数字字符串取最大值
 */
const extractHighestRank = (levels: LevelRecord[]): RankInfo | null => {
  const validRanks: RankInfo[] = [];

  for (const level of levels) {
    const rankInfo = extractRankFromLevel(level);
    if (rankInfo) {
      validRanks.push(rankInfo);
    }
  }

  if (validRanks.length === 0) return null;

  const specialRanks = validRanks.filter((r) => r.isSpecial);
  const numericRanks = validRanks.filter((r) => !r.isSpecial);

  // 非数字等级优先，取最后一个
  if (specialRanks.length > 0) {
    return specialRanks[specialRanks.length - 1];
  }

  // 数字等级取最大值
  if (numericRanks.length > 0) {
    return numericRanks.reduce((max, current) =>
      current.numericValue > max.numericValue ? current : max,
    );
  }

  return null;
};

/**
 * 生成本地缓存 key
 * 格式：rankUpShown_{userId}_{rank}
 */
const buildCacheKey = (userId: string, rank: string): string => {
  return `rankUpShown_${userId}_${rank}`;
};

/**
 * 检查该等级是否已经展示过升级动画
 */
const hasShownRankUp = (userId: string, rank: string): boolean => {
  const key = buildCacheKey(userId, rank);
  return localStorage.getItem(key) === "1";
};

/**
 * 标记该等级的升级动画已展示
 */
const markRankUpShown = (userId: string, rank: string): void => {
  const key = buildCacheKey(userId, rank);
  localStorage.setItem(key, "1");
};

/**
 * 等级升级动画 Composable
 *
 * 负责：
 * 1. 从关卡数据中解析等级信息
 * 2. 判断是否需要展示升级动画（rank > 1 且未展示过）
 * 3. 提供触发和关闭动画的方法
 * 4. 展示后写入本地缓存，确保每个等级只展示一次
 */
export const useRankUp = (userId: string) => {
  const rankUpVisible = ref(false);
  const currentRankInfo = ref<RankInfo | null>(null);

  /**
   * 检查单题模式下是否需要展示升级动画
   * @param level 当前关卡数据
   * @returns 是否需要展示
   */
  const checkSingleLevel = (level: LevelRecord): boolean => {
    const rankInfo = extractRankFromLevel(level);
    if (!rankInfo) return false;
    if (hasShownRankUp(userId, rankInfo.rank)) return false;

    currentRankInfo.value = rankInfo;
    return true;
  };

  /**
   * 检查多题模式下是否需要展示升级动画
   * @param levels 多个关卡数据
   * @returns 是否需要展示
   */
  const checkMultiLevels = (levels: LevelRecord[]): boolean => {
    const rankInfo = extractHighestRank(levels);
    if (!rankInfo) return false;
    if (hasShownRankUp(userId, rankInfo.rank)) return false;

    currentRankInfo.value = rankInfo;
    return true;
  };

  /**
   * 触发升级动画展示，并标记为已展示
   */
  const showRankUp = () => {
    if (!currentRankInfo.value) return;
    markRankUpShown(userId, currentRankInfo.value.rank);
    rankUpVisible.value = true;
  };

  /**
   * 关闭升级动画
   */
  const dismissRankUp = () => {
    rankUpVisible.value = false;
  };

  return {
    rankUpVisible,
    currentRankInfo,
    checkSingleLevel,
    checkMultiLevels,
    showRankUp,
    dismissRankUp,
  };
};
