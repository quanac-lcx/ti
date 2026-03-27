<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { problemsetApi, type ProblemsetDetail } from "../api/problemset";

type DetailTab = "description" | "question";

const route = useRoute();
const router = useRouter();

const loading = ref(true);
const detail = ref<ProblemsetDetail | null>(null);
const activeTab = ref<DetailTab>("description");
const selectedQuestionIndex = ref(0);
const answerVisible = ref(false);

const problemsetId = computed<number>(() => {
  const parsed = Number(route.params.id);
  return Number.isFinite(parsed) ? parsed : 1001;
});

const pageTitle = computed(() => {
  if (!detail.value) return `试题详情 #${problemsetId.value}`;
  return `${detail.value.summary.id} - ${detail.value.summary.title}`;
});

const currentQuestion = computed(() => {
  if (!detail.value) return null;
  return detail.value.questions[selectedQuestionIndex.value] ?? null;
});

const loadDetail = async () => {
  loading.value = true;
  detail.value = await problemsetApi.detail(problemsetId.value);
  selectedQuestionIndex.value = 0;
  activeTab.value = "description";
  answerVisible.value = false;
  loading.value = false;
};

const switchToQuestionTab = (index: number) => {
  selectedQuestionIndex.value = index;
  activeTab.value = "question";
  answerVisible.value = false;
};

const goExam = () => {
  router.push(`/problemset/${problemsetId.value}/exam`);
};

const goTraining = () => {
  router.push(`/problemset/${problemsetId.value}/training`);
};

onMounted(loadDetail);
watch(() => route.params.id, loadDetail);
</script>

<template>
  <TiLayout :title="pageTitle" subtitle="洛谷有题 / 试题列表 / 试题详情" :use-panel="false">
    <div class="detail-root" v-if="detail && !loading">
      <section class="summary-card">
        <div class="actions">
          <button class="action-btn action-btn-primary" type="button" @click="goExam">限时测试</button>
          <button class="action-btn" type="button" @click="goTraining">自由练习</button>
        </div>
        <div class="stats">
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

      <section class="content-grid">
        <div class="left-column">
          <div class="tabs-card">
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'description' }"
              type="button"
              @click="activeTab = 'description'"
            >
              测验描述
            </button>
            <button
              class="tab-btn"
              :class="{ active: activeTab === 'question' }"
              type="button"
              @click="activeTab = 'question'"
            >
              查看题目
            </button>
          </div>

          <div class="body-card" v-if="activeTab === 'description'">
            <p class="description-text">{{ detail.summary.description }}</p>
          </div>

          <div class="body-card" v-else-if="currentQuestion">
            <h3 class="question-title">第 {{ currentQuestion.index }} 题</h3>
            <p class="question-stem">{{ currentQuestion.stem }}</p>

            <ul v-if="currentQuestion.type === 'option'" class="options">
              <li v-for="option in currentQuestion.options" :key="option.key">
                <span class="option-dot"></span>
                <span>{{ option.key }}. {{ option.text }}</span>
              </li>
            </ul>

            <div v-else class="input-preview">
              <label>作答输入框预览</label>
              <input type="text" :placeholder="currentQuestion.inputPlaceholder || '请输入答案'" disabled />
            </div>

            <p class="question-score">本题共 {{ currentQuestion.score }} 分</p>

            <button class="answer-btn" type="button" @click="answerVisible = !answerVisible">
              {{ answerVisible ? "隐藏答案与解析" : "显示答案与解析" }}
            </button>

            <div v-if="answerVisible" class="answer-block">
              <p class="answer-text">正确答案：{{ currentQuestion.answer }}</p>
              <p class="analysis-text">解析：{{ currentQuestion.analysis }}</p>
            </div>
          </div>
        </div>

        <aside class="right-column">
          <div class="list-card">
            <h3 class="list-title">题目列表</h3>
            <div class="question-list">
              <button
                v-for="(question, index) in detail.questions"
                :key="question.id"
                class="question-btn"
                :class="{ active: selectedQuestionIndex === index }"
                type="button"
                @click="switchToQuestionTab(index)"
              >
                第 {{ question.index }} 题
              </button>
            </div>
          </div>
        </aside>
      </section>
    </div>

    <div class="loading-card" v-else>加载中...</div>
  </TiLayout>
</template>

<style scoped>
.detail-root {
  max-width: 1040px;
  margin: 0 auto;
  padding: 0 12px;
}

.summary-card {
  background: #fff;
  border: 1px solid #ececec;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
  padding: 14px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.actions {
  display: flex;
  gap: 10px;
}

.action-btn {
  height: 36px;
  border: 1px solid #f1972c;
  background: #fff;
  color: #f1972c;
  border-radius: 4px;
  padding: 0 14px;
  font-size: 14px;
  cursor: pointer;
}

.action-btn-primary {
  background: #f1972c;
  color: #fff;
}

.stats {
  display: flex;
  align-items: center;
  gap: 14px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-label {
  color: #777;
  font-size: 12px;
}

.stat-value {
  color: #333;
  font-size: 16px;
}

.stat-divider {
  width: 1px;
  height: 30px;
  background: #d9d9d9;
}

.content-grid {
  margin-top: 12px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) 300px;
  gap: 14px;
}

.tabs-card,
.body-card,
.list-card,
.loading-card {
  background: #fff;
  border: 1px solid #ececec;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

.tabs-card {
  padding: 10px;
  display: flex;
  gap: 8px;
}

.tab-btn {
  border: 0;
  background: transparent;
  color: #222;
  border-radius: 4px;
  height: 32px;
  padding: 0 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.tab-btn.active {
  background: #f1972c;
  color: #fff;
}

.body-card {
  margin-top: 10px;
  padding: 16px;
}

.description-text {
  margin: 0;
  color: #222;
  line-height: 1.7;
}

.question-title {
  margin: 0 0 10px;
  font-size: 20px;
}

.question-stem {
  margin: 0 0 12px;
  font-size: 16px;
}

.options {
  margin: 0 0 12px;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.options li {
  display: flex;
  align-items: center;
  gap: 8px;
}

.input-preview {
  display: grid;
  gap: 6px;
  margin: 6px 0 10px;
}

.input-preview label {
  font-size: 13px;
  color: #666;
}

.input-preview input {
  height: 36px;
  border: 1px solid #d6d6d6;
  border-radius: 4px;
  padding: 0 10px;
  background: #f8f8f8;
}

.option-dot {
  width: 12px;
  height: 12px;
  border: 1px solid #c8c8c8;
  border-radius: 50%;
  flex-shrink: 0;
}

.question-score {
  margin: 10px 0 8px;
  font-weight: 700;
}

.answer-btn {
  height: 36px;
  border: 1px solid #3297db;
  background: #3297db;
  color: #fff;
  border-radius: 4px;
  padding: 0 12px;
  font-size: 14px;
  cursor: pointer;
}

.answer-block {
  margin-top: 10px;
}

.answer-text {
  margin: 0 0 6px;
  color: #4caf50;
  font-weight: 700;
}

.analysis-text {
  margin: 0;
  color: #555;
}

.list-card {
  padding: 12px;
}

.list-title {
  margin: 0 0 8px;
  font-size: 20px;
}

.question-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.question-btn {
  border: 0;
  border-radius: 4px;
  background: #c7c7c7;
  color: #fff;
  height: 30px;
  padding: 0 10px;
  font-size: 13px;
  cursor: pointer;
}

.question-btn.active {
  background: #f1972c;
}

.loading-card {
  max-width: 1040px;
  margin: 0 auto;
  padding: 20px;
  color: #666;
}

@media (max-width: 980px) {
  .summary-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
