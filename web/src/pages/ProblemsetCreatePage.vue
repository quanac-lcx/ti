<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import ProblemsetConfigEditor, { type ProblemsetForm, type ProblemsetType } from "../components/ProblemsetConfigEditor.vue";
import UiCard from "../components/UiCard.vue";
import TiLayout from "../layouts/TiLayout.vue";
import { loadLocalUser } from "../api/auth";
import { problemsetApi } from "../api/problemset";
import { useUnsavedChangesGuard } from "../composables/useUnsavedChangesGuard";

const router = useRouter();
const { t } = useI18n();
const currentUser = loadLocalUser();
const pending = ref(false);
const error = ref("");
const success = ref("");

const isAdmin = computed(() => Boolean(currentUser?.isAdmin));

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
  getSnapshot: buildFormSnapshot
});

markCurrentSnapshotSaved();

const templateFillLabel = computed(() => t("problemset.create.fillTemplate"));
const editorRef = ref<InstanceType<typeof ProblemsetConfigEditor>>();

const createProblemset = async () => {
  error.value = "";
  success.value = "";

  const customIdRaw = String(form.id ?? "").trim();
  const customId = Number(customIdRaw);
  if (!currentUser?.uid) {
    error.value = t("common.loginFirst");
    return;
  }
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
  if (isAdmin.value && customIdRaw && (!Number.isInteger(customId) || customId <= 0)) {
    error.value = t("problemset.create.errors.idInvalid");
    return;
  }

  pending.value = true;
  try {
    const created = await problemsetApi.create({
      ...(isAdmin.value && customIdRaw ? { id: customId } : {}),
      title: form.title.trim(),
      description: form.description.trim(),
      durationMinutes: Number(form.durationMinutes),
      questionConfig: form.questionConfig,
      problemsetType: form.problemsetType
    });
    success.value = t("problemset.create.created", { id: created.id });
    allowNextLeaveWithoutConfirm();
    await router.push(`/problemset/${created.id}`);
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    pending.value = false;
  }
};
</script>

<template>
  <TiLayout :title="t('problemset.create.title')" :subtitle="t('problemset.create.subtitle')" :use-panel="false">
    <section class="problemset-create-page create-wrap page-shell">
      <UiCard as="div" class="create-card create-main">
        <h2>{{ t("problemset.create.heading") }}</h2>

        <div v-if="!currentUser" class="warning">
          {{ t("common.loginFirst") }}<router-link to="/auth/login">{{ t("common.goLogin") }}</router-link>
        </div>

        <template v-else>
          <ProblemsetConfigEditor ref="editorRef" :form="form" :is-admin="isAdmin" mode="create">
            <template #actions>
              <button type="button" class="btn btn-ghost" @click="form.questionConfig = t('problemset.create.ruleTemplate')">{{ templateFillLabel }}</button>
              <button type="button" class="btn btn-primary" :disabled="pending" @click="createProblemset">
                {{ pending ? t("common.creating") : t("problemset.create.submit") }}
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
