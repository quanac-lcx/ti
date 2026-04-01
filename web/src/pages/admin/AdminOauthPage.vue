<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import {
  createAdminToken,
  deleteAdminToken,
  fetchAdminTokens,
  fetchCpoauthConfig,
  type AdminToken,
  updateCpoauthConfig
} from "../../api/admin";
import { notifyError, notifySuccess } from "../../composables/feedback";

const loading = ref(false);
const saving = ref(false);
const tokensLoading = ref(false);
const creatingToken = ref(false);
const tokens = ref<AdminToken[]>([]);

const form = reactive({
  clientId: "",
  clientSecret: "",
  callbackUrl: "",
  scope: "openid profile email"
});

async function loadConfig() {
  loading.value = true;
  try {
    const config = await fetchCpoauthConfig();
    form.clientId = config.clientId;
    form.clientSecret = config.clientSecret;
    form.callbackUrl = config.callbackUrl;
    form.scope = config.scope;
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    loading.value = false;
  }
}

async function saveConfig() {
  saving.value = true;
  try {
    const config = await updateCpoauthConfig({
      clientId: form.clientId.trim(),
      clientSecret: form.clientSecret.trim(),
      callbackUrl: form.callbackUrl.trim(),
      scope: form.scope.trim() || "openid profile email"
    });
    form.clientId = config.clientId;
    form.clientSecret = config.clientSecret;
    form.callbackUrl = config.callbackUrl;
    form.scope = config.scope;
    notifySuccess("OAuth 配置已保存。");
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    saving.value = false;
  }
}

async function loadTokens() {
  tokensLoading.value = true;
  try {
    tokens.value = await fetchAdminTokens();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    tokensLoading.value = false;
  }
}

async function createToken() {
  creatingToken.value = true;
  try {
    const created = await createAdminToken();
    notifySuccess(`已创建 admin token：${created.token}`);
    await loadTokens();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    creatingToken.value = false;
  }
}

async function removeToken(id: number) {
  try {
    await deleteAdminToken(id);
    notifySuccess("admin token 已删除。");
    await loadTokens();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  }
}

onMounted(async () => {
  await Promise.all([loadConfig(), loadTokens()]);
});
</script>

<template>
  <div class="admin-page">
    <nav class="admin-anchor-nav">
      <a href="#oauth-form">CP OAuth 配置</a>
      <a href="#admin-tokens">Admin Token</a>
    </nav>

    <section id="oauth-form" class="admin-card">
      <div class="admin-head">
        <h3>CP OAuth 配置</h3>
        <button class="admin-btn" type="button" @click="loadConfig">刷新</button>
      </div>
      <p class="admin-hint">请在 OAuth 平台把回调地址配置为此处填写的 `callbackUrl`。</p>
      <div v-if="loading">加载中...</div>
      <div v-else class="admin-form-grid">
        <label>
          <span>Client ID</span>
          <input v-model.trim="form.clientId" type="text" placeholder="请输入 Client ID" />
        </label>
        <label>
          <span>Client Secret</span>
          <input v-model.trim="form.clientSecret" type="password" placeholder="请输入 Client Secret" />
        </label>
        <label>
          <span>Callback URL</span>
          <input v-model.trim="form.callbackUrl" type="text" placeholder="https://..." />
        </label>
        <label>
          <span>Scope</span>
          <input v-model.trim="form.scope" type="text" placeholder="openid profile email" />
        </label>
      </div>
      <div class="admin-actions">
        <button class="admin-btn primary" type="button" :disabled="saving" @click="saveConfig">
          {{ saving ? "保存中..." : "保存配置" }}
        </button>
      </div>
    </section>

    <section id="admin-tokens" class="admin-card">
      <div class="admin-head">
        <h3>Admin Token</h3>
        <div class="admin-actions">
          <button class="admin-btn" type="button" @click="loadTokens">刷新</button>
          <button class="admin-btn primary" type="button" :disabled="creatingToken || tokens.length >= 2" @click="createToken">
            {{ creatingToken ? "生成中..." : "生成 Token" }}
          </button>
        </div>
      </div>
      <p class="admin-hint">最多保留 2 个 token；长度 32 位，包含大小写字母和数字，校验区分大小写。</p>

      <div v-if="tokensLoading">加载中...</div>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Token</th>
            <th>创建人</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="tokens.length === 0">
            <td colspan="5">暂无 token</td>
          </tr>
          <tr v-for="item in tokens" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.token }}</td>
            <td>{{ item.createdByUid || "-" }}</td>
            <td>{{ item.createdAt }}</td>
            <td>
              <button class="admin-btn danger" type="button" @click="removeToken(item.id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
