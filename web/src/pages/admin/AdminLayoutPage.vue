<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import TiLayout from "../../layouts/TiLayout.vue";
import { useAdminAccess } from "./useAdminAccess";

const route = useRoute();
const { user, isAdmin } = useAdminAccess();

const navItems = [
  { to: "/admin/users", label: "用户管理" },
  { to: "/admin/problemsets", label: "试卷管理" },
  { to: "/admin/questions", label: "试题管理" },
  { to: "/admin/oauth", label: "OAuth 配置" }
];

const pageTitle = computed(() => {
  if (route.path.startsWith("/admin/problemsets")) return "后台管理 / 试卷";
  if (route.path.startsWith("/admin/questions")) return "后台管理 / 试题";
  if (route.path.startsWith("/admin/oauth")) return "后台管理 / OAuth";
  return "后台管理 / 用户";
});
</script>

<template>
  <TiLayout :title="pageTitle" subtitle="保存站有题 / 管理后台" :use-panel="false">
    <section class="admin-shell page-shell">
      <div v-if="!user" class="admin-card admin-notice">
        <p>请先登录</p>
        <RouterLink to="/auth/login">去登录</RouterLink>
      </div>

      <div v-else-if="!isAdmin" class="admin-card admin-notice">
        <p>权限不足</p>
      </div>

      <template v-else>
        <aside class="admin-nav admin-card">
          <h3>管理菜单</h3>
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="admin-nav-link"
            :class="{ active: route.path === item.to }"
          >
            {{ item.label }}
          </RouterLink>
        </aside>
        <main class="admin-main">
          <RouterView />
        </main>
      </template>
    </section>
  </TiLayout>
</template>
