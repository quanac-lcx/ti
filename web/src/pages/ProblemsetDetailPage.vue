<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { getMySettings, loadLocalUser } from "../api/auth";
import { problemsetApi, type ProblemQuestion, type ProblemsetDetail } from "../api/problemset";
import {
  fetchActiveExam,
  fetchProblemsetSubmissions,
  fetchSubmissionDetail,
  type SubmissionDetail,
  type SubmissionRecord
} from "../api/submission";
import { renderLuoguMarkdown } from "../utils/luoguMarkdown";

type DetailTab = "description" | "question" | "history";

const route = useRoute();
const router = useRouter();
const currentUser = loadLocalUser();

const loading = ref(true);
const detail = ref<ProblemsetDetail | null>(null);
const activeTab = ref<DetailTab>("description");
const selectedQuestionIndex = ref(0);
const answerVisible = ref(false);

const submissionsLoading = ref(false);
const submissions = ref<SubmissionRecord[]>([]);
const selectedSubmission = ref<SubmissionDetail | null>(null);
const activeExam = ref<SubmissionRecord | null>(null);
const historyCollapsed = ref(false);
const showExamConflictModal = ref(false);
const submissionAnalysisMode = ref<"none" | "wrong_only" | "all">("none");
const historyAnalysisVisible = ref<Record<string, boolean>>({});

const problemsetId = computed(() => {
  const parsed = Number(route.params.id);
  return Number.isFinite(parsed) ? parsed : 1001;
});

const pageTitle = computed(() => {
  if (!detail.value) return `题库 ${problemsetId.value}`;
  return `${detail.value.summary.id} - ${detail.value.summary.title}`;
});

const canEdit = computed(() => {
  if (!detail.value || !currentUser?.uid) return false;
  if (currentUser.isAdmin) return true;
  return String(detail.value.summary.createdByUid ?? "") === String(currentUser.uid);
});

const guestPlayable = computed(() => {
  const type = String(detail.value?.summary.problemsetType ?? "");
  return type === "official_public" || type === "personal_featured";
});

const hasHistory = computed(() => submissions.value.length > 0);

const currentQuestion = computed<ProblemQuestion | null>(() => {
  if (!detail.value) return null;
  return detail.value.questions[selectedQuestionIndex.value] ?? null;
});

const questionMaterialHtml = computed(() => renderLuoguMarkdown(currentQuestion.value?.sharedMaterial ?? ""));

const selectedSubmissionSummary = computed(() => {
  if (!selectedSubmission.value) return null;
  return submissions.value.find((item) => item.id === selectedSubmission.value?.id) ?? null;
});

const submissionResultMap = computed(() => {
  const map: Record<string, { correct: boolean; earned: number; standardAnswer: string; userAnswer: string }> = {};
  if (!selectedSubmission.value?.results) return map;
  for (const item of selectedSubmission.value.results) {
    map[String(item.questionId)] = {
      correct: Boolean(item.correct),
      earned: Number(item.earned ?? 0),
      standardAnswer: String(item.standardAnswer ?? ""),
      userAnswer: String(item.userAnswer ?? "")
    };
  }
  return map;
});

const descriptionHtml = computed(() => renderLuoguMarkdown(detail.value?.summary.description ?? ""));
const questionStemHtml = computed(() => renderLuoguMarkdown(currentQuestion.value?.stem ?? ""));
const answerAnalysisHtml = computed(() => renderLuoguMarkdown(currentQuestion.value?.analysis ?? ""));
const renderMd = (source: string) => renderLuoguMarkdown(source);

function isMaterialGroupStart(question: ProblemQuestion, index: number, questionList: ProblemQuestion[]) {
  if (!question.sharedMaterial?.trim() || question.materialGroupIndex === null) return false;
  if (index === 0) return true;
  return questionList[index - 1]?.materialGroupIndex !== question.materialGroupIndex;
}

function questionMaterialTitle(question: ProblemQuestion) {
  return question.groupTitle?.trim() || "共享材料";
}

function normalizeOptionAnswer(raw: string) {
  return Array.from(
    new Set(
      String(raw ?? "")
        .split(",")
        .map((item) => item.trim().toUpperCase())
        .filter((item) => /^[A-Z]$/.test(item))
    )
  )
    .sort()
    .join(",");
}

