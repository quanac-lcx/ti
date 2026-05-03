<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from "vue";
import { useI18n } from "vue-i18n";
import type { ProblemQuestion } from "../api/problemset";
import { generateAiContent } from "../api/ai";
import { loadLocalUser } from "../api/auth";
import { notifyWarning } from "../composables/feedback";
import { renderLuoguMarkdown } from "../utils/luoguMarkdown";

type AiAssistAction = "hint" | "solution";

const props = defineProps<{
  question: ProblemQuestion;
  questionLabel: string;
  mode: "hint-only" | "hint-and-solution";
  historyContext?: {
    userAnswer?: string;
    standardAnswer?: string;
    earned?: number;
    score?: number;
    correct?: boolean;
  };
}>();

const { t } = useI18n();

const panelVisible = ref(false);
const selectedAction = ref<AiAssistAction | null>(null);
const confirmVisible = ref(false);
const pendingAction = ref<AiAssistAction>("hint");
const countdownSeconds = ref(8);
const loading = ref(false);
const errorMessage = ref("");
const aiContent = ref<Record<AiAssistAction, string>>({
  hint: "",
  solution: ""
});

let countdownTimer: ReturnType<typeof setInterval> | null = null;

const supportsSolution = computed(() => props.mode === "hint-and-solution");

function clearCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
}

function openPanel() {
  if (!loadLocalUser()?.uid) {
    notifyWarning(t("common.loginFirst"));
    return;
  }
  panelVisible.value = true;
  selectedAction.value = null;
  errorMessage.value = "";
}

function closePanel() {
  panelVisible.value = false;
  confirmVisible.value = false;
  selectedAction.value = null;
  loading.value = false;
  errorMessage.value = "";
  clearCountdown();
}

function openConfirm(action: AiAssistAction) {
  pendingAction.value = action;
  confirmVisible.value = true;
  countdownSeconds.value = 8;
  clearCountdown();
  countdownTimer = setInterval(() => {
    countdownSeconds.value = Math.max(0, countdownSeconds.value - 1);
    if (countdownSeconds.value <= 0) {
      clearCountdown();
    }
  }, 1000);
}

function cancelConfirm() {
  confirmVisible.value = false;
  clearCountdown();
}

async function confirmSelection() {
  if (countdownSeconds.value > 0) return;
  const action = pendingAction.value;
  selectedAction.value = action;
  confirmVisible.value = false;
  clearCountdown();
  errorMessage.value = "";

  if (aiContent.value[action]) return;

  loading.value = true;
  try {
    const parts: string[] = [];
    if (props.question.sharedMaterial?.trim()) {
      parts.push(`【共享材料】\n${props.question.sharedMaterial.trim()}`);
    }
    parts.push(`【题干】\n${String(props.question.stem ?? "").trim()}`);
    if (props.question.type === "option" && Array.isArray(props.question.options) && props.question.options.length > 0) {
      const optionLines = props.question.options.map((item) => `${item.key}. ${item.text}`).join("\n");
      parts.push(`【选项】\n${optionLines}`);
    }
    const packedQuestion = parts.filter((item) => item.trim().length > 0).join("\n\n");

    const content = await generateAiContent({
      mode: action,
      question: packedQuestion
    });
    aiContent.value[action] = content;
  } catch (err) {
    errorMessage.value = String((err as Error)?.message ?? err);
  } finally {
    loading.value = false;
  }
}

const confirmTitle = computed(() =>
  pendingAction.value === "hint" ? t("problemset.ai.confirmHintTitle") : t("problemset.ai.confirmSolutionTitle")
);

const confirmMessage = computed(() =>
  t("problemset.ai.confirmMessage", { seconds: countdownSeconds.value })
);

const panelContentHtml = computed(() => {
  if (!selectedAction.value) return renderLuoguMarkdown(t("problemset.ai.pendingContent"));
  if (loading.value) return renderLuoguMarkdown(t("common.loading"));
  if (errorMessage.value) return renderLuoguMarkdown(errorMessage.value);
  const content = aiContent.value[selectedAction.value];
  if (!content) return renderLuoguMarkdown(t("common.empty"));
  return renderLuoguMarkdown(content);
});

onBeforeUnmount(() => {
  clearCountdown();
});
</script>

<template>
  <div class="ai-assist">
    <button class="ai-trigger-btn" type="button" @click="openPanel">
      <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
      <span>AI</span>
    </button>

    <div v-if="panelVisible" class="ai-panel-mask" @click.self="closePanel">
      <div class="ai-panel-card">
        <button class="ai-panel-close" type="button" @click="closePanel">×</button>
        <h3>{{ t("problemset.ai.panelTitle", { question: questionLabel }) }}</h3>
        <div class="ai-panel-actions">
          <button class="ai-option-btn" type="button" :disabled="loading" @click="openConfirm('hint')">
            {{ t("problemset.ai.hintOption") }}
          </button>
          <button
            v-if="supportsSolution"
            class="ai-option-btn"
            type="button"
            :disabled="loading"
            @click="openConfirm('solution')"
          >
            {{ t("problemset.ai.solutionOption") }}
          </button>
        </div>

        <div class="ai-panel-content">
          <h4 v-if="selectedAction === 'hint'">{{ t("problemset.ai.hintTitle") }}</h4>
          <h4 v-else-if="selectedAction === 'solution'">{{ t("problemset.ai.solutionTitle") }}</h4>
          <h4 v-else>{{ t("problemset.ai.pendingTitle") }}</h4>
          <div class="ai-panel-markdown luogu-markdown" v-html="panelContentHtml"></div>
        </div>
      </div>
    </div>

    <div v-if="confirmVisible" class="ai-confirm-mask" @click.self="cancelConfirm">
      <div class="ai-confirm-card">
        <h4>{{ confirmTitle }}</h4>
        <p>{{ confirmMessage }}</p>
        <div class="ai-confirm-actions">
          <button
            class="ai-confirm-btn"
            type="button"
            :disabled="countdownSeconds > 0"
            @click="confirmSelection"
          >
            {{ countdownSeconds > 0 ? t("problemset.ai.confirmWait", { seconds: countdownSeconds }) : t("problemset.ai.confirmNow") }}
          </button>
          <button class="ai-confirm-btn ghost" type="button" @click="cancelConfirm">
            {{ t("common.cancel") }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
