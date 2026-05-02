<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  createAdminSystemPage,
  deleteAdminSystemPage,
  fetchAdminSystemPages,
  updateAdminSystemPage,
  updateAdminSystemPageSettings,
  type AdminSystemPagesPayload
} from "../../api/admin";
import type { SystemPage } from "../../api/siteContent";
import { askConfirm, notifyError, notifySuccess } from "../../composables/feedback";
import { renderLuoguMarkdown } from "../../utils/luoguMarkdown";

const { t } = useI18n();
const USER_AGREEMENT_SLUG = "user-agreement";
const PRIVACY_POLICY_SLUG = "privacy-policy";

const loading = ref(false);
const savingSettings = ref(false);
const savingPage = ref(false);
const pages = ref<SystemPage[]>([]);

const settingsForm = reactive<AdminSystemPagesPayload>({
  loginNoticeMarkdown: "",
  userAgreementPage: {
    slug: USER_AGREEMENT_SLUG,
    title: "User Agreement",
    content: ""
  },
  privacyPolicyPage: {
    slug: PRIVACY_POLICY_SLUG,
    title: "Privacy Policy",
    content: ""
  }
});

const customPageForm = reactive({
  id: 0,
  slug: "",
  title: "",
  content: ""
});

const loginNoticePreview = computed(() => renderLuoguMarkdown(settingsForm.loginNoticeMarkdown));
const userAgreementPreview = computed(() => renderLuoguMarkdown(settingsForm.userAgreementPage.content));
const privacyPolicyPreview = computed(() => renderLuoguMarkdown(settingsForm.privacyPolicyPage.content));
const customPagePreview = computed(() => renderLuoguMarkdown(customPageForm.content));

function applyAdminSystemPages(data: {
  loginNoticeMarkdown: string;
  userAgreementPage: SystemPage | null;
  privacyPolicyPage: SystemPage | null;
  pages: SystemPage[];
}) {
  settingsForm.loginNoticeMarkdown = data.loginNoticeMarkdown ?? "";
  settingsForm.userAgreementPage.slug = USER_AGREEMENT_SLUG;
  settingsForm.userAgreementPage.title = data.userAgreementPage?.title ?? "User Agreement";
  settingsForm.userAgreementPage.content = data.userAgreementPage?.content ?? "";
  settingsForm.privacyPolicyPage.slug = PRIVACY_POLICY_SLUG;
  settingsForm.privacyPolicyPage.title = data.privacyPolicyPage?.title ?? "Privacy Policy";
  settingsForm.privacyPolicyPage.content = data.privacyPolicyPage?.content ?? "";
  pages.value = data.pages ?? [];
}

function resetCustomPageForm() {
  customPageForm.id = 0;
  customPageForm.slug = "";
  customPageForm.title = "";
  customPageForm.content = "";
}

function editCustomPage(page: SystemPage) {
  customPageForm.id = page.id;
  customPageForm.slug = page.slug;
  customPageForm.title = page.title;
  customPageForm.content = page.content;
}

function previewCustomPage(page: SystemPage) {
  window.open(`/system/${page.slug}`, "_blank", "noopener,noreferrer");
}

async function loadAll() {
  loading.value = true;
  try {
    const data = await fetchAdminSystemPages();
    applyAdminSystemPages(data);
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    loading.value = false;
  }
}

async function saveSettings() {
  savingSettings.value = true;
  try {
    const data = await updateAdminSystemPageSettings({
      loginNoticeMarkdown: settingsForm.loginNoticeMarkdown,
      userAgreementPage: {
        slug: USER_AGREEMENT_SLUG,
        title: settingsForm.userAgreementPage.title,
        content: settingsForm.userAgreementPage.content
      },
      privacyPolicyPage: {
        slug: PRIVACY_POLICY_SLUG,
        title: settingsForm.privacyPolicyPage.title,
        content: settingsForm.privacyPolicyPage.content
      }
    });
    applyAdminSystemPages(data);
    notifySuccess(t("admin.systemPages.settingsSaved"));
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    savingSettings.value = false;
  }
}

