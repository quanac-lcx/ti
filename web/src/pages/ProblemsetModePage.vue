<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { getMySettings, loadLocalUser, type AutosaveIntervalSeconds } from "../api/auth";
import { problemsetApi, type ProblemQuestion, type ProblemsetDetail } from "../api/problemset";
import {
  ActiveExamConflictError,
  autosaveExamSubmission,
  pauseExamSubmission,
  resumeExamSubmission,
  startExamSubmission,
  submitExamSubmission,
  submitTrainingSubmission,
  type SubmissionDetail
} from "../api/submission";
import { renderLuoguMarkdown } from "../utils/luoguMarkdown";
import { askConfirm, notifyError, notifySuccess } from "../composables/feedback";

interface QuestionResult {
  correct: boolean;
  earned: number;
  standardAnswer: string;
}

interface LocalModeDraft {
  version: 1;
  mode: "exam" | "training";
  problemsetId: number;
  userKey: string;
  submissionId: number | null;
  answers: Record<string, string>;
  remainingSeconds: number;
  updatedAt: string;
}

const DEFAULT_AUTOSAVE_INTERVAL_SECONDS: AutosaveIntervalSeconds = 30;

const route = useRoute();
const router = useRouter();
const currentUser = loadLocalUser();

const loading = ref(true);
const error = ref("");
const detail = ref<ProblemsetDetail | null>(null);
const submissionId = ref<number | null>(null);
const submitted = ref(false);
const submissionScore = ref(0);
const maxScore = ref(0);
const remainingSeconds = ref(0);
const autosaving = ref(false);
const showingNotice = ref(false);
const noticeTimer = ref<ReturnType<typeof setTimeout> | null>(null);
const showGuestLoginModal = ref(false);
const autosaveIntervalSeconds = ref<AutosaveIntervalSeconds>(DEFAULT_AUTOSAVE_INTERVAL_SECONDS);
const skipLeaveConfirmOnce = ref(false);

const answers = reactive<Record<string, string>>({});
const results = reactive<Record<string, QuestionResult>>({});

let countdownTimer: ReturnType<typeof setInterval> | null = null;
let autosaveTimer: ReturnType<typeof setInterval> | null = null;
let navigatingByUserAction = false;

const problemsetId = computed(() => {
  const parsed = Number(route.params.id);
  return Number.isFinite(parsed) ? parsed : 1001;
});

const isExam = computed(() => route.path.endsWith("/exam"));
const modeKey = computed<"exam" | "training">(() => (isExam.value ? "exam" : "training"));
const userStorageKey = computed(() => (currentUser?.uid ? `uid:${currentUser.uid}` : "guest"));
const localDraftStorageKey = computed(
  () => `ti.mode.autosave.v1.${userStorageKey.value}.${modeKey.value}.${problemsetId.value}`
);
const shouldConfirmLeave = computed(
  () => !loading.value && !error.value && !!detail.value && !submitted.value && !skipLeaveConfirmOnce.value
);
const modeTitle = computed(() => (isExam.value ? "限时测试" : "自由练习"));
const pageTitle = computed(() => {
  const summary = detail.value?.summary;
  return summary ? `${summary.id} - ${summary.title}` : `${problemsetId.value} - ${modeTitle.value}`;
});
const subtitle = computed(() => `保存站有题 / 试题列表 / ${modeTitle.value}`);
const isGuest = computed(() => !currentUser?.uid);
const guestPlayable = computed(() => {
  const type = String(detail.value?.summary.problemsetType ?? "");
  return type === "official_public" || type === "personal_featured";
});

const questions = computed(() => detail.value?.questions ?? []);
const totalScore = computed(() => questions.value.reduce((sum, item) => sum + Number(item.score), 0));

interface SidebarQuestionGroup {
  key: string;
  title: string;
  questions: ProblemQuestion[];
  materialGroupIndex: number | null;
  isMaterialGroup: boolean;
}

