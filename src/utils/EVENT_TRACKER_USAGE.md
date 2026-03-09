# 事件追踪系统使用指南

## 概述

事件追踪系统（Event Tracker）是一个统一的用户行为上报工具，用于在应用的关键节点追踪用户行为。

## 特性

- ✅ **类型安全**：完整的 TypeScript 类型定义
- ✅ **优雅降级**：优先使用 `sendBeacon`，自动 fallback 到 `fetch`
- ✅ **错误处理**：所有错误都已内部处理，不会影响业务流程
- ✅ **调试模式**：支持通过 `?debug=1` URL 参数开启调试日志
- ✅ **快捷方法**：提供丰富的快捷方法，简化调用

## 基本用法

### 1. 导入 tracker

```typescript
import { tracker } from "@/utils/eventTracker";
```

### 2. 使用快捷方法

```typescript
// 页面访问
tracker.trackPageVisit("首页", { from: "google" }, "用户名");

// 题目访问
tracker.trackQuestionVisit(1, "第一关：神秘的开始", false, "用户名");

// MagicScroll 打开
tracker.trackMagicScrollOpen("神谕密卷", "这是密卷内容", "用户名");

// 线索弹窗打开
tracker.trackClueModalOpen("隐藏的线索", "clue-id-123", "用户名");

// 链接点击
tracker.trackLinkClick("https://example.com", "点击查看", "用户名");

// 路由跳转
tracker.trackRouteNavigate("/home", { id: 123 }, "previous-page", "用户名");

// 答题提交
tracker.trackAnswerSubmit(1, "用户输入的答案", true, "用户名");

// 媒体播放
tracker.trackMediaPlay("video", "https://video.mp4", "开场视频", "用户名");

// 自定义事件
tracker.trackCustomAction("用户点击了特殊按钮", "详细描述", { extra: "data" }, "用户名");
```

### 3. 使用通用 track 方法

```typescript
import { EventType } from "@/utils/eventTracker";

tracker.track(
  {
    type: EventType.CUSTOM_ACTION,
    title: "自定义事件",
    content: "事件内容",
    extra: {
      customField: "value",
    },
  },
  "用户名",
);
```

## 在 Questions 模块中的使用

### QuestPage.vue

```typescript
import { tracker } from "@/utils/eventTracker";

// 组件中直接使用
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

### MultiQuestClueModal.vue

```typescript
import { tracker } from "@/utils/eventTracker";

const show = () => {
  if (clueData.value) {
    visible.value = true;
    // 上报线索弹窗打开事件
    tracker.trackClueModalOpen(clueTitle.value, undefined, "旅行者");
  }
};
```

### MagicScroll.vue

```typescript
import { tracker } from "@/utils/eventTracker";

const show = (data: { title: string; content: string }) => {
  rawText.value = data.content;
  title.value = data.title;
  visible.value = true;

  // 上报 MagicScroll 打开事件
  tracker.trackMagicScrollOpen(data.title, data.content, "旅行者");
};
```

### index.vue（多题模式）

```typescript
import { tracker } from "@/utils/eventTracker";

// 页面访问追踪
const trackPageVisit = () => {
  if (isMultiMode) {
    tracker.trackPageVisit(
      "多题模式",
      { steps: multiSteps.join(","), count: multiSteps.length },
      "旅行者",
    );
  } else {
    const singleStep = getQueryParam("qa")?.[0] || "1";
    tracker.trackPageVisit("单题模式", { step: singleStep }, "旅行者");
  }
};

onMounted(() => {
  trackPageVisit();
  // ... 其他初始化逻辑
});
```

## 事件类型

| 事件类型                | 说明             | 快捷方法                         |
| ----------------------- | ---------------- | -------------------------------- |
| `PAGE_VISIT`            | 页面访问         | `trackPageVisit()`               |
| `QUESTION_VISIT`        | 题目访问         | `trackQuestionVisit()`           |
| `MULTI_QUESTION_VISIT`  | 多题模式访问     | `trackQuestionVisit(..., true)`  |
| `SINGLE_QUESTION_VISIT` | 单题模式访问     | `trackQuestionVisit(..., false)` |
| `MAGIC_SCROLL_OPEN`     | MagicScroll 打开 | `trackMagicScrollOpen()`         |
| `CLUE_MODAL_OPEN`       | 线索弹窗打开     | `trackClueModalOpen()`           |
| `LINK_CLICK`            | 链接点击         | `trackLinkClick()`               |
| `ROUTE_NAVIGATE`        | 路由跳转         | `trackRouteNavigate()`           |
| `ANSWER_SUBMIT`         | 答案提交         | `trackAnswerSubmit()`            |
| `ANSWER_CORRECT`        | 回答正确         | `trackAnswerSubmit(..., true)`   |
| `ANSWER_WRONG`          | 回答错误         | `trackAnswerSubmit(..., false)`  |
| `MEDIA_PLAY`            | 媒体播放         | `trackMediaPlay()`               |
| `CUSTOM_ACTION`         | 自定义事件       | `trackCustomAction()`            |

## 调试

### 开启调试模式

在 URL 中添加 `?debug=1` 参数：

```
https://your-app.com/?debug=1
```

### 查看日志

调试模式下，事件会**仅打印到控制台，不发送实际请求**，并使用**美观的渐变样式**输出：

```
⚡ EVENT  │ 14:30:25 │ 第 1 题
  📝 第一关：神秘的开始
  📋 step=1&isMultiMode=false
  └─ 来自sitkin.top/旅行者
