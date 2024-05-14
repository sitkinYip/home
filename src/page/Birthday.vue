<template>
  <div class="birthday-box">
    <iframe v-if="starrySkyShow" :src="`https://vae.sitkin.top?d_${Date.now()}`"></iframe>
    <iframe v-else :src="`https://guohan.sitkin.top?d_${Date.now()}`"></iframe>
    <audio ref="music" loop preload="auto">
      <source src="@/assets/rgky.mp3" type="audio/mpeg" />
    </audio>
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

const starrySkyShow = ref(false);
const music = ref(null);

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
    } else {
      // 来自未预期源的消息，可以忽略或作出适当响应
      return;
    }
  });
});
</script>
