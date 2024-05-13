<template>
    <div class="StarrySky">
        <canvas ref="universeCanvas" class="universe"></canvas>
        <canvas ref="textCanvas" class="text"></canvas>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useUniverse } from './useUniverse';
import { useTextCanvas } from './useTextCanvas';

// 创建对canvas的引用
const universeCanvas = ref(null);
const textCanvas = ref(null);

// 待显示的文本数组
const texts = [
    'MY DEAR',
    'LOOK UP AT THE STARS',
    'AND THINK OF ME',
    // 你可以继续添加更多文本
    'I MISS YOU'
];

// 使用useUniverse composable来操作星系canvas
useUniverse(universeCanvas);

// 使用useTextCanvas composable来操作文本canvas
useTextCanvas(textCanvas, texts);

// 当组件挂载后，设置canvas的大小
onMounted(() => {
    universeCanvas.value.width = window.innerWidth;
    universeCanvas.value.height = window.innerHeight;
    textCanvas.value.width = window.innerWidth;
    textCanvas.value.height = 200;  // 根据实际情况调整
});
</script>

<style type="scss">
/* 设置全屏画布，并使星系在底层，文本在上层 */
.StarrySky {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: hidden;
}

.universe,
.text {
    position: absolute;
    top: 0;
    left: 0;
}

.text {
    pointer-events: none;
    /* 确保可以点击canvas底下的元素，比如星系canvas */
}
</style>