function isMultipleQuestion(question: ProblemQuestion) {
  return normalizeOptionAnswer(question.answer).includes(",");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const mi = String(date.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function isHistoryOptionChecked(question: ProblemQuestion, optionKey: string) {
  const result = submissionResultMap.value[String(question.id)];
  if (!result) return false;
  const selected = normalizeOptionAnswer(result.userAnswer).split(",").filter(Boolean);
  return selected.includes(optionKey);
}

function shouldShowHistoryAnalysis(question: ProblemQuestion) {
  return Boolean(historyAnalysisVisible.value[String(question.id)]);
}

function initHistoryAnalysisVisibility() {
  const next: Record<string, boolean> = {};
  for (const question of detail.value?.questions ?? []) {
    const qid = String(question.id);
    if (submissionAnalysisMode.value === "all") {
      next[qid] = true;
      continue;
    }
    if (submissionAnalysisMode.value === "none") {
      next[qid] = false;
      continue;
    }
    const result = submissionResultMap.value[qid];
    next[qid] = result ? !result.correct : false;
  }
  historyAnalysisVisible.value = next;
}

function toggleHistoryAnalysis(question: ProblemQuestion) {
  const qid = String(question.id);
  historyAnalysisVisible.value[qid] = !historyAnalysisVisible.value[qid];
}

function historyQuestionTitleClass(question: ProblemQuestion) {
  const result = submissionResultMap.value[String(question.id)];
  if (!result) return "";
  return result.correct ? "correct" : "wrong";
}

function switchToQuestionTab(index: number) {
  selectedQuestionIndex.value = index;
  activeTab.value = "question";
  answerVisible.value = false;
  historyCollapsed.value = false;
}

function questionButtonClass(question: ProblemQuestion, index: number) {
  if (activeTab.value === "history" && selectedSubmission.value) {
    const result = submissionResultMap.value[String(question.id)];
    if (!result) return "";
    if (result.correct) return "correct";
    if (String(result.userAnswer ?? "").trim()) return "wrong";
    return "";
  }
  return selectedQuestionIndex.value === index ? "active" : "";
}

function jumpQuestion(question: ProblemQuestion, index: number) {
  if (activeTab.value === "history") {
    const element = document.getElementById(`history-question-${question.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
  }
  switchToQuestionTab(index);
}

async function openSubmission(submissionId: number, switchTab = true, syncQuery = true) {
  if (!Number.isFinite(submissionId)) return;
  const submission = await fetchSubmissionDetail(submissionId);
  if (submission.problemsetId !== problemsetId.value) return;
  selectedSubmission.value = submission;
  initHistoryAnalysisVisibility();
  if (switchTab && hasHistory.value) {
    activeTab.value = "history";
  }
  if (syncQuery && Number(route.query.submission ?? NaN) !== submissionId) {
    await router.replace({
      path: route.path,
      query: { ...route.query, submission: String(submissionId) }
    });
  }
}

async function loadSubmissions() {
  if (!currentUser?.uid) {
    submissions.value = [];
    activeExam.value = null;
    selectedSubmission.value = null;
    return;
  }
  submissionsLoading.value = true;
  try {
    const [response, currentActiveExam] = await Promise.all([
      fetchProblemsetSubmissions(problemsetId.value),
      fetchActiveExam(currentUser.uid)
    ]);
    submissions.value = response.submissions;
    activeExam.value = currentActiveExam ?? response.activeExam;

    if (submissions.value.length === 0) {
      if (activeTab.value === "history") activeTab.value = "description";
      selectedSubmission.value = null;
      if (route.query.submission) {
        const query = { ...route.query };
        delete query.submission;
        await router.replace({ path: route.path, query });
      }
      return;
    }

    const querySubmissionId = Number(route.query.submission ?? NaN);
    const preferredId = Number.isFinite(querySubmissionId)
      ? querySubmissionId
      : (selectedSubmission.value?.id ?? submissions.value[0].id);
    await openSubmission(preferredId, false, false);
  } finally {
    submissionsLoading.value = false;
  }
}

async function loadDetail() {
  loading.value = true;
  if (currentUser?.uid) {
    try {
      const settings = await getMySettings();
      const mode = String(settings.submissionAnalysisMode ?? "none");
      submissionAnalysisMode.value = mode === "wrong_only" || mode === "all" ? mode : "none";
    } catch {
      submissionAnalysisMode.value = "none";
    }
  } else {
    submissionAnalysisMode.value = "none";
  }

  detail.value = await problemsetApi.detail(problemsetId.value);
  selectedQuestionIndex.value = 0;
  activeTab.value = "description";
  answerVisible.value = false;
  historyCollapsed.value = false;
  await loadSubmissions();

  const querySubmissionId = Number(route.query.submission ?? NaN);
  if (Number.isFinite(querySubmissionId) && hasHistory.value) {
    activeTab.value = "history";
  }
  loading.value = false;
}

async function goExam() {
  if (!currentUser?.uid) {
    if (!guestPlayable.value) {
      await router.push("/auth/login");
      return;
    }
    await router.push(`/problemset/${problemsetId.value}/exam?notice=1`);
    return;
  }
  if (!submissionsLoading.value) {
    await loadSubmissions();
  }
  if (activeExam.value) {
    showExamConflictModal.value = true;
    return;
  }
  await router.push(`/problemset/${problemsetId.value}/exam?notice=1`);
}

async function goTraining() {
  await router.push(`/problemset/${problemsetId.value}/training`);
}

async function forceStartExam() {
  showExamConflictModal.value = false;
  await router.push(`/problemset/${problemsetId.value}/exam?force=1&notice=1`);
}

function closeConflictModal() {
  showExamConflictModal.value = false;
}

onMounted(loadDetail);

watch(() => route.params.id, loadDetail);

watch(
  () => route.query.submission,
  async (submission) => {
    if (!submission || !hasHistory.value) return;
    const submissionId = Number(submission);
    if (!Number.isFinite(submissionId)) return;
    if (selectedSubmission.value?.id === submissionId) return;
    await openSubmission(submissionId, true, false);
  }
);
</script>

<template>
  <TiLayout :title="pageTitle" subtitle="洛谷有题 / 试题列表 / 试题详情" :use-panel="false">
    <div v-if="detail && !loading" class="problemset-detail-page page-shell">
      <section class="problemset-detail-summary panel-card">
        <div class="problemset-detail-actions">
          <button class="action-btn action-btn-primary" type="button" @click="goExam">限时测试</button>
          <button class="action-btn" type="button" @click="goTraining">自由练习</button>
          <button
            v-if="canEdit"
            class="action-btn"
            type="button"
            @click="router.push(`/problemset/${problemsetId}/edit`)"
          >
            修改题目
          </button>
        </div>
        <div class="problemset-detail-stats">
          <div class="stat-item">
            <span class="stat-label">题目数量</span>
            <strong class="stat-value">{{ detail.summary.questionCount }}</strong>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-label">测试时间</span>
            <strong class="stat-value">{{ detail.summary.durationHours }} 小时</strong>
          </div>
        </div>
      </section>

      <section class="problemset-detail-grid">
        <div class="left-column">
          <div class="panel-card tabs-card">
            <button class="tab-btn" :class="{ active: activeTab === 'description' }" type="button" @click="activeTab = 'description'">试题描述</button>
            <button class="tab-btn" :class="{ active: activeTab === 'question' }" type="button" @click="activeTab = 'question'">查看题目</button>
            <button v-if="hasHistory" class="tab-btn" :class="{ active: activeTab === 'history' }" type="button" @click="activeTab = 'history'">历史答卷</button>
          </div>

          <div v-if="activeTab === 'description'" class="panel-card body-card">
            <div class="luogu-markdown" v-html="descriptionHtml"></div>
          </div>

          <div v-else-if="activeTab === 'question' && currentQuestion" class="panel-card body-card">
            <h3 class="question-title">第 {{ currentQuestion.index }} 题</h3>
            <div v-if="currentQuestion.sharedMaterial" class="shared-material-block">
              <div class="shared-material-title">
                {{ questionMaterialTitle(currentQuestion) }}
                <span v-if="currentQuestion.groupQuestionIndex">
                  · 第 {{ currentQuestion.groupQuestionIndex }}
                  <span v-if="currentQuestion.groupQuestionCount"> / {{ currentQuestion.groupQuestionCount }}</span>
                  小题
                </span>
              </div>
              <div class="shared-material-content luogu-markdown" v-html="questionMaterialHtml"></div>
            </div>
            <div class="question-stem luogu-markdown" v-html="questionStemHtml"></div>

            <div v-if="currentQuestion.type === 'option'" class="detail-option-list">
              <label v-for="option in currentQuestion.options" :key="option.key" class="detail-option-row">
                <input
                  :type="isMultipleQuestion(currentQuestion) ? 'checkbox' : 'radio'"
                  :name="`preview-${currentQuestion.id}`"
                  disabled
                />
                <span class="detail-option-key">{{ option.key }}.</span>
                <span class="detail-option-text luogu-markdown" v-html="renderMd(option.text)"></span>
              </label>
            </div>

            <div v-else class="input-preview">
              <label>作答输入框预览</label>
              <input type="text" :placeholder="currentQuestion.inputPlaceholder || '请输入答案'" disabled />
            </div>

            <p class="question-score">本题共 {{ currentQuestion.score }} 分</p>
            <button class="answer-btn" type="button" @click="answerVisible = !answerVisible">
              {{ answerVisible ? '隐藏答案与解析' : '显示答案与解析' }}
            </button>

            <div v-if="answerVisible" class="answer-block">
              <p class="answer-text">正确答案：{{ currentQuestion.answer }}</p>
              <div class="luogu-markdown" v-html="answerAnalysisHtml"></div>
            </div>
          </div>

          <div v-else-if="activeTab === 'history' && selectedSubmission" class="panel-card body-card">
            <article
              v-for="(question, index) in detail.questions"
              :id="`history-question-${question.id}`"
              :key="question.id"
              class="history-question"
            >
              <div v-if="isMaterialGroupStart(question, index, detail.questions)" class="shared-material-block">
                <div class="shared-material-title">{{ questionMaterialTitle(question) }}</div>
                <div class="shared-material-content luogu-markdown" v-html="renderMd(question.sharedMaterial)"></div>
              </div>
              <h3 class="history-question-title" :class="historyQuestionTitleClass(question)">
                第 {{ question.index }} 题
                <span v-if="question.groupQuestionIndex">
                  · 第 {{ question.groupQuestionIndex }}
                  <span v-if="question.groupQuestionCount"> / {{ question.groupQuestionCount }}</span>
                  小题
                </span>
              </h3>
              <div class="question-stem luogu-markdown" v-html="renderMd(question.stem)"></div>

              <div v-if="question.type === 'option'" class="detail-option-list">
                <label v-for="option in question.options" :key="option.key" class="detail-option-row">
                  <input
                    :type="isMultipleQuestion(question) ? 'checkbox' : 'radio'"
                    :name="`history-${question.id}`"
                    :checked="isHistoryOptionChecked(question, option.key)"
                    disabled
                  />
                  <span class="detail-option-key">{{ option.key }}.</span>
                  <span class="detail-option-text luogu-markdown" v-html="renderMd(option.text)"></span>
                </label>
              </div>
              <div v-else class="history-input">你的作答：{{ submissionResultMap[question.id]?.userAnswer || '（空）' }}</div>

              <div class="history-meta">
                <p class="history-answer">正确答案：{{ submissionResultMap[question.id]?.standardAnswer || question.answer }}</p>
                <p class="history-score">得分：{{ submissionResultMap[question.id]?.earned ?? 0 }} / {{ question.score }} 分</p>
                <button class="answer-btn history-toggle-btn" type="button" @click="toggleHistoryAnalysis(question)">
                  {{ shouldShowHistoryAnalysis(question) ? '隐藏解析' : '显示解析' }}
                </button>
              </div>
              <div v-if="shouldShowHistoryAnalysis(question)" class="history-analysis luogu-markdown" v-html="renderMd(question.analysis)"></div>
            </article>
          </div>

          <div v-else-if="activeTab === 'history' && !hasHistory" class="panel-card body-card">暂无历史提交。</div>
        </div>

        <aside class="right-column">
          <div v-if="hasHistory" class="panel-card history-card">
            <div class="history-main-score">{{ selectedSubmission?.score ?? submissions[0]?.score ?? 0 }} 分</div>
            <p class="history-date">提交于 {{ formatDate(selectedSubmission?.submittedAt ?? submissions[0]?.submittedAt) }}</p>
            <div class="history-header">
              <h3>最近提交记录</h3>
              <button class="toggle-btn" @click="historyCollapsed = !historyCollapsed">{{ historyCollapsed ? '展开' : '收起' }}</button>
            </div>
            <div v-if="!historyCollapsed" class="history-list">
              <button
                v-for="item in submissions"
                :key="item.id"
                class="history-item"
                :class="{ active: item.id === selectedSubmissionSummary?.id }"
                @click="openSubmission(item.id)"
              >
                {{ item.score }} 分 - 提交于 {{ formatDate(item.submittedAt) }}
              </button>
            </div>
          </div>

          <div class="panel-card list-card">
            <h3 class="list-title">题目列表</h3>
            <div class="question-list">
              <button
                v-for="(question, index) in detail.questions"
                :key="question.id"
                class="question-btn"
                :class="questionButtonClass(question, index)"
                type="button"
                @click="jumpQuestion(question, index)"
              >
                第 {{ question.index }} 题
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>

    <div v-else class="panel-card loading-card page-shell">加载中...</div>

    <div v-if="showExamConflictModal" class="detail-modal-mask" @click.self="closeConflictModal">
      <div class="detail-modal-card">
        <button class="detail-modal-close" @click="closeConflictModal">×</button>
        <p>
          {{ activeExam?.problemsetId }} - {{ activeExam?.problemsetTitle }} 正在进行中，是否删除上次状态并开始新的测试？
          （你也可以去个人中心恢复上次考试。）
        </p>
        <div class="detail-modal-actions">
          <button class="danger" @click="forceStartExam">覆盖并开始新测试</button>
          <button @click="closeConflictModal">取消</button>
        </div>
      </div>
    </div>
  </TiLayout>
</template>


