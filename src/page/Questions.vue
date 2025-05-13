<template>
  <div class="questions-box">
    <div class="ask">
      <div class="yuan yuan_wz">
        <div class="yuan min"></div>
      </div>
      <div class="icon_box"></div>
      <div class="q_title">郭涵的生日寻宝游戏:</div>
      <div class="qa_content_text">
        <p>1. 寻宝游戏是啥？</p>
        <p>2. 寻宝游戏怎么玩？</p>
        <p>3. 寻宝游戏怎么玩？</p>
        <p>4. 寻宝游戏怎么玩？</p>
        <p>5. 寻宝游戏怎么玩？</p>
        <p>6. 寻宝游戏怎么玩？</p>
      </div>
    </div>
    <div class="qa_input_box">
      <el-input v-model="input" class="qa_input" placeholder="请输入答案....." />
    </div>
    <div class="btn_box">
        <el-button class="btn" color="#2C3E50" type="info">确认答案</el-button>
    </div>
    <div class="qares">
        <div class="emp">
            <div class="icon_emp"></div>
            <div class="text">答对谜题后,这里将展示下一个线索</div>
        </div>
    </div>
  </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";
const input = ref("");
</script>
<style lang="scss" scoped>
.questions-box {
  width: 100vw;
  height: 100vh;
  background-color: #ffffff;
  box-sizing: border-box;
  padding: 0 26vpx;
  padding-top: 24vpx;

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

      div,
      p {
        color: #2c2c2c;
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
