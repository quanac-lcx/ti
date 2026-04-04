<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import UiCard from "../components/UiCard.vue";
import TiLayout from "../layouts/TiLayout.vue";
import { loadLocalUser } from "../api/auth";
import { problemsetApi } from "../api/problemset";
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
    title: group.title || (group.material ? `材料题 ${groupIndex + 1}` : ""),
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
      { value: "official_public", label: "官方公开" },
      { value: "personal_featured", label: "个人精选" },
      { value: "personal_public", label: "个人公开" },
      { value: "personal_private", label: "个人私有" }
    ];
  }
  return [
    { value: "personal_public", label: "个人公开" },
    { value: "personal_private", label: "个人私有" }
  ];
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
    error.value = "请填写名称。";
    return;
  }
  if (!form.description.trim()) {
    error.value = "请填写测验描述。";
    return;
  }
  if (!Number.isFinite(form.durationMinutes) || form.durationMinutes <= 0) {
    error.value = "测试时间长度必须为正数。";
    return;
  }
  if (!form.questionConfig.trim()) {
    error.value = "请填写题目配置文件。";
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
    success.value = "修改成功。";
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
    title: "删除试卷",
    message: "确认删除当前试卷吗？删除后不可恢复。",
    confirmText: "确认删除",
    cancelText: "取消",
    danger: true
  });
  if (!confirmed) return;

  deleting.value = true;
  try {
    await problemsetApi.delete(sourceId.value);
    await router.push("/problemset");
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    deleting.value = false;
  }
}

onMounted(loadEditable);
</script>

<template>
  <TiLayout
    title="修改题目"
    subtitle="保存站有题 / 题库 / 修改题目"
    :use-panel="false"
    :loading="loading"
    loading-label="题目加载中"
  >
    <section class="problemset-edit-page create-wrap page-shell">
      <UiCard as="div" class="create-card create-main">
        <div class="title-actions">
          <h2>修改试卷</h2>
          <div class="actions actions-top">
            <button class="btn btn-primary" :disabled="pending || deleting" @click="saveEdit">
              {{ pending ? "保存中..." : "保存修改" }}
            </button>
            <button class="btn btn-danger" :disabled="pending || deleting" @click="removeProblemset">
              {{ deleting ? "删除中..." : "删除试卷" }}
            </button>
          </div>
        </div>

        <template v-if="!loading">
          <div class="form-grid">
            <label>
              <span>唯一标识符（ID）</span>
              <input v-model="form.id" type="number" min="1" :disabled="!isAdmin" />
            </label>

            <label>
              <span>名称</span>
              <input v-model.trim="form.title" type="text" />
            </label>

            <label>
              <span>测验描述</span>
              <textarea v-model="form.description" rows="3"></textarea>
            </label>

            <label>
              <span>测试时间长度（分钟）</span>
              <input v-model.number="form.durationMinutes" type="number" min="1" step="1" />
            </label>

            <label>
              <span>题目类型</span>
              <select v-model="form.problemsetType">
                <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </select>
            </label>

            <div class="collapse-tip">
              <details open>
                <summary>材料题语法说明</summary>
                <div class="tip-body">
                  <p>现在支持两种写法：</p>
                  <ol>
                    <li>普通题：<code>:::question ... :::</code></li>
                    <li>
                      材料题：<code>:::group title="阅读程序"</code> +
                      <code>[material]...[/material]</code> + 多个 <code>:::question</code>
                    </li>
                  </ol>
                  <p>适合一段长代码下面挂很多小题的场景，例如 CSP 阅读程序、补全代码、程序理解题。</p>
                  <p>旧的单题写法也会继续兼容，可以和材料题混写。</p>
                </div>
              </details>
            </div>

            <label>
              <span>题目配置文件</span>
              <textarea v-model="form.questionConfig" rows="20"></textarea>
            </label>

            <div class="preview-card">
              <div class="preview-title">实时预览</div>
              <ul v-if="previewErrors.length" class="preview-errors">
                <li v-for="(msg, index) in previewErrors" :key="index">{{ msg }}</li>
              </ul>

              <div v-if="previewGroups.length === 0" class="preview-empty">
                这里会实时渲染你输入的题目配置。
              </div>

              <div v-else class="preview-list">
                <section
                  v-for="(group, groupIndex) in previewGroups"
                  :key="group.materialGroupIndex ?? `single-${groupIndex}`"
                  class="preview-group"
                >
                  <div v-if="group.materialHtml" class="preview-material">
                    <div class="preview-material-title">
                      {{ group.title || `材料题 ${groupIndex + 1}` }}
                    </div>
                    <div class="preview-material-content luogu-markdown" v-html="group.materialHtml"></div>
                  </div>

                  <article
                    v-for="question in group.questions"
                    :key="question.index"
                    class="preview-item"
                  >
                    <header class="preview-head">
                      <span class="preview-tag">第 {{ question.index }} 题</span>
                      <span v-if="question.groupQuestionIndex" class="preview-meta">
                        材料题第 {{ question.groupQuestionIndex }}
                        <span v-if="question.groupQuestionCount"> / {{ question.groupQuestionCount }}</span>
                        小题
                      </span>
                      <span class="preview-meta">
                        类型：{{ question.type === "input" ? "填空" : "选择" }}｜分值：{{ question.score }}
                      </span>
                      <span class="preview-answer">答案：{{ question.answer }}</span>
                    </header>

                    <div class="preview-stem luogu-markdown" v-html="question.stemHtml"></div>

                    <ul v-if="question.type === 'option'" class="preview-options">
                      <li v-for="option in question.optionsHtml" :key="option.key">
                        <strong>{{ option.key }}.</strong>
                        <span class="luogu-markdown" v-html="option.html"></span>
                      </li>
                    </ul>

                    <div v-else class="preview-input">
                      <label>填空</label>
                      <input type="text" :placeholder="question.inputPlaceholder || '请输入答案'" disabled />
                    </div>

                    <div v-if="question.analysis" class="preview-analysis">
                      <strong>解析：</strong>
                      <div class="luogu-markdown" v-html="question.analysisHtml"></div>
                    </div>
                  </article>
                </section>
              </div>
            </div>
          </div>

          <div class="meta">
            <span>当前共解析到 {{ questionCount }} 题</span>
            <span v-if="materialGroupCount > 0">，其中材料题分组 {{ materialGroupCount }} 组</span>
          </div>

          <div class="actions">
            <button class="btn btn-primary" :disabled="pending || deleting" @click="saveEdit">
              {{ pending ? "保存中..." : "保存修改" }}
            </button>
            <button class="btn btn-danger" :disabled="pending || deleting" @click="removeProblemset">
              {{ deleting ? "删除中..." : "删除试卷" }}
            </button>
          </div>

          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="success" class="success">{{ success }}</p>
        </template>
      </UiCard>
    </section>
  </TiLayout>
</template>
