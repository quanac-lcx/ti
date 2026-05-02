<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import TiFooter from "../components/TiFooter.vue";
import UiLoadingBar from "../components/UiLoadingBar.vue";
import { clearLocalUser, loadLocalUser, type AuthUser } from "../api/auth";
import { useAppLocale } from "../i18n";
import type { AppLocale } from "../i18n/messages";
import { toggleThemeMode, useThemeMode } from "../theme/useTheme";

interface LayoutProps {
  title?: string;
  subtitle?: string;
  showTopBar?: boolean;
  showTitle?: boolean;
  usePanel?: boolean;
  loading?: boolean;
  loadingLabel?: string;
}

interface NavItem {
  to: string;
  iconClass: string;
  label: string;
  title: string;
}

const props = withDefaults(defineProps<LayoutProps>(), {
  title: "",
  subtitle: "",
  showTopBar: true,
  showTitle: true,
  usePanel: true,
  loading: false,
  loadingLabel: "Loading..."
});

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const sidebarCollapsed = ref(true);
const manualToggle = ref(false);
const currentUser = ref<AuthUser | null>(null);

const { currentLocale, localeOptions, setLocale } = useAppLocale();
const { themeMode, isDarkTheme } = useThemeMode();

const navItems = computed<NavItem[]>(() => [
  {
    to: "/problemset",
    iconClass: "fa-solid fa-book",
    label: t("layout.nav.problemsets"),
    title: t("layout.navTitle.problemsets")
  },
  {
    to: "/problemset/_new",
    iconClass: "fa-solid fa-plus",
    label: t("layout.nav.createProblemset"),
    title: t("layout.navTitle.createProblemset")
  },
  {
    to: "/search",
    iconClass: "fa-solid fa-magnifying-glass",
    label: t("layout.nav.search"),
    title: t("layout.navTitle.search")
  },
  {
    to: "https://www.luogu.me/",
    iconClass: "fa-solid fa-house",
    label: t("layout.nav.home"),
    title: t("layout.navTitle.home")
  }
]);

const pageDocumentTitle = computed(() => {
  const suffix = t("layout.siteTitleSuffix");
  const pageTitle = String(props.title ?? "").trim();
  if (pageTitle) {
    return `${pageTitle} - ${suffix}`;
  }

  const subtitle = String(props.subtitle ?? "").trim();
  if (subtitle) {
    return `${subtitle} - ${suffix}`;
  }

  return suffix;
});

const isLoggedIn = computed(() => !!currentUser.value);
const isAdmin = computed(() => Boolean(currentUser.value?.isAdmin));
const avatarUrl = computed(() => currentUser.value?.avatarUrl ?? "");

function refreshUser() {
  currentUser.value = loadLocalUser();
}

function handleMouseEnter() {
  if (sidebarCollapsed.value && !manualToggle.value) {
    sidebarCollapsed.value = false;
  }
}

function handleMouseLeave() {
  if (!sidebarCollapsed.value && !manualToggle.value) {
    sidebarCollapsed.value = true;
  }
}

function handleManualCollapse() {
  manualToggle.value = true;
  sidebarCollapsed.value = true;
}

function handleManualExpand() {
  manualToggle.value = true;
  sidebarCollapsed.value = false;
}

function goProfile() {
  if (!currentUser.value?.uid) {
    router.push("/auth/login");
    return;
  }
  router.push(`/user/${currentUser.value.uid}`);
}

function goSettings() {
  if (!currentUser.value?.uid) {
    router.push("/auth/login");
    return;
  }
  router.push("/user/_me/settings");
}

function logout() {
  clearLocalUser();
  currentUser.value = null;
  router.push("/auth/login");
}

const currentThemeIconClass = computed(() => {
  return themeMode.value === "dark" ? "fa-regular fa-moon" : "fa-regular fa-sun";
});

const currentThemeLabel = computed(() => {
  return themeMode.value === "dark" ? t("layout.themeDark") : t("layout.themeLight");
});

function handleThemeToggle() {
  toggleThemeMode();
}

function handleLocaleChange(event: Event) {
  setLocale((event.target as HTMLSelectElement).value as AppLocale);
}

onMounted(() => {
  refreshUser();
  window.addEventListener("storage", refreshUser);
});

onUnmounted(() => {
  window.removeEventListener("storage", refreshUser);
});

