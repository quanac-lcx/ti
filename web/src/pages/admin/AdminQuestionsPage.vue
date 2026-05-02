<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import {
  createQuestion,
  deleteQuestion,
  fetchAdminProblemsetQuestions,
  fetchAdminProblemsets,
  type AdminProblemset,
  updateQuestion
} from "../../api/admin";
import type { ChoiceOption, ProblemQuestion } from "../../api/problemset";
import { askConfirm, notifyError, notifySuccess, notifyWarning } from "../../composables/feedback";

const { t } = useI18n();
const loadingProblemsets = ref(false);
const loadingQuestions = ref(false);
const problemsets = ref<AdminProblemset[]>([]);
const questions = ref<ProblemQuestion[]>([]);

const selectedProblemsetId = ref<number | null>(null);
const selectedQuestionIds = ref<string[]>([]);

const selectedSet = computed(() => new Set(selectedQuestionIds.value));
const allSelected = computed(() => questions.value.length > 0 && selectedQuestionIds.value.length === questions.value.length);

const questionForm = reactive({
  id: "",
  index: "",
  type: "option" as "option" | "input",
  stem: "",
  inputPlaceholder: "",
  optionsText: "A. Option A\nB. Option B",
  score: 1.5,
  answer: "",
  analysis: ""
});

function parseOptionsText(rawText: string): ChoiceOption[] {
  const lines = String(rawText ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  const parsed: ChoiceOption[] = [];
  for (let index = 0; index < lines.length && index < 26; index += 1) {
    const line = lines[index];
    const letterMatched = /^([A-Za-z])[\.\)]\s*(.+)$/.exec(line);
    if (letterMatched) {
      parsed.push({ key: letterMatched[1].toUpperCase(), text: letterMatched[2].trim() });
      continue;
    }
    const numberMatched = /^(\d+)[\.\)]\s*(.+)$/.exec(line);
    if (numberMatched) {
      const number = Number(numberMatched[1]);
      if (number >= 1 && number <= 26) {
        parsed.push({ key: String.fromCharCode(64 + number), text: numberMatched[2].trim() });
      }
    }
  }
  return parsed;
}

function optionsToText(options: ChoiceOption[]) {
  return options.map((item) => `${item.key}. ${item.text}`).join("\n");
}

function resetQuestionForm() {
  questionForm.id = "";
  questionForm.index = "";
  questionForm.type = "option";
  questionForm.stem = "";
  questionForm.inputPlaceholder = "";
  questionForm.optionsText = "A. Option A\nB. Option B";
  questionForm.score = 1.5;
  questionForm.answer = "";
  questionForm.analysis = "";
}

async function loadProblemsets() {
  loadingProblemsets.value = true;
  try {
    problemsets.value = await fetchAdminProblemsets();
    if (!problemsets.value.length) {
      selectedProblemsetId.value = null;
      questions.value = [];
      return;
    }
    if (!problemsets.value.some((item) => item.id === selectedProblemsetId.value)) {
      selectedProblemsetId.value = problemsets.value[0].id;
    }
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    loadingProblemsets.value = false;
  }
}

async function loadQuestions() {
  if (!selectedProblemsetId.value) {
    questions.value = [];
    return;
  }
  loadingQuestions.value = true;
  try {
    questions.value = await fetchAdminProblemsetQuestions(selectedProblemsetId.value);
    selectedQuestionIds.value = selectedQuestionIds.value.filter((id) => questions.value.some((item) => String(item.id) === id));
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  } finally {
    loadingQuestions.value = false;
  }
}