const sidebarQuestionGroups = computed<SidebarQuestionGroup[]>(() => {
  const groups: SidebarQuestionGroup[] = [];
  const materialGroupMap = new Map<number, SidebarQuestionGroup>();

  for (const question of questions.value) {
    const hasMaterial = Boolean(question.sharedMaterial?.trim()) && question.materialGroupIndex !== null;
    if (!hasMaterial || question.materialGroupIndex === null) {
      groups.push({
        key: `single-${question.id}`,
        title: `第 ${question.index} 题`,
        questions: [question],
        materialGroupIndex: null,
        isMaterialGroup: false
      });
      continue;
    }

    const existing = materialGroupMap.get(question.materialGroupIndex);
    if (existing) {
      existing.questions.push(question);
      continue;
    }

    const group: SidebarQuestionGroup = {
      key: `material-${question.materialGroupIndex}`,
      title: question.groupTitle?.trim() || `材料题 ${question.materialGroupIndex}`,
      questions: [question],
      materialGroupIndex: question.materialGroupIndex,
      isMaterialGroup: true
    };
    materialGroupMap.set(question.materialGroupIndex, group);
    groups.push(group);
  }

  return groups;
});

const answeredCount = computed(() =>
  questions.value.filter((question) => String(answers[question.id] ?? "").trim().length > 0).length
);

const correctCount = computed(() =>
  questions.value.filter((question) => results[question.id]?.correct === true).length
);

function resetIntervals() {
  if (countdownTimer) clearInterval(countdownTimer);
  if (autosaveTimer) clearInterval(autosaveTimer);
  countdownTimer = null;
  autosaveTimer = null;
  autosaving.value = false;
}

function clearNoticeTimer() {
  if (noticeTimer.value) clearTimeout(noticeTimer.value);
  noticeTimer.value = null;
}

function normalizeAutosaveInterval(value: unknown): AutosaveIntervalSeconds {
  const parsed = Number(value);
  if (parsed === 0 || parsed === 30 || parsed === 60 || parsed === 120 || parsed === 300 || parsed === 600) {
    return parsed;
  }
  return DEFAULT_AUTOSAVE_INTERVAL_SECONDS;
}

function getAutosaveIntervalMs() {
  return autosaveIntervalSeconds.value > 0 ? autosaveIntervalSeconds.value * 1000 : 0;
}

async function loadAutosaveIntervalSetting() {
  if (!currentUser?.uid) {
    autosaveIntervalSeconds.value = DEFAULT_AUTOSAVE_INTERVAL_SECONDS;
    return;
  }
  try {
    const settings = await getMySettings();
    autosaveIntervalSeconds.value = normalizeAutosaveInterval(settings.autosaveIntervalSeconds);
  } catch {
    autosaveIntervalSeconds.value = DEFAULT_AUTOSAVE_INTERVAL_SECONDS;
  }
}

function clearLocalDraft() {
  localStorage.removeItem(localDraftStorageKey.value);
}

function buildLocalDraft(): LocalModeDraft {
  const snapshot: Record<string, string> = {};
  for (const question of questions.value) {
    snapshot[question.id] = String(answers[question.id] ?? "");
  }
  return {
    version: 1,
    mode: modeKey.value,
    problemsetId: problemsetId.value,
    userKey: userStorageKey.value,
    submissionId: submissionId.value,
    answers: snapshot,
    remainingSeconds: Number(remainingSeconds.value ?? 0),
    updatedAt: new Date().toISOString()
  };
}

function persistLocalDraft() {
  if (submitted.value || !detail.value) return;
  if (getAutosaveIntervalMs() <= 0) return;
  try {
    localStorage.setItem(localDraftStorageKey.value, JSON.stringify(buildLocalDraft()));
  } catch {
    // ignore localStorage quota/transient errors
  }
}

