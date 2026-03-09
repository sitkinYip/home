# 弹窗事件去重功能说明

## 🎯 功能概述

**问题：** 弹窗（如 MagicScroll、线索弹窗等）在同一页面内多次打开相同内容时，会源源不断地发送上报通知，导致：

- 控制台非常吵闹
- 服务器收到大量重复数据
- 网络资源浪费

**解决方案：** 为弹窗打开事件添加 **once 缓存机制**，相同内容的弹窗在当前页面会话内只上报一次，刷新页面后才重置。

---

## ✨ 功能特性

### 1. 当前页面会话去重

```javascript
// 第 1 次打开
tracker.trackMagicScrollOpen("摘星州街头的初遇");
✅ 上报：神谕密卷 | 摘星州街头的初遇

// 第 2 次打开（相同内容）
tracker.trackMagicScrollOpen("摘星州街头的初遇");
⚠️ 跳过上报（已缓存）

// 第 3 次打开（不同内容）
tracker.trackMagicScrollOpen("神秘的古籍");
✅ 上报：神谕密卷 | 神秘的古籍
```

### 2. 页面刷新后重置

```javascript
// 页面 A
tracker.trackMagicScrollOpen("摘星州街头的初遇");
✅ 上报

// 刷新页面
window.location.reload();

// 页面 A（刷新后）
tracker.trackMagicScrollOpen("摘星州街头的初遇");
✅ 重新上报（缓存已清空）
```

### 3. 自动识别不同弹窗

```javascript
// MagicScroll
tracker.trackMagicScrollOpen("摘星州街头的初遇");
✅ 上报：神谕密卷

// ClueModal（相同标题）
tracker.trackClueModalOpen("摘星州街头的初遇");
✅ 上报：隐藏的线索（不同类型，分别记录）
```

---

## 🔧 技术实现

### 核心机制

**1. 使用 Set 记录已上报的弹窗事件**

```typescript
class EventTracker {
  // 用于记录已上报的弹窗事件（当前页面会话内去重）
  private reportedModalEvents: Set<string> = new Set();
}
```

**2. 生成唯一 Key**

```typescript
private shouldReportModalEvent(
  eventType: EventType,
  title: string,
  content?: string
): boolean {
  // 生成唯一 key：类型 + 标题 + 内容
  const key = `${eventType}:${title}:${content || ''}`;

  if (this.reportedModalEvents.has(key)) {
    return false; // 已上报，跳过
  }

  this.reportedModalEvents.add(key); // 记录为已上报
  return true; // 需要上报
}
```

**3. 在弹窗方法中调用去重检查**

```typescript
trackMagicScrollOpen(title: string, content?: string, userName?: string): void {
  // 去重检查
  if (!this.shouldReportModalEvent(EventType.MAGIC_SCROLL_OPEN, "神谕密卷", title)) {
    return; // 已上报，跳过
  }

  this.track({
    type: EventType.MAGIC_SCROLL_OPEN,
    title: "神谕密卷",
    content: title,
    extra: { hasContent: !!content },
  }, userName);
}
```

---

## 📊 去重逻辑详解

### Key 生成规则

```typescript
const key = `${eventType}:${title}:${content || ""}`;

// 示例 1：MagicScroll - 摘星州
key = "magic_scroll_open:神谕密卷：摘星州街头的初遇";

// 示例 2：ClueModal - 摘星州
key = "clue_modal_open:隐藏的线索：摘星州街头的初遇";

// 示例 3：MagicScroll - 无内容
key = "magic_scroll_open:神谕密卷：";
```

### 去重判断流程

```
用户打开弹窗
   ↓
生成唯一 Key
   ↓
检查 Set 中是否存在
   ├─ 存在 → return false (跳过上报)
   └─ 不存在 → add(key) → return true (上报)
   ↓
上报事件
```

### 缓存重置时机

```typescript
// 1. 页面刷新时自动重置（Set 被销毁）
window.location.reload();
// → 新的 EventTracker 实例，空的 reportedModalEvents

// 2. 手动重置（可选）
tracker.resetModalEvents();
// → 清空所有缓存
```

---

## 🎯 支持的弹窗类型

### 1. MagicScroll（神谕密卷）

```typescript
// 使用示例
tracker.trackMagicScrollOpen("摘星州街头的初遇", content, userName);

// 去重效果
第 1 次：✅ 上报
第 2 次：⚠️ 跳过（相同标题）
不同标题：✅ 上报
```

### 2. ClueModal（隐藏的线索）