watch(
  pageDocumentTitle,
  (title) => {
    document.title = title;
  },
  { immediate: true }
);
</script>

<template>
  <div class="ti">
    <aside
      class="side"
      :class="{ collapsed: sidebarCollapsed }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="brand">
        <div class="logo">
          <img src="https://lgs-cdn.cn-nb1.rains3.com/luogu-saver/logo-icon.png" :alt="t('common.appName')" />
        </div>
        <div v-show="!sidebarCollapsed" class="brand-text">{{ t("common.appName") }}</div>
      </div>

      <nav class="nav">
        <template v-for="item in navItems" :key="item.to">
          <a
            v-if="item.to.startsWith('http')"
            :href="item.to"
            :title="item.title"
            class="nav-item"
            target="_blank"
            rel="noopener noreferrer"
          >
            <div class="icon"><i :class="item.iconClass"></i></div>
            <div v-show="!sidebarCollapsed" class="text">{{ item.label }}</div>
          </a>
          <RouterLink
            v-else
            :to="item.to"
            :title="item.title"
            class="nav-item"
            :class="{ active: route.path === item.to }"
          >
            <div class="icon"><i :class="item.iconClass"></i></div>
            <div v-show="!sidebarCollapsed" class="text">{{ item.label }}</div>
          </RouterLink>
        </template>
      </nav>

      <button
        type="button"
        class="nav-toggle"
        @click="sidebarCollapsed ? handleManualExpand() : handleManualCollapse()"
      >
        <div class="toggle-icon">{{ sidebarCollapsed ? "→" : "←" }}</div>
      </button>
    </aside>

    <div class="main">
      <header v-if="props.showTopBar" class="top">
        <div class="crumb">{{ props.subtitle }}</div>

        <div class="top-actions">
          <label class="locale-control top-control">
            <span class="locale-control__icon" aria-hidden="true">
              <i class="fa-solid fa-language"></i>
            </span>
            <select class="locale-control__select" :aria-label="t('locale.label')" :value="currentLocale" @change="handleLocaleChange">
              <option v-for="option in localeOptions" :key="option.value" :value="option.value">
                {{ t(option.labelKey) }}
              </option>
            </select>
          </label>

          <button
            type="button"
            class="theme-toggle top-control"
            :title="`${t('layout.themeLabel')}: ${currentThemeLabel}`"
            :aria-label="`${t('layout.themeLabel')}: ${currentThemeLabel}`"
            :aria-pressed="isDarkTheme"
            @click="handleThemeToggle"
          >
            <i :class="currentThemeIconClass"></i>
          </button>

          <div class="account">
            <template v-if="isLoggedIn">
              <button type="button" class="avatar-btn top-control" @click="goProfile">
                <img class="avatar-img" :src="avatarUrl" :alt="t('layout.profile')" />
              </button>
              <div class="account-pop">
                <button type="button" class="pop-item" @click="goProfile">
                  <i class="fa-regular fa-user"></i>
                  {{ t("layout.profile") }}
                </button>
                <button type="button" class="pop-item" @click="goSettings">
                  <i class="fa-solid fa-gear"></i>
                  {{ t("layout.settings") }}
                </button>
                <RouterLink v-if="isAdmin" to="/admin" class="pop-item pop-link">
                  <i class="fa-solid fa-shield-halved"></i>
                  {{ t("layout.admin") }}
                </RouterLink>
                <button type="button" class="pop-item danger" @click="logout">
                  <i class="fa-solid fa-right-from-bracket"></i>
                  {{ t("layout.logout") }}
                </button>
              </div>
            </template>

            <template v-else>
              <div class="guest-actions">
                <RouterLink to="/auth/login" class="guest-link top-control">{{ t("layout.loginOrRegister") }}</RouterLink>
              </div>
            </template>
          </div>
        </div>
      </header>

      <div v-if="props.loading" class="layout-top-progress" role="status" aria-live="polite">
        <UiLoadingBar :label="props.loadingLabel" />
      </div>

      <div class="content" :class="{ 'content-no-top': !props.showTopBar }">
        <div class="content-body">
          <h1 v-if="props.showTitle" class="page-title">{{ props.title }}</h1>

          <div v-if="props.usePanel" class="panel">
            <slot />
          </div>
          <slot v-else />
        </div>
        <TiFooter />
      </div>
    </div>
  </div>
</template>
