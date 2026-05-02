<script setup lang="ts">
import { onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import TiLayout from "../layouts/TiLayout.vue";
import { problemsetApi, type ProblemsetSummary } from "../api/problemset";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const loading = ref(false);
const problems = ref<ProblemsetSummary[]>([]);
const error = ref("");
const searchInput = ref("");

function typeLabel(type: ProblemsetSummary["problemsetType"]) {
  if (type === "official_public") return t("problemset.types.officialPublic");
  if (type === "personal_featured") return t("problemset.types.personalFeatured");
  if (type === "personal_public") return t("problemset.types.personalPublic");
  return t("problemset.types.other");
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
  <TiLayout :title="t('problemset.search.title')" :subtitle="t('problemset.search.subtitle')">
    <div class="problemset-search-page">
      <div class="toolbar">
        <form class="search-form" @submit.prevent="submitSearch">
          <i class="fa-solid fa-magnifying-glass search-icon"></i>
          <input
            v-model="searchInput"
            class="search-input"
            type="search"
            :placeholder="t('problemset.search.placeholder')"
          />
        </form>

        <div class="toolbar-actions">
          <button class="tab search-submit" type="button" @click="submitSearch">
            <i class="fa-solid fa-magnifying-glass"></i>
            {{ t("common.search") }}
          </button>
          <router-link class="tab ghost link-btn" to="/problemset">
            <i class="fa-solid fa-arrow-left"></i>
            {{ t("problemset.search.back") }}
          </router-link>
        </div>
      </div>

      <div v-if="loading" class="loading">
        <i class="fa-solid fa-spinner fa-spin"></i>
        {{ t("problemset.search.searching") }}
      </div>
      <div v-else-if="error" class="error">
        <i class="fa-solid fa-circle-exclamation"></i>
        {{ error }}
      </div>
      <div v-else-if="!String(route.query.q ?? '').trim()" class="loading">
        {{ t("problemset.search.idle") }}
      </div>
      <div v-else-if="problems.length === 0" class="loading">
        <i class="fa-regular fa-folder-open"></i>
        {{ t("problemset.search.empty") }}
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
            <span class="search-count">{{ p.questionCount }} {{ t("common.questions") }}</span>
          </div>
          <i class="fa-solid fa-chevron-right row-arrow"></i>
        </router-link>
      </div>
    </div>
  </TiLayout>
</template>
