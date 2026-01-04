<template>
    <div class="ancient-envelope-final" :style="containerVars">
        <audio ref="audioPlayer" @ended="onAudioEnded" playsinline></audio>

        <div class="scene-stage">
            <!-- 1. 信封主体 (逻辑保持稳固) -->
            <div class="envelope-pocket" :class="{ 'env-fade-out': isFullyCentered }">
                <div class="env-part env-back"></div>
                <div class="env-part env-front" @click="handleOpen">
                    <div class="red-box-main" :class="{ 'mini': isOpened }">
                        <div class="calligraphy">亲启</div>
                    </div>
                </div>
            </div>

            <!-- 2. 信纸主体 (保持：格线随列增长、负坐标滚动定位、原生不重叠流) -->
            <div v-if="isOpened" class="letter-paper"
                :class="{ 'is-rising': isLetterUp, 'is-zoom-center': isFullyCentered }">
                <div class="paper-border-outer">
                    <div class="paper-border-inner" ref="scrollContainer" @touchstart="handleTouchStart">

                        <!-- 内容容器：真正原生竖排流 -->
                        <div class="paper-content-area">
                            <!-- 段落块 -->
                            <div v-for="(p, index) in renderedParagraphs" :key="index" class="para-column-group"
                                :style="getParaStyle(p.align)">
                                <!-- 每一个字 -->
                                <span v-for="(char, cIdx) in p.displayed" :key="cIdx" class="v-char">{{ char }}</span>

                                <!-- 光标 -->
                                <span v-if="isTyping && index === renderedParagraphs.length - 1"
                                    class="v-cursor">|</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="paper-bg-img" v-if="images.length">
                    <div class="img-fill" :style="{ backgroundImage: `url(${images[currentImgIndex]})` }"></div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick } from 'vue';

const props = defineProps({
    paragraphs: { type: Array, default: () => [] },
    speed: { type: Number, default: 100 },
    images: { type: Array, default: () => [] }
});

const isOpened = ref(false);
const isLetterUp = ref(false);
const isFullyCentered = ref(false);
const isTyping = ref(false);
const currentImgIndex = ref(0);
const renderedParagraphs = reactive([]);
const audioPlayer = ref(null);
const scrollContainer = ref(null);

let audioResolve = null;
let isUserInteracting = false;

const containerVars = computed(() => ({
    '--speed': `${props.speed}ms`
}));

/**
 * 核心对齐逻辑修正：
 * 根据用户反馈，直接反转 top 和 bottom 的 CSS 实现逻辑
 */
const getParaStyle = (align) => {
    let ta = 'center';

    if (align === 'center') {
        ta = 'center';
    } else if (align === 'top') {
        // 之前 top 表现为底部，所以这里改用之前的底部实现 (left)
        ta = 'left';
    } else if (align === 'bottom') {
        // 之前 bottom 表现为顶部，所以这里改用之前的顶部实现 (right)
        ta = 'right';
    }

    return { textAlign: ta };
};

const handleOpen = async () => {
    if (isOpened.value) return;
    isOpened.value = true;
    if (audioPlayer.value) {
        audioPlayer.value.load();
        audioPlayer.value.play().then(() => audioPlayer.value.pause()).catch(() => { });
    }
    setTimeout(() => { isLetterUp.value = true; }, 50);
    setTimeout(() => { isFullyCentered.value = true; }, 1200);
    setTimeout(() => { startTypewriting(); }, 2500);
};

const startTypewriting = async () => {
    isTyping.value = true;
    for (const p of props.paragraphs) {
        if (p.delay) await wait(p.delay);
        const currentP = reactive({ ...p, displayed: '' });
        renderedParagraphs.push(currentP);

        if (p.audio) playAudio(p.audio);

        for (const char of p.content) {
            currentP.displayed += char;
            await nextTick();
            autoScroll();
            await wait(props.speed);
        }
    }
    isTyping.value = false;
};

const wait = (ms) => new Promise(r => setTimeout(r, ms));
const playAudio = (src) => {
    audioPlayer.value.src = src;
    audioPlayer.value.play().catch(() => { });
};
const onAudioEnded = () => { };

