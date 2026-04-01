<script setup lang="ts">
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { buildCpoauthAuthorizeUrl, loginWithAdminToken, saveLocalUser } from "../api/auth";

const route = useRoute();
const router = useRouter();
const cpoauthEntryUrl = buildCpoauthAuthorizeUrl(String(route.query.redirect ?? "/problemset"));
const adminToken = ref("");
const adminPending = ref(false);
const adminError = ref("");

async function submitAdminToken() {
  adminError.value = "";
  const token = adminToken.value.trim();
  if (!/^[A-Za-z0-9]{32}$/.test(token)) {
    adminError.value = "格式有误";
    return;
  }
  adminPending.value = true;
  try {
    const user = await loginWithAdminToken(token);
    saveLocalUser(user);
    await router.push("/admin");
  } catch (err) {
    adminError.value = String((err as Error)?.message ?? err);
  } finally {
    adminPending.value = false;
  }
}
</script>

<template>
  <TiLayout :show-top-bar="false" :show-title="false" :use-panel="false">
    <section class="auth-wrap auth-login-page">
      <div class="auth-card">
        <span class="brand-logo-icon" role="img" aria-label="洛谷保存站有题">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M16.5595 0L16.2797 1.9926L16.2788 2.00192L13.3661 21.0724L32 29.8647L31.2365 31.5774L31.0491 32H0L0.275114 30.0093L0.27696 29.999L4.8679 0H16.5595ZM12.0976 29.3917H24.9043L12.9571 23.7544L12.0976 29.3917ZM2.96071 29.3917H9.5062L10.5402 22.6135L4.43321 19.7338L2.96071 29.3917ZM4.84311 17.0527L10.9501 19.9325L13.5951 2.60828H7.04864L4.84311 17.0527Z"
              fill="currentColor"
            ></path>
          </svg>
        </span>
        <h2 class="auth-title">登录/注册</h2>
        <p class="auth-tip">请使用 <a href="//auth.luogu.me" target="_blank" rel="noopener noreferrer">CP OAuth</a> 登录/注册。未注册的用户将自动注册。</p>
        <a :href="cpoauthEntryUrl" class="btn btn-cpoauth">
          <i class="fa-solid fa-right-to-bracket"></i>
          使用 CP OAuth 继续
        </a>

        <div class="admin-token-box">
          <p class="admin-token-title">Admin Token</p>
          <input
            v-model="adminToken"
            class="admin-token-input"
            type="text"
            maxlength="32"
            placeholder="32位"
          />
          <button class="btn btn-admin-token" type="button" :disabled="adminPending" @click="submitAdminToken">
            <i class="fa-solid fa-shield-halved"></i>
            {{ adminPending ? "登录中..." : "使用 Admin Token 登录" }}
          </button>
          <p v-if="adminError" class="admin-token-error">{{ adminError }}</p>
        </div>
      </div>
    </section>
  </TiLayout>
</template>


