// src/composables/useSakura.js
import { onMounted } from 'vue';

export default function useSakura(targetId = 'app', options = {}) {
  onMounted(() => {
    const target = document.getElementById(targetId);
    if (target) {
      // 假设 `Sakura` 是全局暴露的变量
      console.log('window.Sakura', window.Sakura)
      new window.Sakura(target, options);
    }
  });
}
