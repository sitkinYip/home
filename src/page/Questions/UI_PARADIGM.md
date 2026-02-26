# Questions 模块 UI 范式（AI 参考文档）

> 本文档面向 AI 助手，描述 `src/page/Questions` 模块的视觉体系、组件结构、交互模式和编码约定，以便 AI 在新增或修改该模块代码时保持风格一致。

---

## 一、整体设计语言

### 1.1 主题定位
- **世界观**：魔法冒险 / 解谜闯关。所有 UI 元素均使用魔法、冒险、古卷、符文等隐喻命名。
- **视觉基调**：深色沉浸式背景 + 毛玻璃面板 + 金色/紫色魔法光效。
- **目标平台**：移动端优先（使用 `vpx` 自适应单位），兼容桌面。

### 1.2 色彩系统（`_variables.scss`）
```scss
$magic-gold:    #ffd700;           // 主色调 - 金色，用于高亮、徽章、光晕、提示
$magic-purple:  rgb(138, 43, 226); // 辅助色 - 紫色，用于按钮渐变、魔法阵
$magic-red:     #ff4757;           // 错误/危险色 - 红色，用于错误抖动、错误边框
$magic-green:   #2ecc71;           // 成功色 - 绿色，用于答对状态、线索卡片边框
$glass-bg:      rgba(255, 255, 255, 0.1);  // 毛玻璃面板背景
$glass-border:  rgba(255, 255, 255, 0.2);  // 毛玻璃面板边框
```

**扩展色（组件内局部使用）：**
| 色彩 | 值 | 用途 |
|------|------|------|
| `$magic-rose` | `#ff9a9e` | 星海情笺（letter 类型）图标/光晕 |
| `$magic-lavender` | `#fad0c4` | 星海情笺渐变配色 |
| `$magic-cyan` | `#00d2ff` / `#00f2ff` | 时空跃迁（topic 类型）/ URL 预览主题色 |

### 1.3 尺寸与间距单位
- **统一使用 `vpx`**（自定义视口单位，通过 `toVpx()` 工具函数转换），而非 `px`、`rem`、`vw`。
- 基准设计稿宽度：**390px**（iPhone 标准宽度）。
- 常用间距：`4vpx`、`8vpx`、`12vpx`、`16vpx`、`20vpx`、`24vpx`、`30vpx`、`40vpx`。
- 圆角：小元素 `4vpx`~`12vpx`，面板 `20vpx`，胶囊按钮 `24vpx`~`50vpx`，圆形 `50%`。

### 1.4 字体规范
| 用途 | 大小 | 字重 | 颜色 |
|------|------|------|------|
| 英雄名称 | `18vpx` | 800 | `#fff` |
| 正文/题目 | `17vpx` | normal | `#fff` |
| 按钮文字 | `18vpx` | bold | `#fff` |
| 标签/徽章 | `10vpx`~`13vpx` | bold | `$magic-gold` 或 `#aaa` |
| 图片说明 | `14vpx` | normal/italic | `rgba(255,255,255,0.7)` |
| 辅助提示 | `12vpx`~`13vpx` | 300~500 | `rgba(255,255,255,0.5~0.85)` |

---

## 二、核心视觉模式

### 2.1 毛玻璃面板（`.magic-panel`）
所有主要内容卡片的基础样式，是本模块最核心的视觉元素：
```
背景:       rgba(255,255,255,0.1)
模糊:       backdrop-filter: blur(20vpx)
边框:       1vpx solid rgba(255,255,255,0.2)
圆角:       20vpx
阴影:       0 8vpx 32vpx rgba(0,0,0,0.3)
内边距:     24vpx
底部间距:   margin-bottom: 24vpx
```
**必须包含的装饰伪元素**：`::before` 扫光动画（`sweep-light`，45° 线性渐变，6s 循环）。

### 2.2 背景层级系统（z-index）
```
z-index: 0  → .magic-bg       背景图片层（fixed，brightness(0.3) saturate(1.2)）
z-index: 1  → .overlay         径向渐变遮罩（中心透明→边缘黑色80%）
z-index: 2  → ::after          环境光晕（金色+紫色径向渐变，screen混合模式，15s浮动动画）
z-index: 4  → .quest-wrapper   内容层
z-index: 999  → BgmFloatButton 悬浮音乐按钮
z-index: 1000 → BgmAuthHint    音乐授权提示
z-index: 9999 → VictoryAura    胜利全屏特效
z-index: 10000 → AdventurePortal 时间门控全屏遮罩
z-index: 10005 → MagicScroll / MagicTip 弹窗层
z-index: 10006 → AdventureLost  迷失状态全屏
```

