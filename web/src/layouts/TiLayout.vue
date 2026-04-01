<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { RouterLink, useRoute, useRouter } from "vue-router";
import TiFooter from "../components/TiFooter.vue";
import { clearLocalUser, loadLocalUser, type AuthUser } from "../api/auth";

interface LayoutProps {
  title?: string;
  subtitle?: string;
  showTopBar?: boolean;
  showTitle?: boolean;
  usePanel?: boolean;
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
  usePanel: true
});

const route = useRoute();
const router = useRouter();
const sidebarCollapsed = ref(true);
const manualToggle = ref(false);
const currentUser = ref<AuthUser | null>(null);

const navItems: NavItem[] = [
  { to: "/problemset", iconClass: "fa-solid fa-book", label: "题库", title: "题库" },
  { to: "/", iconClass: "fa-solid fa-house", label: "主站", title: "返回主站" }
];

const isLoggedIn = computed(() => !!currentUser.value);
const isAdmin = computed(() => Boolean(currentUser.value?.isAdmin));
const avatarUrl = computed(() => currentUser.value?.avatarUrl ?? "");

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
          <img src="https://cdn.luogu.com.cn/youti-fe/logo-single.png?98632e1daed253842bc0846d56f869e3" alt="洛谷保存站" />
        </div>
        <div class="brand-text" v-show="!sidebarCollapsed">洛谷保存站</div>
      </div>

      <nav class="nav">
        <RouterLink
          v-for="item in navItems"
          :key="item.to"
          :to="item.to"
          :title="item.title"
          class="nav-item"
          :class="{ active: route.path === item.to }"
        >
          <div class="icon"><i :class="item.iconClass"></i></div>
          <div class="text" v-show="!sidebarCollapsed">{{ item.label }}</div>
        </RouterLink>
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
