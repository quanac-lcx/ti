<script lang="ts">
// --- Module-level singleton: ensures only one AI panel visible at a time ---
import { ref } from "vue";

let nextInstanceId = 0;
const activeInstanceIndex = ref(-1);
</script>

<script setup lang="ts">
import { computed, onBeforeUnmount, watch } from "vue";
import { useI18n } from "vue-i18n";
import type { ProblemQuestion } from "../api/problemset";
import { fetchAiModels, generateAiContent, type AiPublicModel } from "../api/ai";
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

const instanceId = nextInstanceId++;
const panelVisible = computed(() => activeInstanceIndex.value === instanceId);
const selectedAction = ref<AiAssistAction | null>(null);
const loading = ref(false);
const errorMessage = ref("");
const aiContent = ref<Record<AiAssistAction, string>>({
  hint: "",
  solution: ""
});
const aiModels = ref<AiPublicModel[]>([]);
const selectedModelId = ref("");
const modelsLoading = ref(false);

// --- Long-press state ---
const LONG_PRESS_DURATION_MS = 5000;
const longPressAction = ref<AiAssistAction | null>(null);
const longPressProgress = ref(0);
let longPressInterval: ReturnType<typeof setInterval> | null = null;
let longPressTimeout: ReturnType<typeof setTimeout> | null = null;

const supportsSolution = computed(() => props.mode === "hint-and-solution");

function clearLongPress() {
  if (longPressInterval) {
    clearInterval(longPressInterval);
    longPressInterval = null;
  }
  if (longPressTimeout) {
    clearTimeout(longPressTimeout);
    longPressTimeout = null;
  }
  longPressProgress.value = 0;
  longPressAction.value = null;
}

function startLongPress(action: AiAssistAction) {
  clearLongPress();
  longPressAction.value = action;
  longPressProgress.value = 0;
  longPressTimeout = setTimeout(() => {
    longPressInterval = setInterval(() => {
      longPressProgress.value = Math.min(100, longPressProgress.value + 2);
      if (longPressProgress.value >= 100) {
        clearLongPress();
        confirmAction(action);
      }
    }, 100);
  }, 150);
}

function cancelLongPress() {
  clearLongPress();
}

async function loadModels() {
  if (aiModels.value.length > 0) return;
  modelsLoading.value = true;
  try {
    const payload = await fetchAiModels();
    aiModels.value = payload.models;
    const user = loadLocalUser();
    selectedModelId.value = user?.aiModelId || payload.defaultModelId || payload.models[0]?.id || "";
  } catch {
    // ignore
  } finally {
    modelsLoading.value = false;
  }
}

function openPanel() {
  if (!loadLocalUser()?.uid) {
    notifyWarning(t("common.loginFirst"));
    return;
  }
  activeInstanceIndex.value = instanceId;
  loadModels();
  selectedAction.value = null;
  errorMessage.value = "";
}

function closePanel() {
  activeInstanceIndex.value = -1;
  selectedAction.value = null;
  loading.value = false;
  errorMessage.value = "";
  clearLongPress();
}

async function confirmAction(action: AiAssistAction) {
  selectedAction.value = action;
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
      question: packedQuestion,
      modelId: selectedModelId.value || undefined
    });
    aiContent.value[action] = content;
  } catch (err) {
    errorMessage.value = String((err as Error)?.message ?? err);
  } finally {
    loading.value = false;
  }
}

const panelContentHtml = computed(() => {
  if (!selectedAction.value) return renderLuoguMarkdown(t("problemset.ai.pendingContent"));
  if (loading.value) return renderLuoguMarkdown(t("problemset.ai.generating"));
  if (errorMessage.value) return renderLuoguMarkdown(errorMessage.value);
  const content = aiContent.value[selectedAction.value];
  if (!content) return renderLuoguMarkdown(t("common.empty"));
  return renderLuoguMarkdown(content);
});

const currentModelName = computed(() => {
  const model = aiModels.value.find((m) => m.id === selectedModelId.value);
  return model?.name || model?.model || selectedModelId.value || "";
});

