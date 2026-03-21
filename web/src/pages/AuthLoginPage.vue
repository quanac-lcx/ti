<script setup lang="ts">
import TiLayout from "../layouts/TiLayout.vue";
</script>

<template>
  <TiLayout :show-top-bar="false" :show-title="false" :use-panel="false">
    <section class="auth-wrap">
      <div class="auth-card">
        <img class="brand-logo" src="https://cdn.luogu.com.cn/youti-fe/logo.png" alt="洛谷" />
        <h2 class="auth-title">登录账号</h2>

        <label class="field-label" for="login-account">登录账号</label>
        <input id="login-account" class="field-input" type="text" placeholder="用户名、UID、手机或电子邮箱" />

        <label class="field-label" for="login-password">登录密码</label>
        <input id="login-password" class="field-input" type="password" placeholder="密码" />

        <button type="button" class="btn btn-primary">下一步</button>

        <div class="luogu-row" style="margin-top:12px;">
          <button type="button"  style="font-weight: bold; display: block; text-align: center;" class="btn btn-luogusaver">
            <span>洛谷保存站（推荐）</span>
          </button>
        </div>

        <div class="divider"></div>
        <p class="sub-title">第三方平台登录（需要先在本站注册账号后绑定，不可直接登录）</p>

        <div class="oauth-row">
          <button type="button" class="btn btn-linuxdo">
            <i class="fab fa-linux"></i>
            <span>LINUX DO</span>
          </button>
          <button type="button" class="btn btn-github">
            <i class="fab fa-github-alt"></i>
            <span>GitHub</span>
          </button>
          <!-- <button type="button" class="btn btn-google">
            <i class="fab fa-google"></i>
            <span>Google</span>
          </button> -->
        </div>

        <div class="link-row">
          <router-link to="/auth/register">创建账号</router-link>
          <a href="#">忘记密码/两步验证？</a>
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

.btn {
  height: 40px;
  border: 1px solid #d6d6d6;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}

.btn-primary {
  width: 100%;
  color: #fff;
  border: 1px solid #3c9de0;
  background: #3c9de0;
  margin-top: 12px;
}

.divider {
  border-top: 1px solid #dfdfdf;
  margin: 18px 0 14px;
}

.sub-title {
  margin: 0 0 12px;
  color: #747474;
  font-size: 13px;
}

.oauth-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 8px;
}

/* .btn-wechat {
  color: #18bf63;
  border-color: #18bf63;
} */

.btn-linuxdo {
  color: #ffb003;
  border-color: #ffb003;
}

.btn-github {
  color: #222;
  border-color: #222;
}

.btn-luogusaver {
  color: #3c9de0;
  border-color: #3c9de0;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  padding-left: 12px;
  box-sizing: border-box;
}

.btn-luogusaver i {
  width: 20px;
  display: inline-flex;
  justify-content: center;
  margin-right: 6px;
}

.btn-google {
  color: #f4433c;
  border-color: #f4433c;
}

.btn i {
  margin-right: 6px;
}

.link-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 6px;
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
}
</style>

