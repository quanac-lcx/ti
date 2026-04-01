<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { loadLocalUser } from "../api/auth";
import { problemsetApi } from "../api/problemset";
import { renderLuoguMarkdown } from "../utils/luoguMarkdown";
import { parseQuestionConfig } from "../utils/questionConfigParser";

const router = useRouter();
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
  problemsetType: (isAdmin.value ? "official_public" : "personal_public") as
    | "official_public"
    | "personal_featured"
    | "personal_public"
    | "personal_private"
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

const ruleTemplate = `
:::question type=option score=2.5
[stem]
题干（支持 Markdown / LaTeX）
[/stem]
[options answer=A,C]
A. 选项A
B. 选项B
C. 选项C
[/options]
[analysis]
我是本题的解析，可以告诉用户这道题的解题思路，或者写一些相关的知识点。解析部分同样支持 Markdown 和 LaTeX，可以写得很丰富哦，也可以不写。用户无法在测试时查看解析。
[/analysis]
:::

:::question type=input score=3
[stem]
填空题题干，支持 Markdown 和 LaTeX。聪明的你应该也已经看到了，本题没有解析。
[/stem]
[input answer=42 placeholder=这是提示语，可以告诉用户填写的格式，也可以不写]
[/input]
:::`;

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

const createProblemset = async () => {
  error.value = "";
  success.value = "";
  const customIdRaw = String(form.id ?? "").trim();
  const customId = Number(customIdRaw);
  if (!currentUser?.uid) {
    error.value = "请先登录";
    return;
  }

  if (!form.title.trim()) {
    error.value = "请填写名称。";
    return;
  }
  if (!form.description.trim()) {
    error.value = "请填写描述。";
    return;
  }
  if (!Number.isFinite(form.durationMinutes) || form.durationMinutes <= 0) {
    error.value = "测试时长须为正数。";
    return;
  }
  if (!form.questionConfig.trim()) {
    error.value = "请填写题目配置文件。";
    return;
  }

  if (isAdmin.value && customIdRaw && (!Number.isInteger(customId) || customId <= 0)) {
    error.value = "ID必须是正整数。";
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
    success.value = `创建成功，试卷 ID 为 ${created.id}`;
    await router.push(`/problemset/${created.id}`);
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    pending.value = false;
  }
};
</script>

<template>
  <TiLayout title="新建题目" subtitle="洛谷有题 / 题库 / 新建题目" :use-panel="false">
    <section class="problemset-create-page create-wrap page-shell">
      <div class="create-card create-main">
        <h2>创建试卷</h2>

        <div v-if="!currentUser" class="warning">
          请先登录。<router-link to="/auth/login">去登录</router-link>
        </div>

        <template v-else>
          <div class="form-grid">
            <label v-if="isAdmin">
              <span>ID</span>
              <input v-model="form.id" type="number" min="1" placeholder="你是管理员，可以自定义。留空会自动分配" />
            </label>

            <label>
              <span>名称</span>
              <input v-model.trim="form.title" type="text" placeholder="例如：西西弗 2099 提高组试题" />
            </label>

            <label>
              <span>测验描述</span>
              <textarea v-model="form.description" rows="3" placeholder="例如：共 25 题，单选 + 填空。支持 Markdown 与 latex"></textarea>
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
                    <li>选择题或判断题：<code>[options answer=A,B]</code> 包含所有选项文本，支持 Markdown / LaTeX。</li>
                    <li>填空题：<code>[input answer=答案 placeholder=提示语（可选）]</code>。</li>
                    <li>解析(可选)：<code>[analysis] ... [/analysis]</code>，支持 Markdown / LaTeX。</li>
                  </ol>
                </div>
              </details>
            </div>

            <label>
              <span>题目配置文件</span>
              <textarea
                v-model="form.questionConfig"
                rows="16"
                placeholder="按上方规则填写，支持多个 :::question 块"
              ></textarea>
            </label>

            <div class="preview-card">
              <div class="preview-title">实时预览</div>
              <ul v-if="previewErrors.length" class="preview-errors">
                <li v-for="(msg, i) in previewErrors" :key="i">{{ msg }}</li>
              </ul>
              <div v-if="previewQuestions.length === 0" class="preview-empty">这里会实时渲染你在上方输入的题目配置</div>
              <div v-else class="preview-list">
                <article v-for="(q, idx) in previewQuestions" :key="idx" class="preview-item">
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
            <button type="button" class="btn btn-ghost" @click="form.questionConfig = ruleTemplate">填入模板</button>
            <button type="button" class="btn btn-primary" :disabled="pending" @click="createProblemset">
              {{ pending ? "创建中..." : "创建试卷" }}
            </button>
          </div>

          <p v-if="error" class="error">{{ error }}</p>
          <p v-if="success" class="success">{{ success }}</p>
        </template>
      </div>

    </section>
  </TiLayout>
</template>