### 2.3 光效与动画范式

#### 呼吸光晕（`pulse` / `breathe`）
用于状态指示器、图标、按钮等需要"活着"的元素：
```scss
@keyframes pulse {
  0%   { transform: scale(1);    opacity: 0.4; }
  50%  { transform: scale(1.15); opacity: 0.6; }
  100% { transform: scale(1);    opacity: 0.4; }
}
```
周期：`2s infinite`。

#### 旋转（`rotateCW` / `rotateCCW`）
用于魔法阵、头像装饰环、星盘等：
- 顺时针：外环 25~30s，内环 10~12s
- 逆时针：中环 18~20s
- 虚线装饰环：10~15s

#### 扫光（`sweep-light`）
用于毛玻璃面板的微妙光泽感：6s 循环，45° 斜向移动。

#### 错误抖动（`magic-shake`）
用于答错时面板抖动：0.5s，cubic-bezier(0.36,0.07,0.19,0.97)，伴随红色边框和红色阴影。

#### 按钮流光（`flare`）
用于确认按钮的高光扫过效果：4s 循环，skewX(-25deg)。

#### 粒子上浮（`float-up`）
用于 MagicScroll、QuestClues 全屏模式的魔法粒子：
- 粒子数量：20~25 个
- 颜色：金色到橙色（hsl(30~70, 80~85%, 55~60%)）
- 大小：2~6px 随机
- 动画：从底部上浮至顶部，3~8s 随机延迟和周期

### 2.4 过渡动画范式
- **Vue `<transition>`** 命名约定：`fade`、`scale-fade`、`slide-down`、`scroll-reveal`、`magic-scroll`、`magic-tip`、`portal-fade`。
- **GSAP 入场动画**：页面初始化时使用 `gsap.from()` 做卡片和头部的位移+透明度入场。
- **点击反馈**：所有可点击元素使用 `:active { transform: scale(0.95~0.98) }`。
- **状态切换**：`transition: all 0.3s ease` 或 `0.4s cubic-bezier(0.175,0.885,0.32,1.275)`（弹性）。

---

## 三、组件体系与层级

### 3.1 页面结构树
```
Questions/index.vue                    ← 页面入口
├── .magic-bg                          ← 背景图（可配置）
├── .overlay                           ← 暗角遮罩
├── VideoPlayer                        ← 全屏视频播放器（ref 调用）
├── .quest-wrapper                     ← 内容容器
│   ├── QuestHeader                    ← 英雄状态栏（头像+名称+等级+状态灯）
│   ├── main.magic-panel.quest-card    ← 主交互面板
│   │   └── MagicAccordion             ← 可折叠手风琴（答对后折叠）
│   │       ├── [header slot]          ← 标题行（装饰线 + 标题 + 装饰线）
│   │       ├── QuestContent           ← 题目内容（文字/图片/视频/提示）
│   │       │   └── MagicTip           ← 魔法提示弹窗（teleport to body）
│   │       └── QuestInputRegion       ← 答题输入区
│   │           └── MultipleChoiceOptions ← 选择题选项（条件渲染）
│   ├── MagicScroll                    ← 羊皮纸弹窗（ref 调用，富文本渲染）
│   ├── QuestClues                     ← 线索展示区（答对后出现）
│   │   └── ClueArtifact/index.vue     ← 线索遗物入口
│   │       ├── ArtifactCard           ← 卡片式展示（默认）
│   │       ├── TextExpander           ← 文本展开面板（全屏模式）
│   │       ├── ImageThumbnail         ← 图片缩略图（全屏模式）
│   │       ├── VideoMiniPlayer        ← 迷你视频播放器（全屏模式）
│   │       └── UrlPreview             ← iframe 页面预览（全屏模式）
│   ├── AdventurePortal                ← 时间门控（未开始/已结束遮罩）
│   └── VictoryAura                    ← 终极胜利特效（最终关）
├── BgmAuthHint                        ← 背景音乐授权提示条
├── BgmFloatButton                     ← 背景音乐悬浮控制球（可拖拽）
└── AdventureLost                      ← 迷失状态（关卡不存在）
```

