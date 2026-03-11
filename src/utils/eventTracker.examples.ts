/**
 * 事件追踪系统 - 使用示例
 *
 * 此文件展示了在项目中如何使用事件追踪系统的各种场景
 * 实际使用时请根据需要将代码复制到对应组件中
 */

import { tracker, EventType } from "@/utils/eventTracker";

// ============================================
// 场景 1: 页面/组件加载时的追踪
// ============================================

export function exampleOnMounted() {
  // 在 onMounted 或 onBeforeMount 中调用
  // tracker.trackPageVisit(页面名称，额外参数，用户名)

  tracker.trackPageVisit(
    "Questions 页面",
    {
      step: 1,
      userId: "user123",
      mode: "single", // 或 'multi'
    },
    "旅行者",
  );

  // 清除记忆工具页访问
  tracker.trackPageVisit(
    "记忆净化仪",
    {
      rawType: "qa",
      step: "1",
      user: "user123",
      rank: "",
    },
    "旅行者",
  );
}

// ============================================
// 场景 2: 用户交互行为追踪
// ============================================

export function exampleUserInteractions() {
  // 按钮点击
  const handleButtonClick = () => {
    tracker.trackCustomAction(
      "按钮点击",
      "用户点击了开始游戏按钮",
      { buttonId: "start-btn", page: "home" },
      "旅行者",
    );

    // ... 业务逻辑
  };

  // 表单提交
  const handleFormSubmit = async (formData: any) => {
    try {
      // await submitForm(formData); // 实际的提交逻辑
      tracker.trackCustomAction(
        "表单提交成功",
        "用户完成了信息提交",
        { formType: "feedback", userId: formData.userId },
        "旅行者",
      );
    } catch (error: any) {
      tracker.trackCustomAction(
        "表单提交失败",
        `错误：${error.message || "未知错误"}`,
        { formType: "feedback", errorCode: error.code },
        "旅行者",
      );
    }
  };
}

// ============================================
// 场景 3: 弹窗/模态框追踪
// ============================================

export function exampleModalTracking() {
  // 打开弹窗
  const openModal = () => {
    tracker.trackCustomAction(
      "弹窗打开",
      "设置弹窗",
      { modalType: "settings", from: "header" },
      "旅行者",
    );

    // ... 打开弹窗逻辑
  };

  // 关闭弹窗
  const closeModal = () => {
    tracker.trackCustomAction(
      "弹窗关闭",
      "设置弹窗",
      { modalType: "settings", action: "cancel" },
      "旅行者",
    );

    // ... 关闭弹窗逻辑
  };
}

// ============================================
// 场景 4: 媒体资源追踪
// ============================================

export function exampleMediaTracking() {
  // 视频播放
  const playVideo = (videoUrl: string, title: string) => {
    tracker.trackMediaPlay("video", videoUrl, title, "旅行者");
    // ... 播放逻辑
  };

  // 图片查看
  const viewImage = (imageUrl: string) => {
    tracker.trackMediaPlay("image", imageUrl, "线索图片", "旅行者");
    // ... 查看逻辑
  };

  // 音频播放
  const playAudio = (audioUrl: string, title: string) => {
    tracker.trackMediaPlay("audio", audioUrl, title, "旅行者");
    // ... 播放逻辑
  };
}

// ============================================
// 场景 5: 导航/路由追踪
// ============================================

export function exampleNavigationTracking() {
  // 内部路由跳转
  const navigateTo = (path: string, query?: Record<string, any>) => {
    tracker.trackRouteNavigate(path, query, "current-page", "旅行者");
    // ... 跳转逻辑
  };

  // 外部链接打开
  const openExternalLink = (url: string, linkText: string) => {
    tracker.trackLinkClick(url, linkText, "旅行者");
    window.open(url);
  };
}

// ============================================
// 场景 6: 游戏进度追踪
// ============================================

export function exampleGameProgressTracking() {
  // 关卡开始
  const startLevel = (levelId: number, levelName: string) => {
    tracker.trackCustomAction("关卡开始", levelName, { levelId, difficulty: "normal" }, "旅行者");
  };

  // 关卡完成
  const completeLevel = (levelId: number, score: number, timeSpent: number) => {
    tracker.trackCustomAction(
      "关卡完成",
      `第${levelId}关`,
      {
        levelId,
        score,
        timeSpent,
        stars: score > 90 ? 3 : score > 70 ? 2 : 1,
      },
      "旅行者",
    );
  };

  // 获得成就
  const unlockAchievement = (achievementId: string, achievementName: string) => {
    tracker.trackCustomAction(
      "成就解锁",
      achievementName,
      { achievementId, category: "exploration" },
      "旅行者",
    );
  };
}

