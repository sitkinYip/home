# 事件追踪系统重构总结

## 📋 重构概述

将原有的硬编码上报逻辑抽离成统一、可复用、类型安全的事件追踪系统。

## 🎯 重构目标

1. ✅ **统一上报接口** - 提供一致的 API 风格
2. ✅ **类型安全** - 完整的 TypeScript 类型支持
3. ✅ **错误处理** - 所有错误不影响业务流程
4. ✅ **易于扩展** - 方便添加新的事件类型和追踪点
5. ✅ **调试友好** - 支持调试模式，方便开发和排查问题

## 📦 新增文件

### 1. `src/utils/eventTracker.ts`

核心追踪器实现，包含：

- `EventType` 枚举 - 定义所有事件类型
- `EventData` 接口 - 事件数据结构
- `EventTracker` 类 - 追踪器主类
- `tracker` 单例 - 默认导出的实例
- 快捷方法 - 简化常用场景的调用

### 2. `src/utils/EVENT_TRACKER_USAGE.md`

详细的使用文档，包含：

- API 说明
- 使用示例
- 最佳实践
- 常见问题

### 3. `src/utils/eventTracker.examples.ts`

丰富的代码示例，展示：

- 各种使用场景
- 组合用法
- 最佳实践模式

## 🔧 修改的文件

### 1. `src/page/Questions/QuestPage.vue`

**改动点：**

- 导入 `tracker`
- 创建 `userName` computed 属性
- 重构 `reportAction` 为 deprecated 方法（内部使用 tracker）
- 在 `handleVictoryClose` 中添加路由跳转追踪
- **修复：移除重复的答题事件上报，改为在 penalty hooks 和 handleSuccess 中统一上报**

**追踪的事件：**

```typescript
// 题目访问
tracker.trackQuestionVisit(step, title, false, userName);

// 答题提交（正确答案）
tracker.trackAnswerSubmit(step, answer, true, userName);

// 路由跳转
tracker.trackRouteNavigate(path, query, from, userName);

// 外部链接
tracker.trackLinkClick(url, description, userName);
```

### 2. `src/page/Questions/index.vue`

**改动点：**

- 导入 `tracker`
- 添加 `trackPageVisit` 方法
- 在 `onMounted` 中调用页面访问追踪
- **修复：移除多题模式下遍历所有单题的上报，只报一次多题模式访问**

**追踪的事件：**

```typescript
// 页面访问（单题/多题模式）
tracker.trackPageVisit(mode, extra, userName);
```

### 3. `src/page/Questions/components/MagicScroll.vue`

**改动点：**

- 导入 `tracker`
- 在 `show` 方法中添加 MagicScroll 打开事件追踪

**追踪的事件：**

```typescript
tracker.trackMagicScrollOpen(title, content, userName);
```

### 4. `src/page/Questions/components/MultiQuestClueModal.vue`

**改动点：**

- 导入 `tracker`
- 添加 `clueTitle` computed 属性
- 在 `show` 方法中添加线索弹窗打开事件追踪

**追踪的事件：**

```typescript
tracker.trackClueModalOpen(title, contentId, userName);
```

### 5. `src/page/Questions/composables/usePenalty.ts`

**改动点：**

- 导入 `tracker`
- 在 `handleWrongHelper` 中添加错误答案事件追踪
- 在 `handleWrongWithoutPenalty` 中添加错误答案事件追踪
- **修复：统一在此处上报错误答案，避免重复上报**

**追踪的事件：**

```typescript
tracker.trackAnswerSubmit(step, answer, false, userName);
```

### 6. `src/page/Questions/composables/useAnswerCheck.ts`

**追踪的事件：**

```typescript
// 通过 reportAction 回调上报正确答案
reportAction(`答对了第${step}题，答案是${answer}`, "成功通知");
```

## 📊 追踪的事件类型

| 事件类型            | 快捷方法                 | 调用位置                       |
| ------------------- | ------------------------ | ------------------------------ |
| `PAGE_VISIT`        | `trackPageVisit()`       | index.vue (页面加载)           |
| `QUESTION_VISIT`    | `trackQuestionVisit()`   | QuestPage.vue                  |
| `MAGIC_SCROLL_OPEN` | `trackMagicScrollOpen()` | MagicScroll.vue                |
| `CLUE_MODAL_OPEN`   | `trackClueModalOpen()`   | MultiQuestClueModal.vue        |
| `LINK_CLICK`        | `trackLinkClick()`       | useArtifacts.ts, QuestPage.vue |
| `ROUTE_NAVIGATE`    | `trackRouteNavigate()`   | QuestPage.vue                  |
| `ANSWER_SUBMIT`     | `trackAnswerSubmit()`    | QuestPage.vue, usePenalty.ts   |
| `MEDIA_PLAY`        | `trackMediaPlay()`       | useArtifacts.ts                |
| `CUSTOM_ACTION`     | `trackCustomAction()`    | 通用（兼容旧代码）             |

## 🎨 使用示例