### 3.2 组件通信模式
| 模式 | 使用场景 |
|------|----------|
| `props` + `emit` | 所有父子组件通信的标准方式 |
| `v-model` | `MagicAccordion`（展开/折叠）、`QuestInputRegion`（输入值）、`MultipleChoiceOptions`（选中值） |
| `ref` + `defineExpose` | `VideoPlayer.open(url)`、`MagicScroll.show(data)`、`VictoryAura.startEffect()`、`MagicTip.show(msg)` |
| Pinia Store | `useQuestionsStore` 管理关卡数据、用户信息、缓存进度 |
| Composables | 业务逻辑抽离为 `usePenalty`、`useAnswerCheck`、`useArtifacts`、`useBgm`、`useContentParser`、`useFeedback` |

---

## 四、组件详细范式

### 4.1 QuestHeader（英雄状态栏）
**布局**：`flex, justify-content: space-between`，左侧头像+信息，右侧状态灯。
**头像装饰**：
- 外层虚线环（dashed，顺时针旋转 10s）
- 中层实线环（金色半透明，逆时针旋转 3s）
- 内层头像（圆形，`el-image`，失败时显示用户名末字）

**状态指示器（右侧）**：三态图标
| 状态 | 图标 | 光晕颜色 | 边框 |
|------|------|----------|------|
| 未解锁 | `Lock` (金色) | `$magic-gold` | 金色边框 |
| 已解锁 | `MagicStick` (绿色) | `$magic-green` | 默认 |
| 错误中 | `CircleClose` (红色) | `$magic-red` + 扩散模糊 | 红色边框 + 抖动 |

### 4.2 QuestContent（题目内容）
**数据驱动**：遍历 `QuestionItem[]` 数组，每项可包含：
- **文字**：`v-html` 渲染（支持 `\n` → `<br>`），有图片时变为斜体说明文字（`.is-caption`）
- **图片**：`el-image`，点击调用 Vant `showImagePreview`（支持多图 `imgList`）
- **视频**：显示封面图 + 播放按钮覆盖层，点击 emit `play-video`
- **提示**：符文石按钮（`.rune-stone`），点击弹出 `MagicTip`

### 4.3 QuestInputRegion（答题输入区）
**双模式**：
1. **填空题**（默认）：
   - 暗色输入框（`rgba(0,0,0,0.4)`），聚焦时加深 + 金色阴影
   - 底部魔力进度条（随输入长度增长，最大 100%）
   - 回车提交
2. **选择题**（`type === 'MultipleChoice'`）：
   - 渲染 `MultipleChoiceOptions` 组件
   - 选中后才显示确认按钮

**按钮状态**：
| 状态 | 类名 | 背景渐变 |
|------|------|----------|
| 默认 | - | 紫色渐变 `$magic-purple → #4834d4` |
| 成功 | `.btn-success` | 绿色渐变 `$magic-green → #27ae60` |
| 错误 | `.btn-error` | 红色渐变 `$magic-red → #c0392b` + 红色阴影 |
| 封印 | `.btn-sealed` | 灰色渐变 `#3d3d3d → #1a1a1a`，`cursor: not-allowed` |

### 4.4 MultipleChoiceOptions（选择题选项）
**布局**：纵向排列，`gap: 12vpx`。
**选项结构**：序号标记（`.option-key`）+ 文字/图片/视频 + 选中标记。
**选中态**：金色边框 + 金色背景 15% + 内发光 + 序号标记变为金色实底。
**惩罚遮罩**：半透明黑色覆盖层，显示倒计时或"灵魂已被封印"。

### 4.5 MagicAccordion（魔法手风琴）
**展开态**：显示 header slot 内容 + 收起箭头图标。
**折叠态**：显示华丽的成功横幅（"✨ 谜题已解 · 点击回顾 ✨"），带魔法粒子和装饰线。
**动画**：`max-height` + `opacity` 过渡，600ms。
**高度计算**：使用 `ResizeObserver` 动态监测内容高度。

