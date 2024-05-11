<template>
    <p :style="customStyle">
      {{ displayedText }}
    </p>
  </template>
  
  <script setup>
  import { ref, watch, onMounted, computed } from 'vue';
  
  const props = defineProps({
    interval: {
      type: Number,
      default: 150, // 默认间隔时间
    },
    onComplete: Function,
    fontSize: {
      type: String,
      default: '16px', // 默认字体大小
    }
  });
  
  const slots = useSlots();
  const attrs = useAttrs();
  const displayedText = ref('');
  
  const customStyle = computed(() => ({
    fontSize: props.fontSize,
    ...attrs.style, // 使用计算属性直接引用attrs中的style
  }));
  
  let displayTimeout;
  
  const displayAnimation = (newText) => {
    if (!newText) return;
  
    clearTimeout(displayTimeout); // 清除上一个定时器，以防止重叠
    displayedText.value = '';
    let i = 0;
  
    const animateText = () => {
      if (i < newText.length) {
        displayedText.value += newText[i];
        i++;
        displayTimeout = setTimeout(animateText, props.interval);
      } else if (props.onComplete) {
        props.onComplete();
      }
    };
  
    animateText();
  };
  
  onMounted(() => {
    if (slots.default) {
      // 运行初始动画时，从slots里提取文本
      const initialText = slots.default().reduce((acc, vnode) => {
        return acc + (vnode.children || '');
      }, '');
      displayAnimation(initialText);
    }
  });
  
  watch(slots, (newSlots) => {
    // 插槽内容变更时运行动画
    const newText = newSlots.default().reduce((acc, vnode) => {
      return acc + (vnode.children || '');
    }, '');
    displayAnimation(newText);
  });
  </script>
  