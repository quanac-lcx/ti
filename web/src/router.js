import { createRouter, createWebHistory } from "vue-router";
import ProblemsetPage from "./pages/ProblemsetPage.vue";

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", redirect: "/problemset" },
    { path: "/problemset", component: ProblemsetPage }
  ]
});

