import * as VueRouter from "vue-router";

const Home = () => import("@/page/Home.vue");
const Letter = () => import("@/page/Letter.vue");
const StarrySkyPage = () => import("@/page/StarrySkyPage.vue");

const routes = [
  { path: "/", component: Home },
  { path: "/guohan", component: Letter },
  { path: "/StarrySky", component: StarrySkyPage },
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
