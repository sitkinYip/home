<template>
    <div class="lyrics-container" ref="containerRef">
        <!-- 播放遮罩层：仅在有音频且未开始时显示 -->
        <Transition name="fade">
            <div v-if="hasAudio && !isStarted" class="play-overlay">
                <button class="glass-button" @click="startPlayback">
                    <span class="icon">▶</span>
                    {{ startText }}
                </button>
            </div>
        </Transition>

        <!-- 歌词滚动包装层 -->
        <div class="lyrics-wrapper" :style="wrapperStyle">
            <div v-for="(item, index) in lyrics" :key="index"
                :class="['lyric-line', { active: currentIndex === index }]" :ref="(el) => setLineRef(el, index)">
                {{ item.text }}
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, type CSSProperties } from 'vue';

/**
 * 单条原始数据接口
 */
interface LyricData {
    /** 文本内容 */
    text: string;
    /** 持续时间 (ms)，若无音频则使用此时间切换 */
    duration?: number;
    /** 关联的音频地址 */
    audio?: string | null;
}

/**
 * 转换后的歌词项接口
 */
interface ProcessedLyric {
    text: string;
    duration: number;
    audio: string | null;
}

/**
 * 组件属性接口
 */
interface Props {
    /** 歌词数据数组 */
    data: LyricData[];
    /** 默认每行停留时长 (ms) */
    defaultDuration?: number;
    /** 开始按钮显示的文字 */
    startText?: string;
    /** 激活行在容器中的视口偏移量 (0-1)，0.4 表示位于上方 40% 处 */
    viewOffset?: number;
}

// 定义 Props 默认值
const props = withDefaults(defineProps < Props > (), {
    data: () => [],
    defaultDuration: 3000,
    startText: '开始播放',
    viewOffset: 0.4
});

// 定义组件事件
const emit = defineEmits < {
  /** 播放全部结束时触发 */
  (e: 'complete'): void;
/** 用户点击播放开始时触发 */
(e: 'start'): void;
}> ();

// --- 响应式状态 ---
const currentIndex = ref < number > (-1); // 当前激活的歌词索引
const containerRef = ref < HTMLDivElement | null > (null); // 容器引用
const lineRefs = ref < HTMLElement[] > ([]); // 每一行歌词的 DOM 引用数组
const translateY = ref < number > (0); // 纵向偏移量
const isStarted = ref < boolean > (false); // 是否已启动播放

// --- 内部非响应式变量 ---
let timer: ReturnType<typeof setTimeout> | null = null; // 自动切换定时器
let audioInstance: HTMLAudioElement | null = null; // 音频播放器实例

/**
 * 判断数据中是否包含至少一个音频文件
 */
const hasAudio = computed < boolean > (() => {
    return props.data.some(item => !!item.audio);
});

/**
 * 对输入数据进行格式化，补全缺省值
 */
const lyrics = computed < ProcessedLyric[] > (() => {
    return props.data.map(item => ({
        text: item.text,
        duration: item.duration || props.defaultDuration,
        audio: item.audio || null
    }));
});

/**
 * 计算歌词列表的偏移样式
 */
const wrapperStyle = computed < CSSProperties > (() => ({
    transform: `translateY(${translateY.value}px)`,
    transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)'
}));

/**
 * 收集 v-for 中的 DOM 引用
 */
const setLineRef = (el: any, index: number) => {
    if (el) {
        lineRefs.value[index] = el as HTMLElement;
    }
};

/**
 * 更新滚动位置，使当前激活行保持在视口偏移位置
 */
const updateScroll = (): void => {
    if (currentIndex.value < 0 || !containerRef.value) return;

    const containerHeight = containerRef.value.clientHeight;
    const activeLineEl = lineRefs.value[currentIndex.value];

    if (activeLineEl) {
        const lineOffsetTop = activeLineEl.offsetTop;
        const lineHeight = activeLineEl.clientHeight;
        // 计算位移：视口高度 * 偏移百分比 - 元素距离顶部高度 - 元素自身高度的一半（居中对齐）
        translateY.value = (containerHeight * props.viewOffset) - lineOffsetTop - (lineHeight / 2);
    }
};

/**
 * 核心逻辑：播放下一句
 */
const playNext = (): void => {
    if (timer) clearTimeout(timer);

    // 检查是否已达到最后一句
    if (currentIndex.value >= lyrics.value.length - 1) {
        emit('complete');
        return;
    }

    currentIndex.value++;
    updateScroll();

    const currentLine = lyrics.value[currentIndex.value];

    if (currentLine.audio && audioInstance) {
        // 存在音频：加载并播放
        audioInstance.src = currentLine.audio;
        audioInstance.play().catch(() => {
            // 若浏览器拦截自动播放，回退到定时器模式
            timer = setTimeout(playNext, currentLine.duration);
        });
    } else {
        // 无音频：直接根据 duration 定时切换
        timer = setTimeout(playNext, currentLine.duration);
    }
};

/**
 * 用户交互：点击开始播放
 */
const startPlayback = (): void => {
    isStarted.value = true;
    emit('start');
    playNext();
};

// --- 生命周期 ---
onMounted(() => {
    audioInstance = new Audio();

    // 监听音频播放结束，自动进入下一句
    audioInstance.onended = () => playNext();

    // 监听音频加载错误，回退到定时器模式
    audioInstance.onerror = () => {
        const currentLine = lyrics.value[currentIndex.value];
        timer = setTimeout(playNext, currentLine?.duration || props.defaultDuration);
    };

    // 场景：如果没有任何音频，无需等待用户交互，直接开始
    if (!hasAudio.value) {
        isStarted.value = true;
        playNext();
    }
});

onUnmounted(() => {
    if (timer) clearTimeout(timer);
    if (audioInstance) {
        audioInstance.pause();
        audioInstance = null;
    }
});

// 监听数据变化，重置状态
watch(() => props.data, () => {
    isStarted.value = !hasAudio.value;
    currentIndex.value = -1;
    translateY.value = 0;
    if (isStarted.value) playNext();
}, { deep: true });
</script>

<style scoped>
.lyrics-container {
    width: 100%;
    height: 100%;
    min-height: 300px;
    overflow: hidden;
    position: relative;
    /* 上下边缘虚化效果 */
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
    mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
}

.play-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(0, 0, 0, 0.4);
}

.glass-button {
    padding: 14px 32px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: 50px;
    color: #fff;
    font-size: 1.1rem;
    letter-spacing: 2px;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 10px;
    transition: all 0.3s ease;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}

.glass-button:active {
    transform: scale(0.95);
    background: rgba(255, 255, 255, 0.2);
}

.glass-button .icon {
    font-size: 0.9rem;
}

.lyrics-wrapper {
    padding: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    will-change: transform;
}

.lyric-line {
    padding: 18px 40px;
    font-size: 1.1rem;
    color: rgba(255, 255, 255, 0.25);
    text-align: center;
    transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    width: 100%;
    box-sizing: border-box;
    line-height: 1.6;
}

.lyric-line.active {
    color: #ffffff;
    font-size: 1.5rem;
    font-weight: 500;
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}

@media (max-width: 768px) {
    .lyric-line {
        padding: 14px 20px;
        font-size: 1rem;
    }

    .lyric-line.active {
        font-size: 1.25rem;
    }
}
</style>