function restoreFromLocalDraft() {
  if (!detail.value || submitted.value) return false;
  const raw = localStorage.getItem(localDraftStorageKey.value);
  if (!raw) return false;

  try {
    const parsed = JSON.parse(raw) as Partial<LocalModeDraft>;
    if (parsed.version !== 1) return false;
    if (parsed.mode !== modeKey.value) return false;
    if (Number(parsed.problemsetId) !== problemsetId.value) return false;
    if (String(parsed.userKey ?? "") !== userStorageKey.value) return false;
    if (isExam.value && currentUser?.uid && submissionId.value && Number(parsed.submissionId) !== Number(submissionId.value)) {
      return false;
    }

    const restoredAnswers: Record<string, string> = {};
    for (const question of questions.value) {
      const draftAnswer = parsed.answers?.[question.id];
      restoredAnswers[question.id] = draftAnswer === undefined ? String(answers[question.id] ?? "") : String(draftAnswer);
    }
    hydrateAnswers(restoredAnswers);

    const draftRemaining = Number(parsed.remainingSeconds ?? NaN);
    if (isExam.value && Number.isFinite(draftRemaining) && draftRemaining > 0) {
      if (currentUser?.uid) {
        remainingSeconds.value = Math.min(remainingSeconds.value, Math.floor(draftRemaining));
      } else {
        remainingSeconds.value = Math.floor(draftRemaining);
      }
    }
    return true;
  } catch {
    return false;
  }
}

function allowNextLeaveWithoutConfirm() {
  skipLeaveConfirmOnce.value = true;
}

async function confirmLeaveIfNeeded() {
  if (!shouldConfirmLeave.value) return true;
  const confirmed = await askConfirm({
    title: "确认离开当前作答？",
    message: "你正在作答中，离开或刷新可能丢失最新进度。确定继续吗？",
    confirmText: "离开",
    cancelText: "继续作答",
    danger: true
  });
  if (confirmed) {
    persistLocalDraft();
  }
  return confirmed;
}

function handleBeforeUnload(event: BeforeUnloadEvent) {
  if (!shouldConfirmLeave.value || navigatingByUserAction) return;
  persistLocalDraft();
  event.preventDefault();
  event.returnValue = "";
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

function hydrateAnswers(next: Record<string, string>) {
  for (const key of Object.keys(answers)) delete answers[key];
  for (const question of questions.value) {
    answers[question.id] = String(next[question.id] ?? "");
  }
}

function hydrateResults(submission: SubmissionDetail | null) {
  for (const key of Object.keys(results)) delete results[key];
  if (!submission?.results) return;
  for (const item of submission.results) {
    results[String(item.questionId)] = {
      correct: Boolean(item.correct),
      earned: Number(item.earned ?? 0),
      standardAnswer: String(item.standardAnswer ?? "")
    };
  }
}

function startCountdown() {
  if (!isExam.value || submitted.value) return;
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = setInterval(() => {
    remainingSeconds.value = Math.max(0, remainingSeconds.value - 1);
    if (remainingSeconds.value === 0) {
      submitExam("timeout");
    }
  }, 1000);
}

function startAutosave() {
  if (submitted.value) return;
  const intervalMs = getAutosaveIntervalMs();
  if (intervalMs <= 0) return;
  if (autosaveTimer) clearInterval(autosaveTimer);
  autosaveTimer = setInterval(async () => {
    if (submitted.value) return;
    persistLocalDraft();
    if (!isExam.value || !submissionId.value || !currentUser?.uid) return;
    autosaving.value = true;
    try {
      await autosaveExamSubmission(submissionId.value, {
        answers: { ...answers },
        remainingSeconds: remainingSeconds.value
      });
    } catch {
      // ignore transient autosave errors
    } finally {
      autosaving.value = false;
    }
  }, intervalMs);
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds));
  const hour = String(Math.floor(safe / 3600)).padStart(2, "0");
  const minute = String(Math.floor((safe % 3600) / 60)).padStart(2, "0");
  const second = String(safe % 60).padStart(2, "0");
  return `${hour}:${minute}:${second}`;
}

