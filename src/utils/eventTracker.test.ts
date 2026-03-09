/**
 * 事件追踪系统 - 简单测试
 *
 * 此文件用于快速验证事件追踪系统的基本功能
 * 在实际项目中不需要提交测试代码
 */

import { tracker, EventType, initTracker, getDebugFromQuery } from "./eventTracker";

// ============================================
// 测试 1: 基本功能测试
// ============================================

function testBasicFeatures() {
  console.log("=== 测试 1: 基本功能 ===\n");

  // 测试页面访问
  tracker.trackPageVisit("测试页面", { test: "basic" }, "测试用户");

  // 测试题目访问
  tracker.trackQuestionVisit(1, "测试题目 1", false, "测试用户");

  // 测试 MagicScroll
  tracker.trackMagicScrollOpen("测试密卷", "这是测试内容", "测试用户");

  // 测试线索弹窗
  tracker.trackClueModalOpen("测试线索", "clue-test-001", "测试用户");

  console.log("✓ 基本功能测试完成\n");
}

// ============================================
// 测试 2: 导航事件测试
// ============================================

function testNavigationEvents() {
  console.log("=== 测试 2: 导航事件 ===\n");

  // 测试链接点击
  tracker.trackLinkClick("https://example.com", "测试链接", "测试用户");

  // 测试路由跳转
  tracker.trackRouteNavigate("/test/page", { id: 123 }, "source-page", "测试用户");

  console.log("✓ 导航事件测试完成\n");
}

// ============================================
// 测试 3: 答题事件测试
// ============================================

function testAnswerEvents() {
  console.log("=== 测试 3: 答题事件 ===\n");

  // 测试正确答案
  tracker.trackAnswerSubmit(1, "正确答案", true, "测试用户");

  // 测试错误答案
  tracker.trackAnswerSubmit(2, "错误答案", false, "测试用户");

  console.log("✓ 答题事件测试完成\n");
}

// ============================================
// 测试 4: 媒体事件测试
// ============================================

function testMediaEvents() {
  console.log("=== 测试 4: 媒体事件 ===\n");

  // 测试视频播放
  tracker.trackMediaPlay("video", "https://video.mp4", "测试视频", "测试用户");

  // 测试图片预览
  tracker.trackMediaPlay("image", "https://image.jpg", "测试图片", "测试用户");

  // 测试音频播放
  tracker.trackMediaPlay("audio", "https://audio.mp3", "测试音频", "测试用户");

  console.log("✓ 媒体事件测试完成\n");
}

// ============================================
// 测试 5: 自定义事件测试
// ============================================

function testCustomEvents() {
  console.log("=== 测试 5: 自定义事件 ===\n");

  // 测试简单自定义事件
  tracker.trackCustomAction("按钮点击", "用户点击了测试按钮", { buttonId: "test-btn" }, "测试用户");

  // 测试复杂自定义事件
  tracker.trackCustomAction(
    "复杂操作",
    "这是一个复杂的用户操作",
    {
      operation: "complex-op",
      data: { a: 1, b: 2 },
      result: "success",
    },
    "测试用户",
  );

  console.log("✓ 自定义事件测试完成\n");
}

// ============================================
// 测试 6: 通用 track 方法测试
// ============================================

function testGenericTrack() {
  console.log("=== 测试 6: 通用 track 方法 ===\n");

  // 使用通用 track 方法
  tracker.track(
    {
      type: EventType.CUSTOM_ACTION,
      title: "通用测试",
      content: "使用通用 track 方法",
      extra: {
        method: "generic",
        timestamp: Date.now(),
      },
    },
    "测试用户",
  );

  console.log("✓ 通用 track 方法测试完成\n");
}

// ============================================
// 测试 7: 调试模式测试
// ============================================

function testDebugMode() {
  console.log("=== 测试 7: 调试模式 ===\n");

  const debug = getDebugFromQuery();
  console.log(`当前调试模式：${debug ? "开启" : "关闭"}`);

  // 创建自定义追踪器（强制开启调试模式）
  const debugTracker = initTracker({
    apiUrl: "https://api.example.com/track",
    userName: "调试用户",
  });

  debugTracker.trackPageVisit("调试页面", { debug: true });

  console.log("✓ 调试模式测试完成\n");
}

// ============================================
// 测试 8: 性能测试
// ============================================

function testPerformance() {
  console.log("=== 测试 8: 性能测试 ===\n");

  const startTime = performance.now();

  // 连续发送 100 个事件
  for (let i = 0; i < 100; i++) {
    tracker.trackCustomAction("性能测试", `事件 #${i}`, { index: i }, "测试用户");
  }

  const endTime = performance.now();
  const duration = endTime - startTime;

  console.log(`发送 100 个事件耗时：${duration.toFixed(2)}ms`);
  console.log(`平均每个事件：${(duration / 100).toFixed(2)}ms`);
  console.log("✓ 性能测试完成\n");
}

// ============================================
// 测试 9: 错误处理测试
// ============================================

function testErrorHandling() {
  console.log("=== 测试 9: 错误处理 ===\n");

  // 测试空数据
  tracker.track(
    {
      type: EventType.CUSTOM_ACTION,
      title: "",
      content: "",
      extra: {},
    },
    "",
  );

  // 测试 undefined
  tracker.track(undefined as any, undefined as any);

  // 测试 null
  tracker.track(null as any, null as any);

  console.log("✓ 错误处理测试完成（没有抛出异常）\n");
}

// ============================================
// 测试 10: 组合场景测试
// ============================================

function testCombinedScenarios() {
  console.log("=== 测试 10: 组合场景 ===\n");

  // 模拟完整的游戏流程
  const gameFlow = async () => {
    // 1. 页面加载
    tracker.trackPageVisit("游戏页面", { gameId: 123 }, "玩家 A");

    // 2. 开始关卡
    tracker.trackQuestionVisit(1, "第一关", false, "玩家 A");

    // 3. 提交答案
    tracker.trackAnswerSubmit(1, "answer123", true, "玩家 A");

    // 4. 查看线索
    tracker.trackClueModalOpen("神秘线索", "clue-001", "玩家 A");

    // 5. 观看视频
    tracker.trackMediaPlay("video", "https://video.mp4", "通关动画", "玩家 A");

    // 6. 跳转下一关
    tracker.trackRouteNavigate("/question/2", { level: 2 }, "question/1", "玩家 A");

    console.log("✓ 组合场景测试完成\n");
  };

  gameFlow();
}

// ============================================
// 运行所有测试
// ============================================

export function runAllTests() {
  console.log("\n========================================");
  console.log("   事件追踪系统 - 测试套件");
  console.log("========================================\n");

  testBasicFeatures();
  testNavigationEvents();
  testAnswerEvents();
  testMediaEvents();
  testCustomEvents();
  testGenericTrack();
  testDebugMode();
  testPerformance();
  testErrorHandling();
  testCombinedScenarios();

  console.log("========================================");
  console.log("   ✅ 所有测试完成！");
  console.log("========================================\n");
}

// 如果在浏览器环境中，可以直接运行
if (typeof window !== "undefined") {
  console.log("事件追踪系统测试已加载，调用 runAllTests() 开始测试");
}
