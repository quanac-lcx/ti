<script setup lang="ts">
import { onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  fetchAiConfig,
  createAdminToken,
  deleteAdminToken,
  fetchAdminTokens,
  fetchCpoauthConfig,
  type AiConfig,
  type AdminToken,
  updateAiConfig,
  updateCpoauthConfig
} from "../../api/admin";
import { notifyError, notifySuccess } from "../../composables/feedback";

const { t } = useI18n();
const loading = ref(false);
const saving = ref(false);
const tokensLoading = ref(false);
const creatingToken = ref(false);
const tokens = ref<AdminToken[]>([]);
const aiSaving = ref(false);

const form = reactive({
  clientId: "",
  clientSecret: "",
  callbackUrl: "",
  scope: "openid profile email"
});

const aiForm = reactive<AiConfig>({
  baseUrl: "https://api.deepseek.com/v1",
  apiKey: "",
  model: "deepseek-v4-flash"
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

async function loadAiConfig() {
  loading.value = true;
  try {
    const config = await fetchAiConfig();
    aiForm.baseUrl = config.baseUrl;
    aiForm.apiKey = config.apiKey;
    aiForm.model = config.model;
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
      scope: form.scope
    });
    form.clientId = config.clientId;
    form.clientSecret = config.clientSecret;
    form.callbackUrl = config.callbackUrl;
    form.scope = config.scope;
    notifySuccess(t("admin.oauth.saved"));
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    saving.value = false;
  }
}

async function saveAiConfig() {
  aiSaving.value = true;
  try {
    const config = await updateAiConfig({
      baseUrl: aiForm.baseUrl.trim(),
      apiKey: aiForm.apiKey.trim(),
      model: aiForm.model.trim()
    });
    aiForm.baseUrl = config.baseUrl;
    aiForm.apiKey = config.apiKey;
    aiForm.model = config.model;
    notifySuccess("AI 配置已保存。");
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    aiSaving.value = false;
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
    notifySuccess(t("admin.oauth.tokenCreated", { token: created.token }));
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
    notifySuccess(t("admin.oauth.tokenDeleted"));
    await loadTokens();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  }
}

onMounted(async () => {
  await Promise.all([loadConfig(), loadAiConfig(), loadTokens()]);
});
</script>

<template>
  <div class="admin-page">
    <nav class="admin-anchor-nav">
      <a href="#oauth-form">{{ t("admin.oauth.configAnchor") }}</a>
      <a href="#ai-form">AI 配置</a>
      <a href="#admin-tokens">{{ t("admin.oauth.tokenAnchor") }}</a>
    </nav>

    <section id="oauth-form" class="admin-card">
      <div class="admin-head">
        <h3>{{ t("admin.oauth.configHeading") }}</h3>
        <button class="admin-btn" type="button" @click="loadConfig">{{ t("common.refresh") }}</button>
      </div>
      <p class="admin-hint">{{ t("admin.oauth.configHint") }}</p>
      <div v-if="loading">{{ t("common.loading") }}</div>
      <div v-else class="admin-form-grid">
        <label>
          <span>Client ID</span>
          <input v-model.trim="form.clientId" type="text" :placeholder="t('admin.oauth.clientIdPlaceholder')" />
        </label>
        <label>
          <span>Client Secret</span>
          <input v-model.trim="form.clientSecret" type="password" :placeholder="t('admin.oauth.clientSecretPlaceholder')" />
        </label>
        <label>
          <span>Callback URL</span>
          <input v-model.trim="form.callbackUrl" type="text" placeholder="https://..." />
        </label>
        <label>
          <span>Scope</span>
          <input v-model="form.scope" type="text" placeholder="openid profile email" />
        </label>
      </div>
      <div class="admin-actions">
        <button class="admin-btn primary" type="button" :disabled="saving" @click="saveConfig">
          {{ saving ? t("common.saving") : t("admin.oauth.save") }}
        </button>
      </div>
    </section>

    <section id="ai-form" class="admin-card">
      <div class="admin-head">
        <h3>AI 配置</h3>
        <button class="admin-btn" type="button" @click="loadAiConfig">{{ t("common.refresh") }}</button>
      </div>
      <p class="admin-hint">填写兼容 OpenAI Chat Completions 的服务信息（例如 DeepSeek）。</p>
      <div class="admin-form-grid">
        <label>
          <span>Base URL</span>
          <input v-model.trim="aiForm.baseUrl" type="text" placeholder="https://api.deepseek.com/v1" />
        </label>
        <label>
          <span>Model</span>
          <input v-model.trim="aiForm.model" type="text" placeholder="deepseek-v4-flash" />
        </label>
        <label>
          <span>API Secret / Key</span>
          <input v-model.trim="aiForm.apiKey" type="password" placeholder="sk-..." />
        </label>
      </div>
      <div class="admin-actions">
        <button class="admin-btn primary" type="button" :disabled="aiSaving" @click="saveAiConfig">
          {{ aiSaving ? t("common.saving") : t("common.save") }}
        </button>
      </div>
    </section>

    <section id="admin-tokens" class="admin-card">
      <div class="admin-head">
        <h3>{{ t("auth.adminToken") }}</h3>
        <div class="admin-actions">
          <button class="admin-btn" type="button" @click="loadTokens">{{ t("common.refresh") }}</button>
          <button class="admin-btn primary" type="button" :disabled="creatingToken || tokens.length >= 2" @click="createToken">
            {{ creatingToken ? t("admin.oauth.creatingToken") : t("admin.oauth.createToken") }}
          </button>
        </div>
      </div>
      <p class="admin-hint">{{ t("admin.oauth.tokenHint") }}</p>

      <div v-if="tokensLoading">{{ t("common.loading") }}</div>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Token</th>
            <th>{{ t("admin.oauth.createdBy") }}</th>
            <th>{{ t("admin.oauth.createdAt") }}</th>
            <th>{{ t("admin.common.actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="tokens.length === 0">
            <td colspan="5">{{ t("admin.oauth.noTokens") }}</td>
          </tr>
          <tr v-for="item in tokens" :key="item.id">
            <td>{{ item.id }}</td>
            <td>{{ item.token }}</td>
            <td>{{ item.createdByUid || "-" }}</td>
            <td>{{ item.createdAt }}</td>
            <td>
              <button class="admin-btn danger" type="button" @click="removeToken(item.id)">{{ t("common.delete") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>
