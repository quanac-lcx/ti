<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import UiCard from "../components/UiCard.vue";
import TiLayout from "../layouts/TiLayout.vue";
import { loadLocalUser } from "../api/auth";
import { problemsetApi } from "../api/problemset";
import { useUnsavedChangesGuard } from "../composables/useUnsavedChangesGuard";
import { renderLuoguMarkdown } from "../utils/luoguMarkdown";
import { parseQuestionConfig } from "../utils/questionConfigParser";
import { askConfirm } from "../composables/feedback";

type ProblemsetType =
  | "official_public"
  | "personal_featured"
  | "personal_public"
  | "personal_private";

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

const form = reactive({
  id: "",
  title: "",
  description: "",
  durationMinutes: 120,
  questionConfig: "",
  problemsetType: (isAdmin.value ? "official_public" : "personal_public") as ProblemsetType
});

const previewParsed = computed(() => parseQuestionConfig(form.questionConfig));

const previewGroups = computed(() => {
  let globalIndex = 0;
  return previewParsed.value.groups.map((group, groupIndex) => ({
    materialGroupIndex: group.materialGroupIndex,
    title: group.title || (group.material ? t("problemset.common.materialGroupWithIndex", { index: groupIndex + 1 }) : ""),
    material: group.material,
    materialHtml: group.material ? renderLuoguMarkdown(group.material) : "",
    questions: group.questions.map((question) => {
      globalIndex += 1;
      return {
        ...question,
        index: globalIndex,
        stemHtml: renderLuoguMarkdown(question.stem),
        analysisHtml: renderLuoguMarkdown(question.analysis),
        optionsHtml: question.options.map((option) => ({
          ...option,
          html: renderLuoguMarkdown(option.text)
        }))
      };
    })
  }));
});

const previewErrors = computed(() => previewParsed.value.errors);
const questionCount = computed(() => previewParsed.value.questions.length);
const materialGroupCount = computed(() =>
  previewParsed.value.groups.filter((group) => group.material.trim().length > 0).length
);

const typeOptions = computed(() => {
  if (isAdmin.value) {
    return [
      { value: "official_public", label: t("problemset.types.officialPublic") },
      { value: "personal_featured", label: t("problemset.types.personalFeatured") },
      { value: "personal_public", label: t("problemset.types.personalPublic") },
      { value: "personal_private", label: t("problemset.types.personalPrivate") }
    ];
  }
  return [
    { value: "personal_public", label: t("problemset.types.personalPublic") },
    { value: "personal_private", label: t("problemset.types.personalPrivate") }
  ];
});

