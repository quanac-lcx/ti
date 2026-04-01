<script setup lang="ts">
import { computed, onMounted, reactive, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { loadLocalUser } from "../api/auth";
import { problemsetApi } from "../api/problemset";
import { renderLuoguMarkdown } from "../utils/luoguMarkdown";
import { parseQuestionConfig } from "../utils/questionConfigParser";

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
  problemsetType: (isAdmin.value ? "official_public" : "personal_public") as
    | "official_public"
    | "personal_featured"
    | "personal_public"
    | "personal_private"
});

const previewParsed = computed(() => parseQuestionConfig(form.questionConfig));

const previewQuestions = computed(() =>
  previewParsed.value.questions.map((q, idx) => ({
    ...q,
    index: idx + 1,
    stemHtml: renderLuoguMarkdown(q.stem),
    analysisHtml: renderLuoguMarkdown(q.analysis),
    optionsHtml: q.options.map((opt) => ({ ...opt, html: renderLuoguMarkdown(opt.text) }))
  }))
);

const previewErrors = computed(() => previewParsed.value.errors);

const blockCount = computed(() => {
  const matched = form.questionConfig.match(/:::question/g);
  return matched ? matched.length : 0;
});

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
    error.value = "请填写描述。";
    return;
  }
  if (!form.questionConfig.trim()) {
    error.value = "请填写题目配置文件。";
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
    success.value = "修改成功";
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
  if (!window.confirm("确认删除当前题目吗？删除后不可恢复。")) {
    return;
  }
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
  <TiLayout title="修改题目" subtitle="洛谷有题 / 题库 / 修改题目" :use-panel="false">
    <section class="problemset-edit-page create-wrap page-shell">
      <div class="create-card create-main">
        <div class="title-actions">
          <h2>修改试卷</h2>
          <div class="actions actions-top">
            <button class="btn btn-primary" :disabled="pending || deleting" @click="saveEdit">{{ pending ? "保存中..." : "保存修改" }}</button>
            <button class="btn btn-danger" :disabled="pending || deleting" @click="removeProblemset">{{ deleting ? "删除中..." : "删除题目" }}</button>
          </div>
        </div>
        <div v-if="loading">加载中...</div>
        <template v-else>
          <div class="form-grid">
            <label>
              <span>ID</span>
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
                <summary>题目配置格式</summary>
                <div class="tip-body">
                  <ol>
                    <li>每道题使用一个 <code>:::question ... :::</code> 块。</li>
                    <li>题干用 <code>[stem] ... [/stem]</code>，支持 Markdown / LaTeX。</li>
                    <li>选择题或判断题：<code>[options answer=A,B]</code> 包含所有选项文本。</li>
                    <li>填空题：<code>[input answer=答案 placeholder=提示语（可选）]</code>。</li>
                    <li>解析(可选)：<code>[analysis] ... [/analysis]</code>，支持 Markdown / LaTeX。</li>
                  </ol>
                </div>
              </details>
            </div>

            <label>
              <span>题目配置文件</span>
              <textarea v-model="form.questionConfig" rows="16"></textarea>
            </label>

            <div class="preview-card">
              <div class="preview-title">实时预览</div>
              <ul v-if="previewErrors.length" class="preview-errors">
                <li v-for="(msg, i) in previewErrors" :key="i">{{ msg }}</li>
              </ul>
              <div v-if="previewQuestions.length === 0" class="preview-empty">这里会实时渲染你在上方输入的题目配置</div>
              <div v-else class="preview-list">
                <article v-for="q in previewQuestions" :key="q.index" class="preview-item">
                  <header class="preview-head">
                    <span class="preview-tag">第 {{ q.index }} 题</span>
                    <span class="preview-meta">类型：{{ q.type === "input" ? "填空" : "选择" }}｜分值：{{ q.score }}</span>
                    <span class="preview-answer">答案：{{ q.answer }}</span>
                  </header>
                  <div class="preview-stem luogu-markdown" v-html="q.stemHtml"></div>
                  <ul v-if="q.type === 'option'" class="preview-options">
                    <li v-for="opt in q.optionsHtml" :key="opt.key">
                      <strong>{{ opt.key }}.</strong>
                      <span class="luogu-markdown" v-html="opt.html"></span>
                    </li>
                  </ul>
                  <div v-else class="preview-input">
                    <label>填空</label>
                    <input type="text" :placeholder="q.inputPlaceholder || '请输入答案'" disabled />
                  </div>
                  <div v-if="q.analysis" class="preview-analysis">
                    <strong>解析：</strong>
                    <div class="luogu-markdown" v-html="q.analysisHtml"></div>
                  </div>
                </article>
              </div>
            </div>
          </div>

          <div class="meta">
            <span>当前检测到题目块：{{ blockCount }}</span>
          </div>

          <div class="actions">
            <button class="btn btn-primary" :disabled="pending || deleting" @click="saveEdit">{{ pending ? "保存中..." : "保存修改" }}</button>
            <button class="btn btn-danger" :disabled="pending || deleting" @click="removeProblemset">{{ deleting ? "删除中..." : "删除题目" }}</button>
          </div>

          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="success" class="success">{{ success }}</p>
        </template>
      </div>
    </section>
  </TiLayout>
</template>
