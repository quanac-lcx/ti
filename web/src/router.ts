import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import ProblemsetPage from "./pages/ProblemsetPage.vue";
import ProblemsetCreatePage from "./pages/ProblemsetCreatePage.vue";
import ProblemsetDetailPage from "./pages/ProblemsetDetailPage.vue";
import ProblemsetModePage from "./pages/ProblemsetModePage.vue";
import AuthLoginPage from "./pages/AuthLoginPage.vue";
import AuthCpoauthCallbackPage from "./pages/AuthCpoauthCallbackPage.vue";
import AuthRegisterPage from "./pages/AuthRegisterPage.vue";
import UserProfilePage from "./pages/UserProfilePage.vue";
import AdminPage from "./pages/AdminPage.vue";

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/problemset" },
  { path: "/problemset", component: ProblemsetPage },
  { path: "/problemset/_new", component: ProblemsetCreatePage },
  { path: "/problemset/:id/exam", component: ProblemsetModePage },
  { path: "/problemset/:id/training", component: ProblemsetModePage },
  { path: "/problemset/:id", component: ProblemsetDetailPage },
  { path: "/auth/login", component: AuthLoginPage },
  { path: "/auth/cpoauth/callback", component: AuthCpoauthCallbackPage },
  { path: "/auth/register", component: AuthRegisterPage },
  { path: "/user/:uid", component: UserProfilePage },
  { path: "/web/admin", component: AdminPage }
];

export const router = createRouter({
  history: createWebHistory(),
  routes
});
