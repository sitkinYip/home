import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

const Home = () => import("@/page/Home.vue");
const Letter = () => import("@/page/Letter/index.vue");

const Questions = () => import("@/page/Questions/index.vue");
const ClearCache = () => import("@/page/ClearCache/index.vue");
const Bless = () => import("@/page/Bless/index.vue");
const BookingGenerator = () => import("@/page/BookingGenerator/index.vue");

const routes: RouteRecordRaw[] = [
  { path: "/", component: Home },
  { path: "/letter", component: Letter, meta: { title: "星海情笺" } },
  { path: "/questions", component: Questions, meta: { title: "向着星辰的冒险" } },
  { path: "/questions/clearCache", component: ClearCache, meta: { title: "清除记忆体" } },
  { path: "/bless", component: Bless, meta: { title: "专属星空" } },
  { path: "/booking", component: BookingGenerator, meta: { title: "婚宴定金确认" } },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.afterEach((to) => {
  // 1. 获取默认标题（从环境变量读取）
  const defaultTitle = import.meta.env.VITE_SITE_NAME as string;

  // 2. 获取路由配置中的标题
  const pageTitle = to.meta.title as string | undefined;

  // 3. 设置最终标题
  // 逻辑：如果有配置页面标题，显示 "页面标题 - 站点名"；否则只显示 "站点名"
  if (pageTitle) {
    document.title = `${pageTitle}`;
  } else {
    document.title = defaultTitle;
  }
});

export default router;
