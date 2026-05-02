<script setup lang="ts">
import TiLayout from "../layouts/TiLayout.vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
</script>

<template>
  <TiLayout
    :title="t('auth.bannedTitle')"
    :subtitle="t('auth.bannedSubtitle')"
    :use-panel="false"
  >
    <section class="auth-banned-page">
      <div class="banned-card">
        <div class="banned-icon" aria-hidden="true">
          <i class="fa-solid fa-user-slash"></i>
        </div>
        <h1 class="banned-title">{{ t("auth.bannedHeading") }}</h1>
        <p class="banned-text">{{ t("auth.bannedText") }}</p>
        <p class="banned-text">{{ t("auth.bannedContact") }}</p>
      </div>
    </section>
  </TiLayout>
</template>
