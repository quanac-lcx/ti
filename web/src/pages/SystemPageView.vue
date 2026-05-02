<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import TiLayout from "../layouts/TiLayout.vue";
import { fetchSystemPage, type SystemPage } from "../api/siteContent";
import { renderLuoguMarkdown } from "../utils/luoguMarkdown";

const route = useRoute();
const { t } = useI18n();
const loading = ref(true);
const error = ref("");
const page = ref<SystemPage | null>(null);

const slug = computed(() => String(route.params.slug ?? "").trim());
const contentHtml = computed(() => renderLuoguMarkdown(page.value?.content ?? ""));

async function loadPage() {
  loading.value = true;
  error.value = "";
  page.value = null;
  try {
    page.value = await fetchSystemPage(slug.value);
  } catch (err) {
    error.value = String((err as Error)?.message ?? err);
  } finally {
    loading.value = false;
  }
}

onMounted(loadPage);
watch(slug, loadPage);
</script>

<template>
  <TiLayout
    :title="page?.title || t('systemPage.title')"
    :subtitle="t('systemPage.subtitle')"
    :show-title="false"
    :use-panel="false"
    :loading="loading"
    :loading-label="t('systemPage.loading')"
  >
    <section class="system-page page-shell">
      <article v-if="page" class="system-page-card">
        <header class="system-page-head">
          <h2>{{ page.title }}</h2>
          <p class="system-page-meta">{{ t("systemPage.updatedAt", { time: page.updatedAt }) }}</p>
        </header>
        <div class="system-page-content luogu-markdown" v-html="contentHtml"></div>
      </article>

      <article v-else-if="!loading" class="system-page-card system-page-empty">
        <h2>{{ t("systemPage.notFoundTitle") }}</h2>
        <p>{{ error || t("common.notFound") }}</p>
      </article>
    </section>
  </TiLayout>
</template>
