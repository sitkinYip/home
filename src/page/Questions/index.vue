<template>
    <div class="adventure-container" v-if="qaInfo">
        <!-- 动态背景层 -->
        <div class="magic-bg"></div>
        <div class="overlay"></div>

        <VideoPlayer ref="videoPlayerRef" />

        <div class="quest-wrapper">
            <!-- 英雄状态栏 -->
            <header class="hero-header" @click="handleHeaderClick">
                <div class="hero-avatar-wrap">
                    <div class="avatar-glow"></div>
                    <div class="avatar-inner">
                        <el-icon :size="'30vpx'" color="#ffd700">
                            <Lock v-if="!isBinGo" />
                            <MagicStick v-else />
                        </el-icon>
                    </div>
                </div>
                <div class="hero-info">
                    <h2 class="hero-name">{{ currentUserDisplay }}</h2>
                    <div class="level-badge">RANK: {{ currentStep }} · 探索者</div>
                </div>
            </header>

            <!-- 魔法交互面板 -->
            <main class="magic-panel quest-card" :class="{ 'shake-animation': isError }" ref="questCard">
                <div class="q_title_row">
                    <span class="ornament"></span>
                    <span class="title_text">当前谜题</span>
                    <span class="ornament"></span>
                </div>

                <!-- 问题内容 -->
                <div class="qa_content_text">
                    <div v-for="(item, index) in qaInfo.question" :key="index" class="question-item">
                        <span v-if="typeof item === 'string'" class="text-glow">{{ item }}</span>
                        <span v-else class="text-glow">{{ item.text }}</span>

                        <template v-if="typeof item !== 'string' && item.img">
                            <div class="image-container">
                                <el-image :src="item.img" :preview-src-list="[item.img]" class="quest-img" />
                            </div>
                        </template>

                        <div v-if="typeof item !== 'string' && item.tips" class="tips-trigger">
                            <el-popover title="魔法提示" class="tips-pop" :content="item.tips" trigger="hover"
                                placement="top">
                                <template #reference>
                                    <el-icon class="icon-pulse">
                                        <QuestionFilled />
                                    </el-icon>
                                </template>
                            </el-popover>
                        </div>
                    </div>
                </div>

                <!-- 答题输入区 -->
                <div class="interaction-zone">
                    <div class="input-wrapper" :class="{ 'is-focus': isInputFocus, 'is-error': isError }">
                        <input v-model="userInput" class="magic-input"
                            :placeholder="qaInfo.placeholder || '在此刻下你的答案...'" @focus="isInputFocus = true"
                            @blur="isInputFocus = false" @keyup.enter="onConfirmAnswer" />
                    </div>
                    <button @click="onConfirmAnswer" class="magic-btn" :class="{
                        'btn-success': isBinGo,
                        'btn-error': isError
                    }">
                        <span class="btn-content">
                            {{ isBinGo ? '挑战成功' : (isError ? '咒语错误' : '确认答案') }}
                        </span>
                        <div class="btn-flare"></div>
                    </button>
                </div>
            </main>

            <!-- 线索展示（答对后呈现） -->
            <transition name="scroll-reveal">
                <div class="magic-panel clue-card" v-show="isBinGo">
                    <div class="clue-header">获取的神谕线索</div>
                    <div class="as_content">
                        <div class="as_item" v-for="(item, index) in qaInfo.thread" :key="index">
                            <span v-if="item.type === 'text'" class="clue-text">{{ item.content }}</span>

                            <el-button v-if="item.type === 'url'" @click="openPage(item.url)" class="clue-btn portal"
                                type="primary" round>
                                传送门: {{ item.content }}
                            </el-button>

                            <div class="img_view" v-if="item.type === 'img'">
                                <template v-if="item.content">
                                    <el-button @click="showPreview = true" type="success" class="clue-btn" round>
                                        查看密卷: {{ item.content }}
                                    </el-button>
                                    <el-image-viewer v-if="showPreview" :url-list="item.imgList || [item.url!]"
                                        @close="showPreview = false" />
                                </template>
                                <el-image v-else :src="item.url" :preview-src-list="item.imgList || [item.url!]"
                                    class="clue-img" />
                            </div>

                            <el-button v-if="item.type === 'video'" type="warning" @click="openVideo(item.url!)"
                                class="clue-btn" round>
                                回溯影像: {{ item.content }}
                            </el-button>
                        </div>
                    </div>
                </div>
            </transition>
        </div>
    </div>

    <div v-else class="loading-screen">
        <div class="loader-spell"></div>
        <p>正在吟唱召唤咒语...</p>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import { ElMessage } from "element-plus";
import { Lock, QuestionFilled, MagicStick } from "@element-plus/icons-vue";
import gsap from "gsap";
import confetti from "canvas-confetti";

import {
    getQueryParam, isTimeReached, checkAnswer,
    filterSpecialChars,
    HeaderClickCounter,
} from "@/utils/qa/questions";
import { fetchLevels } from "@/server/qa";
import { LevelRecord } from "@/types/qa";
import VideoPlayer from "@/components/VideoPlayer.vue";

