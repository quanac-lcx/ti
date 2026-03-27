<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { loadLocalUser } from "../api/auth";
import { problemsetApi } from "../api/problemset";

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
  questionConfig: ""
});

const ruleTemplate = `:::question type=option score=2.5
[stem]
题干（支持 Markdown / LaTeX，不支持 HTML）
[/stem]
[options answer=A,C]
A. 选项A
B. 选项B
C. 选项C
[/options]
[analysis]
解析（可选）
[/analysis]
:::

:::question type=input score=3
[stem]
填空题题干
[/stem]
[input answer=42 placeholder=请输入答案]
[/input]
[analysis]
解析（可选）
[/analysis]
:::`;

const blockCount = computed(() => {
  const matched = form.questionConfig.match(/:::question/g);
  return matched ? matched.length : 0;
});

const createProblemset = async () => {
  error.value = "";
  success.value = "";
  if (!currentUser?.uid) {
    error.value = "请先登录后再创建试卷。";
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

  pending.value = true;
  try {
    const created = await problemsetApi.create({
      ...(isAdmin.value && form.id.trim() ? { id: Number(form.id.trim()) } : {}),
      title: form.title.trim(),
      description: form.description.trim(),
      durationMinutes: Number(form.durationMinutes),
      questionConfig: form.questionConfig
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
    <section class="create-wrap">
      <div class="panel">
        <h2>创建试卷</h2>

        <div v-if="!currentUser" class="warning">
          请先登录。<router-link to="/auth/login">去登录</router-link>
        </div>

        <template v-else>
          <div class="form-grid">
            <label v-if="isAdmin">
              <span>唯一标识符（ID）</span>
              <input v-model.trim="form.id" type="number" min="1" placeholder="管理员可自定义，留空自动分配" />
            </label>

            <label>
              <span>名称</span>
              <input v-model.trim="form.title" type="text" placeholder="例如：NOIP 2026 提高组初赛试题" />
            </label>

            <label>
              <span>测验描述</span>
              <textarea v-model="form.description" rows="3" placeholder="例如：共 25 题，单选 + 填空，支持 markdown 与 latex"></textarea>
            </label>

            <label>
              <span>测试时间长度（分钟）</span>
              <input v-model.number="form.durationMinutes" type="number" min="1" step="1" />
            </label>

            <label>
              <span>题目配置文件</span>
              <textarea
                v-model="form.questionConfig"
                rows="18"
                placeholder="按下方规则填写，支持多个 :::question 块"
              ></textarea>
            </label>
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

      <div class="panel rules">
        <h3>推荐配置规则（更易上手）</h3>
        <p>每道题使用一个 <code>:::question ... :::</code> 块，固定写法如下：</p>
        <ol>
          <li><strong>头部</strong>：`:::question type=option|input score=分值`</li>
          <li><strong>题干</strong>：`[stem] ... [/stem]`（支持 Markdown/LaTeX）</li>
          <li><strong>选择题</strong>：`[options answer=A,C]` + `A. ...` 选项列表</li>
          <li><strong>填空题</strong>：`[input answer=答案 placeholder=提示语] [/input]`</li>
          <li><strong>解析</strong>：`[analysis] ... [/analysis]`（可选）</li>
        </ol>
        <pre>{{ ruleTemplate }}</pre>
      </div>
    </section>
  </TiLayout>
</template>

<style scoped>
.create-wrap {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 12px;
  display: grid;
  gap: 12px;
}

.panel {
  background: #fff;
  border: 1px solid #ececec;
  border-radius: 6px;
  padding: 16px;
}

.panel h2,
.panel h3 {
  margin: 0 0 12px;
}

.warning {
  color: #8a6d3b;
}

.form-grid {
  display: grid;
  gap: 10px;
}

label {
  display: grid;
  gap: 6px;
}

label span {
  color: #374151;
  font-weight: 600;
}

input,
textarea {
  width: 100%;
  border: 1px solid #d5d5d5;
  border-radius: 4px;
  padding: 8px 10px;
  font-size: 14px;
  box-sizing: border-box;
}

.meta {
  margin-top: 8px;
  color: #6b7280;
  font-size: 13px;
}

.actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.btn {
  height: 34px;
  border-radius: 4px;
  border: 1px solid #d0d0d0;
  background: #fff;
  padding: 0 12px;
  cursor: pointer;
}

.btn-primary {
  background: #f1972c;
  border-color: #f1972c;
  color: #fff;
}

.btn-ghost {
  color: #374151;
}

.error {
  margin: 10px 0 0;
  color: #dc2626;
}

.success {
  margin: 10px 0 0;
  color: #16a34a;
}

.rules code {
  background: #f3f4f6;
  padding: 1px 4px;
  border-radius: 4px;
}

.rules pre {
  margin: 10px 0 0;
  background: #111827;
  color: #f9fafb;
  border-radius: 6px;
  padding: 12px;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.55;
}
</style>
