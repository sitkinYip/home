import * as VueRouter from "vue-router";

const Home = () => import("@/page/Home.vue");
const Letter = () => import("@/page/Letter.vue");
const Birthday = () => import("@/page/Birthday.vue");

const routes = [
  { path: "/", component: Home },
  { path: "/guohan", component: Letter },
  { path: "/birthday", component: Birthday, props: { title: '' } },
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