```typescript
// 使用示例
tracker.trackClueModalOpen("神秘符号", contentId, userName);

// 去重效果
第 1 次：✅ 上报
第 2 次：⚠️ 跳过（相同标题）
不同标题：✅ 上报
```

### 3. 其他弹窗（可扩展）

如需为其他弹窗添加去重，只需在对应方法中添加：

```typescript
trackCustomModalOpen(title: string, userName?: string): void {
  if (!this.shouldReportModalEvent(EventType.CUSTOM_MODAL, "自定义弹窗", title)) {
    return;
  }

  this.track({...}, userName);
}
```

---

## 🧪 测试场景

### 场景 1：重复打开相同弹窗

```javascript
// 测试代码
tracker.trackMagicScrollOpen("测试标题");
tracker.trackMagicScrollOpen("测试标题");
tracker.trackMagicScrollOpen("测试标题");

// 预期结果（调试模式）
✅ ⚡ EVENT │ 14:30:25 │ 神谕密卷
   📝 测试标题
   └─ 来自 sitkin.top/旅行者

⚠️ （后两次调用无输出，已去重）
```

### 场景 2：打开不同弹窗

```javascript
// 测试代码
tracker.trackMagicScrollOpen("标题 A");
tracker.trackMagicScrollOpen("标题 B");
tracker.trackClueModalOpen("标题 A");

// 预期结果
✅ ⚡ EVENT │ 14:30:25 │ 神谕密卷
   📝 标题 A

✅ ⚡ EVENT │ 14:30:26 │ 神谕密卷
   📝 标题 B

✅ ⚡ EVENT │ 14:30:27 │ 隐藏的线索
   📝 标题 A
```

### 场景 3：页面刷新后

```javascript
// 页面加载
tracker.trackMagicScrollOpen("测试标题");
✅ 上报

// 刷新页面
location.reload();

// 页面重新加载后
tracker.trackMagicScrollOpen("测试标题");
✅ 重新上报（缓存已清空）
```

---

## ⚠️ 注意事项

### 1. 仅在当前页面会话有效

```javascript
// 页面 A
tracker.trackMagicScrollOpen("测试");
✅ 上报

// 打开新标签页（页面 B）
tracker.trackMagicScrollOpen("测试");
✅ 上报（不同的 EventTracker 实例）
```

### 2. 不影响其他事件类型

```javascript
// 弹窗去重仅适用于弹窗打开事件
tracker.trackMagicScrollOpen("测试"); // 去重
tracker.trackClueModalOpen("测试"); // 去重

// 其他事件不受影响
tracker.trackPageVisit("首页"); // 每次都上报
tracker.trackAnswerSubmit(1, "答案", true); // 每次都上报
```

### 3. 调试模式也去重

```javascript
// 调试模式 (?debug=1)
tracker.trackMagicScrollOpen("测试");
✅ 打印第 1 次

tracker.trackMagicScrollOpen("测试");
⚠️ 第 2 次不打印（已去重）
```

---

## 🔧 扩展功能

### 手动重置缓存

```typescript
// 场景：需要在特定时刻清空缓存
tracker.resetModalEvents();

// 示例：关卡切换时
const handleLevelChange = () => {
  tracker.resetModalEvents(); // 清空弹窗缓存
  // ... 其他逻辑
};
```

### 查看已上报的弹窗

```typescript
// 添加调试方法（可选）
getReportedModals(): string[] {
  return Array.from(this.reportedModalEvents);
}

// 使用
console.log(tracker.getReportedModals());
// 输出：["magic_scroll_open:神谕密卷：标题 A", ...]
```

---

## 📊 性能优化

### 内存占用

```typescript
// Set 存储的是字符串 Key，内存占用极小
// 每个 Key 约 50-100 字节
// 即使上报 100 个不同弹窗，也仅占用 ~10KB
```

### 查找效率

```typescript
// Set.has() 的时间复杂度为 O(1)
// 即使有上千条记录，查找速度也接近瞬间
```

---

## 🎉 总结

通过为弹窗事件添加 **once 缓存机制**，我们实现了：

- ✅ **去噪** - 相同弹窗只上报一次，控制台不再吵闹
- ✅ **省流** - 减少不必要的网络请求
- ✅ **准确** - 数据更清晰，避免重复统计
- ✅ **智能** - 自动识别不同弹窗，分别记录
- ✅ **灵活** - 页面刷新后自动重置，不影响下次访问

现在弹窗上报既优雅又高效！🎉

---

**实现时间**: 2026-03-09  
**版本**: v1.5.0 - Modal Deduplication  
**状态**: ✅ 已实现并测试
