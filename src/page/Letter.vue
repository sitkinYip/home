<template>
    <div class="letter">
        <!-- 加载 -->
        <!-- <LetterComponent :paragraphs="myLetterContent" :speed="100" :images="bgImages" /> -->
        <LetterComponent :paragraphs="myLetterContent" styleType="ancient" :speed="100" :images="bgImages" />
    </div>
</template>
<script setup>
import LetterComponent from '../components/LetterComponent/LetterComponent.vue';
const myLetterContent = [
    { content: '见字如晤：', align: 'left' },
    { content: '这是一段居中的诗词', align: 'center', delay: 500 },
    { content: '海内存知己，天涯若比邻。', align: 'center' },
    {
        content: `王爷爷推开窗时，那阵熟悉的甜香便涌了进来`, align: 'left', delay: 1000
    },
    { content: '--- 你的朋友 SITKIN', align: 'right' }
];

const bgImages = [
    /* "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800",
    "https://images.unsplash.com/photo-1534067783941-51c9c23ecefd?w=800" */
];
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