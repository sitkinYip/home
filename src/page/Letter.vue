<template>
    <div class="letter">
        <!-- 加载 -->
        <Loading text="郭涵生日定制专属" />
        <Background :key="bgKey" imgType="1" @loadComplete="loadComplete" />
        <Envelope @onNextWord="updateWord"/>
    </div>
</template>
<script setup>
import Envelope from '@/components/Envelope/Envelope.vue'
import Background from "@/components/Background.vue";
import Loading from "@/components/Loading.vue";
import { onMounted, onBeforeUnmount, ref } from 'vue';
import { useRouter } from 'vue-router';
const loadComplete = () => {

};
const scriptId = 'unique-script-id'; // 为了避免重复和能找到脚本进行卸载
const scriptUrl = "https://cdn.jsdelivr.net/gh/Ukenn2112/UkennWeb@3.0/index/web.js";
const bgKey = ref('bgkey')

const updateWord = () => {
    // console.log('updateWord', msg)
    bgKey.value = Date.now()+'bgkey'
}

const loadScript = () => {
    if (document.getElementById(scriptId)) {
        // 如果脚本已经存在，则不重复加载
        return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = scriptUrl;
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
        console.log("Script loaded successfully.");
    };

    script.onerror = () => {
        console.error(`Error loading script: ${scriptUrl}`);
    };
};

const unloadScript = () => {
    const scriptElement = document.getElementById(scriptId);
    if (scriptElement) {
        document.body.removeChild(scriptElement);
    }
};

onMounted(() => {
    loadScript();

    // 可以选择侦听路由变化，以在路由变化时卸载脚本
    const router = useRouter();
    router.beforeEach((to, from, next) => {
        unloadScript(); // 路由变化前卸载脚本
        next();
    });
});

onBeforeUnmount(() => {
    unloadScript(); // 组件卸载前卸载脚本
});
</script>
<style lang="scss">
.letter {
    width: 100%;
    height: 100vh;
    padding: 0px 0 0px;
    overflow: hidden;
    font-size: 14px;
    display: flex;
    justify-content: center;
    align-items: center;
    font-family: Roboto, "RiiTegakiFude", sans-serif;
}
</style>