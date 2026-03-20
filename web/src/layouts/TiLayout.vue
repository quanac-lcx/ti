<script setup>
import { RouterLink } from "vue-router";
import { ref, computed } from "vue";
import TiFooter from "../components/TiFooter.vue";

const props = defineProps({
  title: { type: String, default: "" },
  subtitle: { type: String, default: "" }
});

const sidebarCollapsed = ref(true);
const manualToggle = ref(false);

const handleMouseEnter = () => {
  if (sidebarCollapsed.value && !manualToggle.value) {
    sidebarCollapsed.value = false;
  }
};

const handleMouseLeave = () => {
  if (!sidebarCollapsed.value && !manualToggle.value) {
    sidebarCollapsed.value = true;
  }
};

const handleManualCollapse = () => {
  manualToggle.value = true;
  sidebarCollapsed.value = true;
};

const handleManualExpand = () => {
  manualToggle.value = true;
  sidebarCollapsed.value = false;
};

const navItems = [
  { to: "/problemset", icon: "📚", label: "题库", title: "题库" },
  { to: "/", icon: "🏠", label: "主站", title: "返回主站" }
];
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
        <div class="logo">⌁</div>
        <div class="brand-text" v-show="!sidebarCollapsed">洛谷保存站</div>
      </div>

      <nav class="nav">
        <RouterLink 
          v-for="item in navItems" 
          :key="item.to" 
          :to="item.to" 
          :title="item.title" 
          class="nav-item"
          :class="{ active: $route.path === item.to }"
        >
          <div class="icon">{{ item.icon }}</div>
          <div class="text" v-show="!sidebarCollapsed">{{ item.label }}</div>
        </RouterLink>
      </nav>

      <div class="nav-toggle" @click="sidebarCollapsed ? handleManualExpand() : handleManualCollapse()">
        <div class="toggle-icon">{{ sidebarCollapsed ? '→' : '←' }}</div>
      </div>
    </aside>

    <div class="main">
      <header class="top">
        <div class="crumb">{{ props.subtitle }}</div>
        <div class="avatar" aria-label="user">
          <div class="face">◉</div>
        </div>
      </header>

      <div class="content">
        <h1 class="pageTitle">{{ props.title }}</h1>
        <div class="panel">
          <slot />
        </div>
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
  transition: width 300ms cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}

.side:not(.collapsed) {
  width: 240px;
}

.brand {
  height: 64px;
  background: linear-gradient(135deg, #f97316 0%, #fb923c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  gap: 8px;
  transition: all 300ms cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.2);
  display: grid;
  place-items: center;
  border: 2px solid rgba(255, 255, 255, 0.3);
  font-size: 24px;
  font-weight: 700;
  transition: all 200ms ease;
}

.side:not(.collapsed) .logo {
  width: 44px;
  height: 44px;
  font-size: 26px;
}

.brand-text {
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
  opacity: 0.95;
  animation: slideIn 300ms cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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
  justify-content: flex-start;
  gap: 14px;
  opacity: 0.75;
  transition: all 200ms ease;
  border-radius: 8px;
  white-space: nowrap;
  position: relative;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.1);
  opacity: 0.95;
}

.nav-item.active {
  background: rgba(249, 115, 22, 0.25);
  opacity: 1;
}

.nav-item .icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: rgba(255, 255, 255, 0.1);
  font-size: 18px;
  flex-shrink: 0;
  transition: all 200ms ease;
}

.nav-item:hover .icon {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.nav-item.active .icon {
  background: rgba(249, 115, 22, 0.3);
}

.nav-item .text {
  font-size: 14px;
  font-weight: 500;
  letter-spacing: 0.3px;
  animation: fadeIn 300ms ease forwards;
  overflow: hidden;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    width: 0;
  }
  to {
    opacity: 1;
    width: auto;
  }
}

.nav-toggle {
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background 200ms ease;
}

.nav-toggle:hover {
  background: rgba(255, 255, 255, 0.08);
}

.toggle-icon {
  font-size: 16px;
  opacity: 0.6;
  transition: opacity 200ms ease;
}

.nav-toggle:hover .toggle-icon {
  opacity: 0.9;
}

.main {
  min-width: 0;
  background: #f5f5f5;
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
  font-size: 32px;
  transform: scale(0.4);
  transform-origin: left center;
  line-height: 1;
  margin-left: -6px;
  opacity: 0.9;
}

.avatar {
  width: 88px;
  height: 66px;
  background: #e0e0e0;
  border-radius: 7px;
  display: grid;
  place-items: center;
}

.face {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #ffe585 0, #ffe585 42%, #1f1f1f 44%, #1f1f1f 100%);
  display: grid;
  place-items: center;
  font-size: 12px;
  color: #fff;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.22);
}

.content {
  padding: 18px 0 52px;
  overflow-y: auto;
  flex: 1;
}

/* 隐藏滚动条 */
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

.pageTitle {
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
  .brand {
    height: 64px;
  }

  .top {
    height: 64px;
    padding: 0 14px;
  }

  .avatar {
    width: 58px;
    height: 50px;
  }

  .content {
    padding: 12px 0 24px;
  }

  .pageTitle {
    font-size: 40px;
    margin-bottom: 12px;
  }
}
</style>
