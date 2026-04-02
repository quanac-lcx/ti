<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { loadLocalUser } from "../api/auth";
import { problemsetApi } from "../api/problemset";
import { renderLuoguMarkdown } from "../utils/luoguMarkdown";
import { parseQuestionConfig } from "../utils/questionConfigParser";

type ProblemsetType =
  | "official_public"
  | "personal_featured"
  | "personal_public"
  | "personal_private";

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
  problemsetType: (isAdmin.value ? "official_public" : "personal_public") as ProblemsetType
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

const ruleTemplate = `:::group title="阅读程序"
[material]
请阅读程序，完成下面小题。

\`\`\`cpp
#include <iostream>
using namespace std;

int main() {
    int a, b;
    cin >> a >> b;
    int x = a + b;
    cout << x << endl;
    return 0;
}
\`\`\`
[/material]

:::question type=option score=2
[stem]
如果输入 \`3 4\`，输出结果是多少？
[/stem]
[options answer=B]
A. 5
B. 7
C. 9
D. 11
[/options]
[analysis]
3+4=7，所以输出结果是 7。
[/analysis]
:::

:::question type=input score=2
[stem]
如果把 \`x = a + b\` 改成 \`x = a * b\`，输入 \`3 4\` 时输出结果是多少？
[/stem]
[input answer=12 placeholder="请直接填写输出结果"]
[/input]
:::
:::

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

const createProblemset = async () => {
  error.value = "";
  success.value = "";

  const customIdRaw = String(form.id ?? "").trim();
  const customId = Number(customIdRaw);
  if (!currentUser?.uid) {
    error.value = "请先登录。";
    return;
  }
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
  if (isAdmin.value && customIdRaw && (!Number.isInteger(customId) || customId <= 0)) {
    error.value = "ID 必须是正整数。";
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
              <input
                v-model="form.id"
                type="number"
                min="1"
                placeholder="你是管理员，可以自定义。留空会自动分配"
              />
            </label>

            <label>
              <span>名称</span>
              <input v-model.trim="form.title" type="text" placeholder="填写名称" />
            </label>

            <label>
              <span>测验描述</span>
              <textarea
                v-model="form.description"
                rows="3"
                placeholder="例如：共 25 题，含阅读程序、补全代码、选择题与填空题。"
              ></textarea>
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
                    <li>普通题使用 <code>:::question ... :::</code>。</li>
                    <li>题干使用 <code>[stem]...[/stem]</code>，支持 Markdown / LaTeX / 代码块。</li>
                    <li>选择题使用 <code>[options answer=A,C]...[/options]</code>，最多 26 个选项。</li>
                    <li>填空题使用 <code>[input answer=答案 placeholder="提示语"][/input]</code>。</li>
                    <li>解析使用 <code>[analysis]...[/analysis]</code>，可选。</li>
                    <li>
                      材料题用 <code>:::group title="阅读程序"</code> 包住一组小题，并用
                      <code>[material]...[/material]</code> 放共享代码/材料。
                    </li>
                    <li>一个 <code>:::group</code> 内可以放很多道 <code>:::question</code>，适合阅读程序、补全代码等</li>
                    <li>嵌套可能会产生bug，没有测试过。</li>
                  </ol>
                </div>
              </details>
            </div>

            <label>
              <span>题目配置文件</span>
              <textarea
                v-model="form.questionConfig"
                rows="20"
                placeholder="按上方规则填写。也可以点击下方填入模板熟悉一下格式。输入的内容会实时渲染在下方。"
              ></textarea>
            </label>

            <div class="preview-card">
              <div class="preview-title">实时预览</div>
              <ul v-if="previewErrors.length" class="preview-errors">
                <li v-for="(msg, index) in previewErrors" :key="index">{{ msg }}</li>
              </ul>

              <div v-if="previewGroups.length === 0" class="preview-empty">
                请输入文本
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
