# 事件追踪系统 - 问题修复

## 🐛 发现的问题

### 问题 1: 多题模式下重复上报所有单题

**现象：**
在多题模式页面加载时，会依次上报：

```
✅ 多题模式访问 (qas=1,2,3)
❌ 第 1 题访问
❌ 第 2 题访问
❌ 第 3 题访问
```

**原因：**
在 `index.vue` 的 `initMultiMode()` 方法中遍历了所有题目进行上报。

**修复方案：**

- ✅ **多题模式**：只报一次"多题模式访问"，包含题目列表信息
- ✅ **单题模式**：在各自题目组件中报自身的访问
- ✅ **移除** `initMultiMode()` 中的遍历上报逻辑

**修复代码：**

```typescript
// ❌ 修复前 - index.vue initMultiMode()
multiLevels.value.forEach((level) => {
  tracker.trackQuestionVisit(level.step, level.title || "未知题目", true, "旅行者");
});

// ✅ 修复后 - 只报一次多题模式访问
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
```

---

### 问题 2: 答题事件重复上报（错误答案）

**现象：**
回答错误时，同一个答案会被上报两次：

```
❌ ANSWER_WRONG (step=1, answer="xxx")
❌ ANSWER_WRONG (step=1, answer="xxx")  // 重复！
```

**原因：**

1. 第一次：在 `QuestPage.vue` 的 `onConfirmAnswer()` 中调用

   ```typescript
   tracker.trackAnswerSubmit(currentStep, ans, isCorrect, userName.value);
   ```

2. 第二次：在 `usePenalty.ts` 的 `handleWrongHelper()` 或 `handleWrongWithoutPenalty()` 中通过 `reportAction()` 调用
   ```typescript
   reportAction(`答错了第${currentStep}题，回答的是${filteredInput}`, "错误通知");
   ```

**修复方案：**

- ✅ **移除** `QuestPage.vue` 中 `onConfirmAnswer()` 的上报调用
- ✅ **统一在** `usePenalty.ts` 的两个处理方法中上报错误答案
- ✅ **保留** `useAnswerCheck.ts` 中 `handleSuccess()` 的上报（正确答案只在那里上报）

**修复流程：**

```typescript
// ❌ 修复前 - QuestPage.vue onConfirmAnswer()
const isCorrect = verifyAnswer(ans);

// 上报答题事件（这里会导致重复）
tracker.trackAnswerSubmit(currentStep, ans, isCorrect, userName.value);

if (isCorrect) {
  // ...
} else {
  // 这里会再次调用 reportAction 导致重复
  handleWrongHelper(ans, reportAction, filterSpecialChars);
}

// ✅ 修复后 - QuestPage.vue onConfirmAnswer()
const isCorrect = verifyAnswer(ans);

if (isCorrect) {
  const autoPlayType = await execSuccess(...);

  // 只在正确答案时上报（因为错误答案会在 penalty hooks 中上报）
  tracker.trackAnswerSubmit(currentStep, ans, true, userName.value);

  // ...
} else {
  // 错误答案的上报已移至 handleWrongHelper/handleWrongWithoutPenalty 内部
  handleWrongHelper(ans, reportAction, filterSpecialChars);
}
```

**同时更新 usePenalty.ts：**

```typescript
// ✅ usePenalty.ts - handleWrongHelper()
const handleWrongHelper = (
  ans: string,
  reportAction: (content: string, title: string) => void,
  filterSpecialChars: (str: string) => string,
) => {
  triggerErrorEffect();

  // ✅ 统一在此处上报错误答案
  tracker.trackAnswerSubmit(currentStep, ans, false, userId || "旅行者");

  // 增加错误次数
  wrongCount.value++;

  // ... 其他惩罚逻辑

  // reportAction 仍然保留用于兼容旧的上报格式
  reportAction(`答错了第${currentStep}题，回答的是${filteredInput}`, "错误通知");
};

// ✅ usePenalty.ts - handleWrongWithoutPenalty()
const handleWrongWithoutPenalty = (
  ans: string,
  reportAction: (content: string, title: string) => void,
  filterSpecialChars: (str: string) => string,
) => {
  triggerErrorEffect();

  // ✅ 统一在此处上报错误答案
  tracker.trackAnswerSubmit(currentStep, ans, false, userId || "旅行者");

  // ... 其他逻辑

  reportAction(`答错了第${currentStep}题，回答的是${filteredInput}`, "错误通知");
};
```

---

## ✅ 修复后的行为

### 单题模式

```typescript
// 页面加载
✅ trackPageVisit('单题模式', { step: 1 })
✅ trackQuestionVisit(1, '第一关标题', false)

// 回答正确
✅ trackAnswerSubmit(1, '答案', true)  // 仅在 handleSuccess 后上报一次

// 回答错误
✅ trackAnswerSubmit(1, '答案', false)  // 仅在 penalty hook 中上报一次
```

