import * as VueRouter from "vue-router";

const Home = () => import("@/page/Home.vue");
const Letter = () => import("@/page/Letter.vue");
const Birthday = () => import("@/page/Birthday.vue");

const Questions = () => import("@/page/Questions.vue");
const Bless = () => import("@/page/Bless.vue");

const routes = [
  { path: "/", component: Home },
  { path: "/letter", component: Letter },
  { path: "/questions", component: Questions, meta: { title: '寻宝游戏' } },
  { path: "/birthday", component: Birthday },
  { path: "/bless", component: Bless, meta: { title: '夏夏生日快乐' } },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes,
});
router.afterEach((to) => {
  // 1. 获取默认标题（从环境变量读取）
  const defaultTitle = import.meta.env.VITE_SITE_NAME;
  
  // 2. 获取路由配置中的标题
  const pageTitle = to.meta.title;

  // 3. 设置最终标题
  // 逻辑：如果有配置页面标题，显示 "页面标题 - 站点名"；否则只显示 "站点名"
  if (pageTitle) {
    document.title = `${pageTitle}`;
  } else {
    document.title = defaultTitle;
  }
});
export default router;
