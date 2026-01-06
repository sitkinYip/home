<template>
    <div class="questions-box" v-if="qaInfo">
        <VideoPlayer ref="videoPlayerRef" />

        <div class="ask">
            <!-- 头部交互区域 -->
            <div class="yuan yuan_wz" @click="handleHeaderClick">
                <div class="yuan min"></div>
            </div>
            <div class="lock_icon" @click="handleHeaderClick">
                <el-icon color="#999999" size="25px">
                    <Lock color="#999999" />
                </el-icon>
            </div>

            <div class="q_title">{{ currentUserDisplay }}:</div>

            <!-- 问题渲染区域 -->
            <div class="qa_content_text">
                <div v-for="(item, index) in qaInfo.question" :key="index">
                    {{ typeof item === "string" ? item : item.text }}

                    <template v-if="typeof item !== 'string' && item.img">
                        <el-image :src="item.img" :preview-src-list="[item.img]" show-progress />
                    </template>

                    <div v-if="typeof item !== 'string' && item.tips" class="tips">
                        <el-popover title="提示" :content="item.tips" trigger="hover" placement="top">
                            <template #reference>
                                <el-icon color="#999999">
                                    <QuestionFilled />
                                </el-icon>
                            </template>
                        </el-popover>
                    </div>
                </div>
            </div>
        </div>

        <!-- 答题区域 -->
        <div class="qa_input_box">
            <el-input v-model="userInput" class="qa_input" :placeholder="qaInfo.placeholder || '请输入答案.....'"
                @keyup.enter="onConfirmAnswer" />
        </div>

        <div class="btn_box">
            <el-button @click="onConfirmAnswer" class="btn" color="#2C3E50" type="info">确认答案</el-button>
        </div>

        <!-- 线索展示区域 -->
        <div class="qares">
            <!-- 未答对展示 -->
            <div class="emp" v-show="!isBinGo">
                <div class="icon_emp"></div>
                <div class="text">答对谜题后,这里将展示下一个线索</div>
            </div>

            <!-- 答对后展示线索 -->
            <div class="as_content" v-show="isBinGo">
                <div class="as_item" v-for="(item, index) in qaInfo.thread" :key="index">
                    <!-- 文本线索 -->
                    <span v-if="item.type === 'text'">
                        {{ item.content }}
                    </span>

                    <!-- 链接跳转 -->
                    <el-button v-if="item.type === 'url'" @click="openPage(item.url)" class="url_btn" type="primary">
                        {{ item.content }}
                    </el-button>

                    <!-- 图片/画廊线索 -->
                    <div class="img_view" v-if="item.type === 'img'">
                        <template v-if="item.content">
                            <el-button @click="showPreview = true" type="success">
                                {{ item.content }}
                            </el-button>
                            <el-image-viewer v-if="showPreview" :url-list="item.imgList || [item.url!]"
                                @close="showPreview = false" />
                        </template>
                        <template v-else>
                            <el-image :src="item.url" :preview-src-list="item.imgList || [item.url!]" />
                        </template>
                    </div>

                    <!-- 视频线索 -->
                    <template v-if="item.type === 'video'">
                        <el-button type="warning" @click="openVideo(item.url!)">
                            {{ item.content }}
                        </el-button>
                    </template>
                </div>
            </div>
        </div>
    </div>
    <div v-else class="loading-state">
        <!-- 这里可以放一个 Loading 组件 -->
        正在加载寻宝线索...
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { ElMessage } from "element-plus";
import "element-plus/dist/index.css";
import { Lock, QuestionFilled } from "@element-plus/icons-vue";

// 导入工具函数和类型
import {
    getQueryParam, isTimeReached, checkAnswer,
    filterSpecialChars,
    HeaderClickCounter,
} from "@/utils/qa/questions";
import { fetchLevels } from "@/server/qa";
import { LevelRecord } from "@/types/qa";
import VideoPlayer from "@/components/VideoPlayer.vue";

// --- 状态定义 ---
const scriptId = 'unique-script-id';
const scriptUrl = "https://cdn.jsdelivr.net/gh/Ukenn2112/UkennWeb@3.0/index/web.js";

const videoPlayerRef = ref<any>(null);
const userInput = ref("");
const isBinGo = ref(false);
const showPreview = ref(false);
const allLevels = ref<LevelRecord[]>([]); // 存储从 API 获取的所有关卡
const qaInfo = ref<LevelRecord | null>(null); // 当前关卡数据

// --- 参数获取 ---
const qaIndexStr = getQueryParam("qa")?.[0] || "1";
const currentStep = parseInt(qaIndexStr); // 将 URL 的 qa 转换为数字 step
const userId = getQueryParam("user")?.[0] || "";
const userName = ref(qaInfo.value?.userName || "旅行者");

