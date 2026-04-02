<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import {
  getMySettings,
  loadLocalUser,
  saveLocalUser,
  updateMySettings,
  type AutosaveIntervalSeconds
} from "../api/auth";

const router = useRouter();
const loading = ref(true);
const saving = ref(false);
const error = ref("");
const success = ref("");

const recordsPublic = ref(true);
const profileCoverUrl = ref("");
const submissionAnalysisMode = ref<"none" | "wrong_only" | "all">("wrong_only");
const autosaveIntervalSeconds = ref<AutosaveIntervalSeconds>(30);

const autosaveOptions: Array<{ value: AutosaveIntervalSeconds; label: string }> = [
  { value: 30, label: "30 秒" },
  { value: 60, label: "60 秒" },
  { value: 120, label: "120 秒" },
  { value: 300, label: "5 分钟" },
  { value: 600, label: "10 分钟" },
  { value: 0, label: "不开启" }
];

function normalizeAutosaveInterval(value: unknown): AutosaveIntervalSeconds {
  const parsed = Number(value);
  if (parsed === 0 || parsed === 30 || parsed === 60 || parsed === 120 || parsed === 300 || parsed === 600) {
    return parsed;
  }
  return 30;
}

function clearCoverUrl() {
  profileCoverUrl.value = "";
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
    success.value = "设置已保存。";
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    saving.value = false;
  }
}

onMounted(loadSettings);
</script>

<template>
  <TiLayout title="个人设置" subtitle="洛谷有题 / 账户设置">
    <section class="settings-root">
      <div class="settings-notice">
        <i class="fa-solid fa-circle-info"></i>
        <div>
          <strong>注意</strong>
          <p>修改后记得点击底部“保存设置”。如需修改头像、显示名称、个人简介，请<a href="https://auth.luogu.me/profile" target="_blank" rel="noopener noreferrer">前往此处</a>，修改后重新登录才会同步。</p>
        </div>
      </div>

      <div v-if="loading" class="state-tip">加载设置中...</div>

      <template v-else>
        <div class="settings-item">
          <label class="item-title" for="records-public"><i class="fa-solid fa-eye"></i>做题记录公开可见</label>
          <div class="switch">
            <label>
              <input v-model="recordsPublic" type="radio" :value="true" />
              <i class="fa-solid fa-globe"></i>
              <span>公开</span>
            </label>
            <label>
              <input v-model="recordsPublic" type="radio" :value="false" />
              <i class="fa-solid fa-user-shield"></i>
              <span>仅自己和管理员可见</span>
            </label>
          </div>
        </div>

        <div class="settings-item">
          <label class="item-title" for="submission-analysis-mode"><i class="fa-solid fa-file-circle-check"></i>Submission 解析展开策略</label>
          <div class="switch">
            <label>
              <input v-model="submissionAnalysisMode" type="radio" value="wrong_only" />
              <i class="fa-solid fa-circle-exclamation"></i>
              <span>仅展开错题解析</span>
            </label>
            <label>
              <input v-model="submissionAnalysisMode" type="radio" value="none" />
              <i class="fa-regular fa-eye-slash"></i>
              <span>不展开任何解析</span>
            </label>
            <label>
              <input v-model="submissionAnalysisMode" type="radio" value="all" />
              <i class="fa-regular fa-eye"></i>
              <span>展开所有解析</span>
            </label>
          </div>
          <p class="item-desc">作用于提交记录页（/problemset/:id?submission=:sid）。</p>
        </div>

        <div class="settings-item">
          <label class="item-title"><i class="fa-regular fa-floppy-disk"></i>作答自动保存间隔</label>
          <div class="switch">
            <label v-for="option in autosaveOptions" :key="option.value">
              <input v-model="autosaveIntervalSeconds" type="radio" :value="option.value" />
              <i class="fa-regular fa-clock"></i>
              <span>{{ option.label }}</span>
            </label>
          </div>
          <p class="item-desc">用于限时测试和自由练习的本地自动保存恢复。</p>
        </div>

        <div class="settings-item">
          <label class="item-title" for="profile-cover-url"><i class="fa-regular fa-image"></i>个人资料背景图 URL</label>
          <input
            id="profile-cover-url"
            v-model.trim="profileCoverUrl"
            class="text-input"
            type="url"
            placeholder="留空则使用默认背景"
          />
          <p class="item-desc">仅支持 http(s) 链接。</p>
          <div class="cover-actions">
            <button type="button" class="minor-btn" @click="clearCoverUrl">
              <i class="fa-solid fa-eraser"></i>
              清空背景图
            </button>
          </div>
          <div class="cover-preview" :style="profileCoverUrl ? { backgroundImage: `url(${profileCoverUrl})` } : {}">
            <div class="preview-tip"><i class="fa-solid fa-panorama"></i>预览</div>
          </div>
        </div>

        <div class="actions">
          <button type="button" class="save-btn" :disabled="saving" @click="submitSettings">
            <i class="fa-regular fa-floppy-disk"></i>
            {{ saving ? "保存中..." : "保存设置" }}
          </button>
        </div>

        <p v-if="error" class="state-tip error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</p>
        <p v-if="success" class="state-tip success"><i class="fa-solid fa-circle-check"></i>{{ success }}</p>
      </template>
    </section>
  </TiLayout>
</template>
