<script setup lang="ts">
import { useI18n } from "vue-i18n";

interface NotFoundMessageProps {
  /** i18n key prefix, e.g. "pageNotFound", "userNotFound", "problemSetNotFound" */
  i18nPrefix: string;
}

const props = defineProps<NotFoundMessageProps>();
const { t } = useI18n();
</script>

<template>
  <div class="not-found-msg-root">
    <p class="not-found-msg-text">{{ t(`${props.i18nPrefix}.description`) }}</p>
    <RouterLink v-if="t(`${props.i18nPrefix}.goHome`)" to="/" class="not-found-msg-link">
      {{ t(`${props.i18nPrefix}.goHome`) }}
    </RouterLink>
  </div>
</template>
