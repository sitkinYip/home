<template>
    <div class="lyrics-container" ref="containerRef">
        <!-- 仅在有音频且未开始时显示 -->
        <Transition name="fade">
            <div v-if="hasAudio && !isStarted" class="play-overlay">
                <button class="glass-button" @click="startPlayback">
                    <span class="icon">▶</span>
                    {{ startText }}
                </button>
            </div>
        </Transition>

        <div class="lyrics-wrapper" :style="wrapperStyle">
            <div v-for="(item, index) in lyrics" :key="index"
                :class="['lyric-line', { active: currentIndex === index }]"
                :ref="el => { if (el) lineRefs[index] = el }">
                {{ item.text }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';

const props = defineProps({
    data: {
        type: Array,
        required: true,
        default: () => []
    },
    defaultDuration: {
        type: Number,
        default: 3000
    },
    // 开始按钮文案
    startText: {
        type: String,
        default: '开始播放'
    },
    viewOffset: {
        type: Number,
        default: 0.4
    }
});

const emit = defineEmits(['complete', 'start']);

const currentIndex = ref(-1);
const containerRef = ref(null);
const lineRefs = ref([]);
const translateY = ref(0);
const isStarted = ref(false);

let timer = null;
let audioInstance = null;

// 判断数据中是否包含至少一个音频文件
const hasAudio = computed(() => {
    return props.data.some(item => !!item.audio);
});

const lyrics = computed(() => {
    return props.data.map(item => ({
        text: item.text,
        duration: item.duration || props.defaultDuration,
        audio: item.audio || null
    }));
});

const wrapperStyle = computed(() => ({
    transform: `translateY(${translateY.value}px)`,
    transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1)' // 更平滑的曲线
}));

onMounted(() => {
    audioInstance = new Audio();
    audioInstance.onended = () => playNext();
    audioInstance.onerror = () => {
        const currentLine = lyrics.value[currentIndex.value];
        timer = setTimeout(playNext, currentLine?.duration || props.defaultDuration);
    };

    // 如果没有音频，直接开始
    if (!hasAudio.value) {
        isStarted.value = true;
        playNext();
    }
});

const startPlayback = () => {
    isStarted.value = true;
    emit('start');
    playNext();
};

const playNext = () => {
    if (timer) clearTimeout(timer);

    if (currentIndex.value >= lyrics.value.length - 1) {
        emit('complete');
        return;
    }

    currentIndex.value++;
    updateScroll();

    const currentLine = lyrics.value[currentIndex.value];

    if (currentLine.audio) {
        audioInstance.src = currentLine.audio;
        audioInstance.play().catch(() => {
            // 捕获自动播放拦截
            timer = setTimeout(playNext, currentLine.duration);
        });
    } else {
        timer = setTimeout(playNext, currentLine.duration);
    }
};

const updateScroll = () => {
    if (currentIndex.value < 0 || !containerRef.value) return;
    const containerHeight = containerRef.value.clientHeight;
    const activeLineEl = lineRefs.value[currentIndex.value];
    if (activeLineEl) {
        const lineOffsetTop = activeLineEl.offsetTop;
        const lineHeight = activeLineEl.clientHeight;
        translateY.value = (containerHeight * props.viewOffset) - lineOffsetTop - (lineHeight / 2);
    }
};

onUnmounted(() => {
    clearTimeout(timer);
    if (audioInstance) {
        audioInstance.pause();
        audioInstance = null;
    }
});

watch(() => props.data, (newVal) => {
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
    /* 上下边缘虚化 */
    -webkit-mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
    mask-image: linear-gradient(to bottom, transparent, black 15%, black 85%, transparent);
}

/* 液态玻璃/高斯模糊遮罩层 */
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
    /* 核心：高斯模糊 */
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    background: rgba(0, 0, 0, 0.4);
}

/* 玻璃质感按钮 */
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

/* 歌词内容 */
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
    /* 略带外发光 */
    text-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
}

/* 过渡动画 */
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
