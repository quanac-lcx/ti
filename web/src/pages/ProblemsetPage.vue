<script setup lang="ts">
import { onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import TiLayout from "../layouts/TiLayout.vue";
import { problemsetApi, type ProblemsetSummary } from "../api/problemset";

const { t } = useI18n();
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
  <TiLayout :title="t('problemset.list.title')" :subtitle="t('problemset.list.subtitle')">
    <div class="problemset-page">
      <div class="toolbar">
        <div class="tabs">
          <button class="tab" :class="{ active: activeTab === 'all' }" @click="activeTab = 'all'; loadList()">
            <i class="fa-solid fa-table-cells-large"></i>
            {{ t("common.all") }}
          </button>
          <button class="tab" :class="{ active: activeTab === 'official' }" @click="activeTab = 'official'; loadList()">
            <i class="fa-solid fa-shield"></i>
            {{ t("problemset.list.official") }}
          </button>
          <button class="tab" :class="{ active: activeTab === 'featured' }" @click="activeTab = 'featured'; loadList()">
            <i class="fa-solid fa-star"></i>
            {{ t("problemset.list.featured") }}
          </button>
        </div>
        <div class="toolbar-actions">
          <router-link class="tab ghost" to="/search">
            <i class="fa-solid fa-magnifying-glass"></i>
            {{ t("common.search") }}
          </router-link>
          <button class="tab ghost" type="button" @click="loadList">
            <i class="fa-solid fa-rotate-right"></i>
            {{ t("common.refresh") }}
          </button>
          <router-link class="create-btn" to="/problemset/_new">
            <i class="fa-solid fa-plus"></i>
            {{ t("problemset.list.create") }}
          </router-link>
        </div>
      </div>
      <div v-if="loading" class="loading"><i class="fa-solid fa-spinner fa-spin"></i>{{ t("common.loading") }}</div>
      <div v-else-if="error" class="error"><i class="fa-solid fa-circle-exclamation"></i>{{ error }}</div>
      <div v-else-if="problems.length === 0" class="loading"><i class="fa-regular fa-folder-open"></i>{{ t("problemset.list.empty") }}</div>
      <div v-else class="list">
        <router-link v-for="p in problems" :key="p.id" class="row" :to="`/problemset/${p.id}`">
          <div class="id">{{ p.id }}</div>
          <div class="title">{{ p.title }}</div><i class="fa-solid fa-chevron-right row-arrow"></i>
        </router-link>
      </div>
    </div>
  </TiLayout>
</template>