async function saveCustomPage() {
  savingPage.value = true;
  try {
    if (customPageForm.id > 0) {
      await updateAdminSystemPage(customPageForm.id, {
        slug: customPageForm.slug,
        title: customPageForm.title,
        content: customPageForm.content
      });
      notifySuccess(t("admin.systemPages.updated"));
    } else {
      await createAdminSystemPage({
        slug: customPageForm.slug,
        title: customPageForm.title,
        content: customPageForm.content
      });
      notifySuccess(t("admin.systemPages.created"));
    }
    resetCustomPageForm();
    await loadAll();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    savingPage.value = false;
  }
}

async function removeCustomPage(page: SystemPage) {
  const confirmed = await askConfirm({
    title: t("admin.systemPages.deleteTitle"),
    message: t("admin.systemPages.deleteMessage", { title: page.title }),
    confirmText: t("common.delete"),
    cancelText: t("common.cancel"),
    danger: true
  });
  if (!confirmed) return;

  try {
    await deleteAdminSystemPage(page.id);
    if (customPageForm.id === page.id) {
      resetCustomPageForm();
    }
    notifySuccess(t("admin.systemPages.deleted"));
    await loadAll();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  }
}

onMounted(loadAll);
</script>

<template>
  <div class="admin-page">
    <nav class="admin-anchor-nav">
      <a href="#site-settings">{{ t("admin.systemPages.siteSettings") }}</a>
      <a href="#custom-page-list">{{ t("admin.systemPages.customPages") }}</a>
      <a href="#custom-page-editor">{{ t("admin.systemPages.pageEditor") }}</a>
    </nav>

    <section id="site-settings" class="admin-card">
      <div class="admin-head">
        <h3>{{ t("admin.systemPages.siteSettings") }}</h3>
        <button class="admin-btn" type="button" @click="loadAll">{{ t("common.refresh") }}</button>
      </div>

      <div v-if="loading">{{ t("common.loading") }}</div>
      <template v-else>
        <div class="admin-form-grid">
          <label>
            <span>{{ t("admin.systemPages.loginNotice") }}</span>
            <textarea v-model="settingsForm.loginNoticeMarkdown" rows="8" :placeholder="t('admin.systemPages.markdownPlaceholder')" />
          </label>
        </div>
        <div v-if="loginNoticePreview" class="admin-markdown-preview">
          <div class="admin-preview-title">{{ t("common.preview") }}</div>
          <div class="luogu-markdown" v-html="loginNoticePreview"></div>
        </div>

        <div class="admin-system-page-grid">
          <section class="admin-system-page-block">
            <h4>{{ t("auth.userAgreement") }}</h4>
            <div class="admin-form-grid">
              <label>
                <span>{{ t("admin.systemPages.path") }}</span>
                <input :value="`/system/${USER_AGREEMENT_SLUG}`" type="text" disabled />
              </label>
              <label>
                <span>{{ t("admin.systemPages.pageTitle") }}</span>
                <input v-model.trim="settingsForm.userAgreementPage.title" type="text" :placeholder="t('auth.userAgreement')" />
              </label>
              <label>
                <span>{{ t("admin.systemPages.markdownContent") }}</span>
                <textarea v-model="settingsForm.userAgreementPage.content" rows="12" :placeholder="t('admin.systemPages.markdownPlaceholder')" />
              </label>
            </div>
            <div v-if="userAgreementPreview" class="admin-markdown-preview">
              <div class="admin-preview-title">{{ t("common.preview") }}</div>
              <div class="luogu-markdown" v-html="userAgreementPreview"></div>
            </div>
          </section>

          <section class="admin-system-page-block">
            <h4>{{ t("auth.privacyPolicy") }}</h4>
            <div class="admin-form-grid">
              <label>
                <span>{{ t("admin.systemPages.path") }}</span>
                <input :value="`/system/${PRIVACY_POLICY_SLUG}`" type="text" disabled />
              </label>
              <label>
                <span>{{ t("admin.systemPages.pageTitle") }}</span>
                <input v-model.trim="settingsForm.privacyPolicyPage.title" type="text" :placeholder="t('auth.privacyPolicy')" />
              </label>
              <label>
                <span>{{ t("admin.systemPages.markdownContent") }}</span>
                <textarea v-model="settingsForm.privacyPolicyPage.content" rows="12" :placeholder="t('admin.systemPages.markdownPlaceholder')" />
              </label>
            </div>
            <div v-if="privacyPolicyPreview" class="admin-markdown-preview">
              <div class="admin-preview-title">{{ t("common.preview") }}</div>
              <div class="luogu-markdown" v-html="privacyPolicyPreview"></div>
            </div>
          </section>
        </div>

        <div class="admin-actions">
          <button class="admin-btn primary" type="button" :disabled="savingSettings" @click="saveSettings">
            {{ savingSettings ? t("common.saving") : t("admin.systemPages.saveSettings") }}
          </button>
        </div>
      </template>
    </section>

    <section id="custom-page-list" class="admin-card">
      <div class="admin-head">
        <h3>{{ t("admin.systemPages.customPages") }}</h3>
        <button class="admin-btn" type="button" @click="resetCustomPageForm">{{ t("admin.systemPages.newPage") }}</button>
      </div>

      <table v-if="pages.length > 0" class="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Slug</th>
            <th>{{ t("admin.systemPages.pageTitle") }}</th>
            <th>{{ t("admin.systemPages.updatedAt") }}</th>
            <th>{{ t("admin.common.actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="page in pages" :key="page.id">
            <td>{{ page.id }}</td>
            <td><code>/system/{{ page.slug }}</code></td>
            <td>{{ page.title }}</td>
            <td>{{ page.updatedAt }}</td>
            <td class="actions">
              <button class="admin-btn" type="button" @click="editCustomPage(page)">{{ t("common.edit") }}</button>
              <button class="admin-btn" type="button" @click="previewCustomPage(page)">{{ t("common.preview") }}</button>
              <button class="admin-btn danger" type="button" @click="removeCustomPage(page)">{{ t("common.delete") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
      <p v-else class="admin-hint">{{ t("admin.systemPages.empty") }}</p>
    </section>

    <section id="custom-page-editor" class="admin-card">
      <div class="admin-head">
        <h3>{{ customPageForm.id > 0 ? t("admin.systemPages.editPage") : t("admin.systemPages.createPage") }}</h3>
      </div>

      <div class="admin-form-grid">
        <label>
          <span>{{ t("admin.systemPages.urlSlug") }}</span>
          <input v-model.trim="customPageForm.slug" type="text" :placeholder="t('admin.systemPages.slugPlaceholder')" />
        </label>
        <label>
          <span>{{ t("admin.systemPages.pageTitle") }}</span>
          <input v-model.trim="customPageForm.title" type="text" :placeholder="t('admin.systemPages.titlePlaceholder')" />
        </label>
        <label>
          <span>{{ t("admin.systemPages.markdownContent") }}</span>
          <textarea v-model="customPageForm.content" rows="16" :placeholder="t('admin.systemPages.markdownPlaceholder')" />
        </label>
      </div>

      <div class="admin-page-link-hint">
        {{ t("admin.systemPages.path") }}: <code>/system/{{ customPageForm.slug || t("admin.systemPages.slugFallback") }}</code>
      </div>

      <div v-if="customPagePreview" class="admin-markdown-preview">
        <div class="admin-preview-title">{{ t("common.preview") }}</div>
        <div class="luogu-markdown" v-html="customPagePreview"></div>
      </div>

      <div class="admin-actions">
        <button class="admin-btn primary" type="button" :disabled="savingPage" @click="saveCustomPage">
          {{ savingPage ? t("common.saving") : customPageForm.id > 0 ? t("admin.systemPages.savePage") : t("admin.systemPages.createPage") }}
        </button>
        <button class="admin-btn" type="button" @click="resetCustomPageForm">{{ t("common.reset") }}</button>
      </div>
    </section>
  </div>
</template>