const autoScroll = () => {
    if (isUserInteracting || !scrollContainer.value) return;
    // 竖排模式下，最新打字位置在左侧，坐标为负
    scrollContainer.value.scrollLeft = -scrollContainer.value.scrollWidth;
};

const handleTouchStart = () => {
    isUserInteracting = true;
    setTimeout(() => { isUserInteracting = false; }, 3000);
};
</script>

<style scoped>
.ancient-envelope-final {
    position: relative;
    width: 100vw;
    height: 100vh;
    background-color: #1a1612 !important;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: "STKaiti", "KaiTi", "Noto Serif SC", serif !important;
}

.scene-stage {
    position: relative;
    width: 320px;
    height: 500px;
    display: flex;
    justify-content: center;
    align-items: center;
}

/* --- 信封部分 --- */
.envelope-pocket {
    position: absolute;
    width: 210px;
    height: 380px;
    z-index: 10;
    transition: opacity 1s ease, transform 1s ease;
}

.env-fade-out {
    opacity: 0;
    transform: translateY(80px);
    pointer-events: none;
}

.env-part {
    position: absolute;
    inset: 0;
    border-radius: 2px;
}

.env-back {
    background-color: #b89a6b !important;
    z-index: 1;
}

.env-front {
    background-color: #d2b48c !important;
    z-index: 11;
    display: flex;
    justify-content: center;
    align-items: center;
    box-shadow: 0 -5px 20px rgba(0, 0, 0, 0.3);
}

.red-box-main {
    width: 70px;
    height: 240px;
    border: 3px solid #a32e2e !important;
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
}

.red-box-main::after {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px solid #a32e2e !important;
}

.calligraphy {
    writing-mode: vertical-rl;
    font-size: 32px !important;
    color: #1a1a1a !important;
    font-weight: bold !important;
    letter-spacing: 12px;
}

/* --- 信纸部分 --- */
.letter-paper {
    position: absolute;
    width: 190px;
    height: 360px;
    background-color: #fdf5e6 !important;
    z-index: 5;
    padding: 15px;
    box-sizing: border-box;
    opacity: 0;
    transform: translateY(30px);
    transition: all 1s cubic-bezier(0.34, 1, 0.64, 1);
}

.is-rising {
    opacity: 1;
    transform: translateY(-180px);
}

.is-zoom-center {
    position: fixed !important;
    top: 50% !important;
    left: 50% !important;
    width: 90vw !important;
    height: 82vh !important;
    max-width: 420px;
    transform: translate(-50%, -50%) !important;
    z-index: 100;
}

.paper-border-outer {
    height: 100%;
    border: 2px solid #a32e2e !important;
    padding: 2px;
}

.paper-border-inner {
    position: relative;
    height: 100%;
    border: 1px solid #a32e2e !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    scrollbar-width: none;
    -webkit-overflow-scrolling: touch;
}

.paper-border-inner::-webkit-scrollbar {
    display: none;
}

/* 内容容器：原生竖排流 */
.paper-content-area {
    writing-mode: vertical-rl !important;
    text-orientation: upright !important;
    height: 100%;
    min-width: 100%;
    line-height: 40px !important;
    font-size: 24px !important;
    color: #1a1a1a !important;
    /* 动态格线 */
    background-image: linear-gradient(to left, rgba(163, 46, 46, 0.2) 1px, transparent 1px) !important;
    background-size: 40px 100% !important;
    background-position: right top !important;
    background-repeat: repeat-x !important;
}

.para-column-group {
    display: block;
    min-height: 100%;
    padding: 0;
    margin: 0;
    word-break: break-all;
}

.v-char {
    display: inline;
    color: #1a1a1a !important;
    font-weight: 600 !important;
}

.v-cursor {
    display: inline-block;
    color: #a32e2e !important;
    font-weight: bold;
    animation: blink 0.8s infinite;
    transform: translateY(-4px);
}

@keyframes blink {
    50% {
        opacity: 0;
    }
}

.paper-bg-img {
    position: absolute;
    inset: 0;
    z-index: 0;
    opacity: 0.15 !important;
    pointer-events: none;
}

.img-fill {
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
}
</style>
