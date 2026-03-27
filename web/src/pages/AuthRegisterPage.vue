<script setup lang="ts">
import { reactive, ref } from "vue";
import { useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { registerUser } from "../api/auth";

const router = useRouter();
const pending = ref(false);
const error = ref("");
const success = ref("");

const form = reactive({
  username: "",
  email: "",
  password: "",
  confirmPassword: ""
});

const onSubmit = async () => {
  error.value = "";
  success.value = "";

  if (!form.username || !form.email || !form.password) {
    error.value = "请完整填写注册信息";
    return;
  }
  if (form.password !== form.confirmPassword) {
    error.value = "两次输入的密码不一致";
    return;
  }

  pending.value = true;
  try {
    await registerUser({
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password
    });
    success.value = "注册成功，请登录";
    setTimeout(() => {
      router.push("/auth/login");
    }, 500);
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
        <h2 class="auth-title">注册账号</h2>
        <div class="single-tab">邮箱注册</div>

        <label class="field-label" for="register-username">用户名</label>
        <input
          id="register-username"
          v-model.trim="form.username"
          class="field-input"
          type="text"
          placeholder="2-64位用户名"
        />

        <label class="field-label" for="register-email">邮箱</label>
        <input
          id="register-email"
          v-model.trim="form.email"
          class="field-input"
          type="email"
          placeholder="请输入邮箱"
        />

        <label class="field-label" for="register-password">密码</label>
        <input
          id="register-password"
          v-model="form.password"
          class="field-input"
          type="password"
          placeholder="至少 6 位"
        />

        <label class="field-label" for="register-password-repeat">再次输入密码</label>
        <input
          id="register-password-repeat"
          v-model="form.confirmPassword"
          class="field-input"
          type="password"
          placeholder="再次输入密码"
        />

        <button type="submit" class="btn btn-primary" :disabled="pending">
          {{ pending ? "注册中..." : "注册" }}
        </button>

        <p v-if="error" class="message error">{{ error }}</p>
        <p v-if="success" class="message success">{{ success }}</p>

        <div class="link-row">
          <router-link to="/auth/login">已有账号？去登录</router-link>
          <a href="#">需要帮助？</a>
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
  padding: 30px 34px 20px;
}

.brand-logo {
  width: 146px;
  display: block;
  margin: 0 auto 10px;
}

.auth-title {
  margin: 0 0 16px;
  text-align: center;
  color: #2d2d2d;
  font-size: 30px;
  font-weight: 500;
}

.single-tab {
  border-bottom: 1px solid #d8d8d8;
  color: #2d2d2d;
  text-align: center;
  margin: 0 0 12px;
  padding-bottom: 7px;
  font-size: 16px;
  font-weight: 600;
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
  border: 1px solid #3c9de0;
  border-radius: 4px;
  background: #3c9de0;
  color: #fff;
  cursor: pointer;
  font-size: 15px;
  margin-top: 14px;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.message {
  margin: 10px 0 0;
  font-size: 13px;
}

.error {
  color: #d9534f;
}

.success {
  color: #2e8b57;
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