const currentUserDisplay = computed(() => `${userName.value}的寻宝游戏`);

/**
 * 核心：加载关卡数据并匹配当前 Step
 */
const initData = async () => {
    // 1. 获取动态辅助资源 (tips等)

    // 2. 从 API 获取所有关卡数据
    const levels = await fetchLevels();
    allLevels.value = levels;

    // 3. 根据 step 寻找当前关卡内容
    const currentLevel = levels.find(l => l.step === currentStep);
    if (currentLevel) {
        qaInfo.value = currentLevel;
        userName.value = qaInfo.value.userName || "旅行者";
        checkPersistentProgress(); // 检查本地存储
    } else {
        ElMessage.error("未找到关卡信息");
    }
};

/**
 * 检查本地缓存的进度
 */
const checkPersistentProgress = () => {
    const cacheKey = `qaIndex${currentStep}${userId}`;
    const preData = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    if (preData?.type === "bingo") {
        isBinGo.value = true;
        userInput.value = preData.input || "";
    }
};

// --- 逻辑处理 ---

const talk = (msg: string, dur: number = 0): Promise<void> => {
    return new Promise((resolve) => {
        ElMessage({ message: msg, grouping: true, duration: dur, type: "info" });
        setTimeout(resolve, dur + 200);
    });
};

/**
 * 判断答案是否正确
 */
const validateAnswer = (): boolean => {
    if (!qaInfo.value) return false;
    const ans = userInput.value.trim();
    const correctAns = qaInfo.value.answer;

    // 1. 开放性问题判断
    const isOpenEnded = (qaInfo.value as any).isOpenEndedQuestions; // 如果 API 中有这个字段
    if (ans.length > 3 && isOpenEnded) return true;

    // 2. 字符串全匹配
    if (ans === correctAns) return true;

    // 3. 复杂工具函数判断 (旧逻辑保留)
    if (checkAnswer(ans, correctAns)) return true;

    // 4. 关键词包含模式 (如果有)
    // 注意：这里需要确保服务端返回的数据结构支持这类判断
    return false;
};

/**
 * 确认答案点击事件
 */
const onConfirmAnswer = async () => {
    if (isBinGo.value || !qaInfo.value) return;

    const isCorrect = validateAnswer();
    const filteredInput = filterSpecialChars(userInput.value);

    // 答错上报
    if (!isCorrect && userInput.value.trim()) {
        reportAction(`答错了第${currentStep}题，回答的是${filteredInput}`, "错误通知");
    }

    // 时间校验
    const isTest = getQueryParam("test")?.[0] === "1";
    const startDate = "2025/05/19 15:00:00";
    if (!isTest && !isTimeReached(startDate)) {
        return talk(`游戏还未开始哦,耐心等待 ${startDate}`, 3000);
    }

    if (isCorrect) {
        handleSuccess();
    } else {
        handleFailure();
    }
};

/**
 * 答对后的逻辑处理
 */
const handleSuccess = async () => {
    if (!qaInfo.value) return;

    // 1. 记录本地存储
    localStorage.setItem(`qaIndex${currentStep}${userId}`, JSON.stringify({
        type: "bingo",
        date: Date.now(),
        input: userInput.value
    }));

    isBinGo.value = true;

    // 2. 视频自动播放逻辑
    const autoPlayVideo = qaInfo.value.thread.find(t => t.type === 'video' && t.state === 'ckickplay');
    if (autoPlayVideo && videoPlayerRef.value) {
        openVideo(autoPlayVideo.url!);
    }

    // 3. 答对上报
    reportAction(`答对了第${currentStep}题，答案是${userInput.value}`, "成功通知");

    // 4. 检查是否是最后一关
    const isLastLevel = currentStep === allLevels.value.length;
    if (isLastLevel) {
        await talk(`恭喜你，你已通过所有问题，请查看最终线索`, 1000);
        loadScript();
    } else {
        await talk("BinGo！恭喜你答对了", 1000);
        await talk("请查看下一个线索", 1000);
        await talk("继续冒险吧 ~", 1000);
    }
};

/**
 * 答错后的逻辑
 */
const handleFailure = async () => {
    talk("不对哦~ 再想想~~", 1000);
};

/**
 * 动作上报 (打点)
 */
const reportAction = (content: string, title: string) => {
    const nickName = qaInfo.value?.userName || "旅行者";
    fetch(`https://api.chuckfang.com/4acc3779/${title} -- 来自sitkin.top/${nickName}${content}`)
        .catch(e => console.error("Report failed", e));
};

// --- 基础功能 ---

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
/* 原有样式保持不变，确保 vpx 单位正常运行 */
@use "./style.scss";
</style>
