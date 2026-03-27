<script setup lang="ts">
import { onMounted, ref } from "vue";
import TiLayout from "../layouts/TiLayout.vue";
import { problemsetApi, type ProblemsetSummary } from "../api/problemset";

const loading = ref(true);
const problems = ref<ProblemsetSummary[]>([]);

onMounted(async () => {
  problems.value = await problemsetApi.list();
  loading.value = false;
});
</script>

<template>
  <TiLayout title="题库" subtitle="洛谷有题 / 试题列表">
    <div class="actions">
      <router-link class="create-btn" to="/problemset/_new">新建题目</router-link>
    </div>
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else class="list">
      <router-link v-for="p in problems" :key="p.id" class="row" :to="`/problemset/${p.id}`">
        <div class="id">{{ p.id }}</div>
        <div class="title">{{ p.title }}</div>
      </router-link>
    </div>
  </TiLayout>
</template>

<style scoped>
.loading {
  padding: 20px 26px;
  color: #777;
}

.actions {
  padding: 12px 20px 0;
}

.create-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 14px;
  border-radius: 4px;
  border: 1px solid #f1972c;
  color: #f1972c;
  background: #fff;
  text-decoration: none;
}

.create-btn:hover {
  background: #fff7ed;
}

.list {
  display: flex;
  flex-direction: column;
}

.row {
  display: grid;
  grid-template-columns: 96px 1fr;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 0 20px;
  text-decoration: none;
  color: inherit;
  border-top: 1px solid #efefef;
  transition: background-color 140ms ease;
}

.row:first-child {
  border-top: none;
}

.row:hover {
  background: #fafcff;
}

.row:hover .title {
  color: #0d58d9;
}

.id {
  color: #1c1c1c;
  font-size: 20px;
  margin-left: 0;
  font-weight: 700;
}

.title {
  color: #0c67f3;
  font-size: 16px;
  margin-left: 0;
  font-weight: 500;
}

@media (max-width: 860px) {
  .row {
    grid-template-columns: 78px 1fr;
    min-height: 52px;
    padding: 0 14px;
  }

  .id,
  .title {
    font-size: 15px;
    margin-left: 0;
  }
}
</style>
