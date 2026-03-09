# 调试模式行为说明

## 🎯 核心特性

### ✅ 调试模式 (`?debug=1`)

当 URL 包含 `?debug=1` 参数时，事件追踪系统进入**纯调试模式**：

```typescript
// 访问示例
http://localhost:5173/?debug=1
https://your-app.com/?debug=1
```

---

## 🔍 调试模式的行为

### 1. **仅控制台打印，不发送请求**

```typescript
// ✅ 会执行
console.groupCollapsed(/* 美化输出 */);

// ❌ 不会执行
fetch('https://api.chuckfang.com/4acc3779/...');
navigator.sendBeacon(...);
```

### 2. **完整的事件流程**

所有事件追踪的 API 调用都会正常执行，只是最终不发送网络请求：

```typescript
// 这些调用都会正常工作
tracker.trackPageVisit("测试页面", {}, "用户");
tracker.trackQuestionVisit(1, "第一关", false, "用户");
tracker.trackAnswerSubmit(1, "答案", true, "用户");
tracker.trackMagicScrollOpen("密卷", "内容", "用户");

// 但在调试模式下，只会在控制台打印美化日志
// 不会产生任何网络请求
```

### 3. **美化的控制台输出**

```
⚡ EVENT │ 14:30:25 │ 第 1 题
  📝 第一关：神秘的开始
  📋 step=1&isMultiMode=false
  └─ 来自sitkin.top/旅行者
```

---

## 💡 实现原理

### 核心代码逻辑

```typescript
// 1. sendEvent 方法中检测调试模式
private sendEvent(message: string): void {
  if (this.config.debug) {
    this.printDebugMessage(message); // 仅打印
    return; // 直接返回，不执行后续发送逻辑
  }

  // 正常模式的发送逻辑...
}

// 2. sendViaFetch 中也再次检查
private sendViaFetch(message: string): void {
  const isDebug = getQueryParam("debug")?.[0] === "1";
  if (isDebug) {
    return; // 调试模式不发送请求
  }

  fetch(this.config.apiUrl + message);
}
```

### 双重保障

1. **第一层**：`sendEvent()` 中检测到 `debug=true` 直接返回
2. **第二层**：`sendViaFetch()` 中再次检查 URL 参数

确保即使调用了兜底的 fetch 方法，也不会发送请求。

---

## 🎨 调试模式 vs 生产模式

| 特性       | 调试模式 (`?debug=1`) | 生产模式 (默认) |
| ---------- | --------------------- | --------------- |
| 控制台输出 | ✅ 美化样式输出       | ❌ 无输出       |
| 网络请求   | ❌ 不发送             | ✅ 正常发送     |
| 性能影响   | ✅ 零网络开销         | ⚠️ 有网络请求   |
| 适用场景   | 本地开发、调试        | 生产环境        |
| 数据上报   | ❌ 不上报服务器       | ✅ 正常上报     |

---

## 📊 使用场景

### ✅ 适合开启调试模式的场景

1. **本地开发**

   ```bash
   # 开发环境下查看事件流
   npm run dev
   # 访问 http://localhost:5173/?debug=1
   ```

2. **功能调试**

   ```bash
   # 需要查看事件触发时机
   https://test.your-app.com/questions?qa=1&debug=1
   ```

3. **UI 验证**

   ```bash
   # 验证事件追踪的视觉效果
   https://your-app.com/?debug=1
   ```

4. **性能测试**
   ```bash
   # 排除网络延迟，专注逻辑性能
   http://localhost:5173/?debug=1
   ```

### ❌ 不适合开启调试模式的场景

1. **生产环境监控**

   ```bash
   # ❌ 错误：需要实际上报数据
   https://prod.your-app.com/?debug=1
   ```

2. **用户行为分析**

   ```bash
   # ❌ 错误：数据不会上报到服务器
   https://app.com/events?debug=1
   ```

3. **A/B 测试**
   ```bash
   # ❌ 错误：无法收集测试数据
   https://ab-test.com/?debug=1
   ```

---

## 🔧 配置说明

### 自动检测

调试模式会自动从 URL 参数中检测：

```typescript
// 以下 URL 都会触发调试模式
http://localhost:5173/?debug=1
http://localhost:5173/test?debug=1&other=param
http://localhost:5173/#/home?debug=1

// 以下不会触发调试模式
http://localhost:5173/?debug=0
http://localhost:5173/?debug=false
http://localhost:5173/  // 没有 debug 参数
```

### 手动配置

也可以在初始化时强制指定：

```typescript
import { initTracker } from "@/utils/eventTracker";

const tracker = initTracker({
  debug: true, // 强制开启调试模式
  apiUrl: "https://api.example.com/track",
});
```

---

## 🎯 验证方法

### 方法 1: 查看 Network 面板

**步骤：**

1. 打开浏览器开发者工具
2. 切换到 Network 标签
3. 访问 `http://localhost:5173/?debug=1`
4. 触发一些事件（如答题）

**预期结果：**

- ✅ 控制台有美化日志输出
- ❌ Network 面板中没有上报请求
- ✅ 业务逻辑正常执行

### 方法 2: 对比测试

```bash
# 测试 1: 调试模式
http://localhost:5173/?debug=1
# → 控制台：有输出
# → Network: 无请求

# 测试 2: 生产模式
http://localhost:5173/
# → 控制台：无输出
# → Network: 有上报请求
```

---

## 📝 代码示例

### 完整的调试流程

```typescript
// 1. 导入追踪器
import { tracker } from "@/utils/eventTracker";

// 2. 在组件中使用
const handleSubmit = async () => {
  const answer = userInput.value;
  const isCorrect = verifyAnswer(answer);

  // 3. 上报事件
  tracker.trackAnswerSubmit(1, answer, isCorrect, "旅行者");

  // 调试模式下：
  // ✅ 控制台输出：
  //   ⚡ EVENT │ 14:30:25 │ 回答正确
  //     📝 答案：xxx
  //     📋 step=1&isCorrect=true
  //     └─ 来自sitkin.top/旅行者
  //
  // ❌ 不发送网络请求
};
```

---

## ⚠️ 注意事项

### 1. 调试模式不会影响业务逻辑

```typescript
// ✅ 正确理解
// 调试模式下，所有 tracker API 调用都正常执行
// 只是最终不发送网络请求而已

// ❌ 错误理解
// 调试模式下 tracker 方法不会执行
```

### 2. 调试模式下的性能

虽然不发送网络请求，但仍有少量控制台输出开销：

```typescript
// 避免在循环中大量调用
for (let i = 0; i < 1000; i++) {
  tracker.trackCustomAction("test", `item ${i}`);
  // 会产生 1000 条控制台日志，可能卡顿
}
```

### 3. 生产环境忘记移除 debug 参数

```typescript
// ❌ 危险：生产链接包含 ?debug=1
https://prod.app.com/?debug=1
// → 数据不会上报！

// ✅ 正确：生产环境移除 debug 参数
https://prod.app.com/
```

---

## 🎉 总结

调试模式提供了**零成本的事件追踪调试体验**：

- ✅ **美观的控制台输出** - 渐变色 + emoji
- ✅ **零网络开销** - 不发送实际请求
- ✅ **完整的 API** - 所有方法正常工作
- ✅ **即开即用** - 只需添加 `?debug=1`
- ✅ **随时关闭** - 移除参数即可恢复上报

现在你可以放心地在本地开发和调试时使用事件追踪系统了！🚀

---

**创建时间**: 2026-03-09  
**版本**: v1.2.0 - Debug Mode Only  
**状态**: ✅ 已实现