function selectQuestion(question: ProblemQuestion) {
  questionForm.id = String(question.id);
  questionForm.index = String(question.index);
  questionForm.type = question.type;
  questionForm.stem = question.stem;
  questionForm.inputPlaceholder = question.inputPlaceholder || "";
  questionForm.optionsText = optionsToText(question.options ?? []);
  questionForm.score = question.score;
  questionForm.answer = question.answer;
  questionForm.analysis = question.analysis;
  document.getElementById("question-edit")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function toggleAll() {
  if (allSelected.value) {
    selectedQuestionIds.value = [];
  } else {
    selectedQuestionIds.value = questions.value.map((item) => String(item.id));
  }
}

function toggleOne(id: string | number) {
  const normalized = String(id);
  if (selectedSet.value.has(normalized)) {
    selectedQuestionIds.value = selectedQuestionIds.value.filter((item) => item !== normalized);
  } else {
    selectedQuestionIds.value = [...selectedQuestionIds.value, normalized];
  }
}

async function deleteSelected() {
  if (selectedQuestionIds.value.length === 0) {
    notifyWarning(t("admin.questions.selectFirst"));
    return;
  }
  const confirmed = await askConfirm({
    title: t("admin.questions.bulkDeleteTitle"),
    message: t("admin.questions.bulkDeleteMessage", { count: selectedQuestionIds.value.length }),
    confirmText: t("admin.questions.bulkDeleteConfirm"),
    cancelText: t("common.cancel"),
    danger: true
  });
  if (!confirmed) return;

  let success = 0;
  for (const id of selectedQuestionIds.value) {
    try {
      await deleteQuestion(id);
      success += 1;
    } catch (err) {
      notifyError(t("admin.questions.deleteFailed", { id, reason: String((err as Error)?.message ?? err) }));
    }
  }
  notifySuccess(t("admin.questions.bulkDeleted", { success, total: selectedQuestionIds.value.length }));
  selectedQuestionIds.value = [];
  await loadQuestions();
}

async function submitQuestion() {
  if (!selectedProblemsetId.value) {
    notifyWarning(t("admin.questions.selectProblemsetFirst"));
    return;
  }
  try {
    const payload: {
      index?: number;
      type: "option" | "input";
      stem: string;
      inputPlaceholder: string;
      options: ChoiceOption[];
      score: number;
      answer: string;
      analysis: string;
    } = {
      type: questionForm.type,
      stem: questionForm.stem.trim(),
      inputPlaceholder: questionForm.inputPlaceholder.trim(),
      options: parseOptionsText(questionForm.optionsText),
      score: Number(questionForm.score),
      answer: questionForm.answer.trim().toUpperCase(),
      analysis: questionForm.analysis.trim()
    };
    const index = Number(questionForm.index);
    if (Number.isInteger(index) && index > 0) payload.index = index;

    if (questionForm.id) {
      await updateQuestion(questionForm.id, payload);
      notifySuccess(t("admin.questions.updated", { id: questionForm.id }));
    } else {
      await createQuestion(selectedProblemsetId.value, payload);
      notifySuccess(t("admin.questions.created"));
    }
    resetQuestionForm();
    await loadQuestions();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  }
}

async function deleteCurrentQuestion() {
  if (!questionForm.id) return;
  const confirmed = await askConfirm({
    title: t("admin.questions.deleteTitle"),
    message: t("admin.questions.deleteMessage", { id: questionForm.id }),
    confirmText: t("common.delete"),
    cancelText: t("common.cancel"),
    danger: true
  });
  if (!confirmed) return;

  try {
    await deleteQuestion(questionForm.id);
    notifySuccess(t("admin.questions.deleted", { id: questionForm.id }));
    resetQuestionForm();
    await loadQuestions();
  } catch (err) {
    notifyError(String((err as Error)?.message ?? err));
  }
}

onMounted(async () => {
  await loadProblemsets();
  await loadQuestions();
});
</script>

<template>
  <div class="admin-page">
    <nav class="admin-anchor-nav">
      <a href="#question-list">{{ t("admin.questions.listAnchor") }}</a>
      <a href="#question-edit">{{ t("admin.questions.editAnchor") }}</a>
    </nav>

    <section id="question-list" class="admin-card">
      <div class="admin-head">
        <h3>{{ t("admin.questions.heading") }}</h3>
        <div class="actions">
          <select v-model.number="selectedProblemsetId" @change="loadQuestions">
            <option v-for="item in problemsets" :key="item.id" :value="item.id">
              {{ item.id }} - {{ item.title }}
            </option>
          </select>
          <button class="admin-btn" type="button" @click="loadProblemsets">{{ t("admin.questions.refreshProblemsets") }}</button>
          <button class="admin-btn" type="button" @click="loadQuestions">{{ t("admin.questions.refreshQuestions") }}</button>
          <button class="admin-btn" type="button" @click="toggleAll">{{ allSelected ? t("admin.common.clearSelection") : t("admin.common.selectAll") }}</button>
          <button class="admin-btn danger" type="button" @click="deleteSelected">{{ t("admin.common.bulkDelete") }}</button>
        </div>
      </div>
      <p v-if="loadingProblemsets || loadingQuestions">{{ t("common.loading") }}</p>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>{{ t("admin.common.select") }}</th>
            <th>#</th>
            <th>{{ t("problemset.common.type") }}</th>
            <th>{{ t("admin.questions.stem") }}</th>
            <th>{{ t("admin.questions.score") }}</th>
            <th>{{ t("admin.questions.answer") }}</th>
            <th>{{ t("admin.common.actions") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in questions" :key="item.id">
            <td><input type="checkbox" :checked="selectedSet.has(String(item.id))" @change="toggleOne(item.id)" /></td>
            <td>{{ item.index }}</td>
            <td>{{ item.type }}</td>
            <td class="ellipsis">{{ item.stem }}</td>
            <td>{{ item.score }}</td>
            <td>{{ item.answer }}</td>
            <td class="actions">
              <button class="admin-btn" type="button" @click="selectQuestion(item)">{{ t("common.edit") }}</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section id="question-edit" class="admin-card">
      <h3>{{ questionForm.id ? t("admin.questions.editTitle", { id: questionForm.id }) : t("admin.questions.createTitle") }}</h3>
      <div class="admin-form-grid two-col">
        <label>
          <span>{{ t("admin.questions.index") }}</span>
          <input v-model.number="questionForm.index" type="number" min="1" :placeholder="t('admin.questions.indexPlaceholder')" />
        </label>
        <label>
          <span>{{ t("admin.questions.questionType") }}</span>
          <select v-model="questionForm.type">
            <option value="option">{{ t("problemset.common.option") }}</option>
            <option value="input">{{ t("problemset.common.input") }}</option>
          </select>
        </label>
      </div>
      <div class="admin-form-grid">
        <label>
          <span>{{ t("admin.questions.stem") }}</span>
          <textarea v-model="questionForm.stem" rows="3"></textarea>
        </label>
        <label v-if="questionForm.type === 'option'">
          <span>{{ t("admin.questions.options") }}</span>
          <textarea v-model="questionForm.optionsText" rows="6"></textarea>
        </label>
        <label v-else>
          <span>{{ t("admin.questions.inputPlaceholder") }}</span>
          <input v-model.trim="questionForm.inputPlaceholder" type="text" />
        </label>
        <div class="admin-form-grid two-col">
          <label>
            <span>{{ t("admin.questions.score") }}</span>
            <input v-model.number="questionForm.score" type="number" min="0.1" step="0.1" />
          </label>
          <label>
            <span>{{ t("admin.questions.answer") }}</span>
            <input v-model.trim="questionForm.answer" type="text" :placeholder="t('admin.questions.answerPlaceholder')" />
          </label>
        </div>
        <label>
          <span>{{ t("problemset.common.analysis") }}</span>
          <textarea v-model="questionForm.analysis" rows="3"></textarea>
        </label>
      </div>
      <div class="admin-actions">
        <button class="admin-btn primary" type="button" @click="submitQuestion">{{ questionForm.id ? t("common.save") : t("common.create") }}</button>
        <button class="admin-btn" type="button" @click="resetQuestionForm">{{ t("common.reset") }}</button>
        <button v-if="questionForm.id" class="admin-btn danger" type="button" @click="deleteCurrentQuestion">{{ t("admin.questions.deleteCurrent") }}</button>
      </div>
    </section>
  </div>
</template>
