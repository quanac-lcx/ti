<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { renderLuoguMarkdown } from "../utils/luoguMarkdown";
import { parseQuestionConfig } from "../utils/questionConfigParser";

export type ProblemsetType =
  | "official_public"
  | "personal_featured"
  | "personal_public"
  | "personal_private";

export interface ProblemsetForm {
  id: string;
  title: string;
  description: string;
  durationMinutes: number;
  questionConfig: string;
  problemsetType: ProblemsetType;
}

const props = withDefaults(defineProps<{
  form: ProblemsetForm;
  isAdmin?: boolean;
  mode?: "create" | "edit";
}>(), {
  isAdmin: false,
  mode: "create"
});

const { t } = useI18n();

const typeOptions = computed(() => {
  if (props.isAdmin) {
    return [
      { value: "official_public" as const, label: t("problemset.types.officialPublic") },
      { value: "personal_featured" as const, label: t("problemset.types.personalFeatured") },
      { value: "personal_public" as const, label: t("problemset.types.personalPublic") },
      { value: "personal_private" as const, label: t("problemset.types.personalPrivate") }
    ];
  }
  return [
    { value: "personal_public" as const, label: t("problemset.types.personalPublic") },
    { value: "personal_private" as const, label: t("problemset.types.personalPrivate") }
  ];
});

const previewParsed = computed(() => parseQuestionConfig(props.form.questionConfig));

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

const previewEmptyText = computed(() =>
  props.mode === "create"
    ? t("problemset.create.previewEmpty")
    : t("problemset.edit.previewEmpty")
);

function questionTypeLabel(type: "option" | "input") {
  return type === "input" ? t("problemset.common.input") : t("problemset.common.option");
}

defineExpose({
  previewErrors,
  questionCount,
  materialGroupCount
});
</script>

<template>
  <div class="form-grid">
    <label v-if="mode === 'edit' || isAdmin">
      <span>{{ mode === 'create' ? 'ID' : t('problemset.edit.idLabel') }}</span>
      <input
        v-model="form.id"
        type="number"
        min="1"
        :disabled="mode === 'edit' && !isAdmin"
        :placeholder="mode === 'create' && isAdmin ? t('problemset.create.adminIdPlaceholder') : undefined"
      />
    </label>

    <label>
      <span>{{ t("problemset.common.name") }}</span>
      <input
        v-model.trim="form.title"
        type="text"
        :placeholder="mode === 'create' ? t('problemset.create.namePlaceholder') : undefined"
      />
    </label>

    <label>
      <span>{{ t("problemset.common.description") }}</span>
      <textarea
        v-model="form.description"
        rows="3"
        :placeholder="mode === 'create' ? t('problemset.create.descriptionPlaceholder') : undefined"
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
          <p>
            {{ t("problemset.create.aiGenTip") }}
            <router-link to="/system/ai-gen">{{ t("problemset.create.aiGenLinkText") }}</router-link>
          </p>
        </div>
      </details>
    </div>

    <label>
      <span>{{ t("problemset.common.config") }}</span>
      <textarea
        v-model="form.questionConfig"
        rows="20"
        :placeholder="mode === 'create' ? t('problemset.create.configPlaceholder') : undefined"
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
    <slot name="actions" />
  </div>
</template>