### 基础用法

```typescript
import { tracker } from "@/utils/eventTracker";

// 简单的上报
tracker.trackPageVisit("首页", { from: "google" }, "用户名");

// 答题事件
tracker.trackAnswerSubmit(1, "用户答案", true, "用户名");

// 自定义事件
tracker.trackCustomAction("按钮点击", "描述", { extra: "data" }, "用户名");
```

### 在组件中使用

```typescript
// QuestPage.vue
const userName = computed(() => activeQaInfo.value?.userName || "旅行者");

// 题目加载时
tracker.trackQuestionVisit(
  currentStep,
  questionsStore.qaInfo.title || "未知题目",
  false,
  userName.value,
);

// 答题时
tracker.trackAnswerSubmit(currentStep, ans, isCorrect, userName.value);
```

## 🔍 调试

### 开启调试模式

访问 URL 添加 `?debug=1` 参数：

```
https://your-app.com/?debug=1
```

### 查看日志

调试模式下会在控制台输出事件信息：

```bash
[EventTracker] 第 1 题 | 第一关：神秘的开始 | step=1&isMultiMode=false -- 来自sitkin.top/旅行者
```

## ✨ 优势

### 1. **代码更简洁**

```typescript
// ❌ 之前（冗长且重复）
const reportAction = (content: string, title: string) => {
  const nickName = activeQaInfo.value?.userName || "旅行者";
  if (isDebug) return console.log(`报告：${title} -- 来自sitkin.top/${nickName}${content}`);
  fetch(
    `https://api.chuckfang.com/4acc3779/${title} -- 来自sitkin.top/${nickName}${content}`,
  ).catch((e) => console.error("Report failed", e));
};

// ✅ 现在（简洁优雅）
tracker.trackAnswerSubmit(step, answer, isCorrect, userName);
```

### 2. **类型安全**

```typescript
// ✅ TypeScript 完整类型支持
tracker.track({
  type: EventType.ANSWER_CORRECT, // ✅ 自动补全
  title: "回答正确",
  extra: { step: 1 }, // ✅ 类型检查
});
```

### 3. **错误处理**

```typescript
// ✅ 内置错误处理，不需要 try-catch
tracker.trackPageVisit("页面"); // 失败也不会影响流程
```

### 4. **易于扩展**

```typescript
// ✅ 轻松添加新的事件类型
export enum EventType {
  NEW_EVENT = "new_event",
}

tracker.track({
  type: EventType.NEW_EVENT,
  title: "新事件",
  content: "内容",
});
```

### 5. **调试友好**

```typescript
// ✅ 调试模式下自动输出到控制台
// ✅ 生产模式下静默发送
// ✅ 不影响业务逻辑
```

## 🚀 下一步计划

### 可以继续扩展的功能

1. **批量上报**

   ```typescript
   tracker.batch().trackPageVisit("A").trackCustomAction("B").flush();
   ```

2. **用户标识管理**

   ```typescript
   tracker.setUserId("user-123");
   tracker.setUserProperties({ name: "John", level: 5 });
   ```

3. **会话追踪**

   ```typescript
   tracker.startSession();
   tracker.endSession();
   tracker.getSessionId(); // 'session-abc'
   ```

4. **性能监控**

   ```typescript
   tracker.measure("api-call", () => fetchData());
   // 自动上报耗时
   ```

5. **A/B 测试支持**
   ```typescript
   tracker.trackExperiment('feature-a', variant: 'control');
   ```

## 📝 注意事项

1. ⚠️ **不要传递敏感信息**

   ```typescript
   // ❌ 错误示范
   tracker.trackCustomAction("登录", "", { password: "123456" });

   // ✅ 正确示范
   tracker.trackCustomAction("登录", "", { userId: "user123", success: true });
   ```

2. ⚠️ **避免过度上报**

   ```typescript
   // ❌ 不要在每次鼠标移动都上报
   document.onmousemove = () => tracker.track(...);

   // ✅ 只在关键节点上报
   button.onclick = () => tracker.track(...);
   ```

3. ⚠️ **保持数据精简**

   ```typescript
   // ❌ 避免过大的 extra 对象
   tracker.track("event", { hugeData: bigObject });

   // ✅ 只传递必要的字段
   tracker.track("event", { id: 123, status: "success" });
   ```

## 🎉 总结

这次重构将原本分散、重复的上报逻辑统一成一个优雅、易用的事件追踪系统：

- ✅ **开发体验提升** - 简洁的 API，完整的类型提示
- ✅ **代码质量提升** - 类型安全，错误处理完善
- ✅ **可维护性提升** - 统一管理，易于扩展
- ✅ **调试效率提升** - 调试模式，日志清晰
- ✅ **性能优化** - 使用 sendBeacon，异步非阻塞

现在你可以在项目的任何地方轻松添加事件追踪，而无需担心错误处理和代码重复！🚀

---

**重构完成时间**: 2026-03-09  
**重构者**: AI Assistant  
**版本**: v1.0.0
