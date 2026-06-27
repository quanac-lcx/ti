<script setup lang="ts">
import TiLayout from "../layouts/TiLayout.vue";
import NotFoundMessage from "../components/NotFoundMessage.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <TiLayout
    :title="t('pageNotFound.title')"
    :subtitle="t('pageNotFound.subtitle')"
    :use-panel="false"
  >
    <NotFoundMessage i18n-prefix="pageNotFound" />
  </TiLayout>
</template>
