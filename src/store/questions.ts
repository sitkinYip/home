import { defineStore } from "pinia";
import { fetchLevels, fetchMultiQuestClue } from "@/server/qa";
import { LevelRecord, MultiQuestClueRecord } from "@/types/qa";

interface QuestionsState {
  allLevels: LevelRecord[];
  qaInfo: LevelRecord | null;
  userName: string;
  isLost: boolean;
  hasFirstStep: boolean;
  /** 多题模式下按 step 索引的关卡数据 */
  multiLevels: LevelRecord[];
  /** 多题模式专属线索 */
  multiQuestClue: MultiQuestClueRecord | null;
}

export const useQuestionsStore = defineStore("questions", {
  state: (): QuestionsState => ({
    allLevels: [],
    qaInfo: null,
    userName: "旅行者",
    isLost: false,
    hasFirstStep: false,
    multiLevels: [],
    multiQuestClue: null,
  }),
  getters: {
    currentUserDisplay: (state) => state.userName,
    currentStep: (state) => state.qaInfo?.step || 1,
  },
  actions: {
    async initData(currentStep: number, userId: string = "") {
      try {
        const levels = await fetchLevels();
        this.allLevels = levels;

        // 检查是否存在第1关，传给 Lost 组件
        this.hasFirstStep = levels.some((l) => l.step === 1);

        const currentLevel = levels.find((l) => l.step === currentStep);

        if (currentLevel) {
          this.qaInfo = currentLevel;
          this.userName = this.qaInfo.userName || "旅行者";
          this.isLost = false;

          // 检查本地持久化进度
          this.checkPersistentProgress(currentStep, userId);
        } else {
          // 找不到关卡时进入迷失状态
          this.qaInfo = null;
          this.isLost = true;
        }
      } catch (error) {
        // 接口报错也进入迷失状态
        this.isLost = true;
        console.error("召唤咒语失败", error);
      }
    },

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    checkPersistentProgress(currentStep: number, userId: string) {
      // This relies on the cacheKey logic which was previously computed in the component.
      // We might need to handle this differently or return data to the component to handle UI updates.
      // For now, let's just leave the state update logic here if possible,
      // OR, the component can still handle the visual restoration (like userInput) based on store data.
      // Actually, the component used `checkPersistentProgress` to set `isBinGo` and `userInput`.
      // Since `userInput` and `isBinGo` are UI states that might be better kept in the component
      // (unless we want them global too), we can expose a helper or just return data from init.
      // However, the request was to put initData in the store.
      // Let's keep specific UI state (like input value) in the component for now,
      // but the "bingo" state might be useful in the store or at least accessible.
      // Let's defer the actual restoration of `userInput` and `isBinGo` to the component
      // by providing a getter or action to retrieve the cached data.
    },

    getCacheKey(currentStep: number, userId: string) {
      return `qaIndex${currentStep}${userId}${this.qaInfo?.updated || ""}`;
    },

    getCachedProgress(currentStep: number, userId: string) {
      const key = this.getCacheKey(currentStep, userId);
      return JSON.parse(localStorage.getItem(key) || "{}");
    },

    /**
     * 多题模式初始化：加载所有关卡数据并筛选出指定 steps 的关卡
     * @param steps 需要展示的关卡步骤数组，如 [1, 2, 3, 4]
     */
    async initMultiData(steps: number[]) {
      try {
        const levels = await fetchLevels();
        this.allLevels = levels;
        this.hasFirstStep = levels.some((l) => l.step === 1);

        // 按 steps 顺序筛选关卡
        const matched: LevelRecord[] = [];
        for (const step of steps) {
          const level = levels.find((l) => l.step === step);
          if (level) {
            matched.push(level);
          }
        }

        this.multiLevels = matched;

        if (matched.length === 0) {
          this.isLost = true;
        } else {
          this.isLost = false;
        }

        // 尝试获取多题线索
        const qasStr = steps.join(",");
        try {
          this.multiQuestClue = await fetchMultiQuestClue(qasStr);
        } catch (clueErr) {
          console.error("获取多题线索失败", clueErr);
        }
      } catch (error) {
        this.isLost = true;
        console.error("多题模式召唤咒语失败", error);
      }
    },
  },
});