// ============================================
// 场景 7: 错误/异常追踪
// ============================================

export function exampleErrorTracking() {
  // API 错误
  const handleApiError = (endpoint: string, error: any) => {
    tracker.trackCustomAction(
      "API 错误",
      `请求 ${endpoint} 失败`,
      {
        endpoint,
        errorCode: error.code,
        errorMessage: error.message,
        timestamp: Date.now(),
      },
      "旅行者",
    );
  };

  // 网络错误
  const handleNetworkError = (url: string, error: any) => {
    tracker.trackCustomAction(
      "网络错误",
      `网络请求失败：${url}`,
      {
        url,
        errorType: error.name,
        errorMessage: error.message,
      },
      "旅行者",
    );
  };
}

// ============================================
// 场景 8: 性能追踪
// ============================================

export function examplePerformanceTracking() {
  // 页面加载时间
  const trackPageLoadTime = (loadTime: number) => {
    tracker.trackCustomAction(
      "页面加载完成",
      `加载耗时：${loadTime}ms`,
      {
        loadTime,
        domContentLoaded: (performance as any).domContentLoadedEventEnd || 0,
        loadComplete: (performance as any).loadEventEnd || 0,
      },
      "旅行者",
    );
  };

  // 接口响应时间
  const trackApiResponseTime = (endpoint: string, responseTime: number) => {
    tracker.trackCustomAction(
      "API 响应",
      `${endpoint} - ${responseTime}ms`,
      { endpoint, responseTime },
      "旅行者",
    );
  };
}

// ============================================
// 场景 9: 用户行为分析
// ============================================

export function exampleUserBehaviorTracking() {
  // 功能使用频率
  const useFeature = (featureName: string, duration?: number) => {
    tracker.trackCustomAction(
      "功能使用",
      featureName,
      {
        feature: featureName,
        duration,
        timestamp: Date.now(),
      },
      "旅行者",
    );
  };

  // 用户停留时长
  const trackTimeSpent = (page: string, seconds: number) => {
    tracker.trackCustomAction(
      "页面停留",
      `${page} - ${seconds}秒`,
      { page, timeSpent: seconds },
      "旅行者",
    );
  };
}

// ============================================
// 场景 10: 组合使用示例
// ============================================

export function exampleCombinedUsage() {
  // 完整的游戏流程追踪
  const playGameFlow = async () => {
    // 1. 开始游戏
    tracker.trackPageVisit("游戏页面", { gameId: 123 }, "旅行者");

    // 2. 加载资源
    tracker.trackCustomAction("资源加载", "开始加载游戏资源", { resourceType: "all" }, "旅行者");

    // 3. 开始关卡
    tracker.trackQuestionVisit(1, "第一关：神秘的开始", false, "旅行者");

    // 4. 提交答案
    const answer = "player_answer";
    const isCorrect = true;
    tracker.trackAnswerSubmit(1, answer, isCorrect, "旅行者");

    if (isCorrect) {
      // 5. 答对了
      tracker.trackCustomAction("答题正确", "第一关通过", { score: 100 }, "旅行者");

      // 6. 查看线索
      tracker.trackClueModalOpen("神秘线索", "clue-001", "旅行者");

      // 7. 观看视频
      tracker.trackMediaPlay("video", "https://example.com/video.mp4", "通关动画", "旅行者");

      // 8. 进入下一关
      tracker.trackRouteNavigate("/question/2", { level: 2 }, "question/1", "旅行者");
    } else {
      // 9. 答错了
      tracker.trackCustomAction("答题错误", "第一关失败", { attempts: 1 }, "旅行者");
    }
  };
}

// ============================================
// 最佳实践提示
// ============================================

/*
1. ✅ 在关键节点埋点
   - 页面加载/卸载
   - 用户重要操作（提交、购买、分享等）
   - 功能使用开始/结束
   - 错误和异常

2. ✅ 提供足够的上下文
   - 使用 extra 参数传递相关信息
   - 包含时间戳、ID 等标识信息
   - 记录操作前后的状态

3. ✅ 避免过度追踪
   - 不要追踪每一个鼠标点击
   - 聚焦于有价值的用户行为
   - 考虑性能和数据量

4. ✅ 注意隐私和安全
   - 不要发送敏感信息（密码、token 等）
   - 对用户数据进行脱敏处理
   - 遵守相关法规（GDPR 等）

5. ✅ 错误处理
   - tracker 已内置错误处理
   - 不需要额外的 try-catch
   - 上报失败不会影响业务流程
*/
