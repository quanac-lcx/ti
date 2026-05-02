<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import UiCard from "../components/UiCard.vue";
import TiLayout from "../layouts/TiLayout.vue";
import {
  getMySettings,
  loadLocalUser,
  saveLocalUser,
  updateMySettings,
  type AutosaveIntervalSeconds
} from "../api/auth";

const router = useRouter();
const { t } = useI18n();
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");

const recordsPublic = ref(true);
const profileCoverUrl = ref("");
const submissionAnalysisMode = ref<"none" | "wrong_only" | "all">("wrong_only");
const autosaveIntervalSeconds = ref<AutosaveIntervalSeconds>(30);
const defaultProfileCovers = [
  "https://resources.cn-sy1.rains3.com/ti/banner_1.webp",
  "https://resources.cn-sy1.rains3.com/ti/banner_2.webp",
  "https://resources.cn-sy1.rains3.com/ti/banner_3.webp"
] as const;

const autosaveOptions: Array<{ value: AutosaveIntervalSeconds; label: string }> = [
  { value: 30, label: t("settings.autosave.30") },
  { value: 60, label: t("settings.autosave.60") },
  { value: 120, label: t("settings.autosave.120") },
  { value: 300, label: t("settings.autosave.300") },
  { value: 600, label: t("settings.autosave.600") },
  { value: 0, label: t("settings.autosave.off") }
];

function normalizeAutosaveInterval(value: unknown): AutosaveIntervalSeconds {
  const parsed = Number(value);
  if (parsed === 0 || parsed === 30 || parsed === 60 || parsed === 120 || parsed === 300 || parsed === 600) {
    return parsed;
  }
  return 30;
}

function pickDefaultProfileCover() {
  const index = Math.floor(Math.random() * defaultProfileCovers.length);
  return defaultProfileCovers[index];
}

function clearCoverUrl() {
  profileCoverUrl.value = pickDefaultProfileCover();
}

async function loadSettings() {
  const me = loadLocalUser();
  if (!me?.uid) {
    router.replace("/auth/login");
    return;
  }

  loading.value = true;
  error.value = "";
  success.value = "";
  try {
    const settings = await getMySettings();
    recordsPublic.value = Boolean(settings.recordsPublic);
    profileCoverUrl.value = String(settings.profileCoverUrl ?? "");
    submissionAnalysisMode.value = settings.submissionAnalysisMode ?? "wrong_only";
    autosaveIntervalSeconds.value = normalizeAutosaveInterval(settings.autosaveIntervalSeconds);
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    loading.value = false;
  }
}

async function submitSettings() {
  if (saving.value) return;
  saving.value = true;
  error.value = "";
  success.value = "";
  try {
    const result = await updateMySettings({
      recordsPublic: recordsPublic.value,
      profileCoverUrl: profileCoverUrl.value.trim(),
      submissionAnalysisMode: submissionAnalysisMode.value,
      autosaveIntervalSeconds: autosaveIntervalSeconds.value
    });
    saveLocalUser(result.user);
    profileCoverUrl.value = String(result.settings.profileCoverUrl ?? result.user.profileCoverUrl ?? "");
    success.value = t("settings.saved");
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);
</script>

<template>
  <TiLayout
    :title="t('settings.title')"
    :subtitle="t('settings.subtitle')"
    :loading="loading"
    :loading-label="t('settings.loading')"
  >
    <section class="settings-root">
      <UiCard as="div" class="settings-notice" compact>
        <i class="fa-solid fa-circle-info"></i>
        <div>
          <strong>{{ t("settings.noticeTitle") }}</strong>
          <p>{{ t("settings.noticePrefix") }}<a href="https://auth.luogu.me/profile" target="_blank" rel="noopener noreferrer">{{ t("settings.noticeLink") }}</a>{{ t("settings.noticeSuffix") }}</p>
        </div>
      </UiCard>

      <template v-if="!loading">
        <UiCard as="div" class="settings-item" compact>
          <label class="item-title" for="records-public"><i class="fa-solid fa-eye"></i>{{ t("settings.recordsPublic") }}</label>
          <div class="switch">
            <label>
              <input v-model="recordsPublic" type="radio" :value="true" />
              <i class="fa-solid fa-globe"></i>
              <span>{{ t("settings.public") }}</span>
            </label>
            <label>
              <input v-model="recordsPublic" type="radio" :value="false" />
              <i class="fa-solid fa-user-shield"></i>
              <span>{{ t("settings.private") }}</span>
            </label>
          </div>
        </UiCard>

        <UiCard as="div" class="settings-item" compact>
          <label class="item-title" for="submission-analysis-mode"><i class="fa-solid fa-file-circle-check"></i>{{ t("settings.analysisMode") }}</label>
          <div class="switch">
            <label>
              <input v-model="submissionAnalysisMode" type="radio" value="wrong_only" />
              <i class="fa-solid fa-circle-exclamation"></i>
              <span>{{ t("settings.analysisWrongOnly") }}</span>
            </label>
            <label>
              <input v-model="submissionAnalysisMode" type="radio" value="none" />
              <i class="fa-regular fa-eye-slash"></i>
              <span>{{ t("settings.analysisNone") }}</span>
            </label>
            <label>
              <input v-model="submissionAnalysisMode" type="radio" value="all" />
              <i class="fa-regular fa-eye"></i>
              <span>{{ t("settings.analysisAll") }}</span>
            </label>
          </div>
          <p class="item-desc">{{ t("settings.analysisDesc") }}</p>
        </UiCard>

        <UiCard as="div" class="settings-item" compact>
          <label class="item-title"><i class="fa-regular fa-floppy-disk"></i>{{ t("settings.autosaveTitle") }}</label>
          <div class="switch">
            <label v-for="option in autosaveOptions" :key="option.value">
              <input v-model="autosaveIntervalSeconds" type="radio" :value="option.value" />
              <i class="fa-regular fa-clock"></i>
              <span>{{ option.label }}</span>
            </label>
          </div>
          <p class="item-desc">{{ t("settings.autosaveDesc") }}</p>
        </UiCard>

        <UiCard as="div" class="settings-item" compact>
          <label class="item-title" for="profile-cover-url"><i class="fa-regular fa-image"></i>{{ t("settings.coverUrl") }}</label>
          <input
            id="profile-cover-url"
            v-model.trim="profileCoverUrl"
            class="text-input"
            type="url"
            :placeholder="t('settings.coverPlaceholder')"
          />
          <p class="item-desc">{{ t("settings.coverDesc") }}</p>
          <div class="cover-actions">
            <button type="button" class="minor-btn" @click="clearCoverUrl">
              <i class="fa-solid fa-eraser"></i>
              {{ t("settings.clearCover") }}
            </button>
          </div>
          <div class="cover-preview" :style="profileCoverUrl ? { backgroundImage: `url(${profileCoverUrl})` } : {}">
            <div class="preview-tip"><i class="fa-solid fa-panorama"></i>{{ t("common.preview") }}</div>
          </div>
        </UiCard>

        <div class="actions">
          <button type="button" class="save-btn" :disabled="saving" @click="submitSettings">
            <i class="fa-regular fa-floppy-disk"></i>
            {{ saving ? t("common.saving") : t("settings.save") }}
          </button>
        </div>

        <p v-if="error" class="state-tip error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</p>
        <p v-if="success" class="state-tip success"><i class="fa-solid fa-circle-check"></i>{{ success }}</p>
      </template>
    </section>
  </TiLayout>
</template>
