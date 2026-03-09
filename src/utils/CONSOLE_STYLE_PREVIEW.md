# 事件追踪器 - 调试控制台样式预览

## 🎨 控制台输出效果

### 开启调试模式

访问 URL 添加 `?debug=1` 参数即可看到美观的控制台输出。

---

## 📊 实际效果对比

### ❌ 修复前（普通文本）

```
[EventTracker] 第 1 题 | 第一关：神秘的开始 | step=1&isMultiMode=false -- 来自sitkin.top/旅行者
[EventTracker] 回答正确 | 答案 password123 | step=1&isCorrect=true -- 来自sitkin.top/admin
[EventTracker] 神谕密卷 | 隐藏的线索 | hasContent=true -- 来自sitkin.top/旅行者
```

**问题：**

- 🔴 信息密集，难以快速阅读
- 🔴 没有视觉层次，所有信息混在一起
- 🔴 缺少时间戳
- 🔴 不够醒目，容易被忽略

---

### ✅ 修复后（美化样式）

```
╭─────────────────────────────────────────────────────╮
│ ⚡ EVENT │ 14:30:25 │ 第 1 题                        │
├─────────────────────────────────────────────────────┤
│   📝 第一关：神秘的开始                              │
│   📋 step=1&isMultiMode=false                       │
│   └─ 来自sitkin.top/旅行者                          │
╰─────────────────────────────────────────────────────╯

⚡ EVENT │ 14:30:30 │ 回答正确
  📝 答案：password123
  📋 step=1&isCorrect=true
  └─ 来自sitkin.top/admin

⚡ EVENT │ 14:30:35 │ 神谕密卷
  📝 隐藏的线索
  📋 hasContent=true
  └─ 来自sitkin.top/旅行者
```

**优势：**

- ✅ **紫色渐变徽章** - 醒目的事件标识
- ✅ **精确时间戳** - 24 小时制，精确到秒
- ✅ **层次分明** - 标题、详情、参数、来源清晰分组
- ✅ **Emoji 图标** - 使用 ⚡📝📋 等图标增强可读性
- ✅ **折叠设计** - 默认折叠，保持控制台整洁
- ✅ **渐变色背景** - 紫色到紫罗兰色的渐变

---

## 🎯 样式细节

### 1. Badge 徽章样式

```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
color: #fff;
padding: 4px 8px;
border-radius: 4px;
font-weight: bold;
font-size: 12px;
```

**效果：**

- 紫色渐变背景（从左到右）
- 白色文字
- 圆角矩形
- 加粗字体

### 2. 时间戳样式

```css
color: #888;
font-size: 11px;
```

**效果：**

- 浅灰色
- 小字号
- 不抢眼但清晰可见

### 3. 标题样式

```css
color: #667eea;
font-weight: bold;
font-size: 13px;
```

**效果：**

- 紫色主题色
- 加粗显示
- 略大的字号

### 4. 详情样式

```css
color: #4a5568;
font-size: 12px;
```

**效果：**

- 深灰色文字
- 标准字号
- 舒适的阅读体验

### 5. 参数样式

```css
color: #718096;
font-size: 11px;
font-style: italic;
```

**效果：**

- 中灰色
- 小字号
- 斜体显示

### 6. 来源样式

```css
color: #a0aec0;
font-size: 10px;
```

**效果：**

- 浅灰色
- 最小字号
- 低调但完整

---

## 📸 控制台截图示例

### 单题模式事件流

```
时间线：
14:30:25  ⚡ EVENT │ 单题模式
            📋 step=1
            └─ 来自sitkin.top/admin

14:30:26  ⚡ EVENT │ 第 1 题
            📝 第一关：神秘的开始
            📋 step=1&isMultiMode=false
            └─ 来自sitkin.top/admin

14:30:30  ⚡ EVENT │ 回答错误
            📝 答案：wrong_answer
            📋 step=1&isCorrect=false
            └─ 来自sitkin.top/admin

14:30:35  ⚡ EVENT │ 回答正确
            📝 答案：correct_password
            📋 step=1&isCorrect=true
            └─ 来自sitkin.top/admin

14:30:36  ⚡ EVENT │ 神谕密卷
            📝 隐藏的线索
            📋 hasContent=true
            └─ 来自sitkin.top/admin

14:30:40  ⚡ EVENT │ 路由跳转
            📝 /next-level
            📋 path=/next-level&query={}
            └─ 来自sitkin.top/admin
```

### 多题模式事件流

