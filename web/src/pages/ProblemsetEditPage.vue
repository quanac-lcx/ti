<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import ProblemsetConfigEditor, { type ProblemsetForm, type ProblemsetType } from "../components/ProblemsetConfigEditor.vue";
import UiCard from "../components/UiCard.vue";
import TiLayout from "../layouts/TiLayout.vue";
import { loadLocalUser } from "../api/auth";
import { problemsetApi } from "../api/problemset";
import { useUnsavedChangesGuard } from "../composables/useUnsavedChangesGuard";
import { askConfirm } from "../composables/feedback";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const currentUser = loadLocalUser();
const pending = ref(false);
const deleting = ref(false);
const loading = ref(true);
const error = ref("");
const success = ref("");

const isAdmin = computed(() => Boolean(currentUser?.isAdmin));
const sourceId = computed(() => Number(route.params.id));

const form = reactive<ProblemsetForm>({
  id: "",
  title: "",
  description: "",
  durationMinutes: 120,
  questionConfig: "",
  problemsetType: (isAdmin.value ? "official_public" : "personal_public") as ProblemsetType
});

function buildFormSnapshot() {
  return JSON.stringify({
    id: String(form.id ?? ""),
    title: String(form.title ?? ""),
    description: String(form.description ?? ""),
    durationMinutes: Number(form.durationMinutes ?? 0),
    questionConfig: String(form.questionConfig ?? ""),
    problemsetType: form.problemsetType
  });
}

const { markCurrentSnapshotSaved, allowNextLeaveWithoutConfirm } = useUnsavedChangesGuard({
  getSnapshot: buildFormSnapshot,
  isEnabled: () => !loading.value
});

const editorRef = ref<InstanceType<typeof ProblemsetConfigEditor>>();

async function loadEditable() {
  loading.value = true;
  error.value = "";
  try {
    const detail = await problemsetApi.getEditable(sourceId.value);
    form.id = String(detail.id);
    form.title = detail.title;
    form.description = detail.description;
    form.durationMinutes = detail.durationMinutes;
    form.questionConfig = detail.questionConfig;
    form.problemsetType = detail.problemsetType;
    markCurrentSnapshotSaved();
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    loading.value = false;
  }
}

async function saveEdit() {
  error.value = "";
  success.value = "";

  if (!form.title.trim()) {
    error.value = t("problemset.create.errors.titleRequired");
    return;
  }
  if (!form.description.trim()) {
    error.value = t("problemset.create.errors.descriptionRequired");
    return;
  }
  if (!Number.isFinite(form.durationMinutes) || form.durationMinutes <= 0) {
    error.value = t("problemset.create.errors.durationInvalid");
    return;
  }
  if (!form.questionConfig.trim()) {
    error.value = t("problemset.create.errors.configRequired");
    return;
  }
  if ((editorRef.value?.previewErrors?.length ?? 0) > 0) {
    error.value = editorRef.value!.previewErrors![0];
    return;
  }

  pending.value = true;
  try {
    const payload = {
      ...(isAdmin.value ? { id: Number(form.id) } : {}),
      title: form.title.trim(),
      description: form.description.trim(),
      durationMinutes: Number(form.durationMinutes),
      questionConfig: form.questionConfig,
      problemsetType: form.problemsetType
    } as const;
    const updated = await problemsetApi.update(sourceId.value, payload);
    success.value = t("problemset.edit.updated");
    markCurrentSnapshotSaved();
    allowNextLeaveWithoutConfirm();
    await router.push(`/problemset/${updated.id}`);
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    pending.value = false;
  }
}

async function removeProblemset() {
  error.value = "";
  success.value = "";

  const confirmed = await askConfirm({
    title: t("problemset.edit.deleteTitle"),
    message: t("problemset.edit.deleteMessage"),
    confirmText: t("problemset.edit.deleteConfirm"),
    cancelText: t("common.cancel"),
    danger: true
  });
  if (!confirmed) return;

  deleting.value = true;
  try {
    await problemsetApi.delete(sourceId.value);
    allowNextLeaveWithoutConfirm();
    await router.push("/problemset");
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    deleting.value = false;
  }
}

onMounted(() => {
  loadEditable();
});

watch(sourceId, loadEditable);
</script>

<template>
  <TiLayout
    :title="t('problemset.edit.title')"
    :subtitle="t('problemset.edit.subtitle')"
    :use-panel="false"
    :loading="loading"
    :loading-label="t('problemset.edit.loading')"
  >
    <section class="problemset-edit-page create-wrap page-shell">
      <UiCard as="div" class="create-card create-main">
        <div class="title-actions">
          <h2>{{ t("problemset.edit.heading") }}</h2>
          <div class="actions actions-top">
            <button class="btn btn-primary" :disabled="pending || deleting" @click="saveEdit">
              {{ pending ? t("common.saving") : t("problemset.edit.save") }}
            </button>
            <button class="btn btn-danger" :disabled="pending || deleting" @click="removeProblemset">
              {{ deleting ? t("common.deleting") : t("problemset.edit.deleteButton") }}
            </button>
          </div>
        </div>

        <template v-if="!loading">
          <ProblemsetConfigEditor ref="editorRef" :form="form" :is-admin="isAdmin" mode="edit">
            <template #actions>
              <button class="btn btn-primary" :disabled="pending || deleting" @click="saveEdit">
                {{ pending ? t("common.saving") : t("problemset.edit.save") }}
              </button>
              <button class="btn btn-danger" :disabled="pending || deleting" @click="removeProblemset">
                {{ deleting ? t("common.deleting") : t("problemset.edit.deleteButton") }}
              </button>
            </template>
          </ProblemsetConfigEditor>

          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="success" class="success">{{ success }}</p>
        </template>
      </UiCard>
    </section>
  </TiLayout>
</template>
