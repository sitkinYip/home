import * as VueRouter from "vue-router";

const Home = () => import("@/page/Home.vue");
const Letter = () => import("@/page/Letter.vue");
const Birthday = () => import("@/page/Birthday.vue");

const Questions = () => import("@/page/Questions.vue");
const Bless = () => import("@/page/Bless.vue");

const routes = [
  { path: "/", component: Home },
  { path: "/letter", component: Letter },
  { path: "/questions", component: Questions, props: { title: '寻宝游戏' } },
  { path: "/birthday", component: Birthday, props: { title: '' } },
  { path: "/bless", component: Bless, props: { title: '夏夏生日快乐' } },
  {
    path: "/:pathMatch(.*)*",
    redirect: "/",
  },
];
const router = VueRouter.createRouter({
  history: VueRouter.createWebHistory(),
  routes,
});
export default router;
