<script setup lang="ts">
import { computed, useSlots } from "vue";

interface Props {
  as?: string;
  title?: string;
  subtitle?: string;
  flush?: boolean;
  compact?: boolean;
  elevated?: boolean;
  headerClass?: string;
  bodyClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  as: "section",
  title: "",
  subtitle: "",
  flush: false,
  compact: false,
  elevated: false,
  headerClass: "",
  bodyClass: ""
});

const slots = useSlots();
const hasHeader = computed(() => Boolean(props.title || props.subtitle || slots.header || slots.extra));
</script>

<template>
  <component
    :is="props.as"
    class="ti-card"
    :class="{
      'ti-card--flush': props.flush,
      'ti-card--compact': props.compact,
      'ti-card--elevated': props.elevated
    }"
  >
    <header v-if="hasHeader" class="ti-card__header" :class="props.headerClass">
      <slot name="header">
        <div class="ti-card__heading">
          <h2 v-if="props.title" class="ti-card__title">{{ props.title }}</h2>
          <p v-if="props.subtitle" class="ti-card__subtitle">{{ props.subtitle }}</p>
        </div>
        <div v-if="$slots.extra" class="ti-card__extra">
          <slot name="extra" />
        </div>
      </slot>
    </header>

    <div class="ti-card__body" :class="props.bodyClass">
      <slot />
    </div>

    <footer v-if="$slots.footer" class="ti-card__footer">
      <slot name="footer" />
    </footer>
  </component>
</template>

<style scoped>
.ti-card {
  background: var(--panel-bg);
  border: 1px solid var(--panel-border);
  border-radius: var(--panel-radius);
  box-shadow: var(--panel-shadow);
  overflow: hidden;
}

.ti-card--elevated {
  box-shadow: var(--surface-shadow-sm);
}

.ti-card__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--app-border-subtle);
  background: var(--panel-bg);
}

.ti-card__heading {
  min-width: 0;
}

.ti-card__title {
  margin: 0;
  color: var(--app-text);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.4;
}

.ti-card__subtitle {
  margin: 4px 0 0;
  color: var(--app-text-soft);
  font-size: 13px;
  line-height: 1.5;
}

.ti-card__extra {
  flex-shrink: 0;
}

.ti-card__body {
  padding: 16px;
}

.ti-card__footer {
  padding: 12px 16px 16px;
  border-top: 1px solid var(--app-border-subtle);
  background: var(--panel-bg);
}

.ti-card--compact .ti-card__header,
.ti-card--compact .ti-card__body,
.ti-card--compact .ti-card__footer {
  padding-left: 14px;
  padding-right: 14px;
}

.ti-card--compact .ti-card__header,
.ti-card--compact .ti-card__body {
  padding-top: 12px;
  padding-bottom: 12px;
}

.ti-card--flush .ti-card__body,
.ti-card--flush .ti-card__footer {
  padding: 0;
}
</style>
