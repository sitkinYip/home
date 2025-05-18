<template>
  <VideoPlayer ref="videoPlayer" />
  <div class="questions-box">
    <div class="ask">
      <div class="yuan yuan_wz" @click="HeaderClickCounter">
        <div class="yuan min"></div>
      </div>
      <!-- <div class="icon_box"></div> -->
      <div class="lock_icon" @click="HeaderClickCounter">
        <el-icon color="#999999" size="25px">
          <Lock color="#999999" />
        </el-icon>
      </div>
      <div class="q_title">{{ userName }}寻宝游戏:</div>
      <div class="qa_content_text">
        <div v-for="(item, index) in qaInfo.question" :key="index">
          {{ typeof item === "string" ? item : item.text }}
          <template v-if="item.img">
            <el-image :src="item.img" :preview-src-list="[item.img]" show-progress />
          </template>
          <div v-if="item.tips" class="tips">
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
      <el-input
        v-model="input"
        class="qa_input"
        :placeholder="qaInfo.placeholder || '请输入答案.....'"
      />
    </div>
    <div class="btn_box">
      <el-button @click="onConfirmAnswer" class="btn" color="#2C3E50" type="info"
        >确认答案</el-button
      >
    </div>
    <div class="qares">
      <div class="emp" v-show="!isBinGo">
        <div class="icon_emp"></div>
        <div class="text">答对谜题后,这里将展示下一个线索</div>
      </div>
      <div class="as_content" v-show="isBinGo">
        <div class="as_item" v-for="(item, index) in qaInfo.thread" :key="index">
          <span v-if="item.type === 'text'"
            >{{ replaceTemplateStrings(item.content, resList) }}
          </span>
          <el-button
            @click="() => openPage(item.url)"
            class="url_btn"
            v-if="item.type === 'url'"
            type="primary"
          >
            {{ replaceTemplateStrings(item.content, resList) }}
          </el-button>
          <div class="img_view" v-if="item.type === 'img'">
            <template v-if="item.content">
              <el-button @click="showPreview = true" type="success">
                {{ replaceTemplateStrings(item.content, resList) }}</el-button
              >
              <el-image-viewer
                v-if="showPreview"
                :url-list="item?.imgList || [item.url]"
                show-progress
                @close="showPreview = false"
              />
            </template>
            <template v-else>
              <el-image :src="item.url" :preview-src-list="[item.url]" show-progress />
            </template>
          </div>
          <template v-if="item.type === 'video'">
            <!-- <VideoPlayer :videoSrc="item.url" /> -->
            <el-button type="warning" @click="openVideo(item.url)">{{ replaceTemplateStrings(item.content, resList) }}</el-button>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import "element-plus/dist/index.css";
import { ref } from "vue";
import {
  getQaInfo,
  getQueryParam,
  isTimeReached,
  checkAnswer,
  qaData,
  replaceTemplateStrings,
  filterSpecialChars,
  userIdMap,
  HeaderClickCounter,
  userNameIdMap,
} from "../utils/qa/questions";
import VideoPlayer from "@/components/VideoPlayer.vue";

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
const userId = getQueryParam("user")?.[0] || "";
const videoPlayer = ref(null);
const input = ref("");
const userName = ref(userIdMap[userId] || "旅行者");
const isBinGo = ref(false);
const showPreview = ref(false);
const resList = ref([]);
const qaInfo = ref(qaData[qaIndex] || { question: [], placeholder: "", thread: [] });
onMounted(() => {
  document.title = "寻宝游戏";
  getQaInfo().then((res) => {
    resList.value = res;
  });
  const preData = JSON.parse(localStorage.getItem("qaIndex" + qaIndex + userId) || "{}");

  if (preData?.type === "bingo") {
    isBinGo.value = true;
    input.value = preData.input;
  }
});
const isOpenEndedQuestions = qaInfo.value?.isOpenEndedQuestions;
const onIsBinGo = () => {
  const userAnswer = input.value?.trim();
  const answer = qaInfo.value.answer;
  if (userAnswer?.length > 3 && isOpenEndedQuestions) return true;
  if(userAnswer === answer) return true;
  if (checkAnswer(userAnswer, answer)) return true;
  if (answer.type === "Keywords" && answer.value) {
    return userAnswer.includes(answer.value);
  }
  return false;
};
const openVideo = (url) => {
  videoPlayer.value.open(url);
}

const onConfirmAnswer = async () => {
  if (isBinGo.value) return;
  const isTest = getQueryParam("test")?.[0] === '1';
  const date = "2025/05/19 14:30:00";
  if (!isTest && !isTimeReached(date)) return talk('游戏还未开始哦,耐心等待' + date, 3000); isOpenEndedQuestions
  if (onIsBinGo()) {
    localStorage.setItem(
      "qaIndex" + qaIndex + userId,
      JSON.stringify({
        type: "bingo",
        date: new Date().getTime(),
        input: input.value,
      }),
    );
    isBinGo.value = true;
    try {
      fetch(
        `https://api.chuckfang.com/4acc3779/寻宝游戏通知 -- 来自sitkin.top/${userNameIdMap[userId] || "旅行者"}答对了第${qaIndex}题，答案是${filterSpecialChars(input.value)}`,
      );
      const src = qaInfo.value.thread.find(
        (item) => item.type === "video" && item.state === "ckickplay",
      )?.url;
      if (src && videoPlayer.value) {
        // showVideoPlayer(src)
        openVideo(src);
      }
    } catch (e) {
      console.log(e);
    }
    const qaList = Object.keys(qaData).map((key) => {
      return {
        key,
        value: qaData[key],
      };
    });
    const len = String(qaList.length);
    if (len === qaIndex) {
      await talk(`恭喜你，你已通过所有问题，请查看最终线索`, 1000);
      return;
    }
    await talk("BinGo恭喜你答对了", 1000);
    await talk("请查看下一个线索", 1000);
    await talk("继续冒险吧 ~", 1000);
  } else {
    const tipsInfo = resList.value.find((item) => item.title === `tips${qaIndex}`);
    if (tipsInfo) {
      await talk("不对哦 我给你点提示吧", 1000);
      talk(tipsInfo.content, 5000);
    } else {
      talk(isOpenEndedQuestions ? "回答的有点短,再补充一下~" : "不对哦~ 再想想~~", 1000);
    }
  }
};
const openPage = (url) => {
  if (url) {
    window.open(url);
  }
};
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
    background-color: #f9f6f2;

    .as_content {
      span {
        display: flex;
        align-items: center;
        justify-content: center;
        color: #9ca3af;
        text-align: center;
      }

      .as_item {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-bottom: 12vpx;

        p {
          color: #9ca3af;
        }
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
