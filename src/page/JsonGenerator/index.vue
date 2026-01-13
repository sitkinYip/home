<template>
  <div class="json-generator-container">
    <component :is="activeComponent" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, shallowRef } from "vue";
import MobileGenerator from "./components/MobileGenerator.vue";
import PCGenerator from "./components/PCGenerator.vue";

const activeComponent = shallowRef(MobileGenerator);

const checkIsMobile = () => {
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
    userAgent.toLowerCase(),
  );
};

// Check on mount and resize
const updateComponent = () => {
  const isMobile = checkIsMobile();
  // We can also check window width if UA isn't enough, but user asked for environment check
  // Usually combining both is safer for responsive design, but strictly "PC vs Mobile" usually implies UA.
  // Let's add a width check as fallback or override?
  // User request: "自动判断当前环境是什么自动切对应的ui" -> Usually implies UA or width.
  // Let's stick to UA + width < 768 check to be safe.
  const isSmallScreen = window.innerWidth < 768;

  if (isMobile || isSmallScreen) {
    activeComponent.value = MobileGenerator;
  } else {
    activeComponent.value = PCGenerator;
  }
};

onMounted(() => {
  updateComponent();
  window.addEventListener("resize", updateComponent);
});

onUnmounted(() => {
  window.removeEventListener("resize", updateComponent);
});
</script>

<style scoped>
.json-generator-container {
  width: 100%;
  height: 100vh;
}
</style>
