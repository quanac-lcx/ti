<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import TiLayout from "../layouts/TiLayout.vue";
import { problemsetApi, type ProblemsetSummary } from "../api/problemset";

const route = useRoute();
const router = useRouter();

const loading = ref(false);
const problems = ref<ProblemsetSummary[]>([]);
const error = ref("");
const searchInput = ref("");

function typeLabel(type: ProblemsetSummary["problemsetType"]) {
  if (type === "official_public") return "官方公开";
  if (type === "personal_featured") return "个人精选";
  if (type === "personal_public") return "个人公开";
  return "其他";
}

function syncInputFromRoute() {
  searchInput.value = String(route.query.q ?? "").trim();
}

async function loadSearch() {
  const keyword = String(route.query.q ?? "").trim();
  syncInputFromRoute();
  error.value = "";

  if (!keyword) {
    problems.value = [];
    loading.value = false;
    return;
  }

  loading.value = true;
  try {
    problems.value = await problemsetApi.search(keyword);
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
    problems.value = [];
  } finally {
    loading.value = false;
  }
}

async function submitSearch() {
  const keyword = searchInput.value.trim();
  await router.replace({
    path: "/search",
    query: keyword ? { q: keyword } : {}
  });
}

onMounted(loadSearch);

watch(
  () => route.query.q,
  () => {
    loadSearch();
  }
);
</script>

<template>
  <TiLayout title="搜索" subtitle="保存站有题 / 搜索">
    <div class="problemset-search-page">
      <div class="toolbar">
        <form class="search-form" @submit.prevent="submitSearch">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            v-model="searchInput"
            class="search-input"
            type="search"
            placeholder="搜索题目 ID、标题、描述或作者用户名"
          />
        </form>

        <div class="toolbar-actions">
          <button class="tab search-submit" type="button" @click="submitSearch">
            <i class="fa-solid fa-magnifying-glass"></i>
            搜索
          </button>
          <router-link class="tab ghost link-btn" to="/problemset">
            <i class="fa-solid fa-arrow-left"></i>
            返回题库
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <i class="fa-solid fa-spinner fa-spin"></i>
        搜索中...
      </div>
      <div v-else-if="error" class="error">
        <i class="fa-solid fa-circle-exclamation"></i>
        {{ error }}
      </div>
      <div v-else-if="!String(route.query.q ?? '').trim()" class="loading">
        请输入文本。按下 Enter 键开始搜索。
      </div>
      <div v-else-if="problems.length === 0" class="loading">
        <i class="fa-regular fa-folder-open"></i>
        没有找到匹配的官方公开、个人精选或个人公开题目
      </div>
      <div v-else class="list">
        <router-link v-for="p in problems" :key="p.id" class="row search-row" :to="`/problemset/${p.id}`">
          <div class="id">{{ p.id }}</div>
          <div class="search-main">
            <div class="title">{{ p.title }}</div>
            <div class="search-desc">{{ p.description }}</div>
          </div>
          <div class="search-meta">
            <span class="type-tag" :class="p.problemsetType">{{ typeLabel(p.problemsetType) }}</span>
            <span class="search-count">{{ p.questionCount }} 题</span>
          </div>
          <i class="fa-solid fa-chevron-right row-arrow"></i>
        </router-link>
      </div>
    </div>
  </TiLayout>
</template>