### 4.6 QuestClues（线索展示区）
**入场**：Vue `<transition name="scroll-reveal">`。
**面板**：`.magic-panel` 基础 + 绿色边框（`rgba($magic-green, 0.4)`）。
**全屏模式**：右上角水晶按钮切换，展开后显示魔法粒子背景，锁定页面滚动。
**子组件 ClueArtifact**：根据 `type` 渲染不同子组件：
| type | 卡片模式 | 全屏模式 |
|------|----------|----------|
| `text` | ArtifactCard（2行预览） | TextExpander（羊皮纸展开） |
| `img` | ArtifactCard | ImageThumbnail（缩略图+预览） |
| `video` | ArtifactCard | VideoMiniPlayer（内嵌播放器） |
| `url` | ArtifactCard | UrlPreview（iframe 预览） |
| `letter` | ArtifactCard（玫瑰色心跳图标） | - （路由跳转） |
| `topic` | ArtifactCard（青色传送图标） | - （关卡跳转） |

### 4.7 ArtifactCard（遗物卡片）
**布局**：`flex`，图标区（44vpx 方形/圆形）+ 信息区（标签+内容预览）+ 箭头。
**特殊类型装饰**：
- `letter`：玫瑰色圆形图标 + 心跳动画 + 神圣光晕 + 彩虹流动边框
- `topic`：青色径向渐变图标 + 呼吸动画

**内容解析**：使用 `parseContent()` 支持富文本标记：
- `[[文本]]` → 金色高亮
- `((文本||url))` → 链接
- `{{url}}` → 图片（预览模式显示占位文字）
- `\n` → 换行

### 4.8 MagicScroll（羊皮纸弹窗）
**触发方式**：`ref.show({ title, content })`。
**视觉**：全屏遮罩 + 魔法粒子 + 中央光芒 + 羊皮纸卡片（四角装饰）。
**字体**：动态加载 `Cinzel`（标题）和 `Crimson Text`（正文），使用 `requestIdleCallback` 预加载。
**内容渲染**：使用 `useContentParser` 解析富文本。

### 4.9 MagicTip（魔法提示弹窗）
**触发方式**：`ref.show(msg)`。
**视觉**：`teleport to body`，深紫色背景卡片，金色边框，3D 弹出动效（scale + rotateX + blur）。
**关闭动效**：气化升华（scale(1.1) + translateY(-30vpx) + blur + brightness(3)）。

### 4.10 VictoryAura（胜利光环）
**触发方式**：`ref.startEffect()`，仅最终关使用。
**视觉**：全屏遮罩 + 极光背景（conic-gradient 旋转）+ 三层魔法阵（SVG 符文图案）+ 核心光流。
**文字**：`MISSION COMPLETE`，渐变文字（白→金），drop-shadow 发光。
**交互**：GSAP 时间线动画完成后 1s 才允许点击关闭，触发 `canvas-confetti` 撒花 6s。
**设备反馈**：`navigator.vibrate([100, 50, 200])`。

### 4.11 AdventurePortal（时间门控）
**状态**：
| 状态 | 视觉 | 图标 |
|------|------|------|
| `PRE_START` | 金色光效 + 呼吸动画 + 倒计时 | `Lock` |
| `POST_END` | 灰暗（grayscale）+ 动画暂停 + 缩小 | `CircleClose` |
| `ACTIVE` | 不渲染（隐藏） | - |

**倒计时**：使用 `dayjs` 计算时间差，`HH:MM:SS` 格式。

### 4.12 AdventureLost（迷失状态）
**视觉**：深紫色径向渐变背景 + 破碎星盘（虚线旋转环 + Compass 图标）+ 虚空尘埃动效。
**操作**：回归原点（跳转 Level 1）/ 呼唤管理者（上报通知）。

### 4.13 BgmAuthHint（音乐授权提示）
**位置**：`fixed top: 12vpx, left: 50%`，胶囊形毛玻璃条。
**入场**：`slide-down` 过渡（从上方滑入）。
**自动消失**：5s 后自动关闭。
**交互**：点击主体授权播放，右上角 × 关闭。

### 4.14 BgmFloatButton（音乐悬浮球）
**位置**：`fixed`，初始右下角，支持触摸/鼠标拖拽。
**吸附**：松手后自动吸附到最近的屏幕左/右边缘。
**尺寸**：44vpx 圆形毛玻璃按钮。
**播放态**：音符旋转 + 声波动画条 + 外层呼吸光圈。

---

## 五、Composables 逻辑层

