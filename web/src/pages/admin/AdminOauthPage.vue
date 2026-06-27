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
  type AiModelConfig,
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
  defaultModelId: "default",
  prompts: {
    hintSystemPrompt: "",
    solutionSystemPrompt: "",
    hintUserPrompt: "",
    solutionUserPrompt: ""
  },
  models: []
});

function createEmptyAiModel(index = aiForm.models.length): AiModelConfig {
  return {
    id: index === 0 ? "default" : `model-${index + 1}`,
    name: index === 0 ? t("admin.ai.defaultModelName") : t("admin.ai.modelNameFallback", { index: index + 1 }),
    baseUrl: "https://api.deepseek.com/v1",
    apiKey: "",
    model: "deepseek-v4-flash",
    dailyLimit: 0,
    enabled: true
  };
}

function ensureAiModelSelection() {
  if (aiForm.models.length === 0) {
    aiForm.models.push(createEmptyAiModel(0));
  }
  const selected = aiForm.models.find((item) => item.id === aiForm.defaultModelId && item.enabled);
  if (!selected) {
    aiForm.defaultModelId = aiForm.models.find((item) => item.enabled)?.id || aiForm.models[0]?.id || "";
  }
}

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
    aiForm.defaultModelId = config.defaultModelId;
    aiForm.prompts.hintSystemPrompt = config.prompts.hintSystemPrompt;
    aiForm.prompts.solutionSystemPrompt = config.prompts.solutionSystemPrompt;
    aiForm.prompts.hintUserPrompt = config.prompts.hintUserPrompt;
    aiForm.prompts.solutionUserPrompt = config.prompts.solutionUserPrompt;
    aiForm.models.splice(0, aiForm.models.length, ...config.models);
    ensureAiModelSelection();
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
      defaultModelId: aiForm.defaultModelId,
      prompts: {
        hintSystemPrompt: aiForm.prompts.hintSystemPrompt,
        solutionSystemPrompt: aiForm.prompts.solutionSystemPrompt,
        hintUserPrompt: aiForm.prompts.hintUserPrompt,
        solutionUserPrompt: aiForm.prompts.solutionUserPrompt
      },
      models: aiForm.models.map((item) => ({
        ...item,
        id: item.id.trim(),
        name: item.name.trim(),
        baseUrl: item.baseUrl.trim(),
        apiKey: item.apiKey.trim(),
        model: item.model.trim(),
        dailyLimit: Number(item.dailyLimit ?? 0)
      }))
    });
    aiForm.defaultModelId = config.defaultModelId;
    aiForm.prompts.hintSystemPrompt = config.prompts.hintSystemPrompt;
    aiForm.prompts.solutionSystemPrompt = config.prompts.solutionSystemPrompt;
    aiForm.prompts.hintUserPrompt = config.prompts.hintUserPrompt;
    aiForm.prompts.solutionUserPrompt = config.prompts.solutionUserPrompt;
    aiForm.models.splice(0, aiForm.models.length, ...config.models);
    ensureAiModelSelection();
    notifySuccess(t("admin.ai.saved"));
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    aiSaving.value = false;
  }
}

function addAiModel() {
  aiForm.models.push(createEmptyAiModel(aiForm.models.length));
  ensureAiModelSelection();
}

function removeAiModel(index: number) {
  aiForm.models.splice(index, 1);
  ensureAiModelSelection();
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
      <a href="#ai-form">{{ t("admin.ai.configAnchor") }}</a>
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
        <h3>{{ t("admin.ai.configHeading") }}</h3>
        <div class="admin-actions">
          <button class="admin-btn" type="button" @click="loadAiConfig">{{ t("common.refresh") }}</button>
          <button class="admin-btn" type="button" @click="addAiModel">{{ t("admin.ai.addModel") }}</button>
        </div>
      </div>
      <p class="admin-hint">{{ t("admin.ai.configHint") }}</p>

      <div class="admin-form-grid">
        <label>
          <span>{{ t("admin.ai.systemDefaultModel") }}</span>
          <select v-model="aiForm.defaultModelId">
            <option
              v-for="model in aiForm.models.filter((item) => item.enabled)"
              :key="model.id"
              :value="model.id"
            >
              {{ model.name || model.id }}
            </option>
          </select>
        </label>
      </div>

      <details class="admin-collapse">
        <summary>{{ t("admin.ai.promptsTitle") }}</summary>
        <div class="admin-form-grid">
          <label>
            <span>{{ t("admin.ai.hintSystemPrompt") }}</span>
            <textarea v-model="aiForm.prompts.hintSystemPrompt" rows="5" />
          </label>
          <label>
            <span>{{ t("admin.ai.solutionSystemPrompt") }}</span>
            <textarea v-model="aiForm.prompts.solutionSystemPrompt" rows="5" />
          </label>
          <label>
            <span>{{ t("admin.ai.hintUserPrompt") }}</span>
            <textarea v-model="aiForm.prompts.hintUserPrompt" rows="7" />
          </label>
          <label>
            <span>{{ t("admin.ai.solutionUserPrompt") }}</span>
            <textarea v-model="aiForm.prompts.solutionUserPrompt" rows="7" />
          </label>
        </div>
      </details>

      <div class="ai-model-list">
        <section v-for="(model, index) in aiForm.models" :key="index" class="ai-model-card">
          <div class="ai-model-card-head">
            <label class="ai-model-enabled">
              <input v-model="model.enabled" type="checkbox" @change="ensureAiModelSelection" />
              <span>{{ t("admin.ai.enabled") }}</span>
            </label>
            <strong class="ai-model-card-title">{{ model.name || model.model || model.id || t("admin.ai.modelNameFallback", { index: index + 1 }) }}</strong>
            <button class="admin-btn danger" type="button" :disabled="aiForm.models.length <= 1" @click="removeAiModel(index)">
              {{ t("common.delete") }}
            </button>
          </div>

          <div class="ai-model-grid">
            <label>
              <span>ID</span>
              <input v-model.trim="model.id" type="text" placeholder="deepseek" />
            </label>
            <label>
              <span>{{ t("admin.ai.name") }}</span>
              <input v-model.trim="model.name" type="text" placeholder="DeepSeek" />
            </label>
            <label>
              <span>{{ t("admin.ai.baseUrl") }}</span>
              <input v-model.trim="model.baseUrl" type="text" placeholder="https://api.deepseek.com/v1" />
            </label>
            <label>
              <span>{{ t("admin.ai.model") }}</span>
              <input v-model.trim="model.model" type="text" placeholder="deepseek-v4-flash" />
            </label>
            <label>
              <span>{{ t("admin.ai.dailyLimit") }}</span>
              <input v-model.number="model.dailyLimit" type="number" min="0" step="1" placeholder="0" />
            </label>
            <label>
              <span>{{ t("admin.ai.secret") }}</span>
              <input v-model.trim="model.apiKey" type="password" placeholder="sk-..." />
            </label>
          </div>
        </section>
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