```

**重要：**

- ✅ **仅控制台打印** - 不会发送网络请求
- ✅ **美化样式输出** - 渐变色 + emoji 图标
- ✅ **零网络开销** - 适合本地开发和调试
- ✅ **不影响流程** - 所有功能正常工作

**样式特点：**

- ⚡ **紫色渐变徽章** - 醒目的事件标识
- 🕐 **时间戳** - 精确的事件发生时间（24 小时制）
- 📝 **标题内容** - 紫色字体显示事件标题
- 📋 **参数信息** - 灰色斜体显示额外参数
- └─ **来源追踪** - 浅灰色显示用户来源

### 控制台效果示例

```plaintext
// 题目访问
⚡ EVENT  │ 14:30:25 │ 第 1 题
  📝 第一关：神秘的开始
  📋 step=1&isMultiMode=false
  └─ 来自sitkin.top/admin

// 答题正确
⚡ EVENT  │ 14:30:30 │ 回答正确
  📝 答案：password123
  📋 step=1&isCorrect=true
  └─ 来自sitkin.top/admin

// MagicScroll 打开
⚡ EVENT  │ 14:30:35 │ 神谕密卷
  📝 隐藏的线索
  📋 hasContent=true
  └─ 来自sitkin.top/旅行者

// 多题模式
⚡ EVENT  │ 14:31:00 │ 多题模式
  📋 steps=1,2,3&count=3
  └─ 来自sitkin.top/traveler
```

### 折叠式输出

默认使用 `console.groupCollapsed()`，保持控制台整洁：

- 🔽 **点击箭头** - 展开查看完整信息
- 📊 **分组清晰** - 每个事件独立分组
- 🎨 **视觉舒适** - 渐变色 + emoji 图标

## 错误处理

所有错误都已在内部处理：

- ✅ 网络错误不会抛出异常
- ✅ 上报失败不影响业务流程
- ✅ 自动降级（sendBeacon → fetch）
- ✅ 错误信息会输出到控制台（仅调试模式）

## 最佳实践

### 1. 在关键用户交互点埋点

```typescript
// 页面/组件加载时
onMounted(() => {
  tracker.trackPageVisit("页面名称", extraData);
});

// 用户操作时
const handleClick = () => {
  tracker.trackCustomAction("按钮点击", "描述了什么按钮");
  // ... 业务逻辑
};

// 操作完成时
const handleSubmit = async () => {
  await api.submit();
  tracker.trackCustomAction("表单提交成功", "用户完成了 XX 操作");
};
```

### 2. 提供足够的上下文信息

```typescript
// ❌ 信息不足
tracker.trackCustomAction('错误');

// ✅ 信息充足
tracker.trackCustomAction(
  'API 请求失败',
  '用户在提交表单时网络超时',
  {
    api: '/api/submit',
    userId: 123,
    formData: { ... }
  }
);
```

### 3. 使用合适的事件类型

```typescript
// ❌ 滥用自定义事件
tracker.trackCustomAction("页面加载");

// ✅ 使用专用事件类型
tracker.trackPageVisit("页面名称");
```

## API 配置

### 修改上报地址

```typescript
import { initTracker } from "@/utils/eventTracker";

const customTracker = initTracker({
  apiUrl: "https://your-api.com/track",
  userName: "当前用户",
});

customTracker.trackPageVisit("首页");
```

### 使用默认导出

```typescript
import { tracker } from "@/utils/eventTracker";

// 修改全局默认用户名
tracker.setDefaultUserName("新用户名");
```

## 注意事项

1. ⚠️ **不要阻塞业务逻辑等待上报**
   - 上报是异步的，不会阻塞主线程
2. ⚠️ **避免过度上报**
   - 只在关键节点上报，避免刷屏
3. ⚠️ **敏感信息脱敏**
   - 不要在 extra 中传递密码、token 等敏感信息
4. ⚠️ **保持简洁**
   - extra 数据尽量精简，避免过大

## 扩展

### 添加新的事件类型

```typescript
// utils/eventTracker.ts
export enum EventType {
  // ... 现有类型
  NEW_EVENT = 'new_event'
}

// 添加快捷方法
trackNewEvent(title: string, content?: string, userName?: string): void {
  this.track({
    type: EventType.NEW_EVENT,
    title,
    content,
  }, userName);
}
```

## 常见问题

### Q: 为什么上报没有生效？

A: 检查以下几点：

1. 是否在正确的时机调用
2. 是否开启了 `?debug=1` 查看日志
3. 网络请求是否被防火墙拦截
4. 浏览器是否支持 sendBeacon（不支持会自动降级）

### Q: 会影响性能吗？

A: 不会。上报是异步的，使用 sendBeacon API 即使在页面关闭时也能正常发送。

### Q: 如何测试上报？

A:

1. 添加 `?debug=1` 参数访问页面
2. 打开浏览器控制台查看日志
3. 检查日志中的事件信息是否符合预期

---

**最后更新**: 2026-03-09
**维护者**: Development Team
