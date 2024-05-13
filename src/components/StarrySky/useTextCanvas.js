// composables/useTextCanvas.js
import { ref, watch, onMounted, onUnmounted } from 'vue';

export function useTextCanvas(canvasRef, texts) {
  const currentTextIndex = ref(0);

  // 根据情况可以增加更多的reactive properties，
  // 例如文字颜色、大小、动画速度等

  // 绘制文字至canvas
  const drawText = () => {
    if (canvasRef.value) {
      const ctx = canvasRef.value.getContext('2d');
      ctx.font = '48px serif'; // 根据需要修改字体样式
      ctx.textAlign = 'center';
      ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height);
      ctx.fillText(texts[currentTextIndex.value], canvasRef.value.width / 2, canvasRef.value.height / 2);
    }
  };

  // 显示下一段文字
  const showNextText = () => {
    currentTextIndex.value = (currentTextIndex.value + 1) % texts.length;
  };

  // 设置canvas尺寸
  const setCanvasSize = () => {
    if (canvasRef.value) {
      canvasRef.value.width = window.innerWidth;
      canvasRef.value.height = 200; // 可以根据实际需要设置高度
      drawText();
    }
  };

  onMounted(() => {
    setCanvasSize(); // 设置初始尺寸并绘制文本
    window.addEventListener('resize', setCanvasSize);
    window.addEventListener('click', showNextText);
    window.addEventListener('touchstart', showNextText);
    setCanvasSize(); // 调整canvas尺寸并触发绘制
    drawText(); // 明确调用绘制函数确保文本被绘制
  });

  onUnmounted(() => {
    window.removeEventListener('resize', setCanvasSize);
    window.removeEventListener('click', showNextText);
    window.removeEventListener('touchstart', showNextText);
  });

  // 监听文本索引的变化，如果文本改变，则重新绘制
  watch(currentTextIndex, () => {
    drawText();
  });

  return {
    currentTextIndex,
    showNextText
  };
}
