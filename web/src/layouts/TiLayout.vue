<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import TiFooter from "../components/TiFooter.vue";
import UiLoadingBar from "../components/UiLoadingBar.vue";
import { clearLocalUser, loadLocalUser, type AuthUser } from "../api/auth";

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
  loadingLabel: "页面加载中"
});

const route = useRoute();
const router = useRouter();
const sidebarCollapsed = ref(true);
const manualToggle = ref(false);
const currentUser = ref<AuthUser | null>(null);

const navItems: NavItem[] = [
  { to: "/problemset", iconClass: "fa-solid fa-book", label: "题库", title: "题库" },
  { to: "/problemset/_new", iconClass: "fa-solid fa-plus", label: "新建题目", title: "新建题目" },
  { to: "https://www.luogu.me/", iconClass: "fa-solid fa-house", label: "保存站", title: "前往保存站" }
];

const isLoggedIn = computed(() => !!currentUser.value);
const isAdmin = computed(() => Boolean(currentUser.value?.isAdmin));
const avatarUrl = computed(() => currentUser.value?.avatarUrl ?? "");
const pageDocumentTitle = computed(() => {
  const pageTitle = String(props.title ?? "").trim();
  if (pageTitle) {
    return `${pageTitle} - 保存站有题`;
  }

  const subtitle = String(props.subtitle ?? "").trim();
  if (subtitle) {
    return `${subtitle} - 保存站有题`;
  }

  return "保存站有题";
});

const refreshUser = () => {
  currentUser.value = loadLocalUser();
};

const handleMouseEnter = (): void => {
  if (sidebarCollapsed.value && !manualToggle.value) {
    sidebarCollapsed.value = false;
  }
};

const handleMouseLeave = (): void => {
  if (!sidebarCollapsed.value && !manualToggle.value) {
    sidebarCollapsed.value = true;
  }
};

const handleManualCollapse = (): void => {
  manualToggle.value = true;
  sidebarCollapsed.value = true;
};

const handleManualExpand = (): void => {
  manualToggle.value = true;
  sidebarCollapsed.value = false;
};

const goProfile = () => {
  if (!currentUser.value?.uid) {
    router.push("/auth/login");
    return;
  }
  router.push(`/user/${currentUser.value.uid}`);
};

const goSettings = () => {
  if (!currentUser.value?.uid) {
    router.push("/auth/login");
    return;
  }
  router.push("/user/_me/settings");
};

const logout = () => {
  clearLocalUser();
  currentUser.value = null;
  router.push("/auth/login");
};

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
          <img src="https://lgs-cdn.cn-nb1.rains3.com/luogu-saver/logo-icon.png" alt="保存站有题" />
        </div>
        <div class="brand-text" v-show="!sidebarCollapsed">保存站有题</div>
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
            <div class="text" v-show="!sidebarCollapsed">{{ item.label }}</div>
          </a>
          <RouterLink
            v-else
            :to="item.to"
            :title="item.title"
            class="nav-item"
            :class="{ active: route.path === item.to }"
          >
            <div class="icon"><i :class="item.iconClass"></i></div>
            <div class="text" v-show="!sidebarCollapsed">{{ item.label }}</div>
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

        <div class="account">
          <template v-if="isLoggedIn">
            <button type="button" class="avatar-btn" @click="goProfile">
              <img class="avatar-img" :src="avatarUrl" alt="avatar" />
            </button>
            <div class="account-pop">
              <button type="button" class="pop-item" @click="goProfile">
                <i class="fa-regular fa-user"></i>
                个人中心
              </button>
              <button type="button" class="pop-item" @click="goSettings">
                <i class="fa-solid fa-gear"></i>
                个人设置
              </button>
              <RouterLink v-if="isAdmin" to="/admin" class="pop-item pop-link">
                <i class="fa-solid fa-shield-halved"></i>
                管理后台
              </RouterLink>
              <button type="button" class="pop-item danger" @click="logout">
                <i class="fa-solid fa-right-from-bracket"></i>
                退出登录
              </button>
            </div>
          </template>

          <template v-else>
            <div class="guest-actions">
              <RouterLink to="/auth/login" class="guest-link">登录/注册</RouterLink>
            </div>
          </template>
        </div>
      </header>

      <div v-if="props.loading" class="layout-top-progress" role="status" aria-live="polite">
        <UiLoadingBar :label="props.loadingLabel" />
      </div>

      <div class="content" :class="{ 'content-no-top': !props.showTopBar }">
        <h1 v-if="props.showTitle" class="page-title">{{ props.title }}</h1>

        <div v-if="props.usePanel" class="panel">
          <slot />
        </div>
        <slot v-else />

        <TiFooter />
      </div>
    </div>
  </div>
</template>
