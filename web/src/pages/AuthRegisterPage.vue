<script setup lang="ts">
import TiLayout from "../layouts/TiLayout.vue";
</script>

<template>
  <TiLayout :show-top-bar="false" :show-title="false" :use-panel="false">
    <section class="auth-wrap">
      <div class="auth-card">
        <img class="brand-logo" src="https://cdn.luogu.com.cn/youti-fe/logo.png" alt="洛谷" />
        <h2 class="auth-title">注册账号</h2>

        <div class="single-tab">邮箱注册</div>

        <label class="field-label" for="register-username">用户名</label>
        <input id="register-username" class="field-input" type="text" placeholder="6至16位，建议大小写字母、数字" />

        <label class="field-label" for="register-password">密码</label>
        <input id="register-password" class="field-input" type="password" placeholder="密码" />
        <input class="field-input" type="password" placeholder="再次输入密码" />

        <label class="field-label" for="register-email">验证信息</label>
        <input id="register-email" class="field-input" type="email" placeholder="邮箱（建议填写注册洛谷时使用的邮箱，方便后续工作）" />

        <!-- <div class="captcha-row">
          <input class="field-input captcha-input" type="text" placeholder="请输入图形验证码" />
          <div class="captcha-image">xp6a</div>
        </div>

        <div class="verify-row">
          <input class="field-input verify-input" type="text" placeholder="6位数字验证码" />
          <button type="button" class="btn btn-secondary">发送验证码</button>
        </div> -->

        <button type="button" class="btn btn-primary">注册</button>

        <label class="agree-row">
          <input type="checkbox" />
          <span>同意</span>
          <a href="#">《用户协议》</a>&<a href="#">《隐私政策》</a>
        </label>

        <div class="link-row">
          <router-link to="/auth/login">已有账号？</router-link>
          <a href="mailto:them@live.cn">需要帮助？</a>
        </div>
      </div>
    </section>
  </TiLayout>
</template>

<style scoped>
.auth-wrap {
  min-height: calc(100vh - 200px);
  display: grid;
  place-items: center;
  padding: 28px 16px;
  box-sizing: border-box;
}

.auth-card {
  width: 100%;
  max-width: 460px;
  background: #ffffff;
  border: 1px solid #ebebeb;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.06);
  padding: 28px 28px;
}

.brand-logo {
  width: 120px;
  display: block;
  margin: 0 auto 8px;
}

.auth-title {
  margin: 6px 0 12px;
  text-align: center;
  color: #222;
  font-size: 22px;
  font-weight: 600;
}

.single-tab {
  border-bottom: 1px solid #eee;
  color: #333;
  text-align: center;
  margin: 0 0 14px;
  padding-bottom: 8px;
  font-size: 16px;
  font-weight: 600;
}

.field-label {
  display: block;
  margin: 10px 0 6px;
  color: #666;
  font-size: 13px;
}

.field-input {
  width: 100%;
  height: 40px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 0 12px;
  font-size: 14px;
  margin-bottom: 12px;
  background: #fff;
  box-sizing: border-box;
}

/* .captcha-row,
.verify-row {
  display: grid;
  grid-template-columns: 1fr 120px;
  gap: 10px;
  align-items: center;
} */

.captcha-image {
  height: 40px;
  border-radius: 6px;
  background: #111;
  color: #41a0ff;
  display: grid;
  place-items: center;
  font-size: 14px;
  font-weight: 700;
}

.btn {
  height: 40px;
  border: 1px solid #d6d6d6;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}

.btn-secondary {
  color: #fff;
  border-color: #3c9de0;
  background: #3c9de0;
}

.btn-primary {
  width: 100%;
  color: #fff;
  border: 1px solid #3c9de0;
  background: #3c9de0;
  margin-top: 12px;
}

.agree-row {
  margin-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #666;
  font-size: 13px;
}

.agree-row a {
  text-decoration: none;
  color: #2f91dd;
}

.link-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.link-row a {
  color: #2f91dd;
  text-decoration: none;
  font-size: 13px;
}

.link-row a:hover {
  text-decoration: underline;
}

@media (max-width: 720px) {
  .auth-card {
    padding: 20px;
    border-radius: 6px;
  }

  .captcha-row,
  .verify-row {
    grid-template-columns: 1fr 110px;
  }
}
</style>