function questionTypeLabel(type: "option" | "input") {
  return type === "input" ? t("problemset.common.input") : t("problemset.common.option");
}

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
  if (previewErrors.value.length > 0) {
    error.value = previewErrors.value[0];
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
          <div class="form-grid">
            <label>
              <span>{{ t("problemset.edit.idLabel") }}</span>
              <input v-model="form.id" type="number" min="1" :disabled="!isAdmin" />
            </label>

            <label>
              <span>{{ t("problemset.common.name") }}</span>
              <input v-model.trim="form.title" type="text" />
            </label>

            <label>
              <span>{{ t("problemset.common.description") }}</span>
              <textarea v-model="form.description" rows="3"></textarea>
            </label>

            <label>
              <span>{{ t("problemset.common.durationMinutes") }}</span>
              <input v-model.number="form.durationMinutes" type="number" min="1" step="1" />
            </label>

            <label>
              <span>{{ t("problemset.common.type") }}</span>
              <select v-model="form.problemsetType">
                <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </label>

            <div class="collapse-tip">
              <details open>
                <summary>{{ t("problemset.edit.materialSummary") }}</summary>
                <div class="tip-body">
                  <p>{{ t("problemset.edit.materialIntro") }}</p>
                  <ol>
                    <li>{{ t("problemset.edit.materialItem1") }}</li>
                    <li>{{ t("problemset.edit.materialItem2") }}</li>
                  </ol>
                  <p>{{ t("problemset.edit.materialNote1") }}</p>
                  <p>{{ t("problemset.edit.materialNote2") }}</p>
                </div>
              </details>
            </div>

            <label>
              <span>{{ t("problemset.common.config") }}</span>
              <textarea v-model="form.questionConfig" rows="20"></textarea>
            </label>

            <div class="preview-card">
              <div class="preview-title">{{ t("problemset.common.livePreview") }}</div>
              <ul v-if="previewErrors.length" class="preview-errors">
                <li v-for="(msg, index) in previewErrors" :key="index">{{ msg }}</li>
              </ul>

              <div v-if="previewGroups.length === 0" class="preview-empty">
                {{ t("problemset.edit.previewEmpty") }}
              </div>

              <div v-else class="preview-list">
                <section
                  v-for="(group, groupIndex) in previewGroups"
                  :key="group.materialGroupIndex ?? `single-${groupIndex}`"
                  class="preview-group"
                >
                  <div v-if="group.materialHtml" class="preview-material">
                    <div class="preview-material-title">
                      {{ group.title || t("problemset.common.materialGroupWithIndex", { index: groupIndex + 1 }) }}
                    </div>
                    <div class="preview-material-content luogu-markdown" v-html="group.materialHtml"></div>
                  </div>

                  <article
                    v-for="question in group.questions"
                    :key="question.index"
                    class="preview-item"
                  >
                    <header class="preview-head">
                      <span class="preview-tag">{{ t("problemset.common.questionNumber", { index: question.index }) }}</span>
                      <span v-if="question.groupQuestionIndex" class="preview-meta">
                        {{ t("problemset.common.materialQuestionIndex", { index: question.groupQuestionIndex }) }}
                        <span v-if="question.groupQuestionCount"> / {{ question.groupQuestionCount }}</span>
                        {{ t("problemset.common.subQuestion") }}
                      </span>
                      <span class="preview-meta">
                        {{ t("problemset.common.typeLabel", { type: questionTypeLabel(question.type), score: question.score }) }}
                      </span>
                      <span class="preview-answer">{{ t("problemset.common.answerLabel", { answer: question.answer }) }}</span>
                    </header>

                    <div class="preview-stem luogu-markdown" v-html="question.stemHtml"></div>

                    <ul v-if="question.type === 'option'" class="preview-options">
                      <li v-for="option in question.optionsHtml" :key="option.key">
                        <strong>{{ option.key }}.</strong>
                        <span class="luogu-markdown" v-html="option.html"></span>
                      </li>
                    </ul>

                    <div v-else class="preview-input">
                      <label>{{ t("problemset.common.input") }}</label>
                      <input type="text" :placeholder="question.inputPlaceholder || t('problemset.common.answerPlaceholder')" disabled />
                    </div>

                    <div v-if="question.analysis" class="preview-analysis">
                      <strong>{{ t("problemset.common.analysis") }}</strong>
                      <div class="luogu-markdown" v-html="question.analysisHtml"></div>
                    </div>
                  </article>
                </section>
              </div>
            </div>
          </div>

          <div class="meta">
            <span>{{ t("problemset.create.parsedCount", { count: questionCount }) }}</span>
            <span v-if="materialGroupCount > 0">{{ t("problemset.create.materialGroupCount", { count: materialGroupCount }) }}</span>
          </div>

          <div class="actions">
            <button class="btn btn-primary" :disabled="pending || deleting" @click="saveEdit">
              {{ pending ? t("common.saving") : t("problemset.edit.save") }}
            </button>
            <button class="btn btn-danger" :disabled="pending || deleting" @click="removeProblemset">
              {{ deleting ? t("common.deleting") : t("problemset.edit.deleteButton") }}
            </button>
          </div>

          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="success" class="success">{{ success }}</p>
        </template>
      </UiCard>
    </section>
  </TiLayout>
</template>
