<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { buildCpoauthAuthorizeUrl, loginUser, saveLocalUser } from "../api/auth";

const route = useRoute();
const router = useRouter();
const pending = ref(false);
const error = ref("");
const cpoauthEntryUrl = buildCpoauthAuthorizeUrl(String(route.query.redirect ?? "/problemset"));

const form = reactive({
  identifier: "",
  password: ""
});

const onSubmit = async () => {
  error.value = "";
  if (!form.identifier || !form.password) {
    error.value = "请输入账号和密码";
    return;
  }

  pending.value = true;
  try {
    const user = await loginUser({
      identifier: form.identifier.trim(),
      password: form.password
    });
    saveLocalUser(user);
    router.push("/problemset");
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    pending.value = false;
  }
};
</script>

<template>
  <TiLayout :show-top-bar="false" :show-title="false" :use-panel="false">
    <section class="auth-wrap">
      <form class="auth-card" @submit.prevent="onSubmit">
        <img class="brand-logo" src="https://cdn.luogu.com.cn/youti-fe/logo.png" alt="洛谷" />
        <h2 class="auth-title">登录账号</h2>

        <label class="field-label" for="login-identifier">登录账号</label>
        <input
          id="login-identifier"
          v-model.trim="form.identifier"
          class="field-input"
          type="text"
          placeholder="用户名或邮箱"
        />

        <label class="field-label" for="login-password">密码</label>
        <input
          id="login-password"
          v-model="form.password"
          class="field-input"
          type="password"
          placeholder="请输入密码"
        />

        <button type="submit" class="btn btn-primary" :disabled="pending">
          {{ pending ? "登录中..." : "登录" }}
        </button>

        <a :href="cpoauthEntryUrl" class="btn btn-cpoauth">
          <i class="fa-solid fa-right-to-bracket"></i>
          使用 CPOAuth 登录
        </a>

        <p v-if="error" class="error">{{ error }}</p>

        <div class="link-row">
          <router-link to="/auth/register">创建账号</router-link>
          <a href="#">忘记密码？</a>
        </div>
      </form>
    </section>
  </TiLayout>
</template>

<style scoped>
.auth-wrap {
  min-height: calc(100vh - 260px);
  display: grid;
  place-items: center;
  padding: 20px 12px;
}

.auth-card {
  width: min(100%, 440px);
  background: #f7f7f7;
  border: 1px solid #e3e3e3;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.06);
  padding: 30px 34px 22px;
}

.brand-logo {
  width: 146px;
  display: block;
  margin: 0 auto 10px;
}

.auth-title {
  margin: 0 0 18px;
  text-align: center;
  color: #2d2d2d;
  font-size: 30px;
  font-weight: 500;
}

.field-label {
  display: block;
  margin: 8px 0 6px;
  color: #666;
  font-size: 14px;
}

.field-input {
  width: 100%;
  height: 40px;
  border: 1px solid #d2d2d2;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 14px;
  background: #fff;
}

.btn {
  width: 100%;
  height: 40px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 15px;
  margin-top: 14px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
  box-sizing: border-box;
}

.btn-primary {
  border: 1px solid #3c9de0;
  background: #3c9de0;
  color: #fff;
}

.btn-cpoauth {
  border: 1px solid #f97316;
  background: #fff;
  color: #f97316;
}

.btn-cpoauth:hover {
  background: #fff4ec;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  margin: 10px 0 0;
  color: #d9534f;
  font-size: 13px;
}

.link-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.link-row a {
  color: #2993e1;
  text-decoration: none;
  font-size: 14px;
}

.link-row a:hover {
  text-decoration: underline;
}
</style>