### 5.1 useAnswerCheck
- 管理 `userInput`、`isBinGo`、`isQuestionExpanded` 状态
- `verifyAnswer(ans)` 校验答案（支持主答案 + 备选答案列表）
- `handleSuccess()` 处理答对流程：撒花 → 保存进度 → 自动播放视频 → 上报 → 喊话 → 折叠题目 → 终极特效
- `checkPersistentProgress()` 从 localStorage 恢复通关状态

### 5.2 usePenalty
- 仅选择题启用惩罚机制，填空题仅触发视觉错误效果
- 惩罚配置：`penaltyConfig: number[]`，如 `[180000, -1]`（第1次错3分钟，第2次永久封印）
- 状态持久化到 localStorage（含 `wrongCount` 和 `penaltyEndTime`）
- 提供 `clearPenalty()` 后门（通过头像连点 10 次触发）

### 5.3 useArtifacts
- 统一处理线索遗物的交互：`openVideo`、`openPage`、`previewImage`、`handleArtifactAction`
- 根据 `item.type` 分发到不同的处理逻辑

### 5.4 useBgm
- 管理背景音乐的播放/暂停/授权流程
- 自动播放失败时显示授权提示（5s 自动消失）
- 路由离开和组件卸载时自动清理

### 5.5 useContentParser
- 富文本标记解析引擎，支持 `[[高亮]]`、`((链接文字||url))`、`{{图片url}}`、`\n`
- 提供 `parseContent()` 纯函数和 `useContentParser()` 响应式 Hook
- 支持预览模式（图片显示为占位文字）

### 5.6 useFeedback
- 成功音效：预加载 `success.mp3`，答对时播放
- 振动反馈：兼容原生 `navigator.vibrate` 和微信 JSSDK `wx.vibrateShort/vibrateLong`
- 错误振动模式：`[100, 50, 100]`（短促双振）
- 冻结振动模式：`300`（长振）

---

## 六、数据模型

### 6.1 关卡数据（`LevelRecord`）
```typescript
interface LevelRecord {
  type?: "FillInTheBlank" | "MultipleChoice";  // 题型，默认填空
  options?: OptionItem[];          // 选择题选项
  title?: string;                  // 谜题标题
  answerTitle?: string;            // 线索区标题
  step: number;                    // 关卡序号
  question: QuestionItem[];        // 题目内容列表
  answer: string;                  // 正确答案
  answerList?: string[];           // 备选答案列表
  placeholder: string;             // 输入框占位文字
  thread: ThreadItem[];            // 答对后的线索列表
  userName: string;                // 用户昵称
  avatar?: string;                 // 用户头像
  rankName?: string;               // 等级名称
  isFinalLevel?: boolean;          // 是否最终关
  FinalLevelConfig?: { path?, link?, query? };  // 最终关跳转配置
  penaltyConfig?: number[];        // 惩罚时间配置
  startTime?: string;              // 开放时间
  endTime?: string;                // 截止时间
  mainAudio?: string;              // 背景音乐 URL
  mainBgImg?: string;              // 背景图片 URL
}
```

### 6.2 题目条目（`QuestionItem`）
```typescript
interface QuestionItem {
  text?: string;      // 文字内容（支持 \n 换行）
  tips?: string;      // 提示内容
  img?: string;       // 图片 URL
  video?: string;     // 视频 URL
  imgList?: string[]; // 多图预览列表
}
```

### 6.3 线索条目（`ThreadItem`）
```typescript
interface ThreadItem {
  type: "text" | "url" | "img" | "video" | "letter" | "topic";
  content: string;              // 显示文本（支持富文本标记）
  url?: string;                 // 资源 URL
  imgList?: string[];           // 多图列表
  state?: "ckickplay" | string; // 特殊状态（如自动播放）
  path?: string;                // 路由路径（letter 类型）
  query?: Record<string, string>; // 路由参数
  nextIndex?: number;           // 下一关序号（topic 类型）
  title?: string;               // 自定义标签文字
}
```

### 6.4 选项条目（`OptionItem`）
```typescript
interface OptionItem {
  key: string;     // 选项编号（A/B/C/D 或 1/2/3/4）
  text?: string;   // 选项文字
  img?: string;    // 选项图片
  video?: string;  // 选项视频
}
```

---

## 七、技术栈与依赖

