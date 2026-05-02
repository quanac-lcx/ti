<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import UiCard from "../components/UiCard.vue";
import TiLayout from "../layouts/TiLayout.vue";
import { loadLocalUser } from "../api/auth";
import { problemsetApi } from "../api/problemset";
import { useUnsavedChangesGuard } from "../composables/useUnsavedChangesGuard";
import { renderLuoguMarkdown } from "../utils/luoguMarkdown";
import { parseQuestionConfig } from "../utils/questionConfigParser";

type ProblemsetType =
  | "official_public"
  | "personal_featured"
  | "personal_public"
  | "personal_private";

const router = useRouter();
const { t } = useI18n();
const currentUser = loadLocalUser();
const pending = ref(false);
const error = ref("");
const success = ref("");

const isAdmin = computed(() => Boolean(currentUser?.isAdmin));

const form = reactive({
  id: "",
  title: "",
  description: "",
  durationMinutes: 120,
  questionConfig: "",
  problemsetType: (isAdmin.value ? "official_public" : "personal_public") as ProblemsetType
});

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

const ruleTemplateText = computed(() => t("problemset.create.ruleTemplate"));

function materialGroupTitle(index: number) {
  return t("problemset.common.materialGroupWithIndex", { index });
}

function questionTypeLabel(type: "option" | "input") {
  return type === "input" ? t("problemset.common.input") : t("problemset.common.option");
}

const previewPlaceholder = computed(() => t("problemset.common.answerPlaceholder"));

const templateFillLabel = computed(() => t("problemset.create.fillTemplate"));

const previewEmptyText = computed(() => t("problemset.create.previewEmpty"));

const previewParsed = computed(() => parseQuestionConfig(form.questionConfig));

const previewGroups = computed(() => {
  let globalIndex = 0;
  return previewParsed.value.groups.map((group, groupIndex) => ({
    materialGroupIndex: group.materialGroupIndex,
    title: group.title || (group.material ? materialGroupTitle(groupIndex + 1) : ""),
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
  if (previewErrors.value.length > 0) {
    error.value = previewErrors.value[0];
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
          <div class="form-grid">
            <label v-if="isAdmin">
              <span>ID</span>
              <input
                v-model="form.id"
                type="number"
                min="1"
                :placeholder="t('problemset.create.adminIdPlaceholder')"
              />
            </label>

            <label>
              <span>{{ t("problemset.common.name") }}</span>
              <input v-model.trim="form.title" type="text" :placeholder="t('problemset.create.namePlaceholder')" />
            </label>

            <label>
              <span>{{ t("problemset.common.description") }}</span>
              <textarea
                v-model="form.description"
                rows="3"
                :placeholder="t('problemset.create.descriptionPlaceholder')"
              ></textarea>
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
                <summary>{{ t("problemset.create.configSummary") }}</summary>
                <div class="tip-body">
                  <ol>
                    <li>{{ t("problemset.create.rules.item1") }}</li>
                    <li>{{ t("problemset.create.rules.item2") }}</li>
                    <li>{{ t("problemset.create.rules.item3") }}</li>
                    <li>{{ t("problemset.create.rules.item4") }}</li>
                    <li>{{ t("problemset.create.rules.item5") }}</li>
                    <li>{{ t("problemset.create.rules.item6") }}</li>
                    <li>{{ t("problemset.create.rules.item7") }}</li>
                    <li>{{ t("problemset.create.rules.item8") }}</li>
                  </ol>
                </div>
              </details>
            </div>

            <label>
              <span>{{ t("problemset.common.config") }}</span>
              <textarea
                v-model="form.questionConfig"
                rows="20"
                :placeholder="t('problemset.create.configPlaceholder')"
              ></textarea>
            </label>

            <div class="preview-card">
              <div class="preview-title">{{ t("problemset.common.livePreview") }}</div>
              <ul v-if="previewErrors.length" class="preview-errors">
                <li v-for="(msg, index) in previewErrors" :key="index">{{ msg }}</li>
              </ul>

              <div v-if="previewGroups.length === 0" class="preview-empty">
                {{ previewEmptyText }}
              </div>

              <div v-else class="preview-list">
                <section
                  v-for="(group, groupIndex) in previewGroups"
                  :key="group.materialGroupIndex ?? `single-${groupIndex}`"
                  class="preview-group"
                >
                  <div v-if="group.materialHtml" class="preview-material">
                    <div class="preview-material-title">
                      {{ group.title || materialGroupTitle(groupIndex + 1) }}
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
                      <input type="text" :placeholder="question.inputPlaceholder || previewPlaceholder" disabled />
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
            <button type="button" class="btn btn-ghost" @click="form.questionConfig = ruleTemplateText">{{ templateFillLabel }}</button>
            <button type="button" class="btn btn-primary" :disabled="pending" @click="createProblemset">
              {{ pending ? t("common.creating") : t("problemset.create.submit") }}
            </button>
          </div>

          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="success" class="success">{{ success }}</p>
        </template>
      </UiCard>
    </section>
  </TiLayout>
</template>
