<template>
  <div class="birthday-box">
    <iframe v-if="starrySkyShow" src="https://vae.sitkin.top/"></iframe>
    <iframe v-else src="https://guohan.sitkin.top/"></iframe>
    <audio ref="music" loop preload="auto">
      <source src="@/assets/rgky.mp3" type="audio/mpeg" />
    </audio>
    <canvas ref="canvas"></canvas>
  </div>
</template>
<style lang="scss">
.birthday-box {
  width: 100vw;
  height: 100vh;

  iframe {
    width: 100%;
    height: 100%;
    border: none;
  }
}
</style>
<script setup>
import { onMounted, ref } from "vue";
import confetti from "canvas-confetti";
import { en } from "element-plus/es/locales.mjs";

const starrySkyShow = ref(true);
const music = ref(null);
const canvas = ref(null);
const end = ref(0); // 持续5秒
confetti.create(canvas.value, { resize: true });

const frame = () => {
  confetti({
    particleCount: 40,
    angle: 60,
    spread: 55,
    origin: { x: 0 }, // 窗口左边
  });
  confetti({
    particleCount: 40,
    angle: 120,
    spread: 55,
    origin: { x: 1 }, // 窗口右边
  });
  confetti({
    particleCount: 40,
    angle: 120,
    spread: 55,
    origin: { x: 0, y: 0 }, // 窗口右边
  });
  confetti({
    particleCount: 40,
    angle: 120,
    spread: 55,
    origin: { x: 0, y: 0 }, // 窗口右边
  });
  setTimeout(() => {
    if (Date.now() < end.value) {
      requestAnimationFrame(frame);
    }
  }, 500);
};

onMounted(() => {
  window.addEventListener("message", (event) => {
    if (event.origin === "https://guohan.sitkin.top") {
      // console.log(event.data)
      if (event.data === "playMusic" && music.value) {
        music.value.currentTime = 0;
        music.value?.play?.();
      }
      if (event.data === "cakeEnd") {
        setTimeout(() => {
          starrySkyShow.value = true;
        }, 1500);
      }
    } else if (event.origin === "https://vae.sitkin.top") {
      console.log("event.data", event.data);
      if (event.data?.key && event.data?.value === 6) {
        // console.log('2323')
        setTimeout(() => {
          end.value = Date.now() + 5 * 1000;
          frame();
        }, 1000);
      }
    } else {
      // 来自未预期源的消息，可以忽略或作出适当响应
      return;
    }
  });
});
</script>
