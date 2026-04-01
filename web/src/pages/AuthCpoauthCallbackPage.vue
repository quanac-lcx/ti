<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { clearAdminTokenSession, redeemCpoauthTicket, saveLocalUser } from "../api/auth";

const route = useRoute();
const router = useRouter();
const pending = ref(true);
const message = ref("正在处理 CP OAuth 登录...");
const error = ref("");

onMounted(async () => {
  const ticket = String(route.query.ticket ?? "").trim();
  const directError = String(route.query.error ?? "").trim();
  const fallbackReturnTo = String(route.query.returnTo ?? "/problemset");

  if (directError) {
    pending.value = false;
    error.value = decodeURIComponent(directError);
    message.value = "CP OAuth 登录失败";
    return;
  }

  if (!ticket) {
    pending.value = false;
    error.value = "缺少 ticket，无法完成登录。";
    message.value = "CP OAuth 登录失败";
    return;
  }

  try {
    const { user, returnTo } = await redeemCpoauthTicket(ticket);
    clearAdminTokenSession();
    saveLocalUser(user);
    await router.replace(returnTo || fallbackReturnTo || "/problemset");
  } catch (err) {
    pending.value = false;
    error.value = String((err as Error)?.message ?? err);
    message.value = "CP OAuth 登录失败";
  }
});
</script>

<template>
  <TiLayout :show-top-bar="false" :show-title="false" :use-panel="false">
    <section class="callback-wrap auth-callback-page">
      <div class="callback-card">
        <h2>{{ message }}</h2>
        <p v-if="pending">请稍候，正在跳转...</p>
        <template v-else>
          <p class="error" v-if="error">{{ error }}</p>
          <router-link class="back" to="/auth/login">返回登录页</router-link>
        </template>
      </div>
    </section>
  </TiLayout>
</template>