const longPressRemainingSeconds = computed(() => {
  if (longPressProgress.value >= 100) return 0;
  return Math.ceil((100 - longPressProgress.value) * LONG_PRESS_DURATION_MS / 100 / 1000);
});

// Close this panel if another instance takes over
watch(activeInstanceIndex, (current) => {
  if (current !== instanceId) {
    clearLongPress();
    loading.value = false;
    errorMessage.value = "";
  }
});

onBeforeUnmount(() => {
  clearLongPress();
  if (activeInstanceIndex.value === instanceId) {
    closePanel();
  }
});
</script>

<template>
  <div class="ai-assist">
    <button class="ai-trigger-btn" type="button" @click="openPanel">
      <i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i>
      <span>AI</span>
    </button>

    <Teleport to="#ai-sidebar-panel" v-if="panelVisible">
      <div class="ai-sidebar-card">
        <div class="ai-sidebar-header">
          <h3>{{ t("problemset.ai.panelTitle", { question: questionLabel }) }}</h3>
          <button class="ai-sidebar-close" type="button" @click="closePanel">×</button>
        </div>

        <div class="ai-sidebar-model" v-if="aiModels.length > 0">
          <label class="ai-model-label">
            <i class="fa-solid fa-robot"></i>
            {{ t("problemset.ai.modelLabel") }}
          </label>
          <select v-model="selectedModelId" class="ai-model-select" :disabled="loading">
            <option v-for="model in aiModels" :key="model.id" :value="model.id">
              {{ model.name || model.model || model.id }}
            </option>
          </select>
        </div>
        <div class="ai-sidebar-model" v-else-if="modelsLoading">
          <span class="ai-model-loading">{{ t("common.loading") }}</span>
        </div>

        <div class="ai-sidebar-actions">
          <button
            class="ai-action-btn"
            :class="{ pressing: longPressAction === 'hint' }"
            type="button"
            :disabled="loading"
            @mousedown="startLongPress('hint')"
            @mouseup="cancelLongPress"
            @mouseleave="cancelLongPress"
            @touchstart.prevent="startLongPress('hint')"
            @touchend.prevent="cancelLongPress"
            @touchcancel.prevent="cancelLongPress"
          >
            <span class="ai-action-progress" v-if="longPressAction === 'hint'" :style="{ width: longPressProgress + '%' }"></span>
            <span class="ai-action-label">
              {{ t("problemset.ai.hintOption") }}
              <template v-if="longPressAction === 'hint' && longPressProgress < 100">
                ({{ t("problemset.ai.longPressHint", { seconds: longPressRemainingSeconds }) }})
              </template>
            </span>
          </button>
          <button
            v-if="supportsSolution"
            class="ai-action-btn"
            :class="{ pressing: longPressAction === 'solution' }"
            type="button"
            :disabled="loading"
            @mousedown="startLongPress('solution')"
            @mouseup="cancelLongPress"
            @mouseleave="cancelLongPress"
            @touchstart.prevent="startLongPress('solution')"
            @touchend.prevent="cancelLongPress"
            @touchcancel.prevent="cancelLongPress"
          >
            <span class="ai-action-progress" v-if="longPressAction === 'solution'" :style="{ width: longPressProgress + '%' }"></span>
            <span class="ai-action-label">
              {{ t("problemset.ai.solutionOption") }}
              <template v-if="longPressAction === 'solution' && longPressProgress < 100">
                ({{ t("problemset.ai.longPressHint", { seconds: longPressRemainingSeconds }) }})
              </template>
            </span>
          </button>
        </div>

        <div class="ai-sidebar-content">
          <h4 v-if="selectedAction === 'hint'">{{ t("problemset.ai.hintTitle") }}</h4>
          <h4 v-else-if="selectedAction === 'solution'">{{ t("problemset.ai.solutionTitle") }}</h4>
          <h4 v-else>{{ t("problemset.ai.pendingTitle") }}</h4>
          <div class="ai-sidebar-markdown luogu-markdown" v-html="panelContentHtml"></div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
