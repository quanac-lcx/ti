<script setup lang="ts">
import { onMounted, ref } from "vue";
import TiLayout from "../layouts/TiLayout.vue";
import { problemsetApi, type ProblemsetSummary } from "../api/problemset";

const loading = ref(true);
const problems = ref<ProblemsetSummary[]>([]);
const error = ref("");
const activeTab = ref<"official" | "all" | "featured">("official");

async function loadList() {
  loading.value = true;
  error.value = "";
  try {
    problems.value = await problemsetApi.list(activeTab.value);
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
    problems.value = [];
  } finally {
    loading.value = false;
  }
}

onMounted(loadList);
</script>

<template>
  <TiLayout title="题库" subtitle="洛谷有题 / 试题列表">
    <div class="problemset-page">
      <div class="toolbar">
        <div class="tabs">
          <button class="tab" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'; loadList()">
            <i class="fa-solid fa-table-cells-large"></i>
            全部
          </button>
          <button class="tab" :class="{ active: activeTab === 'official' }" @click="activeTab = 'official'; loadList()">
            <i class="fa-solid fa-shield"></i>
            官方题目
          </button>
          <button class="tab" :class="{ active: activeTab === 'featured' }" @click="activeTab = 'featured'; loadList()">
            <i class="fa-solid fa-star"></i>
            个人精选
          </button>
        </div>
        <div class="toolbar-actions">
          <button class="tab ghost" type="button" @click="loadList">
            <i class="fa-solid fa-rotate-right"></i>
            刷新
          </button>
          <router-link class="create-btn" to="/problemset/_new">
            <i class="fa-solid fa-plus"></i>
            新建题目
          </router-link>
        </div>
      </div>
      <div v-if="loading" class="loading"><i class="fa-solid fa-spinner fa-spin"></i>加载中...</div>
      <div v-else-if="error" class="error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</div>
      <div v-else-if="problems.length === 0" class="loading"><i class="fa-regular fa-folder-open"></i>当前分栏下暂无题目</div>
      <div v-else class="list">
        <router-link v-for="p in problems" :key="p.id" class="row" :to="`/problemset/${p.id}`">
          <div class="id">{{ p.id }}</div>
          <div class="title">{{ p.title }}</div><i class="fa-solid fa-chevron-right row-arrow"></i>
        </router-link>
      </div>
    </div>
  </TiLayout>
</template>


