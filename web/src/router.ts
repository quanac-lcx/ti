import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import ProblemsetPage from "./pages/ProblemsetPage.vue";
import ProblemsetDetailPage from "./pages/ProblemsetDetailPage.vue";
import ProblemsetModePage from "./pages/ProblemsetModePage.vue";
import AuthLoginPage from "./pages/AuthLoginPage.vue";
import AuthRegisterPage from "./pages/AuthRegisterPage.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/problemset" },
  { path: "/problemset", component: ProblemsetPage },
  { path: "/problemset/:id/exam", component: ProblemsetModePage },
  { path: "/problemset/:id/training", component: ProblemsetModePage },
  { path: "/problemset/:id", component: ProblemsetDetailPage },
  { path: "/auth/login", component: AuthLoginPage },
  { path: "/auth/register", component: AuthRegisterPage }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});
