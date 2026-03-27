<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { redeemCpoauthTicket, saveLocalUser } from "../api/auth";

const route = useRoute();
const router = useRouter();
const pending = ref(true);
const message = ref("正在处理 CPOAuth 登录...");
const error = ref("");

onMounted(async () => {
  const ticket = String(route.query.ticket ?? "").trim();
  const directError = String(route.query.error ?? "").trim();
  const fallbackReturnTo = String(route.query.returnTo ?? "/problemset");

  if (directError) {
    pending.value = false;
    error.value = decodeURIComponent(directError);
    message.value = "CPOAuth 登录失败";
    return;
  }

  if (!ticket) {
    pending.value = false;
    error.value = "缺少 ticket，无法完成登录。";
    message.value = "CPOAuth 登录失败";
    return;
  }

  try {
    const { user, returnTo } = await redeemCpoauthTicket(ticket);
    saveLocalUser(user);
    await router.replace(returnTo || fallbackReturnTo || "/problemset");
  } catch (err) {
    pending.value = false;
    error.value = String((err as Error)?.message ?? err);
    message.value = "CPOAuth 登录失败";
  }
});
</script>

<template>
  <TiLayout :show-top-bar="false" :show-title="false" :use-panel="false">
    <section class="callback-wrap">
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

<style scoped>
.callback-wrap {
  min-height: calc(100vh - 260px);
  display: grid;
  place-items: center;
  padding: 20px 12px;
}

.callback-card {
  width: min(100%, 440px);
  background: #f7f7f7;
  border: 1px solid #e3e3e3;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  padding: 24px 26px;
}

.callback-card h2 {
  margin: 0 0 12px;
  font-size: 24px;
  color: #2d2d2d;
}

.callback-card p {
  margin: 0;
  color: #4b5563;
}

.callback-card .error {
  color: #dc2626;
}

.back {
  display: inline-block;
  margin-top: 12px;
  color: #2993e1;
  text-decoration: none;
}

.back:hover {
  text-decoration: underline;
}
</style>
