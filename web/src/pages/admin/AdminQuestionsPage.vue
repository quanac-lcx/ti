<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
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
  optionsText: "A. 选项A\nB. 选项B",
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
  questionForm.optionsText = "A. 选项A\nB. 选项B";
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
    notifyWarning("请先勾选要删除的题目。");
    return;
  }
  const confirmed = await askConfirm({
    title: "批量删除题目",
    message: `确认删除 ${selectedQuestionIds.value.length} 道题目吗？`,
    confirmText: "确认删除",
    cancelText: "取消",
    danger: true
  });
  if (!confirmed) return;

  let success = 0;
  for (const id of selectedQuestionIds.value) {
    try {
      await deleteQuestion(id);
      success += 1;
    } catch (err) {
      notifyError(`题目 #${id} 删除失败：${String((err as Error)?.message ?? err)}`);
    }
  }
  notifySuccess(`批量删除完成：${success}/${selectedQuestionIds.value.length}`);
  selectedQuestionIds.value = [];
  await loadQuestions();
}

async function submitQuestion() {
  if (!selectedProblemsetId.value) {
    notifyWarning("请先选择试卷。");
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
      notifySuccess(`题目 #${questionForm.id} 更新成功。`);
    } else {
      await createQuestion(selectedProblemsetId.value, payload);
      notifySuccess("题目创建成功。");
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
    title: "删除题目",
    message: `确认删除题目 #${questionForm.id} 吗？`,
    confirmText: "删除",
    cancelText: "取消",
    danger: true
  });
  if (!confirmed) return;

  try {
    await deleteQuestion(questionForm.id);
    notifySuccess(`题目 #${questionForm.id} 已删除。`);
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
      <a href="#question-list">题目列表</a>
      <a href="#question-edit">编辑题目</a>
    </nav>

    <section id="question-list" class="admin-card">
      <div class="admin-head">
        <h3>题目管理</h3>
        <div class="actions">
          <select v-model.number="selectedProblemsetId" @change="loadQuestions">
            <option v-for="item in problemsets" :key="item.id" :value="item.id">
              {{ item.id }} - {{ item.title }}
            </option>
          </select>
          <button class="admin-btn" type="button" @click="loadProblemsets">刷新试卷</button>
          <button class="admin-btn" type="button" @click="loadQuestions">刷新题目</button>
          <button class="admin-btn" type="button" @click="toggleAll">{{ allSelected ? "取消全选" : "全选" }}</button>
          <button class="admin-btn danger" type="button" @click="deleteSelected">批量删除</button>
        </div>
      </div>
      <p v-if="loadingProblemsets || loadingQuestions">加载中...</p>
      <table v-else class="admin-table">
        <thead>
          <tr>
            <th>选择</th>
            <th>#</th>
            <th>类型</th>
            <th>题干</th>
            <th>分值</th>
            <th>答案</th>
            <th>操作</th>
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
              <button class="admin-btn" type="button" @click="selectQuestion(item)">编辑</button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>

    <section id="question-edit" class="admin-card">
      <h3>{{ questionForm.id ? `编辑题目 #${questionForm.id}` : "新建题目" }}</h3>
      <div class="admin-form-grid two-col">
        <label>
          <span>题号</span>
          <input v-model.number="questionForm.index" type="number" min="1" placeholder="留空自动追加" />
        </label>
        <label>
          <span>题型</span>
          <select v-model="questionForm.type">
            <option value="option">选择题</option>
            <option value="input">填空题</option>
          </select>
        </label>
      </div>
      <div class="admin-form-grid">
        <label>
          <span>题干</span>
          <textarea v-model="questionForm.stem" rows="3"></textarea>
        </label>
        <label v-if="questionForm.type === 'option'">
          <span>选项（每行一个，示例 A. 选项A）</span>
          <textarea v-model="questionForm.optionsText" rows="6"></textarea>
        </label>
        <label v-else>
          <span>输入框提示</span>
          <input v-model.trim="questionForm.inputPlaceholder" type="text" />
        </label>
        <div class="admin-form-grid two-col">
          <label>
            <span>分值</span>
            <input v-model.number="questionForm.score" type="number" min="0.1" step="0.1" />
          </label>
          <label>
            <span>答案</span>
            <input v-model.trim="questionForm.answer" type="text" placeholder="选择题示例 A,C" />
          </label>
        </div>
        <label>
          <span>解析</span>
          <textarea v-model="questionForm.analysis" rows="3"></textarea>
        </label>
      </div>
      <div class="admin-actions">
        <button class="admin-btn primary" type="button" @click="submitQuestion">{{ questionForm.id ? "保存" : "创建" }}</button>
        <button class="admin-btn" type="button" @click="resetQuestionForm">重置</button>
        <button v-if="questionForm.id" class="admin-btn danger" type="button" @click="deleteCurrentQuestion">删除当前题目</button>
      </div>
    </section>
  </div>
</template>