### 多题模式

```typescript
// 页面加载
✅ trackPageVisit('多题模式', { steps: '1,2,3', count: 3 })

// 切换到第 1 题
✅ trackQuestionVisit(1, '第一关标题', false)  // 仅当前活跃的题目

// 切换到第 2 题
✅ trackQuestionVisit(2, '第二关标题', false)  // 仅当前活跃的题目

// 回答正确/错误
✅ 同上，每题独立上报，不会重复
```

---

## 📝 修改的文件清单

| 文件                                           | 修改内容                         | 行数变化 |
| ---------------------------------------------- | -------------------------------- | -------- |
| `src/page/Questions/index.vue`                 | 移除多题模式下遍历上报           | -10      |
| `src/page/Questions/QuestPage.vue`             | 移除重复的答题上报，改为条件上报 | -3, +3   |
| `src/page/Questions/composables/usePenalty.ts` | 在两个 hook 中添加错误答案上报   | +6       |
| `EVENT_TRACKER_REFACTOR.md`                    | 更新文档说明修复内容             | 更新     |

---

## 🎯 验证方法

### 1. 调试模式验证

访问 URL 添加 `?debug=1` 参数，打开浏览器控制台查看日志：

```bash
# 单题模式 - 页面加载
[EventTracker] 单题模式 | step=1 -- 来自sitkin.top/旅行者
[EventTracker] 第 1 题 | 神秘的开始 | step=1&isMultiMode=false -- 来自sitkin.top/旅行者

# 回答正确 - 只上报一次
[EventTracker] 回答正确 | 答案 xxx | step=1&isCorrect=true -- 来自sitkin.top/旅行者

# 回答错误 - 只上报一次
[EventTracker] 回答错误 | 答案 xxx | step=1&isCorrect=false -- 来自sitkin.top/旅行者
```

### 2. 多题模式验证

```bash
# 多题模式 - 只报一次多题访问，不报单题
[EventTracker] 多题模式 | steps=1,2,3&count=3 -- 来自sitkin.top/旅行者

# 用户滑动到第 2 题时才上报第 2 题
[EventTracker] 第 2 题 | 神秘线索 | step=2&isMultiMode=false -- 来自sitkin.top/旅行者
```

### 3. 网络请求验证

检查 Network 面板，确认每个事件只发送一次请求：

- ✅ 页面加载：1 次（单题）或 1 次（多题）
- ✅ 题目访问：每次切换题目 1 次
- ✅ 答题提交：无论对错都只有 1 次

---

## 🔍 测试场景

### 场景 1: 单题模式完整流程

```
1. 访问 /questions?qa=1&user=123
   → ✅ 上报：单题模式，step=1

2. QuestPage 加载完成
   → ✅ 上报：第 1 题访问

3. 输入错误答案并提交
   → ✅ 上报：回答错误（仅 1 次）

4. 输入正确答案并提交
   → ✅ 上报：回答正确（仅 1 次）

5. 点击线索链接跳转
   → ✅ 上报：路由跳转 / 链接点击
```

### 场景 2: 多题模式完整流程

```
1. 访问 /questions?qas=1,2,3&user=123
   → ✅ 上报：多题模式，steps=1,2,3,count=3

2. 显示第 1 题
   → ✅ 上报：第 1 题访问

3. 答对第 1 题，滑动到第 2 题
   → ✅ 上报：第 2 题访问

4. 答错第 2 题
   → ✅ 上报：回答错误（仅 1 次）

5. 答对第 2 题，滑动到第 3 题
   → ✅ 上报：第 3 题访问
```

---

## 🎉 修复效果

### Before ❌

- 多题模式：1 次多题访问 + N 次单题访问 = **N+1 次上报**
- 回答错误：QuestPage + PenaltyHook = **2 次上报**
- 数据冗余，难以分析真实行为

### After ✅

- 多题模式：仅 **1 次多题访问上报**
- 单题模式：每题 **1 次访问上报**
- 答题提交：无论对错都 **仅 1 次上报**
- 数据清晰准确，便于分析

---

## 📌 注意事项

1. **兼容性**：保留了旧的 `reportAction` 调用，确保已有功能不受影响
2. **向后兼容**：旧的 `reportAction` 方法标记为 `@deprecated`，但继续使用
3. **用户名处理**：统一使用 `userId` 或 `userName`，避免混用
4. **错误处理**：所有上报失败都不会影响主流程

---

**修复完成时间**: 2026-03-09  
**修复者**: AI Assistant  
**版本**: v1.1.0 - Bug Fixes