function showExamNoticeIfNeeded() {
  const shouldShow = String(route.query.notice ?? "").trim() === "1";
  if (!shouldShow) return;
  showingNotice.value = true;
  clearNoticeTimer();
  noticeTimer.value = setTimeout(() => {
    showingNotice.value = false;
  }, 5000);
}

function scrollToQuestion(questionId: string) {
  const element = document.getElementById(`question-${questionId}`);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderMd(text: string) {
  return renderLuoguMarkdown(text);
}

function questionMaterialTitle(question: ProblemQuestion) {
  return question.groupTitle?.trim() || "共享材料";
}

function isOptionChecked(question: ProblemQuestion, key: string) {
  const current = normalizeOptionAnswer(answers[question.id] ?? "").split(",").filter(Boolean);
  return current.includes(key);
}

function toggleOption(question: ProblemQuestion, key: string) {
  if (submitted.value) return;
  const current = normalizeOptionAnswer(answers[question.id] ?? "").split(",").filter(Boolean);
  if (isMultipleQuestion(question)) {
    const next = current.includes(key) ? current.filter((item) => item !== key) : [...current, key];
    answers[question.id] = next.sort().join(",");
    return;
  }
  answers[question.id] = current.includes(key) ? "" : key;
}

function setInputAnswer(question: ProblemQuestion, value: string) {
  if (submitted.value) return;
  answers[question.id] = value;
}

function questionButtonClass(question: ProblemQuestion) {
  if (results[question.id]) {
    return results[question.id].correct ? "correct" : "wrong";
  }
  return String(answers[question.id] ?? "").trim() ? "answered" : "";
}

function calculateLocalSubmission() {
  const localResults: Record<string, QuestionResult> = {};
  let score = 0;
  let max = 0;

  for (const question of questions.value) {
    const qid = String(question.id);
    const standardAnswer = String(question.answer ?? "").trim();
    const userAnswer = String(answers[qid] ?? "").trim();
    const weight = Number(question.score ?? 0);
    max += weight;

    const correct = question.type === "option"
      ? normalizeOptionAnswer(userAnswer) === normalizeOptionAnswer(standardAnswer)
      : userAnswer === standardAnswer;
    const earned = correct ? weight : 0;
    score += earned;

    localResults[qid] = {
      correct,
      earned: Number(earned.toFixed(2)),
      standardAnswer
    };
  }

  for (const key of Object.keys(results)) delete results[key];
  for (const [key, value] of Object.entries(localResults)) {
    results[key] = value;
  }

  submissionScore.value = Number(score.toFixed(2));
  maxScore.value = Number(max.toFixed(2));
  submitted.value = true;
  resetIntervals();
  clearLocalDraft();
}

async function bootstrapExamMode() {
  const resumeId = Number(route.query.resume ?? NaN);
  const forceNew = String(route.query.force ?? "").trim() === "1";
  let submission: SubmissionDetail;

  if (Number.isFinite(resumeId) && resumeId > 0) {
    submission = await resumeExamSubmission(resumeId);
  } else {
    submission = await startExamSubmission(problemsetId.value, forceNew);
  }

  submissionId.value = submission.id;
  remainingSeconds.value = Number(submission.remainingSeconds ?? 0);
  maxScore.value = Number(submission.maxScore ?? totalScore.value);
  submissionScore.value = Number(submission.score ?? 0);
  submitted.value = submission.status === "submitted";
  hydrateAnswers(submission.answers ?? {});
  hydrateResults(submission);
}

function bootstrapTrainingMode() {
  submissionId.value = null;
  submitted.value = false;
  maxScore.value = totalScore.value;
  submissionScore.value = 0;
  remainingSeconds.value = 0;
  for (const key of Object.keys(results)) delete results[key];
  for (const question of questions.value) {
    answers[question.id] = "";
  }
}

async function loadPage() {
  loading.value = true;
  error.value = "";
  resetIntervals();
  try {
    await loadAutosaveIntervalSetting();
    detail.value = await problemsetApi.detail(problemsetId.value);
    if (isGuest.value && !guestPlayable.value) {
      error.value = "请先登录";
      return;
    }
    for (const question of questions.value) {
      answers[question.id] = "";
    }

    if (isExam.value) {
      if (isGuest.value) {
        bootstrapTrainingMode();
        remainingSeconds.value = Math.max(60, Math.floor(Number(detail.value?.summary.durationHours ?? 2) * 3600));
      } else {
        await bootstrapExamMode();
      }
    } else {
      bootstrapTrainingMode();
    }

    const restored = restoreFromLocalDraft();
    if (restored) {
      notifySuccess("已恢复本地自动保存草稿。");
    }
    if (isExam.value && !submitted.value) {
      startCountdown();
      showExamNoticeIfNeeded();
    }
    if (!submitted.value) {
      startAutosave();
    }

    if (isGuest.value && guestPlayable.value) {
      showGuestLoginModal.value = true;
    }
  } catch (err) {
    if (err instanceof ActiveExamConflictError) {
      const activeId = err.activeExam?.id;
      if (activeId) {
        allowNextLeaveWithoutConfirm();
        navigatingByUserAction = true;
        try {
          await router.replace(`/problemset/${problemsetId.value}?activeExam=${activeId}`);
        } finally {
          navigatingByUserAction = false;
        }
      }
      error.value = "检测到你有未完成的限时测试，请先到个人中心恢复。";
    } else {
      error.value = String((err as Error)?.message ?? err);
    }
  } finally {
    loading.value = false;
  }
}

async function pauseExam() {
  if (!submissionId.value || submitted.value || !currentUser?.uid) return;
  try {
    await pauseExamSubmission(submissionId.value, {
      answers: { ...answers },
      remainingSeconds: remainingSeconds.value
    });
    resetIntervals();
    clearLocalDraft();
    allowNextLeaveWithoutConfirm();
    navigatingByUserAction = true;
    try {
      await router.push(`/user/${currentUser.uid}`);
    } finally {
      navigatingByUserAction = false;
    }
  } catch (err) {
    navigatingByUserAction = false;
    skipLeaveConfirmOnce.value = false;
    error.value = String((err as Error)?.message ?? err);
    notifyError(error.value);
  }
}

async function submitExam(reason: "manual" | "timeout") {
  if (submitted.value) return;
  if (reason === "manual") {
    const confirmed = await askConfirm({
      title: "确认交卷",
      message: "交卷后会保存记录并显示解析，确认继续吗？",
      confirmText: "确认交卷",
      cancelText: "再检查一下",
      danger: true
    });
    if (!confirmed) return;
  }
  if (isGuest.value) {
    calculateLocalSubmission();
    notifySuccess("已完成本地判分。登录后可保存历史记录。");
    return;
  }

  if (!submissionId.value) return;

  try {
    const submission = await submitExamSubmission(submissionId.value, {
      answers: { ...answers },
      remainingSeconds: remainingSeconds.value
    });
    submitted.value = true;
    submissionScore.value = Number(submission.score ?? 0);
    maxScore.value = Number(submission.maxScore ?? totalScore.value);
    hydrateAnswers(submission.answers ?? {});
    hydrateResults(submission);
    resetIntervals();
    clearLocalDraft();
    notifySuccess("交卷成功，已生成历史答卷。");
    await router.replace(`/problemset/${problemsetId.value}?submission=${submission.id}`);
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
    notifyError(error.value);
  }
}

async function saveTrainingRecord() {
  if (submitted.value) return;
  if (isGuest.value) {
    calculateLocalSubmission();
    notifySuccess("已完成本地判分。登录后可保存练习记录。");
    return;
  }
  try {
    const submission = await submitTrainingSubmission(problemsetId.value, {
      answers: { ...answers }
    });
    submitted.value = true;
    submissionId.value = submission.id;
    submissionScore.value = Number(submission.score ?? 0);
    maxScore.value = Number(submission.maxScore ?? totalScore.value);
    hydrateResults(submission);
    clearLocalDraft();
    notifySuccess("练习记录已保存。");
    await router.replace(`/problemset/${problemsetId.value}?submission=${submission.id}`);
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
    notifyError(error.value);
  }
}

onBeforeRouteLeave(async () => {
  if (skipLeaveConfirmOnce.value) {
    skipLeaveConfirmOnce.value = false;
    return true;
  }
  return confirmLeaveIfNeeded();
});

onBeforeRouteUpdate(async () => {
  if (skipLeaveConfirmOnce.value) {
    skipLeaveConfirmOnce.value = false;
    return true;
  }
  return confirmLeaveIfNeeded();
});

onMounted(() => {
  window.addEventListener("beforeunload", handleBeforeUnload);
  loadPage();
});
watch(() => [route.params.id, route.path, route.query.resume, route.query.force], loadPage);
onUnmounted(() => {
  persistLocalDraft();
  window.removeEventListener("beforeunload", handleBeforeUnload);
  resetIntervals();
  clearNoticeTimer();
});

function closeGuestLoginModal() {
  showGuestLoginModal.value = false;
}
</script>

<template>
  <TiLayout
    :title="pageTitle"
    :subtitle="subtitle"
    :use-panel="false"
    :loading="loading"
    loading-label="题目加载中"
  >
    <div class="problemset-mode-page page-shell">
      <div v-if="showGuestLoginModal" class="guest-login-modal-mask" @click.self="closeGuestLoginModal">
        <div class="guest-login-modal-card">
          <button class="guest-login-close" type="button" @click="closeGuestLoginModal">×</button>
          <h3>你未登录！</h3>
          <p>你当前正在以游客模式作答，成绩不会被保存到个人中心，也无法查看做题记录或调用AI来获取提示及解析。
          </p>
          <div class="guest-login-actions">
            <button class="btn" type="button" @click="closeGuestLoginModal">继续作答</button>
            <button class="btn primary" type="button" @click="router.push('/auth/login')">去登录</button>
          </div>
        </div>
      </div>

      <div v-if="showingNotice" class="exam-notice">
        <p>考试开始后倒计时开始，途中可以暂停，你的答案将间隔一定时间自动保存（<a href="/user/_me/settings" target="_blank">此处设置自动保存间隔</a>）。不小心关闭可到个人中心找回考试页面。</p>
      </div>

      <div v-if="!loading && error" class="panel-card error-card">{{ error }}</div>
      <template v-else-if="!loading && detail">
        <section class="mode-layout">
          <div class="mode-left">
            <article
              v-for="question in detail.questions"
              :id="`question-${question.id}`"
              :key="question.id"
              class="panel-card question-card"
            >
              <h3>
                第 {{ question.index }} 题
                <span v-if="question.groupQuestionIndex">
                  · 第 {{ question.groupQuestionIndex }}
                  <span v-if="question.groupQuestionCount"> / {{ question.groupQuestionCount }}</span>
                  小题
                </span>
              </h3>
              <details v-if="question.sharedMaterial?.trim()" class="shared-material-panel" open>
                <summary class="shared-material-summary">
                  <span class="shared-material-arrow" aria-hidden="true"></span>
                  <span class="shared-material-title">{{ questionMaterialTitle(question) }}</span>
                </summary>
                <div class="shared-material-block">
                  <div class="shared-material-content luogu-markdown" v-html="renderMd(question.sharedMaterial)"></div>
                </div>
              </details>
              <div class="question-stem luogu-markdown" v-html="renderMd(question.stem)"></div>

              <div v-if="question.type === 'option'" class="mode-option-list">
                <label v-for="option in question.options" :key="option.key" class="mode-option-row">
                  <input
                    :type="isMultipleQuestion(question) ? 'checkbox' : 'radio'"
                    :name="`q-${question.id}`"
                    :checked="isOptionChecked(question, option.key)"
                    :disabled="submitted"
                    @change="toggleOption(question, option.key)"
                  />
                  <span class="mode-option-key">{{ option.key }}.</span>
                  <span class="mode-option-text luogu-markdown" v-html="renderMd(option.text)"></span>
                </label>
              </div>

              <div v-else class="input-wrap">
                <input
                  type="text"
                  :value="answers[question.id]"
                  :placeholder="question.inputPlaceholder || '请输入答案'"
                  :disabled="submitted"
                  @input="setInputAnswer(question, ($event.target as HTMLInputElement).value)"
                />
              </div>

              <p class="question-score">本题共 {{ question.score }} 分</p>
              <div v-if="submitted && results[question.id]" class="result">
                <p :class="results[question.id].correct ? 'ok' : 'ng'">
                  {{ results[question.id].correct ? "回答正确" : "回答错误" }}
                </p>
                <p>正确答案：{{ results[question.id].standardAnswer }}</p>
                <p>得分：{{ results[question.id].earned }} / {{ question.score }}</p>
                <div class="luogu-markdown" v-html="renderMd(question.analysis)"></div>
              </div>
            </article>
          </div>

          <aside class="panel-card mode-right">
            <div v-if="isExam" class="mode-timer-card" :class="{ danger: remainingSeconds <= 300 }">
              <span class="mode-timer-label">剩余时间</span>
              <strong class="mode-timer-value">{{ formatDuration(remainingSeconds) }}</strong>
            </div>

            <div class="mode-summary-cards">
              <div class="mode-summary-card">
                <span class="mode-summary-label">已作答</span>
                <strong>{{ answeredCount }} / {{ detail.summary.questionCount }}</strong>
              </div>
              <div v-if="submitted" class="mode-summary-card">
                <span class="mode-summary-label">正确题数</span>
                <strong>{{ correctCount }} 题</strong>
              </div>
              <div v-if="submitted" class="mode-summary-card">
                <span class="mode-summary-label">得分</span>
                <strong>{{ submissionScore }} / {{ maxScore }}</strong>
              </div>
            </div>

            <div class="actions mode-actions">
              <button v-if="isExam && !submitted && !!currentUser?.uid" class="btn warn" @click="pauseExam">暂停</button>
              <button v-if="isExam && !submitted" class="btn primary" @click="submitExam('manual')">交卷</button>
              <button v-if="!isExam && !submitted" class="btn primary" @click="saveTrainingRecord">
                {{ isGuest ? "提交并查看结果" : "保存练习记录" }}
              </button>
            </div>

            <div class="mode-question-nav">
              <div class="mode-question-nav-head">
                <h3>题目列表</h3>
              </div>
              <div class="question-group-list">
                <template v-for="group in sidebarQuestionGroups" :key="group.key">
                  <section
                    v-if="group.isMaterialGroup"
                    class="question-group-block material"
                  >
                    <div class="question-group-title">{{ group.title }}</div>
                    <div class="question-grid">
                      <button
                        v-for="question in group.questions"
                        :key="question.id"
                        class="num-btn"
                        :class="questionButtonClass(question)"
                        @click="scrollToQuestion(question.id)"
                      >
                        {{ question.index }}
                      </button>
                    </div>
                  </section>

                  <button
                    v-else
                    class="num-btn num-btn-standalone"
                    :class="questionButtonClass(group.questions[0])"
                    @click="scrollToQuestion(group.questions[0].id)"
                  >
                    {{ group.questions[0].index }}
                  </button>
                </template>
              </div>
            </div>
          </aside>
        </section>
      </template>
    </div>
  </TiLayout>
</template>
