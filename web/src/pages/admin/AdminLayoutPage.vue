<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, RouterView, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import TiLayout from "../../layouts/TiLayout.vue";
import { useAdminAccess } from "./useAdminAccess";

const route = useRoute();
const { t } = useI18n();
const { user, isAdmin } = useAdminAccess();

const navItems = computed(() => [
  { to: "/admin/users", label: t("admin.nav.users") },
  { to: "/admin/problemsets", label: t("admin.nav.problemsets") },
  { to: "/admin/questions", label: t("admin.nav.questions") },
  { to: "/admin/oauth", label: t("admin.nav.oauth") },
  { to: "/admin/system-pages", label: t("admin.nav.systemPages") }
]);

const pageTitle = computed(() => {
  if (route.path.startsWith("/admin/problemsets")) return t("admin.titles.problemsets");
  if (route.path.startsWith("/admin/questions")) return t("admin.titles.questions");
  if (route.path.startsWith("/admin/oauth")) return t("admin.titles.oauth");
  if (route.path.startsWith("/admin/system-pages")) return t("admin.titles.systemPages");
  return t("admin.titles.users");
});
</script>

<template>
  <TiLayout :title="pageTitle" :subtitle="t('admin.subtitle')" :use-panel="false">
    <section class="admin-shell page-shell">
      <div v-if="!user" class="admin-card admin-notice">
        <p>{{ t("common.loginFirst") }}</p>
        <RouterLink to="/auth/login">{{ t("common.goLogin") }}</RouterLink>
      </div>

      <div v-else-if="!isAdmin" class="admin-card admin-notice">
        <p>{{ t("admin.noPermission") }}</p>
      </div>

      <template v-else>
        <aside class="admin-nav admin-card">
          <h3>{{ t("admin.menu") }}</h3>
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
