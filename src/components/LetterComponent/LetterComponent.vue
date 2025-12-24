<template>
    <div :class="['letter-container', styleType, { 'is-open': isOpen }]">
        <div class="envelope-wrapper" @click="openLetter">
            <div class="envelope">
                <div class="flap"></div>
                <div class="pocket"></div>

                <div class="letter-paper" @click.stop>
                    <!-- 背景图 -->
                    <div class="bg-carousel" v-if="images && images.length > 0">
                        <transition-group name="fade">
                            <div v-for="(img, index) in images" :key="img" v-show="currentImgIndex === index"
                                class="bg-img" :style="{ backgroundImage: `url(${img})` }"></div>
                        </transition-group>
                    </div>

                    <!-- 滚动内容区 -->
                    <div class="content-wrapper" ref="scrollContainer" @touchstart="onUserTouch">
                        <div class="text-content">
                            <!-- 这里是关键：通过控制每一行的高度和基线 -->
                            <div v-for="(p, index) in displayedParagraphs" :key="index" class="paragraph-row"
                                :style="{ textAlign: p.align || 'left' }">
                                <p class="line-text"
                                    :style="{ color: (customTextColor || 'var(--text-color)') + ' !important' }">
                                    {{ p.currentText }}
                                    <span class="cursor" v-if="isTyping && activeParagraphIndex === index"
                                        :style="{ background: (customTextColor || 'var(--text-color)') + ' !important' }"></span>
                                </p>
                            </div>
                            <div class="extra-space"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="hint" v-if="!isOpen">点击开启信件</div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, nextTick, onUnmounted } from 'vue';

const props = defineProps({
    paragraphs: {
        type: Array,
        default: () => [
            { content: '见字如晤：', align: 'left' },
            { content: '这是一段居中的诗词', align: 'center', delay: 500 },
            { content: '海内存知己，天涯若比邻。', align: 'center' },
            { content: '最后是我的署名。', align: 'left', delay: 1000 },
            { content: '--- 你的朋友 SITKIN', align: 'right' }
        ]
    },
    speed: { type: Number, default: 80 },
    styleType: { type: String, default: 'ancient' },
    images: { type: Array, default: () => [] },
    carouselInterval: { type: Number, default: 5000 },
    customTextColor: { type: String, default: '' }
});

const isOpen = ref(false);
const displayedParagraphs = ref([]);
const isTyping = ref(false);
const activeParagraphIndex = ref(0);
const currentImgIndex = ref(0);
const scrollContainer = ref(null);
let carouselTimer = null;
let isUserInteracting = false;

watch(displayedParagraphs, () => {
    if (!isTyping.value || isUserInteracting) return;
    nextTick(() => {
        const el = scrollContainer.value;
        if (el) {
            const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 120;
            if (atBottom) {
                el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
            }
        }
    });
}, { deep: true });

const onUserTouch = () => {
    if (isTyping.value) {
        isUserInteracting = true;
        clearTimeout(window.scrollResetTimer);
        window.scrollResetTimer = setTimeout(() => { isUserInteracting = false; }, 3000);
    }
};

const lockBodyScroll = () => {
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
};

const unlockBodyScroll = () => {
    document.body.style.overflow = '';
    document.body.style.touchAction = '';
};

