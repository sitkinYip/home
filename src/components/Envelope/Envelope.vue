<script setup>
import { ref, watch, reactive } from "vue";
import confetti from "canvas-confetti";

import { list } from "./content.json";
import TextDisplay from "../TextDisplay.vue";

// const props =defineProps<{ msg: string }>()

const sorryList = ref([]);
const usedMessages = ref([]);

const open = ref(false);
const btnEnd = ref(false);
const content = ref("");
const fire = ref(false);
const end = ref(true);
const fontSize = ref(16);
const canvas = ref(null);
const sorry = ref(null);
const bgm = ref(null);
const success = ref(null);
const word = ref("");
const wordShow = ref(false);
const showText = reactive({
  text1Show: true,
  text2Show: false,
  text3Show: false,
});
const emit = defineEmits(["onNextWord"]);

let bomm = confetti.create(canvas.value, { resize: true });
//    nextTick().then(()=>{
//         myConfetti
//    })

function addSorry() {
  if (fire.value || btnEnd.value) return;
  wordShow.value = false;
  setTimeout(() => {
    word.value = [
      "听，这是心碎的声音~",
      "乖~别闹~~",
      "？拒收好人卡？！",
      "心碎了鸭~~",
      "555...心碎+1",
      "emmm...把好人卡收回去，不然我要生气啦！！！",
    ][~~(Math.random() * 6)];
    talk(word.value, 2000);
  });
  sorryList.value.push({
    x: 300 * Math.random() - 300,
    y: 400 * Math.random() - 500,
    w: 200 + Math.random() * 150,
  });
  sorry.value.currentTime = 0;
  sorry.value.play();
}

function contentLog(msg) {
  content.value = msg;
  end.value = true;
}

function handleOpen() {
  if (!end.value) return;
  // end.value && open.value = false
  wordShow.value = false;
  if (end.value && !open.value) {
    bgm.value.currentTime = 0;
    bgm.value.play();
    open.value = true;
  } else if (end.value && open.value && btnEnd.value) {
    end.value = true;
    open.value = false;
    btnEnd.value = false;
    content.value = "";
  }
}

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

async function handleSucces() {
  if (fire.value || btnEnd.value) return;
  success.value.currentTime = 0;
  success.value.play();
  end.value = false;
  btnEnd.value = true;
  sorryList.value.length = 0;
  const endTime = Date.now() + 10 * 1000;
  const colors = ["#837362", "#ffffff"];
  (function frame() {
    confetti({
      particleCount: 2,
      angle: 60,
      spread: 55,
      origin: { x: 0 },
      colors: colors,
    });
    confetti({
      particleCount: 2,
      angle: 120,
      spread: 55,
      origin: { x: 1 },
      colors: colors,
    });
    if (Date.now() < endTime) {
      requestAnimationFrame(frame);
      fire.value = true;
    } else {
      fire.value = false;
    }
  })();
  await talk("嘿嘿！", 1500);
  await talk(`天大地大 今天${content.value.name}最大`, 1500);
  await talk("既然你还想看些其他的", 1500);
  await talk("那么...", 1500);
  await talk("我只能遵命了 看我浑身解数", 2000);
  await talk("走起~~", 2000);
  end.value = true;
}

const onNewWorld = () => {

  let availableMessages = list.filter(msg => !usedMessages.value.includes(msg.text));
  if (availableMessages.length === 0) {
    usedMessages.value = []; // 重置已使用消息列表
    availableMessages = list.value; // 重新开始使用全部消息
  }
  const randomIndex = Math.floor(Math.random() * availableMessages.length);
  const msg = availableMessages[randomIndex];
  usedMessages.value.push(msg.text); // 标记为已使用

  fontSize.value = msg.fontSize;
  contentLog(msg)
  showText.text1Show = false;
  showText.text2Show = false;
  showText.text3Show = false;

  setTimeout(() => {
    showText.text1Show = true;
  }, 2000);
  emit('onNextWord', msg)
};

watch(open, (v) => {
  if (!v) return;
  end.value = false;
  let msg = list[~~(Math.random() * list.length)];
  fontSize.value = msg.fontSize;
  setTimeout(() => bomm(), 1000);
  setTimeout(() => contentLog(msg), 2222);
  usedMessages.value.push(msg.text);
});

watch(end, (v) => {
  if (v) return;
});
</script>

<template>
  <div class="envelope" :class="{ active: open }">
    <div class="top"></div>
    <div class="heart" @click="handleOpen"></div>
    <div class="card">
      <template v-if="content">
        <TextDisplay v-if="showText.text1Show" :onComplete="() => (showText.text2Show = true)">{{
          content.to
        }}</TextDisplay>
        <TextDisplay
          v-if="showText.text2Show"
          :onComplete="() => (showText.text3Show = true)"
          :style="{ 'font-size': fontSize + 'px' }"
          >{{ content.text }}</TextDisplay
        >
        <div
          :style="{
            display: 'flex',
            justifyContent: 'flex-end',
          }"
        >
          <TextDisplay v-if="showText.text3Show" :style="{}">{{ content.by }}</TextDisplay>
        </div>
      </template>
    </div>
    <canvas ref="canvas"></canvas>
  </div>

  <div class="word" :class="{ active: wordShow }">{{ word }}</div>

  <img
    v-for="item in sorryList"
    :style="{ 'margin-left': item.x + 'px', 'margin-top': item.y + 'px', width: item.w + 'px' }"
    :key="item"
    src="../../assets/sorry.png"
    class="sorry"
  />

  <div class="btns" :class="{ active: end && open && !btnEnd && showText.text3Show }">
    <div @click="handleSucces">超喜欢你，让我看看接下来有什么花样！！！</div>
    <div @click="onNewWorld">这句祝福我不喜欢，换一个！</div>
    <div @click="addSorry">谢谢，你是个好人~</div>
  </div>

  <audio ref="sorry" preload="auto">
    <source src="../../assets/sorry.mp3" type="audio/mpeg" />
  </audio>

  <audio ref="bgm" loop preload="auto">
    <source src="../../assets/bgm.mp3" type="audio/mpeg" />
  </audio>

  <audio ref="success" preload="auto">
    <source src="../../assets/success.mp3" type="audio/mpeg" />
  </audio>
</template>

<style lang="scss" scoped>
@import "./style.scss";
</style>
