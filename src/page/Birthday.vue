<template>
    <div class="birthday-box">
        <iframe src="https://guohan.sitkin.top/"></iframe>
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
import { onMounted } from 'vue';

onMounted(() => {
    window.addEventListener('message', (event) => {
    if (event.origin === 'https://guohan.sitkin.top') {
        console.log(event.data)
    } else {
        // 来自未预期源的消息，可以忽略或作出适当响应
        return;
    }
});
});
</script>