const typeText = async () => {
    isTyping.value = true;
    for (let i = 0; i < props.paragraphs.length; i++) {
        activeParagraphIndex.value = i;
        const config = props.paragraphs[i];
        displayedParagraphs.value.push({ currentText: '', align: config.align || 'left' });
        if (config.delay) await new Promise(resolve => setTimeout(resolve, config.delay));
        const text = config.content || '';
        for (let char of text) {
            displayedParagraphs.value[i].currentText += char;
            await new Promise(resolve => setTimeout(resolve, props.speed));
        }
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    isTyping.value = false;
};

const openLetter = () => {
    if (isOpen.value) return;
    isOpen.value = true;
    lockBodyScroll();
    setTimeout(() => {
        typeText();
        if (props.images.length > 1) {
            carouselTimer = setInterval(() => {
                currentImgIndex.value = (currentImgIndex.value + 1) % props.images.length;
            }, props.carouselInterval);
        }
    }, 1000);
};

onUnmounted(() => {
    clearInterval(carouselTimer);
    unlockBodyScroll();
});
</script>

<style scoped>
.letter-container {
    --paper-bg: #fdf5e6;
    --line-color: rgba(0, 0, 0, 0.08);
    --text-color: #222;
    --envelope-color: #c0392b;
    --flap-color: #a5281b;
    /* 定义全局行高变量，方便多处同步 */
    --letter-line-height: 36px;

    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    background: #f0f2f5;
    z-index: 2000;
    overflow: hidden;
}

.modern {
    --paper-bg: #ffffff;
    --line-color: #eef2f6;
    --text-color: #2c3e50;
    --envelope-color: #353b48;
    --flap-color: #2f3640;
    font-family: 'Helvetica Neue', Arial, sans-serif;
}

.ancient {
    --paper-bg: #f4ecd8;
    --line-color: rgba(139, 69, 19, 0.12);
    --text-color: #3d2b1f;
    --envelope-color: #8b0000;
    --flap-color: #6e0000;
    font-family: "STKaiti", "KaiTi", serif;
}

.envelope-wrapper {
    position: relative;
    width: min(400px, 85vw);
    height: min(260px, 55vw);
}

.envelope {
    position: relative;
    width: 100%;
    height: 100%;
    background-color: var(--envelope-color);
}

.flap {
    position: absolute;
    top: 0;
    width: 0;
    height: 0;
    border-left: calc(min(400px, 85vw) / 2) solid transparent;
    border-right: calc(min(400px, 85vw) / 2) solid transparent;
    border-top: calc(min(260px, 55vw) / 2) solid var(--flap-color);
    z-index: 3;
    transform-origin: top;
    transition: transform 0.6s ease-in-out;
}

.pocket {
    position: absolute;
    bottom: 0;
    width: 100%;
    height: 100%;
    background-color: var(--envelope-color);
    border-left: calc(min(400px, 85vw) / 2) solid transparent;
    border-right: calc(min(400px, 85vw) / 2) solid transparent;
    border-bottom: calc(min(260px, 55vw) / 1.8) solid var(--flap-color);
    z-index: 2;
}

.letter-paper {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    width: 94%;
    bottom: 10px;
    height: 80%;
    background-color: var(--paper-bg);
    z-index: 1;
    transition: all 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    overflow: hidden;
}

.is-open .letter-paper {
    z-index: 4;
    height: calc(50vh + 130px - 70px);
    max-height: 600px;
    bottom: 30px;
    box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.2);
}

.content-wrapper {
    width: 100%;
    height: 100%;
    padding: 0px 25px;
    /* 顶部padding取消，改用text-content控制 */
    box-sizing: border-box;
    overflow-y: auto !important;
    -webkit-overflow-scrolling: touch;

    /* 关键点 1：行高与渐变背景大小完全一致 */
    line-height: var(--letter-line-height);
    background-image: repeating-linear-gradient(transparent,
            transparent calc(var(--letter-line-height) - 1px),
            var(--line-color) calc(var(--letter-line-height) - 1px),
            var(--line-color) var(--letter-line-height));
    background-attachment: local;
    /* 关键点 2：背景起始位置偏移，确保第一行线出现在第一行文字下方 */
    background-position: 0 0px;
}

.content-wrapper::-webkit-scrollbar {
    display: none;
}

.text-content {
    position: relative;
    z-index: 5;
    /* 关键点 3：通过 padding-top 微调文字在行线上的垂直位置 */
    padding-top: 4px;
}

.paragraph-row {
    width: 100%;
}

.line-text {
    margin: 0 !important;
    padding: 0 !important;
    font-size: 18px;
    font-weight: 500;
    /* 关键点 4：强制行高同步 */
    line-height: var(--letter-line-height) !important;
    width: 100%;
    white-space: pre-wrap;
    word-break: break-all;
}

.extra-space {
    height: 100px;
}

.bg-carousel {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
    opacity: 0.3;
    pointer-events: none;
}

.bg-img {
    position: absolute;
    width: 100%;
    height: 100%;
    background-size: cover;
    background-position: center;
}

.cursor {
    display: inline-block;
    width: 2px;
    height: 20px;
    vertical-align: middle;
    margin-left: 2px;
    /* 微调光标位置，使其也坐在线上 */
    margin-top: -4px;
    animation: blink 0.8s infinite;
}

@keyframes blink {
    50% {
        opacity: 0;
    }
}

.is-open .flap {
    transform: rotateX(180deg);
    z-index: 0;
}

.hint {
    position: absolute;
    bottom: -50px;
    width: 100%;
    text-align: center;
    color: #666;
    font-size: 14px;
}

@media (max-width: 480px) {
    .line-text {
        font-size: 16px;
    }
}
</style>
