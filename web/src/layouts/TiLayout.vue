<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import TiFooter from "../components/TiFooter.vue";
import UiLoadingBar from "../components/UiLoadingBar.vue";
import { clearLocalUser, loadLocalUser, type AuthUser } from "../api/auth";
import { useAppLocale } from "../i18n";
import type { AppLocale } from "../i18n/messages";
import { setThemeMode, nextThemeMode, useThemeMode } from "../theme/useTheme";

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
const mobileMenuOpen = ref(false);
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

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value;
}

function closeMobileMenu() {
  mobileMenuOpen.value = false;
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
  if (themeMode.value === "auto") return "fa-solid fa-desktop";
  return themeMode.value === "dark" ? "fa-regular fa-moon" : "fa-regular fa-sun";
});

const currentThemeLabel = computed(() => {
  if (themeMode.value === "auto") return t("layout.themeAuto");
  return themeMode.value === "dark" ? t("layout.themeDark") : t("layout.themeLight");
});

function handleThemeToggle() {
  setThemeMode(nextThemeMode(themeMode.value));
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
  <div class="ti" :class="{ 'mobile-nav-open': mobileMenuOpen }">
    <!-- Mobile backdrop -->
    <div v-if="mobileMenuOpen" class="mobile-backdrop" @click="closeMobileMenu"></div>

    <aside
      class="side"
      :class="{ collapsed: sidebarCollapsed, 'mobile-open': mobileMenuOpen }"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <div class="brand">
        <div class="logo">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" :aria-label="t('common.appName')" role="img">
            <path fill-rule="evenodd" clip-rule="evenodd" d="M16.5595 0L16.2797 1.9926L16.2788 2.00192L13.3661 21.0724L32 29.8647L31.2365 31.5774L31.0491 32H0L0.275114 30.0093L0.27696 29.999L4.8679 0H16.5595ZM12.0976 29.3917H24.9043L12.9571 23.7544L12.0976 29.3917ZM2.96071 29.3917H9.5062L10.5402 22.6135L4.43321 19.7338L2.96071 29.3917ZM4.84311 17.0527L10.9501 19.9325L13.5951 2.60828H7.04864L4.84311 17.0527Z" fill="#4f6ff2" transform="translate(4 4) scale(0.75)" />
          </svg>
        </div>
        <div v-show="!sidebarCollapsed || mobileMenuOpen" class="brand-text">{{ t("common.appName") }}</div>
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
            @click="closeMobileMenu"
          >
            <div class="icon"><i :class="item.iconClass"></i></div>
            <div v-show="!sidebarCollapsed || mobileMenuOpen" class="text">{{ item.label }}</div>
          </a>
          <RouterLink
            v-else
            :to="item.to"
            :title="item.title"
            class="nav-item"
            :class="{ active: route.path === item.to }"
            @click="closeMobileMenu"
          >
            <div class="icon"><i :class="item.iconClass"></i></div>
            <div v-show="!sidebarCollapsed || mobileMenuOpen" class="text">{{ item.label }}</div>
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
        <div class="top-left">
          <button
            type="button"
            class="hamburger-btn"
            :aria-label="t('layout.menu')"
            @click="toggleMobileMenu"
          >
            <i class="fa-solid fa-bars"></i>
          </button>
          <div class="crumb">{{ props.subtitle }}</div>
        </div>

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