```
时间线：
14:35:00  ⚡ EVENT │ 多题模式
            📋 steps=1,2,3&count=3
            └─ 来自sitkin.top/traveler

14:35:01  ⚡ EVENT │ 第 1 题
            📝 第一关：开始
            📋 step=1&isMultiMode=false
            └─ 来自sitkin.top/traveler

14:35:10  ⚡ EVENT │ 回答正确
            📝 答案：answer1
            📋 step=1&isCorrect=true
            └─ 来自sitkin.top/traveler

14:35:15  ⚡ EVENT │ 第 2 题
            📝 第二关：深入
            📋 step=2&isMultiMode=false
            └─ 来自sitkin.top/traveler
```

---

## 🎨 颜色方案

### 主色调

| 颜色     | 用途       | Hex 代码              |
| -------- | ---------- | --------------------- |
| 紫色渐变 | Badge 背景 | `#667eea` → `#764ba2` |
| 主题紫   | 标题文字   | `#667eea`             |
| 深灰     | 详情文字   | `#4a5568`             |
| 中灰     | 参数文字   | `#718096`             |
| 浅灰     | 来源文字   | `#a0aec0`             |
| 极浅灰   | 时间戳     | `#888888`             |

### 设计理念

- **专业感** - 紫色系传达专业、神秘的感觉
- **层次感** - 通过颜色和字号区分信息层级
- **舒适度** - 低饱和度配色，长时间查看不刺眼
- **一致性** - 与 Questions 模块的魔法主题保持一致

---

## 🔧 技术实现

### 核心代码

```typescript
private printDebugMessage(message: string): void {
  const timestamp = new Date().toLocaleTimeString('zh-CN', { hour12: false });

  // 解析消息内容
  const parts = message.split(' -- 来自');
  const content = parts[0] || '';
  const source = parts[1] ? `来自${parts[1]}` : '';

  // 分割内容中的标题、详情和参数
  const segments = content.split(' | ');
  const title = segments[0] || '事件';
  const detail = segments[1] || '';
  const params = segments[2] || '';

  // 样式定义
  const styles = {
    badge: 'background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #fff; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px;',
    timestamp: 'color: #888; font-size: 11px;',
    title: 'color: #667eea; font-weight: bold; font-size: 13px;',
    detail: 'color: #4a5568; font-size: 12px;',
    params: 'color: #718096; font-size: 11px; font-style: italic;',
    source: 'color: #a0aec0; font-size: 10px;',
  };

  // 分组输出
  console.groupCollapsed(
    `%c ⚡ EVENT %c ${timestamp} %c ${title}`,
    styles.badge,
    styles.timestamp,
    styles.title
  );

  // 输出详细信息
  if (detail) {
    console.log(`%c  ${detail}`, styles.detail);
  }

  if (params) {
    console.log(`%c  📋 ${params}`, styles.params);
  }

  if (source) {
    console.log(`%c  └─ ${source}`, styles.source);
  }

  console.groupEnd();
}
```

### 特性

1. **智能解析** - 自动分割消息内容
2. **条件渲染** - 只在有内容时显示对应字段
3. **折叠分组** - 使用 `console.groupCollapsed()`
4. **样式隔离** - 每个部分独立样式
5. **Emoji 增强** - 使用图标提升可读性

---

## 💡 使用建议

### 开发环境

```bash
# 本地开发时开启调试
http://localhost:5173/?debug=1

# 测试环境
http://test.your-app.com/?debug=1
```

### 生产环境

```bash
# 生产环境排查问题时临时开启
https://your-app.com/?debug=1
```

### 最佳实践

1. ✅ **日常开发关闭** - 避免控制台过于拥挤
2. ✅ **调试时开启** - 需要追踪用户行为时打开
3. ✅ **配合过滤** - 在控制台中过滤 "EVENT" 关键字
4. ✅ **截图分享** - 美观的输出适合截图分享给团队成员

---

## 🎉 总结

通过引入美化的控制台样式，事件追踪系统的调试体验得到了显著提升：

- 🎨 **视觉吸引力** - 从单调文本到渐变徽章
- 📊 **信息层次** - 清晰的视觉层次结构
- ⏰ **时间追踪** - 精确的时间戳记录
- 🔍 **易读性** - Emoji + 配色提升可读性
- 📦 **折叠设计** - 保持控制台整洁有序

现在调试事件追踪就像欣赏一件艺术品！✨

---

**创建时间**: 2026-03-09  
**版本**: v1.1.0  
**主题**: 魔法紫色系
