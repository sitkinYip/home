import { createApp } from "vue";
import "@/style/style.scss";
import App from "@/App.vue";
import router from "@/routes";
// 引入 pinia
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import "vant/lib/index.css";
import "vant/es/toast/style";
import "vant/es/dialog/style";
import "vant/es/notify/style";
import "vant/es/image-preview/style";
import { Lazyload } from "vant";

// swiper
import "swiper/css";

import { toVpx } from "@/utils/toVpx";

// 按需加载 vConsole：仅在 URL 带 debug=1 且为移动端时异步加载
function shouldEnableVConsole() {
  const urlParams = new URLSearchParams(window.location.search);
  const isDebug = urlParams.get("debug") === "1";
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
  return isDebug && isMobile;
}

if (shouldEnableVConsole()) {
  import("vconsole").then(({ default: VConsole }) => {
    new VConsole();
  });
}

const app = createApp(App);
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.config.globalProperties.toVpx = toVpx;

app.use(pinia);
app.use(router);
app.use(Lazyload);
app.mount("#app");

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

// PWA
navigator.serviceWorker?.addEventListener("controllerchange", () => {
  // 弹出更新提醒
  console.log("站点已更新，刷新后生效");
  ElMessage("站点已更新，刷新后生效");
});
