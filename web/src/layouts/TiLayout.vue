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
              <button type="button" class="pop-item" @click="goProfile">个人中心</button>
              <button type="button" class="pop-item danger" @click="logout">退出登录</button>
            </div>
          </template>

          <template v-else>
            <div class="guest-actions">
              <RouterLink to="/auth/login" class="guest-link">登录</RouterLink>
              <RouterLink to="/auth/register" class="guest-link">注册</RouterLink>
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

<style scoped>
.ti {
  width: 100%;
  min-height: 100vh;
  display: grid;
  grid-template-columns: auto 1fr;
}

.side {
  background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
  color: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  width: 64px;
  transition: width 280ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.side:not(.collapsed) {
  width: 228px;
}

.brand {
  height: 60px;
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 0 10px;
  transition: padding 280ms cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.side:not(.collapsed) .brand {
  justify-content: flex-start;
  padding: 0 14px;
}

.logo {
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: rgba(255, 255, 255, 0.14);
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.45);
  flex-shrink: 0;
}

.logo img {
  width: 20px;
  height: 20px;
  object-fit: contain;
  display: block;
}

.brand-text {
  font-size: 13px;
  font-weight: 700;
  white-space: nowrap;
  opacity: 0.96;
  animation: slide-in-x 220ms ease forwards;
}

@keyframes slide-in-x {
  from {
    opacity: 0;
    transform: translateX(-8px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

.nav {
  padding: 12px 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-item {
  text-decoration: none;
  color: inherit;
  padding: 12px 10px;
  display: flex;
  align-items: center;
  gap: 14px;
  opacity: 0.8;
  transition: all 180ms ease;
  border-radius: 8px;
  white-space: nowrap;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  opacity: 0.96;
}

.nav-item.active {
  background: rgba(249, 115, 22, 0.25);
  opacity: 1;
}

.icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.1);
  font-size: 16px;
  flex-shrink: 0;
}

.text {
  font-size: 14px;
  font-weight: 500;
}

.nav-toggle {
  height: 46px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 0;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  background: transparent;
  color: inherit;
  cursor: pointer;
}

.nav-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
}

.toggle-icon {
  font-size: 16px;
  opacity: 0.75;
}

.main {
  min-width: 0;
  background: #f1f1f1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.top {
  height: 86px;
  background: #33373b;
  color: rgba(255, 255, 255, 0.85);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
}

.crumb {
  font-size: 14px;
  opacity: 0.92;
}

.account {
  position: relative;
}

.avatar-btn {
  width: 88px;
  height: 66px;
  background: #e0e0e0;
  border-radius: 7px;
  display: grid;
  place-items: center;
  border: 0;
  cursor: pointer;
}

.avatar-img {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
}

.guest-actions {
  display: flex;
  gap: 8px;
}

.guest-link {
  height: 34px;
  padding: 0 12px;
  border-radius: 4px;
  border: 1px solid rgba(255, 255, 255, 0.25);
  color: #fff;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
}

.guest-link:hover {
  background: rgba(255, 255, 255, 0.12);
}

.account-pop {
  position: absolute;
  right: 0;
  top: 100%;
  min-width: 132px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
  padding: 6px;
  display: none;
  z-index: 120;
}

/* keep visible when hovering the popup itself or account */
.account:hover .account-pop,
.account-pop:hover {
  display: block;
}

.pop-item {
  width: 100%;
  border: 0;
  background: transparent;
  text-align: left;
  padding: 8px 10px;
  border-radius: 4px;
  cursor: pointer;
  color: #333;
}

.pop-item:hover {
  background: #f4f4f4;
}

.pop-item.danger {
  color: #d9534f;
}

.content {
  padding: 18px 0 52px;
  overflow-y: auto;
  flex: 1;
}

.content-no-top {
  padding-top: 34px;
}

.content::-webkit-scrollbar {
  width: 8px;
}

.content::-webkit-scrollbar-track {
  background: transparent;
}

.content::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 4px;
}

.content::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}

.page-title {
  margin: 2px auto 20px;
  max-width: 1040px;
  font-size: 56px;
  font-weight: 800;
  color: #2b2b2b;
  letter-spacing: 2px;
}

.panel {
  max-width: 1040px;
  background: #fff;
  margin: 0 auto;
  border-radius: 2px;
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.06);
  padding: 0;
}

@media (max-width: 980px) {
  .top {
    height: 64px;
    padding: 0 14px;
  }

  .avatar-btn {
    width: 58px;
    height: 50px;
  }

  .content {
    padding: 12px 0 24px;
  }

  .content-no-top {
    padding-top: 20px;
  }

  .page-title {
    font-size: 40px;
    margin-bottom: 12px;
  }
}
</style>

