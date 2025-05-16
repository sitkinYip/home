<template>
    <div class="questions-box">
        <div class="ask">
            <div class="yuan yuan_wz">
                <div class="yuan min"></div>
            </div>
            <!-- <div class="icon_box"></div> -->
            <div class="lock_icon">
                <el-icon color="#999999" size="25px">
                    <Lock color="#999999" />
                </el-icon>
            </div>
            <div class="q_title">{{ userName }}寻宝游戏:</div>
            <div class="qa_content_text">
                <div v-for="(item, index) in qaInfo.question" :key="index">{{ item?.text || item }}
                    <div class="tips">
                        <el-popover title="提示" :content="item.tips" trigger="hover" placement="top">
                            <template #reference>
                                <el-icon color="#999999" v-if="item?.tips">
                                    <QuestionFilled color="#999999" />
                                </el-icon>
                            </template>
                        </el-popover>

                    </div>
                </div>
            </div>
        </div>
        <div class="qa_input_box">
            <el-input v-model="input" class="qa_input" :placeholder="qaInfo.placeholder || '请输入答案.....'" />
        </div>
        <div class="btn_box">
            <el-button @click="onConfirmAnswer" class="btn" color="#2C3E50" type="info">确认答案</el-button>
        </div>
        <div class="qares">
            <div class="emp" v-show="!isBinGo">
                <div class="icon_emp"></div>
                <div class="text">答对谜题后,这里将展示下一个线索</div>
            </div>
            <div class="as_content" v-show="isBinGo">
                <div class="as_item" v-for="(item, index) in qaInfo.thread" :key="index">
                    <span v-if="item.type === 'text'">{{ replaceTemplateStrings(item.content, resList) }}</span>
                    <el-button @click="() => openPage(item.url)" class="url_btn" v-if="item.type === 'url'"
                        type="primary">
                        {{ replaceTemplateStrings(item.content, resList) }}
                    </el-button>
                    <div class="img_view" v-if="item.type === 'img'">
                        <el-button @click="showPreview = true" type="success"> {{ replaceTemplateStrings(item.content,
                            resList)
                        }}</el-button>
                        <el-image-viewer v-if="showPreview" :url-list="[item.url]" show-progress
                            @close="showPreview = false" />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
import { getQaInfo, getQueryParam, isTimeReached, qaData, replaceTemplateStrings, filterSpecialChars, userIdMap } from "../utils/qa/questions";

function talk(msg, dur = 0) {
    return new Promise((resolve) => {
        ElMessage({
            message: msg,
            grouping: true,
            duration: dur,
            type: "",
        });
        setTimeout(() => {
            resolve();
        }, dur + 200);
    });
}
const qaIndex = getQueryParam("qa")?.[0] || "1";
const input = ref("");
const userName = ref(userIdMap[getQueryParam("user")?.[0]] || "旅行者");
const isBinGo = ref(false);
const showPreview = ref(false);
const resList = ref([]);
const qaInfo = ref(qaData[qaIndex] || { question: [], placeholder: "", thread: [] });
onMounted(() => {
    document.title = '寻宝游戏'
    getQaInfo().then((res) => {
        resList.value = res;
    });
    const preData = JSON.parse(localStorage.getItem('qaIndex' + qaIndex) || "{}");

    if (preData?.type === 'bingo') {
        isBinGo.value = true;
        input.value = preData.input;
    }
});
const onConfirmAnswer = async () => {
    if (isBinGo.value) return;
    const date = '2025/05/16 14:00:00'
    // if (!isTimeReached(date)) return talk('游戏还未开始哦,耐心等待' + date, 3000);isOpenEndedQuestions
    const isOpenEndedQuestions = qaInfo.value?.isOpenEndedQuestions
    const answer = input.value?.trim()
    if ((answer === qaInfo.value.answer) || (answer?.length > 3 && isOpenEndedQuestions)) {
        localStorage.setItem('qaIndex' + qaIndex, JSON.stringify({
            type: 'bingo',
            date: new Date().getTime(),
            input: input.value,
        }));
        isBinGo.value = true;
        try {
            fetch(`https://api.chuckfang.com/4acc3779/寻宝游戏通知 -- 来自sitkin.top/郭涵答对了第${qaIndex}题，答案是${filterSpecialChars(input.value)}`)
        } catch (e) {
            console.log(e);
        }
        await talk("BinGo恭喜你答对了", 1000);
        await talk("请查看下一个线索", 1000);
        await talk("继续冒险吧 ~", 1000);

    } else {
        talk(isOpenEndedQuestions ? "回答的有点短,再补充一下~" : "不对哦~ 再想想~~", 1000);
    }
}
const openPage = (url) => {
    if (url) {
        window.open(url);
    }
}
</script>
<style lang="scss" scoped>
.questions-box {
    width: 100vw;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: #ffffff;
    box-sizing: border-box;
    padding: 0 26vpx;
    padding-top: 24vpx;

    .lock_icon {

        *,
        a,
        p {
            color: #999;
        }
    }

    .qares {
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        box-sizing: border-box;
        padding: 24vpx;
        width: 342vpx;
        min-height: 200vpx;
        border-radius: 10vpx;
        background-color: #F9F6F2;

        .as_content {
            span {
                display: flex;
                align-items: center;
                justify-content: center;
                color: #9CA3AF;
            }

            .as_item {
                display: flex;
                align-items: center;
                justify-content: center;
                padding-bottom: 12vpx;
            }
        }

        .emp {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;

            .icon_emp {
                width: 35vpx;
                height: 35vpx;
                background-image: url("../assets/h36.png");
                background-size: 100%;
            }

            .text {
                padding-top: 20vpx;
                text-align: center;
                font-size: 16vpx;
                color: #999999;
            }
        }
    }

    // padding-top: 68vpx;
    .ask {
        position: relative;
        box-sizing: border-box;
        padding: 24vpx;
        width: 342vpx;
        min-height: 200vpx;
        border-radius: 10vpx;
        background-color: #f8f8f8;

        .icon_box {
            width: 21vpx;
            height: 24vpx;
            background-image: url("../assets/suo.png");
            background-size: 100%;
        }

        .q_title {
            box-sizing: border-box;
            padding: 12vpx 0;
            color: #999999;
            font-size: 17vpx;
        }

        .qa_content_text {
            box-sizing: border-box;
            color: #2c2c2c;
            font-size: 16vpx;

            div {
                display: flex;
                align-items: center;
                color: #2c2c2c;
                padding-bottom: 12vpx;

                *,
                a,
                p {
                    color: #999999;
                }

                .tips {
                    padding: 0;
                    display: flex;
                    align-items: center;
                    padding-left: 6vpx;
                }
            }
        }
    }

    .yuan {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 128vpx;
        height: 128vpx;
        border-radius: 50%;
        border: solid 2vpx rgba(0, 0, 0, 0.1);

        .min {
            width: 64vpx;
            height: 64vpx;
        }
    }

    .yuan_wz {
        position: absolute;
        right: 2vpx;
        top: 2vpx;
    }

    .qa_input_box {
        padding: 28vpx 0;

        .qa_input {
            height: 56vpx;
        }
    }

    .btn_box {
        padding-bottom: 30vpx;

        .btn {
            width: 100%;
            height: 56vpx;
            font-size: 20vpx;
        }
    }
}
</style>