const scriptId = 'unique-script-id';
const scriptUrl = "https://cdn.jsdelivr.net/gh/Ukenn2112/UkennWeb@3.0/index/web.js";

const videoPlayerRef = ref<any>(null);
const userInput = ref("");
const isBinGo = ref(false);
const showPreview = ref(false);
const isInputFocus = ref(false);
const isError = ref(false); // 错误视觉状态
const allLevels = ref<LevelRecord[]>([]);
const qaInfo = ref<LevelRecord | null>(null);

const qaIndexStr = getQueryParam("qa")?.[0] || "1";
const currentStep = parseInt(qaIndexStr);
const userId = getQueryParam("user")?.[0] || "";
const userName = ref("旅行者");

const currentUserDisplay = computed(() => `${userName.value}`);

const initData = async () => {
    const levels = await fetchLevels();
    allLevels.value = levels;
    const currentLevel = levels.find(l => l.step === currentStep);
    if (currentLevel) {
        qaInfo.value = currentLevel;
        userName.value = qaInfo.value.userName || "旅行者";
        checkPersistentProgress();
        // 初始进场动画
        nextTick(() => {
            gsap.from(".quest-card", { duration: 1, y: "50px", opacity: 0, ease: "power4.out" });
            gsap.from(".hero-header", { duration: 0.8, x: "-30px", opacity: 0, delay: 0.2 });
        });
    } else {
        ElMessage.error("未找到关卡信息");
    }
};

const checkPersistentProgress = () => {
    const cacheKey = `qaIndex${currentStep}${userId}${qaInfo.value?.updated || ""}`;
    const preData = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    if (preData?.type === "bingo") {
        isBinGo.value = true;
        userInput.value = preData.input || "";
    }
};

const talk = (msg: string, dur: number = 0): Promise<void> => {
    return new Promise((resolve) => {
        ElMessage({ message: msg, grouping: true, duration: dur, type: "info" });
        setTimeout(resolve, dur + 200);
    });
};

const onConfirmAnswer = async () => {
    if (isBinGo.value || !qaInfo.value) return;
    if (isError.value) return;
    const { startTime, endTime } = qaInfo.value || {};
    if (startTime && !isTimeReached(startTime)) {
        ElMessage.error("冒险还未开始 请耐心等待~");
        return;
    }
    if (endTime && isTimeReached(endTime)) {
        ElMessage.error("冒险已结束 请留意下一次探险公告~");
        return;
    }

    const ans = userInput.value.trim();
    const isCorrect = (ans === qaInfo.value.answer) || checkAnswer(ans, qaInfo.value.answer);

    if (isCorrect) {
        handleSuccess();
    } else {
        triggerErrorEffect();
        const filteredInput = filterSpecialChars(userInput.value);
        if (userInput.value.trim()) {
            reportAction(`答错了第${currentStep}题，回答的是${filteredInput}`, "错误通知");
        }
        ElMessage.error("咒语无效，请再次思索...");
    }
};

const triggerErrorEffect = () => {
    isError.value = false; // 先重置，确保能重复触发 CSS 动画
    // gsap.to(".quest-card", { duration: 0.1, x: 10, repeat: 20, yoyo: true });
    setTimeout(() => {
        isError.value = true;
        setTimeout(() => {
            isError.value = false;
        }, 800); // 状态保持时长
    }, 20);
};

const handleSuccess = async () => {
    if (!qaInfo.value) return;

    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#ffd700', '#ffffff', '#8a2be2']
    });

    localStorage.setItem(`qaIndex${currentStep}${userId}${qaInfo.value?.updated || ""}`, JSON.stringify({
        type: "bingo",
        date: Date.now(),
        input: userInput.value
    }));

    isBinGo.value = true;
    const autoPlayVideo = qaInfo.value.thread.find(t => t.type === 'video' && t.state === 'ckickplay');
    if (autoPlayVideo && videoPlayerRef.value) {
        openVideo(autoPlayVideo.url!);
    }

    reportAction(`答对了第${currentStep}题，答案是${userInput.value}`, "成功通知");

    if (currentStep === allLevels.value.length) {
        await talk(`伟大的英雄，你已破除所有迷雾！`, 1000);
        loadScript();
    } else {
        await talk("契约达成！真理已现。", 1000);
    }
};

const reportAction = (content: string, title: string) => {
    const nickName = qaInfo.value?.userName || "旅行者";
    fetch(`https://api.chuckfang.com/4acc3779/${title} -- 来自sitkin.top/${nickName}${content}`)
        .catch(e => console.error("Report failed", e));
};

const loadScript = () => {
    if (document.getElementById(scriptId)) return;
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = scriptUrl;
    script.async = true;
    document.body.appendChild(script);
};

const openVideo = (url: string) => videoPlayerRef.value?.open(url);
const openPage = (url?: string) => url && window.open(url);
const handleHeaderClick = () => HeaderClickCounter();

onMounted(initData);
onBeforeUnmount(() => {
    const script = document.getElementById(scriptId);
    if (script) script.remove();
});
</script>

<style lang="scss" scoped>
@use "./style.scss";
</style>