| 依赖 | 用途 |
|------|------|
| **Vue 3** + `<script setup>` + TypeScript | 框架 |
| **Pinia** | 状态管理（`useQuestionsStore`） |
| **Vue Router** | 路由（`/questions?qa=N&user=ID`） |
| **Element Plus** | 图标（`el-icon`）、图片（`el-image`） |
| **Vant** | 通知（`showNotify`）、图片预览（`showImagePreview`）、Toast |
| **GSAP** | 入场动画、点击反馈动画 |
| **canvas-confetti** | 撒花特效 |
| **dayjs** | 时间计算（倒计时） |
| **SCSS** | 样式，使用 `@use` 导入变量 |

---

## 八、编码约定

### 8.1 文件组织
```
Questions/
├── index.vue              ← 页面入口，组装所有组件和 composables
├── style.scss             ← 页面级公共样式（.magic-panel、动画等）
├── _variables.scss        ← SCSS 变量（颜色）
├── components/            ← 子组件（每个组件 scoped style）
│   └── ClueArtifact/      ← 复杂组件可建子目录
└── composables/           ← 业务逻辑 hooks（use*.ts）
```

### 8.2 样式约定
- 每个组件使用 `<style lang="scss" scoped>`
- 变量引入：`@use "../_variables.scss" as *;` 或 `@use "../../_variables.scss" as *;`
- 部分组件内会重新声明 `$magic-gold` 等变量（历史原因），新组件应统一使用 `@use` 导入
- 动画 keyframes 定义在使用它的组件内（scoped），公共动画定义在 `style.scss`

### 8.3 组件约定
- Props 使用 `defineProps<T>()` 泛型语法
- Emits 使用 `defineEmits<T>()` 或 `defineEmits(["eventName"])`
- 需要父组件命令式调用的方法通过 `defineExpose({ method })` 暴露
- 组件内 ref 类型统一使用 `ref<any>(null)` 引用子组件实例

### 8.4 命名约定
| 类型 | 风格 | 示例 |
|------|------|------|
| 组件文件 | PascalCase | `QuestHeader.vue` |
| Composable 文件 | camelCase，`use` 前缀 | `useAnswerCheck.ts` |
| CSS 类名 | kebab-case | `.magic-panel`、`.quest-card` |
| CSS 状态类 | `is-` 前缀 | `.is-error`、`.is-selected`、`.is-focus` |
| CSS 动画名 | kebab-case | `magic-shake`、`sweep-light` |
| 事件名 | camelCase | `avatarClick`、`playVideo` |
| Store | `use` + PascalCase + `Store` | `useQuestionsStore` |

### 8.5 交互反馈约定
| 场景 | 视觉 | 触觉 | 听觉 |
|------|------|------|------|
| 答对 | 撒花 + 面板折叠 + 线索展开 | - | 成功音效 |
| 答错（填空） | 面板抖动 + 红色边框 + 通知 | 短振动 `[100,50,100]` | - |
| 答错（选择） | 面板抖动 + 红色边框 + 惩罚倒计时 | 短振动 | - |
| 封印触发 | 灰色按钮 + 遮罩 + 通知 | 长振动 `300` | - |
| 最终通关 | 全屏魔法阵 + 撒花 6s + 文字动画 | 振动 `[100,50,200]` | - |
| 按钮点击 | `scale(0.96)` 弹性回弹 | - | - |

---

## 九、新增组件/功能时的检查清单

1. **颜色**：是否使用了 `_variables.scss` 中定义的变量？
2. **单位**：是否全部使用 `vpx` 而非 `px`？（JS 中需要数值时使用 `toVpx()` 转换）
3. **毛玻璃**：新面板是否继承 `.magic-panel` 样式或遵循其视觉规范？
4. **动画**：是否包含适当的入场/交互动画？是否使用了已有的动画 keyframes？
5. **z-index**：是否遵循了层级系统？弹窗层是否 ≥ 10005？
6. **暗色适配**：所有文字是否在深色背景上可读？
7. **移动端**：触摸交互是否使用 `:active` 而非 `:hover`？
8. **富文本**：如需渲染用户配置的文本，是否使用了 `useContentParser` / `parseContent()`？
9. **反馈**：交互是否提供了视觉/触觉/听觉反馈？
10. **清理**：定时器、事件监听、音频实例是否在 `onUnmounted` 中清理？
